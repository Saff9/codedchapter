import { Link } from "wouter";
import { ArrowLeft, Terminal } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-[85vh] w-full flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-destructive/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/8 blur-[120px]" />
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
        transition={{ duration: 0.5 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="relative bg-card border border-border/70 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 p-10">
          {/* Top accent */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-destructive/60 to-transparent" />

          {/* 404 giant number */}
          <div className="relative mb-6">
            <p
              className="text-[120px] font-black leading-none tracking-tighter bg-gradient-to-b from-foreground/20 to-transparent bg-clip-text text-transparent select-none"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              404
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <Terminal className="w-7 h-7 text-destructive" />
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-2">
            <div className="text-[11px] font-mono text-destructive/80">
              error: route_not_found
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Page not found
            </h1>
          </div>

          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            The chapter or log you're looking for doesn't exist. It may have been moved, renamed, or removed from the terminal.
          </p>

          <Link href="/">
            <button className="group w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01]">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Return to Home
            </button>
          </Link>
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground/40 font-mono">
          &gt;_ exit code: 404
        </p>
      </motion.div>
    </div>
  );
}
