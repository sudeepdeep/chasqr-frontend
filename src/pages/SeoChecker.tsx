import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Search, Globe, Wand2, ArrowRight, ListChecks, FileSearch, BadgeCheck } from "lucide-react";
import { checkPublicUrlAPI } from "../api/seo.api";
import SeoReport, { SeoReportData } from "../components/SeoReport";
import { AuthStore } from "../store/auth";

function isChasqrHosted(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith("chasqr.com");
  } catch {
    return false;
  }
}

const HOW_IT_WORKS = [
  { n: "01", title: "Paste your URL", desc: "Drop in any public website link — yours, a client's, or a competitor's." },
  { n: "02", title: "We analyze the page", desc: "Titles, meta tags, headings, content, links, social tags, and technical signals — 20+ checks in seconds." },
  { n: "03", title: "Get a plain-English report", desc: "A 0-100 score plus exactly what to fix and why it matters, no SEO jargon required." },
];

const WHAT_WE_CHECK = [
  { icon: <FileSearch size={18} />, title: "Meta Data", desc: "Title tags, meta descriptions, canonical URLs, and search engine indexing rules." },
  { icon: <ListChecks size={18} />, title: "Page Structure", desc: "H1/heading hierarchy, mobile viewport, image alt text, and language declaration." },
  { icon: <BadgeCheck size={18} />, title: "Content, Links & Social", desc: "Content depth, internal/external links, Open Graph and Twitter card tags." },
];

const FAQS = [
  { q: "Is this SEO checker actually free?", a: "Yes — the checker itself is completely free, with no signup required, for anyone checking any public website." },
  { q: "Do I need a Chasqr account to use it?", a: "No. Paste a URL and get your report instantly. You only need an account if you want to host your own site on Chasqr." },
  { q: "How is the SEO score calculated?", a: "We run 20+ checks across meta data, page structure, content quality, links, social tags, and technical signals, then combine them into a single weighted score." },
  { q: "Can I check any website, or only sites hosted on Chasqr?", a: "Any public website. For sites hosted on Chasqr, we also offer a deeper check that reads your files directly, plus one-click automatic fixes for common issues." },
];

export default function SeoChecker() {
  const { user } = AuthStore.useState();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ report: SeoReportData; checkedUrl: string } | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await checkPublicUrlAPI(url.trim());
      setResult({ report: res.data.data.report, checkedUrl: res.data.data.checkedUrl });
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not check that URL — try again");
    } finally {
      setLoading(false);
    }
  };

  const showCta = result && !isChasqrHosted(result.checkedUrl);

  return (
    <div className="min-h-screen bg-white pt-24 pb-20 px-6">
      <Helmet>
        <title>Free SEO Checker — Instantly Analyze Any Website's SEO Score | Chasqr</title>
        <meta
          name="description"
          content="Free SEO checker — paste any URL and get an instant SEO score with plain-English fixes for meta tags, headings, content, links, and technical issues. No signup required."
        />
        <link rel="canonical" href="https://www.chasqr.com/seo-checker" />
        <meta property="og:title" content="Free SEO Checker — Instantly Analyze Any Website's SEO Score" />
        <meta property="og:description" content="Paste any URL and get an instant SEO score with plain-English fixes. No signup required." />
        <meta property="og:url" content="https://www.chasqr.com/seo-checker" />
      </Helmet>

      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-bebas text-6xl text-slate-900 mb-3">Free SEO Checker</h1>
          <p className="text-slate-500 max-w-xl mx-auto">
            Paste any website URL and get a plain-English report — what's working,
            what's not, and why it matters for search rankings.
          </p>
        </motion.div>

        <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm shrink-0"
          >
            {loading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
            ) : (
              <Search size={16} />
            )}
            {loading ? "Checking..." : "Check SEO"}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-4 mb-8">
            {error}
          </div>
        )}

        {!result && !error && !loading && (
          <p className="text-center text-xs text-slate-400">
            We check up to 10 pages per 15 minutes to keep this free for everyone.
          </p>
        )}
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`max-w-6xl mx-auto mt-8 grid grid-cols-1 gap-6 ${showCta ? "lg:grid-cols-3" : ""}`}
        >
          <div className={showCta ? "lg:col-span-2" : ""}>
            <SeoReport report={result.report} checkedUrl={result.checkedUrl} />
          </div>

          {showCta && (
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 relative overflow-hidden bg-slate-900 rounded-2xl p-6">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary/30 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                    <Wand2 size={22} className="text-primary-light" />
                  </div>
                  <h3 className="font-bebas text-2xl text-white mb-2">
                    Fix these issues in one click
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-5">
                    Host your site on Chasqr — free forever for the basics — and hit{" "}
                    <strong className="text-slate-300">Fix Issues Automatically</strong>.
                    It sets your title, meta description, canonical, social preview
                    tags, and image alt text, then redeploys — instantly.
                  </p>
                  <Link
                    to={user ? "/upload" : "/register"}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
                  >
                    Deploy Free <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Evergreen content — helps real users understand the tool and gives
          search engines something substantive to index on this page. */}
      <div className="max-w-4xl mx-auto mt-20 space-y-16">
        <div>
          <h2 className="font-bebas text-3xl text-slate-900 text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.n} className="relative bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <span className="font-bebas text-4xl text-primary/20 absolute top-3 right-4">{s.n}</span>
                <h3 className="font-bebas text-xl text-slate-900 mb-1.5">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-bebas text-3xl text-slate-900 text-center mb-8">What We Check</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {WHAT_WE_CHECK.map((c) => (
              <div key={c.title} className="bg-white rounded-2xl p-5 border border-slate-200">
                <div className="w-9 h-9 bg-primary-light text-primary rounded-lg flex items-center justify-center mb-3">
                  {c.icon}
                </div>
                <h3 className="font-bebas text-xl text-slate-900 mb-1.5">{c.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-bebas text-3xl text-slate-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <div key={f.q} className="border border-slate-200 rounded-xl p-5">
                <h3 className="font-semibold text-slate-900 text-sm mb-1.5">{f.q}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
