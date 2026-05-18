"""
Auth router — email/password (JWT) + Google Sign-In + Apple Sign-In.

Endpoints:
  POST /auth/signup          — email+password ile kayıt → doğrulama kodu gönderir
  POST /auth/verify-code     — doğrulama kodu onayı → JWT
  POST /auth/resend-code     — doğrulama kodunu tekrar gönder
  POST /auth/login           — email+password ile giriş → JWT
  POST /auth/google-login    — Google ID token → JWT
  POST /auth/apple-login     — Apple identity token → JWT
  GET  /auth/me              — mevcut kullanıcı bilgisi
"""
from __future__ import annotations

import os
import random
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta

import httpx
import jwt as pyjwt
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

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

# ─── SMTP Config ──────────────────────────────────────────────────────────────

SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")  # Gmail App Password
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))

VERIFICATION_CODE_EXPIRY_MINUTES = 10

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str | None = None


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class ResendCodeRequest(BaseModel):
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    """Google ID token obtained from @react-native-google-signin."""
    id_token: str


class AppleLoginRequest(BaseModel):
    """Apple identity token obtained from @invertase/react-native-apple-authentication."""
    identity_token: str
    display_name: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str | None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _serialize_user(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    doc.pop("password_hash", None)  # never leak the hash
    return doc


def _generate_code() -> str:
    """Generate a 6-digit verification code."""
    return str(random.randint(100000, 999999))


def _send_verification_email(to_email: str, code: str, display_name: str) -> bool:
    """Send verification code via SMTP. Returns True if successful."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.warning("SMTP not configured — skipping email send. Code: %s", code)
        return True  # Don't block signup in dev

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Conversa — Doğrulama Kodunuz: {code}"
        msg["From"] = f"Conversa <{SMTP_EMAIL}>"
        msg["To"] = to_email

        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #2D6A4F; margin-bottom: 8px;">Conversa'ya Hoş Geldiniz! 🎙️</h2>
            <p style="color: #555; font-size: 15px;">
                Merhaba <strong>{display_name}</strong>,<br><br>
                Hesabınızı doğrulamak için aşağıdaki kodu kullanın:
            </p>
            <div style="background: #F0F9F4; border: 2px solid #2D6A4F; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2D6A4F;">{code}</span>
            </div>
            <p style="color: #888; font-size: 13px;">
                Bu kod <strong>10 dakika</strong> içinde geçerliliğini yitirecektir.<br>
                Bu işlemi siz yapmadıysanız bu maili görmezden gelebilirsiniz.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #aaa; font-size: 11px; text-align: center;">Conversa — AI-Powered Meeting Assistant</p>
        </div>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())

        logger.info("Verification email sent to %s", to_email)
        return True
    except Exception as e:
        logger.error("Failed to send email: %s", e)
        return False


async def _find_or_create_social_user(
    provider: str, provider_uid: str, email: str, display_name: str
) -> str:
    """Find existing social user or create a new one. Returns user_id."""
    users = get_users_collection()
    doc = await users.find_one({"provider": provider, "provider_uid": provider_uid})

    if not doc:
        # Also check if email already exists (e.g. signed up via email first)
        doc = await users.find_one({"email": email})

    if doc:
        # Link provider info if not already set
        if not doc.get("provider_uid"):
            await users.update_one(
                {"_id": doc["_id"]},
                {"$set": {"provider_uid": provider_uid, "provider": provider}},
            )
        return str(doc["_id"])

    # First-time social user — create account
    result = await users.insert_one(
        {
            "email": email,
            "display_name": display_name,
            "provider": provider,
            "provider_uid": provider_uid,
            "password_hash": None,
            "email_verified": True,  # Social logins are pre-verified
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return str(result.inserted_id)


# ─── Email / Password Routes ─────────────────────────────────────────────────

@router.post("/signup", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest):
    """
    Create a pending account and send a verification code via email.
    The account is NOT active until /auth/verify-code is called.
    """
    users = get_users_collection()

    # Check if already verified
    existing = await users.find_one({"email": body.email, "email_verified": True})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Remove any previous unverified attempt
    await users.delete_many({"email": body.email, "email_verified": {"$ne": True}})

    code = _generate_code()
    display_name = body.display_name or body.email.split("@")[0]

    doc = {
        "email": body.email,
        "password_hash": hash_password(body.password),
        "display_name": display_name,
        "provider": "email",
        "email_verified": False,
        "verification_code": code,
        "code_expires_at": (datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_CODE_EXPIRY_MINUTES)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await users.insert_one(doc)

    _send_verification_email(body.email, code, display_name)

    return MessageResponse(message="Verification code sent to your email")


@router.post("/verify-code", response_model=TokenResponse)
async def verify_code(body: VerifyCodeRequest):
    """Verify the email code and activate the account → returns JWT."""
    users = get_users_collection()

    doc = await users.find_one({"email": body.email, "email_verified": False})
    if not doc:
        raise HTTPException(status_code=404, detail="No pending verification found")

    # Check expiry
    expires = datetime.fromisoformat(doc["code_expires_at"])
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=410, detail="Verification code has expired. Please request a new one.")

    # Check code
    if doc.get("verification_code") != body.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    # Activate account
    await users.update_one(
        {"_id": doc["_id"]},
        {"$set": {"email_verified": True}, "$unset": {"verification_code": "", "code_expires_at": ""}},
    )

    user_id = str(doc["_id"])
    token = create_access_token(user_id=user_id, email=body.email)
    return TokenResponse(access_token=token)


@router.post("/resend-code", response_model=MessageResponse)
async def resend_code(body: ResendCodeRequest):
    """Resend verification code to the email."""
    users = get_users_collection()

    doc = await users.find_one({"email": body.email, "email_verified": False})
    if not doc:
        raise HTTPException(status_code=404, detail="No pending verification found")

    code = _generate_code()
    await users.update_one(
        {"_id": doc["_id"]},
        {"$set": {
            "verification_code": code,
            "code_expires_at": (datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_CODE_EXPIRY_MINUTES)).isoformat(),
        }},
    )

    _send_verification_email(body.email, code, doc.get("display_name", ""))
    return MessageResponse(message="New verification code sent")


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

    # Check if email is verified
    if doc.get("provider") == "email" and not doc.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox for the verification code.",
        )

    user_id = str(doc["_id"])
    token = create_access_token(user_id=user_id, email=body.email)
    return TokenResponse(access_token=token)


# ─── Google Sign-In ───────────────────────────────────────────────────────────

GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"

@router.post("/google-login", response_model=TokenResponse)
async def google_login(body: GoogleLoginRequest):
    """
    Verify a Google ID token directly via Google's tokeninfo endpoint
    and return a Conversa JWT. No Firebase required.
    """
    # Verify token with Google
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            GOOGLE_TOKEN_INFO_URL,
            params={"id_token": body.id_token},
        )

    if resp.status_code != 200:
        logger.warning("Google token verification failed: %s", resp.text)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    google_data = resp.json()
    google_uid = google_data.get("sub", "")
    email = google_data.get("email", "")
    display_name = google_data.get("name", email.split("@")[0])

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google token does not contain an email",
        )

    user_id = await _find_or_create_social_user(
        provider="google",
        provider_uid=google_uid,
        email=email,
        display_name=display_name,
    )

    token = create_access_token(user_id=user_id, email=email)
    return TokenResponse(access_token=token)


# ─── Apple Sign-In ────────────────────────────────────────────────────────────

APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"

@router.post("/apple-login", response_model=TokenResponse)
async def apple_login(body: AppleLoginRequest):
    """
    Verify an Apple identity token using Apple's public keys (JWKS)
    and return a Conversa JWT. No Firebase required.
    """
    try:
        # 1. Fetch Apple's public keys
        async with httpx.AsyncClient() as client:
            resp = await client.get(APPLE_JWKS_URL)
        apple_keys = resp.json().get("keys", [])

        # 2. Decode the JWT header to find the matching key
        unverified_header = pyjwt.get_unverified_header(body.identity_token)
        kid = unverified_header.get("kid")

        matching_key = None
        for key in apple_keys:
            if key["kid"] == kid:
                matching_key = key
                break

        if not matching_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Apple token key not found",
            )

        # 3. Build the public key and verify the token
        from jwt.algorithms import RSAAlgorithm
        public_key = RSAAlgorithm.from_jwk(matching_key)

        decoded = pyjwt.decode(
            body.identity_token,
            public_key,
            algorithms=["RS256"],
            audience=os.getenv("APPLE_BUNDLE_ID", "org.reactjs.native.example.Conversa"),
            issuer="https://appleid.apple.com",
        )
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Apple token has expired",
        )
    except Exception as e:
        logger.warning("Apple token verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Apple token: {e}",
        )

    apple_uid = decoded.get("sub", "")
    email = decoded.get("email", f"{apple_uid}@privaterelay.appleid.com")
    display_name = body.display_name or email.split("@")[0]

    user_id = await _find_or_create_social_user(
        provider="apple",
        provider_uid=apple_uid,
        email=email,
        display_name=display_name,
    )

    token = create_access_token(user_id=user_id, email=email)
    return TokenResponse(access_token=token)


# ─── Profile ─────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    users = get_users_collection()
    doc = await users.find_one({"_id": ObjectId(current_user["sub"])})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return _serialize_user(doc)
