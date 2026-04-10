import { useListPosts, useGetAllTags } from "@workspace/api-client-react";
import { useLocation, useSearch } from "wouter";
import { PostCard } from "@/components/post-card";
import { Hash, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function BlogList() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const tagParam = searchParams.get("tag");
  const [, setLocation] = useLocation();

  const { data: posts, isLoading } = useListPosts(tagParam ? { tag: tagParam } : undefined);
  const { data: tags } = useGetAllTags();

  return (
    <div className="container mx-auto px-6 lg:px-8 py-12 md:py-16">
      <div className="flex flex-col lg:flex-row gap-12">

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="mb-8">
            <div className="text-xs font-mono text-primary mb-2">
              {tagParam ? `// filtered by #${tagParam}` : "// all posts"}
            </div>
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {tagParam ? (
                <>Posts tagged <span className="text-primary">#{tagParam}</span></>
              ) : (
                "All Chapters"
              )}
            </h1>
            {tagParam && (
              <button
                onClick={() => setLocation("/blog")}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Clear filter
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-52 bg-card rounded-xl animate-pulse" />
              ))}
            </div>
          ) : posts?.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-center border border-dashed border-border/50 rounded-xl bg-card/30">
              <Search className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No posts found for this tag.</p>
              <button
                onClick={() => setLocation("/blog")}
                className="mt-3 text-xs text-primary hover:underline"
              >
                See all posts
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {posts?.map((post, i) => (
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

        {/* Sidebar */}
        <aside className="w-full lg:w-56 shrink-0">
          <div className="sticky top-20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground mb-4 px-1">
              <Hash className="w-3.5 h-3.5" /> Filter by tag
            </div>

            <button
              onClick={() => setLocation("/blog")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !tagParam
                  ? "bg-primary/10 text-primary font-medium border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              All posts
            </button>

            {tags?.map(tag => (
              <button
                key={tag}
                onClick={() => setLocation(`/blog?tag=${tag}`)}
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
