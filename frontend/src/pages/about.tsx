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

// Chapter 1 Visual: The Spark (Organic Gravity Particles)
function SparkVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle class
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;

      constructor(x: number, y: number, isExplosion = false) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = isExplosion ? Math.random() * 5 + 2 : Math.random() * 1.2 + 0.3;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = Math.random() * 2.2 + 0.8;
        this.color = Math.random() > 0.55 ? "#f59e0b" : "#8b5cf6"; // amber or violet
      }

      update(mx: number | null, my: number | null) {
        if (mx !== null && my !== null) {
          // Attract to mouse
          const dx = mx - this.x;
          const dy = my - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const force = (180 - dist) / 1600;
            this.vx += (dx / dist) * force;
            this.vy += (dy / dist) * force;
          }
        }

        // Friction / Damping
        this.vx *= 0.985;
        this.vy *= 0.985;

        this.x += this.vx;
        this.y += this.vy;
        
        // Boundaries bounce
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 160; i++) {
      particles.push(new Particle(Math.random() * width, Math.random() * height));
    }

    let mouseX: number | null = null;
    let mouseY: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = null;
      mouseY = null;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Burst
      for (let i = 0; i < 35; i++) {
        particles.push(new Particle(x, y, true));
      }
      if (particles.length > 250) {
        particles.splice(0, particles.length - 250);
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("click", handleClick);

    const render = () => {
      ctx.fillStyle = "rgba(10, 5, 27, 0.15)"; // smooth trailing
      ctx.fillRect(0, 0, width, height);

      // Subtle network grids
      ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
      ctx.lineWidth = 1;
      const size = 30;
      for (let x = 0; x < width; x += size) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      particles.forEach((p) => {
        p.update(mouseX, mouseY);
        p.draw(ctx);
      });

      // Core background glow
      ctx.save();
      const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 90);
      grad.addColorStop(0, "rgba(245, 158, 11, 0.15)");
      grad.addColorStop(1, "rgba(139, 92, 246, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 110, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
        canvas.removeEventListener("click", handleClick);
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative bg-[#070314]">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-6 left-6 font-mono text-[9px] text-muted-foreground/60 select-none bg-[#0a051b]/80 border border-border/20 rounded px-2 py-1 backdrop-blur-md pointer-events-none">
        <span className="text-amber-500 mr-1 animate-pulse">●</span> GRAVITY_FIELD_SIMULATION
      </div>
      <div className="absolute bottom-6 right-6 font-mono text-[9px] text-primary/70 select-none bg-[#0a051b]/80 border border-primary/20 rounded px-2 py-1 backdrop-blur-md pointer-events-none">
        CLICK CANVAS TO BURST PARTICLES
      </div>
    </div>
  );
}

// Chapter 2 Visual: The Rabbit Hole (Organic Sine Wave Terrain / Fluid Ribbon)
function RabbitHoleVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    let t = 0;

    const render = () => {
      t += 0.015;
      ctx.fillStyle = "#060112";
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 1.5;
      const lines = 18;
      const points = 60;

      const mX = mousePos.x; 
      const mY = mousePos.y; 

      for (let j = 0; j < lines; j++) {
        ctx.beginPath();
        const percentJ = j / lines;
        
        ctx.strokeStyle = `rgba(${139 + percentJ * 100}, ${92 + percentJ * 50}, 246, ${0.1 + percentJ * 0.45})`;

        for (let i = 0; i <= points; i++) {
          const percentI = i / points;
          const x = percentI * width;
          
          const wave1 = Math.sin(percentI * Math.PI * 4 + t + percentJ * Math.PI) * 35;
          const wave2 = Math.cos(percentI * Math.PI * 2 - t * 1.5) * 15;
          const mouseEffect = Math.sin(percentI * Math.PI + mX * Math.PI) * (mY * 50);

          const yBase = height * 0.4 + percentJ * (height * 0.5);
          const y = yBase + (wave1 + wave2 + mouseEffect) * (0.2 + percentJ * 0.8);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [mousePos]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="w-full h-full relative overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-6 left-6 font-mono text-[9px] text-muted-foreground/60 select-none bg-[#0a051b]/80 border border-border/20 rounded px-2 py-1 backdrop-blur-md pointer-events-none">
        <span className="text-violet-500 mr-1 animate-pulse">●</span> WAVEFORM_HARMONICS
      </div>
      <div className="absolute bottom-6 right-6 font-mono text-[9px] text-primary/70 select-none bg-[#0a051b]/80 border border-primary/20 rounded px-2 py-1 backdrop-blur-md pointer-events-none">
        MOVE MOUSE TO DISTORT SPACE
      </div>
    </div>
  );
}

// Chapter 3 Visual: Full-Stack Connect (Fluid Particle Network)
function FullStackVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    class Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 1.0;
        this.vy = (Math.random() - 0.5) * 1.0;
        this.radius = Math.random() * 3 + 2;
        this.color = Math.random() > 0.5 ? "#f59e0b" : "#8b5cf6";
      }

      update(mx: number | null, my: number | null) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        if (mx !== null && my !== null) {
          const dx = mx - this.x;
          const dy = my - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const force = (100 - dist) / 1000;
            this.vx -= (dx / dist) * force;
            this.vy -= (dy / dist) * force;
          }
        }

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 2) {
          this.vx = (this.vx / speed) * 2;
          this.vy = (this.vy / speed) * 2;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
      }
    }

    const nodes: Node[] = [];
    for (let i = 0; i < 40; i++) {
      nodes.push(new Node());
    }

    let mouseX: number | null = null;
    let mouseY: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = null;
      mouseY = null;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const render = () => {
      ctx.fillStyle = "#050212";
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 0.8;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 90) {
            const alpha = (90 - dist) / 90;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.15})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((node) => {
        node.update(mouseX, mouseY);
        node.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-6 left-6 font-mono text-[9px] text-muted-foreground/60 select-none bg-[#0a051b]/80 border border-border/20 rounded px-2 py-1 backdrop-blur-md pointer-events-none">
        <span className="text-secondary mr-1 animate-pulse">●</span> NEURAL_MESH_DISTRIBUTION
      </div>
      <div className="absolute bottom-6 right-6 font-mono text-[9px] text-primary/70 select-none bg-[#0a051b]/80 border border-primary/20 rounded px-2 py-1 backdrop-blur-md pointer-events-none">
        MOVE MOUSE TO GENTLY REPEL NODES
      </div>
    </div>
  );
}

// Chapter 4 Visual: Security Shield (Biometric Liquid Blob)
function SecurityVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shieldActive, setShieldActive] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    let t = 0;

    const render = () => {
      t += shieldActive ? 0.02 : 0.08; 
      ctx.fillStyle = "#03080e";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(16, 185, 129, 0.02)";
      ctx.lineWidth = 1;
      const size = 20;
      for (let x = 0; x < width; x += size) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(width / 2, height / 2);

      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 120);
      if (shieldActive) {
        glow.addColorStop(0, "rgba(16, 185, 129, 0.15)");
        glow.addColorStop(1, "rgba(16, 185, 129, 0)");
      } else {
        glow.addColorStop(0, "rgba(245, 158, 11, 0.15)");
        glow.addColorStop(1, "rgba(245, 158, 11, 0)");
      }
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 130, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      const points = 72;
      const baseRadius = shieldActive ? 75 : 60;
      
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        
        let offset = 0;
        if (shieldActive) {
          offset = Math.sin(angle * 5 + t) * 8 + Math.cos(angle * 3 - t * 0.5) * 5;
        } else {
          offset = Math.sin(angle * 9 + t) * 15 + Math.cos(angle * 4 - t * 1.5) * 12;
        }
        
        const r = baseRadius + offset;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      
      if (shieldActive) {
        ctx.fillStyle = "rgba(16, 185, 129, 0.04)";
        ctx.strokeStyle = "rgba(52, 211, 153, 0.8)";
        ctx.shadowColor = "rgba(52, 211, 153, 0.5)";
      } else {
        ctx.fillStyle = "rgba(245, 158, 11, 0.04)";
        ctx.strokeStyle = "rgba(245, 158, 11, 0.8)";
        ctx.shadowColor = "rgba(245, 158, 11, 0.5)";
      }
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = shieldActive ? "rgba(52, 211, 153, 0.6)" : "rgba(245, 158, 11, 0.6)";
      for (let i = 0; i < 8; i++) {
        const orbitAngle = (i / 8) * Math.PI * 2 + t * 0.5;
        const orbitRadius = baseRadius * 0.4 + Math.sin(t + i) * 10;
        const ox = Math.cos(orbitAngle) * orbitRadius;
        const oy = Math.sin(orbitAngle) * orbitRadius;
        ctx.beginPath();
        ctx.arc(ox, oy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [shieldActive]);

  return (
    <div 
      onClick={() => setShieldActive(!shieldActive)}
      className="w-full h-full relative cursor-pointer"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      <div className="absolute top-6 left-6 font-mono text-[8px] bg-[#040912]/80 border border-border/20 p-1.5 rounded backdrop-blur-md flex items-center gap-1.5 pointer-events-none">
        <span className={`w-1.5 h-1.5 rounded-full ${shieldActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
        <span>CYBER_SHIELD: {shieldActive ? "STABLE" : "COMPROMISED"}</span>
      </div>

      <div className="absolute bottom-6 left-6 font-mono text-[8px] text-emerald-500/40 pointer-events-none">
        quantum_fluid.sys
      </div>

      <div className="absolute top-6 right-6 font-mono text-[8px] text-muted-foreground/40 pointer-events-none">
        CLICK CANVAS TO TOGGLE PROTECTION
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
