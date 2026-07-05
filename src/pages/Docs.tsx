import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileCode, FolderArchive, CheckCircle2, Rocket,
  Globe, Lock, Clock, Layers, Headset,
} from "lucide-react";

const SUPPORTED = [
  {
    name: "Plain HTML / CSS / JS",
    detail: "Any static website — no build step needed.",
    requirement: "index.html at the root of your ZIP",
  },
  {
    name: "React",
    detail: "Create React App or Vite projects.",
    requirement: "Run npm run build, zip the contents of the build/ or dist/ folder",
  },
  {
    name: "Vue",
    detail: "Vue 3 / Vite projects.",
    requirement: "Run npm run build, zip the contents of the dist/ folder",
  },
  {
    name: "Angular",
    detail: "Angular CLI projects.",
    requirement: "Run ng build, zip the contents of dist/<project-name>/",
  },
  {
    name: "Svelte / SvelteKit (static)",
    detail: "Static-adapter builds.",
    requirement: "Run npm run build, zip the contents of the build/ or dist/ folder",
  },
];

const UPCOMING = [
  "PHP / WordPress",
  "Node.js / Express backends",
  "Python (Django, Flask)",
  "Ruby on Rails",
];

const SECTIONS = [
  { id: "how-to-deploy", label: "How to Deploy", icon: Rocket },
  { id: "supported-types", label: "Supported Project Types", icon: Layers },
  { id: "file-requirements", label: "File Requirements", icon: FileCode },
  { id: "roadmap", label: "On the Roadmap", icon: Clock },
  { id: "get-help", label: "Get Expert Help", icon: Headset },
];

export default function Docs() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );

    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="font-bebas text-5xl text-slate-900 mb-3">Documentation</h1>
        <p className="text-slate-500 mb-10 leading-relaxed">
          Everything you need to know to deploy your site on Chasqr.
        </p>

        <div className="flex gap-10 items-start">
          {/* Sidebar */}
          <nav className="w-56 shrink-0 sticky top-28 hidden md:block">
            <div className="space-y-0.5">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const active = activeId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      active ? "bg-primary-light text-primary" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={15} className={active ? "text-primary" : "text-slate-400"} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Mobile section selector */}
          <div className="md:hidden w-full mb-2">
            <select
              value={activeId}
              onChange={(e) => scrollTo(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium bg-white"
            >
              {SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 min-w-0 max-w-3xl"
          >
            {/* How to deploy */}
            <section
              id="how-to-deploy"
              ref={(el) => { sectionRefs.current["how-to-deploy"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-5">How to Deploy</h2>
              <div className="space-y-4">
                {[
                  {
                    icon: <FolderArchive size={18} />,
                    title: "1. Prepare your files",
                    desc: "Make sure your project has an index.html file at the root level (see Supported Project Types below for framework-specific steps).",
                  },
                  {
                    icon: <Rocket size={18} />,
                    title: "2. Upload",
                    desc: "Go to Deploy, name your site, and upload either a ZIP file or select your project folder directly.",
                  },
                  {
                    icon: <Globe size={18} />,
                    title: "3. Go live instantly",
                    desc: "You'll get a shareable URL immediately. Connect your own custom domain anytime from the site's settings — free SSL included.",
                  },
                ].map((step) => (
                  <div key={step.title} className="flex gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-9 h-9 shrink-0 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-primary">
                      {step.icon}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{step.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Supported project types */}
            <section
              id="supported-types"
              ref={(el) => { sectionRefs.current["supported-types"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-2">Supported Project Types</h2>
              <p className="text-sm text-slate-500 mb-5">
                Chasqr hosts static files — plain sites, or the compiled output of frontend frameworks.
              </p>
              <div className="space-y-3">
                {SUPPORTED.map((s) => (
                  <div key={s.name} className="p-4 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                      <p className="font-medium text-slate-800 text-sm">{s.name}</p>
                    </div>
                    <p className="text-xs text-slate-500 ml-[1.65rem] mb-1">{s.detail}</p>
                    <p className="text-xs text-slate-600 ml-[1.65rem] font-mono bg-slate-50 border border-slate-200 rounded px-2 py-1 inline-block">
                      {s.requirement}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* File requirements */}
            <section
              id="file-requirements"
              ref={(el) => { sectionRefs.current["file-requirements"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-5">File Requirements</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileCode size={15} className="text-primary" />
                    <p className="font-medium text-slate-800 text-sm">index.html is mandatory</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    It must sit at the root of your ZIP — not inside a subfolder. If your build tool
                    outputs a nested folder, zip the folder's contents, not the folder itself.
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Lock size={15} className="text-amber-500" />
                    <p className="font-medium text-slate-800 text-sm">Size limits</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Uploads up to 5 MB are free. Larger uploads require a one-time payment per
                    site — after that, the site can be redeployed at any size, forever.
                  </p>
                </div>
              </div>
            </section>

            {/* Not yet supported */}
            <section
              id="roadmap"
              ref={(el) => { sectionRefs.current["roadmap"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-2">On the Roadmap</h2>
              <p className="text-sm text-slate-500 mb-5">
                These require running a server-side language at request time, which Chasqr doesn't
                support yet — currently we host static files only.
              </p>
              <div className="flex flex-wrap gap-2">
                {UPCOMING.map((u) => (
                  <span
                    key={u}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full"
                  >
                    <Clock size={11} /> {u}
                  </span>
                ))}
              </div>
            </section>

            {/* Need help */}
            <section
              id="get-help"
              ref={(el) => { sectionRefs.current["get-help"] = el; }}
              className="p-6 bg-primary-light border border-primary/20 rounded-2xl scroll-mt-28"
            >
              <h2 className="font-bebas text-2xl text-slate-900 mb-1.5">Not technical? Get expert help</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                If you're not comfortable running build commands yourself, deploy any version of
                your site and chat with a verified expert from your site's dashboard — they can
                make the changes for you.
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm"
              >
                Go to Dashboard
              </Link>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
