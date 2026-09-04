# api/main.py
import sys
import os

# api/ itself on the path — so `from routers.transactions import router` works
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
# project root on the path — so `database.py` is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import logging

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
from dotenv import load_dotenv
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

load_dotenv()

from routers import transactions, customers, stats, decisions, auth, agent
from rate_limit import limiter

# ── Logging ────────────────────────────────────────────────────────────────
# Structured-ish logging to stdout. In production this gets picked up by
# whatever the deployment platform uses to collect logs (CloudWatch, GCP
# Logging, a sidecar, etc.) — the app itself never needs to know where logs
# end up, it just writes to stdout/stderr.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("fraud_watch.api")

app = FastAPI(
    title="Fraud Detection Dashboard API",
    description="Read-only reporting API over the fraud-detection Postgres DB.",
    version="0.2.0",
)

# ── Rate limiting ────────────────────────────────────────────────────────────
# Protects endpoints (mainly /auth/login) from brute-force attempts: without
# this, nothing stops someone from trying thousands of passwords per second
# against a known username. The Limiter instance itself lives in
# rate_limit.py so routers can import it too, without a circular import.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ───────────────────────────────────────────────────────────────────
# Browsers block cross-origin requests by default. Your React dev server
# (localhost:5173 or :3000) and this API (localhost:8001) are different
# origins from a browser's point of view, so without this, fetch() calls
# from the frontend would fail silently with a CORS error in the console.
#
# In production, CORS_ORIGINS must be set to the real deployed frontend
# URL(s) only — the localhost default here is a dev convenience, never a
# production value.
_cors_origins = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)

# ── Wire up routers ──────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(customers.router)
app.include_router(stats.router)
app.include_router(decisions.router)
app.include_router(agent.router)


# ── Global error handling ───────────────────────────────────────────────────
# Without this, an unhandled exception anywhere in a route would let FastAPI's
# default behavior leak internal details (stack trace, file paths, sometimes
# even fragments of SQL) back to the client in the response body. That's a
# real information-disclosure risk in production. Here we log the full detail
# server-side (so it's still debuggable) but only ever send the client a
# generic, safe message.
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Pydantic validation errors are safe to return as-is — they only ever
    # describe which field of the *client's own request* was invalid, no
    # internal details.
    logger.info(f"Validation error on {request.method} {request.url.path}: {exc.errors()}")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


class HealthResponse(BaseModel):
    status: str
    database: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    db_status = "ok"
    try:
        from database import get_connection

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
    except Exception as e:
        logger.error(f"Health check DB connection failed: {e}")
        db_status = "error"  # never echo the raw exception (may contain host/creds hints)

    return HealthResponse(status="ok", database=db_status)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)