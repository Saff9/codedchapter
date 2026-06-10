import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { User, Save, Loader2, Check, AtSign, Globe, Github, Twitter, ArrowLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground/60">{hint}</p>}
    </div>
  );
}

function TextInput({ icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
      <input
        {...props}
        className={`w-full bg-background border border-border rounded-lg py-2.5 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40 ${icon ? "pl-9 pr-4" : "px-4"}`}
      />
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");

  const [usernameAvail, setUsernameAvail] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [originalUsername, setOriginalUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getMyProfile().then((p: any) => {
      setUsername(p.username ?? "");
      setDisplayName(p.displayName ?? "");
      setBio(p.bio ?? "");
      setLocation(p.location ?? "");
      setWebsite(p.website ?? "");
      setGithubUrl(p.githubUrl ?? "");
      setTwitterUrl(p.twitterUrl ?? "");
      setOriginalUsername(p.username ?? "");
      setLoaded(true);
    }).catch(() => {
      if (user?.user_metadata?.full_name) setDisplayName(user.user_metadata.full_name);
      setLoaded(true);
    });
  }, [user]);

  useEffect(() => {
    if (!username || username === originalUsername) { setUsernameAvail(null); return; }
    const t = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const { available }: any = await api.checkUsername(username);
        setUsernameAvail(available);
      } catch { setUsernameAvail(null); }
      setCheckingUsername(false);
    }, 400);
    return () => clearTimeout(t);
  }, [username, originalUsername]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.match(/^[a-z0-9_]{3,30}$/)) {
      toast({ title: "Invalid username", description: "3-30 chars, lowercase letters, numbers, underscores only.", variant: "destructive" });
      return;
    }
    if (!displayName.trim()) {
      toast({ title: "Display name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const result: any = await api.upsertProfile({ username, displayName, bio, location, website, githubUrl, twitterUrl });
      setOriginalUsername(result.username);
      toast({ title: "Profile saved!", description: `Your profile is live at /u/${result.username}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <User className="w-10 h-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">Sign in to edit your profile</h2>
          <Link href="/sign-in"><button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">Sign In</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 lg:px-8 py-12 max-w-2xl">
        <Link href="/">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer mb-8 group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back
          </span>
        </Link>

        <div className="mb-8">
          <div className="text-xs font-mono text-primary mb-2">// profile.settings</div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Edit Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up your public developer identity.</p>
        </div>

        {!loaded ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSave}
            className="space-y-6"
          >
            {/* Identity */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <div className="text-xs font-mono text-muted-foreground border-b border-border/40 pb-3">Identity</div>

              <Field label="Username" hint="Your @handle — visible in your profile URL and comments">
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="yourhandle"
                    maxLength={30}
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-10 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingUsername && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                    {!checkingUsername && usernameAvail === true && username !== originalUsername && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    {!checkingUsername && usernameAvail === false && <AlertCircle className="w-3.5 h-3.5 text-destructive" />}
                  </div>
                </div>
                {usernameAvail === false && username !== originalUsername && (
                  <p className="text-xs text-destructive">This username is already taken.</p>
                )}
              </Field>

              <Field label="Display Name">
                <TextInput value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your full name or nickname" icon={<User className="w-3.5 h-3.5" />} />
              </Field>

              <Field label="Bio" hint="Max 300 characters">
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="A few words about yourself and your coding journey…"
                  maxLength={300}
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40 resize-none"
                />
                <div className="text-right text-[10px] text-muted-foreground">{bio.length}/300</div>
              </Field>
            </div>

            {/* Links */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <div className="text-xs font-mono text-muted-foreground border-b border-border/40 pb-3">Links</div>
              <Field label="Location">
                <TextInput value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country" />
              </Field>
              <Field label="Website">
                <TextInput value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" icon={<Globe className="w-3.5 h-3.5" />} />
              </Field>
              <Field label="GitHub">
                <TextInput value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/username" icon={<Github className="w-3.5 h-3.5" />} />
              </Field>
              <Field label="Twitter / X">
                <TextInput value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} placeholder="https://twitter.com/username" icon={<Twitter className="w-3.5 h-3.5" />} />
              </Field>
            </div>

            {/* Preview */}
            {username && (
              <div className="bg-muted/30 border border-border/40 rounded-xl p-4 text-xs text-muted-foreground">
                Your profile will be at{" "}
                <Link href={`/u/${username}`}>
                  <span className="text-primary font-mono cursor-pointer hover:underline">/u/{username}</span>
                </Link>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || (usernameAvail === false && username !== originalUsername)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Profile
              </button>
            </div>
          </motion.form>
        )}
      </div>
  );
}
