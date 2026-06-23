import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useLocation, useSearch } from "wouter";
import { PostCard } from "@/components/post-card";
import { Hash, Search, AlertCircle, BookOpen, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { updateMetaTags } from "@/lib/utils";

export default function GeneralLogs() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const tagParam = searchParams.get("tag");
  const searchQuery = searchParams.get("search") || "";
  const [location, setLocation] = useLocation();

  useEffect(() => {
    updateMetaTags({
      title: "General Journals | Coded Chapter",
      description: "Personal thoughts, learning updates, and college plans.",
      canonicalUrl: "https://codedchapter.vercel.app/general",
    });
  }, []);

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["/api/posts", tagParam],
    queryFn: () => api.listPosts(undefined, tagParam || undefined),
  });

  const { data: tags } = useQuery({
    queryKey: ["/api/posts/tags"],
    queryFn: () => api.getAllTags(),
  });

  const handleSearchChange = (val: string) => {
    const nextParams = new URLSearchParams(searchString);
    if (val.trim()) {
      nextParams.set("search", val);
    } else {
      nextParams.delete("search");
    }
    setLocation(`${location.split("?")[0]}?${nextParams.toString()}`);
  };

  const handleTagChange = (tag: string | null) => {
    const nextParams = new URLSearchParams(searchString);
    if (tag) {
      nextParams.set("tag", tag);
    } else {
      nextParams.delete("tag");
    }
    setLocation(`${location.split("?")[0]}?${nextParams.toString()}`);
  };

  const filteredPosts = posts?.filter((post: any) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      post.title.toLowerCase().includes(query) ||
      (post.excerpt ?? "").toLowerCase().includes(query) ||
      (post.tags && post.tags.some((t: string) => t.toLowerCase().includes(query)))
    );
  }) || [];

  return (
    <div className="relative min-h-screen">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-secondary/6 blur-[160px]" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[140px]" />

      <div className="container mx-auto px-6 lg:px-8 py-12 md:py-16 relative z-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* ── Main content ───────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Page header */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-mono text-secondary bg-secondary/10 border border-secondary/20 px-2.5 py-1 rounded-full">
                  // general_journals
                </span>
                {/* Live pill */}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-primary bg-primary/8 border border-primary/20 px-2 py-0.5 rounded-full">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                  </span>
                  Substack live
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    {tagParam ? (
                      <>Journals tagged <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">#{tagParam}</span></>
                    ) : (
                      <>General <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">Journals</span></>
                    )}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Personal thoughts, learning updates, and college plans.
                  </p>
                </div>

                {/* Search */}
                <div className="relative w-full md:max-w-xs shrink-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                  <input
                    type="text"
                    placeholder="Search journals..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 text-xs rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 text-foreground"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleSearchChange("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {tagParam && (
                <button
                  onClick={() => handleTagChange(null)}
                  className="mt-3 text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                >
                  ✕ Clear tag filter
                </button>
              )}
            </div>

            {/* Content */}
            {error ? (
              <div className="py-14 px-8 text-center border border-destructive/20 rounded-2xl bg-destructive/5 flex flex-col items-center gap-3">
                <AlertCircle className="w-9 h-9 text-destructive/70" />
                <p className="text-sm font-semibold text-destructive">Failed to load journals</p>
                <p className="text-xs text-muted-foreground max-w-xs">{(error as any).message || "Try refreshing the page."}</p>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-56 bg-card rounded-2xl border border-border/40 overflow-hidden relative">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-24 flex flex-col items-center text-center border border-dashed border-border/40 rounded-2xl bg-card/20">
                <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No journals found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {tagParam || searchQuery ? "Try a different search or tag." : "Check back soon for new entries."}
                </p>
                {(tagParam || searchQuery) && (
                  <button
                    onClick={() => { handleTagChange(null); handleSearchChange(""); }}
                    className="mt-4 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredPosts.map((post: any, i: number) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.35, ease: "easeOut" }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────── */}
          <aside className="w-full lg:w-52 shrink-0">
            <div className="sticky top-24 space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 px-2">
                <Hash className="w-3 h-3 text-primary" />
                Filter by tag
              </div>

              <button
                onClick={() => handleTagChange(null)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 ${
                  !tagParam
                    ? "bg-primary/10 text-primary font-semibold border border-primary/20 shadow-sm shadow-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                All journals
              </button>

              {tags?.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagChange(tag)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all duration-200 ${
                    tagParam === tag
                      ? "bg-primary/10 text-primary font-semibold border border-primary/20 shadow-sm shadow-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  #{tag}
                </button>
              ))}

              {/* Terminal note */}
              <div className="mt-6 p-3 rounded-xl border border-border/40 bg-card/50">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                  <Terminal className="w-3 h-3 text-primary/60" />
                  <span className="text-primary/60">source:</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-1 leading-relaxed">
                  All journals are pulled directly from Substack.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
