"""
models/profile.py
=================
User profile Pydantic schemas.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Profile(BaseModel):
    """Public user profile."""
    id: int
    user_id: str = Field(alias="userId")
    username: str
    display_name: str = Field(alias="displayName")
    bio: Optional[str] = None
    avatar_url: Optional[str] = Field(alias="avatarUrl", default=None)
    website: Optional[str] = None
    posts_count: int = Field(alias="postsCount", default=0)
    doubts_count: int = Field(alias="doubtsCount", default=0)
    answers_count: int = Field(alias="answersCount", default=0)
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = {"populate_by_name": True}


class ProfileUpsert(BaseModel):
    """Request body for creating or updating a profile."""
    username: str = Field(min_length=2, max_length=30, pattern=r"^[a-zA-Z0-9_-]+$")
    display_name: str = Field(alias="displayName", min_length=1, max_length=100)
    bio: Optional[str] = Field(default=None, max_length=500)
    avatar_url: Optional[str] = Field(alias="avatarUrl", default=None)
    website: Optional[str] = Field(default=None, max_length=200)

    model_config = {"populate_by_name": True}
