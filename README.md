# Coded Chapter

Personal dev log + Q&A board. I built this to write down what I'm learning — from finishing 10th/12th under J&K BOSE to picking up Python, web dev, and whatever comes next in college.

Stack: React 19 + Vite frontend, Express 5 + Drizzle + Postgres backend. Deploys on Vercel.

---

## Repo layout

```
frontend/   React app
backend/    Express API + Drizzle
api/        Vercel serverless entry (re-exports backend/src/app)
```

---

## Local dev

```bash
pnpm install
cp .env.example .env   # fill in what you have
pnpm run dev
```

Frontend: http://localhost:5173  
API: http://localhost:5000

Without `DATABASE_URL` and Supabase keys → preview mode (in-memory DB + mock auth).

---

## Production deploy (Vercel)

### 1. Services to set up first

| Service | Why |
|---------|-----|
| **Supabase** | Postgres + auth |
| **Upstash Redis** | Rate limiting across serverless instances (free tier is fine to start) |

### 2. Vercel environment variables

Set all of these in **Vercel → Project → Settings → Environment Variables**.

**Build + runtime (backend):**
```
DATABASE_URL=postgresql://...pooler.supabase.com:6543/postgres?sslmode=require
SUPABASE_JWT_SECRET=...
ADMIN_EMAIL=your@email.com
FRONTEND_URL=https://your-domain.vercel.app
UPSTASH_REDIS_REST_URL=https://....upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

**Build time only (frontend — must exist before deploy builds):**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_ADMIN_EMAIL=your@email.com
```

Use Supabase's **connection pooler** URL (port `6543`), not the direct `5432` URL — serverless needs pooling.

### 3. Deploy

Push to GitHub → connect repo in Vercel → set build command to `pnpm run vercel-build`.

Migrations run automatically during `vercel-build` when `DATABASE_URL` is set.

### 4. Post-deploy smoke test

- [ ] Homepage loads
- [ ] Sign up / sign in works
- [ ] Admin can write a post
- [ ] Non-admin cannot see Write button
- [ ] Doubts list loads
- [ ] Share a blog post link — OG preview shows correct title

---

## Env reference

See [`.env.example`](.env.example) for the full list with comments.

---

## Database

```bash
# generate new migration after schema change
cd backend && npx drizzle-kit generate

# apply migrations locally or in CI
pnpm run migrate
```

---

## Performance (heavy traffic)

What's already wired in:

- **Upstash Redis** rate limits (300 reads/min, 30 writes/min per IP)
- **GIN indexes** on tag arrays + btree indexes on hot columns
- **Cache-Control** headers on read API routes
- **gzip compression** on API responses
- **React Query** 60s stale time on the frontend
- **Vercel CDN** caching for static assets (1 year on hashed JS/CSS)

---

## Scripts

```bash
pnpm run dev
pnpm run typecheck
pnpm run build
pnpm run migrate
pnpm run vercel-build
```

CI runs typecheck + build on every push to `main` (see `.github/workflows/ci.yml`).

---

## License

MIT — see [LICENSE](LICENSE).
