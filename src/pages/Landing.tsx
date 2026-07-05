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
} from "lucide-react";
import { AuthStore } from "../store/auth";
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function Landing() {
  const { user } = AuthStore.useState();

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
      <section className="relative pt-36 pb-24 px-6 text-center max-w-5xl mx-auto">
        {/* Ambient gradient blobs */}
        <div className="absolute -top-24 -left-32 w-[28rem] h-[28rem] bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -right-32 w-[24rem] h-[24rem] bg-sky-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-[20rem] h-[20rem] bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <span className="inline-flex items-center gap-1.5 bg-white/60 backdrop-blur-md text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wide uppercase border border-primary/20 shadow-sm">
            <Sparkles size={12} />
            Custom domains with free SSL are here
          </span>

          <h1 className="font-bebas text-7xl md:text-9xl text-slate-900 leading-none mb-6">
            Deploy Your
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-500 to-sky-400 bg-clip-text text-transparent">
              Website
            </span>
            <br />
            In Seconds
          </h1>

          <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Upload your HTML, CSS, and assets. Get a shareable link instantly.
            Connect your own domain, edit content, tune SEO — without touching
            code ever again.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={primaryCTA.to}
              className="group flex items-center justify-center gap-2 bg-primary text-white font-semibold px-8 py-4 rounded-xl hover:bg-primary-dark transition-all hover:scale-105 text-base shadow-lg shadow-primary/25"
            >
              {primaryCTA.label}
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              to={secondaryCTA.to}
              className="border border-slate-200 bg-white/60 backdrop-blur-md text-slate-700 font-semibold px-8 py-4 rounded-xl hover:bg-white transition-all text-base"
            >
              {secondaryCTA.label}
            </Link>
          </div>
        </motion.div>

        {/* Mock URL bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative mt-16 bg-slate-900/90 backdrop-blur-xl rounded-2xl p-4 max-w-lg mx-auto shadow-2xl border border-white/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
              <Lock size={10} /> https
            </span>
          </div>
          <div className="bg-slate-800/80 rounded-lg px-4 py-2.5 text-left">
            <span className="text-slate-500 text-sm">yourdomain.com</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="text-accent text-sm font-mono"
            >
              /
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: 1, duration: 0.8, repeat: Infinity }}
              className="text-white text-sm"
            >
              |
            </motion.span>
          </div>
        </motion.div>
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
            Everything You Need
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
          <Link to="/docs" className="hover:text-primary transition-colors">Docs</Link>
          <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
        </div>
      </footer>

      <StorageNoticeBanner />
    </div>
  );
}
