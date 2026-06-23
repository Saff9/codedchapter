import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, Mail, ArrowRight, Terminal } from "lucide-react";
import { motion } from "framer-motion";

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
    } catch {
      // Error handled in auth-context via toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-60 -right-40 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-60 -left-40 w-[400px] h-[400px] rounded-full bg-secondary/8 blur-[120px]" />
      {/* Mesh grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-4">
            <Terminal className="w-3 h-3" />
            auth.session.start()
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to continue your coding journey.
          </p>
        </div>

        {/* Card */}
        <div className="relative bg-card border border-border/70 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          {/* Top gradient accent */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

          <div className="p-8">
            {isMock && (
              <div className="mb-5 p-3 bg-primary/8 border border-primary/20 rounded-xl text-xs font-mono text-primary leading-relaxed">
                💡 <strong>Preview Mode:</strong> Any email + password works.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11 bg-background/60 border-border/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/10 rounded-xl text-sm transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-11 bg-background/60 border-border/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/10 rounded-xl text-sm transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01]"
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

            <div className="mt-6 pt-5 border-t border-border/40 text-center text-xs text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/sign-up">
                <span className="text-primary hover:text-primary/80 font-semibold cursor-pointer transition-colors">
                  Sign up
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-center text-[11px] text-muted-foreground/50 font-mono">
          &gt;_ coded chapter · learning in public
        </p>
      </motion.div>
    </div>
  );
}
