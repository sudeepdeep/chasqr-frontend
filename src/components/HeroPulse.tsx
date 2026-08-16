import {
  BarChart3,
  FolderGit2,
  Globe,
  Mail,
  Paintbrush,
  Rocket,
  Search,
} from "lucide-react";

/**
 * Feature nodes, placed by hand rather than on a perfect circle — a scattered
 * constellation reads as a network, where an even ring reads as a carousel.
 * x/y are percentages of the (square) container.
 */
const NODES = [
  { icon: Rocket, label: "Deploy", x: 16, y: 18, tint: "text-blue-600" },
  { icon: FolderGit2, label: "GitHub", x: 79, y: 13, tint: "text-slate-800" },
  { icon: Paintbrush, label: "Builder", x: 92, y: 47, tint: "text-violet-600" },
  { icon: Globe, label: "Domains", x: 74, y: 83, tint: "text-emerald-600" },
  { icon: Search, label: "SEO", x: 30, y: 90, tint: "text-amber-600" },
  { icon: BarChart3, label: "Analytics", x: 7, y: 55, tint: "text-sky-600" },
  { icon: Mail, label: "Forms", x: 47, y: 4, tint: "text-rose-600" },
];

/**
 * Hero graphic, variant B — "everything wired into one place".
 *
 * Feature cards float around the Chasqr mark with energy visibly running down
 * the connectors into it, and haloes pulsing back out. Same idea as the orbit
 * variant (our capabilities around the brand) but static in position and
 * kinetic in the lines, so it reads as a system rather than a rotation.
 */
export default function HeroPulse() {
  return (
    <div
      aria-hidden="true"
      className="relative w-[19rem] h-[19rem] sm:w-[23rem] sm:h-[23rem] lg:w-[27rem] lg:h-[27rem] shrink-0"
    >
      {/* Connectors. The square viewBox means SVG units == percentages, so the
          endpoints below can reuse the same numbers as the cards. */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full overflow-visible"
        fill="none"
      >
        {NODES.map((n, i) => (
          <g key={n.label}>
            {/* Static hairline so the structure is visible between pulses */}
            <path
              d={`M ${n.x} ${n.y} L 50 50`}
              stroke="rgb(148 163 184 / 0.30)"
              strokeWidth="0.35"
            />
            {/* Travelling pulse, staggered so they don't fire in lockstep */}
            <path
              d={`M ${n.x} ${n.y} L 50 50`}
              stroke="rgb(var(--primary) / 0.85)"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeDasharray="2 12"
              className="animate-dash-flow"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          </g>
        ))}
      </svg>

      {/* Feature cards */}
      {NODES.map((n, i) => {
        const Icon = n.icon;
        return (
          <div
            key={n.label}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            <div
              className="animate-float-soft"
              style={{ animationDelay: `${i * 0.55}s` }}
            >
              <div className="flex items-center gap-1.5 bg-white/85 backdrop-blur-sm rounded-xl pl-1.5 pr-2.5 py-1.5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5">
                <span
                  className={`w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center ${n.tint}`}
                >
                  <Icon size={15} strokeWidth={2.2} />
                </span>
                <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                  {n.label}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Centre mark, with haloes pushing outward */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {[0, 1.1, 2.2].map((d) => (
            <span
              key={d}
              className="animate-halo absolute inset-0 rounded-3xl border-2 border-primary/40"
              style={{ animationDelay: `${d}s` }}
            />
          ))}
          <span className="absolute inset-0 rounded-3xl bg-primary/30 blur-2xl scale-150" />
          <span className="relative flex w-[4.5rem] h-[4.5rem] sm:w-24 sm:h-24 rounded-3xl bg-white shadow-xl shadow-primary/25 ring-1 ring-slate-900/5 items-center justify-center">
            <img
              src={`${process.env.PUBLIC_URL || ""}/logo.svg`}
              alt=""
              className="w-10 h-10 sm:w-14 sm:h-14"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
