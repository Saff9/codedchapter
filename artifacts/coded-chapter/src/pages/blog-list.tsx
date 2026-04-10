import { useListPosts, useGetAllTags } from "@workspace/api-client-react";
import { useLocation, useSearch } from "wouter";
import { PostCard } from "@/components/post-card";
import { Input } from "@/components/ui/input";
import { Search, Hash } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

export default function BlogList() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const tagParam = searchParams.get("tag");
  const [, setLocation] = useLocation();

  const { data: posts, isLoading } = useListPosts(tagParam ? { tag: tagParam } : undefined);
  const { data: tags } = useGetAllTags();

  const handleTagClick = (tag: string | null) => {
    if (tag) {
      setLocation(`/blog?tag=${tag}`);
    } else {
      setLocation('/blog');
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Main Content */}
        <div className="flex-1 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight">
              {tagParam ? `Posts tagged #${tagParam}` : "All Chapters"}
            </h1>
            <p className="text-lg text-muted-foreground">
              Everything I've learned, written down.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[400px] bg-card/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : posts?.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-border rounded-xl bg-card/30">
              <p className="text-muted-foreground text-lg">No posts found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts?.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-64 lg:w-80 space-y-8">
          <div className="sticky top-24 space-y-8">
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" />
                Filter by Tag
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleTagClick(null)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    !tagParam ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  All Posts
                </button>
                {tags?.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium font-mono transition-colors ${
                      tagParam === tag ? "bg-secondary/10 text-secondary" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
