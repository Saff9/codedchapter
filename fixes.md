User experience issues
1. Some flows feel incomplete or misleading
The newsletter form stores emails in localStorage and says “Check your inbox soon,” but no real subscription happens. This is in frontend/src/components/footer.tsx:17-30. For users, this may feel broken or deceptive.

2. Preview mode may confuse real users
Mock mode is useful for local development, but users may not understand why any email/password works. The sign-in and sign-up pages show a preview badge, but the rest of the app does not clearly explain preview mode.

Relevant files:

frontend/src/pages/sign-in.tsx:47-50
frontend/src/pages/sign-up.tsx:53-56
frontend/src/lib/auth-context.tsx:5-8
3. Some pages show weak error states
Several pages use direct fetch or React Query but do not render API errors clearly. For example, doubts list catches errors and only stops loading in frontend/src/pages/doubts-list.tsx:30-33. If the API fails, users see “No doubts found” instead of an error message.

4. Some interactions are not shareable
Blog search is local state only. If a user searches for a chapter, the result is not reflected in the URL, so the filtered view cannot be copied or refreshed. See frontend/src/pages/blog-list.tsx:15-35.

Tag filters are URL-based, but search is not.

5. Profile “Answered” stat appears incorrect
The profile page labels resolved doubts authored by the user as “Answered”:

frontend/src/pages/profile.tsx:121-130

That is not the same as answers given by the user. A real “Answered” stat would need to count answers authored by the profile user.

6. Public profile may not show all posts
ProfilePage fetches posts with api.listPosts() in frontend/src/pages/profile.tsx:21-25. The backend defaults listPosts to 10 posts in backend/src/routes/posts.ts:8-19. If a user has more than 10 posts, their profile will not show all of them.

7. Sign-up username validation is inconsistent
The sign-up page only removes whitespace from username input in frontend/src/pages/sign-up.tsx:47-55, but the backend requires lowercase letters, numbers, and underscores in backend/src/db/schema/profiles.ts:26-35. A user can enter invalid characters and only find out after submission.

8. Some clickable elements are not ideal semantically
There are several <Link> wrappers around <button> elements, such as frontend/src/pages/home.tsx:134-146. This can create confusing accessibility and invalid HTML patterns. Prefer either a styled link or a button with navigation logic, not both nested.

9. Not-found page breaks visual theme
frontend/src/pages/not-found.tsx:5-20 uses a light gray background and gray text, which clashes with the app’s dark theme.

10. Accessibility could be improved
Common gaps:

Mobile menu does not expose aria-expanded or aria-controls.
Icon-only buttons often only have title, not accessible labels.
Profile tabs do not use proper tab roles.
No visible skip link for keyboard users.
No prefers-reduced-motion handling for Framer Motion animations.
Developer perspective
Architecture overview
This is a TypeScript monorepo with:

Frontend: React 19, Vite, Tailwind CSS v4, Radix/shadcn-style UI components, React Query, Wouter, Supabase client.
Backend: Express 5, Drizzle ORM, PostgreSQL/Supabase, JWT auth middleware, in-memory fallback.
Root scripts in package.json:5-10.
Vercel static frontend plus serverless backend config in vercel.json:1-29.
The structure is understandable and suitable for a solo project. The frontend and backend are separated cleanly enough, but shared types and API contracts are weak.

Frontend code quality
Strengths
Routing is centralized in frontend/src/App.tsx:65-80.
API client is simple and centralized in frontend/src/lib/api.ts:39-75.
React Query is used for several important pages, especially blog and post views.
Markdown support is consistently used across posts, comments, doubts, and answers.
UI components are reusable and mostly consistent.
Issues
1. Heavy use of any
There are many any usages across frontend pages, for example:

frontend/src/lib/api.ts:47-75
frontend/src/pages/blog-list.tsx:25-35
frontend/src/pages/blog-post.tsx:239-254
frontend/src/pages/doubt-detail.tsx:37-147
frontend/src/pages/profile.tsx:18-32
frontend/src/pages/settings.tsx:51-95
TypeScript passes, but the app would benefit from shared DTO types for posts, comments, doubts, answers, and profiles.

2. API error handling is incomplete
frontend/src/lib/api.ts:31-35 assumes error responses are JSON. If Vercel or the backend returns HTML, plain text, or a non-JSON error, parsing can fail or produce poor messages.

3. Auth headers can be overridden accidentally
In frontend/src/lib/api.ts:3-7, headers are created first, then ...init is spread afterward. If a caller passes init.headers, it can overwrite the Authorization header. Safer merging should apply auth after caller-provided headers.

4. Direct DOM manipulation is used for markdown insertion
Markdown toolbar helpers use document.getElementById(...) in several files:

frontend/src/pages/write.tsx:112-129
frontend/src/pages/blog-post.tsx:268-284
frontend/src/pages/ask-doubt.tsx:67-83
frontend/src/pages/doubt-detail.tsx:103-122
This works but is less React-friendly. Using refs would be cleaner and safer.

5. React Query keys are inconsistent
Some queries use ["/api/posts"], others use ["posts"]. For example:

frontend/src/pages/profile.tsx:21-25 uses ["posts"].
frontend/src/pages/blog-list.tsx:16-19 uses ["/api/posts", tagParam].
This makes cache invalidation harder to reason about.

6. No global error boundary
There is no visible React error boundary. Runtime component errors could blank the app.

7. Prettier formatting is widely inconsistent
Prettier check failed on 86 files. This is not a runtime issue, but it hurts maintainability and review quality.

Markdown and XSS risk
Markdown is rendered with dangerouslySetInnerHTML in multiple places:

frontend/src/pages/blog-post.tsx:228
frontend/src/pages/blog-post.tsx:338
frontend/src/pages/blog-post.tsx:437
frontend/src/pages/write.tsx:246
frontend/src/pages/ask-doubt.tsx:164
frontend/src/pages/doubt-detail.tsx:228
frontend/src/pages/doubt-detail.tsx:267
frontend/src/pages/doubt-detail.tsx:327
The sanitizer in frontend/src/lib/utils.ts:8-19 is very basic. It removes scripts and simple inline event handlers, but regex-based HTML sanitization is fragile. A malicious user could likely bypass it.

Important concerns:

Backend stores raw markdown without sanitization.
Any API client can submit markdown, not just the frontend.
href="javascript:..." protection is regex-based.
Event handlers without quotes or unusual spacing may bypass the current sanitizer.
Recommended direction: use a proper sanitizer such as DOMPurify on the frontend and sanitize/markdown-limit content on the backend before storing or returning it.

Backend code quality
Strengths
Express app setup is simple and readable in backend/src/app.ts:10-40.
Routes are separated by resource in backend/src/routes.
Repository pattern separates database/in-memory implementations in backend/src/db/repository.ts.
Zod validation exists for posts, comments, doubts, answers, and profiles.
Logging is centralized with Pino in backend/src/lib/logger.ts:5-20.
Issues
1. In-memory and Postgres logic are duplicated
PostgresRepository and InMemoryRepository implement almost all business logic twice. This is understandable for preview mode, but it makes the codebase harder to maintain and risks behavioral drift.

Relevant range: backend/src/db/repository.ts:36-871.

2. No database migrations are present
backend/src/db/index.ts:19-22 runs npx drizzle-kit push at startup. There is no visible migrations folder. Auto-pushing schema at runtime is risky for production because it can mutate schema unexpectedly and slow startup.

Better approach:

Commit migrations.
Run migrations in deployment pipeline.
Do not run schema push from application startup.
3. Schema lacks foreign keys and several indexes
The schema defines tables but no foreign key relationships. Examples:

postsTable in backend/src/db/schema/posts.ts:5-26
commentsTable in backend/src/db/schema/comments.ts:5-21
doubtsTable and doubtAnswersTable in backend/src/db/schema/doubts.ts:5-58
profilesTable in backend/src/db/schema/profiles.ts:5-38
Missing DB-level relationships means orphaned data is possible unless every delete path is manually maintained.

Useful indexes/relationships to add:

comments.postId -> posts.id
comments.authorId -> profiles.userId
doubts.authorId -> profiles.userId
doubt_answers.doubtId -> doubts.id
doubt_answers.authorId -> profiles.userId
indexes on author IDs, resolved status, and answer/doubt relationships.
4. Username uniqueness is case-sensitive in Postgres
profilesTable.username is unique but case-sensitive. getProfileByUsername lowercases the input in backend/src/db/schema/profiles.ts logic and repository methods, but the DB does not enforce case-insensitive uniqueness.

This can allow collisions like Owais and owais.

5. Profile route checks username availability but still has a race
backend/src/routes/profiles.ts:43-65 checks whether a username exists before upserting, but another request could claim it between the check and write. The DB unique constraint helps, but the route should handle the conflict cleanly.

6. Some route error mapping is inconsistent
Examples:

Comments delete returns 500 for Forbidden because the catch block does not distinguish it: backend/src/routes/comments.ts:54-73.
Doubts delete returns 404 for both not found and forbidden: backend/src/routes/doubts.ts:60-76.
Accept answer does not validate isNaN for doubtId or answerId: backend/src/routes/doubts.ts:108-122.
7. Answer count is denormalized
answerCount is manually incremented/decremented in repository methods. This can drift if writes fail partially or run concurrently. A transaction or derived count would be safer.

8. No server-side markdown/content sanitization
The backend accepts markdown and stores it raw. Even if the frontend sanitizes output, the backend remains the source of truth and should enforce content safety limits.

9. zod imports are mixed
Some schema files import from zod/v4, while backend/src/db/schema/zod.ts:1 imports from zod. Keep this consistent to avoid future runtime or type compatibility problems.

Auth and security
Strengths
Supabase JWT verification is attempted when SUPABASE_JWT_SECRET exists.
Production exits if required secrets are missing:
backend/src/index.ts:3-7
backend/src/db/index.ts:11-13
frontend/src/lib/supabase.ts:7-13
Logger redacts authorization, cookies, and set-cookie headers in backend/src/lib/logger.ts:5-20.
Some security headers are set in backend/src/middlewares/security.ts:7-25.
Issues
1. CORS is too permissive
backend/src/app.ts:34 uses:

cors({ credentials: true, origin: true })
This reflects arbitrary origins while allowing credentials. That is risky if the API is exposed publicly. Prefer an allowlist of trusted frontend origins.

2. Mock auth accepts any token
In backend/src/middlewares/authMiddleware.ts:62-79, if no JWT secret exists, any token becomes the same mock user. This is fine for local preview, but it must stay strictly disabled in production.

3. JWT verification should verify issuer and audience
The backend uses jsonwebtoken.verify(token, jwtSecret) in backend/src/middlewares/authMiddleware.ts:83-98, but does not verify Supabase issuer/audience. For production, verify iss and aud according to Supabase JWT settings.

4. No Content Security Policy
Security headers include X-Frame-Options and HSTS, but no CSP. Given markdown rendering with dangerouslySetInnerHTML, CSP is especially important.

5. Rate limiter is in-memory and IP-based
backend/src/middlewares/rateLimiter.ts:11-35 stores counts in memory and reads x-forwarded-for. This is not cluster-safe and can be spoofed unless the proxy is trusted and headers are sanitized.

6. No per-user rate limits
Writes, comments, answers, and profile updates are protected by auth, but not separately rate-limited per user.

Performance
Strengths
Blog list supports limit and offset in backend/src/routes/posts.ts:8-19.
Doubts list caps results at 50 in backend/src/db/repository.ts:269-276.
Query refetching is disabled by default in frontend/src/lib/queryClient.ts:3-10.
Static frontend build is configured in frontend/vite.config.ts:27-30.
Issues
Profile page fetches all posts through the default 10-post endpoint, so pagination is incomplete.
Blog search is client-side only. Fine for small data, but not scalable.
Doubts list fetches all doubts and filters client-side.
No database indexes beyond a few explicit ones.
No caching headers for API responses.
No image optimization for external cover images.
Heavy animations on homepage and pages may affect low-end devices unless reduced-motion handling is added.
Maintainability
Strengths
Monorepo scripts are simple in package.json:5-10.
Backend routes are resource-based.
Frontend pages are separated by route.
The app has a readable visual system.
Issues
No tests are present.
No lint script is present.
Prettier check fails across many files.
Many generated UI components exist, but not all appear necessary.
Shared API types are missing.
Backend and frontend both define validation rules separately.
README is helpful but does not document API contracts, environment examples, or deployment caveats.
No .env.example is present.
No CI workflow is present.
No migration files are present.
No error boundary or test coverage for critical flows.
Highest-priority recommendations
High priority
Replace regex sanitizer with a real sanitizer.
Frontend: DOMPurify or equivalent.
Backend: sanitize or validate markdown/content before storage.
Restrict CORS origins.
Replace origin: true with an allowlist.
Add database migrations and remove runtime drizzle-kit push.
Especially important before production use.
Add real tests.
Backend route tests.
Auth middleware tests.
Repository tests for both implementations.
Frontend critical flow tests.
Improve input validation consistency.
Username validation should match frontend and backend.
Tag count/format should be validated on the backend too.
URL fields should be validated consistently.
Medium priority
Add shared API types between frontend and backend.
Improve React Query key consistency.
Add proper error states for API failures.
Add accessibility improvements:
aria labels for icon buttons
mobile menu aria-expanded
tab roles
skip link
reduced-motion support
Add DB indexes and foreign keys.
Handle profile pagination correctly.
Fix misleading newsletter behavior or clearly label it as local/demo only.
Lower priority
Run Prettier formatting across the codebase.
Add .env.example.
Add CI.
Add API documentation or OpenAPI.
Improve SEO metadata per post.
Add canonical URLs and dynamic OpenGraph metadata.
Improve not-found page styling.
Remove or clarify stale decorative homepage badges like “Chapter 5 is live.”
Overall, the codebase is visually strong, feature-rich, and functional for a personal blog/Q&A platform. The biggest risks are not basic functionality but security, validation, database migration discipline, and long-term maintainability