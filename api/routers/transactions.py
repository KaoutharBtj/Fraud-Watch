# api/routers/transactions.py
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query

from db import get_db
from models import TransactionDecision
from auth import get_current_analyst

router = APIRouter(
    prefix="/transactions",
    tags=["transactions"],
    dependencies=[Depends(get_current_analyst)],  # every route below requires login
)


@router.get("/recent", response_model=List[TransactionDecision])
def get_recent_transactions(
    limit: int = Query(20, ge=1, le=100, description="Max transactions to return"),
    offset: int = Query(0, ge=0, description="Number of transactions to skip"),
    cur=Depends(get_db),
):
    """Most recent transactions, newest first. Used by the dashboard's main list."""
    cur.execute(
        """
        SELECT * FROM fraud_decisions
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
        """,
        (limit, offset),
    )
    return cur.fetchall()


@router.get("/{audit_id}", response_model=TransactionDecision)
def get_transaction(audit_id: str, cur=Depends(get_db)):
    """Full detail for one transaction, by its audit_id."""
    cur.execute("SELECT * FROM fraud_decisions WHERE audit_id = %s", (audit_id,))
    row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"Transaction '{audit_id}' not found")
    return row