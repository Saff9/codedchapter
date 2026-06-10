import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useLocation, useSearch } from "wouter";
import { PostCard } from "@/components/post-card";
import { Hash, Search, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function GeneralLogs() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const tagParam = searchParams.get("tag");
  const searchQuery = searchParams.get("search") || "";
  const [location, setLocation] = useLocation();

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["/api/posts", "general", tagParam],
    queryFn: () => api.listPosts("general", tagParam || undefined),
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
    <div className="container mx-auto px-6 lg:px-8 py-12 md:py-16">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="mb-8">
            <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">// general_journals</div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  {tagParam ? (
                    <>General logs tagged <span className="text-primary">#{tagParam}</span></>
                  ) : (
                    "General Journals"
                  )}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">Personal thoughts, learning updates, J&K BOSE details, and college plans.</p>
              </div>

              {/* Search box */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                <input
                  type="text"
                  placeholder="Search general journals..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-border/60 bg-card/50 outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50 text-foreground"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {tagParam && (
              <button
                onClick={() => handleTagChange(null)}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Clear tag filter
              </button>
            )}
          </div>

          {error ? (
            <div className="py-12 px-6 text-center border border-destructive/20 rounded-xl bg-destructive/5 text-destructive flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <p className="text-sm font-semibold">Failed to fetch general journals</p>
              <p className="text-xs text-muted-foreground max-w-xs">{(error as any).message || "Database connection error."}</p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-52 bg-card rounded-xl animate-pulse border border-border/40" />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-center border border-dashed border-border/50 rounded-xl bg-card/30">
              <Search className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No general journals found.</p>
              {(tagParam || searchQuery) && (
                <button
                  onClick={() => { handleTagChange(null); handleSearchChange(""); }}
                  className="mt-3 text-xs text-primary hover:underline"
                >
                  Clear search and filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredPosts.map((post: any, i: number) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar filters */}
        <aside className="w-full lg:w-56 shrink-0">
          <div className="sticky top-20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 px-1">
              <Hash className="w-3.5 h-3.5 text-primary" /> Filter by tag
            </div>

            <button
              onClick={() => handleTagChange(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !tagParam
                  ? "bg-primary/10 text-primary font-medium border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              All General logs
            </button>

            {tags?.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagChange(tag)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-mono transition-colors ${
                  tagParam === tag
                    ? "bg-primary/10 text-primary font-medium border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
