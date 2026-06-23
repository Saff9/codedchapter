import { Link } from "wouter";
import { ArrowLeft, Mail, Sparkles, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function SignUpPage() {
  const SUBSTACK_URL = import.meta.env.VITE_SUBSTACK_URL || "https://codedchapter.substack.com";

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-60 -left-40 w-[500px] h-[500px] rounded-full bg-secondary/8 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-60 -right-40 w-[400px] h-[400px] rounded-full bg-primary/8 blur-[120px]" />
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
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-secondary bg-secondary/10 border border-secondary/20 px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3 h-3" />
            closed_beta.active
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Start your chapter
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Community accounts are coming soon.
          </p>
        </div>

        {/* Card */}
        <div className="relative bg-card border border-border/70 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          {/* Top gradient accent */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-secondary/70 to-transparent" />

          <div className="p-8 text-center space-y-6">
            {/* Icon */}
            <div className="relative inline-flex mx-auto">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Registration Opening Soon
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Community accounts are in closed beta. Subscribe to my Substack to get all dev logs delivered straight to your inbox — and be first in line when signups open.
              </p>
            </div>

            <a
              href={SUBSTACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full h-11 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01]"
            >
              <Mail className="w-4 h-4" />
              Subscribe on Substack
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            <div className="pt-2 border-t border-border/40">
              <Link href="/">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                </span>
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground/50 font-mono">
          &gt;_ coded chapter · learning in public
        </p>
      </motion.div>
    </div>
  );
}
