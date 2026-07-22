"""
AI-Based Student Placement Prediction System
============================================
Auth Service (app/services/auth_service.py)

Handles Google OAuth token verification and JWT session token generation.
Uses google-auth library to verify the ID token from the frontend,
then issues a short-lived JWT for subsequent API calls.

Environment variables:
    GOOGLE_CLIENT_ID  — Your Google OAuth 2.0 client ID (required)
    JWT_SECRET        — Secret key for signing JWTs (auto-generated if missing)
"""

from __future__ import annotations

import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

logger = logging.getLogger(__name__)

# ─── Configuration ─────────────────────────────────────────────────────────────

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24


# ══════════════════════════════════════════════════════════════════════════════
# Google Token Verification
# ══════════════════════════════════════════════════════════════════════════════

def verify_google_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify a Google OAuth ID token.

    Args:
        token: The Google credential token from the frontend.

    Returns:
        Decoded token payload (dict) if valid, None otherwise.
        Payload includes: sub, email, name, picture, etc.
    """
    if not GOOGLE_CLIENT_ID:
        logger.error("GOOGLE_CLIENT_ID is not configured in environment variables.")
        return None

    try:
        # Verify the token with Google's public keys
        id_info = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )

        # Ensure the token is meant for our app
        if id_info.get("aud") != GOOGLE_CLIENT_ID:
            logger.warning("Token audience mismatch (issuer=%s)", id_info.get("iss"))
            return None

        logger.info(
            "Google token verified for user: %s (%s)",
            id_info.get("name", "Unknown"),
            id_info.get("email", "No email"),
        )
        return id_info

    except ValueError as exc:
        # Invalid token
        logger.warning("Google token verification failed: %s", exc)
        return None
    except Exception as exc:
        logger.exception("Unexpected error verifying Google token: %s", exc)
        return None


# ══════════════════════════════════════════════════════════════════════════════
# JWT Session Token Management
# ══════════════════════════════════════════════════════════════════════════════

def create_session_token(user_info: Dict[str, Any]) -> str:
    """
    Create a JWT session token for an authenticated user.

    Args:
        user_info: Dict containing at minimum 'sub', 'email', 'name'.

    Returns:
        Encoded JWT string.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_info.get("sub"),
        "email": user_info.get("email"),
        "name": user_info.get("name"),
        "picture": user_info.get("picture"),
        "iat": now,
        "exp": now + timedelta(hours=JWT_EXPIRY_HOURS),
        "iss": "placement-prediction-api",
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    logger.debug("Session token created for user: %s", user_info.get("email"))
    return token


def verify_session_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT session token.

    Args:
        token: The JWT session token.

    Returns:
        Decoded payload if valid, None otherwise.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        logger.debug("Session token verified for user: %s", payload.get("email"))
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Session token has expired.")
        return None
    except jwt.InvalidTokenError as exc:
        logger.warning("Invalid session token: %s", exc)
        return None

