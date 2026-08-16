import {
  BarChart3,
  FolderGit2,
  Globe,
  Mail,
  Paintbrush,
  Rocket,
  Search,
} from "lucide-react";

/** What orbits the logo — one per thing Chasqr actually does. */
const FEATURES = [
  { icon: Rocket, label: "Deploy", tint: "text-blue-600 bg-blue-50" },
  { icon: FolderGit2, label: "GitHub", tint: "text-slate-800 bg-slate-100" },
  { icon: Paintbrush, label: "Builder", tint: "text-violet-600 bg-violet-50" },
  { icon: Globe, label: "Domains", tint: "text-emerald-600 bg-emerald-50" },
  { icon: Search, label: "SEO", tint: "text-amber-600 bg-amber-50" },
  { icon: BarChart3, label: "Analytics", tint: "text-sky-600 bg-sky-50" },
  { icon: Mail, label: "Forms", tint: "text-rose-600 bg-rose-50" },
];

/**
 * The hero's orbital graphic: the Chasqr mark at the centre with every feature
 * circling it.
 *
 * The ring rotates and each badge counter-rotates at exactly the same rate, so
 * the badges travel around the circle while staying upright. Both animations
 * are pure CSS transforms (no JS ticking, no GIF) so it stays smooth and costs
 * nothing to download — and it disappears entirely under prefers-reduced-motion.
 */
export default function HeroOrbit() {
  return (
    <div
      aria-hidden="true"
      className="relative w-[19rem] h-[19rem] sm:w-[23rem] sm:h-[23rem] lg:w-[27rem] lg:h-[27rem] shrink-0"
    >
      {/* Concentric guide rings */}
      <div className="absolute inset-0 rounded-full border border-slate-200/70" />
      <div className="absolute inset-[13%] rounded-full border border-slate-200/50" />
      <div className="absolute inset-[26%] rounded-full border border-dashed border-slate-200/60" />

      {/* Rotating ring — the badges are placed around its edge */}
      <div className="absolute inset-0 animate-orbit">
        {FEATURES.map((f, i) => {
          // Position with percentage offsets rather than a rotate+translate
          // chain: the radius then scales with the container at every
          // breakpoint, and each badge only has to undo the ring's spin (not
          // its own angle) to stay upright.
          const angle = (360 / FEATURES.length) * i - 90; // start at 12 o'clock
          const rad = (angle * Math.PI) / 180;
          // % of the container's width. Kept low enough that a badge plus its
          // label stays inside the box — otherwise they clip against the
          // section's overflow-hidden on narrower desktops.
          const RADIUS = 41;
          const Icon = f.icon;
          return (
            <div
              key={f.label}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${50 + RADIUS * Math.cos(rad)}%`,
                top: `${50 + RADIUS * Math.sin(rad)}%`,
              }}
            >
              <div className="animate-orbit-counter flex flex-col items-center gap-1.5">
                <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5 overflow-hidden">
                  <span
                    className={`w-full h-full flex items-center justify-center ${f.tint}`}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  {f.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Centre: the Chasqr mark, held still */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <span className="absolute inset-0 rounded-3xl bg-primary/25 blur-2xl scale-150" />
          <span className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white shadow-xl shadow-primary/20 ring-1 ring-slate-900/5 flex items-center justify-center">
            <img
              src={`${process.env.PUBLIC_URL || ""}/logo.svg`}
              alt=""
              className="w-11 h-11 sm:w-14 sm:h-14"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
