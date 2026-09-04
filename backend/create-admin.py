# create_admin.py
# ─────────────────────────────────────────────────────────────────────────────
# Run this manually to create an analyst login account. There is no public
# signup endpoint on purpose — only people you personally run this for get
# access to the dashboard.
#
# Usage:
#   python create_admin.py
# ─────────────────────────────────────────────────────────────────────────────

import sys
import os
import getpass

sys.path.insert(0, os.path.dirname(__file__))
from database import get_connection

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "api"))
from auth import hash_password


def main():
    username = input("New analyst username: ").strip()
    password = getpass.getpass("New analyst password: ")   # doesn't echo to terminal
    confirm = getpass.getpass("Confirm password: ")

    if password != confirm:
        print("Passwords don't match. Aborting.")
        return

    if len(password) < 8:
        print("Password should be at least 8 characters. Aborting.")
        return

    hashed = hash_password(password)

    with get_connection() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(
                    "INSERT INTO analysts (username, hashed_password) VALUES (%s, %s)",
                    (username, hashed),
                )
                conn.commit()
                print(f"Analyst '{username}' created successfully.")
            except Exception as e:
                conn.rollback()
                print(f"Failed to create analyst: {e}")


if __name__ == "__main__":
    main()