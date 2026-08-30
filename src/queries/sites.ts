import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteSiteAPI,
  getAnalyticsAPI,
  getMySitesAPI,
  getSiteAPI,
  renameSiteAPI,
  toggleStatusAPI,
} from "../api/site.api";

export interface SiteSummary {
  siteId: string;
  slug?: string;
  name: string;
  status: "active" | "inactive";
  plan: "free" | "paid";
  visits: number;
  created_at: string;
  updated_at?: string;
  customDomain?: string;
  favicon?: string;
  pages?: { filename: string }[];
}

export interface DayPoint {
  date: string;
  visits: number;
}

export interface CountryPoint {
  code: string;
  name: string;
  visits: number;
}

export interface SiteAnalytics {
  total: number;
  last30Days: number;
  dailyAverage: number;
  chartData: DayPoint[];
  countries?: CountryPoint[];
}

/**
 * One place that names every cached thing, so a mutation can invalidate by
 * concept instead of guessing at string keys spread across pages. Keys are
 * hierarchical: invalidating `all` clears the list and every per-site entry.
 */
export const siteKeys = {
  all: ["sites"] as const,
  list: () => [...siteKeys.all, "list"] as const,
  detail: (siteId: string) => [...siteKeys.all, "detail", siteId] as const,
  analytics: (siteId: string) => [...siteKeys.all, "analytics", siteId] as const,
};

/**
 * The signed-in user's sites.
 *
 * Dashboard and Analytics both call this and share one cache entry, so opening
 * Analytics after the Dashboard costs no request at all.
 */
export function useSites() {
  return useQuery({
    queryKey: siteKeys.list(),
    queryFn: async (): Promise<SiteSummary[]> => {
      const res = await getMySitesAPI();
      return res.data.data.sites ?? [];
    },
  });
}

/**
 * A single site, with everything Site Admin needs.
 *
 * Cached per id, so bouncing between the dashboard and a site — the most
 * common loop in the app — stops refetching the same document every time.
 */
export function useSiteDetail(siteId?: string) {
  return useQuery({
    queryKey: siteKeys.detail(siteId ?? ""),
    enabled: !!siteId,
    queryFn: async () => {
      const res = await getSiteAPI(siteId as string);
      return res.data.data.site;
    },
  });
}

/** Per-site analytics, cached separately so one site's chart is reusable. */
export function useSiteAnalytics(siteId: string, enabled = true) {
  return useQuery({
    queryKey: siteKeys.analytics(siteId),
    enabled,
    queryFn: async (): Promise<SiteAnalytics> => {
      const res = await getAnalyticsAPI(siteId);
      return res.data.data;
    },
  });
}

/**
 * Mutations write the new value straight into the cache rather than
 * invalidating and refetching.
 *
 * The server has already told us the outcome, so a refetch would be a second
 * request that returns what we are holding — and the whole reason for this
 * layer is to take load off the API, not move it around. It also means the
 * dashboard updates with no loading flicker.
 */
export function useSiteMutations() {
  const qc = useQueryClient();

  const patchList = (siteId: string, fn: (s: SiteSummary) => SiteSummary) => {
    qc.setQueryData<SiteSummary[]>(siteKeys.list(), (prev: SiteSummary[] | undefined) =>
      prev ? prev.map((s: SiteSummary) => (s.siteId === siteId ? fn(s) : s)) : prev,
    );
  };

  const rename = useMutation({
    mutationFn: ({ siteId, name }: { siteId: string; name: string }) =>
      renameSiteAPI(siteId, name),
    onSuccess: (_res, { siteId, name }) => patchList(siteId, (s) => ({ ...s, name })),
  });

  const toggle = useMutation({
    mutationFn: (siteId: string) => toggleStatusAPI(siteId),
    onSuccess: (res, siteId) => {
      const updated = res.data?.data?.site;
      patchList(siteId, (s) => ({ ...s, ...(updated || {}) }));
    },
  });

  const remove = useMutation({
    mutationFn: (siteId: string) => deleteSiteAPI(siteId),
    onSuccess: (_res, siteId) => {
      qc.setQueryData<SiteSummary[]>(siteKeys.list(), (prev: SiteSummary[] | undefined) =>
        prev ? prev.filter((s: SiteSummary) => s.siteId !== siteId) : prev,
      );
      // The site is gone, so its cached analytics are dead weight.
      qc.removeQueries({ queryKey: siteKeys.analytics(siteId) });
    },
  });

  return { rename, toggle, remove };
}
