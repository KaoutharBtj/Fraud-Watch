# api/rate_limit.py
# ─────────────────────────────────────────────────────────────────────────────
# Single shared Limiter instance. Lives in its own module (not in main.py)
# so routers can import and use it (`@limiter.limit(...)`) without a
# circular import back into main.py.
# ─────────────────────────────────────────────────────────────────────────────
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)