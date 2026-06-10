import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { marked } from "marked";
import {
  HelpCircle, ArrowLeft, X, Loader2, Send,
  Bold, Italic, Heading1, Heading2, Code, Link2, Quote, List, FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sanitizeHtml } from "@/lib/utils";

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
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
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

  const insertMarkdown = (prefix: string, suffix = "") => {
    const textarea = document.getElementById("details-textarea") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.slice(start, end);

    const replacement = prefix + (selection || "") + suffix;
    const newContent = text.slice(0, start) + replacement + text.slice(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const offset = (selection ? selection.length : 0);
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + offset
      );
    }, 0);
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center px-6">
        <div className="space-y-4">
          <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Sign in to ask</h2>
          <p className="text-sm text-muted-foreground">You need an account to post doubts.</p>
          <Link href="/sign-up" className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold inline-block">Create account</Link>
        </div>
      </div>
    );
  }

  return (
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
              <label className="text-xs font-semibold text-muted-foreground">
                Question title <span className="text-destructive">*</span>
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Why does my for loop run one extra time?"
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40 text-foreground"
              />
              <div className="text-right text-[10px] text-muted-foreground">{title.length}/200</div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">
                  Details <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/20">
                  <button
                    type="button"
                    onClick={() => setPreview(false)}
                    className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${!preview ? "bg-card text-foreground shadow-sm border border-border/10" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreview(true)}
                    disabled={!content.trim()}
                    className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors disabled:opacity-50 ${preview ? "bg-card text-foreground shadow-sm border border-border/10" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Preview
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/60">Describe what you're trying to do, what you've tried, and what happened. Markdown supported.</p>

              {preview ? (
                <div className="bg-muted/10 border border-border rounded-xl px-5 py-4 min-h-[260px] text-sm prose prose-sm prose-invert max-w-none prose-p:leading-[1.7] prose-code:text-amber-400 prose-code:bg-amber-400/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked.parse(content) as string) }} />
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                  <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 border-b border-border/40 bg-muted/20">
                    <button
                      type="button"
                      onClick={() => insertMarkdown("**", "**")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("*", "*")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-border/60 mx-1" />
                    <button
                      type="button"
                      onClick={() => insertMarkdown("# ", "")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                      title="Heading 1"
                    >
                      <Heading1 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("## ", "")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                      title="Heading 2"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-border/60 mx-1" />
                    <button
                      type="button"
                      onClick={() => insertMarkdown("`", "`")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                      title="Inline Code"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("```\n", "\n```")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                      title="Code Block"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("[", "](url)")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                      title="Link"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("> ", "")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                      title="Blockquote"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("- ", "")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                      title="List Item"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    id="details-textarea"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={"I'm trying to...\n\nI expected... but instead...\n\nHere's what I tried:\n\n```\n// your code here\n```"}
                    rows={10}
                    className="w-full bg-transparent border-0 px-4 py-3 text-sm font-mono outline-none resize-none leading-[1.7] text-foreground placeholder:text-muted-foreground/30 min-h-[260px]"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Tags (up to 5)</label>
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
  );
}
