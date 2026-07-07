# Coded Chapter — Python Backend

FastAPI rewrite of the Coded Chapter API. Same routes, same response shapes as the Node backend. Switch to this by pointing Render at the Dockerfile in this directory — no frontend changes needed.

---

## What is different from the Node backend

- FastAPI instead of Express. Async from the ground up.
- Pydantic v2 for input validation instead of Zod.
- SQLAlchemy async instead of Drizzle ORM.
- Alembic instead of Drizzle Kit for migrations.
- The RSS parser is a C shared library called via Python `ctypes`. On Windows dev machines without gcc it falls back to the pure-Python parser automatically.
- Structured JSON logs via `structlog` instead of pino.

---

## File layout

```
python-backend/
├── main.py              App entry point. Sets up middleware, routers, lifespan.
├── config.py            All settings via Pydantic. Reads from .env file.
├── requirements.txt     Pinned Python dependencies.
├── Dockerfile           Two-stage build: compiles C, then drops gcc from final image.
├── build_c.py           Compiles rss_parser.c locally. Run once before dev or skip it.
├── rss_parser.c         C99 RSS parser. No dependencies. Called from Python via ctypes.
│
├── models/
│   ├── post.py          Post, PostCreate, PostUpdate
│   ├── comment.py       Comment, CommentCreate
│   ├── doubt.py         Doubt, Answer, DoubtWithAnswers
│   └── profile.py       Profile, ProfileUpsert
│
├── services/
│   ├── substack.py      RSS fetch, C/Python parser routing, TTL cache, SSRF guard
│   └── database.py      SQLAlchemy async session + all DB queries
│
├── middleware/
│   ├── auth.py          Supabase JWT decode, require_auth, require_admin dependencies
│   └── security.py      CSP and security headers middleware
│
└── routers/
    ├── posts.py         /api/posts and /api/posts/{id}/comments
    ├── doubts.py        /api/doubts and answers
    ├── profiles.py      /api/profiles
    └── health.py        /api/health
```

---

## Running locally

```bash
cd python-backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Optional: compile the C RSS parser
# Requires gcc. On Windows, skip this and the Python parser runs instead.
python build_c.py

# Copy env file and fill in your values
cp .env.example .env

# Start dev server
uvicorn main:app --reload --port 8000
```

API: http://localhost:8000

Interactive docs (dev mode only): http://localhost:8000/api/docs

---

## The C RSS parser

The RSS feed from Substack is parsed by `rss_parser.c`, a C99 file with no external dependencies. Python loads the compiled `.so` at startup via `ctypes` and calls:

```c
char* parse_rss_xml(const char* xml, int xml_len, int* out_count);
void  free_rss_result(char* ptr);
```

The C code:
1. Splits the XML on `<item` boundaries
2. Extracts title, link, pubDate, description, content:encoded, category tags
3. Handles `<![CDATA[...]]>` sections
4. Finds the first `<img src="...">` for the cover image
5. Strips HTML and truncates to a 200-char excerpt
6. Counts words to estimate reading time
7. Hashes the post URL to a stable integer ID
8. Classifies `"tech"` or `"general"` from tag keywords
9. Returns a JSON array as a heap-allocated string

Python reads the JSON, converts it to `Post` objects, and frees the C pointer.

If the `.so` is not found (no gcc on the machine), `substack.py` falls back to a pure-Python implementation silently. In production the Dockerfile handles the compilation.

**Compile manually:**
```bash
gcc -O2 -shared -fPIC -o rss_parser.so rss_parser.c
```

---

## Switching from Substack to your own database

Right now all post reads go to the Substack RSS feed. When you are ready to use your own database:

**Step 1 — Update .env**
```
USE_SUBSTACK=false
```

**Step 2 — Make sure DATABASE_URL is set**
```
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/coded_chapter
```

**Step 3 — Run migrations**
```bash
alembic upgrade head
```

**Step 4 — Restart**
```bash
uvicorn main:app --reload --port 8000
```

No code changes needed. Only the env variable controls which data source the routers use.

---

## Deploying to production (Docker)

The Dockerfile is a two-stage build:
1. Builder stage: has `gcc`, installs Python deps, compiles `rss_parser.c`
2. Production stage: no `gcc`, copies only the compiled `.so` and the app code

This keeps the final image small and removes the C compiler from the runtime environment (smaller attack surface).

```bash
# Build
docker build -t coded-chapter-python ./python-backend

# Run
docker run -p 8000:8000 \
  -e SUPABASE_JWT_SECRET="..." \
  -e ADMIN_EMAIL="..." \
  -e USE_SUBSTACK=true \
  coded-chapter-python
```

### Render deployment

1. Create a new Web Service on Render.
2. Set root directory to `python-backend`.
3. Set environment to Docker. Render reads the Dockerfile automatically.
4. Add environment variables from `.env.example`.
5. Deploy.

Render will build the image, compile the C parser inside the builder stage, and start gunicorn with 3 uvicorn workers.

---

## API routes

### Posts

| Method | Path | Auth | What it does |
|---|---|---|---|
| GET | `/api/posts` | No | List posts, filterable by tag and category |
| GET | `/api/posts/featured` | No | Latest 3 posts for the homepage |
| GET | `/api/posts/tags` | No | All unique tags |
| GET | `/api/posts/{id}` | No | Single post by ID |
| POST | `/api/posts` | Admin | Create a post |
| PUT | `/api/posts/{id}` | Admin | Update a post |
| DELETE | `/api/posts/{id}` | Admin | Delete a post |
| GET | `/api/posts/{id}/comments` | No | List comments on a post |
| POST | `/api/posts/{id}/comments` | Auth | Add a comment |
| DELETE | `/api/posts/{id}/comments/{cid}` | Auth | Delete your comment |

### Doubts (Q&A board)

| Method | Path | Auth | What it does |
|---|---|---|---|
| GET | `/api/doubts` | No | List all doubts |
| GET | `/api/doubts/{id}` | No | Get a doubt and all its answers |
| POST | `/api/doubts` | Auth | Ask a doubt |
| DELETE | `/api/doubts/{id}` | Auth | Delete your doubt |
| POST | `/api/doubts/{id}/answers` | Auth | Answer a doubt |
| DELETE | `/api/doubts/{id}/answers/{aid}` | Auth | Delete your answer |
| PATCH | `/api/doubts/{id}/answers/{aid}/accept` | Auth | Mark an answer as accepted |

### Profiles

| Method | Path | Auth | What it does |
|---|---|---|---|
| GET | `/api/profiles/me` | Auth | Your own profile |
| GET | `/api/profiles/{username}` | No | Any public profile |
| GET | `/api/profiles/check-username/{u}` | No | Check if a username is taken |
| POST | `/api/profiles` | Auth | Create or update your profile |

### Health

| Method | Path | What it returns |
|---|---|---|
| GET | `/api/health` | `{"status": "ok", "timestamp": "..."}` |

---

## Security

- Supabase JWT verification on all protected routes. Algorithm pinned to HS256.
- Rate limiting via SlowAPI: 100 requests/min on public endpoints, 30/min on auth endpoints.
- CSP and security headers applied to every response.
- CORS allowlist — no wildcard origins in production.
- SSRF guard on the RSS fetcher: only `*.substack.com` is allowed as a feed URL.
- 10-second timeout on all RSS fetches.
- Stack traces never sent to clients in production.
- Docker container runs as a non-root user (`appuser`).

---

## Environment variables

| Variable | Required | Default | What it is |
|---|---|---|---|
| `SUPABASE_JWT_SECRET` | Yes | | Supabase Dashboard > Settings > API > JWT Secret |
| `ADMIN_EMAIL` | Yes | | The only email that can create or delete posts |
| `DATABASE_URL` | When USE_SUBSTACK=false | | Async Postgres string: `postgresql+asyncpg://...` |
| `SUPABASE_URL` | No | | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | No | | Your Supabase anon key |
| `USE_SUBSTACK` | No | `true` | Set `false` to read posts from the database instead |
| `SUBSTACK_FEED_URL` | No | codedchapter.substack.com/feed | Your Substack RSS URL |
| `FRONTEND_URL` | No | codedchapter.vercel.app | Added to CORS allowlist |
| `ENVIRONMENT` | No | `production` | Set `development` to enable /api/docs |
| `PORT` | No | `8000` | Server port |

Full reference with comments: [`.env.example`](.env.example)
