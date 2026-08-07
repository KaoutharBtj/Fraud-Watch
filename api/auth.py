# api/auth.py
# ─────────────────────────────────────────────────────────────────────────────
# Core authentication logic.
#
# Flow:
#   1. Analyst POSTs username+password to /auth/login
#   2. We verify the password against the bcrypt hash stored in `analysts`
#   3. If valid, we issue a JWT (a signed token containing the username +
#      an expiry time) — the analyst stores this and sends it on every
#      future request in the Authorization header: "Bearer <token>"
#   4. get_current_analyst() is a dependency every protected route uses —
#      it decodes the token, checks the signature + expiry, and looks up
#      the analyst. If anything's wrong, it raises 401 before the route
#      function ever runs.
#
# Passwords are NEVER stored or compared in plain text — only bcrypt hashes.
# ─────────────────────────────────────────────────────────────────────────────

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from db import get_db

# ── Config ─────────────────────────────────────────────────────────────────

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

if not SECRET_KEY:
    raise RuntimeError(
        "Missing JWT_SECRET_KEY environment variable.\n"
        "Generate one with:\n"
        '  python -c "import secrets; print(secrets.token_hex(32))"\n'
        "then add it to your .env file as JWT_SECRET_KEY=<the value>"
    )

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# tokenUrl tells FastAPI's auto-docs where the "Authorize" button should
# send username/password to get a token — doesn't affect runtime behavior.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Password hashing ──────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ── Token creation ────────────────────────────────────────────────────────────

def create_access_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": username, "exp": expire}   # "sub" = JWT standard claim for subject
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── Login check ────────────────────────────────────────────────────────────────

def authenticate_analyst(username: str, password: str, cur) -> Optional[dict]:
    cur.execute("SELECT * FROM analysts WHERE username = %s", (username,))
    analyst = cur.fetchone()
    if analyst is None:
        return None
    if not verify_password(password, analyst["hashed_password"]):
        return None
    return analyst


# ── Dependency used by every protected route ──────────────────────────────────

def get_current_analyst(token: str = Depends(oauth2_scheme), cur=Depends(get_db)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    cur.execute(
        "SELECT id, username, created_at FROM analysts WHERE username = %s",
        (username,),
    )
    analyst = cur.fetchone()
    if analyst is None:
        raise credentials_exception
    return analyst