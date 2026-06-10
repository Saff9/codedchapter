import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export let pool: pg.Pool | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let db: any = null;

if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Critical Configuration Error: DATABASE_URL is required in production mode.");
    process.exit(1);
  }
  console.warn("⚠️ DATABASE_URL is not set. Running in preview mode with in-memory storage.");
} else {
  const isProd = process.env.NODE_ENV === "production";
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProd ? { rejectUnauthorized: false } : undefined,
    max: isProd ? 1 : 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
  db = drizzle(pool, { schema });
}

export * from "./schema";
