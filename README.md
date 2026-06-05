# Coded Chapter

> A personal developer blog for documenting the journey from beginner to software engineer — with a community Q&A section, developer profiles, and a full post editor.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## ✨ Features

### Blog
- **Posts** — full markdown-style blog posts with reading progress bar, cover images, tags, and reading time
- **Comments** — threaded comments on each post; login required to post
- **Tag filtering** — browse posts by topic on the blog listing page
- **Featured posts** — homepage highlights the latest chapters

### Community Doubts
- **Ask a Doubt** — post a question to the community (login required)
- **Answers** — any logged-in user can answer; doubt author can accept the best answer
- **Resolved/Open status** — doubts are marked resolved when an answer is accepted
- **Tag & search filtering** — find doubts by topic or keyword

### Developer Profiles
- **Unique @username** — every user picks a unique handle
- **Public profile page** — visible at `/u/username`
- **Profile details** — display name, bio, location, website, GitHub, Twitter
- **Activity tabs** — see a user's posts and doubts in one place

### Post Editor
- **Write & publish** — any logged-in user can author posts
- **Edit & delete** — authors can update or remove their own posts
- **Live preview** — toggle between editor and rendered preview
- **Tag management** — add up to 5 tags per post

### Auth
- **Clerk** — sign up / sign in with email or social providers
- **Protected routes** — commenting, writing, asking doubts all require login

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | pnpm workspaces |
| **Frontend** | React 19 + Vite + TypeScript |
| **Styling** | Tailwind CSS v4 + Framer Motion |
| **UI Components** | Radix UI primitives (via shadcn/ui) |
| **Backend** | Express 5 + TypeScript |
| **Database** | PostgreSQL (Replit built-in) |
| **ORM** | Drizzle ORM + drizzle-zod |
| **Auth** | Clerk |
| **API Contract** | OpenAPI spec + Orval codegen |
| **Validation** | Zod v4 |
| **Node** | 24 |

---

## 📁 Project Structure

```
coded-chapter/
├── artifacts/
│   ├── coded-chapter/       # React + Vite frontend
│   └── api-server/          # Express 5 API server
├── lib/
│   ├── db/                  # Drizzle schema + DB client
│   ├── api-spec/            # OpenAPI specification
│   ├── api-zod/             # Generated Zod validators
│   └── api-client-react/    # Generated React Query hooks
└── scripts/                 # Utility scripts
```

---

## 🗄 Database Schema

| Table | Description |
|---|---|
| `posts` | Blog posts with title, content, tags, author, reading time |
| `comments` | Comments on posts; linked to Clerk user |
| `profiles` | User profiles with unique username, bio, links |
| `doubts` | Community Q&A questions |
| `doubt_answers` | Answers to doubts; one can be marked accepted |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 24+
- pnpm 9+
- A PostgreSQL database (Replit provides one automatically)
- A [Clerk](https://clerk.com) account

### Environment Variables

Create a `.env` file in `artifacts/coded-chapter/` and `artifacts/api-server/`:

```env
# Clerk (both frontend and backend need these)
VITE_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
VITE_CLERK_PROXY_URL=/__clerk

# Database
DATABASE_URL=postgresql://...
```

### Install & Run

```bash
# Install all dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Start development servers
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/coded-chapter run dev
```

### Regenerate API Client

After changing the OpenAPI spec:

```bash
pnpm --filter @workspace/api-spec run codegen
```

### Type Check

```bash
pnpm run typecheck
```

---

## 🔑 Key Routes

| Route | Description |
|---|---|
| `/` | Homepage with hero and featured posts |
| `/blog` | All posts with tag filtering |
| `/blog/:id` | Individual post with comments |
| `/doubts` | Community Q&A listing |
| `/doubts/ask` | Post a new question |
| `/doubts/:id` | View question + answers |
| `/write` | Create a new post |
| `/write/:id` | Edit an existing post |
| `/u/:username` | Public developer profile |
| `/settings` | Edit your own profile |
| `/sign-in` | Clerk sign-in |
| `/sign-up` | Clerk sign-up |

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/posts` | — | List posts |
| `GET` | `/api/posts/featured` | — | Featured posts |
| `GET` | `/api/posts/tags` | — | All tags |
| `GET` | `/api/posts/:id` | — | Single post |
| `POST` | `/api/posts` | ✅ | Create post |
| `PUT` | `/api/posts/:id` | ✅ owner | Update post |
| `DELETE` | `/api/posts/:id` | ✅ owner | Delete post |
| `GET` | `/api/posts/:id/comments` | — | List comments |
| `POST` | `/api/posts/:id/comments` | ✅ | Add comment |
| `DELETE` | `/api/posts/:id/comments/:commentId` | ✅ owner | Delete comment |
| `GET` | `/api/profiles/me` | ✅ | Own profile |
| `GET` | `/api/profiles/:username` | — | Public profile |
| `POST` | `/api/profiles` | ✅ | Create/update profile |
| `GET` | `/api/doubts` | — | List doubts |
| `POST` | `/api/doubts` | ✅ | Ask a doubt |
| `GET` | `/api/doubts/:id` | — | Doubt + answers |
| `DELETE` | `/api/doubts/:id` | ✅ owner | Delete doubt |
| `POST` | `/api/doubts/:id/answers` | ✅ | Post answer |
| `PATCH` | `/api/doubts/:id/answers/:id/accept` | ✅ author | Accept answer |
| `DELETE` | `/api/doubts/:id/answers/:id` | ✅ owner | Delete answer |

---

## 🗺 Roadmap

- [ ] Rich text / WYSIWYG editor (TipTap)
- [ ] Post drafts & scheduled publishing
- [ ] Upvotes on doubts and answers
- [ ] Email notifications for answers
- [ ] Search (full-text across posts and doubts)
- [ ] Series / collections grouping for posts
- [ ] RSS feed
- [ ] Dark/light theme toggle
- [ ] Admin dashboard for content moderation
- [ ] Bookmarks / reading list

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Open a pull request

---

## 📄 License

[MIT](./LICENSE) © Coded Chapter
