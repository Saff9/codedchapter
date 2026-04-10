import { motion } from "framer-motion";
import { Link } from "wouter";
import { useGetFeaturedPosts, useGetAllTags } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { ArrowRight, BookOpen, Flame, Star, Zap } from "lucide-react";

const tagColors = ["tag-amber", "tag-violet", "tag-emerald", "tag-blue", "tag-rose", "tag-cyan"];

export default function Home() {
  const { data: featuredPosts, isLoading } = useGetFeaturedPosts();
  const { data: tags } = useGetAllTags();

  return (
    <div className="flex flex-col w-full">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Amber glow top-left */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
        {/* Violet glow bottom-right */}
        <div className="pointer-events-none absolute -bottom-32 right-0 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[100px]" />

        <div className="container relative z-10 mx-auto px-6 lg:px-8">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Learning in public · Chapter 1
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left – headline */}
            <div className="space-y-6">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.12] tracking-tight"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                One coder.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-orange-500">
                  Every mistake.
                </span>
                <br />
                Written down.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg"
              >
                Coded Chapter is my personal log as I go from zero to software engineer — one concept at a time, in plain English, with all the confusion left in.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.22 }}
                className="flex items-center gap-4 pt-2"
              >
                <Link href="/blog">
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
                    <BookOpen className="w-4 h-4" />
                    Start Reading
                  </button>
                </Link>
                <Link href="/blog">
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Browse all posts <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </motion.div>

              {/* Mini stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="flex items-center gap-6 pt-2 border-t border-border/40"
              >
                {[
                  { icon: <BookOpen className="w-3.5 h-3.5" />, label: `${featuredPosts?.length ?? "—"} chapters` },
                  { icon: <Flame className="w-3.5 h-3.5" />, label: `${tags?.length ?? "—"} topics` },
                  { icon: <Star className="w-3.5 h-3.5" />, label: "100% real confusion" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="text-primary">{icon}</span>
                    {label}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right – decorative code card */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Glow behind the card */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl rounded-3xl scale-95" />
                {/* Code card */}
                <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
                  {/* Window bar */}
                  <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-muted/40">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                    <span className="ml-3 text-xs font-mono text-muted-foreground">journey.ts</span>
                  </div>
                  <div className="p-6 font-mono text-sm leading-7">
                    <div><span className="text-violet-400">const</span> <span className="text-sky-300">me</span> <span className="text-foreground/60">=</span> <span className="text-foreground/80">{'{'}</span></div>
                    <div className="pl-6"><span className="text-amber-400">name</span><span className="text-foreground/60">:</span> <span className="text-emerald-400">"New Developer"</span><span className="text-foreground/60">,</span></div>
                    <div className="pl-6"><span className="text-amber-400">goal</span><span className="text-foreground/60">:</span> <span className="text-emerald-400">"Software Engineer"</span><span className="text-foreground/60">,</span></div>
                    <div className="pl-6"><span className="text-amber-400">progress</span><span className="text-foreground/60">:</span> <span className="text-sky-300">learning</span><span className="text-foreground/60">,</span></div>
                    <div><span className="text-foreground/80">{'}'}</span><span className="text-foreground/40">;</span></div>
                    <div className="mt-3"><span className="text-foreground/40">// Every chapter gets me closer</span></div>
                    <div><span className="text-violet-400">while</span> (<span className="text-sky-300">me</span>.<span className="text-amber-400">progress</span> <span className="text-foreground/60">!==</span> <span className="text-emerald-400">"done"</span>) <span className="text-foreground/80">{'{'}</span></div>
                    <div className="pl-6"><span className="text-sky-300">me</span>.<span className="text-amber-400">write</span>(<span className="text-emerald-400">"a new chapter"</span>)<span className="text-foreground/40">;</span></div>
                    <div><span className="text-foreground/80">{'}'}</span></div>
                  </div>
                </div>

                {/* Floating badges */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute -top-3 -right-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg shadow-primary/30"
                >
                  Chapter 5 is live
                </motion.div>
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -bottom-3 -left-4 bg-secondary/20 border border-secondary/30 text-secondary text-xs font-mono px-3 py-1.5 rounded-full"
                >
                  + 3 comments
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── LATEST CHAPTERS ──────────────────────────────────────── */}
      <section className="py-16 border-t border-border/40">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs font-mono mb-1">
                <Zap className="w-3.5 h-3.5" /> Latest Chapters
              </div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                What I've been learning
              </h2>
            </div>
            <Link href="/blog">
              <span className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer font-medium">
                All posts <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-56 bg-card rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {featuredPosts?.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ABOUT + TAGS ─────────────────────────────────────────── */}
      <section className="py-16 border-t border-border/40">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">

            {/* About – 3 cols */}
            <div className="lg:col-span-3 space-y-5">
              <div className="text-xs font-mono text-primary mb-1">// about this blog</div>
              <h2 className="text-3xl font-bold leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Learning to code,<br />one honest post at a time.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                I started Coded Chapter because when I was learning, most tutorials assumed I already knew things I didn't. Every post here is written from the perspective of someone who just figured something out — with all the confusion, the failed attempts, and the "aha" moments included.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                If you're also learning, I hope this feels like reading notes from a slightly-ahead classmate, not a lecture from an expert.
              </p>
              <Link href="/blog">
                <button className="mt-2 inline-flex items-center gap-2 text-sm text-primary font-medium hover:gap-3 transition-all">
                  Read the full journey <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Tags – 2 cols */}
            <div className="lg:col-span-2">
              <div className="text-xs font-mono text-muted-foreground mb-4">topics.explored()</div>
              <div className="flex flex-wrap gap-2">
                {tags?.map((tag, i) => (
                  <Link key={tag} href={`/blog?tag=${tag}`}>
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-mono cursor-pointer hover:scale-105 transition-transform ${tagColors[i % tagColors.length]}`}>
                      #{tag}
                    </span>
                  </Link>
                ))}
              </div>

              {/* CTA card */}
              <div className="mt-8 p-5 rounded-xl border border-primary/20 bg-primary/5">
                <div className="text-sm font-semibold mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Got something to say?</div>
                <div className="text-xs text-muted-foreground mb-3">Sign up to leave comments and join the conversation.</div>
                <Link href="/sign-up">
                  <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                    Create an account — it's free
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
