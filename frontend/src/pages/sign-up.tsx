import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, Mail, ArrowRight, User, AtSign } from "lucide-react";

export default function SignUpPage() {
  const { signUp, isMock } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !username) return;
    if (username.length < 3) return;

    setLoading(true);
    try {
      await signUp(email, password, fullName, username.toLowerCase());
      setLocation("/");
    } catch (err) {
      // Error is handled inside auth-context with toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-secondary/15 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-xs font-mono text-primary mb-3">// chapter_one.ts</div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Start your chapter
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Join and be part of the conversation.
          </p>
        </div>

        <div className="bg-card border border-border/80 p-8 rounded-2xl shadow-xl backdrop-blur-md relative overflow-hidden group">
          {/* Neon top highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary/60 via-amber-500/60 to-primary/60" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {isMock && (
              <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg text-xs font-mono text-secondary-foreground leading-relaxed">
                💡 <strong>Preview Mode:</strong> You can sign up with any mock credentials instantly.
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-medium text-foreground">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="pl-9 h-10 bg-background/50 border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-medium text-foreground">Username</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  required
                  className="pl-9 h-10 bg-background/50 border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9 h-10 bg-background/50 border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-foreground">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-9 h-10 bg-background/50 border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 pt-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Register <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in">
              <span className="text-primary hover:underline font-semibold cursor-pointer">
                Sign in
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
