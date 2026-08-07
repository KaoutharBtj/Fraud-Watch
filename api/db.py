import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from database import get_connection, get_cursor


def get_db():
    conn = get_connection()
    try:
        cur = get_cursor(conn)   # RealDictCursor — rows come back as dicts
        yield cur
    finally:
        conn.close()