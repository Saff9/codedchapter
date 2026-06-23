"""
models/post.py
==============
Post-related Pydantic schemas.
"""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, HttpUrl


class PostSummary(BaseModel):
    """Lightweight post schema for list endpoints."""
    id: int
    title: str
    slug: str
    excerpt: Optional[str] = None
    tags: list[str] = []
    author_id: str = Field(alias="authorId", default="")
    author_name: str = Field(alias="authorName", default="")
    author_username: Optional[str] = Field(alias="authorUsername", default=None)
    category: Literal["tech", "general"] = "tech"
    cover_image: Optional[str] = Field(alias="coverImage", default=None)
    reading_time_minutes: int = Field(alias="readingTimeMinutes", default=1)
    comment_count: int = Field(alias="commentCount", default=0)
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    substack_url: Optional[str] = Field(alias="substackUrl", default=None)

    model_config = {"populate_by_name": True}


class Post(PostSummary):
    """Full post schema including content body."""
    content: str = ""
    is_html: bool = Field(alias="isHtml", default=False)

    model_config = {"populate_by_name": True}


class PostCreate(BaseModel):
    """Request body for creating a new post (admin only)."""
    title: str = Field(min_length=3, max_length=300)
    excerpt: str = Field(min_length=10, max_length=1000)
    content: str = Field(min_length=10)
    tags: list[str] = Field(default=[], max_length=10)
    category: Literal["tech", "general"] = "tech"
    cover_image: Optional[str] = Field(alias="coverImage", default=None)

    model_config = {"populate_by_name": True}


class PostUpdate(PostCreate):
    """Request body for updating a post (admin only). Same shape as create."""
    pass
