# Coded Chapter — Python Backend

A production-ready **FastAPI** backend for Coded Chapter — a developer learning blog.

## Architecture Overview

```
python-backend/
├── main.py                  # App entry point — CORS, middleware, routers
├── config.py                # All settings via Pydantic (reads from .env)
├── requirements.txt         # Pinned Python dependencies
├── Dockerfile               # Production Docker image
├── .env.example             # All environment variable docs
│
├── models/                  # Pydantic v2 request/response schemas
│   ├── post.py              # Post, PostCreate, PostUpdate, PostSummary
│   ├── comment.py           # Comment, CommentCreate
│   ├── doubt.py             # Doubt, Answer, DoubtWithAnswers, AnswerCreate
│   └── profile.py           # Profile, ProfileUpsert
│
├── services/
│   ├── substack.py          # Substack RSS parser + TTL cache (current data source)
│   └── database.py          # SQLAlchemy async ORM service (ready for when you switch)
│
├── middleware/
│   ├── auth.py              # Supabase JWT validation helpers
│   └── security.py          # HTTP security headers middleware
│
└── routers/
    ├── posts.py             # GET/POST/PUT/DELETE /api/posts + comments
    ├── doubts.py            # GET/POST/DELETE /api/doubts + answers + accept
    ├── profiles.py          # GET/POST /api/profiles
    └── health.py            # GET /api/health
```

---

## Quick Start (Local Development)

### 1. Prerequisites

- Python 3.12+
- pip or pipx

### 2. Install dependencies

```bash
cd python-backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 4. Run the server

```bash
uvicorn main:app --reload --port 8000
```

The API is now running at **http://localhost:8000**

Interactive API docs: **http://localhost:8000/api/docs** (development mode only)

---

## Switching from Substack to Your Own Database

Right now, all article reads go to the **Substack RSS feed**. When you're ready to use your own PostgreSQL database:

### Step 1: Update your `.env`

```bash
# Change this line:
USE_SUBSTACK=true
# To:
USE_SUBSTACK=false
```

### Step 2: Make sure DATABASE_URL is set

```bash
DATABASE_URL=postgresql+asyncpg://postgres:password@host:5432/coded_chapter
```

### Step 3: Run database migrations

```bash
# (Alembic migrations match the TypeScript Drizzle ORM schema)
alembic upgrade head
```

### Step 4: Restart the server

```bash
uvicorn main:app --reload --port 8000
```

That's it. **No code changes needed** — only the env variable.

---

## API Reference

### Posts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/posts` | No | List posts (paginated, filterable by tag/category) |
| GET | `/api/posts/featured` | No | Latest 3 posts for homepage |
| GET | `/api/posts/tags` | No | All unique tags |
| GET | `/api/posts/{id}` | No | Single post by ID |
| POST | `/api/posts` | Admin | Create a post |
| PUT | `/api/posts/{id}` | Admin | Update a post |
| DELETE | `/api/posts/{id}` | Admin | Delete a post |
| GET | `/api/posts/{id}/comments` | No | List comments on a post |
| POST | `/api/posts/{id}/comments` | Auth | Add a comment |
| DELETE | `/api/posts/{id}/comments/{cid}` | Auth | Delete your comment |

### Doubts (Q&A)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/doubts` | No | List doubts |
| GET | `/api/doubts/{id}` | No | Get doubt with answers |
| POST | `/api/doubts` | Auth | Ask a doubt |
| DELETE | `/api/doubts/{id}` | Auth | Delete your doubt |
| POST | `/api/doubts/{id}/answers` | Auth | Answer a doubt |
| DELETE | `/api/doubts/{id}/answers/{aid}` | Auth | Delete your answer |
| PATCH | `/api/doubts/{id}/answers/{aid}/accept` | Auth | Accept an answer |

### Profiles

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/profiles/me` | Auth | Get your profile |
| GET | `/api/profiles/{username}` | No | Get public profile |
| GET | `/api/profiles/check-username/{u}` | No | Check username availability |
| POST | `/api/profiles` | Auth | Create/update profile |

---

## Production Deployment

### Docker

```bash
# Build image
docker build -t coded-chapter-api ./python-backend

# Run
docker run -p 8000:8000 \
  -e DATABASE_URL="..." \
  -e SUPABASE_JWT_SECRET="..." \
  -e ADMIN_EMAIL="..." \
  -e USE_SUBSTACK=true \
  coded-chapter-api
```

### Render / Railway (recommended)

1. Connect your GitHub repo
2. Set **Root Directory** to `python-backend`
3. Set **Build Command**: `pip install -r requirements.txt`
4. Set **Start Command**: `gunicorn main:app -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:$PORT`
5. Add all environment variables from `.env.example`

### Health Check

The `/api/health` endpoint returns:
```json
{
  "status": "ok",
  "service": "Coded Chapter API (Python)",
  "timestamp": "2026-06-23T17:00:00+00:00"
}
```

---

## Security Features

- ✅ **Supabase JWT validation** — All protected routes verify Bearer tokens
- ✅ **Rate limiting** — SlowAPI prevents abuse (100 req/min public, 30/min auth)
- ✅ **Security headers** — X-Frame-Options, X-Content-Type-Options, HSTS, etc.
- ✅ **CORS** — Allowlist-only (no wildcard origins in production)
- ✅ **No stack traces in production** — Errors return generic messages only
- ✅ **Non-root Docker user** — Container runs as `appuser`, not root
- ✅ **Connection pool** — SQLAlchemy pool with pre-ping and recycle

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | When `USE_SUBSTACK=false` | — | Async PostgreSQL connection string |
| `SUPABASE_JWT_SECRET` | Yes | — | Found in Supabase Dashboard → API → JWT Secret |
| `ADMIN_EMAIL` | Yes | — | The only email that can create/edit posts |
| `USE_SUBSTACK` | No | `true` | Set `false` to switch to own database |
| `SUBSTACK_FEED_URL` | No | codedchapter.substack.com/feed | Your Substack RSS URL |
| `FRONTEND_URL` | No | codedchapter.vercel.app | For CORS allowlist |
| `ENVIRONMENT` | No | `production` | `development` enables /api/docs |
