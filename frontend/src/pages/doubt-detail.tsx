import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { marked } from "marked";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import {
  ArrowLeft, CheckCircle2, HelpCircle, Send, Trash2,
  Check, Loader2, MessageSquare, Bold, Italic, Heading1, Heading2,
  Code, Link2, Quote, List, FileText, Eye, EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sanitizeHtml } from "@/lib/utils";

const TAG_COLORS = ["text-sky-400 bg-sky-400/10 border-sky-400/20", "text-amber-400 bg-amber-400/10 border-amber-400/20", "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", "text-violet-400 bg-violet-400/10 border-violet-400/20"];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const s = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return (
    <div className={`${s} rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center uppercase shrink-0`}>
      {name.charAt(0)}
    </div>
  );
}

export default function DoubtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const doubtId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();

  const [doubt, setDoubt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState("");
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reload = () => {
    api.getDoubt(doubtId).then(d => { setDoubt(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [doubtId]);

  const handleAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (answerText.trim().length < 10) { toast({ title: "Answer too short", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      await api.createAnswer(doubtId, { content: answerText });
      setAnswerText("");
      setPreview(false);
      toast({ title: "Answer posted!" });
      reload();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (answerId: number) => {
    try {
      await api.acceptAnswer(doubtId, answerId);
      toast({ title: "Answer accepted!", description: "Marked as the best answer." });
      reload();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteDoubt = async () => {
    if (!confirm("Delete this doubt and all its answers?")) return;
    try {
      await api.deleteDoubt(doubtId);
      toast({ title: "Doubt deleted" });
      window.history.back();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteAnswer = async (answerId: number) => {
    try {
      await api.deleteAnswer(doubtId, answerId);
      toast({ title: "Answer deleted" });
      reload();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const insertMarkdown = (prefix: string, suffix = "") => {
    const textarea = document.getElementById("answer-textarea") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.slice(start, end);

    const replacement = prefix + (selection || "") + suffix;
    const newContent = text.slice(0, start) + replacement + text.slice(end);

    setAnswerText(newContent);

    setTimeout(() => {
      textarea.focus();
      const offset = (selection ? selection.length : 0);
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + offset
      );
    }, 0);
  };

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto px-6 py-16 animate-pulse space-y-4">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-8 w-3/4 bg-muted rounded" />
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!doubt) {
    return (
      <div className="container max-w-3xl mx-auto px-6 py-24 text-center space-y-4">
        <div className="text-4xl font-mono text-muted-foreground">404</div>
        <p className="text-muted-foreground">This doubt doesn't exist.</p>
        <Link href="/doubts" className="inline-block px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">Back to Doubts</Link>
      </div>
    );
  }

  const isAuthor = user?.id === doubt.authorId;
  const answers: any[] = doubt.answers ?? [];
  const accepted = answers.find(a => a.isAccepted);
  const others = answers.filter(a => !a.isAccepted);

  return (
    <div className="container max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-8">
      {/* Back */}
      <Link href="/doubts">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> All Doubts
        </span>
      </Link>

      {/* Question */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Resolved/Open stripe */}
        <div className={`h-1 w-full ${doubt.isResolved ? "bg-emerald-500" : "bg-amber-500"}`} />
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`mt-0.5 shrink-0 ${doubt.isResolved ? "text-emerald-500" : "text-amber-500"}`}>
                {doubt.isResolved ? <CheckCircle2 className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {doubt.isResolved && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">✓ Resolved</span>}
                  <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-mono">
                    {answers.length} {answers.length === 1 ? "answer" : "answers"}
                  </span>
                </div>
                <h1 className="text-xl font-bold leading-snug" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  {doubt.title}
                </h1>
              </div>
            </div>
            {isAuthor && (
              <button onClick={handleDeleteDoubt} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {doubt.tags.map((t: string, i: number) => (
              <span key={t} className={`px-2 py-0.5 rounded text-[10px] font-mono border ${TAG_COLORS[i % TAG_COLORS.length]}`}>#{t}</span>
            ))}
          </div>

          {/* Web Search Integration */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/20">
            <span className="font-mono text-[9px] text-muted-foreground/60 uppercase">// search.web:</span>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(doubt.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline transition-colors font-medium text-[11px]"
            >
              Google
            </a>
            <span className="text-border/40">·</span>
            <a
              href={`https://www.bing.com/search?q=${encodeURIComponent(doubt.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline transition-colors font-medium text-[11px]"
            >
              Bing
            </a>
            <span className="text-border/40">·</span>
            <a
              href={`https://www.perplexity.ai/search?q=${encodeURIComponent(doubt.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline transition-colors font-medium text-[11px]"
            >
              Perplexity
            </a>
          </div>

          <div
            className="prose prose-sm prose-invert max-w-none prose-p:leading-[1.8] prose-code:text-amber-400 prose-code:bg-amber-400/10 prose-code:px-1.5 prose-code:rounded prose-pre:bg-card prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:text-sm bg-muted/20 rounded-lg p-4"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked.parse(doubt.content) as string) }}
          />

          <div className="flex items-center gap-2 pt-1">
            <Avatar name={doubt.authorName} size="sm" />
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {doubt.authorUsername ? `@${doubt.authorUsername}` : doubt.authorName}
              </span>
              {" · "}{timeAgo(doubt.createdAt)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Answers */}
      {answers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            <MessageSquare className="w-4 h-4 text-primary" />
            {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
          </h2>

          {/* Accepted answer first */}
          {[...(accepted ? [accepted] : []), ...others].map((answer, i) => (
            <motion.div
              key={answer.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`bg-card border rounded-xl p-5 space-y-3 ${answer.isAccepted ? "border-emerald-500/40 bg-emerald-500/5" : "border-border"}`}
            >
              {answer.isAccepted && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accepted Answer
                </div>
              )}
              <div
                className="prose prose-sm prose-invert max-w-none prose-p:leading-[1.8] prose-code:text-amber-400 prose-code:bg-amber-400/10 prose-code:px-1.5 prose-code:rounded prose-pre:bg-card prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:text-sm"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked.parse(answer.content) as string) }}
              />
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Avatar name={answer.authorName} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    <span className="text-foreground/70 font-medium">
                      {answer.authorUsername ? `@${answer.authorUsername}` : answer.authorName}
                    </span>
                    {" · "}{timeAgo(answer.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isAuthor && !answer.isAccepted && !doubt.isResolved && (
                    <button
                      onClick={() => handleAccept(answer.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-400 transition-colors border border-border hover:border-emerald-500/40 rounded-lg px-2.5 py-1 font-semibold"
                    >
                      <Check className="w-3 h-3" /> Accept
                    </button>
                  )}
                  {user?.id === answer.authorId && (
                    <button onClick={() => handleDeleteAnswer(answer.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Answer form */}
      {user ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Your Answer</h2>
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
                disabled={!answerText.trim()}
                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors disabled:opacity-50 ${preview ? "bg-card text-foreground shadow-sm border border-border/10" : "text-muted-foreground hover:text-foreground"}`}
              >
                Preview
              </button>
            </div>
          </div>

          <form onSubmit={handleAnswer} className="space-y-3">
            {preview ? (
              <div className="bg-muted/10 border border-border rounded-xl px-5 py-4 min-h-[160px] text-sm prose prose-sm prose-invert max-w-none prose-p:leading-[1.7] prose-code:text-amber-400 prose-code:bg-amber-400/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked.parse(answerText) as string) }} />
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
                  id="answer-textarea"
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                  placeholder="Share what you know or what worked for you… (Markdown supported)"
                  rows={6}
                  className="w-full bg-transparent border-0 px-4 py-3 text-sm font-mono outline-none resize-none leading-[1.7] text-foreground placeholder:text-muted-foreground/30 min-h-[160px]"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Post Answer
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="border border-border/60 rounded-xl p-6 text-center bg-card/40 space-y-3">
          <p className="text-sm text-muted-foreground">Sign in to post an answer.</p>
          <div className="flex justify-center gap-3">
            <Link href="/sign-in" className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors inline-block">Sign In</Link>
            <Link href="/sign-up" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors inline-block">Create Account</Link>
          </div>
        </div>
      )}
    </div>
  );
}
