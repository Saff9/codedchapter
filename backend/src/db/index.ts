import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import * as schema from "./schema";

const { Pool } = pg;
pg.defaults.ssl = { rejectUnauthorized: false };

export let pool: pg.Pool | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let db: any = null;

export async function runMigrations() {
  if (!db) return;
  try {
    // Determine the migrations folder path relative to the runtime file
    // The bundled file is at backend/dist/app.mjs, and the migrations folder is copied to backend/dist/migrations
    const migrationsFolder = path.resolve(__dirname, "migrations");
    console.log("⚡ Running automatic database migrations at startup from:", migrationsFolder);
    await migrate(db, { migrationsFolder });
    console.log("✅ Database migrations completed successfully!");

    // Purge old mock/placeholder data from the live database
    try {
      const { sql } = await import("drizzle-orm");
      console.log("⚡ Cleaning up default placeholders/mock comments and doubts...");
      await db.delete(schema.commentsTable).where(
        sql`author_id IN ('mock-user-123', 'senior-architect-id', 'other-coder-id', '1')`
      );
      await db.delete(schema.doubtsTable).where(
        sql`author_id IN ('mock-user-123', 'senior-architect-id', 'other-coder-id', '1')`
      );
      await db.delete(schema.doubtAnswersTable).where(
        sql`author_id IN ('mock-user-123', 'senior-architect-id', 'other-coder-id', '1')`
      );
      await db.delete(schema.postsTable).where(
        sql`author_id IN ('mock-user-123', 'senior-architect-id', 'other-coder-id', '1')`
      );
      console.log("✅ Placeholder cleanup completed successfully!");
    } catch (cleanupErr) {
      console.error("⚠️ Failed to clean up database placeholders:", cleanupErr);
    }
  } catch (err) {
    console.error("❌ Failed to run database migrations at startup:", err);
  }
}

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL is not set. Running with in-memory storage fallback.");
} else {
  const isProd = process.env.NODE_ENV === "production";
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
    db = drizzle(pool, { schema });
  } catch (err) {
    console.error("❌ Failed to initialize database pool:", err);
  }
}

export * from "./schema";
