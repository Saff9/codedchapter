import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { PostCard } from "@/components/post-card";
import {
  Github, Twitter, Globe, MapPin, Calendar, Pencil,
  BookOpen, HelpCircle, CheckCircle2, Loader2, User
} from "lucide-react";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doubts, setDoubts] = useState<any[]>([]);
  const [tab, setTab] = useState<"posts" | "doubts">("posts");

  // Fetch posts authored specifically by this user
  const { data: authorPosts } = useQuery<any[]>({
    queryKey: ["posts", "author", profile?.userId],
    queryFn: () => api.listPosts(undefined, undefined, 100, 0, profile.userId),
    enabled: !!profile?.userId,
  });
  const postsList = authorPosts ?? [];

  useEffect(() => {
    setLoading(true);
    setError(null);
    setProfile(null);
    api.getProfile(username).then((p: any) => {
      setProfile(p);
      setLoading(false);
      api.listDoubts(undefined, 100, 0, p.userId).then(setDoubts);
    }).catch((err) => {
      setError(err.message || "Failed to load profile");
      setLoading(false);
    });
  }, [username]);

  const isOwn = currentUser && profile && currentUser.id === profile.userId;
  const joinDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-16 max-w-3xl animate-pulse space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted" />
          <div className="space-y-2 flex-1"><div className="h-5 w-32 bg-muted rounded" /><div className="h-3 w-20 bg-muted rounded" /></div>
        </div>
        <div className="h-20 bg-muted rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-24 max-w-3xl text-center space-y-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Could not load profile</h1>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Link href="/" className="inline-block px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">Go Home</Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-6 py-24 max-w-3xl text-center space-y-4">
        <User className="w-12 h-12 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Profile not found</h1>
        <p className="text-muted-foreground">@{username} doesn't exist yet.</p>
        <Link href="/" className="inline-block px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 lg:px-8 py-12 md:py-16 max-w-3xl">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden mb-8"
      >
        {/* Gradient header bar */}
        <div className="h-24 bg-gradient-to-br from-primary/20 via-amber-500/10 to-secondary/20" />

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-2xl font-bold text-primary-foreground border-4 border-card uppercase shadow-lg">
              {profile.displayName.charAt(0)}
            </div>
            {isOwn && (
              <Link href="/settings">
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-lg hover:text-foreground hover:border-primary/40 transition-colors">
                  <Pencil className="w-3 h-3" /> Edit Profile
                </button>
              </Link>
            )}
          </div>

          {/* Name + username */}
          <div className="space-y-1 mb-4">
            <h1 className="text-xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{profile.displayName}</h1>
            <div className="font-mono text-sm text-primary">@{profile.username}</div>
          </div>

          {profile.bio && <p className="text-sm text-muted-foreground leading-relaxed mb-4">{profile.bio}</p>}

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {profile.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Globe className="w-3 h-3" />{profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Github className="w-3 h-3" />GitHub
              </a>
            )}
            {profile.twitterUrl && (
              <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Twitter className="w-3 h-3" />Twitter
              </a>
            )}
            {joinDate && (
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined {joinDate}</span>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-5 pt-5 border-t border-border/40">
            {[
              { icon: <BookOpen className="w-3.5 h-3.5" />, label: "Posts", val: profile.postsCount ?? 0 },
              { icon: <HelpCircle className="w-3.5 h-3.5" />, label: "Doubts", val: profile.doubtsCount ?? 0 },
              { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Answers", val: profile.answersCount ?? 0 },
            ].map(({ icon, label, val }) => (
              <div key={label} className="text-center">
                <div className="text-lg font-bold font-mono text-primary">{val}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-center">{icon}{label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/40 p-1 rounded-lg w-fit">
        {(["posts", "doubts"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? "bg-card text-foreground shadow-sm border border-border/40" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "posts" ? `Posts (${profile.postsCount ?? 0})` : `Doubts (${profile.doubtsCount ?? 0})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "posts" && (
        postsList.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground border border-dashed border-border/50 rounded-xl">
            No posts yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {postsList.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <PostCard post={post} />
              </motion.div>
            ))}
          </div>
        )
      )}

      {tab === "doubts" && (
        doubts.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground border border-dashed border-border/50 rounded-xl">
            No doubts asked yet.
          </div>
        ) : (
          <div className="space-y-3">
            {doubts.map((doubt, i) => (
              <motion.div key={doubt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Link href={`/doubts/${doubt.id}`}>
                  <div className="group bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${doubt.isResolved ? "text-emerald-500" : "text-amber-500"}`}>
                        {doubt.isResolved ? <CheckCircle2 className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">{doubt.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{doubt.answerCount} answers · {doubt.isResolved ? "Resolved" : "Open"}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
