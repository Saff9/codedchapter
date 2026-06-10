import app from "./app";
import { logger } from "./lib/logger";

if (process.env.NODE_ENV === "production" && !process.env.SUPABASE_JWT_SECRET) {
  logger.error("❌ Critical Configuration Error: SUPABASE_JWT_SECRET is required in production mode.");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && !process.env.ADMIN_EMAIL) {
  logger.error("❌ Critical Configuration Error: ADMIN_EMAIL is required in production mode.");
  process.exit(1);
}

const rawPort = process.env["PORT"] || "5000";
const port = Number(rawPort);

const server = app.listen(port, () => {
  logger.info({ port }, "Server listening");
});

server.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});
