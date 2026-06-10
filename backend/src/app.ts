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
import router from "./routes";
import { logger } from "./lib/logger";
import { escapeHtml, isSafeHttpUrl } from "./lib/escape";

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
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
  }),
);
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true }));

app.use(supabaseAuthMiddleware());

// Bot requests for /blog/:id get OG tags injected server-side
app.get("/blog/:id", async (req, res, next): Promise<any> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return next();
    }

    const post = await repo.getPost(id);
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
    const url = escapeHtml(`${req.protocol}://${req.get("host")}/blog/${post.id}`);
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
