import { useEffect, useRef, useState } from "react";
import ShaderCanvas from "./ShaderCanvas";

/**
 * The card thumbnail, inside its little browser chrome.
 *
 * There is no screenshot pipeline, so rather than leaving a dead grey box each
 * site gets its own animated gradient — the same shader the landing banner
 * runs, in a palette derived from the site.
 *
 * Only cards on screen run a canvas. Browsers cap live WebGL contexts at
 * roughly sixteen, and every context costs a render loop — so a long site list
 * that lit one per card would silently drop canvases and spin the GPU for rows
 * nobody is looking at. Scrolling away releases the context and leaves the
 * matching CSS gradient in its place, which is what paints underneath anyway.
 */

/**
 * Deterministic 0–359 hue.
 *
 * Seeded from the site id, not the name: names are not unique — two sites both
 * called "test" is entirely normal — and identical names would otherwise get
 * identical tiles. The id also never changes, so renaming a site or attaching a
 * custom domain leaves its colour alone.
 */
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
 * Find the HSL lightness that makes this hue hit a target perceived brightness.
 *
 * HSL lightness is not perceived brightness: at L=58 a yellow measures 0.89
 * luminance against a blue's 0.28, so seeding hues at a fixed lightness makes
 * yellow and green tiles glare while purples and blues stay muted. Solving per
 * hue instead puts every site's tile on the same visual ramp.
 *
 * A short binary search rather than a formula — HSL→luminance has no clean
 * inverse, and twenty iterations once per card is free.
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

/** A colour at this hue, saturation, and a chosen perceived brightness. */
function tone(h: number, s: number, targetLuma: number): string {
  return toHex(hslToRgb(h, s, lightnessForLuma(h, s, targetLuma)));
}

/**
 * Four analogous tones on a fixed brightness ramp, plus a deep base.
 * Same ramp for every site, so the grid varies in hue but reads as one set.
 */
const RAMP = [0.5, 0.3, 0.15, 0.06];

function paletteFor(hue: number) {
  return {
    colors: [
      tone((hue + 18) % 360, 80, RAMP[0]),
      tone(hue, 78, RAMP[1]),
      tone((hue + 340) % 360, 70, RAMP[2]),
      tone((hue + 300) % 360, 60, RAMP[3]),
    ],
    bg: tone(hue, 50, 0.03),
  };
}

export default function SiteThumbnail({
  seed,
  name,
  url,
}: {
  /** Stable unique key for the colour — the site id. */
  seed: string;
  name: string;
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
  const { colors, bg } = paletteFor(hue);
  const letter = (name || url || "?").trim()[0]?.toUpperCase() || "?";

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
