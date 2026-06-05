import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useUser, Show } from "@clerk/react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import {
  ArrowLeft, CheckCircle2, HelpCircle, Send, Trash2,
  Check, Loader2, MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { user } = useUser();
  const { toast } = useToast();

  const [doubt, setDoubt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState("");
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
        <Link href="/doubts"><button className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">Back to Doubts</button></Link>
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

          <pre className="text-sm text-foreground/85 whitespace-pre-wrap leading-[1.8] font-sans bg-muted/30 rounded-lg p-4">
            {doubt.content}
          </pre>

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
              <pre className="text-sm text-foreground/85 whitespace-pre-wrap leading-[1.8] font-sans">
                {answer.content}
              </pre>
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
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-400 transition-colors border border-border hover:border-emerald-500/40 rounded-lg px-2.5 py-1"
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
      <Show when="signed-in">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Your Answer</h2>
          <form onSubmit={handleAnswer} className="space-y-3">
            <textarea
              value={answerText}
              onChange={e => setAnswerText(e.target.value)}
              placeholder="Share what you know or what worked for you…"
              rows={6}
              className="w-full bg-card border border-border rounded-xl px-5 py-4 text-sm font-mono outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/30 resize-none leading-[1.7]"
            />
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
      </Show>

      <Show when="signed-out">
        <div className="border border-border/60 rounded-xl p-6 text-center bg-card/40 space-y-3">
          <p className="text-sm text-muted-foreground">Sign in to post an answer.</p>
          <div className="flex justify-center gap-3">
            <Link href="/sign-in"><button className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">Sign In</button></Link>
            <Link href="/sign-up"><button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">Create Account</button></Link>
          </div>
        </div>
      </Show>
    </div>
  );
}
