"""
middleware/auth.py
==================
Supabase JWT authentication middleware for FastAPI.

Usage in routes:
    from middleware.auth import get_current_user, require_auth, AuthUser

    @router.get("/me")
    async def me(user: AuthUser = Depends(require_auth)):
        return {"userId": user.user_id, "email": user.email}
"""

from dataclasses import dataclass
from typing import Optional
from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from config import get_settings, Settings


security = HTTPBearer(auto_error=False)


@dataclass
class AuthUser:
    """Authenticated user extracted from Supabase JWT."""
    user_id: str
    email: str
    role: str = "authenticated"
    full_name: Optional[str] = None

    @property
    def is_admin(self) -> bool:
        """Check if this user is the site admin."""
        settings = get_settings()
        return bool(settings.admin_email and self.email == settings.admin_email)


def _decode_token(token: str, settings: Settings) -> dict:
    """
    Decode and verify a Supabase JWT.
    
    Args:
        token: Raw JWT string (without 'Bearer ' prefix)
        settings: App settings containing the JWT secret
    
    Returns:
        Decoded payload dict
    
    Raises:
        HTTPException 401: If token is invalid or expired
    """
    if not settings.supabase_jwt_secret:
        raise HTTPException(status_code=500, detail="JWT secret not configured")

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase doesn't set aud by default
        )
        return payload
    except JWTError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    settings: Settings = Depends(get_settings),
) -> Optional[AuthUser]:
    """
    Extract the current user from the Authorization header.
    Returns None if no token is provided (for optional auth routes).
    """
    if not credentials:
        return None
    payload = _decode_token(credentials.credentials, settings)
    return AuthUser(
        user_id=payload.get("sub", ""),
        email=payload.get("email", ""),
        role=payload.get("role", "authenticated"),
        full_name=payload.get("user_metadata", {}).get("full_name"),
    )


def require_auth(
    user: Optional[AuthUser] = Depends(get_current_user),
) -> AuthUser:
    """
    Require a valid JWT. Raises 401 if not authenticated.
    Use as a FastAPI dependency for protected endpoints.
    """
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


def require_admin(
    user: AuthUser = Depends(require_auth),
) -> AuthUser:
    """
    Require the admin user. Raises 403 if not the admin email.
    Use as a FastAPI dependency for admin-only endpoints.
    """
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden: Admin only")
    return user
