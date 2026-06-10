import { Switch, Route, useLocation, useSearch, Redirect } from 'wouter';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useEffect, lazy, Suspense } from "react";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";

import { Layout } from "./components/layout";
import { AuthProvider } from "./lib/auth-context";

// Lazy loaded page components
const Home = lazy(() => import("./pages/home"));
const TechLogs = lazy(() => import("./pages/tech-logs"));
const GeneralLogs = lazy(() => import("./pages/general-logs"));
const BlogPost = lazy(() => import("./pages/blog-post"));
const SignInPage = lazy(() => import("./pages/sign-in"));
const SignUpPage = lazy(() => import("./pages/sign-up"));
const WritePage = lazy(() => import("./pages/write"));
const DoubtsListPage = lazy(() => import("./pages/doubts-list"));
const AskDoubtPage = lazy(() => import("./pages/ask-doubt"));
const DoubtDetailPage = lazy(() => import("./pages/doubt-detail"));
const ProfilePage = lazy(() => import("./pages/profile"));
const SettingsPage = lazy(() => import("./pages/settings"));
const AboutPage = lazy(() => import("./pages/about"));
const NotFound = lazy(() => import("@/pages/not-found"));
const ConnectPage = lazy(() => import("./pages/connect"));

function BlogRedirect() {
  const search = useSearch();
  return <Redirect to={`/tech${search}`} replace />;
}

function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <Spinner className="size-8 text-primary" />
      <p className="text-sm text-muted-foreground animate-pulse font-mono">Loading page...</p>
    </div>
  );
}


function AppRoutes() {
  const [location] = useLocation();

  useEffect(() => {
    let title = "Coded Chapter";
    if (location === "/") {
      title = "Coded Chapter | Log of a Beginner Coder";
    } else if (location === "/tech") {
      title = "Coded Chapter | Tech Dev Logs";
    } else if (location === "/general") {
      title = "Coded Chapter | General Write-Ups";
    } else if (location.startsWith("/blog/")) {
      title = "Coded Chapter | Read Post";
    } else if (location === "/write") {
      title = "Coded Chapter | Write a Log";
    } else if (location.startsWith("/write/")) {
      title = "Coded Chapter | Edit Log";
    } else if (location === "/doubts") {
      title = "Coded Chapter | Coding Doubts";
    } else if (location === "/doubts/ask") {
      title = "Coded Chapter | Ask a Doubt";
    } else if (location.startsWith("/doubts/")) {
      title = "Coded Chapter | Doubt Discussion";
    } else if (location === "/about") {
      title = "Coded Chapter | About Me";
    } else if (location.startsWith("/u/")) {
      const username = location.split("/")[2] || "";
      title = `Coded Chapter | ${username ? `@${username}'s Profile` : "Profile"}`;
    } else if (location === "/settings") {
      title = "Coded Chapter | Settings";
    } else if (location.startsWith("/sign-in")) {
      title = "Coded Chapter | Sign In";
    } else if (location.startsWith("/sign-up")) {
      title = "Coded Chapter | Create Account";
    } else if (location === "/connect") {
      title = "Coded Chapter | Connect with Me";
    }
    document.title = title;
  }, [location]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/tech" component={TechLogs} />
        <Route path="/general" component={GeneralLogs} />
        <Route path="/blog" component={BlogRedirect} />
        <Route path="/blog/:id" component={BlogPost} />
        <Route path="/write" component={WritePage} />
        <Route path="/write/:id" component={WritePage} />
        <Route path="/doubts" component={DoubtsListPage} />
        <Route path="/doubts/ask" component={AskDoubtPage} />
        <Route path="/doubts/:id" component={DoubtDetailPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/u/:username" component={ProfilePage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/connect" component={ConnectPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Layout>
            <AppRoutes />
          </Layout>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
