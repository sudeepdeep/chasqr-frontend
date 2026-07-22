import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, Link2 } from "lucide-react";

export type CheckSeverity = "pass" | "warning" | "error";

export interface SeoCheck {
  id: string;
  severity: CheckSeverity;
  title: string;
  message: string;
}

export interface SeoCategory {
  key: string;
  label: string;
  weight: number;
  score: number;
  checks: SeoCheck[];
}

export interface SeoReportData {
  score: number;
  categories: SeoCategory[];
  analyzedAt: string;
}

const scoreColor = (score: number) =>
  score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = scoreColor(score);

  return (
    <svg viewBox="0 0 140 140" className="w-32 h-32 shrink-0 drop-shadow-sm">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="11" />
      <circle
        cx="70" cy="70" r={radius}
        fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="70" y="66" textAnchor="middle" className="font-bebas" fontSize="34" fill="#0f172a">{score}%</text>
      <text x="70" y="86" textAnchor="middle" fontSize="11" fill="#64748b">SEO score</text>
    </svg>
  );
}

const severityIcon: Record<CheckSeverity, JSX.Element> = {
  pass: <CheckCircle2 size={16} className="text-green-500 shrink-0" />,
  warning: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
  error: <XCircle size={16} className="text-red-500 shrink-0" />,
};

// Translucent, tinted "glass" surfaces per severity.
const severityGlass: Record<CheckSeverity, string> = {
  error: "bg-red-50/70 border-red-200/70",
  warning: "bg-amber-50/70 border-amber-200/70",
  pass: "bg-white/55 border-white/70",
};

const severityRank: Record<CheckSeverity, number> = { error: 0, warning: 1, pass: 2 };

export default function SeoReport({ report, checkedUrl }: { report: SeoReportData; checkedUrl?: string }) {
  const allChecks = report.categories.flatMap((c) => c.checks);
  const issues = allChecks
    .filter((c) => c.severity !== "pass")
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  const passes = allChecks.filter((c) => c.severity === "pass");

  const errorCount = issues.filter((c) => c.severity === "error").length;
  const warningCount = issues.filter((c) => c.severity === "warning").length;

  const [showPasses, setShowPasses] = useState(false);

  return (
    <div className="relative">
      {/* Ambient gradient so the frosted-glass cards have something to blur */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[2rem]">
        <div className="absolute -top-16 -left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-8 right-0 w-72 h-72 bg-sky-300/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-200/25 rounded-full blur-3xl" />
      </div>

      <div className="relative space-y-6">
        {/* Score + category breakdown */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-lg shadow-slate-200/40 p-6 flex flex-col sm:flex-row items-center gap-7">
          <ScoreRing score={report.score} />
          <div className="flex-1 w-full min-w-0">
            {checkedUrl && (
              <p className="text-xs text-slate-400 truncate mb-3 flex items-center gap-1.5">
                <Link2 size={12} className="shrink-0" /> {checkedUrl}
              </p>
            )}
            <div className="grid grid-cols-2 gap-x-5 gap-y-3">
              {report.categories.map((cat) => (
                <div key={cat.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">{cat.label}</span>
                    <span className="text-slate-400 font-mono">{cat.score}%</span>
                  </div>
                  <div className="h-2 bg-slate-200/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.score}%`, backgroundColor: scoreColor(cat.score) }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs">
              {errorCount > 0 && (
                <span className="flex items-center gap-1.5 text-red-600 font-semibold">
                  <XCircle size={13} /> {errorCount} issue{errorCount === 1 ? "" : "s"}
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                  <AlertTriangle size={13} /> {warningCount} warning{warningCount === 1 ? "" : "s"}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-green-600 font-semibold">
                <CheckCircle2 size={13} /> {passes.length} passing
              </span>
            </div>
          </div>
        </div>

        {/* Needs attention — the actionable items, up top */}
        {issues.length > 0 && (
          <div>
            <h3 className="font-bebas text-xl text-slate-900 mb-3 flex items-center gap-2">
              Needs attention
              <span className="text-xs font-sans font-medium text-slate-400">
                {issues.length} item{issues.length === 1 ? "" : "s"}
              </span>
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {issues.map((check) => (
                <div
                  key={check.id}
                  className={`rounded-2xl backdrop-blur-md border p-4 shadow-sm ${severityGlass[check.severity]}`}
                >
                  <div className="flex items-start gap-2.5">
                    {severityIcon[check.severity]}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{check.title}</p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{check.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Passing checks — collapsed by default so the report stays short */}
        {passes.length > 0 && (
          <div>
            <button
              onClick={() => setShowPasses((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <CheckCircle2 size={15} className="text-green-500" />
              {passes.length} check{passes.length === 1 ? "" : "s"} passing
              <ChevronDown size={15} className={`text-slate-400 transition-transform ${showPasses ? "rotate-180" : ""}`} />
            </button>
            {showPasses && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                {passes.map((check) => (
                  <div
                    key={check.id}
                    className="rounded-xl bg-white/55 backdrop-blur-md border border-white/70 p-3"
                    title={check.message}
                  >
                    <p className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-green-500 shrink-0" /> {check.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
