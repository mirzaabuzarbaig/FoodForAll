"""
ml/duplicate_detect.py
Module 4 — Duplicate Transaction Detection

Detects if the same family tried to collect rations twice
using different ration card numbers.

Algorithm:
  - Name similarity matching (fuzzy string match via difflib)
  - Same cycle_id + same stock_id + similar beneficiary name
  - Same family_members count in same village/area
"""

import pandas as pd
import numpy as np
from datetime import datetime
from difflib import SequenceMatcher
from ml.db import query_df


def detect_duplicates():
    # ── 1. Load transactions with customer info ───────────────
    sql = """
        SELECT
            t.id               AS transaction_id,
            t.ration_card_no,
            t.beneficiary_name,
            t.quantity_issued,
            t.issued_at,
            t.cycle_id,
            t.stock_id,
            s.item_name,
            COALESCE(c.family_members, 1) AS family_members,
            COALESCE(c.address, '')        AS address
        FROM transactions t
        JOIN stock s ON t.stock_id = s.id
        LEFT JOIN customers c ON t.ration_card_no = c.ration_card_no
        ORDER BY t.cycle_id, t.stock_id, t.beneficiary_name
    """
    df = query_df(sql)

    if df.empty:
        return { 'duplicates': [], 'summary': 'No transaction data found' }

    df['beneficiary_name'] = df['beneficiary_name'].str.strip().str.lower()
    duplicates = []

    # ── 2. Group by cycle + stock item ───────────────────────
    for (cycle_id, stock_id), group in df.groupby(['cycle_id', 'stock_id']):
        if len(group) < 2:
            continue

        rows = group.reset_index(drop=True)

        # Compare every pair in the group
        for i in range(len(rows)):
            for j in range(i + 1, len(rows)):
                r1 = rows.iloc[i]
                r2 = rows.iloc[j]

                # Skip same card — that's handled by checkAlreadyIssued in Node.js
                if r1['ration_card_no'] == r2['ration_card_no']:
                    continue

                score = _similarity_score(r1, r2)
                if score >= 0.75:
                    duplicates.append({
                        'transaction_1': {
                            'transaction_id':  int(r1['transaction_id']),
                            'ration_card_no':  r1['ration_card_no'],
                            'beneficiary_name':r1['beneficiary_name'].title(),
                            'quantity_issued': float(r1['quantity_issued']),
                            'issued_at':       str(r1['issued_at'])
                        },
                        'transaction_2': {
                            'transaction_id':  int(r2['transaction_id']),
                            'ration_card_no':  r2['ration_card_no'],
                            'beneficiary_name':r2['beneficiary_name'].title(),
                            'quantity_issued': float(r2['quantity_issued']),
                            'issued_at':       str(r2['issued_at'])
                        },
                        'item_name':        r1['item_name'],
                        'cycle_id':         int(cycle_id) if cycle_id else None,
                        'similarity_score': round(score, 2),
                        'match_reasons':    _match_reasons(r1, r2),
                        'risk_level':       'high' if score >= 0.9 else 'medium'
                    })

    # Deduplicate pairs
    seen = set()
    unique_duplicates = []
    for d in duplicates:
        key = tuple(sorted([
            d['transaction_1']['transaction_id'],
            d['transaction_2']['transaction_id']
        ]))
        if key not in seen:
            seen.add(key)
            unique_duplicates.append(d)

    unique_duplicates.sort(key=lambda x: x['similarity_score'], reverse=True)

    return {
        'duplicates':    unique_duplicates,
        'total_checked': len(df),
        'total_flagged': len(unique_duplicates),
        'generated_at':  datetime.now().isoformat()
    }


def _name_similarity(name1, name2):
    return SequenceMatcher(None, name1, name2).ratio()


def _similarity_score(r1, r2):
    """Composite similarity score between two transactions."""
    score = 0.0

    # Name similarity (weight: 50%)
    name_sim = _name_similarity(
        str(r1['beneficiary_name']),
        str(r2['beneficiary_name'])
    )
    score += name_sim * 0.5

    # Same family size (weight: 30%)
    if int(r1['family_members']) == int(r2['family_members']):
        score += 0.3

    # Similar quantity issued (weight: 20%)
    q1, q2 = float(r1['quantity_issued']), float(r2['quantity_issued'])
    if max(q1, q2) > 0:
        qty_sim = 1 - abs(q1 - q2) / max(q1, q2)
        score += qty_sim * 0.2

    return score


def _match_reasons(r1, r2):
    reasons = []
    name_sim = _name_similarity(
        str(r1['beneficiary_name']),
        str(r2['beneficiary_name'])
    )
    if name_sim > 0.8:
        reasons.append(f'Similar names ({round(name_sim*100)}% match)')
    if int(r1['family_members']) == int(r2['family_members']):
        reasons.append(f"Same family size ({r1['family_members']} members)")
    q1, q2 = float(r1['quantity_issued']), float(r2['quantity_issued'])
    if abs(q1 - q2) / max(q1, q2, 1) < 0.1:
        reasons.append('Nearly identical quantity collected')
    return reasons
