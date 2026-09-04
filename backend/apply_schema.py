# apply_schema.py
# ─────────────────────────────────────────────────────────────────────────────
# One-off helper to (re)apply init.sql without needing the `psql` CLI tool
# on PATH. Uses the same database.py connection config your app already
# uses (reads DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD from .env), so if
# the app connects fine, this will too.
#
# Safe to re-run any time — every statement in init.sql uses
# "CREATE TABLE IF NOT EXISTS" / "CREATE INDEX IF NOT EXISTS", so existing
# tables and data are left untouched; only missing tables/indexes get added.
#
# Usage:
#   python apply_schema.py
# ─────────────────────────────────────────────────────────────────────────────

from database import get_connection

with open("init.sql", "r", encoding="utf-8") as f:
    sql = f.read()

conn = get_connection()
try:
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print("✅ Schema applied successfully.")
except Exception as e:
    conn.rollback()
    print(f"❌ Failed to apply schema: {e}")
    raise
finally:
    conn.close()