"""
routers/health.py
=================
Health check endpoint. Used by load balancers and uptime monitors.
"""

from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Health check")
async def health():
    """Returns server status and current UTC timestamp."""
    return {
        "status": "ok",
        "service": "Coded Chapter API (Python)",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
