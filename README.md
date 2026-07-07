# Coded Chapter

My public dev log. I am learning to code and writing down everything as it happens: bugs, concepts, mistakes, and whatever finally clicked that day. This is the site that hosts all of it.

Currently working through: CS50x, Linux, PostgreSQL. Finished CS50P (Python) earlier.

---

## What this site does

- Posts pulled directly from my Substack RSS feed. I write there, they show up here automatically.
- Tech Logs for dev posts and General Logs for everything else.
- A doubts board where anyone can ask or answer coding questions.
- An about page tracking my full learning journey.

---

## Tech stack

| Layer | What it uses |
|---|---|
| Frontend | React 19, Vite, TanStack Query, Framer Motion, Tailwind |
| Backend (Node) | Express 5, Drizzle ORM, PostgreSQL |
| Backend (Python) | FastAPI, SQLAlchemy async, Pydantic v2 |
| RSS Parser | C99 shared library compiled at Docker build time, called from Python via ctypes |
| Auth | Supabase Auth, JWT verified server-side |
| Content | Substack RSS feed (no CMS, no manual publishing step) |
| Rate limiting | Upstash Redis, falls back to in-memory |
| Frontend deploy | Vercel |
| Backend deploy | Render (Docker) |

---

## Repo layout

```
frontend/        React app (Vite)
backend/         Express + Drizzle ORM (Node backend)
python-backend/  FastAPI + C RSS parser (Python backend)
api/             Vercel serverless entry, re-exports backend/src/app.ts
```

There are two backends. The Node backend is what currently runs on Render. The Python backend is the rewrite — same API, same routes, same response shapes. When you are ready to switch, you point Render at the Python backend Dockerfile and change nothing on the frontend.

---

## Running locally

### Node backend (currently live)

```bash
pnpm install
cp .env.example .env
# fill in DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_JWT_SECRET
pnpm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000

Without DATABASE_URL the app runs with an in-memory database. Good enough to see the UI.

### Python backend

```bash
cd python-backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
python build_c.py            # optional: compiles the C RSS parser
cp .env.example .env
uvicorn main:app --reload --port 8000
```

- API: http://localhost:8000
- Docs (dev only): http://localhost:8000/api/docs

If `build_c.py` fails because you have no gcc, the server still starts and uses the Python RSS parser instead. The C parser only matters in production (Docker handles compilation automatically).

---

## Deploying to production

### Frontend (Vercel)

1. Connect this repo to Vercel.
2. Set these environment variables in the Vercel dashboard:
   - `VITE_API_URL` — your Render backend URL
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon key
3. Push to `main`. Vercel picks up `vercel-build` from `package.json` automatically.

### Backend on Render

**Option A — Node backend (current)**

Click to deploy with the blueprint:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Saff9/codedchapter)

Render reads `render.yaml` and asks for:
- `DATABASE_URL`, `FRONTEND_URL`, `SUPABASE_JWT_SECRET`, `ADMIN_EMAIL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`

**Option B — Python backend (Docker)**

1. In Render, create a new Web Service.
2. Set root directory to `python-backend`.
3. Set environment to Docker. Render will use the Dockerfile automatically.
4. Add the same environment variables listed in `python-backend/.env.example`.

The Docker build compiles `rss_parser.c` into a shared library during the image build step. The compiled `.so` ships inside the image so there is no build cost at runtime.

---

## How the C RSS parser works

The Substack RSS feed is parsed by a C99 shared library (`rss_parser.c`). Python loads it at startup via `ctypes` and calls one function:

```c
char* parse_rss_xml(const char* xml, int xml_len, int* out_count);
void  free_rss_result(char* ptr);
```

The C code splits the XML on `<item` boundaries, extracts each field with bounds-checked string scanning, handles `CDATA` sections, finds cover images, counts words for reading time, and returns a JSON array. Python reads the JSON and frees the pointer.

Why C for this specifically:
- RSS parsing is pure string processing, no I/O, no network. Exactly where C is safe to use.
- It runs in the same process as Python, so no subprocess overhead.
- If the `.so` is not found (Windows dev machine), `substack.py` falls back to the pure-Python parser automatically. Nothing breaks.

---

## How Substack content works

I write posts on Substack. Both backends fetch the RSS feed, parse it, and cache it in memory for 5 minutes. No CMS, no database writes for content. If you just posted on Substack and it is not showing, wait 5 minutes or restart the server.

Cover images come from the first `<img>` tag in the RSS content field. If a post has no image the card just shows without one.

---

## Security

Both backends have the same protections:

- Content-Security-Policy header on every response
- JWT verification: HS256 only, expiry checked, not-before claim checked
- Rate limiting: 300 reads/min and 30 writes/min per IP
- SSRF protection on the RSS fetcher: only `*.substack.com` URLs are allowed
- 10-second timeout on all RSS fetches
- HSTS enabled in production
- Input validation (Zod on Node, Pydantic on Python)
- SQL injection protection via parameterised queries
- Docker container runs as a non-root user

---

## Environment variables

Full list with descriptions is in [`.env.example`](.env.example) (Node) and [`python-backend/.env.example`](python-backend/.env.example) (Python).

| Variable | Where to get it | Required |
|---|---|---|
| `DATABASE_URL` | Supabase > Project Settings > Database | Yes |
| `SUPABASE_URL` | Supabase > Project Settings > API | Yes |
| `SUPABASE_ANON_KEY` | Supabase > Project Settings > API | Yes |
| `SUPABASE_JWT_SECRET` | Supabase > Project Settings > API > JWT Secret | Yes |
| `ADMIN_EMAIL` | Your email, only this address can publish posts | Yes |
| `VITE_SUPABASE_URL` | Same as SUPABASE_URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Same as SUPABASE_ANON_KEY | Yes |
| `VITE_API_URL` | Your Render backend URL | Production only |
| `FRONTEND_URL` | Your Vercel URL | Production only |
| `UPSTASH_REDIS_REST_URL` | Upstash console | Optional |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash console | Optional |
| `PORT` | Leave as 5000 for Node, 8000 for Python | Optional |

---

## Database

Migrations for the Node backend live in `backend/drizzle/`. Drizzle Kit manages them.

```bash
# Generate a migration after changing the schema
cd backend
npx drizzle-kit generate

# Apply migrations
pnpm run migrate
```

The Python backend uses Alembic:

```bash
cd python-backend
alembic upgrade head
```

Posts from Substack never touch the database. Migrations only matter for doubts, comments, and profiles.

---

## Scripts (Node / root)

```bash
pnpm run dev           # Start frontend + Node backend together
pnpm run build         # Build everything for production
pnpm run typecheck     # TypeScript check across frontend and backend
pnpm run migrate       # Apply database migrations (Node backend)
pnpm run vercel-build  # Used by Vercel CI to build the frontend
```

---

## License

MIT. See [LICENSE](LICENSE).
