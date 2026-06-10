import { pgTable, text, serial, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array().notNull().default([]),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  category: text("category").notNull().default("tech"),
  coverImage: text("cover_image"),
  readingTimeMinutes: integer("reading_time_minutes").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  authorIdIdx: index("posts_author_id_idx").on(table.authorId),
  categoryCreatedIdx: index("posts_category_created_idx").on(table.category, table.createdAt),
}));

export const insertPostSchema = createInsertSchema(postsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
