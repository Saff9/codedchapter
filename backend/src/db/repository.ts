import { db } from "./index";
import { profilesTable, postsTable, commentsTable, doubtsTable, doubtAnswersTable } from "./schema";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IRepository {
  // Profiles
  getProfileByUserId(userId: string): Promise<any>;
  getProfileByUsername(username: string): Promise<any>;
  checkUsernameAvailable(username: string): Promise<boolean>;
  upsertProfile(userId: string, data: any): Promise<any>;

  // Posts
  listPosts(category?: string, tag?: string, limit?: number, offset?: number, authorId?: string): Promise<any[]>;
  getFeaturedPosts(): Promise<any[]>;
  getAllTags(): Promise<string[]>;
  getPost(id: number): Promise<any>;
  createPost(userId: string, authorName: string, data: any): Promise<any>;
  updatePost(id: number, userId: string, data: any): Promise<any>;
  deletePost(id: number, userId: string): Promise<boolean>;

  // Comments
  listComments(postId: number): Promise<any[]>;
  createComment(postId: number, authorId: string, authorName: string, content: string): Promise<any>;
  deleteComment(commentId: number, userId: string): Promise<boolean>;

  // Doubts
  listDoubts(tag?: string, limit?: number, offset?: number, authorId?: string): Promise<any[]>;
  getDoubt(id: number): Promise<any>;
  createDoubt(userId: string, authorName: string, authorUsername: string | null, data: any): Promise<any>;
  deleteDoubt(id: number, userId: string): Promise<boolean>;
  createAnswer(doubtId: number, authorId: string, authorName: string, authorUsername: string | null, content: string): Promise<any>;
  deleteAnswer(doubtId: number, answerId: number, userId: string): Promise<boolean>;
  acceptAnswer(doubtId: number, answerId: number, userId: string): Promise<any>;
}

// ── postgres implementation ───────────────────────────────────────────────
class PostgresRepository implements IRepository {
  async getProfileByUserId(userId: string) {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
    if (!profile) return null;

    const [postsCountRes] = await db.select({ count: sql<number>`count(*)` }).from(postsTable).where(eq(postsTable.authorId, userId));
    const [doubtsCountRes] = await db.select({ count: sql<number>`count(*)` }).from(doubtsTable).where(eq(doubtsTable.authorId, userId));
    const [answersCountRes] = await db.select({ count: sql<number>`count(*)` }).from(doubtAnswersTable).where(eq(doubtAnswersTable.authorId, userId));

    return {
      ...profile,
      postsCount: Number(postsCountRes?.count ?? 0),
      doubtsCount: Number(doubtsCountRes?.count ?? 0),
      answersCount: Number(answersCountRes?.count ?? 0),
    };
  }

  async getProfileByUsername(username: string) {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.username, username.toLowerCase()));
    if (!profile) return null;

    const [postsCountRes] = await db.select({ count: sql<number>`count(*)` }).from(postsTable).where(eq(postsTable.authorId, profile.userId));
    const [doubtsCountRes] = await db.select({ count: sql<number>`count(*)` }).from(doubtsTable).where(eq(doubtsTable.authorId, profile.userId));
    const [answersCountRes] = await db.select({ count: sql<number>`count(*)` }).from(doubtAnswersTable).where(eq(doubtAnswersTable.authorId, profile.userId));

    return {
      ...profile,
      postsCount: Number(postsCountRes?.count ?? 0),
      doubtsCount: Number(doubtsCountRes?.count ?? 0),
      answersCount: Number(answersCountRes?.count ?? 0),
    };
  }

  async checkUsernameAvailable(username: string) {
    const [existing] = await db.select({ id: profilesTable.id }).from(profilesTable).where(eq(profilesTable.username, username.toLowerCase()));
    return !existing;
  }

  async upsertProfile(userId: string, data: any) {
    const username = data.username.toLowerCase();
    const ownProfile = await this.getProfileByUserId(userId);

    if (ownProfile) {
      const [updated] = await db.update(profilesTable).set({
        ...data,
        username,
        updatedAt: new Date(),
      }).where(eq(profilesTable.userId, userId)).returning();
      return updated;
    } else {
      const [created] = await db.insert(profilesTable).values({
        userId,
        ...data,
        username,
        displayName: data.displayName,
      }).returning();
      return created;
    }
  }

  async listPosts(category?: string, tag?: string, limit = 10, offset = 0, authorId?: string) {
    const conditions = [];
    if (category) {
      conditions.push(eq(postsTable.category, category));
    }
    if (authorId) {
      conditions.push(eq(postsTable.authorId, authorId));
    }
    if (tag) {
      conditions.push(sql`${tag} = ANY(${postsTable.tags})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const postsWithCounts = await db
      .select({
        id: postsTable.id,
        title: postsTable.title,
        slug: postsTable.slug,
        excerpt: postsTable.excerpt,
        content: postsTable.content,
        tags: postsTable.tags,
        authorId: postsTable.authorId,
        authorName: postsTable.authorName,
        category: postsTable.category,
        coverImage: postsTable.coverImage,
        readingTimeMinutes: postsTable.readingTimeMinutes,
        createdAt: postsTable.createdAt,
        updatedAt: postsTable.updatedAt,
        authorUsername: profilesTable.username,
        commentCount: sql<number>`cast(count(${commentsTable.id}) as int)`,
      })
      .from(postsTable)
      .leftJoin(commentsTable, eq(commentsTable.postId, postsTable.id))
      .leftJoin(profilesTable, eq(profilesTable.userId, postsTable.authorId))
      .where(whereClause)
      .groupBy(postsTable.id, profilesTable.username)
      .orderBy(desc(postsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return postsWithCounts;
  }

  async getFeaturedPosts() {
    return db
      .select({
        id: postsTable.id,
        title: postsTable.title,
        slug: postsTable.slug,
        excerpt: postsTable.excerpt,
        content: postsTable.content,
        tags: postsTable.tags,
        authorId: postsTable.authorId,
        authorName: postsTable.authorName,
        coverImage: postsTable.coverImage,
        readingTimeMinutes: postsTable.readingTimeMinutes,
        createdAt: postsTable.createdAt,
        updatedAt: postsTable.updatedAt,
        authorUsername: profilesTable.username,
        commentCount: sql<number>`cast(count(${commentsTable.id}) as int)`,
      })
      .from(postsTable)
      .leftJoin(commentsTable, eq(commentsTable.postId, postsTable.id))
      .leftJoin(profilesTable, eq(profilesTable.userId, postsTable.authorId))
      .where(eq(postsTable.category, "tech"))
      .groupBy(postsTable.id, profilesTable.username)
      .orderBy(desc(postsTable.createdAt))
      .limit(4);
  }

  async getAllTags() {
    const posts = await db.select({ tags: postsTable.tags }).from(postsTable);
    const tagSet = new Set<string>();
    posts.forEach((p: any) => p.tags.forEach((t: any) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }

  async getPost(id: number) {
    const posts = await db
      .select({
        id: postsTable.id,
        title: postsTable.title,
        slug: postsTable.slug,
        excerpt: postsTable.excerpt,
        content: postsTable.content,
        tags: postsTable.tags,
        authorId: postsTable.authorId,
        authorName: postsTable.authorName,
        coverImage: postsTable.coverImage,
        readingTimeMinutes: postsTable.readingTimeMinutes,
        createdAt: postsTable.createdAt,
        updatedAt: postsTable.updatedAt,
        authorUsername: profilesTable.username,
        commentCount: sql<number>`cast(count(${commentsTable.id}) as int)`,
      })
      .from(postsTable)
      .leftJoin(commentsTable, eq(commentsTable.postId, postsTable.id))
      .leftJoin(profilesTable, eq(profilesTable.userId, postsTable.authorId))
      .where(eq(postsTable.id, id))
      .groupBy(postsTable.id, profilesTable.username);

    return posts[0] || null;
  }

  async createPost(userId: string, authorName: string, data: any) {
    const words = data.content.split(/\s+/).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

    const [created] = await db
      .insert(postsTable)
      .values({
        title: data.title,
        slug: "temp",
        excerpt: data.excerpt,
        content: data.content,
        tags: data.tags ?? [],
        authorId: userId,
        authorName: authorName,
        category: data.category ?? "tech",
        coverImage: data.coverImage ?? null,
        readingTimeMinutes,
      })
      .returning();

    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) + `-${created.id}`;
    
    const [updated] = await db
      .update(postsTable)
      .set({ slug })
      .where(eq(postsTable.id, created.id))
      .returning();

    return { ...updated, commentCount: 0 };
  }

  async updatePost(id: number, userId: string, data: any) {
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id));
    if (!post) throw new Error("Post not found");
    if (post.authorId !== userId) throw new Error("Forbidden");

    const words = data.content.split(/\s+/).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) + `-${id}`;

    const [updated] = await db.update(postsTable).set({
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      tags: data.tags ?? [],
      category: data.category ?? post.category,
      coverImage: data.coverImage ?? null,
      readingTimeMinutes,
      updatedAt: new Date(),
    }).where(eq(postsTable.id, id)).returning();

    const [countRes] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(commentsTable)
      .where(eq(commentsTable.postId, id));

    return { ...updated, commentCount: Number(countRes?.count ?? 0) };
  }

  async deletePost(id: number, userId: string) {
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id));
    if (!post) return false;
    if (post.authorId !== userId) throw new Error("Forbidden");

    await db.delete(commentsTable).where(eq(commentsTable.postId, id));
    await db.delete(postsTable).where(eq(postsTable.id, id));
    return true;
  }

  async listComments(postId: number) {
    return db
      .select({
        id: commentsTable.id,
        postId: commentsTable.postId,
        authorId: commentsTable.authorId,
        authorName: commentsTable.authorName,
        content: commentsTable.content,
        createdAt: commentsTable.createdAt,
        authorUsername: profilesTable.username,
      })
      .from(commentsTable)
      .leftJoin(profilesTable, eq(profilesTable.userId, commentsTable.authorId))
      .where(eq(commentsTable.postId, postId))
      .orderBy(desc(commentsTable.createdAt));
  }

  async createComment(postId: number, authorId: string, authorName: string, content: string) {
    const [post] = await db.select({ id: postsTable.id }).from(postsTable).where(eq(postsTable.id, postId));
    if (!post) throw new Error("Post not found");

    const [comment] = await db
      .insert(commentsTable)
      .values({
        postId,
        authorId,
        authorName,
        content,
      })
      .returning();
    return comment;
  }

  async deleteComment(commentId: number, userId: string) {
    const [comment] = await db.select().from(commentsTable).where(eq(commentsTable.id, commentId));
    if (!comment) return false;
    if (comment.authorId !== userId) throw new Error("Forbidden");

    await db.delete(commentsTable).where(eq(commentsTable.id, commentId));
    return true;
  }

  async listDoubts(tag?: string, limit = 50, offset = 0, authorId?: string) {
    const conditions = [];
    if (tag) conditions.push(sql`${tag} = ANY(${doubtsTable.tags})`);
    if (authorId) conditions.push(eq(doubtsTable.authorId, authorId));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select()
      .from(doubtsTable)
      .where(whereClause)
      .orderBy(desc(doubtsTable.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getDoubt(id: number) {
    const [doubt] = await db.select().from(doubtsTable).where(eq(doubtsTable.id, id));
    if (!doubt) return null;
    const answers = await db.select().from(doubtAnswersTable).where(eq(doubtAnswersTable.doubtId, id)).orderBy(desc(doubtAnswersTable.isAccepted), desc(doubtAnswersTable.createdAt));
    return { ...doubt, answers };
  }

  async createDoubt(userId: string, authorName: string, authorUsername: string | null, data: any) {
    const [created] = await db.insert(doubtsTable).values({
      title: data.title,
      content: data.content,
      tags: data.tags ?? [],
      authorId: userId,
      authorName,
      authorUsername,
      isResolved: false,
      answerCount: 0,
    }).returning();
    return created;
  }

  async deleteDoubt(id: number, userId: string) {
    const [doubt] = await db.select().from(doubtsTable).where(eq(doubtsTable.id, id));
    if (!doubt) return false;
    if (doubt.authorId !== userId) throw new Error("Forbidden");

    await db.delete(doubtAnswersTable).where(eq(doubtAnswersTable.doubtId, id));
    await db.delete(doubtsTable).where(eq(doubtsTable.id, id));
    return true;
  }

  async createAnswer(doubtId: number, authorId: string, authorName: string, authorUsername: string | null, content: string) {
    const [doubt] = await db.select().from(doubtsTable).where(eq(doubtsTable.id, doubtId));
    if (!doubt) throw new Error("Doubt not found");

    const [answer] = await db.insert(doubtAnswersTable).values({
      doubtId,
      content,
      authorId,
      authorName,
      authorUsername,
    }).returning();

    await db.update(doubtsTable).set({
      answerCount: doubt.answerCount + 1,
      updatedAt: new Date(),
    }).where(eq(doubtsTable.id, doubtId));

    return answer;
  }

  async deleteAnswer(doubtId: number, answerId: number, userId: string) {
    const [answer] = await db.select().from(doubtAnswersTable).where(eq(doubtAnswersTable.id, answerId));
    if (!answer || answer.doubtId !== doubtId) return false;
    if (answer.authorId !== userId) throw new Error("Forbidden");

    await db.delete(doubtAnswersTable).where(eq(doubtAnswersTable.id, answerId));

    const [doubt] = await db.select().from(doubtsTable).where(eq(doubtsTable.id, answer.doubtId));
    if (doubt) {
      await db.update(doubtsTable).set({
        answerCount: Math.max(0, doubt.answerCount - 1),
        updatedAt: new Date(),
      }).where(eq(doubtsTable.id, answer.doubtId));
    }
    return true;
  }

  async acceptAnswer(doubtId: number, answerId: number, userId: string) {
    const [doubt] = await db.select().from(doubtsTable).where(eq(doubtsTable.id, doubtId));
    if (!doubt) throw new Error("Doubt not found");
    if (doubt.authorId !== userId) throw new Error("Forbidden");

    const [target] = await db.select().from(doubtAnswersTable).where(eq(doubtAnswersTable.id, answerId));
    if (!target || target.doubtId !== doubtId) throw new Error("Answer not found");

    await db.update(doubtAnswersTable).set({ isAccepted: false }).where(eq(doubtAnswersTable.doubtId, doubtId));
    const [answer] = await db
      .update(doubtAnswersTable)
      .set({ isAccepted: true })
      .where(eq(doubtAnswersTable.id, answerId))
      .returning();
    await db.update(doubtsTable).set({ isResolved: true, updatedAt: new Date() }).where(eq(doubtsTable.id, doubtId));

    return answer;
  }
}

// ── in-memory fallback implementation ─────────────────────────────────────
class InMemoryRepository implements IRepository {
  private profiles = new Map<string, any>();
  private posts: any[] = [];
  private comments: any[] = [];
  private doubts: any[] = [];
  private answers: any[] = [];
  private postCounter = 0;
  private commentCounter = 0;
  private doubtCounter = 0;
  private answerCounter = 0;

  constructor() {
    this.seedSampleData();
  }

  private seedSampleData() {
    // 1. Seed profiles
    this.profiles.set("mock-user-123", {
      id: 1,
      userId: "mock-user-123",
      username: "guest_coder",
      displayName: "Guest Coder",
      bio: "Learning to code, sharing every facepalm on the way.",
      location: "San Francisco, CA",
      website: "https://codedchapter.com",
      githubUrl: "https://github.com",
      twitterUrl: "https://twitter.com",
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.profiles.set("senior-architect-id", {
      id: 2,
      userId: "senior-architect-id",
      username: "senior_arch",
      displayName: "Senior Architect",
      bio: "Senior Dev. Writing simple solutions for complex engineering layouts.",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Seed posts
    this.posts.push({
      id: ++this.postCounter,
      title: "The Day I Forgot how Promises Work",
      slug: `the-day-i-forgot-how-promises-work-${this.postCounter}`,
      excerpt: "A retrospective on how a simple microtask queue mistake caused our API gateway to crawl, and the async/await fundamentals I had to re-learn.",
      content: `Promises are simple, right? You \`.then()\` them, or you \`await\` them, and things happen in order. 
      
That is what I thought until last Tuesday. I was writing an API gateway routing handler that needed to:
1. Log the incoming request.
2. Validate user tokens.
3. Forward the request to a backend service.
4. Record metrics in the background.

Here is the simplified buggy code I wrote:

\`\`\`typescript
app.use(async (req, res, next) => {
  logRequest(req);
  const isValid = await validateToken(req);
  if (!isValid) return res.status(401).send();
  
  // Forward request, but wait...
  forwardRequest(req).then(response => {
    res.send(response);
  });
  
  // Track metrics in background (supposedly non-blocking)
  trackMetrics(req);
});
\`\`\`

### What went wrong?
I forgot that \`forwardRequest(req)\` returns a promise. In JavaScript, because I did not await it, execution continued immediately to \`trackMetrics(req)\`. But worse, since I was not awaiting the request, the Express request cycle did not wait for the promise resolving and instead continued. 

In production, the microtask queue filled up. Connection timeouts started accumulating because requests were hanging or returning before resources were fully closed.

### The Fix
To fix it, we must cleanly await the async boundary:

\`\`\`typescript
app.use(async (req, res, next) => {
  logRequest(req);
  const isValid = await validateToken(req);
  if (!isValid) return res.status(401).send();
  
  try {
    const response = await forwardRequest(req);
    res.send(response);
    
    // Background task (handled gracefully, ignoring its block)
    trackMetrics(req).catch(err => console.error("Metrics error", err));
  } catch (err) {
    res.status(500).send("Gateway error");
  }
});
\`\`\`

**The moral of the story:** Never mix raw promise handlers (\`.then()\`) and \`await\` unless you have a very clear async boundaries and handle failures explicitly!`,
      tags: ["javascript", "backend", "promises"],
      category: "tech",
      authorId: "senior-architect-id",
      authorName: "Senior Architect",
      coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60",
      readingTimeMinutes: 3,
      createdAt: new Date(Date.now() - 3600000 * 24 * 3), // 3 days ago
      updatedAt: new Date(Date.now() - 3600000 * 24 * 3),
    });

    this.posts.push({
      id: ++this.postCounter,
      title: "Z-Index and Other CSS Horrors",
      slug: `z-index-and-other-css-horrors-${this.postCounter}`,
      excerpt: "Why does z-index: 9999 never work when you need it to? Understanding stacking contexts, layout positioning, and relative containment.",
      content: `We've all done it. You have a modal overlay. You want it to sit on top of everything. You add \`z-index: 9999\` to the modal. It doesn't work. The sidebar is still peeking through. You change it to \`z-index: 9999999\`. Still nothing.

Why?

### The Myth of Global Z-Index
Z-index is not a global layer index. It is scoped to the **Stacking Context**. 

A stacking context is formed by any element that meets certain criteria, such as:
1. Being the root element (\`<html>\`).
2. Having a position value of \`absolute\` or \`relative\` AND a \`z-index\` value other than \`auto\`.
3. Having a position value of \`fixed\` or \`sticky\`.
4. Having an opacity value less than 1.
5. Having a transform, filter, perspective, clip-path, mask, or backdrop-filter value other than \`none\`.

Once a stacking context is formed, its children are stacked relative to *each other* within that context. No child can exceed the stack level of its parent context!

### An Example
If you have a sidebar container with \`z-index: 10\`, and inside it a tooltip with \`z-index: 99999\`, and a main section with \`z-index: 20\`, the tooltip will appear *under* the main section! 

Even though the tooltip has \`99999\` and the main section has \`20\`, the tooltip is trapped inside the sidebar's stacking context (which is capped at \`10\` relative to the main section's \`20\`).

### The Solution
To fix this stacking context sandwich:
- Move portals or overlays to the root document level (\`<body>\`) so their stacking context is relative directly to the HTML root.
- Clean up unnecessary stacking context triggers (like excessive \`transform\` or \`opacity\` values on parent wrapper boxes).`,
      tags: ["css", "frontend", "layout"],
      category: "tech",
      authorId: "mock-user-123",
      authorName: "Guest Coder",
      coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60",
      readingTimeMinutes: 2,
      createdAt: new Date(Date.now() - 3600000 * 24 * 1), // 1 day ago
      updatedAt: new Date(Date.now() - 3600000 * 24 * 1),
    });

    this.posts.push({
      id: ++this.postCounter,
      title: "My Academics and BOSE Timeline",
      slug: `my-academics-and-bose-timeline-${this.postCounter}`,
      excerpt: "Sharing my academic progression under J&K BOSE and planning my transition to college computer science courses.",
      content: `I've recently completed my higher secondary education under the Jammu and Kashmir Board of School Education (J&K BOSE). Here is my progression:
      
- **10th Grade:** Completed in **2024** (Secondary School)
- **11th Grade:** Completed in **2025**
- **12th Grade:** Completed in **2026** (Higher Secondary)

In the coming months, I will be matriculating into college, where I plan to major in Computer Science. To prepare, I've been learning Python through Harvard's CS50P on YouTube, and I'm planning to dive into college-level C++ and Java soon.

It's been a busy ride but I'm excited for the next chapter of this learning log!`,
      tags: ["academics", "bose", "college"],
      category: "general",
      authorId: "mock-user-123",
      authorName: "Guest Coder",
      coverImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=60",
      readingTimeMinutes: 2,
      createdAt: new Date(Date.now() - 3600000 * 12), // 12 hours ago
      updatedAt: new Date(Date.now() - 3600000 * 12),
    });

    // 3. Seed comments
    this.comments.push({
      id: ++this.commentCounter,
      postId: 1,
      authorId: "mock-user-123",
      authorName: "Guest Coder",
      content: "This makes so much sense! I was hit by this exact same issue yesterday while working with express-session.",
      createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    });

    // 4. Seed doubts
    this.doubts.push({
      id: ++this.doubtCounter,
      title: "Why does useEffect run twice in React 18?",
      content: "I am building a simple weather search app. When my component mounts, my fetch request triggers twice. I checked my dependency array and it is empty `[]`. Is this a bug in React 18 or am I misunderstanding standard lifecycle hooks?",
      tags: ["react", "frontend"],
      authorId: "mock-user-123",
      authorName: "Guest Coder",
      authorUsername: "guest_coder",
      isResolved: false,
      answerCount: 1,
      createdAt: new Date(Date.now() - 3600000 * 8), // 8 hours ago
      updatedAt: new Date(Date.now() - 3600000 * 8),
    });

    this.doubts.push({
      id: ++this.doubtCounter,
      title: "Express JSON body parser middleware order of operations",
      content: "My express endpoints are failing because `req.body` is coming up as undefined. I am calling `app.use(express.json())` but I did it at the bottom of the app after my router, is that why? I thought ordering didn't matter in express?",
      tags: ["express", "backend"],
      authorId: "other-coder-id",
      authorName: "Alex Dev",
      authorUsername: "alexdev",
      isResolved: true,
      answerCount: 1,
      createdAt: new Date(Date.now() - 3600000 * 20), // 20 hours ago
      updatedAt: new Date(Date.now() - 3600000 * 20),
    });

    // 5. Seed answers
    this.answers.push({
      id: ++this.answerCounter,
      doubtId: 1,
      content: "This is a feature of React Strict Mode introduced in React 18. In development, React deliberately mounts, unmounts, and remounts your components to ensure that your effects cleanly clean up their subscriptions and event listeners. \n\nTo prevent the double fetch, you can return a cleanup function to cancel the fetch (e.g. using AbortController) or disable StrictMode in your index.js (though keeping it and fixing the effect is the recommended way!).",
      authorId: "senior-architect-id",
      authorName: "Senior Architect",
      authorUsername: "senior_arch",
      isAccepted: false,
      createdAt: new Date(Date.now() - 3600000 * 7),
    });

    this.answers.push({
      id: ++this.answerCounter,
      doubtId: 2,
      content: "Yes, Express ordering is highly critical! Middlewares are executed sequentially. If your route is declared before `express.json()`, the route handler will be resolved first, before the body parsing middleware has a chance to read the stream and populate `req.body`. Always declare body parsers above your routes!",
      authorId: "senior-architect-id",
      authorName: "Senior Architect",
      authorUsername: "senior_arch",
      isAccepted: true,
      createdAt: new Date(Date.now() - 3600000 * 18),
    });
  }

  async getProfileByUserId(userId: string) {
    const profile = this.profiles.get(userId);
    if (!profile) return null;
    return {
      ...profile,
      postsCount: this.posts.filter(p => p.authorId === userId).length,
      doubtsCount: this.doubts.filter(d => d.authorId === userId).length,
      answersCount: this.answers.filter(a => a.authorId === userId).length,
    };
  }

  async getProfileByUsername(username: string) {
    const usernameLower = username.toLowerCase();
    for (const profile of this.profiles.values()) {
      if (profile.username.toLowerCase() === usernameLower) {
        return {
          ...profile,
          postsCount: this.posts.filter(p => p.authorId === profile.userId).length,
          doubtsCount: this.doubts.filter(d => d.authorId === profile.userId).length,
          answersCount: this.answers.filter(a => a.authorId === profile.userId).length,
        };
      }
    }
    return null;
  }

  async checkUsernameAvailable(username: string) {
    const usernameLower = username.toLowerCase();
    for (const profile of this.profiles.values()) {
      if (profile.username.toLowerCase() === usernameLower) {
        return false;
      }
    }
    return true;
  }

  async upsertProfile(userId: string, data: any) {
    const username = data.username.toLowerCase();
    const existing = this.profiles.get(userId);

    const profile = {
      id: existing ? existing.id : this.profiles.size + 1,
      userId,
      ...data,
      username,
      updatedAt: new Date(),
    };

    if (!existing) {
      profile.createdAt = new Date();
    } else {
      profile.createdAt = existing.createdAt;
    }

    this.profiles.set(userId, profile);
    return profile;
  }

  async listPosts(category?: string, tag?: string, limit = 10, offset = 0, authorId?: string) {
    let list = [...this.posts];
    if (category) {
      list = list.filter(p => p.category === category);
    }
    if (authorId) {
      list = list.filter(p => p.authorId === authorId);
    }
    if (tag) {
      list = list.filter(p => p.tags.includes(tag));
    }
    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return list.slice(offset, offset + limit).map(p => {
      const profile = Array.from(this.profiles.values()).find(prof => prof.userId === p.authorId);
      return {
        ...p,
        authorUsername: profile?.username ?? null,
        commentCount: this.comments.filter(c => c.postId === p.id).length,
      };
    });
  }

  async getFeaturedPosts() {
    const sorted = [...this.posts]
      .filter(p => p.category === "tech")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return sorted.slice(0, 4).map(p => {
      const profile = Array.from(this.profiles.values()).find(prof => prof.userId === p.authorId);
      return {
        ...p,
        authorUsername: profile?.username ?? null,
        commentCount: this.comments.filter(c => c.postId === p.id).length,
      };
    });
  }

  async getAllTags() {
    const tagsSet = new Set<string>();
    this.posts.forEach(p => p.tags.forEach((t: string) => tagsSet.add(t)));
    return Array.from(tagsSet).sort();
  }

  async getPost(id: number) {
    const post = this.posts.find(p => p.id === id);
    if (!post) return null;
    const profile = Array.from(this.profiles.values()).find(prof => prof.userId === post.authorId);
    return {
      ...post,
      authorUsername: profile?.username ?? null,
      commentCount: this.comments.filter(c => c.postId === id).length,
    };
  }

  async createPost(userId: string, authorName: string, data: any) {
    const id = ++this.postCounter;
    const words = data.content.split(/\s+/).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) + `-${id}`;

    const newPost = {
      id,
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      tags: data.tags ?? [],
      category: data.category ?? "tech",
      authorId: userId,
      authorName,
      coverImage: data.coverImage ?? null,
      readingTimeMinutes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.posts.push(newPost);
    return { ...newPost, commentCount: 0 };
  }

  async updatePost(id: number, userId: string, data: any) {
    const postIdx = this.posts.findIndex(p => p.id === id);
    if (postIdx === -1) throw new Error("Post not found");
    
    const post = this.posts[postIdx];
    if (post.authorId !== userId) throw new Error("Forbidden");

    const words = data.content.split(/\s+/).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) + `-${id}`;

    const updated = {
      ...post,
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      tags: data.tags ?? [],
      category: data.category ?? post.category,
      coverImage: data.coverImage ?? null,
      readingTimeMinutes,
      updatedAt: new Date(),
    };

    this.posts[postIdx] = updated;
    return { ...updated, commentCount: this.comments.filter(c => c.postId === id).length };
  }

  async deletePost(id: number, userId: string) {
    const post = this.posts.find(p => p.id === id);
    if (!post) return false;
    if (post.authorId !== userId) throw new Error("Forbidden");

    this.posts = this.posts.filter(p => p.id !== id);
    this.comments = this.comments.filter(c => c.postId !== id);
    return true;
  }

  async listComments(postId: number) {
    const list = this.comments
      .filter(c => c.postId === postId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return list.map(c => {
      const profile = Array.from(this.profiles.values()).find(p => p.userId === c.authorId);
      return {
        ...c,
        authorUsername: profile?.username ?? null,
      };
    });
  }

  async createComment(postId: number, authorId: string, authorName: string, content: string) {
    if (!this.posts.find(p => p.id === postId)) throw new Error("Post not found");

    const comment = {
      id: ++this.commentCounter,
      postId,
      authorId,
      authorName,
      content,
      createdAt: new Date(),
    };
    this.comments.push(comment);
    return comment;
  }

  async deleteComment(commentId: number, userId: string) {
    const comment = this.comments.find(c => c.id === commentId);
    if (!comment) return false;
    if (comment.authorId !== userId) throw new Error("Forbidden");

    this.comments = this.comments.filter(c => c.id !== commentId);
    return true;
  }

  async listDoubts(tag?: string, limit = 50, offset = 0, authorId?: string) {
    let list = [...this.doubts];
    if (tag) list = list.filter(d => d.tags.includes(tag));
    if (authorId) list = list.filter(d => d.authorId === authorId);
    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return list.slice(offset, offset + limit);
  }

  async getDoubt(id: number) {
    const doubt = this.doubts.find(d => d.id === id);
    if (!doubt) return null;
    const answers = this.answers
      .filter(a => a.doubtId === id)
      .sort((a, b) => (b.isAccepted ? 1 : 0) - (a.isAccepted ? 1 : 0) || b.createdAt.getTime() - a.createdAt.getTime());
    return { ...doubt, answers };
  }

  async createDoubt(userId: string, authorName: string, authorUsername: string | null, data: any) {
    const newDoubt = {
      id: ++this.doubtCounter,
      title: data.title,
      content: data.content,
      tags: data.tags ?? [],
      authorId: userId,
      authorName,
      authorUsername,
      isResolved: false,
      answerCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.doubts.push(newDoubt);
    return newDoubt;
  }

  async deleteDoubt(id: number, userId: string) {
    const doubt = this.doubts.find(d => d.id === id);
    if (!doubt) return false;
    if (doubt.authorId !== userId) throw new Error("Forbidden");

    this.doubts = this.doubts.filter(d => d.id !== id);
    this.answers = this.answers.filter(a => a.doubtId !== id);
    return true;
  }

  async createAnswer(doubtId: number, authorId: string, authorName: string, authorUsername: string | null, content: string) {
    const doubtIdx = this.doubts.findIndex(d => d.id === doubtId);
    if (doubtIdx === -1) throw new Error("Doubt not found");

    const answer = {
      id: ++this.answerCounter,
      doubtId,
      content,
      authorId,
      authorName,
      authorUsername,
      isAccepted: false,
      createdAt: new Date(),
    };

    this.answers.push(answer);
    this.doubts[doubtIdx].answerCount += 1;
    this.doubts[doubtIdx].updatedAt = new Date();

    return answer;
  }

  async deleteAnswer(doubtId: number, answerId: number, userId: string) {
    const answer = this.answers.find(a => a.id === answerId);
    if (!answer || answer.doubtId !== doubtId) return false;
    if (answer.authorId !== userId) throw new Error("Forbidden");

    this.answers = this.answers.filter(a => a.id !== answerId);
    const doubtIdx = this.doubts.findIndex(d => d.id === answer.doubtId);
    if (doubtIdx !== -1) {
      this.doubts[doubtIdx].answerCount = Math.max(0, this.doubts[doubtIdx].answerCount - 1);
      this.doubts[doubtIdx].updatedAt = new Date();
    }
    return true;
  }

  async acceptAnswer(doubtId: number, answerId: number, userId: string) {
    const doubtIdx = this.doubts.findIndex(d => d.id === doubtId);
    if (doubtIdx === -1) throw new Error("Doubt not found");
    if (this.doubts[doubtIdx].authorId !== userId) throw new Error("Forbidden");

    // Clear previous accepted
    this.answers.forEach(a => {
      if (a.doubtId === doubtId) a.isAccepted = false;
    });

    const answerIdx = this.answers.findIndex(a => a.id === answerId);
    if (answerIdx === -1 || this.answers[answerIdx].doubtId !== doubtId) {
      throw new Error("Answer not found");
    }

    this.answers[answerIdx].isAccepted = true;
    this.doubts[doubtIdx].isResolved = true;
    this.doubts[doubtIdx].updatedAt = new Date();

    return this.answers[answerIdx];
  }
}

// Instantiate the active repository depending on environment configuration
export const repo: IRepository = process.env.DATABASE_URL
  ? new PostgresRepository()
  : (() => {
      if (process.env.NODE_ENV === "production") {
        throw new Error("❌ Critical Configuration Error: DATABASE_URL must be configured in production mode.");
      }
      return new InMemoryRepository();
    })();
