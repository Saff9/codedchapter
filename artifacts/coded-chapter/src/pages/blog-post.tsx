import { useGetPost, useListComments, useCreateComment, useDeleteComment } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Show, useUser } from "@clerk/react";
import { format } from "date-fns";
import { motion, useScroll, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, ArrowLeft, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const postId = parseInt(id || "0", 10);
  
  const { data: post, isLoading } = useGetPost(postId, { 
    query: { enabled: !!postId } 
  });
  
  const { data: comments } = useListComments(postId, {
    query: { enabled: !!postId }
  });

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20">
        <div className="h-8 w-1/3 bg-muted animate-pulse rounded mb-4" />
        <div className="h-12 w-full bg-muted animate-pulse rounded mb-8" />
        <div className="space-y-4">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Link href="/blog">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-50"
        style={{ scaleX }}
      />
      
      <article className="container max-w-3xl mx-auto px-4 py-12 md:py-20">
        <Link href="/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to chapters
        </Link>

        <header className="mb-12 space-y-6">
          <div className="flex flex-wrap items-center gap-3 font-mono text-sm">
            <span className="text-secondary">{format(new Date(post.createdAt), 'MMMM d, yyyy')}</span>
            <span className="text-muted-foreground">•</span>
            <span className="flex items-center text-muted-foreground">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {post.readingTimeMinutes} min read
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <Link key={tag} href={`/blog?tag=${tag}`}>
                <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-mono font-medium hover:bg-secondary/20 transition-colors cursor-pointer">
                  #{tag}
                </span>
              </Link>
            ))}
          </div>
        </header>

        {post.coverImage && (
          <div className="aspect-video w-full rounded-2xl overflow-hidden mb-12 border border-border/50">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div 
          className="prose prose-invert prose-indigo max-w-none prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        
        <hr className="my-16 border-border/40" />
        
        <CommentSection postId={postId} comments={comments || []} />
      </article>
    </>
  );
}

function CommentSection({ postId, comments }: { postId: number, comments: any[] }) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  
  const createComment = useCreateComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
        setContent("");
      }
    }
  });

  const deleteComment = useDeleteComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createComment.mutate({ postId, data: { content } });
  };

  return (
    <section className="space-y-8">
      <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        Discussion <span className="text-muted-foreground text-lg font-normal">({comments.length})</span>
      </h3>

      <Show when="signed-out">
        <div className="bg-card border border-border/50 rounded-xl p-6 text-center space-y-4">
          <p className="text-muted-foreground">Join the conversation and share your thoughts.</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/sign-in">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </Show>

      <Show when="signed-in">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <Avatar className="w-10 h-10 border border-border/50">
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea 
              placeholder="Leave a comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none min-h-[100px] bg-background focus-visible:ring-primary"
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                size="sm" 
                disabled={!content.trim() || createComment.isPending}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {createComment.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </form>
      </Show>

      <div className="space-y-6 mt-8">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-4 group">
            <Avatar className="w-10 h-10 border border-border/50">
              <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{comment.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                {user && user.id === comment.authorId && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteComment.mutate({ postId, commentId: comment.id })}
                    disabled={deleteComment.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
