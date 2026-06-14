import { Link } from "wouter";
import { ArrowLeft, Sparkles, Mail } from "lucide-react";

export default function SignUpPage() {
  const SUBSTACK_URL = import.meta.env.VITE_SUBSTACK_URL || "https://codedchapter.substack.com";

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-secondary/15 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-xs font-mono text-primary mb-3">// signup_registration.ts</div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Start your chapter
          </h1>
        </div>

        <div className="bg-card border border-border/80 p-8 rounded-2xl shadow-xl backdrop-blur-md relative overflow-hidden group text-center space-y-6">
          {/* Neon top highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary/60 via-amber-500/60 to-primary/60" />

          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Sign Up Coming Soon
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed px-2">
              Registration and community accounts are currently in closed beta. In the meantime, subscribe directly to my Substack newsletter to get all dev logs delivered straight to your inbox!
            </p>
          </div>

          <div className="pt-2">
            <a
              href={SUBSTACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-10 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 cursor-pointer hover:scale-[1.015]"
            >
              <Mail className="w-4 h-4" /> Subscribe on Substack
            </a>
          </div>

          <div className="pt-2 border-t border-border/40">
            <Link href="/">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
