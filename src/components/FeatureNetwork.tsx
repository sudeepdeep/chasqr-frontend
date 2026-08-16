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
 * x/y are percentages of the (square) container, and because the SVG uses a
 * 0–100 viewBox the connectors can reuse the very same numbers.
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
 * "Everything wired into one place" — the HeroPulse look, on the dark banner.
 *
 * A sibling of HeroPulse rather than a variant of it, because the two differ
 * where it matters: HeroPulse sits on the light hero at `/`, so its connectors
 * are a pale slate hairline with a blue pulse, both of which sink into a dark
 * navy background. The cards and centre mark are deliberately identical.
 */
export default function FeatureNetwork() {
  return (
    <div
      aria-hidden="true"
      className="relative h-[22rem] w-[22rem] shrink-0 lg:h-[27rem] lg:w-[27rem]"
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full overflow-visible"
        fill="none"
      >
        <defs>
          <filter id="beam-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.1" />
          </filter>
        </defs>

        {NODES.map((n, i) => {
          const d = `M ${n.x} ${n.y} L 50 50`;
          // Staggered so the currents arrive one after another instead of
          // firing in lockstep, which reads as a pulse rather than a strobe.
          const delay = `${i * 0.34}s`;
          return (
            <g key={n.label}>
              {/* Hairline, so the structure stays legible between currents */}
              <path d={d} stroke="rgb(255 255 255 / 0.16)" strokeWidth="0.3" />

              {/* Soft halo around the travelling segment */}
              <path
                d={d}
                pathLength="100"
                stroke="rgb(255 255 255 / 0.5)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeDasharray="14 100"
                filter="url(#beam-glow)"
                className="animate-beam-flow"
                style={{ animationDelay: delay }}
              />
              {/* The bright core of the current */}
              <path
                d={d}
                pathLength="100"
                stroke="rgb(255 255 255 / 0.95)"
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeDasharray="14 100"
                className="animate-beam-flow"
                style={{ animationDelay: delay }}
              />
            </g>
          );
        })}
      </svg>

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
              <div className="flex items-center gap-1.5 rounded-xl bg-white/90 py-1.5 pl-1.5 pr-2.5 shadow-lg shadow-slate-950/20 ring-1 ring-slate-900/5">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 ${n.tint}`}
                >
                  <Icon size={15} strokeWidth={2.2} />
                </span>
                <span className="whitespace-nowrap text-[11px] font-semibold text-slate-600">
                  {n.label}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Centre mark — where every current lands */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {[0, 1.1, 2.2].map((delay) => (
            <span
              key={delay}
              className="animate-halo absolute inset-0 rounded-3xl border-2 border-white/40"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
          <span className="absolute inset-0 scale-150 rounded-3xl bg-white/20 blur-2xl" />
          <span className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl bg-white shadow-xl shadow-slate-950/30 ring-1 ring-slate-900/5 lg:h-24 lg:w-24">
            <img
              src={`${process.env.PUBLIC_URL || ""}/logo.svg`}
              alt=""
              className="h-10 w-10 lg:h-14 lg:w-14"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
