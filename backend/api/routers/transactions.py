# api/routers/transactions.py
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from typing import List
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