import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { FaGithub, FaYoutube, FaTelegram, FaDiscord, FaJava } from "react-icons/fa6";
import { Mail, MapPin, Calendar, Code, Heart, Trophy, BookOpen, Terminal, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import { 
  SiJavascript, 
  SiReact, 
  SiTailwindcss, 
  SiPostgresql, 
  SiSupabase, 
  SiGit,
  SiSubstack,
  SiNodedotjs,
  SiPython,
  SiCplusplus
} from "react-icons/si";

interface SocialLink {
  name: string;
  url: string;
  icon: React.ReactNode;
  color: string;
}

const SOCIALS: SocialLink[] = [
  { name: "GitHub", url: "https://github.com/codedchapter", icon: <FaGithub className="w-4 h-4" />, color: "hover:text-primary hover:border-primary/40" },
  { name: "YouTube", url: "https://www.youtube.com/@CodedChapter", icon: <FaYoutube className="w-4 h-4 text-red-500" />, color: "hover:text-red-400 hover:border-red-400/40" },
  { name: "Telegram", url: "https://t.me/CodedChapter", icon: <FaTelegram className="w-4 h-4 text-[#26A5E4]" />, color: "hover:text-[#26A5E4] hover:border-[#26A5E4]/40" },
  { name: "Discord", url: "https://discord.gg/5zwAUuD4Ec", icon: <FaDiscord className="w-4 h-4 text-[#5865F2]" />, color: "hover:text-[#5865F2] hover:border-[#5865F2]/40" },
  { name: "Substack", url: "https://codedchapter.substack.com/", icon: <SiSubstack className="w-4 h-4 text-[#FF6719]" />, color: "hover:text-[#FF6719] hover:border-[#FF6719]/40" },
];

const SKILLS = [
  { name: "Python (CS50P)", level: "Active Learning", category: "Languages", icon: <SiPython className="w-4 h-4 text-[#3776AB]" /> },
  { name: "Git & Version Control", level: "Active Learning", category: "Tools", icon: <SiGit className="w-4 h-4 text-[#F05032]" /> },
  { name: "GitHub", level: "Active Learning", category: "Tools", icon: <FaGithub className="w-4 h-4" /> },
  { name: "JavaScript / TypeScript", level: "Upcoming", category: "Languages", icon: <SiJavascript className="w-4 h-4 text-[#F7DF1E]" /> },
  { name: "C++", level: "Upcoming", category: "Languages", icon: <SiCplusplus className="w-4 h-4 text-[#00599C]" /> },
  { name: "Java", level: "Upcoming", category: "Languages", icon: <FaJava className="w-4 h-4 text-[#ED8B00]" /> },
  { name: "React / Next.js", level: "Upcoming", category: "Frontend", icon: <SiReact className="w-4 h-4 text-[#61DAFB]" /> },
  { name: "Express / Node.js", level: "Upcoming", category: "Backend", icon: <SiNodedotjs className="w-4 h-4 text-[#339933]" /> },
  { name: "Tailwind CSS", level: "Upcoming", category: "Design", icon: <SiTailwindcss className="w-4 h-4 text-[#06B6D4]" /> },
  { name: "PostgreSQL / Supabase", level: "Upcoming", category: "Database", icon: <SiPostgresql className="w-4 h-4 text-[#4169E1]" /> },
];

const MILESTONES = [
  { date: "June 2026", title: "Coded Chapter Launched", desc: "First deployment of my self-taught dev log and community Q&A platform." },
  { date: "May 2026", title: "Entering full-stack backend development", desc: "Learned Node.js, Express middleware logic, and database schemas with Supabase." },
  { date: "April 2026", title: "Mastering modern React", desc: "Built multiple interactive apps using custom hooks, state management, and Tailwind CSS." },
  { date: "March 2026", title: "The First Hello World", desc: "Wrote my very first line of JavaScript code and fell down the programming rabbit hole." },
];

const PHOTOS = [
  { src: "/photo1.jpg", alt: "Owais by a mountain river" },
  { src: "/photo2.jpg", alt: "Owais selfie in snowy mountains" },
  { src: "/photo3.jpg", alt: "Owais looking up in the pine forest" },
  { src: "/photo4.jpg", alt: "Owais mirror selfie" },
  { src: "/photo5.jpg", alt: "Owais sitting on a log in the forest" },
  { src: "/photo6.jpg", alt: "Owais looking at hills and valley" }
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
    setCurrentIndex((prev) => (prev + 1) % PHOTOS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + PHOTOS.length) % PHOTOS.length);
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
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary blur-md rounded-full scale-105 opacity-30" />
            <img
              src="/avatar.png"
              alt="Developer Avatar"
              className="relative w-32 h-32 rounded-full object-cover border-2 border-primary/40 shadow-xl"
            />
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
                <motion.img
                  key={currentIndex}
                  src={PHOTOS[currentIndex].src}
                  alt={PHOTOS[currentIndex].alt}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover pointer-events-none"
                />
              </AnimatePresence>
              
              {/* Gradient Overlay for labels */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-6 pt-16 flex flex-col justify-end">
                <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded self-start mb-2">
                  IMAGE 0{currentIndex + 1} / 0{PHOTOS.length}
                </span>
                <p className="text-sm font-semibold text-white tracking-wide font-sans md:text-base">{PHOTOS[currentIndex].alt}</p>
              </div>
            </div>

            {/* Navigation buttons (Desktop) */}
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/60 border border-border text-white/85 hover:text-primary hover:bg-black/90 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/60 border border-border text-white/85 hover:text-primary hover:bg-black/90 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Mobile swipe indicator */}
            <div className="absolute top-4 right-4 text-[10px] font-mono bg-black/60 px-2.5 py-1 rounded-full text-white/60 md:hidden border border-white/10">
              ← Swipe to navigate →
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-2 pt-2">
            {PHOTOS.map((_, index) => (
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
              I started my programming journey with a simple question: <em>"How does this web application actually run?"</em> What began as curious exploration quickly evolved into a dedicated passion for building clean, user-focused web software.
            </p>
            <p>
              Currently, my focus is on learning Python, following the renowned <strong>CS50P (Introduction to Programming with Python)</strong> course from YouTube. Having completed school education, I am preparing to join college in a few months. As I transition into university, my upcoming focus will be mastering <strong>C++</strong>, <strong>Java</strong>, or other core programming languages based on my college curriculum.
            </p>
            <p>
              <strong>Coded Chapter</strong> was created to serve as my public log of this learning process. I believe that learning in public is one of the most effective ways to build deep comprehension, retain technical concepts, and connect with other developers worldwide.
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
                <p className="text-xs text-muted-foreground">J&K State Board of School Education (JKBOSE)</p>
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
                <p className="text-xs text-muted-foreground">J&K State Board of School Education (JKBOSE)</p>
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
                <p className="text-xs text-muted-foreground">J&K State Board of School Education (JKBOSE)</p>
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
            <Code className="w-4 h-4 text-primary" /> Current Stack
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SKILLS.map((skill) => (
              <div key={skill.name} className="p-3 bg-background/50 border border-border/60 rounded-xl space-y-1.5 hover:border-primary/20 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {skill.icon}
                    <span className="font-semibold text-foreground">{skill.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">{skill.level}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">{skill.category}</div>
              </div>
            ))}
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
