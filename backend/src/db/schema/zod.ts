import { z } from "zod";

export const ListPostsQueryParams = z.object({
  category: z.enum(["tech", "general"]).optional(),
  tag: z.string().optional(),
  limit: z.coerce.number().optional().default(10),
  offset: z.coerce.number().optional().default(0),
  authorId: z.string().optional(),
});

export const CreatePostBody = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(500),
  content: z.string().min(1).max(20000),
  tags: z.array(z.string()).optional(),
  coverImage: z.string().optional().nullable(),
  category: z.enum(["tech", "general"]).optional().default("tech"),
});

export const CreateCommentBody = z.object({
  content: z.string().min(1).max(1000),
});
