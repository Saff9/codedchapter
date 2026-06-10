import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, Mail, ArrowRight } from "lucide-react";

export default function SignInPage() {
  const { signIn, isMock } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      await signIn(email, password);
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
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/15 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-xs font-mono text-primary mb-3">// welcome back</div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Sign in to your account
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Continue your coding journey.
          </p>
        </div>

        <div className="bg-card border border-border/80 p-8 rounded-2xl shadow-xl backdrop-blur-md relative overflow-hidden group">
          {/* Neon top highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/60 via-amber-500/60 to-primary/60" />
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {isMock && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs font-mono text-primary leading-relaxed">
                💡 <strong>Preview Mode:</strong> You can sign in with any email and password combination.
              </div>
            )}
            
            <div className="space-y-2">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-foreground">Password</Label>
              </div>
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
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-primary/10"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/sign-up">
              <span className="text-primary hover:underline font-semibold cursor-pointer">
                Sign up
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
