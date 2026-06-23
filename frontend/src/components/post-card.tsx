import { Link } from "wouter";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";

// ─── Tag / stripe colour maps ────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  python:      "text-sky-400 bg-sky-400/10 border-sky-400/25",
  javascript:  "text-yellow-400 bg-yellow-400/10 border-yellow-400/25",
  html:        "text-orange-400 bg-orange-400/10 border-orange-400/25",
  css:         "text-blue-400 bg-blue-400/10 border-blue-400/25",
  beginners:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  journal:     "text-violet-400 bg-violet-400/10 border-violet-400/25",
  concepts:    "text-amber-400 bg-amber-400/10 border-amber-400/25",
  functions:   "text-rose-400 bg-rose-400/10 border-rose-400/25",
  web:         "text-cyan-400 bg-cyan-400/10 border-cyan-400/25",
};

const FALLBACK_COLORS = [
  "text-amber-400 bg-amber-400/10 border-amber-400/25",
  "text-violet-400 bg-violet-400/10 border-violet-400/25",
  "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  "text-sky-400 bg-sky-400/10 border-sky-400/25",
];

// Gradient stops for the top glow stripe (first tag determines colour)
const STRIPE_GRADIENTS: Record<string, string> = {
  python:     "from-sky-500/80 via-sky-400/40 to-transparent",
  javascript: "from-yellow-500/80 via-yellow-400/40 to-transparent",
  html:       "from-orange-500/80 via-orange-400/40 to-transparent",
  css:        "from-blue-500/80 via-blue-400/40 to-transparent",
  beginners:  "from-emerald-500/80 via-emerald-400/40 to-transparent",
  journal:    "from-violet-500/80 via-violet-400/40 to-transparent",
  concepts:   "from-amber-500/80 via-amber-400/40 to-transparent",
  functions:  "from-rose-500/80 via-rose-400/40 to-transparent",
  web:        "from-cyan-500/80 via-cyan-400/40 to-transparent",
};

// Mesh background accent colours that bleed into card on hover
const MESH_COLORS: Record<string, string> = {
  python:     "group-hover:bg-sky-500/[0.04]",
  javascript: "group-hover:bg-yellow-500/[0.04]",
  html:       "group-hover:bg-orange-500/[0.04]",
  css:        "group-hover:bg-blue-500/[0.04]",
  beginners:  "group-hover:bg-emerald-500/[0.04]",
  journal:    "group-hover:bg-violet-500/[0.04]",
  concepts:   "group-hover:bg-amber-500/[0.04]",
  functions:  "group-hover:bg-rose-500/[0.04]",
  web:        "group-hover:bg-cyan-500/[0.04]",
};

function tagColor(tag: string, i: number) {
  return TAG_COLORS[tag] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
}
function stripeGradient(tag: string) {
  return STRIPE_GRADIENTS[tag] ?? "from-amber-500/80 via-amber-400/40 to-transparent";
}
function meshColor(tag: string) {
  return MESH_COLORS[tag] ?? "group-hover:bg-amber-500/[0.04]";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Interface ───────────────────────────────────────────────────────────────

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  authorName: string;
  category?: string;
  readingTimeMinutes: number;
  commentCount: number;
  createdAt: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PostCard({ post }: { post: Post }) {
  const primaryTag = post.tags[0] ?? "";

  return (
    <Link href={`/blog/${post.id}`}>
      <motion.article
        className={[
          "group relative flex flex-col h-full",
          "bg-card border border-border/60 rounded-2xl overflow-hidden cursor-pointer",
          "transition-all duration-300",
          "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
        ].join(" ")}
        style={{
          // Premium glow ring on hover via boxShadow; Tailwind can't do arbitrary
          // multi-shadow reliably, so we inline just the hover glow
        }}
        whileHover={{
          boxShadow:
            "0 20px 40px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(245,158,11,0.12), 0 0 24px 0 rgba(245,158,11,0.06)",
        }}
        transition={{ duration: 0.25 }}
      >
        {/* ── Gradient glow top stripe ── */}
        <div
          className={`h-[3px] w-full bg-gradient-to-r ${stripeGradient(primaryTag)} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
        />

        {/* ── Mesh / ambient background shift on hover ── */}
        <div
          className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${meshColor(primaryTag)}`}
        />

        {/* ── Corner glow orb (top-right) ── */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* ── Content ── */}
        <div className="relative flex flex-col flex-1 p-5 gap-3">

          {/* Category + Tag pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {post.category && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wide ${
                  post.category === "tech"
                    ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
                    : "text-rose-400 bg-rose-400/10 border-rose-400/20"
                }`}
              >
                {post.category === "tech" ? "🚀 tech" : "💡 general"}
              </span>
            )}
            {post.tags.slice(0, 3).map((tag, i) => (
              <span
                key={tag}
                className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-mono font-medium ${tagColor(tag, i)}`}
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3
            className="text-base font-bold leading-snug tracking-tight line-clamp-2 group-hover:text-primary transition-colors duration-200"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            {post.title}
          </h3>

          {/* Excerpt */}
          <p
            className="text-[13px] text-muted-foreground leading-relaxed line-clamp-3 flex-1"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            {post.excerpt}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto gap-2">
            {/* Author */}
            <div className="flex items-center gap-2 min-w-0">
              {/* Avatar initial circle with amber gradient */}
              <span
                className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold uppercase text-black select-none"
                style={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  fontFamily: "Fira Code, monospace",
                }}
              >
                {post.authorName.charAt(0)}
              </span>
              <span
                className="text-xs font-medium text-foreground/80 truncate"
                style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
              >
                {post.authorName}
              </span>
            </div>

            {/* Date + Reading time */}
            <div
              className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              <span>{formatDate(post.createdAt)}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary/60" />
                {post.readingTimeMinutes} min
              </span>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
