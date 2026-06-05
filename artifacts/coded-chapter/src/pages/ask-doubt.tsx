import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Show } from "@clerk/react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { HelpCircle, ArrowLeft, X, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim().toLowerCase().replace(/\s+/g, "-");
    if (v && !tags.includes(v) && tags.length < 5) { onChange([...tags, v]); setInput(""); }
  };
  return (
    <div className="flex flex-wrap gap-1.5 p-2.5 bg-background border border-border rounded-lg min-h-[42px] items-center focus-within:border-primary/50 transition-colors">
      {tags.map(t => (
        <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono border border-primary/20">
          #{t}
          <button onClick={() => onChange(tags.filter(x => x !== t))}><X className="w-2.5 h-2.5 hover:text-destructive" /></button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        placeholder={tags.length < 5 ? "Add tag and press Enter…" : ""}
        disabled={tags.length >= 5}
        className="flex-1 min-w-28 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
      />
    </div>
  );
}

export default function AskDoubtPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 10) { toast({ title: "Title too short", description: "Please write at least 10 characters.", variant: "destructive" }); return; }
    if (content.trim().length < 20) { toast({ title: "Description too short", description: "Please describe your doubt in more detail.", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const result: any = await api.createDoubt({ title, content, tags });
      toast({ title: "Doubt posted!", description: "The community will help you out." });
      navigate(`/doubts/${result.id}`);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Show when="signed-in" fallback={
      <div className="min-h-[60vh] flex items-center justify-center text-center px-6">
        <div className="space-y-4">
          <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Sign in to ask</h2>
          <p className="text-sm text-muted-foreground">You need an account to post doubts.</p>
          <Link href="/sign-up"><button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">Create account</button></Link>
        </div>
      </div>
    }>
      <div className="container mx-auto px-6 lg:px-8 py-12 max-w-2xl">
        <Link href="/doubts">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer mb-8 group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Doubts
          </span>
        </Link>

        <div className="mb-8">
          <div className="text-xs font-mono text-primary mb-2">// ask.doubt</div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Ask a Doubt</h1>
          <p className="text-sm text-muted-foreground mt-1">Be specific and include what you've already tried.</p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Question title <span className="text-destructive">*</span>
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Why does my for loop run one extra time?"
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40"
              />
              <div className="text-right text-[10px] text-muted-foreground">{title.length}/200</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Details <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-muted-foreground/70">Describe what you're trying to do, what you've tried, and what happened.</p>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={"I'm trying to...\n\nI expected... but instead...\n\nHere's what I tried:\n\n```\n// your code here\n```"}
                rows={10}
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm font-mono outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/30 resize-none leading-[1.7]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tags (up to 5)</label>
              <TagInput tags={tags} onChange={setTags} />
              <p className="text-[10px] text-muted-foreground/60">Press Enter or comma to add a tag</p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
            <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" /> Tips for a good question
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Summarize your problem in one sentence for the title</li>
              <li>Describe what you expected vs what happened</li>
              <li>Include relevant code snippets</li>
              <li>Mention what you've already tried</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post Question
            </button>
          </div>
        </motion.form>
      </div>
    </Show>
  );
}
