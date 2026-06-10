import { motion } from "framer-motion";
import { FaGithub, FaYoutube, FaTelegram, FaDiscord, FaHeart } from "react-icons/fa6";
import { SiSubstack } from "react-icons/si";
import { ArrowUpRight } from "lucide-react";

interface SocialLink {
  name: string;
  url: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  shadowColor: string;
  description: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    name: "GitHub",
    url: "https://github.com/codedchapter",
    icon: <FaGithub className="w-5 h-5" />,
    gradient: "from-zinc-900 to-zinc-800",
    borderColor: "border-zinc-700/50",
    shadowColor: "shadow-zinc-500/10",
    description: "Browse the source code, open issues, or contribute to my learning projects.",
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/@CodedChapter",
    icon: <FaYoutube className="w-5 h-5 text-red-500" />,
    gradient: "from-rose-950/80 to-rose-900/50",
    borderColor: "border-red-500/30",
    shadowColor: "shadow-red-600/10",
    description: "Watch coding tutorials, debugging logs, and learning recaps.",
  },
  {
    name: "Telegram Channel",
    url: "https://t.me/CodedChapter",
    icon: <FaTelegram className="w-5 h-5 text-[#26A5E4]" />,
    gradient: "from-sky-950/80 to-sky-900/50",
    borderColor: "border-sky-500/30",
    shadowColor: "shadow-sky-500/10",
    description: "Join the channel for real-time code updates, links, and discussions.",
  },
  {
    name: "Discord Server",
    url: "https://discord.gg/5zwAUuD4Ec",
    icon: <FaDiscord className="w-5 h-5 text-[#5865F2]" />,
    gradient: "from-indigo-950/80 to-indigo-900/50",
    borderColor: "border-indigo-500/30",
    shadowColor: "shadow-indigo-500/10",
    description: "Join our peer learning group. Chat about bugs, review code, or build together.",
  },
  {
    name: "Substack Newsletter",
    url: "https://codedchapter.substack.com/",
    icon: <SiSubstack className="w-5 h-5 text-[#FF6719]" />,
    gradient: "from-amber-950/80 to-amber-900/50",
    borderColor: "border-amber-500/30",
    shadowColor: "shadow-amber-500/10",
    description: "Subscribe to read detailed logs and retrospectives on my coding journey.",
  },
  {
    name: "Support Coded Chapter (₹199)",
    url: "https://razorpay.me/@CodeChap?amount=KxK8ikz%2BGFZ8lMDydVeeuA%3D%3D",
    icon: <FaHeart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />,
    gradient: "from-rose-950/80 to-amber-950/60",
    borderColor: "border-rose-500/35",
    shadowColor: "shadow-rose-600/15",
    description: "Support my self-taught dev journey by contributing ₹199 securely via Razorpay.",
  },
];

export default function ConnectPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center py-16 px-6 overflow-hidden">
      {/* Background ambient glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 w-80 h-80 rounded-full bg-secondary/10 blur-[100px]" />

      <div className="container max-w-xl mx-auto relative z-10 space-y-10">
        
        {/* Profile Card Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative inline-flex mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary blur-lg rounded-full scale-105 opacity-40 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-card border-2 border-primary/40 overflow-hidden flex items-center justify-center">
              <img
                src="/favicon.jpg"
                alt="Coded Chapter Brand Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          <div className="space-y-1.5">
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Coded Chapter
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xs font-mono text-primary"
            >
              @coded_chapter
            </motion.p>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed"
          >
            I am currently learning how to code and sharing my absolute raw journey, failures, and breakthroughs. Connect with me across my channels!
          </motion.p>
        </div>

        {/* Links Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {SOCIAL_LINKS.map((link) => (
            <motion.a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              variants={itemVariants}
              className={`flex items-center gap-4 p-4 rounded-xl border ${link.borderColor} bg-gradient-to-r ${link.gradient} hover:scale-[1.015] hover:shadow-lg ${link.shadowColor} transition-all group cursor-pointer`}
            >
              <div className="w-10 h-10 rounded-lg bg-card/60 border border-border/40 flex items-center justify-center shrink-0">
                {link.icon}
              </div>
              <div className="flex-1 text-left space-y-0.5">
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  {link.name}
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </span>
                <p className="text-xs text-muted-foreground leading-normal pr-4">
                  {link.description}
                </p>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
