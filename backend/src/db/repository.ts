import { db } from "./index";
import { profilesTable, postsTable, commentsTable, doubtsTable, doubtAnswersTable } from "./schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { logger } from "../lib/logger";


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
  private async enrichProfileWithCounts(profile: typeof profilesTable.$inferSelect) {
    const [[postsCountRes], [doubtsCountRes], [answersCountRes]] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(postsTable).where(eq(postsTable.authorId, profile.userId)),
      db.select({ count: sql<number>`count(*)` }).from(doubtsTable).where(eq(doubtsTable.authorId, profile.userId)),
      db.select({ count: sql<number>`count(*)` }).from(doubtAnswersTable).where(eq(doubtAnswersTable.authorId, profile.userId)),
    ]);

    return {
      ...profile,
      postsCount: Number(postsCountRes?.count ?? 0),
      doubtsCount: Number(doubtsCountRes?.count ?? 0),
      answersCount: Number(answersCountRes?.count ?? 0),
    };
  }

  async getProfileByUserId(userId: string) {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
    if (!profile) return null;
    return this.enrichProfileWithCounts(profile);
  }

  async getProfileByUsername(username: string) {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.username, username.toLowerCase()));
    if (!profile) return null;
    return this.enrichProfileWithCounts(profile);
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
    return db.transaction(async (tx: any) => {
      const [doubt] = await tx.select().from(doubtsTable).where(eq(doubtsTable.id, doubtId));
      if (!doubt) throw new Error("Doubt not found");
      if (doubt.authorId !== userId) throw new Error("Forbidden");

      const [target] = await tx.select().from(doubtAnswersTable).where(eq(doubtAnswersTable.id, answerId));
      if (!target || target.doubtId !== doubtId) throw new Error("Answer not found");

      await tx.update(doubtAnswersTable).set({ isAccepted: false }).where(eq(doubtAnswersTable.doubtId, doubtId));
      const [answer] = await tx
        .update(doubtAnswersTable)
        .set({ isAccepted: true })
        .where(eq(doubtAnswersTable.id, answerId))
        .returning();
      await tx.update(doubtsTable).set({ isResolved: true, updatedAt: new Date() }).where(eq(doubtsTable.id, doubtId));

      return answer;
    });
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
    // No-op for production readiness (starting with clean repository state)
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

class ResilientRepository implements IRepository {
  private pgRepo: PostgresRepository | null = null;
  private inMemoryRepo: InMemoryRepository;
  private useInMemory = false;

  constructor() {
    this.inMemoryRepo = new InMemoryRepository();
    if (process.env.DATABASE_URL) {
      try {
        this.pgRepo = new PostgresRepository();
      } catch (err) {
        logger.error({ err }, "Failed to initialize PostgresRepository — falling back to in-memory");
        this.useInMemory = true;
      }
    } else {
      logger.warn("DATABASE_URL is not set — using in-memory repository");
      this.useInMemory = true;
    }
  }

  private async run<T>(op: (r: IRepository) => Promise<T>): Promise<T> {
    if (this.useInMemory || !this.pgRepo || !db) {
      return op(this.inMemoryRepo);
    }
    try {
      return await op(this.pgRepo);
    } catch (err) {
      logger.error({ err }, "Database operation failed — falling back to in-memory repository");
      this.useInMemory = true;
      return op(this.inMemoryRepo);
    }
  }

  getProfileByUserId(userId: string) { return this.run(r => r.getProfileByUserId(userId)); }
  getProfileByUsername(username: string) { return this.run(r => r.getProfileByUsername(username)); }
  checkUsernameAvailable(username: string) { return this.run(r => r.checkUsernameAvailable(username)); }
  upsertProfile(userId: string, data: any) { return this.run(r => r.upsertProfile(userId, data)); }

  listPosts(category?: string, tag?: string, limit?: number, offset?: number, authorId?: string) {
    return this.run(r => r.listPosts(category, tag, limit, offset, authorId));
  }
  getFeaturedPosts() { return this.run(r => r.getFeaturedPosts()); }
  getAllTags() { return this.run(r => r.getAllTags()); }
  getPost(id: number) { return this.run(r => r.getPost(id)); }
  createPost(userId: string, authorName: string, data: any) { return this.run(r => r.createPost(userId, authorName, data)); }
  updatePost(id: number, userId: string, data: any) { return this.run(r => r.updatePost(id, userId, data)); }
  deletePost(id: number, userId: string) { return this.run(r => r.deletePost(id, userId)); }

  listComments(postId: number) { return this.run(r => r.listComments(postId)); }
  createComment(postId: number, authorId: string, authorName: string, content: string) {
    return this.run(r => r.createComment(postId, authorId, authorName, content));
  }
  deleteComment(commentId: number, userId: string) { return this.run(r => r.deleteComment(commentId, userId)); }

  listDoubts(tag?: string, limit?: number, offset?: number, authorId?: string) {
    return this.run(r => r.listDoubts(tag, limit, offset, authorId));
  }
  getDoubt(id: number) { return this.run(r => r.getDoubt(id)); }
  createDoubt(userId: string, authorName: string, authorUsername: string | null, data: any) {
    return this.run(r => r.createDoubt(userId, authorName, authorUsername, data));
  }
  deleteDoubt(id: number, userId: string) { return this.run(r => r.deleteDoubt(id, userId)); }
  createAnswer(doubtId: number, authorId: string, authorName: string, authorUsername: string | null, content: string) {
    return this.run(r => r.createAnswer(doubtId, authorId, authorName, authorUsername, content));
  }
  deleteAnswer(doubtId: number, answerId: number, userId: string) {
    return this.run(r => r.deleteAnswer(doubtId, answerId, userId));
  }
  acceptAnswer(doubtId: number, answerId: number, userId: string) {
    return this.run(r => r.acceptAnswer(doubtId, answerId, userId));
  }
}

// Instantiate the active repository depending on environment configuration
export const repo: IRepository = new ResilientRepository();
