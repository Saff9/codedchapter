"""
models/comment.py
=================
Comment Pydantic schemas.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Comment(BaseModel):
    """Full comment schema."""
    id: int
    post_id: int = Field(alias="postId")
    author_id: str = Field(alias="authorId")
    author_name: str = Field(alias="authorName")
    author_username: Optional[str] = Field(alias="authorUsername", default=None)
    content: str
    created_at: datetime = Field(alias="createdAt")

    model_config = {"populate_by_name": True}


class CommentCreate(BaseModel):
    """Request body for creating a comment."""
    content: str = Field(min_length=1, max_length=5000)
