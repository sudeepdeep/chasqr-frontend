import { useQuery } from "@tanstack/react-query";
import {
  getStatsAPI,
  getAllUsersAPI,
  getAllSitesAdminAPI,
  getAdminSupportRequestsAPI,
  getAdminExpertsAPI,
  getAdminPaymentsAPI,
} from "../api/admin.api";

export type AdminTab =
  | "stats"
  | "users"
  | "sites"
  | "support"
  | "experts"
  | "payments";

export const adminKeys = {
  all: ["admin"] as const,
  tab: (tab: AdminTab) => [...adminKeys.all, tab] as const,
};

/**
 * One fetcher per admin tab, keyed by tab name.
 *
 * The panel previously reloaded on every click of the tab strip, so flicking
 * between Users and Sites to compare something hammered the API and showed a
 * spinner each time. Keyed separately, each tab is fetched once and revisits
 * are served from cache — while a tab nobody opens is never fetched at all.
 */
async function fetchTab(tab: AdminTab): Promise<unknown> {
  switch (tab) {
    case "stats":
      return (await getStatsAPI()).data.data;
    case "users":
      return (await getAllUsersAPI()).data.data.users;
    case "sites":
      return (await getAllSitesAdminAPI()).data.data.sites;
    case "support":
      return (await getAdminSupportRequestsAPI()).data.data.requests;
    case "experts":
      return (await getAdminExpertsAPI()).data.data.experts;
    case "payments":
    default:
      return (await getAdminPaymentsAPI()).data.data.payments;
  }
}

export function useAdminTab(tab: AdminTab) {
  return useQuery({
    queryKey: adminKeys.tab(tab),
    queryFn: () => fetchTab(tab),
    // Admin lists move under you — a new signup or payment lands without this
    // screen knowing. Shorter than the app default so the panel stays honest
    // without refetching on every click.
    staleTime: 30_000,
  });
}
