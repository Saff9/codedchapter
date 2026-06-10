import { Link } from "wouter";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] w-full flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-secondary/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-[100px]" />

      <div className="max-w-md w-full bg-card border border-border/60 p-8 rounded-2xl shadow-xl backdrop-blur-md relative overflow-hidden">
        {/* Glowing border highlight */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/50 via-primary/50 to-amber-500/50" />

        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            404: Route Not Found
          </h1>
          <div className="text-xs font-mono text-primary mb-3">// page_missing.sys</div>
        </div>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          The chapter or log you are looking for does not exist. It may have been moved, renamed, or deleted from the terminal.
        </p>

        <Link href="/">
          <Button className="w-full flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go Back Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
