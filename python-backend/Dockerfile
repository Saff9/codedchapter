# ──────────────────────────────────────────────────────────────────────────────
# Coded Chapter — Python Backend Dockerfile
#
# Build stages:
#   builder     — installs Python deps + compiles rss_parser.c
#   production  — minimal runtime image, no build tools
# ──────────────────────────────────────────────────────────────────────────────

FROM python:3.12-slim AS base

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1


# ── Builder Stage ─────────────────────────────────────────────────────────────
# Has gcc so we can compile rss_parser.c.
# Nothing from this stage leaks into the final image except what we COPY.
FROM base AS builder

# gcc for the C RSS parser, curl for the health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Install Python dependencies
COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# Copy source and compile the C RSS parser into a shared library.
# If gcc somehow fails, build_c.py exits 1 but we ignore it (|| true)
# so the image still builds and the server falls back to the Python parser.
COPY rss_parser.c build_c.py ./
RUN python build_c.py || true


# ── Final Production Image ────────────────────────────────────────────────────
# Does NOT include gcc — smaller attack surface.
FROM base AS production

# curl stays in the final image for the health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Non-root user — if an attacker breaks out of the app, they get this user,
# not root, and can't write to system paths.
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Python packages from builder
COPY --from=builder /install /usr/local

# Application code
COPY . .

# Compiled C shared library from builder (may not exist if gcc failed — that's ok)
COPY --from=builder /build/rss_parser.so ./rss_parser.so 2>/dev/null || true

# Lock down ownership
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Docker monitors this. If /api/health returns non-200 three times in a row,
# Docker marks the container unhealthy and Render/Railway will restart it.
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Gunicorn + Uvicorn workers for async FastAPI.
# Workers = (2 × vCPUs) + 1. Render free tier has 1 vCPU so 3 is fine.
CMD ["gunicorn", "main:app", \
    "--worker-class", "uvicorn.workers.UvicornWorker", \
    "--workers", "3", \
    "--bind", "0.0.0.0:8000", \
    "--timeout", "120", \
    "--keepalive", "5", \
    "--access-logfile", "-", \
    "--error-logfile", "-", \
    "--log-level", "info"]
