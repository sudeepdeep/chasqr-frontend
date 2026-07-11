import { useState } from "react";
import { toast } from "react-toastify";
import { Search } from "lucide-react";
import { checkOwnSiteSEOAPI } from "../api/seo.api";
import SeoReport, { SeoReportData } from "./SeoReport";

interface Page {
  filename: string;
  title: string;
}

interface Props {
  siteId: string;
  pages: Page[];
}

export default function SiteSeoChecker({ siteId, pages }: Props) {
  const [selectedPage, setSelectedPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ report: SeoReportData; checkedUrl: string } | null>(null);

  const currentPage = pages[selectedPage];

  const handleCheck = async () => {
    if (!currentPage) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await checkOwnSiteSEOAPI(siteId, currentPage.filename);
      setResult({ report: res.data.data.report, checkedUrl: res.data.data.checkedUrl });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to run SEO check");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bebas text-2xl text-slate-900 mb-1">SEO Checker</h2>
        <p className="text-xs text-slate-500">
          Run a full SEO audit on this site — free for every page, every time.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {pages.length > 1 && (
          <select
            value={selectedPage}
            onChange={(e) => { setSelectedPage(Number(e.target.value)); setResult(null); }}
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            {pages.map((p, i) => (
              <option key={p.filename} value={i}>{p.title || p.filename}</option>
            ))}
          </select>
        )}
        <button
          onClick={handleCheck}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
          ) : (
            <Search size={15} />
          )}
          {loading ? "Checking..." : "Run SEO Check"}
        </button>
      </div>

      {result && <SeoReport report={result.report} checkedUrl={result.checkedUrl} />}
    </div>
  );
}
