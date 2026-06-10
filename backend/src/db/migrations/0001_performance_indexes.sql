CREATE INDEX IF NOT EXISTS "posts_author_id_idx" ON "posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_category_created_idx" ON "posts" USING btree ("category", "created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_tags_gin_idx" ON "posts" USING gin ("tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doubts_author_id_idx" ON "doubts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doubts_created_at_idx" ON "doubts" USING btree ("created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doubts_tags_gin_idx" ON "doubts" USING gin ("tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doubt_answers_author_id_idx" ON "doubt_answers" USING btree ("author_id");
