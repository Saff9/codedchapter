"""
routers/posts.py
================
Posts API — full CRUD.

DATA SOURCE:
    - USE_SUBSTACK=true  → reads from Substack RSS (current default)
    - USE_SUBSTACK=false → reads from PostgreSQL via services/database.py

All write endpoints (POST, PUT, DELETE) always go to the database.
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from slowapi import Limiter
from slowapi.util import get_remote_address

from config import get_settings, Settings
from middleware.auth import get_current_user, require_auth, require_admin, AuthUser
import services.substack as substack_svc
import services.database as db_svc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/posts", tags=["Posts"])
limiter = Limiter(key_func=get_remote_address)


def _cache_headers(response: Response, max_age: int) -> None:
    """Apply Cache-Control headers for CDN and browser caching."""
    response.headers["Cache-Control"] = f"public, max-age={max_age}, stale-while-revalidate={max_age * 2}"


# ── GET /api/posts ────────────────────────────────────────────────────────────

@router.get("/", summary="List posts")
async def list_posts(
    response: Response,
    category: Optional[str] = Query(None, description="Filter by 'tech' or 'general'"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    author_id: Optional[str] = Query(None, alias="authorId"),
    settings: Settings = Depends(get_settings),
):
    """
    Returns a paginated list of posts.

    - **Current mode (USE_SUBSTACK=true)**: Fetched from Substack RSS.
    - **Future mode (USE_SUBSTACK=false)**: Fetched from PostgreSQL.
    """
    _cache_headers(response, 60)
    try:
        # ── SUBSTACK MODE ───────────────────────────────────────────────
        # TODO: Remove this block when switching to your own database.
        #       Set USE_SUBSTACK=false in .env to bypass this.
        if settings.use_substack:
            posts = await substack_svc.get_substack_posts(
                settings.substack_feed_url,
                ttl=settings.substack_cache_ttl_seconds,
            )
            # Apply filters manually since RSS has no server-side filtering
            if tag:
                posts = [p for p in posts if tag.lower() in p.tags]
            if category:
                posts = [p for p in posts if p.category == category]
            return [p.model_dump(by_alias=True) for p in posts[offset: offset + limit]]

        # ── DATABASE MODE ───────────────────────────────────────────────
        # This path is active when USE_SUBSTACK=false
        return await db_svc.list_posts(category=category, tag=tag, limit=limit, offset=offset, author_id=author_id)

    except Exception as exc:
        logger.error("list_posts failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail="Failed to fetch posts")


# ── GET /api/posts/featured ───────────────────────────────────────────────────

@router.get("/featured", summary="Featured posts (latest 3)")
async def get_featured_posts(
    response: Response,
    settings: Settings = Depends(get_settings),
):
    """Returns the 3 most recent posts for the homepage hero."""
    _cache_headers(response, 120)
    try:
        if settings.use_substack:
            posts = await substack_svc.get_substack_posts(
                settings.substack_feed_url,
                ttl=settings.substack_cache_ttl_seconds,
            )
            return [p.model_dump(by_alias=True) for p in posts[:3]]
        return await db_svc.get_featured_posts()
    except Exception as exc:
        logger.error("get_featured_posts failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail="Failed to fetch featured posts")


# ── GET /api/posts/tags ───────────────────────────────────────────────────────

@router.get("/tags", summary="All unique tags")
async def get_all_tags(
    response: Response,
    settings: Settings = Depends(get_settings),
):
    """Returns all unique tags across all posts."""
    _cache_headers(response, 300)
    try:
        if settings.use_substack:
            posts = await substack_svc.get_substack_posts(
                settings.substack_feed_url,
                ttl=settings.substack_cache_ttl_seconds,
            )
            tag_set: set[str] = set()
            for p in posts:
                tag_set.update(p.tags)
            return sorted(tag_set)
        return await db_svc.get_all_tags()
    except Exception as exc:
        logger.error("get_all_tags failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail="Failed to fetch tags")


# ── GET /api/posts/{id} ───────────────────────────────────────────────────────

@router.get("/{post_id}", summary="Get single post by ID")
async def get_post(
    post_id: int,
    response: Response,
    settings: Settings = Depends(get_settings),
):
    """Returns a single post by its numeric ID."""
    _cache_headers(response, 60)
    try:
        if settings.use_substack:
            posts = await substack_svc.get_substack_posts(
                settings.substack_feed_url,
                ttl=settings.substack_cache_ttl_seconds,
            )
            post = next((p for p in posts if p.id == post_id), None)
            if not post:
                raise HTTPException(status_code=404, detail="Post not found")
            return post.model_dump(by_alias=True)
        post = await db_svc.get_post(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        return post
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("get_post(%d) failed: %s", post_id, exc, exc_info=True)
        raise HTTPException(status_code=502, detail="Failed to fetch post")


# ── POST /api/posts ───────────────────────────────────────────────────────────

@router.post("/", status_code=201, summary="Create a post (admin only)")
async def create_post(
    body: dict,
    user: AuthUser = Depends(require_admin),
):
    """
    Create a new post. Admin only.
    Always writes to the database regardless of USE_SUBSTACK setting.
    """
    try:
        return await db_svc.create_post(
            user_id=user.user_id,
            author_name=user.full_name or "CodedChapter",
            data=body,
        )
    except Exception as exc:
        logger.error("create_post failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create post")


# ── PUT /api/posts/{id} ───────────────────────────────────────────────────────

@router.put("/{post_id}", summary="Update a post (admin only)")
async def update_post(
    post_id: int,
    body: dict,
    user: AuthUser = Depends(require_admin),
):
    """Update a post by ID. Admin only."""
    try:
        return await db_svc.update_post(post_id=post_id, user_id=user.user_id, data=body)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except PermissionError:
        raise HTTPException(status_code=403, detail="Forbidden")
    except Exception as exc:
        logger.error("update_post(%d) failed: %s", post_id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update post")


# ── DELETE /api/posts/{id} ────────────────────────────────────────────────────

@router.delete("/{post_id}", summary="Delete a post (admin only)")
async def delete_post(
    post_id: int,
    user: AuthUser = Depends(require_admin),
):
    """Delete a post and all its comments. Admin only."""
    try:
        deleted = await db_svc.delete_post(post_id=post_id, user_id=user.user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Post not found")
        return {"success": True}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Forbidden")
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("delete_post(%d) failed: %s", post_id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete post")


# ── GET /api/posts/{id}/comments ──────────────────────────────────────────────

@router.get("/{post_id}/comments", summary="List comments on a post")
async def list_comments(post_id: int):
    """Returns all comments for a post, newest first."""
    try:
        return await db_svc.list_comments(post_id)
    except Exception as exc:
        logger.error("list_comments(%d) failed: %s", post_id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch comments")


# ── POST /api/posts/{id}/comments ─────────────────────────────────────────────

@router.post("/{post_id}/comments", status_code=201, summary="Add a comment")
async def create_comment(
    post_id: int,
    body: dict,
    user: AuthUser = Depends(require_auth),
):
    """Create a comment on a post. Requires authentication."""
    content = body.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Content is required")
    try:
        return await db_svc.create_comment(
            post_id=post_id,
            author_id=user.user_id,
            author_name=user.full_name or user.email.split("@")[0],
            content=content,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.error("create_comment failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create comment")


# ── DELETE /api/posts/{id}/comments/{cid} ─────────────────────────────────────

@router.delete("/{post_id}/comments/{comment_id}", summary="Delete a comment")
async def delete_comment(
    post_id: int,
    comment_id: int,
    user: AuthUser = Depends(require_auth),
):
    """Delete your own comment. Requires authentication."""
    try:
        deleted = await db_svc.delete_comment(comment_id=comment_id, user_id=user.user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Comment not found")
        return {"success": True}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Forbidden")
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("delete_comment failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete comment")
