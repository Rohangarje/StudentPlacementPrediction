"""
AI-Based Student Placement Prediction System
============================================
Auth Routes (app/api/auth_routes.py)

Handles Google OAuth authentication flow:
    POST /auth/google  — Verify Google ID token, return JWT session token
    POST /auth/demo    — Demo login (no real Google credentials needed)
    GET  /auth/me      — Get current authenticated user info (from session token)
    POST /auth/logout  — Logout (client-side token clear, returns success)
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Header, Request, status
from pydantic import BaseModel, Field

from ..services.auth_service import (
    verify_google_token,
    create_session_token,
    verify_session_token,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"


# ══════════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class GoogleAuthRequest(BaseModel):
    """Request body for Google OAuth authentication."""
    credential: str = Field(..., description="Google OAuth credential/ID token from the frontend")


class AuthResponse(BaseModel):
    """Response after successful authentication."""
    success: bool = True
    token: str = Field(..., description="JWT session token for subsequent API calls")
    user: Dict[str, Any] = Field(..., description="User info from Google (name, email, picture)")


class UserResponse(BaseModel):
    """Response for GET /auth/me."""
    authenticated: bool
    user: Optional[Dict[str, Any]] = Field(None, description="User info if authenticated")


class DemoAuthRequest(BaseModel):
    """Request body for demo authentication (no real credentials needed)."""
    name: str = Field(default="Demo User", description="Display name for the demo user")
    email: str = Field(default="demo@example.com", description="Email for the demo user")


class LogoutResponse(BaseModel):
    """Response for POST /auth/logout."""
    success: bool = True
    message: str = "Logged out successfully"


# ══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/google",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate with Google OAuth",
)
async def google_auth(request: Request, body: GoogleAuthRequest) -> AuthResponse:
    """
    Verify a Google ID token and return a JWT session token.

    The frontend sends the credential from Google's One Tap / Sign-In button.
    The backend verifies it with Google's public keys, then issues a JWT
    that the frontend can use for subsequent API requests.
    """
    # Verify the Google token
    user_info = verify_google_token(body.credential)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Google credential token.",
        )

    # Create a JWT session token
    session_token = create_session_token(user_info)

    # Return safe user info (no sensitive fields)
    safe_user = {
        "sub": user_info.get("sub"),
        "email": user_info.get("email", ""),
        "name": user_info.get("name", "Unknown"),
        "picture": user_info.get("picture", ""),
    }

    logger.info("User authenticated: %s (%s)", safe_user["name"], safe_user["email"])
    return AuthResponse(
        success=True,
        token=session_token,
        user=safe_user,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user",
)
async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> UserResponse:
    """
    Returns the currently authenticated user's info based on the session token.

    The token should be passed in the `Authorization` header as `Bearer <token>`.
    """
    if not authorization:
        return UserResponse(authenticated=False, user=None)

    # Extract Bearer token
    token = authorization.replace("Bearer ", "").strip()
    payload = verify_session_token(token)

    if not payload:
        return UserResponse(authenticated=False, user=None)

    return UserResponse(
        authenticated=True,
        user={
            "sub": payload.get("sub"),
            "email": payload.get("email", ""),
            "name": payload.get("name", "Unknown"),
            "picture": payload.get("picture", ""),
        },
    )


@router.post(
    "/logout",
    response_model=LogoutResponse,
    summary="Logout (invalidate session)",
)
async def logout() -> LogoutResponse:
    """
    Logout endpoint.

    Since JWTs are stateless, logout is handled client-side by removing the token.
    This endpoint returns a success acknowledgment.
    """
    return LogoutResponse(success=True, message="Logged out successfully. Please discard your token.")


@router.post(
    "/demo",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Demo login (no real Google credentials needed)",
)
async def demo_auth(body: DemoAuthRequest = DemoAuthRequest()) -> AuthResponse:
    """
    Demo authentication endpoint — issues a JWT for testing without
    requiring a real Google account. Only available when DEMO_MODE=true.
    """
    if not DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo mode is disabled on this server.",
        )

    demo_user = {
        "sub": "demo-user-001",
        "email": body.email,
        "name": body.name,
        "picture": "https://ui-avatars.com/api/?name=Demo+User&background=4361EE&color=fff&size=128",
    }

    session_token = create_session_token(demo_user)
    logger.info("Demo login: %s (%s)", demo_user["name"], demo_user["email"])

    return AuthResponse(
        success=True,
        token=session_token,
        user=demo_user,
    )
