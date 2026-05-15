"""
Auth router — email/password (JWT) + Firebase (Google / Apple).

Endpoints:
  POST /auth/signup          — email+password ile kayıt
  POST /auth/login           — email+password ile giriş → JWT
  POST /auth/firebase-login  — Firebase ID token → JWT (Google/Apple)
  GET  /auth/me              — mevcut kullanıcı bilgisi
"""
from __future__ import annotations

import os
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.core.database import get_users_collection
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class FirebaseLoginRequest(BaseModel):
    """Frontend Firebase ID Token (Google or Apple sign-in)."""
    id_token: str
    display_name: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str | None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _serialize_user(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    doc.pop("password_hash", None)  # never leak the hash
    return doc


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest):
    """Create a new account with email and password."""
    users = get_users_collection()

    # Check duplicate
    existing = await users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    doc = {
        "email": body.email,
        "password_hash": hash_password(body.password),
        "display_name": body.display_name or body.email.split("@")[0],
        "provider": "email",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await users.insert_one(doc)
    user_id = str(result.inserted_id)
    token = create_access_token(user_id=user_id, email=body.email)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    """Login with email and password — returns a JWT."""
    users = get_users_collection()
    doc = await users.find_one({"email": body.email})

    if not doc or not verify_password(body.password, doc.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    user_id = str(doc["_id"])
    token = create_access_token(user_id=user_id, email=body.email)
    return TokenResponse(access_token=token)


@router.post("/firebase-login", response_model=TokenResponse)
async def firebase_login(body: FirebaseLoginRequest):
    """
    Verify a Firebase ID token (obtained from Google / Apple sign-in on the client)
    and return a Conversa JWT.

    Requires FIREBASE_SERVICE_ACCOUNT env var pointing to the service-account JSON file.
    Falls back to a lenient mode if Firebase Admin is not configured (dev only).
    """
    firebase_service_account = os.getenv("FIREBASE_SERVICE_ACCOUNT", "")

    if not firebase_service_account or not os.path.exists(firebase_service_account):
        # ── DEV FALLBACK: Firebase Admin not configured ──────────────────────
        # In production, remove this block and always verify the token.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Firebase Admin SDK is not configured. "
                "Set FIREBASE_SERVICE_ACCOUNT in .env and place the service-account JSON file."
            ),
        )

    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth, credentials

        if not firebase_admin._apps:
            cred = credentials.Certificate(firebase_service_account)
            firebase_admin.initialize_app(cred)

        decoded = firebase_admin.auth.verify_id_token(body.id_token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Firebase token verification failed: {e}",
        )

    firebase_uid = decoded["uid"]
    email = decoded.get("email", f"{firebase_uid}@firebase.local")
    display_name = body.display_name or decoded.get("name") or email.split("@")[0]

    users = get_users_collection()
    doc = await users.find_one({"firebase_uid": firebase_uid})

    if not doc:
        # First-time Google/Apple user — create account
        result = await users.insert_one(
            {
                "email": email,
                "display_name": display_name,
                "firebase_uid": firebase_uid,
                "provider": decoded.get("firebase", {}).get("sign_in_provider", "firebase"),
                "password_hash": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        user_id = str(result.inserted_id)
    else:
        user_id = str(doc["_id"])

    token = create_access_token(user_id=user_id, email=email)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    users = get_users_collection()
    doc = await users.find_one({"_id": ObjectId(current_user["sub"])})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return _serialize_user(doc)
