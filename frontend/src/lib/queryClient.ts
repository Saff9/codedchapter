import { QueryClient } from "@tanstack/react-query";

// Aggressive caching — Substack RSS data doesn't change more than once every few minutes,
// so we keep it fresh in memory for 3 minutes and in the cache for 15 minutes.
// This means navigating back to any page that already loaded feels instant.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 3 * 60_000,      // data is considered fresh for 3 minutes
      gcTime: 15 * 60_000,        // cache entries live for 15 minutes after last use
      refetchOnWindowFocus: false, // no surprise refetch when user tabs back in
    },
  },
});
