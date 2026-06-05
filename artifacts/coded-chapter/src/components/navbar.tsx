import { Link, useLocation } from "wouter";
import { Show, useClerk, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, User, Settings, PenLine, HelpCircle, BookOpen } from "lucide-react";

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
  const { signOut } = useClerk();
  const { user } = useUser();
  const initials = (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "");

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
          <NavLink href="/blog">
            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />Blog</span>
          </NavLink>
          <NavLink href="/doubts">
            <span className="flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" />Doubts</span>
          </NavLink>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2.5">
          <Show when="signed-in">
            {/* Write button */}
            <Link href="/write">
              <button className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors bg-card">
                <PenLine className="w-3.5 h-3.5" />
                Write
              </button>
            </Link>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-border/60 hover:border-border bg-card text-sm transition-colors">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/40 to-amber-500/40 text-primary text-[10px] font-bold flex items-center justify-center uppercase">
                    {initials || <User className="w-3 h-3" />}
                  </span>
                  <span className="text-xs font-medium max-w-20 truncate text-foreground hidden sm:inline">
                    {user?.firstName || user?.primaryEmailAddress?.emailAddress?.split("@")[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs">
                  <div className="font-medium">{user?.fullName || user?.firstName}</div>
                  <div className="text-muted-foreground font-normal truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/settings">
                  <DropdownMenuItem className="text-xs cursor-pointer">
                    <Settings className="w-3.5 h-3.5 mr-2" /> Edit Profile
                  </DropdownMenuItem>
                </Link>
                <Link href="/write">
                  <DropdownMenuItem className="text-xs cursor-pointer">
                    <PenLine className="w-3.5 h-3.5 mr-2" /> Write a Post
                  </DropdownMenuItem>
                </Link>
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
          </Show>

          <Show when="signed-out">
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
          </Show>
        </div>
      </div>
    </header>
  );
}
