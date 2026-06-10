import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import {
  HelpCircle, CheckCircle2, MessageSquare, Plus,
  Tag, ChevronRight, Loader2, Search, AlertCircle
} from "lucide-react";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TAG_COLORS = ["text-sky-400 bg-sky-400/10 border-sky-400/20", "text-amber-400 bg-amber-400/10 border-amber-400/20", "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", "text-violet-400 bg-violet-400/10 border-violet-400/20", "text-rose-400 bg-rose-400/10 border-rose-400/20"];

export default function DoubtsListPage() {
  const { user } = useAuth();
  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  useEffect(() => {
    api.listDoubts()
      .then(d => { setDoubts(d); setLoading(false); })
      .catch((err) => { setError(err.message || "Failed to load doubts"); setLoading(false); });
  }, []);

  const allTags = Array.from(new Set(doubts.flatMap(d => d.tags)));
  const filtered = doubts.filter(d => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase());
    const matchTag = !tagFilter || d.tags.includes(tagFilter);
    return matchSearch && matchTag;
  });

  return (
    <div className="container mx-auto px-6 lg:px-8 py-12 md:py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <div className="text-xs font-mono text-primary mb-2">// community</div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Doubts</h1>
          <p className="text-sm text-muted-foreground mt-1">Stuck on something? Ask the community.</p>
        </div>
        {user ? (
          <Link href="/doubts/ask">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0">
              <Plus className="w-4 h-4" /> Ask a Doubt
            </button>
          </Link>
        ) : (
          <Link href="/sign-up">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shrink-0">
              <Plus className="w-4 h-4" /> Sign in to ask
            </button>
          </Link>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search doubts…"
              className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
            />
          </div>

          {error ? (
            <div className="py-12 px-6 text-center border border-red-500/20 rounded-xl bg-red-500/5 text-red-400 flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-sm font-semibold">{error}</p>
              <button 
                onClick={() => { setError(null); setLoading(true); api.listDoubts().then(d => { setDoubts(d); setLoading(false); }).catch(e => { setError(e.message || "Failed to load doubts"); setLoading(false); }); }} 
                className="text-xs underline hover:text-red-300"
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-border/50 rounded-xl bg-card/30 space-y-3">
              <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No doubts found. Be the first to ask!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((doubt, i) => (
                <motion.div
                  key={doubt.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link href={`/doubts/${doubt.id}`}>
                    <div className="group bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Status icon */}
                        <div className={`mt-0.5 shrink-0 ${doubt.isResolved ? "text-emerald-500" : "text-muted-foreground/40"}`}>
                          {doubt.isResolved
                            ? <CheckCircle2 className="w-5 h-5" />
                            : <HelpCircle className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            {doubt.title}
                          </h3>
                          <div className="flex flex-wrap gap-1.5">
                            {doubt.tags.map((t: string, j: number) => (
                              <span key={t} className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${TAG_COLORS[j % TAG_COLORS.length]}`}>#{t}</span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{doubt.authorUsername ? `@${doubt.authorUsername}` : doubt.authorName}</span>
                            <span>·</span>
                            <span>{timeAgo(doubt.createdAt)}</span>
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-center gap-1">
                          <div className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-lg ${doubt.answerCount > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                            <MessageSquare className="w-3 h-3" />
                            {doubt.answerCount}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-56 shrink-0">
          <div className="sticky top-20 space-y-6">
            {/* Stats */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="text-xs font-mono text-muted-foreground">stats</div>
              {[
                { label: "Total doubts", val: doubts.length },
                { label: "Resolved", val: doubts.filter(d => d.isResolved).length },
                { label: "Open", val: doubts.filter(d => !d.isResolved).length },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold font-mono">{val}</span>
                </div>
              ))}
            </div>

            {/* Tag filter */}
            {allTags.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground mb-3 px-1">
                  <Tag className="w-3.5 h-3.5" /> Filter
                </div>
                <button
                  onClick={() => setTagFilter(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!tagFilter ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted/50"}`}
                >
                  All topics
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-mono transition-colors ${tagFilter === tag ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted/50"}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
