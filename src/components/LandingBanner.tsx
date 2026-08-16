import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Velaris from "./ui/velaris";
import RotatingText from "./RotatingText";
import FeatureNetwork from "./FeatureNetwork";
import { cn } from "../lib/utils";
import { AuthStore } from "../store/auth";
import { setNavOverlay } from "../store/navOverlay";

/** Height of the fixed navbar, in px. */
const NAV_HEIGHT = 64;

/**
 * Module-level on purpose, not inline in the JSX.
 *
 * Velaris lists `colors` in its effect dependencies, so a fresh array literal
 * on every render would tear down and rebuild the whole WebGL context each
 * time the parent re-renders. A stable reference keeps the context alive.
 */
const BANNER_COLORS = ["#60a5fa", "#2563eb", "#1d4ed8", "#020617"];
const BANNER_BG = "#020617";

/**
 * True when the visitor has asked their OS for less motion.
 *
 * The rest of the app honours this in index.css, but Velaris animates from a
 * requestAnimationFrame loop that CSS can't reach — so we swap the canvas for
 * a still backdrop instead.
 */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * Tells the navbar to go see-through for exactly as long as this banner is
 * underneath it.
 *
 * An IntersectionObserver rather than a scroll listener on purpose: it reports
 * against the viewport no matter which element is actually doing the
 * scrolling, and it needs no knowledge of how tall the banner is. The negative
 * top margin shrinks the observed area by the height of the bar, so the banner
 * stops "intersecting" the moment its bottom edge slides under the bar.
 */
function useNavOverlayWhileVisible(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setNavOverlay(entry.isIntersecting),
      { rootMargin: `-${NAV_HEIGHT}px 0px 0px 0px`, threshold: 0 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      // Leaving the page entirely — hand the bar back to its normal styling.
      setNavOverlay(false);
    };
  }, [ref]);
}

/** "Free" stays put; these rotate after it. */
const FREE_WORDS = [
  "hosting",
  "SSL",
  "custom domains",
  "custom builds",
  "SEO tools",
  "visitor analytics",
  "form handling",
];

export interface LandingBannerProps {
  /** Words cycled after the constant "Free". */
  words?: string[];
  title?: string;
  subtitle?: string;
  /** Any CSS length. Passed straight to Velaris. */
  height?: string;
  /** Hide the buttons when the banner is used purely as a section header. */
  showActions?: boolean;
  className?: string;
  /** Replaces the default copy block entirely. */
  children?: React.ReactNode;
}

export default function LandingBanner({
  words = FREE_WORDS,
  title = "Your website, live in seconds.",
  subtitle = "Push to GitHub, upload a folder, or build the page in your browser. Your site goes live on a URL straight away — no servers to run, no pipeline to configure.",
  height = "600px",
  showActions = true,
  className,
  children,
}: LandingBannerProps) {
  const { user } = AuthStore.useState();
  const reducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  useNavOverlayWhileVisible(rootRef);

  const primaryCTA = user
    ? { to: "/dashboard", label: "Go to dashboard" }
    : { to: "/register", label: "Get started free" };

  // The nav is fixed at h-16 and sits over the banner, so nudge the centred
  // content down by the same amount to keep it optically centred.
  const content = children ?? (
    <div className="mx-auto flex h-full w-full max-w-6xl items-center px-6 pt-16">
      <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="text-left">
          {/* "Free" holds still and the service slides underneath it.
              leading-[1.3] is deliberate: the rotator clips its overflow to
              get the slide, so the line box has to be tall enough to clear
              descenders. The em gap keeps the spacing tied to the type size. */}
          <h1 className="flex flex-wrap items-center gap-x-[0.25em] text-4xl font-semibold leading-[1.3] tracking-tight text-white sm:text-5xl">
            <span>Free</span>
            <RotatingText words={words} paused={reducedMotion} />
          </h1>

          <p className="mt-6 max-w-xl text-xl font-medium leading-snug text-white/85 sm:text-2xl">
            {title}
          </p>

          <p className="mt-5 max-w-lg text-base leading-[1.7] text-white/55">
            {subtitle}
          </p>

          {showActions && (
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to={primaryCTA.to}
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-slate-900 transition-colors hover:bg-white/90"
              >
                {primaryCTA.label}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                to="/docs"
                className="inline-flex items-center justify-center rounded-lg border border-white/25 px-6 py-3 text-base font-medium text-white transition-colors hover:border-white/50 hover:bg-white/10"
              >
                Read the docs
              </Link>
            </div>
          )}

          <p className="mt-7 text-sm text-white/45">No credit card required.</p>
        </div>

        {/* Hidden below lg: at that width the nodes would overlap the copy
            rather than sit beside it. */}
        <div className="hidden justify-end lg:flex">
          <FeatureNetwork />
        </div>
      </div>
    </div>
  );

  if (reducedMotion) {
    return (
      <div
        ref={rootRef}
        style={{
          height,
          background: `radial-gradient(120% 90% at 50% 40%, #1d4ed8 0%, #1e3a8a 45%, ${BANNER_BG} 100%)`,
        }}
        className={cn("relative w-full overflow-hidden", className)}
      >
        <div className="relative z-10 h-full w-full">{content}</div>
      </div>
    );
  }

  // The wrapper exists only to give the observer something to measure —
  // Velaris owns its own container and doesn't forward a ref.
  return (
    <div ref={rootRef}>
      <Velaris
        bg={BANNER_BG}
        colors={BANNER_COLORS}
        speed={1.2}
        grain={0.25}
        height={height}
        className={className}
      >
        {content}
      </Velaris>
    </div>
  );
}
