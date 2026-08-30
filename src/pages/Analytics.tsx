import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQueries } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  Eye,
  Globe,
  Layers,
  TrendingUp,
} from "lucide-react";
import { getAnalyticsAPI } from "../api/site.api";
import { siteKeys, useSites, SiteAnalytics, SiteSummary } from "../queries/sites";

interface Site {
  siteId: string;
  name: string;
  status: "active" | "inactive";
  plan: "free" | "paid";
  visits: number;
}

interface DayPoint {
  date: string;
  visits: number;
}

interface CountryPoint {
  code: string;
  name: string;
  visits: number;
}

const nf = new Intl.NumberFormat();

/**
 * Regional-indicator pairs render as a flag on every platform that ships them.
 * 'ZZ' is the backend's "couldn't place this visitor" code and has no flag.
 */
function flagOf(code: string): string {
  if (!/^[A-Z]{2}$/.test(code) || code === "ZZ") return "🌐";
  return String.fromCodePoint(
    ...code.split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

function Stat({
  icon: Icon,
  tint,
  label,
  value,
  hint,
}: {
  icon: typeof Eye;
  tint: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={tint} />
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className="font-bebas text-3xl text-slate-900">{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

/**
 * Account-wide analytics: every site the user owns, rolled into one view.
 *
 * There is no aggregate endpoint on the API — /analytics/:siteId is per site —
 * so this fans out one request per site and merges the results client-side.
 * Fine for a page the user opened deliberately; if accounts start carrying
 * dozens of sites this wants a single summary endpoint instead.
 */
export default function Analytics() {
  // Same cache entry the Dashboard fills, so arriving from there costs nothing.
  const { data: siteData, isPending: sitesPending, isError: failed } = useSites();
  const sites = (siteData ?? null) as Site[] | null;

  // One query per site instead of a hand-rolled Promise.allSettled. Each result
  // is cached under its own key, so a site's chart survives leaving this page —
  // and re-entering re-runs nothing while the data is still fresh.
  const analyticsQueries = useQueries({
    queries: (siteData ?? []).map((s: SiteSummary) => ({
      queryKey: siteKeys.analytics(s.siteId),
      queryFn: async (): Promise<SiteAnalytics> => {
        const res = await getAnalyticsAPI(s.siteId);
        return res.data.data;
      },
    })),
  });

  // A site whose analytics call failed simply contributes nothing, exactly as
  // allSettled did — one bad site must not blank the whole report.
  const ok = analyticsQueries
    .map((q) => q.data)
    .filter((d): d is SiteAnalytics => !!d);

  const loading = sitesPending;
  const last30 = ok.reduce((n, a) => n + (a.last30Days || 0), 0);

  // Date axis comes from the first series rather than a sort: these are display
  // strings, and sorting them as text would scramble the order.
  const trend: DayPoint[] =
    ok.length > 0 && ok[0].chartData?.length
      ? ok[0].chartData.map((point) => ({
          date: point.date,
          visits: ok.reduce(
            (sum, a) =>
              sum + (a.chartData?.find((d) => d.date === point.date)?.visits ?? 0),
            0,
          ),
        }))
      : [];

  const countries: CountryPoint[] = (() => {
    const tally = new Map<string, CountryPoint>();
    ok.forEach((a) =>
      (a.countries ?? []).forEach((c) => {
        const seen = tally.get(c.code);
        if (seen) seen.visits += c.visits;
        else tally.set(c.code, { ...c });
      }),
    );
    return Array.from(tally.values()).sort((a, b) => b.visits - a.visits);
  })();

  const totalVisits = sites?.reduce((n, s) => n + (s.visits || 0), 0) ?? 0;
  const live = sites?.filter((s) => s.status === "active").length ?? 0;
  const dailyAverage = last30 > 0 ? (last30 / 30).toFixed(1) : "0";
  const trendPeak = Math.max(...trend.map((d) => d.visits), 1);
  const ranked = [...(sites ?? [])]
    .sort((a, b) => (b.visits || 0) - (a.visits || 0))
    .slice(0, 8);
  const busiest = ranked[0]?.visits || 1;
  const countryTotal = countries.reduce((n, c) => n + c.visits, 0);

  return (
    <div className="min-h-screen bg-white pt-8 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="font-bebas text-4xl text-slate-900">Analytics</h1>
            <p className="text-slate-500 text-sm mt-1">
              Every site you own, rolled into one view.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg px-4 py-2 hover:border-primary hover:text-primary transition-colors"
          >
            <Layers size={15} />
            Manage sites
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-slate-200 bg-slate-50 animate-pulse"
              />
            ))}
          </div>
        ) : failed ? (
          <div className="border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-slate-600">Couldn't load your analytics.</p>
          </div>
        ) : sites!.length === 0 ? (
          <div className="border border-slate-200 rounded-xl p-12 text-center">
            <h2 className="font-bebas text-2xl text-slate-900 mb-2">
              Nothing to measure yet
            </h2>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              Deploy your first site and its visits will start showing up here.
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Deploy a site
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat
                icon={Eye}
                tint="text-primary"
                label="Total Visits"
                value={nf.format(totalVisits)}
                hint="All time, every site"
              />
              <Stat
                icon={TrendingUp}
                tint="text-orange-400"
                label="Last 30 Days"
                value={nf.format(last30)}
              />
              <Stat
                icon={BarChart3}
                tint="text-purple-400"
                label="Daily Average"
                value={dailyAverage}
              />
              <Stat
                icon={Layers}
                tint="text-emerald-500"
                label="Sites"
                value={nf.format(sites!.length)}
                hint={`${live} live`}
              />
            </div>

            {/* Visits over time */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-white border border-slate-200 rounded-xl p-6"
            >
              <h2 className="font-bebas text-lg text-slate-900 mb-5">
                Visitors (Last 30 Days)
              </h2>
              {trend.length === 0 ? (
                <p className="text-sm text-slate-400 py-10 text-center">
                  No visits recorded in the last 30 days.
                </p>
              ) : (
                <>
                  <div className="flex items-end justify-between gap-1 h-40">
                    {trend.map((d, i) => (
                      <div
                        key={`${d.date}-${i}`}
                        title={`${d.date}: ${nf.format(d.visits)} visits`}
                        style={{
                          height: `${Math.max((d.visits / trendPeak) * 100, 2)}%`,
                        }}
                        className={`flex-1 rounded-t-sm transition-colors ${
                          i === trend.length - 1
                            ? "bg-primary"
                            : "bg-primary/40 hover:bg-primary/60"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-5">
                    <span>{trend[0].date}</span>
                    <span>{trend[trend.length - 1].date}</span>
                  </div>
                </>
              )}
            </motion.div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Where visitors come from */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Globe size={15} className="text-primary" />
                  <h2 className="font-bebas text-lg text-slate-900">
                    Visitors By Country
                  </h2>
                </div>

                {countries.length === 0 ? (
                  <p className="text-sm text-slate-400 py-8 text-center leading-relaxed">
                    No country data yet.
                    <br />
                    Visits are attributed from the moment country tracking goes
                    live, so this fills in as new traffic arrives.
                  </p>
                ) : (
                  <ul className="space-y-3.5">
                    {countries.slice(0, 8).map((c) => {
                      const pct = (c.visits / countryTotal) * 100;
                      return (
                        <li key={c.code}>
                          <div className="flex items-baseline justify-between gap-3 mb-1.5">
                            <span className="flex items-center gap-2 text-sm text-slate-700 truncate">
                              <span aria-hidden className="text-base leading-none">
                                {flagOf(c.code)}
                              </span>
                              <span className="truncate">{c.name}</span>
                            </span>
                            <span className="text-sm text-slate-500 tabular-nums shrink-0">
                              {nf.format(c.visits)}
                              <span className="text-slate-400 ml-1.5">
                                {pct.toFixed(0)}%
                              </span>
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Busiest sites */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 size={15} className="text-primary" />
                  <h2 className="font-bebas text-lg text-slate-900">
                    Busiest Sites
                  </h2>
                </div>
                <ul className="space-y-3.5">
                  {ranked.map((s) => (
                    <li key={s.siteId}>
                      <div className="flex items-baseline justify-between gap-3 mb-1.5">
                        <span className="flex items-center gap-2 text-sm text-slate-700 truncate">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              s.status === "active"
                                ? "bg-emerald-500"
                                : "bg-slate-300"
                            }`}
                          />
                          <span className="truncate">{s.name}</span>
                        </span>
                        <span className="text-sm text-slate-500 tabular-nums shrink-0">
                          {nf.format(s.visits || 0)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{
                            width: `${Math.max(((s.visits || 0) / busiest) * 100, 2)}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
