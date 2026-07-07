import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { isAdminEmail } from "@/lib/admin";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send } from "lucide-react";
import { getFooterSocials, SUBSTACK_URL, RAZORPAY_URL } from "@/lib/social-links";

export function Footer() {
  const { user } = useAuth();
  const isAdmin = isAdminEmail(user?.email);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  const footerSocials = getFooterSocials();

  // Opens the Substack subscription form in a new tab with the email pre-filled
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
    <footer className="border-t border-white/[0.06] bg-zinc-950/40 mt-auto pt-10 pb-6">
      <div className="container mx-auto px-6 lg:px-8">

        {/* Top row: brand + nav + newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">

          {/* Brand & bio */}
          <div className="md:col-span-5 space-y-3">
            <Link href="/">
              <span className="flex items-center gap-2 cursor-pointer group shrink-0">
                <span className="text-amber-500 font-mono text-sm font-bold group-hover:opacity-80 transition-opacity">&gt;_</span>
                <span
                  className="text-sm font-bold tracking-tight text-white"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Coded <span className="text-amber-500 italic">Chapter</span>
                </span>
              </span>
            </Link>

            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
            My dev log. Notes from learning to code: bugs, fixes, and whatever I figured out that week.
            </p>

            {/* Support badge */}
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

          {/* Quick nav */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 font-mono">Navigation</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link href="/"><span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">Home</span></Link></li>
              <li><Link href="/tech"><span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">Tech Logs</span></Link></li>
              <li><Link href="/general"><span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">General Logs</span></Link></li>
              <li><Link href="/doubts"><span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">Doubts</span></Link></li>
              {isAdmin && (
                <li><Link href="/write"><span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">Write a Log</span></Link></li>
              )}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4 space-y-2.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 font-mono">Newsletter</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Subscribe on Substack to get new logs straight to your inbox.
            </p>

            {subscribed ? (
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Opened in a new tab!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm pt-1">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-white/[0.08] bg-zinc-950/60 outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-600 text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-100 transition-colors flex items-center justify-center shrink-0 cursor-pointer active:scale-[0.97]"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar: copyright + social icons */}
        <div className="border-t border-white/[0.06] pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-zinc-600 font-mono">
            &copy; {new Date().getFullYear()} Coded Chapter. MIT license.
          </p>

          <div className="flex items-center gap-4">
            {footerSocials.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 hover:text-white transition-colors cursor-pointer"
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
