import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { api } from "../lib/api";
import { useQuery } from "@tanstack/react-query";
import { PostCard } from "@/components/post-card";
import { ArrowRight, BookOpen, Flame, Star, Zap, Terminal } from "lucide-react";

const tagColors = ["tag-amber", "tag-violet", "tag-emerald", "tag-blue", "tag-rose", "tag-cyan"];

const CODE_TEXT = `const me = {
  name: "Owais",
  learning: ["CS50x", "Linux", "PostgreSQL"],
  doing: CS50P,
};
// Every chapter gets me closer
while (me.learning.length > 0) {
  me.write("a new chapter");
  me.progress++;
}`;

function highlightCodeLine(line: string) {
  return line
    .replace(/(const|while)\b/g, '<span class="text-violet-400 font-semibold">$1</span>')
    .replace(/\b(me|CS50P)\b/g, '<span class="text-sky-300">$1</span>')
    .replace(/\b(name|learning|doing|progress)\b/g, '<span class="text-amber-400">$1</span>')
    .replace(/("Owais"|"CS50x"|"Linux"|"PostgreSQL"|"a new chapter")/g, '<span class="text-emerald-400">$1</span>')
    .replace(/(length|write|progress\+\+)/g, '<span class="text-rose-400">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="text-zinc-500 italic">$1</span>');
}

interface Spark {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  length: number;
}

function CodeBreathingConsole() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Spark[]>([]);
  
  const [typedCode, setTypedCode] = useState("");
  const [showConsole, setShowConsole] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [typingComplete, setTypingComplete] = useState(false);
  const [runCount, setRunCount] = useState(0);

  // Motion values for tracking cursor and 3D parallax tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Elegant rotation values (smooth glass tilt)
  const rotateX = useTransform(y, [-200, 200], [8, -8]);
  const rotateY = useTransform(x, [-200, 200], [-8, 8]);

  const springConfig = { damping: 30, stiffness: 90, mass: 1 };
  const animatedRotateX = useSpring(rotateX, springConfig);
  const animatedRotateY = useSpring(rotateY, springConfig);

  const glareX = useTransform(x, [-200, 200], ["0%", "100%"]);
  const glareY = useTransform(y, [-200, 200], ["0%", "100%"]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const clientX = event.clientX - rect.left - width / 2;
    const clientY = event.clientY - rect.top - height / 2;

    x.set(clientX);
    y.set(clientY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Emitter helpers
  const spawnSpark = (xVal: number, yVal: number, isExplosion = false) => {
    const colors = ["#fbbf24", "#f97316", "#a78bfa", "#818cf8", "#ffffff"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 1.5 + 1; // particle thickness
    
    // Fast initial velocity for sparks
    const angle = isExplosion 
      ? (Math.random() * Math.PI * 2) 
      : (Math.random() * Math.PI * 0.4 - Math.PI * 0.7); // mostly upward/leftwards for typed text
    const speed = isExplosion ? (Math.random() * 7 + 2) : (Math.random() * 3 + 1.5);
    
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - (isExplosion ? 1.5 : 0.5);
    
    particlesRef.current.push({
      id: Math.random(),
      x: xVal,
      y: yVal,
      vx,
      vy,
      color,
      size,
      alpha: 1,
      life: 0,
      maxLife: isExplosion ? (Math.random() * 35 + 35) : (Math.random() * 15 + 15),
      length: Math.random() * 5 + 3,
    });
  };

  const spawnBurst = (count: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    
    for (let i = 0; i < count; i++) {
      spawnSpark(w / 2 + (Math.random() * 120 - 60), h - 60, true);
    }
  };

  // Trigger typing simulation
  useEffect(() => {
    setTypedCode("");
    setShowConsole(false);
    setConsoleLogs([]);
    setTypingComplete(false);
    
    let index = 0;
    
    const interval = setInterval(() => {
      setTypedCode((prev) => {
        const nextVal = prev + CODE_TEXT[index];
        
        // Dynamic cursor coordinate calculation for sparks
        const currentTypedLines = nextVal.split("\n");
        const currentLineText = currentTypedLines[currentTypedLines.length - 1] || "";
        const charWidth = 8.1; // char width in pixels (approx)
        const paddingLeft = 56; // 40px sidebar + padding
        const paddingTop = 24; // p-6 is 24px
        const lineHeight = 24; // leading-6 is 24px
        
        const cursorX = paddingLeft + currentLineText.length * charWidth;
        const cursorY = paddingTop + (currentTypedLines.length - 1) * lineHeight + 12;

        if (Math.random() > 0.55) {
          spawnSpark(cursorX, cursorY, false);
        }
        return nextVal;
      });
      
      index++;
      if (index >= CODE_TEXT.length) {
        clearInterval(interval);
        setTypingComplete(true);
        setTimeout(() => setShowConsole(true), 500);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [runCount]);

  // Trigger console logs simulation
  useEffect(() => {
    if (!showConsole) return;
    
    let logIndex = 1;
    const logInterval = setInterval(() => {
      if (logIndex <= 4) {
        setConsoleLogs((prev) => [...prev, `[${logIndex}/5] write("a new chapter") - progress: ${logIndex * 20}%`]);
        spawnBurst(12);
        logIndex++;
      } else if (logIndex === 5) {
        setConsoleLogs((prev) => [...prev, `🚀 Coded Chapter loaded successfully!`]);
        spawnBurst(30); // Massive celebration explosion
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 700);

    return () => clearInterval(logInterval);
  }, [showConsole]);

  // Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Render and update sparks
      const list = particlesRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16; // gravity
        p.vx *= 0.97; // friction
        p.vy *= 0.97; // friction
        p.alpha = 1 - (p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = "round";
        
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
        ctx.stroke();
        ctx.restore();

        if (p.life >= p.maxLife || p.y > height + 20 || p.x < -20 || p.x > width + 20) {
          list.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const totalLines = CODE_TEXT.split("\n");
  const typedLines = typedCode.split("\n");

  return (
    <div 
      className="relative w-full select-none cursor-pointer group"
      style={{ perspective: "1200px" }}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => setRunCount((c) => c + 1)}
    >
      {/* 3D Console screen */}
      <motion.div
        style={{
          rotateX: animatedRotateX,
          rotateY: animatedRotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative bg-zinc-950/75 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[460px] transition-all duration-300 hover:border-indigo-500/40 shadow-indigo-500/5"
      >
        {/* Glow ambient background color sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl scale-95 opacity-80 pointer-events-none" />

        {/* Premium Glare Sweep Reflection */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-15 transition-opacity duration-500 z-15 rounded-2xl"
          style={{
            background: useTransform([glareX, glareY], ([gx, gy]) => {
              return `radial-gradient(circle 280px at ${gx} ${gy}, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 60%, transparent 100%)`;
            })
          }}
        />

        {/* Tab Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-900/60 z-20" style={{ transform: "translateZ(20px)" }}>
          {/* macOS titledots with symbols on hover */}
          <div className="flex items-center gap-2 group/dots">
            <div className="relative w-3 h-3 rounded-full bg-rose-500/80 border border-rose-600/50 flex items-center justify-center cursor-pointer">
              <svg className="w-1.5 h-1.5 text-rose-950 opacity-0 group-hover/dots:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="relative w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/50 flex items-center justify-center cursor-pointer">
              <svg className="w-1.5 h-1.5 text-amber-950 opacity-0 group-hover/dots:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
              </svg>
            </div>
            <div className="relative w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/50 flex items-center justify-center cursor-pointer">
              <svg className="w-1.5 h-1.5 text-emerald-950 opacity-0 group-hover/dots:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          
          {/* VS Code style Breadcrumbs */}
          <div className="text-xs font-mono text-zinc-400 flex items-center gap-1.5 select-none font-medium">
            <span className="text-zinc-600 font-sans hover:text-zinc-400 transition-colors">CodedChapter</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-600 font-sans hover:text-zinc-400 transition-colors">src</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-600 font-sans hover:text-zinc-400 transition-colors">pages</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded bg-indigo-400/80 inline-block" />
              journey.ts
            </span>
          </div>

          <span className="text-[9px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase tracking-wide">
            TS-NODE
          </span>
        </div>

        {/* Editor Screen with Line Numbers */}
        <div className="relative flex-1 flex flex-col justify-between py-6 z-10" style={{ transformStyle: "preserve-3d" }}>
          
          {/* Main Code area with Line-by-Line renders */}
          <div style={{ transform: "translateZ(10px)" }} className="space-y-[2px]">
            {totalLines.map((_, i) => {
              const isCurrentLine = i === typedLines.length - 1 && !typingComplete;
              const hasText = i < typedLines.length;
              return (
                <div 
                  key={i} 
                  className={`flex items-start px-6 transition-colors duration-150 relative ${
                    isCurrentLine ? "bg-white/[0.02]" : ""
                  }`}
                >
                  {/* Subtle active line indicator */}
                  {isCurrentLine && (
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-indigo-500/80" />
                  )}
                  {/* Line Number sidebar column */}
                  <div className={`w-8 select-none text-right pr-4 font-mono text-xs ${
                    isCurrentLine ? "text-zinc-200 font-bold" : "text-zinc-600"
                  }`}>
                    {i + 1}
                  </div>
                  {/* Code Line Content */}
                  <div className="flex-1 font-mono text-sm leading-6 whitespace-pre text-zinc-100">
                    <span dangerouslySetInnerHTML={{ __html: highlightCodeLine(typedLines[i] || "") }} />
                    {isCurrentLine && (
                      <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-0.5 animate-blink" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Canvas overlay for particle effects */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" />

          {/* Console / Terminal output section */}
          <div style={{ transform: "translateZ(15px)" }} className="mt-6 px-6">
            <AnimatePresence>
              {showConsole && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="border border-white/[0.08] bg-zinc-950/95 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl"
                >
                  {/* Terminal Tabs */}
                  <div className="flex items-center justify-between border-b border-white/[0.06] bg-zinc-900/40 px-4 py-2 select-none">
                    <div className="flex gap-4 font-mono text-[10px] text-zinc-500">
                      <span className="text-zinc-200 border-b border-indigo-400/80 pb-2 -mb-2 font-medium">TERMINAL</span>
                      <span>OUTPUT</span>
                      <span>PROBLEMS (0)</span>
                      <span>DEBUG CONSOLE</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-600">sh</span>
                  </div>

                  {/* Terminal output lines */}
                  <div className="p-4 font-mono text-xs leading-6 text-zinc-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <span className="text-indigo-400">$</span> ts-node src/pages/home/journey.ts
                    </div>
                    <div className="space-y-1 select-text">
                      {consoleLogs.map((log, i) => (
                        <div key={i} className={log.startsWith("🚀") ? "text-emerald-400 font-semibold" : "text-zinc-300"}>
                          {log}
                        </div>
                      ))}
                      {consoleLogs.length < 5 && (
                        <span className="inline-block w-1.5 h-3.5 bg-zinc-400 ml-0.5 animate-blink" />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Play/Reset trigger instruction */}
        <div className="absolute right-4 bottom-4 px-2.5 py-1 rounded-md border border-white/5 bg-zinc-900/90 text-zinc-500 text-[10px] font-mono select-none pointer-events-none z-30 transition-opacity duration-300 group-hover:opacity-100 opacity-0">
          Click console window to run
        </div>
      </motion.div>
    </div>
  );
}

export default function Home() {
  const { data: featuredPosts, isLoading } = useQuery({
    queryKey: ["/api/posts/featured"],
    queryFn: () => api.getFeaturedPosts(),
  });
  const { data: tags } = useQuery({
    queryKey: ["/api/posts/tags"],
    queryFn: () => api.getAllTags(),
  });

  return (
    <div className="flex flex-col w-full min-h-screen relative overflow-hidden">
      {/* ── PREMIUM MESH & GRID BACKDROP ─────────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Sleek linear grid layout */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] opacity-70" />
        
        {/* Soft, professional gradient glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[130px] -translate-y-1/2" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[150px]" />
      </div>

      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <section className="relative pt-20 pb-20 md:pt-24 md:pb-32 z-10">
        <div className="container mx-auto px-6 lg:px-8">
          
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            {/* Left Column – Headline & Actions */}
            <div className="lg:col-span-5 space-y-8 flex flex-col items-start text-left">
              {/* Premium Pill Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-300 text-xs font-medium font-mono backdrop-blur-md shadow-inner shadow-white/5"
              >
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-35"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500/50"></span>
                </span>
                <span className="text-zinc-500">LOG STATE:</span>
                <span className="text-amber-400 font-bold tracking-wide">CHAPTER 1 // ACTIVE</span>
              </motion.div>

              {/* Redesigned Typography */}
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.08 }}
                  className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight text-white"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  One coder.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 font-bold">
                    Every mistake.
                  </span>
                  <br />
                  Written down.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="text-zinc-400 text-base md:text-lg leading-relaxed max-w-lg font-normal"
                >
                  Coded Chapter is my daily log as I learn to code. One concept at a time, in plain English, with all the confusion left in.
                </motion.p>
              </div>

              {/* Vercel-style interactive button block */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.22 }}
                className="flex items-center gap-6 pt-2"
              >
                <Link href="/tech">
                  <span className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-100 transition-all duration-200 cursor-pointer shadow-lg shadow-white/5 active:scale-[0.98]">
                    Start Reading
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
                <Link href="/general">
                  <span className="group inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer py-2">
                    View General Logs
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>

              {/* Stats Card Grid */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid grid-cols-3 gap-4 pt-8 border-t border-zinc-800/80 w-full max-w-lg"
              >
                {[
                  { value: "CS50x",   title: "Current Course",   desc: "Harvard Intro to CS" },
                  { value: "Linux",   title: "OS & CLI",          desc: "Active daily practice" },
                  { value: "Postgres",title: "Database",          desc: "Learning SQL & schemas" },
                ].map(({ value, title, desc }) => (
                  <div key={title} className="flex flex-col p-4 rounded-xl border border-white/[0.03] bg-white/[0.01] backdrop-blur-sm shadow-sm">
                    <span className="text-xl font-bold font-display text-white">{value}</span>
                    <span className="text-[11px] font-semibold text-zinc-300 mt-1">{title}</span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">{desc}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right Column – Premium Parallax Editor */}
            <div className="hidden lg:block lg:col-span-7">
              <CodeBreathingConsole />
            </div>
          </div>
        </div>
      </section>

      {/* ── LATEST CHAPTERS ──────────────────────────────────────── */}
      <section className="py-20 border-t border-zinc-800/50 bg-black/10 relative z-10">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold font-mono mb-1 tracking-wider uppercase">
                <Zap className="w-3.5 h-3.5" /> Latest Chapters
              </div>
              <h2 className="text-3xl font-bold text-white font-display" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                What I've been learning
              </h2>
            </div>
            <Link href="/tech">
              <span className="inline-flex items-center gap-1.5 text-sm text-amber-500 hover:text-amber-400 transition-colors cursor-pointer font-semibold group">
                All posts <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-zinc-900/40 rounded-2xl border border-zinc-800/60 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts?.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ABOUT + TAGS ─────────────────────────────────────────── */}
      <section className="py-20 border-t border-zinc-800/50 bg-black/25 relative z-10">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-16 items-start">

            {/* About text panel */}
            <div className="lg:col-span-3 space-y-6">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-500 font-mono">About Coded Chapter</div>
              <h2 className="text-4xl font-bold leading-[1.1] text-white font-display" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Learning to code,<br />one honest post at a time.
              </h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed font-normal text-base">
                <p>
                  I started Coded Chapter because I am learning to code and most tutorials assume you already know things I do not. So I write down every concept, every bug, every failed attempt, and every moment of clarity as it happens.
                </p>
                <p>
                  Right now I'm working through <strong className="text-zinc-200">CS50x</strong>, picking up <strong className="text-zinc-200">Linux</strong> and the command line, and learning <strong className="text-zinc-200">PostgreSQL</strong>. Alongside that, Python (CS50P) is done.
                </p>
                <p>
                  If you're also learning, this should feel like notes from a classmate going through it side-by-side with you.
                </p>
              </div>
              <Link href="/tech">
                <span className="mt-4 inline-flex items-center gap-2 text-sm text-amber-500 font-semibold hover:gap-3 transition-all cursor-pointer group">
                  Read the full journey <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>

            {/* Tags / Topics & CTA Panel */}
            <div className="lg:col-span-2 space-y-10">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono mb-4">Topics Explored</div>
                <div className="flex flex-wrap gap-2.5">
                  {tags?.map((tag, i) => (
                    <Link key={tag} href={`/tech?tag=${tag}`}>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all ${tagColors[i % tagColors.length]}`}>
                        #{tag}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Call-to-action Card */}
              <div className="p-6 rounded-2xl border border-white/[0.05] bg-zinc-900/20 backdrop-blur-md shadow-lg">
                <div className="text-lg font-semibold text-white mb-1 font-display" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Got something to say?</div>
                <div className="text-sm text-zinc-400 mb-4 font-normal">Sign up to leave comments and join the conversation.</div>
                <Link href="/sign-up">
                  <span className="block w-full py-2.5 text-center rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors cursor-pointer active:scale-[0.98]">
                    Create an account, it is free
                  </span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
