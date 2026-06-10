import { Link } from "wouter";
import { Clock, MessageCircle } from "lucide-react";

const TAG_COLORS: Record<string, string> = {
  python: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  javascript: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  html: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  css: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  beginners: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  journal: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  concepts: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  functions: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  web: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
};
const FALLBACK_COLORS = [
  "text-amber-400 bg-amber-400/10 border-amber-400/20",
  "text-violet-400 bg-violet-400/10 border-violet-400/20",
  "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  "text-sky-400 bg-sky-400/10 border-sky-400/20",
];
const STRIPE_COLORS: Record<string, string> = {
  python: "bg-sky-500",
  javascript: "bg-yellow-500",
  html: "bg-orange-500",
  css: "bg-blue-500",
  beginners: "bg-emerald-500",
  journal: "bg-violet-500",
  concepts: "bg-amber-500",
  functions: "bg-rose-500",
  web: "bg-cyan-500",
};

function tagColor(tag: string, i: number) {
  return TAG_COLORS[tag] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
}
function stripeColor(tag: string) {
  return STRIPE_COLORS[tag] ?? "bg-primary";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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

export function PostCard({ post }: { post: Post }) {
  const primaryTag = post.tags[0] ?? "";
  return (
    <Link href={`/blog/${post.id}`}>
      <article className="group relative h-full flex flex-col bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
        {/* Colored top stripe */}
        <div
          className={`h-[3px] w-full ${stripeColor(primaryTag)} opacity-50 group-hover:opacity-100 transition-opacity duration-300`}
        />

        <div className="flex flex-col flex-1 p-5 gap-3">
          {/* Category & Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {post.category && (
              <span
                className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase ${
                  post.category === "tech"
                    ? "text-primary bg-primary/10 border-primary/20"
                    : "text-rose-400 bg-rose-400/10 border-rose-400/20"
                }`}
              >
                {post.category === "tech" ? "🚀 tech" : "💡 general"}
              </span>
            )}
            {post.tags.slice(0, 3).map((tag, i) => (
              <span
                key={tag}
                className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-mono font-medium ${tagColor(tag, i)}`}
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3
            className="text-[15px] font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
            {post.excerpt}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <span className="w-4 h-4 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-[8px] uppercase shrink-0">
                {post.authorName.charAt(0)}
              </span>
              <span className="font-medium truncate">{post.authorName}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
              <span>{formatDate(post.createdAt)}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {post.readingTimeMinutes} min
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
