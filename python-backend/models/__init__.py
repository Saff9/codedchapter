"""
models/__init__.py
==================
Pydantic v2 data models (schemas) for the entire API.

These models are used for:
  - Request body validation (incoming JSON)
  - Response serialization (outgoing JSON)
  - Documentation (auto-generated OpenAPI/Swagger)
"""

from .post import Post, PostCreate, PostUpdate, PostSummary
from .comment import Comment, CommentCreate
from .doubt import Doubt, DoubtCreate, DoubtWithAnswers, Answer, AnswerCreate
from .profile import Profile, ProfileUpsert

__all__ = [
    "Post", "PostCreate", "PostUpdate", "PostSummary",
    "Comment", "CommentCreate",
    "Doubt", "DoubtCreate", "DoubtWithAnswers", "Answer", "AnswerCreate",
    "Profile", "ProfileUpsert",
]
