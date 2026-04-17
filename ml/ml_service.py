"""
Smart Ration Shop - ML Microservice
Runs on port 5001, called by your Node.js server

Install dependencies:
  pip install flask flask-cors pandas numpy scikit-learn statsmodels pymysql python-dotenv

Run:
  python ml_service.py
"""

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv


load_dotenv()

app = Flask(__name__)
CORS(app)

from ml.demand_forecast  import get_demand_forecast
from ml.stock_depletion  import get_stock_depletion_alerts
from ml.fraud_detection  import detect_fraud
from ml.duplicate_detect import detect_duplicates

# ── Health check ─────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ML service running', 'version': '1.0' })

# ── Module 1: Demand Forecast ────────────────────────────────
@app.route('/api/ml/demand-forecast', methods=['GET'])
def demand_forecast():
    """
    Predicts how much Rice, Wheat, Sugar will be needed next month.
    Query param: ?commodity=rice  (or wheat / sugar / all)
    """
    try:
        commodity = request.args.get('commodity', 'all')
        result = get_demand_forecast(commodity)
        return jsonify({ 'success': True, 'data': result })
    except Exception as e:
        return jsonify({ 'success': False, 'error': str(e) }), 500

# ── Module 2: Stock Depletion Alert ──────────────────────────
@app.route('/api/ml/stock-depletion', methods=['GET'])
def stock_depletion():
    """
    Predicts when each stock item will run out based on usage rate.
    Returns items running out within threshold days (default 30).
    """
    try:
        threshold_days = int(request.args.get('days', 30))
        result = get_stock_depletion_alerts(threshold_days)
        return jsonify({ 'success': True, 'data': result })
    except Exception as e:
        return jsonify({ 'success': False, 'error': str(e) }), 500

# ── Module 3: Fraud Detection ────────────────────────────────
@app.route('/api/ml/fraud-detect', methods=['GET'])
def fraud_detect():
    """
    Flags ration cards that collected unusually high quantity
    using Isolation Forest + Z-Score anomaly detection.
    """
    try:
        result = detect_fraud()
        return jsonify({ 'success': True, 'data': result })
    except Exception as e:
        return jsonify({ 'success': False, 'error': str(e) }), 500

# ── Module 4: Duplicate Detection ───────────────────────────
@app.route('/api/ml/duplicate-detect', methods=['GET'])
def duplicate_detect():
    """
    Detects if the same family tried to collect twice
    using different card numbers (name + family_members matching).
    """
    try:
        result = detect_duplicates()
        return jsonify({ 'success': True, 'data': result })
    except Exception as e:
        return jsonify({ 'success': False, 'error': str(e) }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5001)), debug=False)
