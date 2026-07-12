import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { FaJava } from "react-icons/fa6";
import { MapPin, Calendar, Code, Heart, Trophy, BookOpen, Terminal, GraduationCap, ChevronLeft, ChevronRight, Monitor } from "lucide-react";
import {
  SiJavascript,
  SiReact,
  SiTailwindcss,
  SiPostgresql,
  SiGit,
  SiNodedotjs,
  SiPython,
  SiCplusplus,
  SiLinux,
} from "react-icons/si";
import { FaGithub } from "react-icons/fa6";
import { getAboutSocials } from "@/lib/social-links";

const SOCIALS = getAboutSocials();

// Current tech stack. Update the `level` field as you progress:
//   "Active Learning" → currently studying this right now
//   "Upcoming"        → planned but not started yet
//   "Completed"       → finished a course or feel confident in it
const SKILLS = [
  // ── Currently Learning ──────────────────────────────────────────────────────
  { name: "Python (CS50P)",         level: "Active Learning", category: "Languages",  icon: <SiPython    className="w-4 h-4 text-[#3776AB]" /> },
  { name: "CS50x: Intro to CS",     level: "Active Learning", category: "Course",     icon: <Monitor     className="w-4 h-4 text-violet-400" /> },
  { name: "Linux & Command Line",   level: "Active Learning", category: "OS / Tools", icon: <SiLinux     className="w-4 h-4 text-[#FCC624]" /> },
  { name: "PostgreSQL",             level: "Active Learning", category: "Database",   icon: <SiPostgresql className="w-4 h-4 text-[#4169E1]" /> },
  { name: "Git & Version Control",  level: "Active Learning", category: "Tools",      icon: <SiGit       className="w-4 h-4 text-[#F05032]" /> },
  { name: "GitHub",                 level: "Active Learning", category: "Tools",      icon: <FaGithub    className="w-4 h-4" /> },
  // ── On the Roadmap ───────────────────────────────────────────────────────────
  { name: "C++",                    level: "Upcoming",        category: "Languages",  icon: <SiCplusplus className="w-4 h-4 text-[#00599C]" /> },
  { name: "Java",                   level: "Upcoming",        category: "Languages",  icon: <FaJava      className="w-4 h-4 text-[#ED8B00]" /> },
  { name: "JavaScript / TypeScript",level: "Upcoming",        category: "Languages",  icon: <SiJavascript className="w-4 h-4 text-[#F7DF1E]" /> },
  { name: "React / Next.js",        level: "Upcoming",        category: "Frontend",   icon: <SiReact     className="w-4 h-4 text-[#61DAFB]" /> },
  { name: "Express / Node.js",      level: "Upcoming",        category: "Backend",    icon: <SiNodedotjs className="w-4 h-4 text-[#339933]" /> },
  { name: "Tailwind CSS",           level: "Upcoming",        category: "Design",     icon: <SiTailwindcss className="w-4 h-4 text-[#06B6D4]" /> },
];

// Timeline is chronological — most recent first.
// Add a new entry here every time you hit a meaningful learning milestone.
const MILESTONES = [
  { date: "July 2026",  title: "CS50x + Linux + PostgreSQL",          desc: "Enrolled in Harvard's CS50x to build proper CS fundamentals. Simultaneously picking up Linux command line and PostgreSQL as core tools." },
  { date: "June 2026", title: "Coded Chapter Launched",               desc: "First public deployment of my self-taught dev log and community Q&A platform." },
  { date: "May 2026",  title: "Entered full-stack backend development", desc: "Learned Node.js, Express middleware logic, and database schemas with Supabase." },
  { date: "April 2026",title: "Mastering modern React",               desc: "Built interactive apps using custom hooks, state management, and Tailwind CSS." },
  { date: "March 2026",title: "The First Hello World",                desc: "Wrote my very first line of JavaScript and fell down the programming rabbit hole." },
];

// Developer Logo Animation replacing static avatar
function DeveloperLogoAnimation() {
  return (
    <div className="relative w-32 h-32 rounded-full flex items-center justify-center bg-card border border-border/80 overflow-hidden shadow-xl group">
      {/* Rotating Gradient Rings */}
      <motion.div 
        className="absolute inset-0.5 rounded-full border border-dashed border-primary/40"
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute inset-2 rounded-full border border-dotted border-secondary/40"
        animate={{ rotate: -360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      {/* Glowing Backlight */}
      <div className="absolute inset-3 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-sm group-hover:scale-110 transition-transform duration-500" />
      
      {/* Central Terminal Icon */}
      <div className="relative font-mono text-xl font-bold flex flex-col items-center select-none z-10">
        <motion.span 
          className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-400"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          &lt;OC/&gt;
        </motion.span>
        <motion.span 
          className="text-[8px] text-muted-foreground mt-1"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          [active]
        </motion.span>
      </div>
    </div>
  );
}

// Chapter 1 Visual: The Spark
function SparkVisual() {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples((prev) => [...prev, { id: Date.now(), x, y }]);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (ripples.length > 0) {
      timer = setTimeout(() => {
        setRipples((prev) => prev.slice(1));
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [ripples]);

  return (
    <div 
      ref={containerRef}
      onClick={handleClick}
      className="w-full h-full bg-gradient-to-b from-background to-muted/20 flex items-center justify-center relative overflow-hidden cursor-pointer"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      
      <div className="relative">
        <motion.div 
          className="w-20 h-20 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 blur-xl absolute -left-10 -top-10"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-amber-500 flex items-center justify-center shadow-lg relative z-10 border border-white/20"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Code className="w-4 h-4 text-white" />
        </motion.div>
      </div>

      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary"
          style={{
            left: "50%",
            top: "50%",
          }}
          animate={{
            x: [
              Math.cos((i * Math.PI) / 3) * 60,
              Math.cos((i * Math.PI) / 3 + Math.PI / 2) * 90,
              Math.cos((i * Math.PI) / 3 + Math.PI) * 60,
              Math.cos((i * Math.PI) / 3 + 1.5 * Math.PI) * 90,
              Math.cos((i * Math.PI) / 3) * 60,
            ],
            y: [
              Math.sin((i * Math.PI) / 3) * 60,
              Math.sin((i * Math.PI) / 3 + Math.PI / 2) * 40,
              Math.sin((i * Math.PI) / 3 + Math.PI) * 60,
              Math.sin((i * Math.PI) / 3 + 1.5 * Math.PI) * 40,
              Math.sin((i * Math.PI) / 3) * 60,
            ],
            scale: [1, 1.4, 0.8, 1.2, 1],
            opacity: [0.6, 1, 0.4, 0.9, 0.6],
          }}
          transition={{
            duration: 8 + i,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}

      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          className="absolute rounded-full border border-primary/60 bg-primary/5 pointer-events-none"
          style={{
            left: ripple.x - 50,
            top: ripple.y - 50,
            width: 100,
            height: 100,
          }}
          initial={{ scale: 0.1, opacity: 1 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))}

      <div className="absolute top-8 left-8 font-mono text-[9px] text-muted-foreground/60 select-none bg-background/40 backdrop-blur-sm border border-border/30 rounded px-1.5 py-0.5 pointer-events-none">
        &gt; initial_commit.sh
      </div>
      <div className="absolute bottom-28 right-8 font-mono text-[9px] text-primary/70 select-none bg-primary/5 border border-primary/20 rounded px-1.5 py-0.5 pointer-events-none">
        &gt; console.log("Hello World")
      </div>
    </div>
  );
}

// Chapter 2 Visual: The Rabbit Hole
function RabbitHoleVisual() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full h-full bg-gradient-to-b from-background to-violet-950/10 flex items-center justify-center relative overflow-hidden"
      style={{ perspective: "1000px" }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      <motion.div 
        className="w-full h-full flex items-center justify-center absolute inset-0 pointer-events-none"
        animate={{
          rotateX: mousePos.y * 30,
          rotateY: -mousePos.x * 30,
        }}
        transition={{ type: "spring", stiffness: 60, damping: 15 }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-2xl border border-secondary/20 bg-secondary/[0.01]"
            style={{
              width: 100 + i * 60,
              height: 100 + i * 60,
            }}
            animate={{
              rotate: [i * 15, i * 15 + 360],
              scale: [0.8, 1.1, 0.8],
              borderColor: [
                "rgba(139, 92, 246, 0.1)",
                "rgba(139, 92, 246, 0.3)",
                "rgba(139, 92, 246, 0.1)"
              ]
            }}
            transition={{
              rotate: { duration: 20 + i * 5, repeat: Infinity, ease: "linear" },
              scale: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }
            }}
          />
        ))}
      </motion.div>

      <div className="relative font-mono text-[10px] text-secondary/80 bg-background/60 border border-secondary/20 p-3 rounded-lg backdrop-blur-sm shadow-xl flex flex-col space-y-1 z-10 max-w-[240px] pointer-events-none select-none">
        <div className="text-[8px] text-muted-foreground">// Every chapter gets me closer</div>
        <div className="text-secondary"><span className="text-pink-500">while</span> (me.progress !== <span className="text-amber-400">"done"</span>) &#123;</div>
        <div className="pl-4 text-foreground">me.write(<span className="text-green-400">"a new chapter"</span>);</div>
        <div>&#125;</div>
      </div>

      <div className="absolute top-4 right-4 font-mono text-[8px] text-muted-foreground/40 pointer-events-none">
        INTERACTIVE // MOVE MOUSE TO TILT
      </div>
    </div>
  );
}

// Chapter 3 Visual: Full-Stack Connect
function FullStackVisual() {
  const [pulseCount, setPulseCount] = useState(0);

  const triggerPacket = () => {
    setPulseCount((prev) => prev + 1);
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-background to-amber-950/10 flex items-center justify-between px-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      <motion.div 
        onClick={triggerPacket}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-24 h-24 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-xl flex flex-col items-center justify-center cursor-pointer select-none space-y-1.5 relative z-10"
      >
        <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-sm opacity-50 pointer-events-none" />
        <Terminal className="w-6 h-6 text-primary pointer-events-none" />
        <span className="font-mono text-[9px] font-bold pointer-events-none">CLIENT (UI)</span>
        <span className="text-[8px] text-muted-foreground pointer-events-none">React / Vite</span>
      </motion.div>

      <div className="flex-1 h-0.5 border-t-2 border-dashed border-border/50 relative mx-4 pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary"
            animate={{
              left: ["0%", "100%"],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
              ease: "easeInOut"
            }}
          />
        ))}

        {[...Array(pulseCount)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-secondary shadow-md shadow-secondary z-20"
            initial={{ left: "0%" }}
            animate={{
              left: "100%",
              scale: [1, 1.3, 1]
            }}
            transition={{
              duration: 1.5,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      <motion.div 
        onClick={triggerPacket}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-24 h-24 rounded-2xl bg-card border border-border hover:border-secondary/50 shadow-xl flex flex-col items-center justify-center cursor-pointer select-none space-y-1.5 relative z-10"
      >
        <div className="absolute inset-0 bg-secondary/5 rounded-2xl blur-sm opacity-50 pointer-events-none" />
        <Code className="w-6 h-6 text-secondary pointer-events-none" />
        <span className="font-mono text-[9px] font-bold pointer-events-none">SERVER (API)</span>
        <span className="text-[8px] text-muted-foreground pointer-events-none">Python FastAPI</span>
      </motion.div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-[9px] text-muted-foreground/60 bg-background/50 border border-border/30 rounded px-2 py-0.5 pointer-events-none">
        {"GET /api/posts/featured -> 200 OK"}
      </div>

      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 font-mono text-[8px] text-muted-foreground/40 pointer-events-none">
        CLICK EITHER NODE TO EMIT DATA
      </div>
    </div>
  );
}

// Chapter 4 Visual: Security Shield
function SecurityVisual() {
  const [shieldActive, setShieldActive] = useState(true);

  return (
    <div 
      onClick={() => setShieldActive(!shieldActive)}
      className="w-full h-full bg-gradient-to-b from-background to-emerald-950/10 flex items-center justify-center relative overflow-hidden cursor-pointer"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:18px_18px] pointer-events-none" />

      <motion.div 
        className="absolute inset-x-0 h-0.5 bg-emerald-500/30 shadow-lg shadow-emerald-500/50 pointer-events-none z-10"
        animate={{
          top: ["0%", "100%", "0%"]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative flex items-center justify-center">
        <motion.div 
          className="absolute w-36 h-36 rounded-full border-2 border-dashed border-emerald-500/20 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />

        <motion.div 
          className="absolute w-28 h-28 rounded-full border border-dashed border-emerald-400/30 pointer-events-none"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />

        <AnimatePresence>
          {shieldActive && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 0.25 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute w-28 h-28 rounded-full bg-emerald-500/30 blur-md pointer-events-none"
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        <motion.div 
          className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 shadow-xl z-20 transition-colors duration-300 pointer-events-none ${
            shieldActive 
              ? "bg-card border-emerald-500/60 text-emerald-400 shadow-emerald-500/10" 
              : "bg-card border-amber-500/40 text-amber-400 shadow-amber-500/10"
          }`}
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            animate={shieldActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {shieldActive ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-off"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
            )}
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute top-4 left-4 font-mono text-[8px] bg-background/50 border border-border/40 p-1 rounded flex items-center gap-1 pointer-events-none">
        <span className={`w-1.5 h-1.5 rounded-full ${shieldActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
        <span>SCREEN_GUARD: {shieldActive ? "ACTIVE" : "DISABLED"}</span>
      </div>

      <div className="absolute bottom-28 left-4 font-mono text-[8px] text-muted-foreground/50 pointer-events-none">
        &gt;_ anti_screenshot.py
      </div>
      
      <div className="absolute bottom-28 right-4 font-mono text-[8px] text-muted-foreground/50 pointer-events-none">
        &gt;_ anti_record.ts
      </div>

      <div className="absolute top-4 right-4 font-mono text-[8px] text-muted-foreground/40 pointer-events-none">
        CLICK TO TOGGLE GUARD
      </div>
    </div>
  );
}

const CHAPTER_VISUALS = [
  {
    title: "Chapter 1: The Spark",
    description: "Wrote the first lines of code. The neural network of learning activates. Click to emit ripples.",
    component: SparkVisual
  },
  {
    title: "Chapter 2: The Rabbit Hole",
    description: "Exploring states, recursive loops, and design systems. Move mouse over the area to tilt.",
    component: RabbitHoleVisual
  },
  {
    title: "Chapter 3: Full-Stack Connect",
    description: "Connecting React user interfaces to Python backends. Click either node to send custom packets.",
    component: FullStackVisual
  },
  {
    title: "Chapter 4: Security Shield",
    description: "Configuring screen capture protection and backend route hardening. Click to toggle shield.",
    component: SecurityVisual
  }
];

export default function AboutPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % CHAPTER_VISUALS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + CHAPTER_VISUALS.length) % CHAPTER_VISUALS.length);
  };

  return (
    <div className="relative min-h-[85vh] py-16 px-6 overflow-hidden">
      {/* Background glow layers */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 w-80 h-80 rounded-full bg-secondary/10 blur-[100px]" />

      <div className="container max-w-3xl mx-auto relative z-10 space-y-12">
        
        {/* Intro profile section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center"
        >
          {/* Avatar frame */}
          <div className="relative shrink-0">
            <DeveloperLogoAnimation />
          </div>

          {/* Intro text */}
          <div className="space-y-4 text-center md:text-left flex-1 min-w-0">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-primary uppercase tracking-wider">// author.profile</span>
              <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Hey, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-400">Owais</span>
              </h1>
              <p className="text-sm font-medium text-foreground/80">Road to Software Engineering</p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Kashmir</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Learning since 2026</span>
            </div>

            {/* Profile Social Row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
              {SOCIALS.map((soc) => (
                <a
                  key={soc.name}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg border border-border/60 bg-background/50 text-muted-foreground transition-all ${soc.color}`}
                  title={soc.name}
                >
                  {soc.icon}
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Photo Gallery Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border/80 rounded-2xl p-4 md:p-6 space-y-4"
        >
          <div className="relative group overflow-hidden rounded-xl bg-black border border-border/40 aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9]">
            {/* Slides container */}
            <div 
              className="w-full h-full relative cursor-grab active:cursor-grabbing select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  {CHAPTER_VISUALS[currentIndex].component()}
                </motion.div>
              </AnimatePresence>
              
              {/* Gradient Overlay for labels */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-6 pt-16 flex flex-col justify-end pointer-events-none z-30">
                <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded self-start mb-2">
                  CHAPTER VISUAL 0{currentIndex + 1} / 0{CHAPTER_VISUALS.length}
                </span>
                <p className="text-sm font-semibold text-white tracking-wide font-sans md:text-base">{CHAPTER_VISUALS[currentIndex].title}</p>
                <p className="text-xs text-white/70 mt-1 max-w-xl">{CHAPTER_VISUALS[currentIndex].description}</p>
              </div>
            </div>

            {/* Navigation buttons (Desktop) */}
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/60 border border-border text-white/85 hover:text-primary hover:bg-black/90 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center cursor-pointer z-30"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/60 border border-border text-white/85 hover:text-primary hover:bg-black/90 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center cursor-pointer z-30"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Mobile swipe indicator */}
            <div className="absolute top-4 right-4 text-[10px] font-mono bg-black/60 px-2.5 py-1 rounded-full text-white/60 md:hidden border border-white/10 z-30">
              ← Swipe to navigate →
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-2 pt-2">
            {CHAPTER_VISUALS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "w-6 bg-primary" : "w-2 bg-border hover:bg-border/80"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Bio paragraph details */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 space-y-4"
        >
          <h2 className="text-lg font-bold flex items-center gap-2 border-b border-border/40 pb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            <Terminal className="w-4 h-4 text-primary" /> My Journey
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
            <p>
              I started my programming journey with a simple question: <em>"How does this web application actually run?"</em> What began as curious exploration quickly evolved into a dedicated passion for building clean, well-understood software.
            </p>
            <p>
              Right now I'm working through three things in parallel: <strong>CS50x</strong> (Harvard's Introduction to Computer Science) to build proper CS fundamentals from scratch, <strong>PostgreSQL</strong> to understand how data actually lives and breathes in a real backend, and <strong>Linux</strong> to get comfortable with the command line and the environment most servers run on. I also finished <strong>CS50P</strong> (Python) earlier this year.
            </p>
            <p>
              Having completed school, I am heading to college in a few months. Once there, the plan is to tackle <strong>C++</strong> and <strong>Java</strong> depending on what the curriculum asks for. The foundations I am building now will make that a lot easier.
            </p>
            <p>
              <strong>Coded Chapter</strong> is my public log of all of this. Every confusion, every bug, every moment of clarity, written down as it happens. Learning in public keeps me honest and hopefully useful to someone else on the same road.
            </p>
          </div>
        </motion.div>

        {/* Education Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 space-y-6"
        >
          <h2 className="text-lg font-bold flex items-center gap-2 border-b border-border/40 pb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            <GraduationCap className="w-5 h-5 text-primary" /> Academic Timeline
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4 items-start relative group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">12th Grade (Higher Secondary)</h3>
                  <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">2026</span>
                </div>
                <p className="text-[11px] text-muted-foreground/80">Completed higher secondary education, laying the theoretical base prior to university.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start relative group">
              <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">11th Grade</h3>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">2025</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-start relative group">
              <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">10th Grade (Secondary School)</h3>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">2024</span>
                </div>
                <p className="text-[11px] text-muted-foreground/80">Cleared Secondary School Examination with a strong foundation in science and mathematics.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Skills inventory */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 space-y-4"
        >
          <h2 className="text-lg font-bold flex items-center gap-2 border-b border-border/40 pb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            <Code className="w-4 h-4 text-primary" /> Learning Stack
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SKILLS.map((skill) => {
              const isActive = skill.level === "Active Learning";
              return (
                <div
                  key={skill.name}
                  className={`p-3 border rounded-xl space-y-1.5 transition-colors ${
                    isActive
                      ? "bg-primary/5 border-primary/20 hover:border-primary/40"
                      : "bg-background/50 border-border/60 hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {skill.icon}
                      <span className="font-semibold text-foreground">{skill.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isActive
                          ? "text-primary bg-primary/10 border border-primary/20"
                          : "text-muted-foreground bg-muted/60"
                      }`}
                    >
                      {skill.level}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/70">{skill.category}</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Milestones Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 space-y-6"
        >
          <h2 className="text-lg font-bold flex items-center gap-2 border-b border-border/40 pb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            <Trophy className="w-4 h-4 text-primary" /> Roadmap & Milestones
          </h2>
          <div className="relative border-l border-border pl-6 ml-2 space-y-6">
            {MILESTONES.map((stone, i) => (
              <div key={stone.title} className="relative group">
                {/* Timeline dot highlight */}
                <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-border group-hover:bg-primary group-hover:scale-110 transition-all border border-card" />
                
                <div className="space-y-1 text-left">
                  <div className="text-[10px] font-mono text-primary font-semibold">{stone.date}</div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{stone.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{stone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Call to action footer box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-6 border border-dashed border-border/80 bg-primary/5 rounded-2xl text-center space-y-4"
        >
          <div className="flex justify-center text-primary"><Heart className="w-8 h-8 animate-pulse" /></div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Have any coding questions?</h3>
            <p className="text-xs text-muted-foreground">Ask a doubt in the community forum, or connect with me directly!</p>
          </div>
          <div className="flex justify-center gap-3">
            <Link href="/doubts/ask" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
              Ask a Doubt
            </Link>
            <Link href="/connect" className="px-4 py-2 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              Connect
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
