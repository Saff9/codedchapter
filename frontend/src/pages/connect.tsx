import { motion, type Variants } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { getConnectSocials } from "@/lib/social-links";

const SOCIAL_LINKS = getConnectSocials();

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ConnectPage() {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center py-16 px-6 overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-60 -left-40 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-60 right-0 w-[400px] h-[400px] rounded-full bg-secondary/8 blur-[140px]" />
      {/* Mesh grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container max-w-lg mx-auto relative z-10 space-y-10">

        {/* ── Profile Header ───────────────────────────────────────── */}
        <div className="text-center space-y-5">
          {/* Avatar with glow ring */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative inline-flex mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary blur-2xl rounded-full scale-110 opacity-30 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-card border-2 border-primary/40 overflow-hidden flex items-center justify-center shadow-2xl shadow-primary/20">
              <img
                src="/favicon.png"
                alt="Coded Chapter"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background shadow-sm shadow-emerald-500/50" />
          </motion.div>

          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full mb-2">
                <Sparkles className="w-2.5 h-2.5" />
                learning in public
              </div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Coded Chapter
              </h1>
              <p className="text-xs font-mono text-primary/80 mt-0.5">@coded_chapter</p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed"
            >
              Sharing my raw coding journey — failures, breakthroughs, and everything in between. Connect across my channels!
            </motion.p>
          </div>
        </div>

        {/* ── Social Links ─────────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {SOCIAL_LINKS.map((link) => (
            <motion.a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              variants={itemVariants}
              whileHover={{ scale: 1.015, translateY: -2 }}
              className={`group flex items-center gap-4 p-4 rounded-2xl border ${link.borderColor} bg-gradient-to-r ${link.gradient} transition-all duration-300 hover:shadow-xl ${link.shadowColor} cursor-pointer relative overflow-hidden`}
            >
              {/* Subtle inner glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/[0.02] rounded-2xl" />

              <div className="relative w-11 h-11 rounded-xl bg-card/60 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                {link.icon}
              </div>

              <div className="flex-1 text-left space-y-0.5 relative">
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  {link.name}
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
                </span>
                <p className="text-xs text-muted-foreground leading-tight">
                  {link.description}
                </p>
              </div>

              {/* Arrow indicator */}
              <div className="shrink-0 w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0">
                <ArrowUpRight className="w-3.5 h-3.5 text-foreground/60" />
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-[11px] font-mono text-muted-foreground/40"
        >
          &gt;_ follow along · every chapter counts
        </motion.p>
      </div>
    </div>
  );
}
