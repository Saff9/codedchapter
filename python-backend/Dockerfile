# ──────────────────────────────────────────────────────────────────────────────
# Coded Chapter — Python Backend Dockerfile
# Production-ready Docker image using Python 3.12 slim
# ──────────────────────────────────────────────────────────────────────────────

FROM python:3.12-slim AS base

# System hardening — no interactive apt prompts
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install only essential system deps (no build tools bloat)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── Builder Stage ─────────────────────────────────────────────────────────────
FROM base AS builder

WORKDIR /build

COPY requirements.txt .

# Install all Python dependencies into /install for clean copy
RUN pip install --prefix=/install -r requirements.txt

# ── Final Production Image ────────────────────────────────────────────────────
FROM base AS production

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Fix permissions
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 8000

# Health check — Docker monitors this to restart unhealthy containers
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Start with Gunicorn + Uvicorn workers for production
# - 4 workers = good for most Render/Railway instances (2 vCPU)
# - Adjust -w based on available CPUs: (2 × CPUs) + 1
CMD ["gunicorn", "main:app", \
    "--worker-class", "uvicorn.workers.UvicornWorker", \
    "--workers", "4", \
    "--bind", "0.0.0.0:8000", \
    "--timeout", "120", \
    "--keepalive", "5", \
    "--access-logfile", "-", \
    "--error-logfile", "-", \
    "--log-level", "info"]
