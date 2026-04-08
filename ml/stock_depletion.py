"""
ml/stock_depletion.py
Module 2 — Stock Depletion Prediction
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from ml.db import query_df


def get_stock_depletion_alerts(threshold_days=30):
    stock_sql = """
        SELECT
            id,
            item_name,
            total_quantity,
            distributed_quantity,
            alert_threshold,
            per_person_quota,
            unit
        FROM stock
        ORDER BY item_name
    """
    stock_df = query_df(stock_sql)

    if stock_df.empty:
        return { 'alerts': [], 'safe': [], 'message': 'No stock data found' }

    # Convert all numeric columns in Python
    stock_df['id']                   = pd.to_numeric(stock_df['id'],                   errors='coerce').fillna(0).astype(int)
    stock_df['total_quantity']       = pd.to_numeric(stock_df['total_quantity'],       errors='coerce').fillna(0)
    stock_df['distributed_quantity'] = pd.to_numeric(stock_df['distributed_quantity'], errors='coerce').fillna(0)
    stock_df['alert_threshold']      = pd.to_numeric(stock_df['alert_threshold'],      errors='coerce').fillna(0)
    stock_df['remaining_qty']        = stock_df['total_quantity'] - stock_df['distributed_quantity']

    usage_sql = """
        SELECT
            t.stock_id,
            DATE(t.issued_at) AS issue_date,
            SUM(t.quantity_issued) AS daily_qty
        FROM transactions t
        WHERE t.issued_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY t.stock_id, DATE(t.issued_at)
    """
    usage_df = query_df(usage_sql)

    if not usage_df.empty:
        usage_df['stock_id']  = pd.to_numeric(usage_df['stock_id'],  errors='coerce')
        usage_df['daily_qty'] = pd.to_numeric(usage_df['daily_qty'], errors='coerce').fillna(0)

    alerts = []
    safe   = []

    for _, row in stock_df.iterrows():
        remaining = float(row['remaining_qty'])
        item_id   = int(row['id'])

        item_usage = usage_df[usage_df['stock_id'] == item_id] if not usage_df.empty else pd.DataFrame()
        if not item_usage.empty:
            avg_daily = float(item_usage['daily_qty'].mean())
        else:
            avg_daily = float(row['distributed_quantity']) / 30

        if avg_daily > 0:
            days_until_empty = remaining / avg_daily
        else:
            days_until_empty = 999

        depletion_date = (
            datetime.now() + timedelta(days=days_until_empty)
        ).strftime('%Y-%m-%d') if days_until_empty < 999 else 'N/A'

        entry = {
            'item_id':          item_id,
            'item_name':        str(row['item_name']),
            'unit':             str(row['unit']),
            'remaining_qty':    round(remaining, 2),
            'avg_daily_usage':  round(avg_daily, 2),
            'days_until_empty': round(days_until_empty, 1),
            'depletion_date':   depletion_date,
            'alert_threshold':  float(row['alert_threshold']),
            'urgency':          _urgency(days_until_empty)
        }

        if days_until_empty <= threshold_days:
            alerts.append(entry)
        else:
            safe.append(entry)

    alerts.sort(key=lambda x: x['days_until_empty'])

    return {
        'alerts':         alerts,
        'safe':           safe,
        'total_items':    len(stock_df),
        'alert_count':    len(alerts),
        'threshold_days': threshold_days,
        'generated_at':   datetime.now().isoformat()
    }


def _urgency(days):
    if days <= 7:
        return 'critical'
    elif days <= 15:
        return 'high'
    elif days <= 30:
        return 'medium'
    return 'low'