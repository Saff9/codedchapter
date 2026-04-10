import { Terminal } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-8 mt-12">
      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Terminal className="h-4 w-4" />
          <span className="font-mono text-sm">CodedChapter</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Documenting the journey, one commit at a time.
        </p>
      </div>
    </footer>
  );
}
