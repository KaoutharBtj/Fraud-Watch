# api/main.py
import sys
import os

# api/ itself on the path — so `from routers.transactions import router` works
sys.path.insert(0, os.path.dirname(__file__))
# project root on the path — so `database.py` is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from routers import transactions, customers, stats, decisions, auth, agent

app = FastAPI(
    title="Fraud Detection Dashboard API",
    description="Read-only reporting API over the fraud-detection Postgres DB.",
    version="0.2.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────
# Browsers block cross-origin requests by default. Your React dev server
# (localhost:5173 or :3000) and this API (localhost:8001) are different
# origins from a browser's point of view, so without this, fetch() calls
# from the frontend would fail silently with a CORS error in the console.
_cors_origins = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["GET", "POST", "PATCH"],   # PATCH needed for analyst decision overrides
    allow_headers=["*"],
)

# ── Wire up routers ──────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(customers.router)
app.include_router(stats.router)
app.include_router(decisions.router)
app.include_router(agent.router)


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
        db_status = f"error: {e}"

    return HealthResponse(status="ok", database=db_status)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)