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

// Chapter 1 Visual: The Spark (Constellation Network Spark)
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
      className="w-full h-full bg-gradient-to-br from-[#0a051b] via-[#0c0824] to-[#12072b] flex items-center justify-center relative overflow-hidden cursor-pointer"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-secondary/5 blur-[80px] pointer-events-none" />

      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
        <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="currentColor" className="text-primary" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="80%" y1="25%" x2="50%" y2="50%" stroke="currentColor" className="text-secondary" strokeWidth="1" />
        <line x1="15%" y1="75%" x2="50%" y2="50%" stroke="currentColor" className="text-secondary" strokeWidth="1" />
        <line x1="75%" y1="80%" x2="50%" y2="50%" stroke="currentColor" className="text-primary" strokeWidth="1" strokeDasharray="3 3" />
      </svg>

      {[
        { left: "20%", top: "30%", color: "bg-primary", delay: 0 },
        { left: "80%", top: "25%", color: "bg-secondary", delay: 1.5 },
        { left: "15%", top: "75%", color: "bg-secondary", delay: 0.8 },
        { left: "75%", top: "80%", color: "bg-primary", delay: 2.2 },
      ].map((node, i) => (
        <motion.div
          key={i}
          className={`absolute w-3 h-3 rounded-full ${node.color} opacity-40`}
          style={{ left: node.left, top: node.top }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity, delay: node.delay, ease: "easeInOut" }}
        />
      ))}

      <div className="relative">
        <motion.div 
          className="w-32 h-32 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-2xl absolute -left-16 -top-16"
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="w-14 h-14 rounded-full bg-gradient-to-br from-primary via-amber-500 to-secondary flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)] relative z-10 border border-white/20"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Code className="w-6 h-6 text-white pointer-events-none" />
        </motion.div>
      </div>

      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full pointer-events-none ${i % 2 === 0 ? "bg-primary" : "bg-secondary"}`}
          style={{
            left: "50%",
            top: "50%",
            width: i % 3 === 0 ? "4px" : "6px",
            height: i % 3 === 0 ? "4px" : "6px",
          }}
          animate={{
            x: [
              Math.cos((i * Math.PI) / 4) * 80,
              Math.cos((i * Math.PI) / 4 + Math.PI / 2) * 120,
              Math.cos((i * Math.PI) / 4 + Math.PI) * 80,
              Math.cos((i * Math.PI) / 4 + 1.5 * Math.PI) * 120,
              Math.cos((i * Math.PI) / 4) * 80,
            ],
            y: [
              Math.sin((i * Math.PI) / 4) * 80,
              Math.sin((i * Math.PI) / 4 + Math.PI / 2) * 50,
              Math.sin((i * Math.PI) / 4 + Math.PI) * 80,
              Math.sin((i * Math.PI) / 4 + 1.5 * Math.PI) * 50,
              Math.sin((i * Math.PI) / 4) * 80,
            ],
            scale: [0.6, 1.3, 0.7, 1.2, 0.6],
            opacity: [0.2, 0.8, 0.3, 0.9, 0.2],
          }}
          transition={{
            duration: 9 + i,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}

      {ripples.map((ripple) => (
        <div key={ripple.id}>
          <motion.div
            className="absolute rounded-full border-2 border-primary/50 bg-primary/5 pointer-events-none shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            style={{ left: ripple.x, top: ripple.y }}
            initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 1 }}
            animate={{ width: 160, height: 160, x: -80, y: -80, opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          <motion.div
            className="absolute rounded-full border border-secondary/40 pointer-events-none"
            style={{ left: ripple.x, top: ripple.y }}
            initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.8 }}
            animate={{ width: 260, height: 260, x: -130, y: -130, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 }}
          />
        </div>
      ))}

      <div className="absolute top-6 left-6 font-mono text-[9px] text-muted-foreground/60 select-none bg-[#0a051b]/80 border border-border/20 rounded px-2 py-1 backdrop-blur-md pointer-events-none">
        <span className="text-primary mr-1">●</span> IDE_SPARK_V1.0
      </div>
      <div className="absolute bottom-28 right-6 font-mono text-[9px] text-primary/70 select-none bg-[#0a051b]/80 border border-primary/20 rounded px-2 py-1 backdrop-blur-md pointer-events-none">
        &gt; console.log("Hello World")
      </div>
    </div>
  );
}

// Chapter 2 Visual: The Rabbit Hole (3D Parallax Vortex)
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
      className="w-full h-full bg-gradient-to-br from-[#08021c] via-[#050013] to-[#120021] flex items-center justify-center relative overflow-hidden"
      style={{ perspective: "1000px" }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      <motion.div 
        className="w-[400px] h-[400px] flex items-center justify-center absolute pointer-events-none"
        animate={{
          rotateX: mousePos.y * 45,
          rotateY: -mousePos.x * 45,
        }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-secondary/20 flex items-center justify-center"
            style={{
              width: 60 + i * 55,
              height: 60 + i * 55,
              borderStyle: i % 2 === 0 ? "solid" : "dashed",
              transformStyle: "preserve-3d"
            }}
            animate={{
              rotateZ: [i * 30, i * 30 + (i % 2 === 0 ? 360 : -360)],
              z: [i * -10, i * -25, i * -10],
              borderColor: [
                "rgba(139, 92, 246, 0.15)",
                "rgba(139, 92, 246, 0.4)",
                "rgba(139, 92, 246, 0.15)"
              ]
            }}
            transition={{
              rotateZ: { duration: 15 + i * 5, repeat: Infinity, ease: "linear" },
              z: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }
            }}
          >
            {i === 3 && (
              <div className="w-1.5 h-1.5 rounded-full bg-secondary absolute -top-1 shadow-[0_0_8px_rgba(139,92,246,0.8)] animate-pulse" />
            )}
            {i === 4 && (
              <div className="w-1.5 h-1.5 rounded-full bg-primary absolute -bottom-1 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
            )}
          </motion.div>
        ))}
      </motion.div>

      <div className="relative font-mono text-[10px] text-secondary/90 bg-[#09021c]/80 border border-secondary/20 p-4 rounded-xl backdrop-blur-md shadow-2xl flex flex-col space-y-1.5 z-10 max-w-[260px] pointer-events-none select-none">
        <div className="text-[8px] text-muted-foreground flex justify-between">
          <span>// Every chapter gets me closer</span>
          <span className="text-secondary/50 animate-pulse">● CODE</span>
        </div>
        <div className="text-secondary border-t border-secondary/10 pt-2"><span className="text-pink-500">while</span> (me.progress !== <span className="text-amber-400">"done"</span>) &#123;</div>
        <div className="pl-4 text-foreground border-l-2 border-primary/30 ml-1 py-0.5">me.write(<span className="text-green-400">"a new chapter"</span>);</div>
        <div>&#125;</div>
      </div>

      <div className="absolute top-6 right-6 font-mono text-[8px] text-muted-foreground/50 pointer-events-none">
        PARALLAX GRID // TILT EFFECT
      </div>
    </div>
  );
}

// Chapter 3 Visual: Full-Stack Connect (Interactive Glass Diagram)
function FullStackVisual() {
  const [pulseCount, setPulseCount] = useState(0);

  const triggerPacket = () => {
    setPulseCount((prev) => prev + 1);
  };

  return (
    <div 
      onClick={triggerPacket}
      className="w-full h-full bg-gradient-to-br from-[#0c051a] via-[#090515] to-[#1d0a2d] flex items-center justify-between px-12 relative overflow-hidden cursor-pointer"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      <motion.div 
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="w-28 h-28 rounded-2xl bg-[#0d0720]/80 border border-primary/30 hover:border-primary/60 shadow-[0_0_20px_rgba(245,158,11,0.05)] flex flex-col items-center justify-center select-none space-y-2 relative z-10 backdrop-blur-md transition-all pointer-events-none"
      >
        <div className="absolute inset-0.5 rounded-2xl border border-white/5 pointer-events-none" />
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <Terminal className="w-5 h-5" />
        </div>
        <div className="text-center">
          <span className="font-mono text-[9px] font-bold block text-foreground">CLIENT (UI)</span>
          <span className="text-[7px] text-muted-foreground font-mono">React + TS + Vite</span>
        </div>
      </motion.div>

      <div className="flex-1 h-0.5 border-t border-dashed border-border/40 relative mx-3 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/15 to-secondary/10 w-full h-[2px] blur-sm" />
        
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/70 shadow-[0_0_8px_var(--primary)]"
            animate={{
              left: ["0%", "100%"],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 1.33,
              ease: "linear"
            }}
          />
        ))}

        {[...Array(pulseCount)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_12px_rgba(139,92,246,0.8)] z-20"
            initial={{ left: "0%" }}
            animate={{
              left: "100%",
              scale: [1, 1.4, 1]
            }}
            transition={{
              duration: 1.8,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      <motion.div 
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="w-28 h-28 rounded-2xl bg-[#0d0720]/80 border border-secondary/30 hover:border-secondary/60 shadow-[0_0_20px_rgba(139,92,246,0.05)] flex flex-col items-center justify-center select-none space-y-2 relative z-10 backdrop-blur-md transition-all pointer-events-none"
      >
        <div className="absolute inset-0.5 rounded-2xl border border-white/5 pointer-events-none" />
        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
          <Code className="w-5 h-5" />
        </div>
        <div className="text-center">
          <span className="font-mono text-[9px] font-bold block text-foreground">SERVER (API)</span>
          <span className="text-[7px] text-muted-foreground font-mono">FastAPI + Python</span>
        </div>
      </motion.div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 font-mono text-[8px] text-muted-foreground/60 bg-[#0d0720]/80 border border-border/20 rounded px-2.5 py-1 backdrop-blur-md pointer-events-none">
        GET <span className="text-primary">/api/posts/featured</span> &rarr; <span className="text-emerald-400">200 OK</span>
      </div>

      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 font-mono text-[8px] text-muted-foreground/40 pointer-events-none">
        CLICK CANVAS TO TRIGGER REQUESTS
      </div>
    </div>
  );
}

// Chapter 4 Visual: Security Shield (Holographic Cyber Shield)
function SecurityVisual() {
  const [shieldActive, setShieldActive] = useState(true);

  return (
    <div 
      onClick={() => setShieldActive(!shieldActive)}
      className="w-full h-full bg-gradient-to-br from-[#040912] via-[#050e18] to-[#071923] flex items-center justify-center relative overflow-hidden cursor-pointer"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      <motion.div 
        className="absolute inset-x-0 h-0.5 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.4)] pointer-events-none z-10"
        animate={{
          top: ["0%", "100%", "0%"]
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative flex items-center justify-center scale-95 pointer-events-none">
        <motion.div 
          className="absolute w-44 h-44 rounded-full border border-dashed border-emerald-500/10 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />

        <motion.div 
          className="absolute w-36 h-36 rounded-full border border-dotted border-emerald-400/20 pointer-events-none"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        <div className="absolute w-32 h-32 rounded-full border border-emerald-500/5 pointer-events-none" />

        <AnimatePresence>
          {shieldActive && (
            <motion.div 
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1.15, opacity: 0.15 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute w-32 h-32 rounded-full bg-emerald-400/25 blur-md pointer-events-none shadow-[inset_0_0_20px_rgba(52,211,153,0.3)]"
              transition={{ duration: 0.35 }}
            />
          )}
        </AnimatePresence>

        <motion.div 
          className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 shadow-2xl z-20 transition-all duration-300 pointer-events-none ${
            shieldActive 
              ? "bg-[#09151e]/90 border-emerald-500/60 text-emerald-400 shadow-emerald-500/20" 
              : "bg-[#181111]/90 border-amber-500/40 text-amber-400 shadow-amber-500/10"
          }`}
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            animate={shieldActive ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {shieldActive ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
            )}
          </motion.div>
          <span className={`text-[7px] font-mono mt-1 ${shieldActive ? "text-emerald-400/80" : "text-amber-400/80"}`}>
            {shieldActive ? "GUARDED" : "OFF"}
          </span>
        </motion.div>
      </div>

      <div className="absolute top-6 left-6 font-mono text-[8px] bg-[#040912]/80 border border-border/20 p-1.5 rounded backdrop-blur-md flex items-center gap-1.5 pointer-events-none">
        <span className={`w-1.5 h-1.5 rounded-full ${shieldActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
        <span>SHIELD_CAPTURE: {shieldActive ? "ACTIVE" : "INACTIVE"}</span>
      </div>

      <div className="absolute bottom-28 left-6 font-mono text-[8px] text-emerald-500/40 pointer-events-none">
        sec_guard.py [sys.log]
      </div>
      
      <div className="absolute bottom-28 right-6 font-mono text-[8px] text-emerald-500/40 pointer-events-none">
        clearance_level: user.root
      </div>

      <div className="absolute top-6 right-6 font-mono text-[8px] text-muted-foreground/40 pointer-events-none">
        CLICK TO ENGAGE GUARD
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
    description: "Connecting React user interfaces to Python backends. Click to send custom packets.",
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

  const VisualComponent = CHAPTER_VISUALS[currentIndex].component;

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
                  <VisualComponent />
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
