import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import * as schema from "./schema";
import { logger } from "../lib/logger";

const { Pool } = pg;
pg.defaults.ssl = { rejectUnauthorized: false };

export let pool: pg.Pool | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let db: any = null;

export async function runMigrations() {
  if (!db) return;
  try {
    // The bundled file lands at backend/dist/app.mjs; migrations folder is copied alongside it.
    const migrationsFolder = path.resolve(__dirname, "migrations");
    logger.info({ migrationsFolder }, "Running database migrations");
    await migrate(db, { migrationsFolder });
    logger.info("Database migrations completed");

    // Clean up any mock/placeholder rows that were seeded during local development.
    // These author IDs only ever exist in dev and should never reach the live database,
    // but we purge them on startup just in case.
    try {
      const { sql } = await import("drizzle-orm");
      const mockIds = sql`author_id IN ('mock-user-123', 'senior-architect-id', 'other-coder-id', '1')`;

      await db.delete(schema.commentsTable).where(mockIds);
      await db.delete(schema.doubtsTable).where(mockIds);
      await db.delete(schema.doubtAnswersTable).where(mockIds);
      await db.delete(schema.postsTable).where(mockIds);

      logger.info("Placeholder cleanup completed");
    } catch (cleanupErr) {
      logger.warn({ err: cleanupErr }, "Failed to clean up placeholder rows — not fatal");
    }
  } catch (err) {
    logger.error({ err }, "Database migrations failed at startup");
  }
}

if (!process.env.DATABASE_URL) {
  logger.warn("DATABASE_URL is not set — running with in-memory storage fallback");
} else {
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
    logger.error({ err }, "Failed to initialize database pool");
  }
}

export * from "./schema";
