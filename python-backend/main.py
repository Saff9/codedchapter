"""
main.py
=======
FastAPI application entry point for Coded Chapter Python backend.

Startup sequence:
  1. Load settings from environment
  2. Initialize database engine (if DATABASE_URL is set)
  3. Warm the Substack RSS cache (if USE_SUBSTACK=true)
  4. Register all middleware (security headers, CORS, rate limiting)
  5. Mount all API routers under /api

To run locally:
    uvicorn main:app --reload --port 8000

To run in production (Docker):
    gunicorn main:app -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:8000
"""

import logging
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware

from config import get_settings
from middleware.security import SecurityHeadersMiddleware
import services.database as db_svc
import services.substack as substack_svc
from routers.posts import router as posts_router
from routers.doubts import router as doubts_router
from routers.profiles import router as profiles_router
from routers.health import router as health_router

# ── Structured Logging Setup ──────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)
logging.basicConfig(level=logging.INFO)
logger = structlog.get_logger(__name__)

# ── Rate Limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


# ── Application Lifespan ──────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle handler.

    Startup:
        - Initialize database connection pool (if DATABASE_URL is configured)
        - Pre-warm the Substack RSS cache (if USE_SUBSTACK=true)

    Shutdown:
        - Gracefully close the database connection pool
    """
    settings = get_settings()
    logger.info("Starting Coded Chapter API", environment=settings.environment)

    # Initialize DB if configured
    if settings.database_url:
        try:
            db_svc.init_db(settings.database_url)
            logger.info("Database connection pool initialized")
        except Exception as exc:
            logger.warning("Database init failed — DB write endpoints will be unavailable", error=str(exc))
    else:
        logger.warning("DATABASE_URL not set — DB-backed features disabled")

    # Pre-warm Substack cache
    if settings.use_substack:
        try:
            posts = await substack_svc.get_substack_posts(
                settings.substack_feed_url,
                ttl=settings.substack_cache_ttl_seconds,
            )
            logger.info("Substack cache warmed", post_count=len(posts))
        except Exception as exc:
            logger.warning("Substack cache warm failed — will retry on first request", error=str(exc))

    yield  # App is now running and serving requests

    # Shutdown
    if settings.database_url:
        await db_svc.close_db()
    logger.info("Coded Chapter API shut down gracefully")


# ── FastAPI App Instance ──────────────────────────────────────────────────────

settings = get_settings()

app = FastAPI(
    title="Coded Chapter API",
    description=(
        "REST API for Coded Chapter — a developer learning blog. "
        "Currently reads posts from Substack RSS (USE_SUBSTACK=true). "
        "Switch to USE_SUBSTACK=false to use the PostgreSQL database."
    ),
    version="2.0.0",
    docs_url="/api/docs" if not settings.is_production else None,   # Disable Swagger in prod
    redoc_url="/api/redoc" if not settings.is_production else None, # Disable ReDoc in prod
    openapi_url="/api/openapi.json" if not settings.is_production else None,
    lifespan=lifespan,
)

# ── Middleware Stack ──────────────────────────────────────────────────────────
# Order matters: middlewares wrap the request from outermost to innermost.

# 1. Security headers (always applied first)
app.add_middleware(SecurityHeadersMiddleware)

# 2. CORS (must be before routing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
    expose_headers=["X-Rate-Limit-Limit", "X-Rate-Limit-Remaining", "X-Rate-Limit-Reset"],
    max_age=600,  # Cache preflight for 10 minutes
)

# 3. Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── Request Logging Middleware ────────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests with method, path, and response status."""
    log = structlog.get_logger("http")
    response = await call_next(request)
    log.info(
        "request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        client=request.client.host if request.client else "unknown",
    )
    return response


# ── Global Exception Handler ──────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all handler for unhandled exceptions. Never leaks stack traces in production."""
    logger.error("Unhandled exception", path=request.url.path, error=str(exc), exc_info=True)
    body: dict = {"error": "Internal server error"}
    if settings.is_development:
        body["detail"] = str(exc)
    return JSONResponse(status_code=500, content=body)


# ── API Routers ───────────────────────────────────────────────────────────────

app.include_router(health_router, prefix="/api")
app.include_router(posts_router, prefix="/api")
app.include_router(doubts_router, prefix="/api")
app.include_router(profiles_router, prefix="/api")


# ── Root Redirect ─────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    """Root redirect — tells clients where to find the API."""
    return {
        "service": "Coded Chapter API",
        "version": "2.0.0",
        "docs": "/api/docs" if settings.is_development else "disabled in production",
        "health": "/api/health",
    }
