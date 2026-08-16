import {
  motion,
  useMotionValue,
  useTransform,
  MotionValue,
} from "framer-motion";
import {
  ArrowRight,
  BarChart2,
  Check,
  Eye,
  FolderGit2,
  Globe,
  Headset,
  LayoutTemplate,
  Lock,
  Maximize2,
  MousePointerClick,
  Palette,
  Pencil,
  Search,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AuthStore } from "../store/auth";
import ImageLightbox from "../components/ImageLightbox";
import LandingBanner from "../components/LandingBanner";
import StorageNoticeBanner from "../components/StorageNoticeBanner";

/** The four things worth pinning a visitor's scroll for. */
const CHAPTERS = [
  {
    kicker: "Ship",
    title: "Push. It's live.",
    body: "Connect a GitHub repository once and every push redeploys your site automatically. No pipeline to configure, no build minutes to buy, no server to keep alive.",
    points: [
      "Import a repo in under a minute",
      "Auto-deploy on every push to your branch",
      "A failed build never takes your site down",
    ],
    icon: FolderGit2,
    shot: 16,
    shotAlt: "Choosing a repository, branch and output folder",
  },
  {
    kicker: "Build",
    title: "Or build it without code.",
    body: "Start from a blank page and drag in sections, columns, navbars and footers. Edit the text and images on any live site straight from your dashboard.",
    points: [
      "Visual builder with 40+ blocks and templates",
      "Edit copy and images without touching HTML",
      "Save & deploy publishes instantly",
    ],
    icon: LayoutTemplate,
    shot: 4,
    shotAlt: "The full-screen visual builder",
  },
  {
    kicker: "Secure",
    title: "Your domain. Your HTTPS.",
    body: "Point a domain you own at Chasqr and we handle the certificate the first time someone visits. Renewals are automatic and free, forever.",
    points: [
      "One A record and you're done",
      "Free certificates, issued and renewed automatically",
      "Free on every site, including the free tier",
    ],
    icon: ShieldCheck,
    shot: 11,
    shotAlt: "The DNS record to add for a custom domain",
  },
  {
    kicker: "Grow",
    title: "Everything after launch.",
    body: "A 20-point SEO audit with one-click fixes, visitor analytics, and contact forms that land in your inbox — all built in, none of it costing extra.",
    points: [
      "SEO audit, scored, with automatic fixes",
      "Visits tracked without a third-party script",
      "Form submissions stored and emailed to you",
    ],
    icon: Search,
    shot: 12,
    shotAlt: "An SEO report with score and issues",
  },
  {
    kicker: "Measure",
    title: "See who's actually visiting.",
    body: "One Analytics page across every site you run — daily visits, your busiest sites, and which countries your traffic comes from. Counted on our side, so there's no script to add and nothing to slow your pages down.",
    points: [
      "Visits per day across all your sites at once",
      "Visitors broken down by country",
      "No third-party tracker, no cookie banner",
    ],
    icon: BarChart2,
    shot: 18,
    shotAlt: "The Analytics tab with totals and a bar per day",
  },
];

const steps = [
  {
    n: "01",
    title: "Upload",
    desc: "Drop a ZIP or select your project folder. index.html and all your assets included.",
  },
  {
    n: "02",
    title: "Share",
    desc: "Get a live link instantly — or connect your own domain with automatic HTTPS.",
  },
  {
    n: "03",
    title: "Iterate",
    desc: "Edit content, colors, and SEO from the dashboard. Changes deploy the moment you save.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const features = [
  {
    icon: <Zap size={24} />,
    title: "Instant Deploy",
    desc: "Upload a ZIP or files — plain HTML or a built React/Angular/Vue app — and go live in seconds. No config, no CLI.",
  },
  {
    icon: <Globe size={24} />,
    title: "Custom Domains + Free SSL",
    desc: "Connect your own domain with one DNS record. HTTPS certificates are issued automatically.",
  },
  {
    icon: <Pencil size={24} />,
    title: "Live Content Editor",
    desc: "Edit any text, image, or link from a clean admin panel. Duplicate, hide, or delete elements — no code.",
  },
  {
    icon: <Palette size={24} />,
    title: "Color Editor",
    desc: "Every color used on your site, extracted automatically. Change your palette with color pickers.",
  },
  {
    icon: <Search size={24} />,
    title: "SEO Manager",
    desc: "Titles, meta descriptions, social share cards, and favicons — per page, with live Google previews.",
  },
  {
    icon: <Eye size={24} />,
    title: "Preview Before Publish",
    desc: "See exactly how your changes look in a full live preview before anything goes public.",
  },
  {
    icon: <BarChart2 size={24} />,
    title: "Visit Analytics",
    desc: "Daily visitor charts, totals, and trends for every site — built in, no tracking scripts to add.",
  },
  {
    icon: <UploadCloud size={24} />,
    title: "One-Click Redeploys",
    desc: "Push a new version anytime. Your URL, domain, and settings stay exactly the same.",
  },
];

/**
 * One chapter of the pinned stage.
 *
 * Each owns a slice of the parent's scroll progress and cross-fades within it,
 * so the stage stays put while the content changes underneath the reader.
 */
function Chapter({
  chapter,
  index,
  total,
  progress,
  onZoom,
}: {
  chapter: (typeof CHAPTERS)[number];
  index: number;
  total: number;
  progress: MotionValue<number>;
  onZoom: (src: string, alt: string) => void;
}) {
  const span = 1 / total;
  const start = index * span;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  // One chapter's fade-out and the next one's fade-in share exactly the same
  // window, so they cross over at 0.5 each and the stage is never blank. The
  // first chapter starts already visible (the stage pins with it on screen) and
  // the last one never leaves.
  const handoverStart = start - span * 0.22;
  const exitStart = start + span * 0.78;
  const exitEnd = start + span;

  const keys = isFirst
    ? [start, exitStart, exitEnd]
    : isLast
      ? [handoverStart, start]
      : [handoverStart, start, exitStart, exitEnd];

  const opacityOut = isFirst ? [1, 1, 0] : isLast ? [0, 1] : [0, 1, 1, 0];
  const yOut = isFirst ? [0, 0, -60] : isLast ? [60, 0] : [60, 0, 0, -60];
  const scaleOut = isFirst
    ? [1, 1, 0.98]
    : isLast
      ? [0.97, 1]
      : [0.97, 1, 1, 0.98];

  const opacity = useTransform(progress, keys, opacityOut);
  const y = useTransform(progress, keys, yOut);
  const scale = useTransform(progress, keys, scaleOut);

  // Every chapter stays mounted and stacked at `absolute inset-0`, so without
  // this the last one in DOM order sits on top of all the others and takes
  // every click — faded out to nothing but still the hit target. Only the
  // chapter that is actually being read should be interactive.
  const pointerEvents = useTransform(opacity, (v) =>
    v > 0.5 ? "auto" : "none",
  );

  const Icon = chapter.icon;
  const shotSrc = `${process.env.PUBLIC_URL || ""}/images/doc-${chapter.shot}.png`;

  return (
    <motion.div
      style={{ opacity, y, scale, pointerEvents }}
      className="absolute inset-0 flex items-center"
    >
      {/* The visual column is given the larger share — these are screenshots of
          dense UI, and an even split rendered them too small to read. */}
      <div className="w-full max-w-6xl mx-auto px-6 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-12 lg:gap-14 items-center">
        {/* Copy */}
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-5">
            <span className="text-slate-300">0{index + 1}</span>
            {chapter.kicker}
          </span>
          <h2 className="font-poppins font-semibold text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight leading-[1.1] mb-5">
            {chapter.title}
          </h2>
          <p className="font-poppins text-base sm:text-lg text-slate-500 leading-relaxed mb-8 max-w-xl">
            {chapter.body}
          </p>
          <ul className="space-y-3">
            {chapter.points.map((p) => (
              <li
                key={p}
                className="font-poppins flex items-start gap-3 text-sm sm:text-base text-slate-700"
              >
                <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-primary flex items-center justify-center">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Visual — a real screenshot in a dark window frame. The shots are
            almost entirely white, so a dark chrome around them is what gives
            them an edge against the white page. */}
        <div className="hidden lg:flex justify-center">
          <button
            type="button"
            onClick={() => onZoom(shotSrc, chapter.shotAlt)}
            aria-label={`Enlarge screenshot: ${chapter.shotAlt}`}
            className="group relative w-full cursor-zoom-in overflow-hidden rounded-xl bg-[#1d1f21] text-left shadow-2xl shadow-slate-900/25 ring-1 ring-slate-900/10"
          >
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-black/40 bg-[#2c2f31] px-4 h-10">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 flex items-center gap-1.5 text-[11px] font-medium text-white/45">
                <Icon size={11} /> {chapter.kicker}
              </span>
            </div>

            {/* contain, not cover: these screenshots vary from 2:1 to almost
                square, and cover was slicing the edges off the wide ones.
                Height is capped so a tall shot can't outgrow the pinned stage. */}
            <img
              src={shotSrc}
              alt={chapter.shotAlt}
              loading="lazy"
              className="w-full max-h-[56vh] object-contain bg-white"
            />

            {/* Affordance — the shot is small enough here that it needs to say
                it can be opened, rather than relying on the cursor alone. */}
            <span className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1.5 rounded-md bg-slate-900/85 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Maximize2 size={12} />
              Click to enlarge
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingV2() {
  const { user } = AuthStore.useState();
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollYProgress = useMotionValue(0);
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);

  // How far through the pinned track we are, 0 → 1.
  //
  // Driven by rAF rather than scroll events on purpose: this app scrolls inside
  // its layout wrapper rather than the window, so window-level scroll listeners
  // (and framer's useScroll, which uses them) never fire here. Reading the rect
  // each frame sidesteps the question of which element is doing the scrolling.
  // It's one getBoundingClientRect per frame, and it idles once off-screen.
  useEffect(() => {
    let raf = 0;
    let last = -1;

    const tick = () => {
      const el = stageRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // Skip the maths entirely while the stage is nowhere near the viewport.
        if (rect.bottom > -vh && rect.top < vh * 2) {
          const scrollable = rect.height - vh;
          const p =
            scrollable > 0
              ? Math.min(1, Math.max(0, -rect.top / scrollable))
              : 0;
          if (Math.abs(p - last) > 0.0005) {
            last = p;
            scrollYProgress.set(p);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scrollYProgress]);

  const primaryCTA = user
    ? { to: "/dashboard", label: "Go to Dashboard" }
    : { to: "/register", label: "Start Free" };

  const trustBar = [
    {
      icon: <ShieldCheck size={16} />,
      label: "Secure payments via Razorpay & Cashfree",
    },
    { icon: <Lock size={16} />, label: "Free SSL on every domain" },
    {
      icon: <Headset size={16} />,
      label: "Real expert support, not just docs",
    },
    { icon: <ShieldAlert size={16} />, label: "2FA account protection" },
  ];

  return (
    <div className="font-poppins bg-white overflow-x-clip">
      {/* ── Banner ────────────────────────────────────────────────────────── */}
      <LandingBanner
        height="100vh"
        title="Your website, live in seconds."
        subtitle="Push to GitHub, upload a folder, or build it visually. Your site goes live on a URL straight away — no servers, no pipelines, no monthly bill."
      />

      {/* ── Pinned stage ──────────────────────────────────────────────────── */}
      <div
        ref={stageRef}
        className="relative"
        style={{ height: `${CHAPTERS.length * 100}vh` }}
      >
        <div className="sticky top-0 h-screen overflow-hidden bg-white">
          {CHAPTERS.map((c, i) => (
            <Chapter
              key={c.title}
              chapter={c}
              index={i}
              total={CHAPTERS.length}
              progress={scrollYProgress}
              onZoom={(src, alt) => setZoom({ src, alt })}
            />
          ))}

          {/* Progress rail */}
          <div className="absolute left-6 lg:left-10 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-3">
            {CHAPTERS.map((c, i) => (
              <Tick
                key={c.title}
                index={i}
                total={CHAPTERS.length}
                progress={scrollYProgress}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Closing CTA ───────────────────────────────────────────────────── */}
      <section className="relative py-28 px-6 bg-slate-50 border-t border-slate-200">
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="font-poppins font-semibold text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight mb-5">
            Put it live today.
          </h2>
          <p className="text-slate-500 text-base sm:text-lg mb-9 max-w-xl mx-auto leading-relaxed">
            Free to start, free to keep. Bring a repo, a folder, or nothing at
            all.
          </p>
          <Link
            to={primaryCTA.to}
            className="group inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-4 rounded-lg hover:bg-primary-dark transition-colors text-base"
          >
            <MousePointerClick size={17} />
            {primaryCTA.label}
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-bebas text-5xl text-center text-slate-900 mb-16"
          >
            Live In Three Steps
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="relative bg-white rounded-xl p-8 border border-slate-200"
              >
                <span className="font-bebas text-6xl text-primary/15 absolute top-4 right-6">
                  {s.n}
                </span>
                <h3 className="font-bebas text-3xl text-slate-900 mb-2">
                  {s.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-slate-200 bg-slate-50 py-5 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {trustBar.map((t) => (
            <span
              key={t.label}
              className="flex items-center gap-2 text-xs font-medium text-slate-500"
            >
              <span className="text-primary">{t.icon}</span>
              {t.label}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 px-6 bg-white border-t border-slate-200">
        <div className="relative max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-bebas text-5xl text-center text-slate-900 mb-4"
          >
            Everything Else You Need
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-slate-500 text-center max-w-lg mx-auto mb-16"
          >
            A full publishing toolkit behind every deploy — not just hosting.
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 border border-slate-200 hover:border-primary transition-colors"
              >
                <div className="mb-4 p-2.5 bg-primary-light text-primary rounded-lg w-fit">
                  {f.icon}
                </div>
                <h3 className="font-bebas text-xl text-slate-900 mb-1.5">
                  {f.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-slate-400 text-sm">
        <span className="inline-flex items-center gap-1.5 font-bebas text-primary text-lg mr-2 align-middle">
          <img src="/logo.svg" alt="Chasqr" className="w-5 h-5" />
          CHASQR
        </span>
        © {new Date().getFullYear()} — Deploy fast, iterate faster.
        <div className="mt-2 flex items-center justify-center gap-4 text-xs">
          <Link to="/docs" className="hover:text-primary transition-colors">
            Docs
          </Link>
          <Link
            to="/seo-checker"
            className="hover:text-primary transition-colors"
          >
            SEO Checker
          </Link>
          <Link to="/terms" className="hover:text-primary transition-colors">
            Terms
          </Link>
          <Link to="/privacy" className="hover:text-primary transition-colors">
            Privacy
          </Link>
        </div>
      </footer>

      <ImageLightbox
        src={zoom?.src ?? null}
        alt={zoom?.alt}
        caption={zoom?.alt}
        onClose={() => setZoom(null)}
      />

      <StorageNoticeBanner />
    </div>
  );
}

/** One dot on the progress rail, filling as its chapter becomes active. */
function Tick({
  index,
  total,
  progress,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const span = 1 / total;
  const start = index * span;
  const opacity = useTransform(
    progress,
    [start - 0.02, start + span * 0.15, start + span, start + span + 0.02],
    [0.2, 1, 1, 0.2],
  );
  const height = useTransform(
    progress,
    [start, start + span * 0.15, start + span],
    ["0.75rem", "2rem", "2rem"],
  );
  return (
    <motion.span
      style={{ opacity, height }}
      className="w-[3px] rounded-full bg-primary block"
    />
  );
}
