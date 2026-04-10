# Coded Chapter

## Overview

"Coded Chapter" is a personal developer blog website for a beginner programmer documenting their learning journey into software engineering. Each blog post is a chapter in the story of becoming a developer.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/coded-chapter)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM (Replit built-in)
- **Authentication**: Clerk (via @clerk/react + @clerk/express)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **UI**: Tailwind CSS + framer-motion + lucide-react

## Features

- Home page with animated hero, featured posts, and tag highlights
- Blog listing page with tag filter sidebar and animated post cards
- Individual post page with reading progress bar and comments section
- Clerk authentication (sign up / sign in)
- Comments: only logged-in users can post comments
- Dark-mode-first design with electric indigo (#6366f1) and teal (#14b8a6) accents

## Database Schema

- `posts` — blog posts (id, title, slug, excerpt, content, tags[], authorId, authorName, coverImage, readingTimeMinutes, timestamps)
- `comments` — post comments (id, postId, authorId, authorName, content, createdAt)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Routes

- `/` — Homepage hero with featured posts
- `/blog` — All blog posts with tag filtering
- `/blog/:id` — Individual post with comments
- `/sign-in` — Clerk sign-in page
- `/sign-up` — Clerk sign-up page

## Artifacts

- `coded-chapter` (react-vite) — Frontend, preview at `/`
- `api-server` (api) — Backend Express server, at `/api`
