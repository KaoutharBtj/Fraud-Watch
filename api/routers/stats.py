# api/routers/stats.py
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import APIRouter, Depends

from db import get_db
from models import StatsResponse
from auth import get_current_analyst

router = APIRouter(tags=["stats"], dependencies=[Depends(get_current_analyst)])


@router.get("/stats", response_model=StatsResponse)
def get_stats(cur=Depends(get_db)):
    """Summary counts for the dashboard overview page."""
    cur.execute("SELECT COUNT(*) AS total FROM fraud_decisions")
    total = cur.fetchone()["total"]

    cur.execute(
        """
        SELECT final_decision, COUNT(*) AS count
        FROM fraud_decisions
        GROUP BY final_decision
        """
    )
    counts = {row["final_decision"]: row["count"] for row in cur.fetchall()}

    cur.execute("SELECT AVG(ml_score) AS avg_score FROM fraud_decisions")
    avg_score = cur.fetchone()["avg_score"]

    approved = counts.get("APPROVE", 0)
    review = counts.get("REVIEW", 0)
    blocked = counts.get("BLOCK", 0)

    def pct(n: int) -> float:
        return round((n / total * 100), 2) if total else 0.0

    return StatsResponse(
        total_transactions=total,
        approved_count=approved,
        review_count=review,
        blocked_count=blocked,
        approved_pct=pct(approved),
        review_pct=pct(review),
        blocked_pct=pct(blocked),
        avg_ml_score=round(float(avg_score), 2) if avg_score is not None else 0.0,
    )