import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export let pool: pg.Pool | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let db: any = null;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL is not set. Running with in-memory storage fallback.");
} else {
  const isProd = process.env.NODE_ENV === "production";
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProd ? { rejectUnauthorized: false } : undefined,
      max: isProd ? 1 : 10,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
    db = drizzle(pool, { schema });
  } catch (err) {
    console.error("❌ Failed to initialize database pool:", err);
  }
}

export * from "./schema";
