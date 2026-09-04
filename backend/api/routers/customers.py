# api/routers/customers.py
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import APIRouter, Depends, HTTPException

from db import get_db
from models import CustomerProfile
from auth import get_current_analyst

router = APIRouter(
    prefix="/customers",
    tags=["customers"],
    dependencies=[Depends(get_current_analyst)],
)


@router.get("/{customer_id}", response_model=CustomerProfile)
def get_customer(customer_id: int, cur=Depends(get_db)):
    """Customer profile — used by the dashboard's customer detail view."""
    cur.execute("SELECT * FROM customers WHERE customer_id = %s", (customer_id,))
    row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")
    return row