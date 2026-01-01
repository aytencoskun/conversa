from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])

class UserLogin(BaseModel):
    email: str
    password: str

class UserSignup(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    # TODO: Integrate Firebase Admin SDK to verify token or handle custom auth
    # For now, this is a stub
    if user.email == "error@example.com":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    return {"access_token": "mock_token_123", "token_type": "bearer"}

@router.post("/signup", response_model=Token)
async def signup(user: UserSignup):
    # TODO: Create user in DB/Firebase
    return {"access_token": "mock_token_123", "token_type": "bearer"}

@router.post("/refresh-token")
async def refresh_token():
    return {"message": "Token refreshed"}
