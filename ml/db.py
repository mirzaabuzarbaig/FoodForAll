"""
ml/db.py
Shared MySQL connection — reads from your existing .env file.
"""

import os
import pymysql
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return pymysql.connect(
        host        = os.getenv('DB_HOST', 'localhost'),
        port        = int(os.getenv('DB_PORT', 3306)),   # ✅ was missing — Railway uses 37430
        user        = os.getenv('DB_USER', 'root'),
        password    = os.getenv('DB_PASSWORD', ''),
        database    = os.getenv('DB_NAME', ''),
        cursorclass = pymysql.cursors.DictCursor,
        connect_timeout = 10
    )

def query_df(sql, params=None):
    """Run a SQL query and return results as a pandas DataFrame."""
    conn = get_connection()
    try:
        df = pd.read_sql(sql, conn, params=params)
        return df
    finally:
        conn.close()