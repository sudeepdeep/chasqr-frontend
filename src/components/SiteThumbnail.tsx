import { useEffect, useRef, useState } from "react";
import ShaderCanvas from "./ShaderCanvas";

/**
 * The card thumbnail, inside its little browser chrome.
 *
 * Each site gets its own animated gradient — the same shader the landing banner
 * runs, in a palette derived from the site id.
 *
 * Two things are deliberate about how it is mounted:
 *
 * The palette is *derived*, not random. A card that repainted a different
 * colour on every visit would read as a glitch; seeded from the id, a site
 * keeps its colour forever — through renames and custom domains — and the grid
 * still looks varied.
 *
 * Only cards on screen run a canvas. Browsers cap live WebGL contexts at
 * roughly sixteen, and every context costs a render loop — so a long site list
 * that lit one per card would silently drop canvases and spin the GPU for rows
 * nobody is looking at. Scrolling away releases the context and leaves the
 * matching CSS gradient in its place, which is what paints underneath anyway.
 */

/** Deterministic 0–359 hue, seeded from the site id so it never shifts. */
function hueFor(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return ln - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
  };
  return [f(0), f(8), f(4)];
}

/** Rec. 709 relative luminance — how bright a colour actually looks. */
const luma = ([r, g, b]: [number, number, number]) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

/**
 * HSL lightness is not perceived brightness — at a fixed L a yellow measures
 * roughly three times a blue — so solve for the lightness that hits a target
 * luminance instead. Keeps every site's tile on one visual ramp.
 */
function lightnessForLuma(h: number, s: number, target: number): number {
  let lo = 0;
  let hi = 100;
  for (let i = 0; i < 20; i += 1) {
    const mid = (lo + hi) / 2;
    if (luma(hslToRgb(h, s, mid)) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function toHex([r, g, b]: [number, number, number]): string {
  const c = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

const tone = (h: number, s: number, target: number) =>
  toHex(hslToRgb(h, s, lightnessForLuma(h, s, target)));

export default function SiteThumbnail({
  seed,
  name,
  url,
}: {
  /** Stable unique key for the colour — the site id. */
  seed: string;
  name: string;
  /** Host shown in the chrome bar. */
  url: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: "150px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hue = hueFor(seed || name || url);
  const letter = (name || url || "?").trim()[0]?.toUpperCase() || "?";

  // Four analogous tones on a fixed brightness ramp, so every site's tile is
  // equally bright however its hue landed.
  const colors = [
    tone((hue + 18) % 360, 80, 0.5),
    tone(hue, 78, 0.3),
    tone((hue + 340) % 360, 70, 0.15),
    tone((hue + 300) % 360, 60, 0.06),
  ];
  const bg = tone(hue, 50, 0.03);

  return (
    <div className="p-2 pb-0">
      <div className="overflow-hidden rounded-[9px] border border-slate-200 bg-slate-50">
        {/* Browser chrome */}
        <div className="flex items-center gap-[7px] border-b border-slate-200 bg-slate-100 px-[9px] py-[6px]">
          <span className="flex gap-[3.5px]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="block h-1.5 w-1.5 rounded-full bg-slate-300" />
            ))}
          </span>
          <span className="flex-1 truncate rounded bg-white px-[7px] py-[2.5px] text-[9px] text-slate-400">
            {url}
          </span>
        </div>

        <div
          ref={ref}
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: "16 / 10",
            // Always painted, on the same brightness ramp as the shader. It is
            // the backdrop before WebGL initialises, the fallback when it is
            // unavailable, and what remains once the card scrolls out of view —
            // so a tile is never blank and never changes colour on you.
            background: `radial-gradient(120% 100% at 30% 20%, ${colors[0]} 0%, ${colors[1]} 45%, ${colors[3]} 100%)`,
          }}
        >
          {inView && (
            <ShaderCanvas
              colors={colors}
              bg={bg}
              // Slow: a wall of thumbnails all churning at banner speed is
              // restless, and this is chrome, not the subject of the page.
              speed={0.45}
              className="absolute inset-0 h-full w-full"
            />
          )}

          {/* The initial, over the gradient. Sits in a soft glass chip so it
              stays readable whatever the palette drifts to underneath. */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-lg font-semibold text-white shadow-sm backdrop-blur-[2px]">
              {letter}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
