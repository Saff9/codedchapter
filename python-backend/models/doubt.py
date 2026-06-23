"""
models/doubt.py
===============
Doubt (Q&A section) Pydantic schemas.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Answer(BaseModel):
    """An answer to a doubt."""
    id: int
    doubt_id: int = Field(alias="doubtId")
    author_id: str = Field(alias="authorId")
    author_name: str = Field(alias="authorName")
    author_username: Optional[str] = Field(alias="authorUsername", default=None)
    content: str
    is_accepted: bool = Field(alias="isAccepted", default=False)
    created_at: datetime = Field(alias="createdAt")

    model_config = {"populate_by_name": True}


class AnswerCreate(BaseModel):
    """Request body for creating an answer."""
    content: str = Field(min_length=5, max_length=10000)


class Doubt(BaseModel):
    """Doubt summary without answers."""
    id: int
    title: str
    content: str
    tags: list[str] = []
    author_id: str = Field(alias="authorId")
    author_name: str = Field(alias="authorName")
    author_username: Optional[str] = Field(alias="authorUsername", default=None)
    is_resolved: bool = Field(alias="isResolved", default=False)
    answer_count: int = Field(alias="answerCount", default=0)
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = {"populate_by_name": True}


class DoubtWithAnswers(Doubt):
    """Doubt detail including all answers."""
    answers: list[Answer] = []


class DoubtCreate(BaseModel):
    """Request body for creating a doubt."""
    title: str = Field(min_length=5, max_length=300)
    content: str = Field(min_length=10, max_length=10000)
    tags: list[str] = Field(default=[], max_length=10)
