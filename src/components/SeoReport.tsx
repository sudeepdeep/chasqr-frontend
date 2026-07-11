import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

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
    <svg viewBox="0 0 140 140" className="w-36 h-36">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="66" textAnchor="middle" className="font-bebas" fontSize="34" fill="#0f172a">
        {score}%
      </text>
      <text x="70" y="86" textAnchor="middle" fontSize="11" fill="#64748b">
        SEO score
      </text>
    </svg>
  );
}

const severityIcon: Record<CheckSeverity, JSX.Element> = {
  pass: <CheckCircle2 size={16} className="text-green-500 shrink-0" />,
  warning: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
  error: <XCircle size={16} className="text-red-500 shrink-0" />,
};

const severityBorder: Record<CheckSeverity, string> = {
  pass: "border-green-200 bg-green-50/50",
  warning: "border-amber-200 bg-amber-50/50",
  error: "border-red-200 bg-red-50/50",
};

const severityRank: Record<CheckSeverity, number> = { error: 0, warning: 1, pass: 2 };

export default function SeoReport({ report, checkedUrl }: { report: SeoReportData; checkedUrl?: string }) {
  const errorCount = report.categories.flatMap((c) => c.checks).filter((c) => c.severity === "error").length;
  const warningCount = report.categories.flatMap((c) => c.checks).filter((c) => c.severity === "warning").length;

  return (
    <div className="space-y-8">
      {/* Score + summary */}
      <div className="flex flex-col sm:flex-row items-center gap-8 bg-white border border-slate-200 rounded-2xl p-6">
        <ScoreRing score={report.score} />
        <div className="flex-1 w-full">
          {checkedUrl && (
            <p className="text-xs text-slate-400 truncate mb-3">{checkedUrl}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {report.categories.map((cat) => (
              <div key={cat.key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">{cat.label}</span>
                  <span className="text-slate-400">{cat.score}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${cat.score}%`, backgroundColor: scoreColor(cat.score) }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
            {errorCount > 0 && (
              <span className="flex items-center gap-1.5 text-red-600 font-medium">
                <XCircle size={13} /> {errorCount} issue{errorCount === 1 ? "" : "s"}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                <AlertTriangle size={13} /> {warningCount} warning{warningCount === 1 ? "" : "s"}
              </span>
            )}
            {errorCount === 0 && warningCount === 0 && (
              <span className="flex items-center gap-1.5 text-green-600 font-medium">
                <CheckCircle2 size={13} /> No issues found
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="space-y-6">
        {report.categories.map((cat) => (
          <div key={cat.key}>
            <h3 className="font-bebas text-xl text-slate-900 mb-3">{cat.label}</h3>
            <div className="space-y-2">
              {[...cat.checks]
                .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
                .map((check) => (
                  <div
                    key={check.id}
                    className={`flex items-start gap-3 border rounded-xl p-3 ${severityBorder[check.severity]}`}
                  >
                    {severityIcon[check.severity]}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{check.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{check.message}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
