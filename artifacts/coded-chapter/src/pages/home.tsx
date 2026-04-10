import { motion } from "framer-motion";
import { Link } from "wouter";
import { useGetFeaturedPosts, useGetAllTags } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { ArrowRight, Code2, TerminalSquare, BookOpen } from "lucide-react";

export default function Home() {
  const { data: featuredPosts, isLoading: isLoadingFeatured } = useGetFeaturedPosts();
  const { data: tags } = useGetAllTags();

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="max-w-3xl space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-mono"
            >
              <TerminalSquare className="w-4 h-4" />
              <span>Hello, World!</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tighter"
            >
              Documenting the journey from <span className="text-primary">confusion</span> to <span className="text-secondary">clarity.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl"
            >
              A digital notebook where I untangle concepts, share mistakes, and celebrate the small victories of learning to code.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-4 pt-4"
            >
              <Link href="/blog">
                <Button size="lg" className="h-12 px-6 gap-2">
                  <BookOpen className="w-4 h-4" />
                  Read the Chapters
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Code2 className="w-6 h-6 text-primary" />
              Featured Chapters
            </h2>
            <Link href="/blog" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {isLoadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[400px] bg-card/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts?.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About/Tags Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">The Story So Far</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                I started coding because I wanted to build things. I quickly realized that building things means breaking things first. This blog is my attempt to map the territory as I explore it — writing down the solutions I spend hours finding so my future self (and maybe you) won't have to.
              </p>
            </div>
            
            <div className="bg-card border border-border/50 p-8 rounded-2xl">
              <h3 className="text-xl font-bold mb-6 font-mono flex items-center gap-2">
                <TerminalSquare className="w-5 h-5 text-secondary" />
                Topics.explored
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags?.map(tag => (
                  <Link key={tag} href={`/blog?tag=${tag}`}>
                    <span className="px-3 py-1.5 rounded-md bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors text-sm font-mono cursor-pointer border border-border/50 hover:border-primary/20">
                      #{tag}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
