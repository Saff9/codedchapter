import { useGetPost, useListComments, useCreateComment, useDeleteComment } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Show, useUser } from "@clerk/react";
import { format } from "date-fns";
import { motion, useScroll, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, ArrowLeft, Send, Trash2, Calendar, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
const FALLBACK = ["text-amber-400 bg-amber-400/10 border-amber-400/20", "text-violet-400 bg-violet-400/10 border-violet-400/20"];
function tagColor(tag: string, i: number) { return TAG_COLORS[tag] ?? FALLBACK[i % FALLBACK.length]; }

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const postId = parseInt(id || "0", 10);

  const { data: post, isLoading } = useGetPost(postId, { query: { enabled: !!postId } });
  const { data: comments } = useListComments(postId, { query: { enabled: !!postId } });

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-6 py-16 animate-pulse space-y-6">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-10 w-3/4 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-2/3 bg-muted rounded" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container max-w-2xl mx-auto px-6 py-24 text-center space-y-4">
        <div className="text-5xl font-mono text-muted-foreground">404</div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Chapter not found</h1>
        <Link href="/blog">
          <Button variant="outline" size="sm" className="mt-4">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to blog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Reading progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-amber-400 to-orange-500 origin-left z-50"
        style={{ scaleX }}
      />

      <article className="container max-w-2xl mx-auto px-6 py-12 md:py-16">

        {/* Back link */}
        <Link href="/blog">
          <span className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-8 group">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
            All chapters
          </span>
        </Link>

        {/* Post header */}
        <header className="mb-10 space-y-5">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag, i) => (
              <Link key={tag} href={`/blog?tag=${tag}`}>
                <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-mono font-medium cursor-pointer hover:opacity-80 transition-opacity ${tagColor(tag, i)}`}>
                  #{tag}
                </span>
              </Link>
            ))}
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold leading-tight tracking-tight"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/40">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(post.createdAt), "MMMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTimeMinutes} min read
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              {comments?.length ?? 0} comments
            </span>
          </div>
        </header>

        {/* Cover image */}
        {post.coverImage && (
          <div className="relative rounded-xl overflow-hidden mb-10 border border-border">
            <img src={post.coverImage} alt={post.title} className="w-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-sm md:prose-base max-w-none
            prose-invert
            prose-headings:font-bold prose-headings:tracking-tight
            prose-p:text-foreground/85 prose-p:leading-[1.8]
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-pre:bg-card prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:text-sm
            prose-code:text-amber-400 prose-code:bg-amber-400/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.85em] prose-code:before:content-none prose-code:after:content-none
            prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:not-italic
            prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br/>") }}
        />

        <hr className="my-14 border-border/40" />

        <CommentSection postId={postId} comments={comments || []} />
      </article>
    </>
  );
}

function CommentSection({ postId, comments }: { postId: number; comments: any[] }) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const createComment = useCreateComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
        setContent("");
      },
    },
  });

  const deleteComment = useDeleteComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      },
    },
  });

  return (
    <section className="space-y-8">
      <h3 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
        <MessageCircle className="w-5 h-5 text-primary" />
        Discussion
        <span className="ml-1 text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {comments.length}
        </span>
      </h3>

      {/* Sign-in prompt */}
      <Show when="signed-out">
        <div className="border border-border/60 rounded-xl p-6 text-center bg-card/50">
          <p className="text-sm text-muted-foreground mb-4">
            Sign in to leave a comment and join the discussion.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/sign-in">
              <Button variant="outline" size="sm">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </Show>

      {/* Comment form */}
      <Show when="signed-in">
        <form onSubmit={(e) => { e.preventDefault(); if (!content.trim()) return; createComment.mutate({ postId, data: { content } }); }} className="space-y-3">
          <Textarea
            placeholder="Share your thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="resize-none min-h-[100px] text-sm"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || createComment.isPending}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="w-3.5 h-3.5" />
              {createComment.isPending ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </form>
      </Show>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first to share your thoughts.</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="group flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center uppercase shrink-0 mt-0.5">
              {comment.authorName.charAt(0)}
            </div>
            <div className="flex-1 bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{comment.authorName}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {format(new Date(comment.createdAt), "MMM d")}
                  </span>
                </div>
                {user?.id === comment.authorId && (
                  <button
                    onClick={() => deleteComment.mutate({ postId, commentId: comment.id })}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
