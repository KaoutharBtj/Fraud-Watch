from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel


class CustomerProfile(BaseModel):
    customer_id: int
    avg_amount: float
    usual_country: str
    usual_device: str
    active_start: int
    active_end: int


class TransactionDecision(BaseModel):
    audit_id: str
    created_at: datetime

    # Raw transaction fields
    customer_id: int
    amount: float
    country: str
    device: str
    hour: int
    tx_last_hour: int

    # Engineered features
    amount_ratio: float
    country_changed: bool
    device_changed: bool
    outside_hours: bool
    low_amount_probe: bool
    amount_escalating: bool
    small_tx_count: int

    # ML + LLM output
    ml_score: float
    shap_values: Optional[dict[str, Any]] = None
    llm_reasoning: Optional[str] = None
    top_signals: Optional[list[Any]] = None
    final_decision: str
    action_taken: Optional[str] = None


class StatsResponse(BaseModel):
    total_transactions: int
    approved_count: int
    review_count: int
    blocked_count: int
    approved_pct: float
    review_pct: float
    blocked_pct: float
    avg_ml_score: float