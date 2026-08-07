# api/routers/auth.py
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from db import get_db
from auth import authenticate_analyst, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), cur=Depends(get_db)):
    """
    OAuth2PasswordRequestForm expects form data (not JSON): username + password.
    This matches what /docs' "Authorize" button sends automatically, and what
    the frontend's login form will send too.
    """
    analyst = authenticate_analyst(form_data.username, form_data.password, cur)
    if analyst is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(analyst["username"])
    return {"access_token": token, "token_type": "bearer"}