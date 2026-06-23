"""
routers/doubts.py
=================
Doubts (Q&A) API — full CRUD with answers and accept answer.
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from middleware.auth import get_current_user, require_auth, AuthUser
import services.database as db_svc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/doubts", tags=["Doubts"])


@router.get("/", summary="List all doubts")
async def list_doubts(
    tag: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    author_id: Optional[str] = Query(None, alias="authorId"),
):
    """Returns paginated list of community doubts/questions."""
    try:
        return await db_svc.list_doubts(tag=tag, limit=limit, offset=offset, author_id=author_id)
    except Exception as exc:
        logger.error("list_doubts failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch doubts")


@router.get("/{doubt_id}", summary="Get a doubt with its answers")
async def get_doubt(doubt_id: int):
    """Returns a single doubt and all its answers."""
    try:
        doubt = await db_svc.get_doubt(doubt_id)
        if not doubt:
            raise HTTPException(status_code=404, detail="Doubt not found")
        return doubt
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("get_doubt(%d) failed: %s", doubt_id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch doubt")


@router.post("/", status_code=201, summary="Create a doubt/question")
async def create_doubt(
    body: dict,
    user: AuthUser = Depends(require_auth),
):
    """Create a new doubt. Requires authentication."""
    try:
        profile = await db_svc.get_profile_by_user_id(user.user_id)
        return await db_svc.create_doubt(
            user_id=user.user_id,
            author_name=user.full_name or user.email.split("@")[0],
            author_username=profile["username"] if profile else None,
            data=body,
        )
    except Exception as exc:
        logger.error("create_doubt failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create doubt")


@router.delete("/{doubt_id}", summary="Delete a doubt")
async def delete_doubt(
    doubt_id: int,
    user: AuthUser = Depends(require_auth),
):
    """Delete your doubt. Only the author can delete."""
    try:
        deleted = await db_svc.delete_doubt(doubt_id=doubt_id, user_id=user.user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Doubt not found")
        return {"success": True}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Forbidden")
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("delete_doubt(%d) failed: %s", doubt_id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete doubt")


@router.post("/{doubt_id}/answers", status_code=201, summary="Answer a doubt")
async def create_answer(
    doubt_id: int,
    body: dict,
    user: AuthUser = Depends(require_auth),
):
    """Post an answer to a doubt. Requires authentication."""
    content = body.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Content is required")
    try:
        profile = await db_svc.get_profile_by_user_id(user.user_id)
        return await db_svc.create_answer(
            doubt_id=doubt_id,
            author_id=user.user_id,
            author_name=user.full_name or user.email.split("@")[0],
            author_username=profile["username"] if profile else None,
            content=content,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.error("create_answer failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create answer")


@router.delete("/{doubt_id}/answers/{answer_id}", summary="Delete an answer")
async def delete_answer(
    doubt_id: int,
    answer_id: int,
    user: AuthUser = Depends(require_auth),
):
    """Delete your answer. Only the answer author can delete."""
    try:
        deleted = await db_svc.delete_answer(doubt_id=doubt_id, answer_id=answer_id, user_id=user.user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Answer not found")
        return {"success": True}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Forbidden")
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("delete_answer failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete answer")


@router.patch("/{doubt_id}/answers/{answer_id}/accept", summary="Accept an answer")
async def accept_answer(
    doubt_id: int,
    answer_id: int,
    user: AuthUser = Depends(require_auth),
):
    """Mark an answer as accepted. Only the doubt author can accept."""
    try:
        return await db_svc.accept_answer(doubt_id=doubt_id, answer_id=answer_id, user_id=user.user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except PermissionError:
        raise HTTPException(status_code=403, detail="Forbidden")
    except Exception as exc:
        logger.error("accept_answer failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to accept answer")
