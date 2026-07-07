import express, { type Express } from "express";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import { supabaseAuthMiddleware } from "./middlewares/authMiddleware";
import { securityHeaders } from "./middlewares/security";
import { rateLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";
import { repo } from "./db/repository";
import { runMigrations } from "./db";
import router from "./routes";
import { logger } from "./lib/logger";
import { escapeHtml, isSafeHttpUrl } from "./lib/escape";
import { getSubstackPosts } from "./lib/substack";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(securityHeaders());
app.use(compression());
app.use(rateLimiter());

// Strip trailing slashes so "https://example.com/" and "https://example.com" both match.
// Browsers always send origins without a trailing slash, so an env var set with one
// would silently block every request.
const normalise = (url: string) => url.replace(/\/+$/, "");

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  process.env.FRONTEND_URL ? normalise(process.env.FRONTEND_URL) : null,
].filter(Boolean) as string[];

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin, curl, Render health checks)
      // and any origin that exactly matches our allowlist after normalisation.
      if (!origin || allowedOrigins.includes(normalise(origin))) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
  }),
);
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true }));

let migrationsRun = false;
let migrationsPromise: Promise<void> | null = null;

app.use(async (req, res, next) => {
  if (migrationsRun || !process.env.DATABASE_URL) {
    return next();
  }
  try {
    if (!migrationsPromise) {
      migrationsPromise = runMigrations().then(() => {
        migrationsRun = true;
      });
    }
    await migrationsPromise;
  } catch (err) {
    req.log?.error({ err }, "Lazy migrations failed");
  }
  next();
});

app.use(supabaseAuthMiddleware());

// Bot requests for /blog/:id get OG tags injected server-side
app.get("/blog/:id", async (req, res, next): Promise<any> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return next();
    }

    const feedUrl = process.env.SUBSTACK_FEED_URL || "https://codedchapter.substack.com/feed";
    let post: any = null;
    if (feedUrl) {
      try {
        const posts = await getSubstackPosts(feedUrl);
        post = posts.find((p) => p.id === id);
      } catch (substackErr) {
        req.log?.warn({ err: substackErr }, "Substack post lookup failed for bot, falling back to DB");
      }
    }
    if (!post) {
      post = await repo.getPost(id);
    }

    if (!post) {
      return res.status(404).send("Chapter not found");
    }

    let htmlPath = path.resolve(process.cwd(), "dist/index.html");
    if (!fs.existsSync(htmlPath)) {
      htmlPath = path.resolve(process.cwd(), "frontend/dist/index.html");
    }
    if (!fs.existsSync(htmlPath)) {
      htmlPath = path.resolve(process.cwd(), "index.html");
    }

    let html = "";
    if (fs.existsSync(htmlPath)) {
      html = fs.readFileSync(htmlPath, "utf-8");
    } else {
      html = `<!DOCTYPE html><html><head><title>__TITLE__</title></head><body></body></html>`;
    }

    const title = escapeHtml(`${post.title} | Coded Chapter`);
    const desc = escapeHtml(post.excerpt || "Read this chapter of my coding journey.");
    const frontendUrl = process.env.FRONTEND_URL || "https://codedchapter.vercel.app";
    const url = escapeHtml(`${frontendUrl}/blog/${post.id}`);
    const image = post.coverImage && isSafeHttpUrl(post.coverImage) ? escapeHtml(post.coverImage) : "";

    html = html
      .replace(/<title>.*?<\/title>/gi, "")
      .replace(/<meta property="og:title" content=".*?" \/>/gi, "")
      .replace(/<meta property="og:description" content=".*?" \/>/gi, "")
      .replace(/<meta property="og:url" content=".*?" \/>/gi, "")
      .replace(/<meta property="og:image" content=".*?" \/>/gi, "")
      .replace(/<meta name="description" content=".*?" \/>/gi, "");

    const ogTags = `
      <title>${title}</title>
      <meta name="description" content="${desc}" />
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${desc}" />
      <meta property="og:url" content="${url}" />
      <meta property="og:type" content="article" />
      ${image ? `<meta property="og:image" content="${image}" />` : ""}
    `;

    html = html.replace("<head>", `<head>${ogTags}`);

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    return res.send(html);
  } catch (err) {
    req.log.error({ err }, "SEO pre-rendering failed");
    return next();
  }
});

app.use("/api", router);

app.use(errorHandler);

export default app;
