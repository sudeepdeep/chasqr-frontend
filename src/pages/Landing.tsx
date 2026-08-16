import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap,
  Pencil,
  Globe,
  BarChart2,
  Palette,
  Search,
  Eye,
  UploadCloud,
  Lock,
  ArrowRight,
  Sparkles,
  Headset,
  ShieldCheck,
  MessageSquareText,
  Code2,
  RefreshCw,
  CreditCard,
  ShieldAlert,
  Rocket,
} from "lucide-react";
import { AuthStore } from "../store/auth";
import HeroOrbit from "../components/HeroOrbit";
import HeroPulse from "../components/HeroPulse";
import StorageNoticeBanner from "../components/StorageNoticeBanner";

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

const trustBar = [
  {
    icon: <ShieldCheck size={16} />,
    label: "Secure payments via Razorpay & Cashfree",
  },
  { icon: <Lock size={16} />, label: "Free SSL on every domain" },
  { icon: <Headset size={16} />, label: "Real expert support, not just docs" },
  { icon: <ShieldAlert size={16} />, label: "2FA account protection" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

/** Renders the real asset at srcHint (image/GIF) once it exists in /public/images/.
 *  Falls back to a decorative placeholder — no visitor-facing text — if the file
 *  is missing (e.g. onError, or before postbuild the file simply 404s). */
function MediaSlot({
  icon,
  srcHint,
  alt,
  gradient,
}: {
  icon: React.ReactNode;
  srcHint: string;
  alt: string;
  gradient: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative aspect-[4/3] rounded-3xl border border-slate-200 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}
    >
      {!failed && (
        <img
          src={srcHint}
          alt={alt}
          onError={() => setFailed(true)}
          className="relative w-full h-full object-contain p-8"
        />
      )}
      {failed && (
        <>
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(37,99,235,0.15) 1.5px, transparent 1.5px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center">
            {icon}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Which hero graphic to show. Two are built while we decide:
 *   "orbit" — features circling the mark
 *   "pulse" — features wired into the mark, energy running down the lines
 *
 * Override live with ?hero=orbit / ?hero=pulse to compare without rebuilding.
 * Once one is picked, delete the loser and this switch.
 */
const DEFAULT_HERO: "orbit" | "pulse" = "pulse";

export default function Landing() {
  const { user } = AuthStore.useState();

  const heroParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("hero")
      : null;
  const hero = heroParam === "pulse" || heroParam === "orbit" ? heroParam : DEFAULT_HERO;

  const primaryCTA = user
    ? { to: "/upload", label: "Deploy a New Site" }
    : { to: "/register", label: "Start Deploying — Free" };

  const secondaryCTA = user
    ? { to: "/dashboard", label: "Go to Dashboard" }
    : { to: "/login", label: "Sign In" };

  const bottomCTA = user
    ? { to: "/upload", label: "Deploy a New Site" }
    : { to: "/register", label: "Create Your First Site" };

  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-36 lg:pb-28 px-6">
        {/* Drifting graph-paper grid, faded out at the edges */}
        <div
          className="absolute inset-0 hero-grid animate-grid-drift pointer-events-none"
          style={{
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent)",
          }}
        />
        {/* Ambient gradient blobs, slowly breathing */}
        <div className="absolute -top-32 -left-40 w-[32rem] h-[32rem] bg-primary/20 rounded-full blur-3xl pointer-events-none animate-blob" />
        <div
          className="absolute top-20 -right-40 w-[30rem] h-[30rem] bg-sky-300/30 rounded-full blur-3xl pointer-events-none animate-blob"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="absolute -bottom-24 left-1/3 w-[26rem] h-[26rem] bg-indigo-200/40 rounded-full blur-3xl pointer-events-none animate-blob"
          style={{ animationDelay: "-12s" }}
        />

        <div className="relative max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 text-center lg:text-left"
          >
            <Link
              to="/seo-checker"
              className="inline-flex items-center gap-1.5 bg-white/60 backdrop-blur-md text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-7 tracking-wide uppercase border border-primary/20 shadow-sm hover:bg-white transition-colors"
            >
              <Sparkles size={12} />
              New — Try the free SEO checker
            </Link>

            <h1 className="font-bebas text-4xl sm:text-5xl lg:text-6xl text-slate-900 leading-[1.02] mb-5">
              Deploy Your{" "}
              <span className="bg-gradient-to-r from-primary via-blue-500 to-sky-400 bg-clip-text text-transparent">
                Website
              </span>
              <br />
              In Seconds
            </h1>

            <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Push to GitHub, upload a folder, or build it visually — your site
              goes live instantly with a custom domain, free HTTPS, SEO tools and
              contact forms. No code, no servers, no monthly bill.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start">
              <Link
                to={primaryCTA.to}
                className="group flex items-center justify-center gap-2 bg-primary text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-primary-dark transition-all hover:scale-105 text-base shadow-lg shadow-primary/25"
              >
                {primaryCTA.label}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                to={secondaryCTA.to}
                className="border border-slate-200 bg-white/60 backdrop-blur-md text-slate-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-white transition-all text-base text-center"
              >
                {secondaryCTA.label}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center lg:justify-start mt-7 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Lock size={11} className="text-emerald-500" /> Free HTTPS
              </span>
              <span className="flex items-center gap-1.5">
                <Globe size={11} className="text-emerald-500" /> Custom domains
              </span>
              <span className="flex items-center gap-1.5">
                <Rocket size={11} className="text-emerald-500" /> Deploy on push
              </span>
            </div>
          </motion.div>

          {/* Orbit */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="flex-1 flex justify-center lg:justify-end"
          >
            {hero === "pulse" ? <HeroPulse /> : <HeroOrbit />}
          </motion.div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-slate-100 bg-slate-50/60 py-5 px-6">
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

      {/* How it works */}
      <section className="py-24 px-6">
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
                className="relative bg-gradient-to-b from-slate-50 to-white rounded-2xl p-8 border border-slate-200"
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

      {/* Spotlight: Free SEO Checker */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-1.5 bg-primary-light text-primary text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">
              New · Free tool
            </span>
            <h2 className="font-bebas text-5xl text-slate-900 mb-4 leading-tight">
              Know exactly what's holding your SEO back
            </h2>
            <p className="text-slate-500 leading-relaxed mb-6">
              Paste any URL — yours or anyone's — and get an instant,
              plain-English audit. No signup, no jargon, just what to fix and
              why it matters.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "20+ checks across meta tags, structure, content, and links",
                "Free forever, no login required",
                "Deployed on Chasqr? Get a deeper check plus a built-in SEO Manager",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-slate-600"
                >
                  <ShieldCheck
                    size={16}
                    className="text-primary mt-0.5 shrink-0"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/seo-checker"
              className="group inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-all text-sm shadow-lg shadow-primary/20"
            >
              Try the Free SEO Checker
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <MediaSlot
              icon={<Search size={28} className="text-primary" />}
              srcHint="/images/searching.svg"
              alt="Chasqr SEO Checker running a live audit"
              gradient="from-slate-50 to-primary-light/40"
            />
          </motion.div>
        </div>
      </section>

      {/* Spotlight: Expert Support */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:order-2"
          >
            <span className="inline-flex items-center gap-1.5 bg-primary-light text-primary text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">
              Stuck? We've got you
            </span>
            <h2 className="font-bebas text-5xl text-slate-900 mb-4 leading-tight">
              Real humans, not just a help center
            </h2>
            <p className="text-slate-500 leading-relaxed mb-6">
              Chat live with a verified expert right from your dashboard. Share
              screenshots, paste your code, and they can even redeploy fixes on
              your behalf.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                {
                  icon: <MessageSquareText size={16} />,
                  text: "Live chat, with screenshot & photo sharing",
                },
                {
                  icon: <Code2 size={16} />,
                  text: "Share your source code securely",
                },
                {
                  icon: <RefreshCw size={16} />,
                  text: "Experts can redeploy fixes directly to your site",
                },
              ].map((item) => (
                <li
                  key={item.text}
                  className="flex items-start gap-2.5 text-sm text-slate-600"
                >
                  <span className="text-primary mt-0.5 shrink-0">
                    {item.icon}
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
            <Link
              to={user ? "/dashboard" : "/register"}
              className="group inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-all text-sm shadow-lg shadow-primary/20"
            >
              Get Expert Help
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:order-1"
          >
            <MediaSlot
              icon={<Headset size={28} className="text-primary" />}
              srcHint="/images/expert-support-illustration.svg"
              alt="Illustration of live expert support chat"
              gradient="from-sky-50 to-primary-light/40"
            />
          </motion.div>
        </div>
      </section>

      {/* Spotlight: Secure Payments */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-1.5 bg-primary-light text-primary text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">
              Bank-grade security
            </span>
            <h2 className="font-bebas text-5xl text-slate-900 mb-4 leading-tight">
              Payments that just work — every time
            </h2>
            <p className="text-slate-500 leading-relaxed mb-6">
              We process payments through both Razorpay and Cashfree. If one has
              a hiccup, we automatically fall back to the other — so your
              upgrade never gets stuck waiting on a single provider.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                {
                  icon: <CreditCard size={16} />,
                  text: "PCI-compliant payment processors",
                },
                {
                  icon: <RefreshCw size={16} />,
                  text: "Automatic failover between two independent gateways",
                },
                {
                  icon: <ShieldCheck size={16} />,
                  text: "One-time payments — no hidden subscriptions",
                },
              ].map((item) => (
                <li
                  key={item.text}
                  className="flex items-start gap-2.5 text-sm text-slate-600"
                >
                  <span className="text-primary mt-0.5 shrink-0">
                    {item.icon}
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <MediaSlot
              icon={<ShieldCheck size={28} className="text-primary" />}
              srcHint="/images/secure-payments-illustration.svg"
              alt="Illustration of secure payment processing"
              gradient="from-emerald-50 to-primary-light/40"
            />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 px-6 bg-slate-50 overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute top-10 -left-40 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-40 w-[30rem] h-[30rem] bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />

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
                className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all"
              >
                <div className="mb-4 p-2.5 bg-primary-light text-primary rounded-xl w-fit">
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

      {/* CTA */}
      <section className="relative py-28 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[36rem] h-[36rem] bg-primary/10 rounded-full blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <h2 className="font-bebas text-6xl md:text-7xl text-slate-900 mb-4">
            Ready To Ship?
          </h2>
          <p className="text-slate-500 mb-8">
            No credit card required. Free forever for basic use.
          </p>
          <Link
            to={bottomCTA.to}
            className="group inline-flex items-center gap-2 bg-primary text-white font-semibold px-10 py-4 rounded-xl hover:bg-primary-dark transition-all hover:scale-105 text-base shadow-lg shadow-primary/25"
          >
            {bottomCTA.label}
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </motion.div>
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

      <StorageNoticeBanner />
    </div>
  );
}
