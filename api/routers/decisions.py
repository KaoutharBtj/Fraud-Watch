# api/routers/decisions.py
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from db import get_db
from models import TransactionDecision
from auth import get_current_analyst

router = APIRouter(
    prefix="/decisions",
    tags=["decisions"],
    dependencies=[Depends(get_current_analyst)],
)

_VALID_DECISIONS = ("BLOCK", "REVIEW", "APPROVE")


@router.get("", response_model=List[TransactionDecision])
def get_decisions(
    decision: Optional[str] = Query(
        None, description="Filter by BLOCK, REVIEW, or APPROVE (omit for all)"
    ),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    cur=Depends(get_db),
):
    """Fraud decision history, optionally filtered by decision type."""
    if decision is not None:
        decision = decision.upper()
        if decision not in _VALID_DECISIONS:
            raise HTTPException(
                status_code=400,
                detail=f"decision must be one of {_VALID_DECISIONS}, got '{decision}'",
            )
        cur.execute(
            """
            SELECT * FROM fraud_decisions
            WHERE final_decision = %s
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
            """,
            (decision, limit, offset),
        )
    else:
        cur.execute(
            """
            SELECT * FROM fraud_decisions
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
            """,
            (limit, offset),
        )
    return cur.fetchall()