# Coded Chapter

Personal dev log + Q&A board. I built this to write down what I'm learning — from picking up Python, web dev, and whatever comes next in college.

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

## Production Deploy (Split Architecture)

This project is configured as a split deployment:
* **Frontend**: React SPA deployed on **Vercel**.
* **Backend**: Node/Express server deployed on **Render**.

### 1. Backend Deploy (Render) - One-Click Blueprint

You can deploy the backend to Render in a single click using this button:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Saff9/codedchapter)

Render will parse the `render.yaml` blueprint and prompt you for the following environment variables:
* `DATABASE_URL`: Your Supabase connection string.
* `FRONTEND_URL`: Your Vercel frontend URL (e.g. `https://codedchapter.vercel.app`).
* `SUPABASE_JWT_SECRET`: Your Supabase JWT secret.

### 2. Frontend Deploy (Vercel)

1. Connect your repository to Vercel.
2. In Vercel, set the following environment variables:
   * `VITE_API_URL`: Your Render backend URL (e.g. `https://codedchapter-backend.onrender.com`).
   * `VITE_SUPABASE_URL`: Your Supabase URL.
   * `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key.
3. Vercel will build the frontend from the root using the `vercel-build` script, and host it statically.

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
