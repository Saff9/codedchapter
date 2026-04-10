import { Link } from "wouter";
import { Post } from "@workspace/api-client-react/src/generated/api.schemas";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.id}`}>
      <Card className="h-full flex flex-col overflow-hidden bg-card/50 border-border/50 hover:bg-card hover:border-primary/50 transition-all duration-300 group cursor-pointer">
        {post.coverImage && (
          <div className="aspect-[2/1] w-full overflow-hidden">
            <img 
              src={post.coverImage} 
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <CardHeader className="flex-1 pb-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20 font-mono text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">
            {post.excerpt}
          </p>
        </CardHeader>
        <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTimeMinutes} min read
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              {post.commentCount}
            </span>
          </div>
          <span>{format(new Date(post.createdAt), 'MMM d, yyyy')}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
