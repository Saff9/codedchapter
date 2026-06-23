import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, User, Settings, PenLine, HelpCircle, BookOpen, Menu, X, LogIn, UserPlus, Globe } from "lucide-react";
import { isAdminEmail } from "@/lib/admin";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [location] = useLocation();
  const active = location === href || (href !== "/" && location.startsWith(href));
  return (
    <Link href={href}>
      <span
        className={`relative text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer px-3 py-1.5 rounded-lg border inline-flex items-center gap-1.5 ${
          active 
            ? "text-white bg-white/[0.04] border-white/[0.06] shadow-sm" 
            : "text-zinc-400 border-transparent hover:text-zinc-250 hover:bg-white/[0.02]"
        }`}
      >
        {children}
      </span>
    </Link>
  );
}

export function Navbar() {
  const { user, signOut } = useAuth();
  const isAdmin = isAdminEmail(user?.email);
  const [isOpen, setIsOpen] = useState(false);
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)
    : user?.email?.[0] || "";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto px-6 lg:px-8 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
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

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1.5">
          <NavLink href="/tech">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            Tech Logs
          </NavLink>
          <NavLink href="/general">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            General Logs
          </NavLink>
          <NavLink href="/doubts">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            Doubts
          </NavLink>
          <NavLink href="/about">
            <User className="w-3.5 h-3.5 text-amber-500" />
            About
          </NavLink>
          <NavLink href="/connect">
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            Connect
          </NavLink>
        </nav>

        {/* Auth Actions */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              {/* Write button */}
              {isAdmin && (
                <Link href="/write" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.02] hover:border-amber-500/40 transition-colors bg-zinc-950/40 cursor-pointer">
                  <PenLine className="w-3.5 h-3.5 text-amber-500" />
                  Write
                </Link>
              )}

              {/* User menu dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.12] bg-zinc-950/40 text-sm transition-colors cursor-pointer focus:outline-none">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center uppercase border border-amber-500/30">
                      {initials || <User className="w-3 h-3" />}
                    </span>
                    <span className="text-xs font-semibold max-w-20 truncate text-zinc-200 hidden sm:inline">
                      {user.user_metadata?.username || user.email.split("@")[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-zinc-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 border-white/[0.08] bg-zinc-950/95 backdrop-blur-md">
                  <DropdownMenuLabel className="text-xs py-2 px-3">
                    <div className="font-semibold text-white">{user.user_metadata?.full_name || "Coder"}</div>
                    <div className="text-zinc-500 font-normal truncate">
                      {user.email}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/[0.06]" />
                  <Link href={`/u/${user.user_metadata?.username || user.email.split("@")[0]}`}>
                    <DropdownMenuItem className="text-xs cursor-pointer text-zinc-300 hover:text-white hover:bg-white/[0.04]">
                      <User className="w-3.5 h-3.5 mr-2 text-amber-500" /> My Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem className="text-xs cursor-pointer text-zinc-300 hover:text-white hover:bg-white/[0.04]">
                      <Settings className="w-3.5 h-3.5 mr-2 text-amber-500" /> Edit Profile
                    </DropdownMenuItem>
                  </Link>
                  {isAdmin && (
                    <Link href="/write">
                      <DropdownMenuItem className="text-xs cursor-pointer text-zinc-300 hover:text-white hover:bg-white/[0.04]">
                        <PenLine className="w-3.5 h-3.5 mr-2 text-amber-500" /> Write a Post
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator className="bg-white/[0.06]" />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-xs cursor-pointer text-zinc-400 hover:text-red-400 hover:bg-red-500/10 focus:text-red-400"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <span className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer hidden sm:inline px-3 py-1.5">
                  Sign in
                </span>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="h-8 px-4 text-xs font-bold rounded-lg bg-white text-black hover:bg-zinc-100 transition-colors shadow-sm active:scale-[0.98]">
                  Sign up
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Hamburger menu */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] focus:outline-none md:hidden transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 top-14 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div id="mobile-menu" className="md:hidden border-t border-white/[0.06] bg-zinc-950/95 backdrop-blur-sm px-6 py-5 space-y-4 absolute top-14 left-0 right-0 z-50 shadow-2xl">
            <nav className="flex flex-col gap-3.5">
              <Link href="/" onClick={() => setIsOpen(false)}>
                <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white cursor-pointer py-1">
                  <span className="text-amber-500 font-mono text-sm font-bold">&gt;_</span> Home
                </span>
              </Link>
              <Link href="/tech" onClick={() => setIsOpen(false)}>
                <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white cursor-pointer py-1">
                  <BookOpen className="w-4 h-4 text-amber-500" /> Tech Logs
                </span>
              </Link>
              <Link href="/general" onClick={() => setIsOpen(false)}>
                <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white cursor-pointer py-1">
                  <BookOpen className="w-4 h-4 text-amber-500" /> General Logs
                </span>
              </Link>
              <Link href="/doubts" onClick={() => setIsOpen(false)}>
                <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white cursor-pointer py-1">
                  <HelpCircle className="w-4 h-4 text-amber-500" /> Doubts
                </span>
              </Link>
              <Link href="/about" onClick={() => setIsOpen(false)}>
                <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white cursor-pointer py-1">
                  <User className="w-4 h-4 text-amber-500" /> About
                </span>
              </Link>
              <Link href="/connect" onClick={() => setIsOpen(false)}>
                <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white cursor-pointer py-1">
                  <Globe className="w-4 h-4 text-amber-500" /> Connect
                </span>
              </Link>
              {user ? (
                <>
                  {isAdmin && (
                    <Link href="/write" onClick={() => setIsOpen(false)}>
                      <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white cursor-pointer py-1 border-t border-white/[0.06] pt-3 mt-1">
                        <PenLine className="w-4 h-4 text-amber-500" /> Write a Post
                      </span>
                    </Link>
                  )}
                  <Link href={`/u/${user.user_metadata?.username || user.email.split("@")[0]}`} onClick={() => setIsOpen(false)}>
                    <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white cursor-pointer py-1">
                      <User className="w-4 h-4 text-amber-500" /> My Profile
                    </span>
                  </Link>
                  <Link href="/settings" onClick={() => setIsOpen(false)}>
                    <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white cursor-pointer py-1">
                      <Settings className="w-4 h-4 text-amber-500" /> Settings
                    </span>
                  </Link>
                  <button
                    onClick={() => { signOut(); setIsOpen(false); }}
                    className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-red-400 cursor-pointer py-2 text-left w-full border-t border-white/[0.06] pt-3 mt-1"
                  >
                    <LogOut className="w-4 h-4 text-zinc-500" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                    <span className="flex items-center gap-2 text-sm font-semibold text-zinc-350 hover:text-white cursor-pointer py-1 border-t border-white/[0.06] pt-3 mt-1">
                      <LogIn className="w-4 h-4 text-amber-500" /> Sign In
                    </span>
                  </Link>
                  <Link href="/sign-up" onClick={() => setIsOpen(false)}>
                    <span className="flex items-center gap-2 text-sm font-semibold text-zinc-350 hover:text-white cursor-pointer py-1">
                      <UserPlus className="w-4 h-4 text-amber-500" /> Create Account
                    </span>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
