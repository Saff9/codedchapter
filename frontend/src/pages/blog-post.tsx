import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "../lib/auth-context";
import { marked } from "marked";
import { api } from "../lib/api";
import { format } from "date-fns";
import { motion, useScroll, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, ArrowLeft, Send, Trash2, Calendar, MessageCircle, Pencil, Bold, Italic, Code, Link2, Eye, EyeOff, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { sanitizeHtml, updateMetaTags } from "@/lib/utils";

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
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: ["/api/posts", postId],
    queryFn: () => api.getPost(postId),
    enabled: !!postId,
  });

  useEffect(() => {
    if (post) {
      updateMetaTags({
        title: `${post.title} | Coded Chapter`,
        description: post.excerpt || "Read this chapter of my coding journey.",
        canonicalUrl: `${window.location.origin}/blog/${post.id}`,
        ogType: "article",
        ogImage: post.coverImage || undefined,
      });
    }
  }, [post]);

  const { data: comments } = useQuery({
    queryKey: ["/api/posts", postId, "comments"],
    queryFn: () => api.listComments(postId),
    enabled: !!postId,
  });

  const deletePostMutation = useMutation({
    mutationFn: () => api.deletePost(postId),
    onSuccess: () => {
      toast({ title: "Chapter deleted", description: "The post was successfully removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setLocation(`/${post?.category || "tech"}`);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error deleting chapter", description: err.message });
    }
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this chapter? This action cannot be undone.")) {
      deletePostMutation.mutate();
    }
  };

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
            {(post.tags ?? []).map((tag: string, i: number) => (
              <Link key={tag} href={`/${post.category || "tech"}?tag=${tag}`}>
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

          <div className="flex items-center justify-between gap-4 flex-wrap pt-2 border-t border-border/40">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                {post.authorUsername ? (
                  <Link href={`/u/${post.authorUsername}`}>
                    <span className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">
                      {post.authorName}
                    </span>
                  </Link>
                ) : (
                  <span className="font-semibold text-foreground">{post.authorName}</span>
                )}
              </span>
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

            {user?.id === post.authorId && (
              <div className="flex items-center gap-2">
                <Link href={`/write/${post.id}`}>
                  <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors bg-card font-medium">
                    <Pencil className="w-3 h-3 text-primary" /> Edit
                  </button>
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deletePostMutation.isPending}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-destructive/20 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors bg-card font-medium"
                >
                  <Trash2 className="w-3 h-3 text-destructive" /> Delete
                </button>
              </div>
            )}
          </div>

          {/* Web Search Integration */}
          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-border/40 text-xs text-muted-foreground">
            <span className="font-mono text-[10px] text-muted-foreground/60 uppercase">// search.web:</span>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(post.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline transition-colors font-medium"
            >
              Google
            </a>
            <span className="text-border/40">·</span>
            <a
              href={`https://www.bing.com/search?q=${encodeURIComponent(post.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline transition-colors font-medium"
            >
              Bing
            </a>
            <span className="text-border/40">·</span>
            <a
              href={`https://www.perplexity.ai/search?q=${encodeURIComponent(post.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline transition-colors font-medium"
            >
              Perplexity
            </a>
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
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked.parse(post.content) as string) }}
        />

        <hr className="my-14 border-border/40" />

        <CommentSection postId={postId} comments={comments || []} />
      </article>
    </>
  );
}

function CommentSection({ postId, comments }: { postId: number; comments: any[] }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const { toast } = useToast();

  const createComment = useMutation({
    mutationFn: (data: { content: string }) => api.createComment(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      setContent("");
      setPreview(false);
      toast({ title: "Comment posted!" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Failed to post comment", description: err.message });
    }
  });

  const deleteComment = useMutation({
    mutationFn: (args: { commentId: number }) => api.deleteComment(postId, args.commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      toast({ title: "Comment deleted" });
    },
  });

  const insertMarkdown = (prefix: string, suffix = "") => {
    const textarea = document.getElementById("comment-textarea") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.slice(start, end);

    const replacement = prefix + (selection || "") + suffix;
    const newContent = text.slice(0, start) + replacement + text.slice(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const offset = (selection ? selection.length : 0);
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + offset
      );
    }, 0);
  };

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
      {!user && (
        <div className="border border-border/60 rounded-xl p-6 text-center bg-card/50">
          <p className="text-sm text-muted-foreground mb-4">
            Sign in to leave a comment and join the discussion.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/sign-in">
              <Button variant="outline" size="sm">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                Create account
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Comment form */}
      {user && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Add a comment</span>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              disabled={!content.trim()}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
            >
              {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {preview ? "Edit" : "Preview"}
            </button>
          </div>

          {preview ? (
            <div className="bg-muted/10 border border-border rounded-xl px-5 py-4 min-h-[100px] text-sm prose prose-sm prose-invert max-w-none prose-p:leading-[1.7] prose-code:text-amber-400 prose-code:bg-amber-400/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked.parse(content) as string) }} />
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/40 bg-muted/20">
                <button
                  type="button"
                  onClick={() => insertMarkdown("**", "**")}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("*", "*")}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("`", "`")}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  title="Inline Code"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("[", "](url)")}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  title="Link"
                >
                  <Link2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                id="comment-textarea"
                placeholder="Share your thoughts... (Supports Markdown)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-transparent border-0 px-4 py-3 text-sm focus:ring-0 outline-none resize-none min-h-[100px] leading-[1.7] text-foreground font-mono placeholder:text-muted-foreground/30"
              />
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => { if (!content.trim()) return; createComment.mutate({ content }); }}
              size="sm"
              disabled={!content.trim() || createComment.isPending}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
              {createComment.isPending ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </div>
      )}

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
                  {comment.authorUsername ? (
                    <Link href={`/u/${comment.authorUsername}`}>
                      <span className="text-sm font-semibold hover:text-primary cursor-pointer transition-colors">
                        {comment.authorName}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold">{comment.authorName}</span>
                  )}
                  <span className="text-xs text-muted-foreground font-mono">
                    {format(new Date(comment.createdAt), "MMM d")}
                  </span>
                </div>
                {user?.id === comment.authorId && (
                  <button
                    onClick={() => deleteComment.mutate({ commentId: comment.id })}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div
                className="text-sm text-foreground/80 leading-relaxed prose prose-sm prose-invert max-w-none prose-p:leading-[1.7] prose-code:text-amber-400 prose-code:bg-amber-400/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked.parse(comment.content) as string) }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
