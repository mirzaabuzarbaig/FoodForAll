"""
ml/demand_forecast.py
Module 1 — Demand Forecasting
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from ml.db import query_df


def get_demand_forecast(commodity='all'):
    sql = """
        SELECT
            t.issued_at,
            t.quantity_issued,
            s.item_name
        FROM transactions t
        JOIN stock s ON t.stock_id = s.id
        ORDER BY t.issued_at ASC
    """
    df = query_df(sql)

    if df.empty:
        return _mock_forecast(commodity)

    # Convert columns to correct types
    df['quantity_issued'] = pd.to_numeric(df['quantity_issued'], errors='coerce').fillna(0)
    df['issued_at']       = pd.to_datetime(df['issued_at'].astype(str), errors='coerce')
    df = df.dropna(subset=['issued_at'])
    df['month'] = df['issued_at'].dt.to_period('M')

    if commodity != 'all':
        df = df[df['item_name'].str.lower() == commodity.lower()]
        if df.empty:
            return { 'error': f'No data found for commodity: {commodity}' }

    results = []
    for item_name, group in df.groupby('item_name'):
        monthly = (
            group.groupby('month')['quantity_issued']
            .sum()
            .reset_index()
        )
        monthly['month_num'] = range(len(monthly))
        forecast_qty = _forecast(monthly)

        results.append({
            'item_name':      item_name,
            'forecast_qty':   round(float(forecast_qty), 2),
            'forecast_month': _next_month_label(),
            'history_months': len(monthly),
            'avg_monthly':    round(float(monthly['quantity_issued'].mean()), 2),
            'trend':          _trend_label(monthly['quantity_issued'].values),
            'algorithm':      'ARIMA' if len(monthly) >= 6 else 'Linear Regression'
        })

    return {
        'forecasts':    results,
        'generated_at': datetime.now().isoformat()
    }


def _forecast(monthly_df):
    qty = monthly_df['quantity_issued'].values

    if len(qty) >= 6:
        try:
            from statsmodels.tsa.arima.model import ARIMA
            model  = ARIMA(qty, order=(1, 1, 1))
            fitted = model.fit()
            return max(0, fitted.forecast(steps=1)[0])
        except Exception:
            pass

    X = monthly_df['month_num'].values.reshape(-1, 1)
    y = qty
    from sklearn.linear_model import LinearRegression
    model = LinearRegression().fit(X, y)
    next_x = np.array([[len(qty)]])
    return max(0, model.predict(next_x)[0])


def _trend_label(values):
    if len(values) < 2:
        return 'stable'
    diff = values[-1] - values[0]
    if diff > values[0] * 0.1:
        return 'increasing'
    elif diff < -values[0] * 0.1:
        return 'decreasing'
    return 'stable'


def _next_month_label():
    next_month = datetime.now().replace(day=1) + timedelta(days=32)
    return next_month.strftime('%B %Y')


def _mock_forecast(commodity):
    items = ['Rice', 'Wheat', 'Sugar'] if commodity == 'all' else [commodity.title()]
    return {
        'forecasts': [
            {
                'item_name':      item,
                'forecast_qty':   round(np.random.uniform(500, 2000), 2),
                'forecast_month': _next_month_label(),
                'history_months': 0,
                'avg_monthly':    0,
                'trend':          'stable',
                'algorithm':      'No data — sample output',
                'note':           'Add transaction data for real predictions'
            }
            for item in items
        ],
        'generated_at': datetime.now().isoformat()
    }