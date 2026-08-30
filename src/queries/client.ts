import { QueryClient } from "@tanstack/react-query";

/**
 * Shared cache for every page.
 *
 * The defaults are set for a small server rather than for freshness: a site
 * list does not change second to second, and the point of this cache is to
 * stop the API being hit again every time someone switches tab.
 *
 * Its own module rather than living in index.tsx because signing in and out
 * has to be able to empty it — see `clearAuth`.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Within 60s a cached result is served with no request at all. This is
      // what makes tab switching instant.
      staleTime: 60_000,
      // Keep unused data around for 5 minutes so navigating away and back
      // repaints from cache instead of refetching.
      gcTime: 5 * 60_000,
      // Refetch when the user comes back to the tab, but only if the data has
      // actually gone stale — so alt-tabbing does not fire a wave of requests.
      refetchOnWindowFocus: true,
      refetchOnMount: false,
      // A failed request is retried once. The default of three turns one
      // outage into three times the load.
      retry: 1,
    },
  },
});
