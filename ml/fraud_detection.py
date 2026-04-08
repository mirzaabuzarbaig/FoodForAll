"""
ml/fraud_detection.py
Module 3 — Fraud Detection
"""

import pandas as pd
import numpy as np
from datetime import datetime
from ml.db import query_df


def detect_fraud():
    sql = """
        SELECT
            t.id              AS transaction_id,
            t.ration_card_no,
            t.beneficiary_name,
            t.quantity_issued,
            t.issued_at,
            t.cycle_id,
            s.item_name,
            s.per_person_quota,
            s.unit,
            COALESCE(c.family_members, 1) AS family_members,
            (s.per_person_quota * COALESCE(c.family_members, 1)) AS allowed_qty
        FROM transactions t
        JOIN stock s ON t.stock_id = s.id
        LEFT JOIN customers c ON t.ration_card_no = c.ration_card_no
        ORDER BY t.issued_at DESC
    """
    df = query_df(sql)

    if df.empty:
        return { 'flagged': [], 'summary': 'No transaction data found' }

    # Convert all numeric columns
    df['quantity_issued'] = pd.to_numeric(df['quantity_issued'], errors='coerce').fillna(0)
    df['allowed_qty']     = pd.to_numeric(df['allowed_qty'],     errors='coerce').fillna(1)
    df['family_members']  = pd.to_numeric(df['family_members'],  errors='coerce').fillna(1)
    df['per_person_quota']= pd.to_numeric(df['per_person_quota'],errors='coerce').fillna(0)
    df['transaction_id']  = pd.to_numeric(df['transaction_id'],  errors='coerce').fillna(0).astype(int)

    flagged = []

    iso_flagged  = _isolation_forest_flags(df)
    z_flagged    = _zscore_flags(df)
    rule_flagged = df[
        (df['per_person_quota'] > 0) &
        (df['quantity_issued'] > df['allowed_qty'])
    ].copy()

    all_ids = set(iso_flagged) | set(z_flagged) | set(rule_flagged['transaction_id'].tolist())

    for txn_id in all_ids:
        row = df[df['transaction_id'] == txn_id]
        if row.empty:
            continue
        row = row.iloc[0]

        reasons = []
        if txn_id in iso_flagged:
            reasons.append('Isolation Forest anomaly')
        if txn_id in z_flagged:
            reasons.append('Z-Score outlier (>2.5σ)')
        if txn_id in rule_flagged['transaction_id'].values:
            reasons.append(f"Exceeds quota ({row['quantity_issued']} > {row['allowed_qty']})")

        flagged.append({
            'transaction_id':  int(txn_id),
            'ration_card_no':  row['ration_card_no'],
            'beneficiary_name':row['beneficiary_name'],
            'item_name':       row['item_name'],
            'unit':            row['unit'],
            'quantity_issued': float(row['quantity_issued']),
            'allowed_qty':     float(row['allowed_qty']),
            'family_members':  int(row['family_members']),
            'issued_at':       str(row['issued_at']),
            'cycle_id':        int(row['cycle_id']) if row['cycle_id'] else None,
            'flag_reasons':    reasons,
            'risk_level':      'high' if len(reasons) >= 2 else 'medium'
        })

    flagged.sort(key=lambda x: len(x['flag_reasons']), reverse=True)

    return {
        'flagged':       flagged,
        'total_checked': len(df),
        'total_flagged': len(flagged),
        'generated_at':  datetime.now().isoformat()
    }


def _isolation_forest_flags(df):
    from sklearn.ensemble import IsolationForest
    flagged_ids = []
    for item_name, group in df.groupby('item_name'):
        if len(group) < 5:
            continue
        X = group[['quantity_issued', 'family_members']].values.astype(float)
        clf   = IsolationForest(contamination=0.1, random_state=42)
        preds = clf.fit_predict(X)
        anomaly_idx = group[preds == -1]['transaction_id'].tolist()
        flagged_ids.extend(anomaly_idx)
    return set(flagged_ids)


def _zscore_flags(df):
    flagged_ids = []
    for item_name, group in df.groupby('item_name'):
        if len(group) < 3:
            continue
        mean = group['quantity_issued'].mean()
        std  = group['quantity_issued'].std()
        if std == 0:
            continue
        z_scores = (group['quantity_issued'] - mean) / std
        outliers = group[z_scores > 2.5]['transaction_id'].tolist()
        flagged_ids.extend(outliers)
    return set(flagged_ids)