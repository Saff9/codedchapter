import { useEffect, useRef } from "react";
import { ClerkProvider, Show, useClerk } from '@clerk/react';
import { Switch, Route, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "./components/layout";
import Home from "./pages/home";
import BlogList from "./pages/blog-list";
import BlogPost from "./pages/blog-post";
import SignInPage from "./pages/sign-in";
import SignUpPage from "./pages/sign-up";
import WritePage from "./pages/write";
import DoubtsListPage from "./pages/doubts-list";
import AskDoubtPage from "./pages/ask-doubt";
import DoubtDetailPage from "./pages/doubt-detail";
import ProfilePage from "./pages/profile";
import SettingsPage from "./pages/settings";
import NotFound from "@/pages/not-found";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/blog" component={BlogList} />
              <Route path="/blog/:id" component={BlogPost} />
              <Route path="/write" component={WritePage} />
              <Route path="/write/:id" component={WritePage} />
              <Route path="/doubts" component={DoubtsListPage} />
              <Route path="/doubts/ask" component={AskDoubtPage} />
              <Route path="/doubts/:id" component={DoubtDetailPage} />
              <Route path="/u/:username" component={ProfilePage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
