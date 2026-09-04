# api/routers/stats.py
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import APIRouter, Depends

from db import get_db
from models import StatsResponse, RiskDistribution, TrendPoint
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


@router.get("/stats/distribution", response_model=RiskDistribution)
def get_risk_distribution(cur=Depends(get_db)):
    """
    Transaction counts bucketed into 4 risk bands, for the risk-distribution
    chart. Bucketing happens in SQL — cheaper than fetching every row and
    counting in JavaScript.
    """
    cur.execute(
        """
        SELECT
            CASE
                WHEN ml_score >= 80 THEN 'critical'
                WHEN ml_score >= 50 THEN 'high'
                WHEN ml_score >= 25 THEN 'medium'
                ELSE 'low'
            END AS band,
            COUNT(*) AS count
        FROM fraud_decisions
        GROUP BY band
        """
    )
    counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for row in cur.fetchall():
        counts[row["band"]] = row["count"]

    return RiskDistribution(**counts)


@router.get("/stats/trend", response_model=list[TrendPoint])
def get_trend(days: int = 7, cur=Depends(get_db)):
    """
    Daily decision counts + average risk score, for the trend chart.
    Defaults to the last 7 days.
    """
    cur.execute(
        """
        SELECT
            DATE_TRUNC('day', created_at)::date AS day,
            COUNT(*) FILTER (WHERE final_decision = 'APPROVE') AS approved,
            COUNT(*) FILTER (WHERE final_decision = 'REVIEW')  AS review,
            COUNT(*) FILTER (WHERE final_decision = 'BLOCK')   AS blocked,
            AVG(ml_score) AS avg_score
        FROM fraud_decisions
        WHERE created_at >= NOW() - make_interval(days => %s)
        GROUP BY day
        ORDER BY day
        """,
        (days,),
    )
    return [
        TrendPoint(
            day=row["day"],
            approved=row["approved"],
            review=row["review"],
            blocked=row["blocked"],
            avg_score=round(float(row["avg_score"]), 2) if row["avg_score"] else 0.0,
        )
        for row in cur.fetchall()
    ]