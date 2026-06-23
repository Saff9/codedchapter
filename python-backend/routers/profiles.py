"""
routers/profiles.py
====================
User profiles API.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException

from middleware.auth import require_auth, AuthUser
import services.database as db_svc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get("/me", summary="Get my profile")
async def get_my_profile(user: AuthUser = Depends(require_auth)):
    """Returns the authenticated user's profile."""
    profile = await db_svc.get_profile_by_user_id(user.user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/check-username/{username}", summary="Check username availability")
async def check_username(username: str):
    """Returns {available: bool} for a given username."""
    available = await db_svc.check_username_available(username)
    return {"available": available}


@router.get("/{username}", summary="Get profile by username")
async def get_profile(username: str):
    """Returns a public user profile by their username."""
    profile = await db_svc.get_profile_by_username(username)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.post("/", summary="Create or update profile")
async def upsert_profile(
    body: dict,
    user: AuthUser = Depends(require_auth),
):
    """
    Create or update the authenticated user's profile.
    Also used after first sign-up to set a username and display name.
    """
    if not body.get("username") or not body.get("displayName"):
        raise HTTPException(status_code=400, detail="username and displayName are required")

    # Check username availability (unless user owns it)
    existing = await db_svc.get_profile_by_user_id(user.user_id)
    if not existing or existing["username"] != body["username"].lower():
        available = await db_svc.check_username_available(body["username"])
        if not available:
            raise HTTPException(status_code=409, detail="Username already taken")
    try:
        return await db_svc.upsert_profile(user_id=user.user_id, data=body)
    except Exception as exc:
        logger.error("upsert_profile failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save profile")
