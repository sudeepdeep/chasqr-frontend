import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Pencil, Link2, BarChart2 } from "lucide-react";
import { AuthStore } from "../store/auth";

const features = [
  {
    icon: <Zap size={28} className="text-accent" />,
    title: "Instant Deploy",
    desc: "Upload your ZIP and go live in seconds. No config, no CLI.",
  },
  {
    icon: <Pencil size={28} className="text-accent" />,
    title: "Live Content Editor",
    desc: "Edit any text, image, or link on your site from a clean admin panel.",
  },
  {
    icon: <Link2 size={28} className="text-accent" />,
    title: "Shareable Link",
    desc: "Every site gets a unique URL you can share with anyone instantly.",
  },
  {
    icon: <BarChart2 size={28} className="text-accent" />,
    title: "Visit Analytics",
    desc: "See how many people visited your site at a glance.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
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
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block bg-accent-light text-accent text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-widest uppercase border border-accent/20">
            Now in Beta
          </span>

          <h1 className="font-bebas text-7xl md:text-9xl text-slate-900 leading-none mb-6">
            Deploy Your
            <br />
            <span className="text-primary">Website</span>
            <br />
            In Seconds
          </h1>

          <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Upload your HTML, CSS, and assets. Get a shareable link instantly.
            Edit content without touching code ever again.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={primaryCTA.to}
              className="bg-primary text-white font-semibold px-8 py-4 rounded-xl hover:bg-primary-dark transition-all hover:scale-105 text-base"
            >
              {primaryCTA.label}
            </Link>
            <Link
              to={secondaryCTA.to}
              className="border border-slate-200 text-slate-700 font-semibold px-8 py-4 rounded-xl hover:bg-slate-50 transition-all text-base"
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
          className="mt-16 bg-slate-900 rounded-2xl p-4 max-w-lg mx-auto shadow-2xl"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="bg-slate-800 rounded-lg px-4 py-2.5 text-left">
            <span className="text-slate-500 text-sm">chasqr.com/sites/</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="text-accent text-sm font-mono"
            >
              a3f92b1c
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

      {/* Features */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-bebas text-5xl text-center text-slate-900 mb-16"
          >
            Everything You Need
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="mb-4 p-3 bg-accent-light rounded-xl w-fit">
                  {f.icon}
                </div>
                <h3 className="font-bebas text-2xl text-slate-900 mb-2">
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
      <section className="py-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-bebas text-6xl text-slate-900 mb-4">
            Ready To Ship?
          </h2>
          <p className="text-slate-500 mb-8">
            No credit card required. Free forever for basic use.
          </p>
          <Link
            to={bottomCTA.to}
            className="bg-primary text-white font-semibold px-10 py-4 rounded-xl hover:bg-primary-dark transition-all hover:scale-105 inline-block text-base"
          >
            {bottomCTA.label}
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-slate-400 text-sm">
        <span className="font-bebas text-primary text-lg mr-2">CHASQR</span>©{" "}
        {new Date().getFullYear()} — Deploy fast, iterate faster.
      </footer>
    </div>
  );
}
