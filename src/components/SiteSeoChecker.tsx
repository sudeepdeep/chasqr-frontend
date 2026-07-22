import { useState } from "react";
import { toast } from "react-toastify";
import { Search, Wand2, Check } from "lucide-react";
import { checkOwnSiteSEOAPI } from "../api/seo.api";
import { seoAutofixAPI } from "../api/site.api";
import SeoReport, { SeoReportData } from "./SeoReport";

interface Page {
  filename: string;
  title: string;
}

interface Props {
  siteId: string;
  pages: Page[];
  onSiteUpdated?: (site: any) => void;
}

export default function SiteSeoChecker({ siteId, pages, onSiteUpdated }: Props) {
  const [selectedPage, setSelectedPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<{ report: SeoReportData; checkedUrl: string } | null>(null);
  const [appliedFixes, setAppliedFixes] = useState<string[] | null>(null);

  const currentPage = pages[selectedPage];

  const runCheck = async (silent = false) => {
    if (!currentPage) return;
    if (!silent) { setLoading(true); setResult(null); }
    try {
      const res = await checkOwnSiteSEOAPI(siteId, currentPage.filename);
      setResult({ report: res.data.data.report, checkedUrl: res.data.data.checkedUrl });
    } catch (err: any) {
      if (!silent) toast.error(err.response?.data?.message || "Failed to run SEO check");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleFix = async () => {
    if (!currentPage) return;
    setFixing(true);
    setAppliedFixes(null);
    try {
      const res = await seoAutofixAPI(siteId, currentPage.filename);
      const fixes: string[] = res.data.data.fixes || [];
      setAppliedFixes(fixes);
      onSiteUpdated?.(res.data.data.site);
      if (fixes.length === 0) {
        toast.info("Nothing to auto-fix — this page already covers the basics.");
      } else {
        toast.success(`Applied ${fixes.length} fix${fixes.length === 1 ? "" : "es"} & redeployed`);
        await runCheck(true); // refresh the score to reflect the fixes
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to apply fixes");
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bebas text-2xl text-slate-900 mb-1">SEO Checker</h2>
        <p className="text-xs text-slate-500">
          Run a full SEO audit on this site — then fix the common issues in one click.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {pages.length > 1 && (
          <select
            value={selectedPage}
            onChange={(e) => { setSelectedPage(Number(e.target.value)); setResult(null); setAppliedFixes(null); }}
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            {pages.map((p, i) => (
              <option key={p.filename} value={i}>{p.title || p.filename}</option>
            ))}
          </select>
        )}
        <button
          onClick={() => runCheck()}
          disabled={loading || fixing}
          className="flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
          ) : (
            <Search size={15} />
          )}
          {loading ? "Checking..." : "Run SEO Check"}
        </button>

        {result && (
          <button
            onClick={handleFix}
            disabled={fixing || loading}
            className="flex items-center justify-center gap-2 border border-primary text-primary font-semibold px-6 py-3 rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 text-sm"
          >
            {fixing ? (
              <span className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full inline-block" />
            ) : (
              <Wand2 size={15} />
            )}
            {fixing ? "Fixing..." : "Fix Issues Automatically"}
          </button>
        )}
      </div>

      {/* What the auto-fix changed */}
      {appliedFixes && appliedFixes.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-1.5">
            <Check size={15} /> Applied {appliedFixes.length} fix{appliedFixes.length === 1 ? "" : "es"} and redeployed
          </p>
          <ul className="space-y-1">
            {appliedFixes.map((f, i) => (
              <li key={i} className="text-sm text-green-700 flex items-start gap-1.5">
                <Check size={13} className="mt-0.5 shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <>
          <p className="text-xs text-slate-400">
            Auto-fix handles the mechanical basics (title, meta description, canonical, viewport,
            language, social tags, image alt). Content depth, links, and speed are up to you.
          </p>
          <SeoReport report={result.report} checkedUrl={result.checkedUrl} />
        </>
      )}
    </div>
  );
}
