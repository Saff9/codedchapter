import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { isAdminEmail } from "@/lib/admin";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Loader2 } from "lucide-react";
import { SiSubstack } from "react-icons/si";
import { getFooterSocials, SUBSTACK_URL, RAZORPAY_URL } from "@/lib/social-links";

export function Footer() {
  const { user } = useAuth();
  const isAdmin = isAdminEmail(user?.email);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  const footerSocials = getFooterSocials();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    const url = `${SUBSTACK_URL.replace(/\/$/, "")}/subscribe?email=${encodeURIComponent(email)}`;
    window.open(url, "_blank");
    
    setSubscribed(true);
    setEmail("");

    toast({
      title: "Redirecting to Substack",
      description: "Opening the subscription form in a new tab.",
    });
  };

  return (
    <footer className="border-t border-border/40 bg-card/30 mt-auto pt-12 pb-8">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          
          {/* Brand & Bio */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/">
              <span
                className="text-sm font-bold tracking-tight cursor-pointer flex items-center gap-1.5"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                <span className="text-primary font-mono">&gt;_</span> Coded{" "}
                <span className="text-primary italic">Chapter</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              My dev log — notes from learning to code. Bugs, fixes, and whatever I figured out that week.
            </p>
            <div className="pt-2">
              <a
                href={RAZORPAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-[10px] font-semibold text-rose-400 transition-all shadow-sm hover:scale-[1.02]"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                </span>
                Support the Journey (₹199)
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Navigation</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link href="/"><span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Home</span></Link>
              </li>
              <li>
                <Link href="/tech"><span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Tech Logs</span></Link>
              </li>
              <li>
                <Link href="/general"><span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">General Logs</span></Link>
              </li>
              <li>
                <Link href="/doubts"><span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Doubts</span></Link>
              </li>
              {isAdmin && (
                <li>
                  <Link href="/write"><span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Write a Log</span></Link>
                </li>
              )}
            </ul>
          </div>

          {/* Newsletter Input */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Newsletter</h4>
            <p className="text-xs text-muted-foreground">
              Subscribe to my Substack newsletter to get logs and updates directly in your inbox.
            </p>
            {subscribed ? (
              <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Subscription page opened in a new tab!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm pt-1">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-border bg-background outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/30 text-foreground"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-border/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-muted-foreground font-mono">
            &copy; {new Date().getFullYear()} Coded Chapter. All rights shared under MIT license.
          </p>
          
          {/* Social Icons */}
          <div className="flex items-center gap-4">
            {footerSocials.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={social.label}
              >
                <social.icon className={social.name === "Substack" ? "w-3.5 h-3.5" : "w-4 h-4"} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
