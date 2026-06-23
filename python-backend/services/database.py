"""
services/database.py
=====================
Async SQLAlchemy database service layer.

This service mirrors the TypeScript repository.ts exactly.
It is used when USE_SUBSTACK=false.

TO ENABLE:
    Set USE_SUBSTACK=false in your .env
    Ensure DATABASE_URL is a valid async PostgreSQL connection string:
        postgresql+asyncpg://user:pass@host:5432/dbname

SCHEMA NOTE:
    Table definitions mirror the Drizzle ORM schema in the TypeScript backend.
    Run Alembic migrations to create the tables:
        cd python-backend && alembic upgrade head
"""

import logging
import math
import re
from datetime import datetime, timezone
from typing import Optional, Any

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, ARRAY,
    select, delete, update, insert, func, desc, and_
)
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, AsyncEngine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger(__name__)

Base = declarative_base()

# ── ORM Table definitions (mirror TypeScript Drizzle schema) ──────────────────

class ProfileORM(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True)
    user_id = Column("userId", String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=False)
    display_name = Column("displayName", String, nullable=False)
    bio = Column(Text, nullable=True)
    avatar_url = Column("avatarUrl", String, nullable=True)
    website = Column(String, nullable=True)
    created_at = Column("createdAt", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column("updatedAt", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class PostORM(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    slug = Column(String, nullable=False)
    excerpt = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    tags = Column(ARRAY(String), default=list)
    author_id = Column("authorId", String, nullable=False)
    author_name = Column("authorName", String, nullable=False)
    category = Column(String, default="tech")
    cover_image = Column("coverImage", String, nullable=True)
    reading_time_minutes = Column("readingTimeMinutes", Integer, default=1)
    created_at = Column("createdAt", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column("updatedAt", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class CommentORM(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True)
    post_id = Column("postId", Integer, nullable=False)
    author_id = Column("authorId", String, nullable=False)
    author_name = Column("authorName", String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column("createdAt", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class DoubtORM(Base):
    __tablename__ = "doubts"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(ARRAY(String), default=list)
    author_id = Column("authorId", String, nullable=False)
    author_name = Column("authorName", String, nullable=False)
    author_username = Column("authorUsername", String, nullable=True)
    is_resolved = Column("isResolved", Boolean, default=False)
    answer_count = Column("answerCount", Integer, default=0)
    created_at = Column("createdAt", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column("updatedAt", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AnswerORM(Base):
    __tablename__ = "doubt_answers"
    id = Column(Integer, primary_key=True)
    doubt_id = Column("doubtId", Integer, nullable=False)
    author_id = Column("authorId", String, nullable=False)
    author_name = Column("authorName", String, nullable=False)
    author_username = Column("authorUsername", String, nullable=True)
    content = Column(Text, nullable=False)
    is_accepted = Column("isAccepted", Boolean, default=False)
    created_at = Column("createdAt", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── Engine & Session Factory ──────────────────────────────────────────────────

_engine: Optional[AsyncEngine] = None
_session_factory: Optional[sessionmaker] = None


def init_db(database_url: str) -> None:
    """
    Initialize the async database engine and session factory.
    Call once at application startup via the lifespan handler in main.py.

    Args:
        database_url: Async PostgreSQL connection string.
                      Must start with 'postgresql+asyncpg://'
    """
    global _engine, _session_factory
    # Convert standard postgres:// URLs to async asyncpg driver
    url = database_url.replace("postgresql://", "postgresql+asyncpg://")
    url = url.replace("postgres://", "postgresql+asyncpg://")

    _engine = create_async_engine(
        url,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=1800,   # Recycle connections every 30 min
        echo=False,
    )
    _session_factory = sessionmaker(
        _engine, class_=AsyncSession, expire_on_commit=False
    )
    logger.info("Database engine initialized")


async def close_db() -> None:
    """Dispose the database engine. Call at application shutdown."""
    if _engine:
        await _engine.dispose()
        logger.info("Database engine disposed")


def get_session() -> AsyncSession:
    """Return a new async database session."""
    if not _session_factory:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return _session_factory()


# ── Helper ────────────────────────────────────────────────────────────────────

def _make_slug(title: str, post_id: int) -> str:
    """Generate a URL-safe slug from a title and post ID."""
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:60]
    return f"{base}-{post_id}"


def _reading_time(content: str) -> int:
    """Estimate reading time in minutes from word count (200 wpm)."""
    words = len(content.split())
    return max(1, math.ceil(words / 200))


def _row_to_dict(row: Any) -> dict:
    """Convert an ORM row to a serializable dict with camelCase keys."""
    d = {}
    for col in row.__table__.columns:
        d[col.name] = getattr(row, col.key)
    return d


# ── Posts ─────────────────────────────────────────────────────────────────────

async def list_posts(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 10,
    offset: int = 0,
    author_id: Optional[str] = None,
) -> list[dict]:
    """
    Retrieve paginated posts with optional filters.
    
    Args:
        category: Filter by 'tech' or 'general'
        tag: Filter by tag string
        limit: Maximum number of posts to return
        offset: Number of posts to skip (for pagination)
        author_id: Filter by author user ID
    
    Returns:
        List of post dicts with comment_count included
    """
    async with get_session() as session:
        conditions = []
        if category:
            conditions.append(PostORM.category == category)
        if author_id:
            conditions.append(PostORM.author_id == author_id)
        if tag:
            conditions.append(PostORM.tags.contains([tag]))

        stmt = (
            select(PostORM, ProfileORM.username.label("author_username"),
                   func.count(CommentORM.id).label("comment_count"))
            .outerjoin(CommentORM, CommentORM.post_id == PostORM.id)
            .outerjoin(ProfileORM, ProfileORM.user_id == PostORM.author_id)
            .where(and_(*conditions) if conditions else True)
            .group_by(PostORM.id, ProfileORM.username)
            .order_by(desc(PostORM.created_at))
            .limit(limit)
            .offset(offset)
        )
        result = await session.execute(stmt)
        rows = result.all()
        return [
            {
                "id": r.PostORM.id,
                "title": r.PostORM.title,
                "slug": r.PostORM.slug,
                "excerpt": r.PostORM.excerpt,
                "content": r.PostORM.content,
                "tags": r.PostORM.tags or [],
                "authorId": r.PostORM.author_id,
                "authorName": r.PostORM.author_name,
                "authorUsername": r.author_username,
                "category": r.PostORM.category,
                "coverImage": r.PostORM.cover_image,
                "readingTimeMinutes": r.PostORM.reading_time_minutes,
                "commentCount": r.comment_count or 0,
                "createdAt": r.PostORM.created_at,
                "updatedAt": r.PostORM.updated_at,
                "isHtml": False,
            }
            for r in rows
        ]


async def get_featured_posts() -> list[dict]:
    """Return the 4 most recent tech posts."""
    return await list_posts(category="tech", limit=4)


async def get_all_tags() -> list[str]:
    """Return all unique tags across all posts, sorted alphabetically."""
    async with get_session() as session:
        stmt = select(PostORM.tags)
        result = await session.execute(stmt)
        tag_set: set[str] = set()
        for (tags,) in result.all():
            if tags:
                tag_set.update(tags)
        return sorted(tag_set)


async def get_post(post_id: int) -> Optional[dict]:
    """
    Fetch a single post by ID, including comment count.
    
    Returns:
        Post dict or None if not found
    """
    async with get_session() as session:
        stmt = (
            select(PostORM, ProfileORM.username.label("author_username"),
                   func.count(CommentORM.id).label("comment_count"))
            .outerjoin(CommentORM, CommentORM.post_id == PostORM.id)
            .outerjoin(ProfileORM, ProfileORM.user_id == PostORM.author_id)
            .where(PostORM.id == post_id)
            .group_by(PostORM.id, ProfileORM.username)
        )
        result = await session.execute(stmt)
        row = result.first()
        if not row:
            return None
        return {
            "id": row.PostORM.id,
            "title": row.PostORM.title,
            "slug": row.PostORM.slug,
            "excerpt": row.PostORM.excerpt,
            "content": row.PostORM.content,
            "tags": row.PostORM.tags or [],
            "authorId": row.PostORM.author_id,
            "authorName": row.PostORM.author_name,
            "authorUsername": row.author_username,
            "category": row.PostORM.category,
            "coverImage": row.PostORM.cover_image,
            "readingTimeMinutes": row.PostORM.reading_time_minutes,
            "commentCount": row.comment_count or 0,
            "createdAt": row.PostORM.created_at,
            "updatedAt": row.PostORM.updated_at,
            "isHtml": False,
        }


async def create_post(user_id: str, author_name: str, data: dict) -> dict:
    """
    Create a new post in the database (admin only).

    Args:
        user_id: Supabase user ID of the admin author
        author_name: Display name of the author
        data: Dict with keys: title, excerpt, content, tags, category, cover_image
    
    Returns:
        Created post dict with ID and comment_count: 0
    """
    async with get_session() as session:
        async with session.begin():
            new_post = PostORM(
                title=data["title"],
                slug="temp",
                excerpt=data.get("excerpt"),
                content=data["content"],
                tags=data.get("tags", []),
                author_id=user_id,
                author_name=author_name,
                category=data.get("category", "tech"),
                cover_image=data.get("coverImage"),
                reading_time_minutes=_reading_time(data["content"]),
            )
            session.add(new_post)
            await session.flush()  # Get the generated ID

            # Update slug now we have the ID
            new_post.slug = _make_slug(data["title"], new_post.id)
            await session.flush()

            return {
                **{c.name: getattr(new_post, c.key) for c in PostORM.__table__.columns},
                "authorId": new_post.author_id,
                "authorName": new_post.author_name,
                "coverImage": new_post.cover_image,
                "readingTimeMinutes": new_post.reading_time_minutes,
                "createdAt": new_post.created_at,
                "updatedAt": new_post.updated_at,
                "commentCount": 0,
                "isHtml": False,
            }


async def update_post(post_id: int, user_id: str, data: dict) -> dict:
    """
    Update a post. Only the original author (admin) can update.

    Raises:
        ValueError: If post is not found or user is not the author
    """
    async with get_session() as session:
        async with session.begin():
            stmt = select(PostORM).where(PostORM.id == post_id)
            result = await session.execute(stmt)
            post = result.scalar_one_or_none()
            if not post:
                raise ValueError("Post not found")
            if post.author_id != user_id:
                raise PermissionError("Forbidden")

            post.title = data["title"]
            post.slug = _make_slug(data["title"], post_id)
            post.excerpt = data.get("excerpt")
            post.content = data["content"]
            post.tags = data.get("tags", [])
            post.category = data.get("category", post.category)
            post.cover_image = data.get("coverImage")
            post.reading_time_minutes = _reading_time(data["content"])
            post.updated_at = datetime.now(timezone.utc)

            return await get_post(post_id)


async def delete_post(post_id: int, user_id: str) -> bool:
    """
    Delete a post and all its comments.

    Returns:
        True if deleted, False if not found

    Raises:
        PermissionError: If user is not the post author
    """
    async with get_session() as session:
        async with session.begin():
            stmt = select(PostORM).where(PostORM.id == post_id)
            result = await session.execute(stmt)
            post = result.scalar_one_or_none()
            if not post:
                return False
            if post.author_id != user_id:
                raise PermissionError("Forbidden")

            await session.execute(delete(CommentORM).where(CommentORM.post_id == post_id))
            await session.execute(delete(PostORM).where(PostORM.id == post_id))
            return True


# ── Comments ──────────────────────────────────────────────────────────────────

async def list_comments(post_id: int) -> list[dict]:
    """Return all comments for a post, newest first."""
    async with get_session() as session:
        stmt = (
            select(CommentORM, ProfileORM.username.label("author_username"))
            .outerjoin(ProfileORM, ProfileORM.user_id == CommentORM.author_id)
            .where(CommentORM.post_id == post_id)
            .order_by(desc(CommentORM.created_at))
        )
        result = await session.execute(stmt)
        return [
            {
                "id": r.CommentORM.id,
                "postId": r.CommentORM.post_id,
                "authorId": r.CommentORM.author_id,
                "authorName": r.CommentORM.author_name,
                "authorUsername": r.author_username,
                "content": r.CommentORM.content,
                "createdAt": r.CommentORM.created_at,
            }
            for r in result.all()
        ]


async def create_comment(post_id: int, author_id: str, author_name: str, content: str) -> dict:
    """Create a comment. Validates that the post exists."""
    async with get_session() as session:
        async with session.begin():
            post_exists = await session.execute(select(PostORM.id).where(PostORM.id == post_id))
            if not post_exists.scalar_one_or_none():
                raise ValueError("Post not found")

            comment = CommentORM(
                post_id=post_id, author_id=author_id,
                author_name=author_name, content=content
            )
            session.add(comment)
            await session.flush()
            return {
                "id": comment.id, "postId": comment.post_id,
                "authorId": comment.author_id, "authorName": comment.author_name,
                "content": comment.content, "createdAt": comment.created_at,
            }


async def delete_comment(comment_id: int, user_id: str) -> bool:
    """Delete a comment. Only the author can delete."""
    async with get_session() as session:
        async with session.begin():
            stmt = select(CommentORM).where(CommentORM.id == comment_id)
            result = await session.execute(stmt)
            comment = result.scalar_one_or_none()
            if not comment:
                return False
            if comment.author_id != user_id:
                raise PermissionError("Forbidden")
            await session.execute(delete(CommentORM).where(CommentORM.id == comment_id))
            return True


# ── Doubts ────────────────────────────────────────────────────────────────────

async def list_doubts(
    tag: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    author_id: Optional[str] = None,
) -> list[dict]:
    """Return paginated doubts with optional tag/author filtering."""
    async with get_session() as session:
        conditions = []
        if tag:
            conditions.append(DoubtORM.tags.contains([tag]))
        if author_id:
            conditions.append(DoubtORM.author_id == author_id)

        stmt = (
            select(DoubtORM)
            .where(and_(*conditions) if conditions else True)
            .order_by(desc(DoubtORM.created_at))
            .limit(limit)
            .offset(offset)
        )
        result = await session.execute(stmt)
        return [
            {
                "id": r.id, "title": r.title, "content": r.content,
                "tags": r.tags or [], "authorId": r.author_id,
                "authorName": r.author_name, "authorUsername": r.author_username,
                "isResolved": r.is_resolved, "answerCount": r.answer_count,
                "createdAt": r.created_at, "updatedAt": r.updated_at,
            }
            for r in result.scalars().all()
        ]


async def get_doubt(doubt_id: int) -> Optional[dict]:
    """Return a doubt with all its answers."""
    async with get_session() as session:
        doubt_stmt = select(DoubtORM).where(DoubtORM.id == doubt_id)
        doubt_result = await session.execute(doubt_stmt)
        doubt = doubt_result.scalar_one_or_none()
        if not doubt:
            return None

        answers_stmt = (
            select(AnswerORM)
            .where(AnswerORM.doubt_id == doubt_id)
            .order_by(desc(AnswerORM.is_accepted), desc(AnswerORM.created_at))
        )
        answers_result = await session.execute(answers_stmt)
        answers = [
            {
                "id": a.id, "doubtId": a.doubt_id, "authorId": a.author_id,
                "authorName": a.author_name, "authorUsername": a.author_username,
                "content": a.content, "isAccepted": a.is_accepted, "createdAt": a.created_at,
            }
            for a in answers_result.scalars().all()
        ]
        return {
            "id": doubt.id, "title": doubt.title, "content": doubt.content,
            "tags": doubt.tags or [], "authorId": doubt.author_id,
            "authorName": doubt.author_name, "authorUsername": doubt.author_username,
            "isResolved": doubt.is_resolved, "answerCount": doubt.answer_count,
            "createdAt": doubt.created_at, "updatedAt": doubt.updated_at,
            "answers": answers,
        }


async def create_doubt(user_id: str, author_name: str, author_username: Optional[str], data: dict) -> dict:
    """Create a new doubt/question."""
    async with get_session() as session:
        async with session.begin():
            doubt = DoubtORM(
                title=data["title"], content=data["content"],
                tags=data.get("tags", []), author_id=user_id,
                author_name=author_name, author_username=author_username,
            )
            session.add(doubt)
            await session.flush()
            return {
                "id": doubt.id, "title": doubt.title, "content": doubt.content,
                "tags": doubt.tags, "authorId": doubt.author_id,
                "authorName": doubt.author_name, "authorUsername": doubt.author_username,
                "isResolved": False, "answerCount": 0,
                "createdAt": doubt.created_at, "updatedAt": doubt.updated_at,
            }


async def delete_doubt(doubt_id: int, user_id: str) -> bool:
    """Delete a doubt and all answers. Only the author can delete."""
    async with get_session() as session:
        async with session.begin():
            result = await session.execute(select(DoubtORM).where(DoubtORM.id == doubt_id))
            doubt = result.scalar_one_or_none()
            if not doubt:
                return False
            if doubt.author_id != user_id:
                raise PermissionError("Forbidden")
            await session.execute(delete(AnswerORM).where(AnswerORM.doubt_id == doubt_id))
            await session.execute(delete(DoubtORM).where(DoubtORM.id == doubt_id))
            return True


async def create_answer(doubt_id: int, author_id: str, author_name: str, author_username: Optional[str], content: str) -> dict:
    """Create an answer to a doubt."""
    async with get_session() as session:
        async with session.begin():
            result = await session.execute(select(DoubtORM).where(DoubtORM.id == doubt_id))
            doubt = result.scalar_one_or_none()
            if not doubt:
                raise ValueError("Doubt not found")

            answer = AnswerORM(
                doubt_id=doubt_id, author_id=author_id,
                author_name=author_name, author_username=author_username,
                content=content,
            )
            session.add(answer)
            doubt.answer_count += 1
            doubt.updated_at = datetime.now(timezone.utc)
            await session.flush()
            return {
                "id": answer.id, "doubtId": answer.doubt_id,
                "authorId": answer.author_id, "authorName": answer.author_name,
                "authorUsername": answer.author_username, "content": answer.content,
                "isAccepted": False, "createdAt": answer.created_at,
            }


async def delete_answer(doubt_id: int, answer_id: int, user_id: str) -> bool:
    """Delete an answer. Only the answer author can delete."""
    async with get_session() as session:
        async with session.begin():
            result = await session.execute(select(AnswerORM).where(AnswerORM.id == answer_id))
            answer = result.scalar_one_or_none()
            if not answer or answer.doubt_id != doubt_id:
                return False
            if answer.author_id != user_id:
                raise PermissionError("Forbidden")
            await session.execute(delete(AnswerORM).where(AnswerORM.id == answer_id))

            # Decrement answer count
            d_result = await session.execute(select(DoubtORM).where(DoubtORM.id == doubt_id))
            doubt = d_result.scalar_one_or_none()
            if doubt:
                doubt.answer_count = max(0, doubt.answer_count - 1)
                doubt.updated_at = datetime.now(timezone.utc)
            return True


async def accept_answer(doubt_id: int, answer_id: int, user_id: str) -> dict:
    """Mark an answer as accepted. Only the doubt author can accept."""
    async with get_session() as session:
        async with session.begin():
            d_result = await session.execute(select(DoubtORM).where(DoubtORM.id == doubt_id))
            doubt = d_result.scalar_one_or_none()
            if not doubt:
                raise ValueError("Doubt not found")
            if doubt.author_id != user_id:
                raise PermissionError("Forbidden")

            # Clear all previously accepted answers
            await session.execute(
                update(AnswerORM).where(AnswerORM.doubt_id == doubt_id).values(is_accepted=False)
            )

            # Accept target answer
            a_result = await session.execute(select(AnswerORM).where(AnswerORM.id == answer_id))
            answer = a_result.scalar_one_or_none()
            if not answer or answer.doubt_id != doubt_id:
                raise ValueError("Answer not found")
            answer.is_accepted = True
            doubt.is_resolved = True
            doubt.updated_at = datetime.now(timezone.utc)
            return {
                "id": answer.id, "doubtId": answer.doubt_id,
                "authorId": answer.author_id, "authorName": answer.author_name,
                "authorUsername": answer.author_username, "content": answer.content,
                "isAccepted": True, "createdAt": answer.created_at,
            }


# ── Profiles ──────────────────────────────────────────────────────────────────

async def get_profile_by_user_id(user_id: str) -> Optional[dict]:
    """Fetch a profile and its activity counts by user ID."""
    async with get_session() as session:
        result = await session.execute(select(ProfileORM).where(ProfileORM.user_id == user_id))
        profile = result.scalar_one_or_none()
        if not profile:
            return None
        return await _enrich_profile(session, profile)


async def get_profile_by_username(username: str) -> Optional[dict]:
    """Fetch a profile and its activity counts by username (case-insensitive)."""
    async with get_session() as session:
        result = await session.execute(
            select(ProfileORM).where(ProfileORM.username == username.lower())
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return None
        return await _enrich_profile(session, profile)


async def check_username_available(username: str) -> bool:
    """Return True if the username is not already taken."""
    async with get_session() as session:
        result = await session.execute(
            select(ProfileORM.id).where(ProfileORM.username == username.lower())
        )
        return result.scalar_one_or_none() is None


async def upsert_profile(user_id: str, data: dict) -> dict:
    """Create or update a user profile."""
    async with get_session() as session:
        async with session.begin():
            result = await session.execute(select(ProfileORM).where(ProfileORM.user_id == user_id))
            profile = result.scalar_one_or_none()
            username = data["username"].lower()

            if profile:
                profile.username = username
                profile.display_name = data["displayName"]
                profile.bio = data.get("bio")
                profile.avatar_url = data.get("avatarUrl")
                profile.website = data.get("website")
                profile.updated_at = datetime.now(timezone.utc)
            else:
                profile = ProfileORM(
                    user_id=user_id,
                    username=username,
                    display_name=data["displayName"],
                    bio=data.get("bio"),
                    avatar_url=data.get("avatarUrl"),
                    website=data.get("website"),
                )
                session.add(profile)
            await session.flush()
            return await _enrich_profile(session, profile)


async def _enrich_profile(session: AsyncSession, profile: ProfileORM) -> dict:
    """Add activity counts to a profile dict."""
    posts_count = await session.scalar(
        select(func.count(PostORM.id)).where(PostORM.author_id == profile.user_id)
    )
    doubts_count = await session.scalar(
        select(func.count(DoubtORM.id)).where(DoubtORM.author_id == profile.user_id)
    )
    answers_count = await session.scalar(
        select(func.count(AnswerORM.id)).where(AnswerORM.author_id == profile.user_id)
    )
    return {
        "id": profile.id, "userId": profile.user_id,
        "username": profile.username, "displayName": profile.display_name,
        "bio": profile.bio, "avatarUrl": profile.avatar_url,
        "website": profile.website,
        "postsCount": posts_count or 0,
        "doubtsCount": doubts_count or 0,
        "answersCount": answers_count or 0,
        "createdAt": profile.created_at, "updatedAt": profile.updated_at,
    }
