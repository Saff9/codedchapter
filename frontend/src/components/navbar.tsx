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
        className={`relative text-sm font-medium transition-colors cursor-pointer px-1 py-0.5 ${
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {children}
        {active && (
          <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-primary rounded-full" />
        )}
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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-sm">
      <div className="container mx-auto px-6 lg:px-8 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/">
          <span className="flex items-center gap-1.5 cursor-pointer group shrink-0">
            <span className="text-primary font-mono text-sm font-bold group-hover:opacity-80 transition-opacity">&gt;_</span>
            <span
              className="text-sm font-bold tracking-tight"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Coded <span className="text-primary italic">Chapter</span>
            </span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="/tech">
            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />Tech Logs</span>
          </NavLink>
          <NavLink href="/general">
            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />General Logs</span>
          </NavLink>
          <NavLink href="/doubts">
            <span className="flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" />Doubts</span>
          </NavLink>
          <NavLink href="/about">
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />About</span>
          </NavLink>
          <NavLink href="/connect">
            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Connect</span>
          </NavLink>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              {/* Write button */}
              {isAdmin && (
                <Link href="/write" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors bg-card cursor-pointer">
                  <PenLine className="w-3.5 h-3.5" />
                  Write
                </Link>
              )}

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-border/60 hover:border-border bg-card text-sm transition-colors">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/40 to-amber-500/40 text-primary text-[10px] font-bold flex items-center justify-center uppercase">
                      {initials || <User className="w-3 h-3" />}
                    </span>
                    <span className="text-xs font-medium max-w-20 truncate text-foreground hidden sm:inline">
                      {user.user_metadata?.username || user.email.split("@")[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs">
                    <div className="font-medium">{user.user_metadata?.full_name || "Coder"}</div>
                    <div className="text-muted-foreground font-normal truncate">
                      {user.email}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href={`/u/${user.user_metadata?.username || user.email.split("@")[0]}`}>
                    <DropdownMenuItem className="text-xs cursor-pointer">
                      <User className="w-3.5 h-3.5 mr-2" /> My Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem className="text-xs cursor-pointer">
                      <Settings className="w-3.5 h-3.5 mr-2" /> Edit Profile
                    </DropdownMenuItem>
                  </Link>
                  {isAdmin && (
                    <Link href="/write">
                      <DropdownMenuItem className="text-xs cursor-pointer">
                        <PenLine className="w-3.5 h-3.5 mr-2" /> Write a Post
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-xs cursor-pointer text-muted-foreground"
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
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer hidden sm:inline">
                  Sign in
                </span>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="h-8 px-4 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  Sign up
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Hamburger menu toggle button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:outline-none md:hidden"
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
          {/* Backdrop layer - clicking anywhere closes the menu drawer */}
          <div
            className="fixed inset-0 top-14 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div id="mobile-menu" className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-sm px-6 py-4 space-y-3 absolute top-14 left-0 right-0 z-50">
            <nav className="flex flex-col gap-3">
              <Link href="/" onClick={() => setIsOpen(false)}>
                <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer py-1">
                  <span className="text-primary font-mono text-sm font-bold">&gt;_</span> Home
                </span>
              </Link>
              <Link href="/tech" onClick={() => setIsOpen(false)}>
                <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer py-1">
                  <BookOpen className="w-4 h-4 text-primary" /> Tech Logs
                </span>
              </Link>
              <Link href="/general" onClick={() => setIsOpen(false)}>
                <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer py-1">
                  <BookOpen className="w-4 h-4 text-primary" /> General Logs
                </span>
              </Link>
              <Link href="/doubts" onClick={() => setIsOpen(false)}>
                <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer py-1">
                  <HelpCircle className="w-4 h-4 text-primary" /> Doubts
                </span>
              </Link>
              <Link href="/about" onClick={() => setIsOpen(false)}>
                <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer py-1">
                  <User className="w-4 h-4 text-primary" /> About
                </span>
              </Link>
              <Link href="/connect" onClick={() => setIsOpen(false)}>
                <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer py-1">
                  <Globe className="w-4 h-4 text-primary" /> Connect
                </span>
              </Link>
              {user ? (
                <>
                  {isAdmin && (
                    <Link href="/write" onClick={() => setIsOpen(false)}>
                      <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer py-1 border-t border-border/20 pt-2.5">
                        <PenLine className="w-4 h-4 text-primary" /> Write a Post
                      </span>
                    </Link>
                  )}
                  <Link href={`/u/${user.user_metadata?.username || user.email.split("@")[0]}`} onClick={() => setIsOpen(false)}>
                    <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer py-1">
                      <User className="w-4 h-4 text-primary" /> My Profile
                    </span>
                  </Link>
                  <Link href="/settings" onClick={() => setIsOpen(false)}>
                    <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer py-1">
                      <Settings className="w-4 h-4 text-primary" /> Settings
                    </span>
                  </Link>
                  <button
                    onClick={() => { signOut(); setIsOpen(false); }}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-destructive cursor-pointer py-1 text-left w-full border-t border-border/20 pt-2.5"
                  >
                    <LogOut className="w-4 h-4 text-muted-foreground" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                    <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer py-1 border-t border-border/20 pt-2.5">
                      <LogIn className="w-4 h-4 text-primary" /> Sign In
                    </span>
                  </Link>
                  <Link href="/sign-up" onClick={() => setIsOpen(false)}>
                    <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer py-1">
                      <UserPlus className="w-4 h-4 text-primary" /> Create Account
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
