import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { marked } from "marked";
import {
  Eye, EyeOff, Save, ArrowLeft, Plus, X, Loader2,
  FileText, AlignLeft, Tag, Image as ImageIcon, BookOpen,
  Bold, Italic, Heading1, Heading2, Code, Link2, Quote, List
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sanitizeHtml } from "@/lib/utils";
import { isAdminEmail } from "@/lib/admin";

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim().toLowerCase().replace(/\s+/g, "-");
    if (v && !tags.includes(v) && tags.length < 5) {
      onChange([...tags, v]);
      setInput("");
    }
  };
  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-background border border-border rounded-lg min-h-[42px] items-center">
      {tags.map(t => (
        <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono border border-primary/20">
          #{t}
          <button onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-destructive transition-colors">
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        placeholder={tags.length < 5 ? "Add tag…" : ""}
        disabled={tags.length >= 5}
        className="flex-1 min-w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 text-foreground"
      />
    </div>
  );
}

function EditorField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

export default function WritePage() {
  const { id } = useParams<{ id?: string }>();
  const editId = id ? parseInt(id) : null;
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = isAdminEmail(user?.email);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ["post", editId],
    queryFn: () => api.getPost(editId!),
    enabled: !!editId,
  });

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState<"tech" | "general">("tech");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset editor state when editId is null (navigating to write a new post)
  useEffect(() => {
    if (!editId) {
      setTitle("");
      setExcerpt("");
      setContent("");
      setTags([]);
      setCoverImage("");
      setCategory("tech");
      setPreview(false);
    }
  }, [editId]);

  // Authorization check: Make sure user owns the post
  useEffect(() => {
    if (existing && user && existing.authorId !== user.id) {
      toast({ title: "Forbidden", description: "You are not authorized to edit this chapter.", variant: "destructive" });
      navigate(`/blog/${existing.id}`);
    }
  }, [existing, user, navigate, toast]);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      toast({ title: "Unauthorized", description: "Only the admin can publish posts.", variant: "destructive" });
      navigate("/");
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  useEffect(() => {
    if (existing && user && existing.authorId === user.id) {
      setTitle(existing.title);
      setExcerpt(existing.excerpt);
      setContent(existing.content);
      setTags(existing.tags);
      setCoverImage(existing.coverImage ?? "");
      setCategory((existing.category as "tech" | "general") ?? "tech");
    }
  }, [existing, user]);

  const insertMarkdown = (prefix: string, suffix = "") => {
    const textarea = document.getElementById("editor-textarea") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.slice(start, end);

    const replacement = prefix + (selection || "") + suffix;
    const newContent = text.slice(0, start) + replacement + text.slice(end);

    setContent(newContent);

    // Refocus and set cursor selection
    setTimeout(() => {
      textarea.focus();
      const offset = (selection ? selection.length : 0);
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + offset
      );
    }, 0);
  };

  const handleSave = async () => {
    if (!title.trim() || !excerpt.trim() || !content.trim()) {
      toast({ title: "Missing fields", description: "Title, excerpt, and content are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body = { title, excerpt, content, tags, coverImage: coverImage || undefined, category };
      const result: any = editId
        ? await api.updatePost(editId, body)
        : await api.createPost(body);

      // Invalidate caches to ensure instant update in blog listings and pages
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", result.id] });
      queryClient.invalidateQueries({ queryKey: ["post", result.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/tags"] });

      toast({ title: editId ? "Post updated!" : "Post published!", description: `"${result.title}" is live.` });
      navigate(`/blog/${result.id}`);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Sign in to write</h2>
          <Link href="/sign-in"><button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Sign In</button></Link>
        </div>
      </div>
    );
  }

  return (
    <>
        {/* Top bar */}
        <div className="sticky top-14 z-40 border-b border-border/40 bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
            <Link href="/blog">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </span>
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{wordCount} words</span>
              <span className="text-border">·</span>
              <span>~{readTime} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreview(!preview)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {preview ? "Edit" : "Preview"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {editId ? "Update" : "Publish"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 container mx-auto px-6 lg:px-8 py-8 max-w-4xl">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded text-[10px] font-mono border bg-amber-400/10 text-amber-400 border-amber-400/20">#{t}</span>
                ))}
              </div>
              <h1 className="text-4xl font-bold leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                {title || <span className="text-muted-foreground">Your title here…</span>}
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {excerpt || <span className="italic">No excerpt yet…</span>}
              </p>
              {coverImage && <img src={coverImage} alt="Cover" className="w-full rounded-xl border border-border object-cover max-h-64" />}
              <hr className="border-border/40" />
              <div
                className="prose prose-sm md:prose-base max-w-none
                  prose-invert
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-p:text-foreground/85 prose-p:leading-[1.8]
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-pre:bg-card prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:text-sm
                  prose-code:text-amber-400 prose-code:bg-amber-400/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.85em] prose-code:before:content-none prose-code:after:content-none
                  prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:not-italic
                  prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: content ? sanitizeHtml(marked.parse(content) as string) : '<p class="text-muted-foreground italic">Nothing written yet…</p>' }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <div className="text-xs font-mono text-primary mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {editId ? `Editing post #${editId}` : "New Chapter"}
                </div>

                <EditorField label="Title" icon={<FileText className="w-3 h-3" />}>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="What did you learn today?"
                    className="w-full text-xl font-bold bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40 text-foreground"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  />
                </EditorField>

                <EditorField label="Category" icon={<BookOpen className="w-3 h-3" />}>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCategory("tech")}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        category === "tech"
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-background border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      🚀 Tech Dev Log
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategory("general")}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        category === "general"
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-background border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      💡 General Write-Up
                    </button>
                  </div>
                </EditorField>

                <EditorField label="Excerpt (shown in cards)" icon={<AlignLeft className="w-3 h-3" />}>
                  <textarea
                    value={excerpt}
                    onChange={e => setExcerpt(e.target.value)}
                    placeholder="A one-sentence summary of this post…"
                    rows={2}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40 text-foreground resize-none"
                  />
                </EditorField>

                <EditorField label="Tags (up to 5, press Enter)" icon={<Tag className="w-3 h-3" />}>
                  <TagInput tags={tags} onChange={setTags} />
                </EditorField>

                <EditorField label="Cover image URL (optional)" icon={<ImageIcon className="w-3 h-3" />}>
                  <input
                    value={coverImage}
                    onChange={e => setCoverImage(e.target.value)}
                    placeholder="https://…"
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40 text-foreground"
                  />
                </EditorField>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-border/40 bg-muted/20">
                  <button
                    type="button"
                    onClick={() => insertMarkdown("**", "**")}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("*", "*")}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-border/60 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertMarkdown("# ", "")}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    title="Heading 1"
                  >
                    <Heading1 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("## ", "")}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    title="Heading 2"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-border/60 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertMarkdown("`", "`")}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    title="Inline Code"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("```\n", "\n```")}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    title="Code Block"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("[", "](url)")}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    title="Link"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("> ", "")}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    title="Blockquote"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("- ", "")}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    title="List Item"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-grow" />
                  <span className="text-[10px] font-mono text-muted-foreground pr-1">{wordCount} words</span>
                </div>
                <textarea
                  id="editor-textarea"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={"# Getting started\n\nWrite your chapter here. Use markdown for formatting.\n\n## What I learned\n\nStart typing…"}
                  className="w-full bg-transparent px-6 py-5 text-sm leading-[1.8] font-mono outline-none placeholder:text-muted-foreground/30 text-foreground resize-none min-h-[400px]"
                />
              </div>

              <div className="text-xs text-muted-foreground text-center pb-4">
                Supports basic markdown · Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">⌘S</kbd> to save
              </div>
            </motion.div>
          )}
        </div>
    </>
  );
}
