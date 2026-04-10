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
import { ChevronDown, LogOut, User } from "lucide-react";

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
      <div className="container mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/">
          <span className="flex items-center gap-1.5 cursor-pointer group">
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
        <nav className="hidden sm:flex items-center gap-6">
          <NavLink href="/blog">Blog</NavLink>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
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

          <Show when="signed-in">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-border/60 hover:border-border bg-card text-sm transition-colors">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center uppercase">
                    {initials || <User className="w-3 h-3" />}
                  </span>
                  <span className="text-xs font-medium max-w-24 truncate text-foreground">
                    {user?.firstName || user?.primaryEmailAddress?.emailAddress?.split("@")[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs">
                  <div className="font-medium">{user?.fullName}</div>
                  <div className="text-muted-foreground font-normal truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-xs cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Show>
        </div>
      </div>
    </header>
  );
}
