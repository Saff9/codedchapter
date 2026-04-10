import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-border/40 mt-auto">
      <div className="container mx-auto px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/">
          <span
            className="text-sm font-bold tracking-tight cursor-pointer"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            <span className="text-primary font-mono">&gt;_</span> Coded{" "}
            <span className="text-primary italic">Chapter</span>
          </span>
        </Link>
        <p className="text-xs text-muted-foreground">
          Documenting the journey from zero to developer.
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link href="/blog"><span className="hover:text-foreground transition-colors cursor-pointer">Blog</span></Link>
          <Link href="/sign-up"><span className="hover:text-foreground transition-colors cursor-pointer">Join</span></Link>
        </div>
      </div>
    </footer>
  );
}
