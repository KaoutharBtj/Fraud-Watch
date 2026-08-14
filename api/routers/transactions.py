# api/routers/transactions.py
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query

from db import get_db
from models import TransactionDecision, DecisionUpdate
from auth import get_current_analyst

router = APIRouter(
    prefix="/transactions",
    tags=["transactions"],
    dependencies=[Depends(get_current_analyst)],  # every route below requires login
)

# Only these de-escalation transitions are allowed — an analyst reviewing a
# flagged transaction can downgrade it one step, never jump arbitrarily or
# escalate through this endpoint.
ALLOWED_TRANSITIONS = {
    "BLOCK": "REVIEW",
    "REVIEW": "APPROVE",
}


@router.get("/recent", response_model=List[TransactionDecision])
def get_recent_transactions(
    limit: int = Query(20, ge=1, le=100, description="Max transactions to return"),
    offset: int = Query(0, ge=0, description="Number of transactions to skip"),
    customer_id: Optional[int] = Query(None, description="Filter by exact customer_id"),
    country: Optional[str] = Query(None, description="Filter by country code (exact match)"),
    device: Optional[str] = Query(None, description="Filter by device (exact match)"),
    min_amount: Optional[float] = Query(None, ge=0, description="Minimum transaction amount"),
    max_amount: Optional[float] = Query(None, ge=0, description="Maximum transaction amount"),
    min_risk: Optional[float] = Query(None, ge=0, le=100, description="Minimum ml_score"),
    max_risk: Optional[float] = Query(None, ge=0, le=100, description="Maximum ml_score"),
    date_from: Optional[datetime] = Query(None, description="Only transactions at/after this time"),
    date_to: Optional[datetime] = Query(None, description="Only transactions at/before this time"),
    cur=Depends(get_db),
):
    """
    Most recent transactions, newest first, with optional filters.
    All filters are combined with AND and built as a parameterized WHERE
    clause — never string-interpolated — so this stays safe from SQL
    injection while still letting the analyst narrow the list down by
    any combination of customer, amount, country, device, risk, or time.
    """
    conditions = []
    params = []

    if customer_id is not None:
        conditions.append("customer_id = %s")
        params.append(customer_id)
    if country:
        conditions.append("country = %s")
        params.append(country)
    if device:
        conditions.append("device = %s")
        params.append(device)
    if min_amount is not None:
        conditions.append("amount >= %s")
        params.append(min_amount)
    if max_amount is not None:
        conditions.append("amount <= %s")
        params.append(max_amount)
    if min_risk is not None:
        conditions.append("ml_score >= %s")
        params.append(min_risk)
    if max_risk is not None:
        conditions.append("ml_score <= %s")
        params.append(max_risk)
    if date_from is not None:
        conditions.append("created_at >= %s")
        params.append(date_from)
    if date_to is not None:
        conditions.append("created_at <= %s")
        params.append(date_to)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    cur.execute(
        f"""
        SELECT * FROM fraud_decisions
        {where_clause}
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
        """,
        (*params, limit, offset),
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


@router.patch("/{audit_id}/decision", response_model=TransactionDecision)
def update_decision(
    audit_id: str,
    payload: DecisionUpdate,
    cur=Depends(get_db),
    analyst=Depends(get_current_analyst),
):
    """
    Analyst override: downgrade a decision one step (BLOCK -> REVIEW,
    REVIEW -> APPROVE). The original decision is preserved in
    previous_decision, never overwritten silently.
    """
    new_decision = payload.new_decision.upper()

    cur.execute("SELECT final_decision FROM fraud_decisions WHERE audit_id = %s", (audit_id,))
    row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"Transaction '{audit_id}' not found")

    current_decision = row["final_decision"]
    expected_next = ALLOWED_TRANSITIONS.get(current_decision)

    if expected_next != new_decision:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot change decision from {current_decision} to {new_decision}. "
                f"Only {current_decision} -> {expected_next} is allowed."
                if expected_next
                else f"{current_decision} cannot be changed further."
            ),
        )

    cur.execute(
        """
        UPDATE fraud_decisions
        SET previous_decision = final_decision,
            final_decision = %s,
            decision_updated_by = %s,
            decision_updated_at = NOW()
        WHERE audit_id = %s
        RETURNING *
        """,
        (new_decision, analyst["username"], audit_id),
    )
    updated = cur.fetchone()
    cur.connection.commit()  # this endpoint writes, so it must commit explicitly

    return updated