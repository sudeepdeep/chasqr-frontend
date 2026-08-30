import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCode,
  FolderGit2,
  Globe,
  Headset,
  Image as ImageIcon,
  Info,
  Layers,
  LayoutTemplate,
  Lightbulb,
  Link2,
  LifeBuoy,
  Mail,
  Maximize2,
  MessageCircle,
  Palette,
  Paintbrush,
  Pencil,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useInShell } from "../layout/shellContext";
import ImageLightbox from "../components/ImageLightbox";

const API_URL = process.env.REACT_APP_API_URL || "https://api.chasqr.com";
const APP_DOMAIN = process.env.REACT_APP_APP_DOMAIN || "chasqr.com";
// Mirrors the A record shown in a site's Custom Domain tab.
const SITE_IP = "137.184.18.70";

const SUPPORTED = [
  {
    name: "Plain HTML / CSS / JS",
    detail: "Any static website — no build step needed.",
    requirement: "Zip your files with index.html at the root",
  },
  {
    name: "React (Create React App)",
    detail: "Classic CRA projects.",
    requirement: "npm run build → zip the contents of build/",
  },
  {
    name: "React / Vue / Svelte (Vite)",
    detail: "Vite-powered projects of any flavour.",
    requirement: "npm run build → zip the contents of dist/",
  },
  {
    name: "Angular",
    detail: "Angular CLI projects.",
    requirement:
      "ng build → zip the contents of dist/<project>/ (or dist/<project>/browser on v17+)",
  },
  {
    name: "Next.js (static export only)",
    detail: "Requires output: 'export' — SSR and API routes are not supported.",
    requirement: "next build → zip the contents of out/",
  },
  {
    name: "Astro, Hugo, Jekyll, Eleventy…",
    detail: "Any static site generator works the same way.",
    requirement: "Run its build → zip the contents of the output folder",
  },
];

const UPCOMING = [
  "PHP / WordPress",
  "Node.js / Express backends",
  "Python (Django, Flask)",
  "Ruby on Rails",
];

const PALETTE_GROUPS = [
  {
    title: "Elements",
    items:
      "Heading, Text, Image, Button, Form, Embed, Carousel, Tags / pills, Tabs, Navbar, Search bar, Marquee",
    note: "Dropped into the column you currently have selected.",
  },
  {
    title: "Utilities (card parts)",
    items: "Rating (stars), Price, Tags / pills, Button",
    note: "Small pieces for composing your own cards.",
  },
  {
    title: "Form templates",
    items: "Split Form, Agency Form, Survey Step Form",
    note: "Ready-made contact forms, already wired to your Submissions tab.",
  },
  {
    title: "Banners & sections",
    items:
      "Navbar, Navbar + search, Text over image, Image banner, Carousel slider, Image + text, Footer (4 columns), Footer (simple)",
    note: "Each one adds a whole new section to the page.",
  },
  {
    title: "Card templates",
    items:
      "Showcase card, Image overlay cards, Hover reveal cards, Multi-image carousel, Product-card carousel, Image-top cards, Profile cards, Text cards, Pricing (3 tiers), Testimonials, Call to action",
    note: "Complete, styled sections you can edit block by block.",
  },
  {
    title: "Effects",
    items:
      "Glassmorphism, Gradient, Soft shadow, Rounded, Hero height, Glass navbar",
    note: "Applied to the selected (or most recent) section.",
  },
];

const ADMIN_TABS = [
  {
    group: "Settings",
    rows: [
      ["Site URL", "Change the free chasqr.com subdomain your site lives on."],
      ["Custom Domain", "Connect a domain you own. Free on every site."],
      [
        "Update Files",
        "Replace your site's files with a new build, keeping the same URL.",
      ],
      [
        "GitHub",
        "For imported sites: the connected repo, auto-deploy, and deploy history.",
      ],
    ],
  },
  {
    group: "Content",
    rows: [
      ["Editor", "Edit the text, images and links on your live pages."],
      ["Layout", "Open the full-screen visual builder for this page."],
      ["Colors", "Recolour the site — every colour found in its styles."],
      ["SEO", "Audit, auto-fix, favicon, and per-page meta tags."],
      ["Analytics", "Visits over the last 30 days."],
      ["Submissions", "Contact-form messages, and form connection settings."],
    ],
  },
  {
    group: "Help",
    rows: [
      ["Expert Help", "Chat with a verified expert about this specific site."],
    ],
  },
];

const TROUBLESHOOTING = [
  {
    q: '"No index.html found in zip"',
    a: "Your ZIP has the project inside a folder. Open the build output folder, select everything inside it, and zip that — index.html must sit at the very top level of the archive.",
  },
  {
    q: "Site is live but the styling and images are missing",
    a: "You most likely uploaded your source folder instead of the build output. Run your framework's build command and upload the generated build/ or dist/ folder. If you wrote plain HTML, check that your CSS and image paths match the file names in the ZIP (they are case-sensitive).",
  },
  {
    q: 'Editor says "No editable content found"',
    a: "That site is served as a live JavaScript app (React, Vue, Angular built output, or you ticked the interactive option on upload). Its pages are built in the browser, so there is no HTML text for the panel to edit. Change the content in your code and redeploy from Update Files. Hosting, custom domains, SEO and analytics all still work.",
  },
  {
    q: "Custom domain shows my registrar's parking page",
    a: "An old A or CNAME record is still in place, or DNS has not refreshed yet. Delete any other record with the same name, keep only the A record pointing at Chasqr, and give it up to a few hours.",
  },
  {
    q: '"404 — Site not found" on my custom domain',
    a: "The domain reaches us, but no live site claims it. Check the spelling in the Custom Domain tab (including www), make sure it is saved on the right site, and make sure the site is not paused on your dashboard.",
  },
  {
    q: "Browser warns the certificate is invalid",
    a: "HTTPS is issued the first time your domain reaches us, so it only works once DNS has propagated and the domain is saved in Chasqr. Confirm both, then reload after a minute.",
  },
  {
    q: "Upload is blocked by a payment prompt",
    a: "The upload is over the 5 MB free limit. Either trim the build (large images and unused assets are the usual culprits) or make the one-time payment, which upgrades that site to PRO and removes the size limit for good.",
  },
  {
    q: "Form submissions are not arriving",
    a: "Open the Submissions tab and check the form shows as Connected. Every field also needs a name attribute, and the site must be live — a paused site rejects submissions.",
  },
  {
    q: "My repository isn't in the import list",
    a: 'Chasqr only sees the repositories you granted it. Use "Adjust which ones Chasqr can access" at the bottom of the list to add more on GitHub, then hit refresh. Note that a repository owned by an organisation may need an owner to approve the installation.',
  },
  {
    q: "The import says there's no index.html",
    a: "Your built output isn't committed — most frameworks gitignore dist/ and build/ by default. Build locally, commit that folder, and import again. If the error lists folders it did find, pick one of those instead.",
  },
  {
    q: "I pushed but the site didn't update",
    a: "Check the GitHub tab on your site — it records the outcome of every attempt. Confirm auto-deploy is on and that you pushed to the connected branch; pushes to other branches are ignored by design. If the last deploy shows as skipped or failed, the message there says why, and your previous version is still serving.",
  },
];

const SECTION_GROUPS: {
  label: string;
  items: { id: string; label: string; icon: any }[];
}[] = [
  {
    label: "Start here",
    items: [{ id: "getting-started", label: "Getting Started", icon: Rocket }],
  },
  {
    label: "Build without code",
    items: [
      { id: "visual-builder", label: "Create a Site", icon: Paintbrush },
      { id: "builder-guide", label: "Using the Builder", icon: LayoutTemplate },
      { id: "builder-sections", label: "Sections & Cards", icon: Layers },
    ],
  },
  {
    label: "Deploy your code",
    items: [
      { id: "import-github", label: "Import from GitHub", icon: FolderGit2 },
      { id: "deploy-code", label: "Upload Your Files", icon: UploadCloud },
      { id: "supported-types", label: "Supported Projects", icon: Layers },
      { id: "file-requirements", label: "File Requirements", icon: FileCode },
    ],
  },
  {
    label: "Manage your site",
    items: [
      { id: "site-dashboard", label: "Site Dashboard", icon: Settings },
      { id: "content-editor", label: "Edit Text & Images", icon: Pencil },
      { id: "update-files", label: "Update Your Files", icon: UploadCloud },
      { id: "colors", label: "Colors", icon: Palette },
      { id: "site-url", label: "Site URL", icon: Link2 },
      { id: "custom-domains", label: "Custom Domain", icon: Globe },
    ],
  },
  {
    label: "Grow your site",
    items: [
      { id: "seo", label: "SEO", icon: Search },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
      { id: "contact-forms", label: "Contact Forms", icon: Mail },
    ],
  },
  {
    label: "Account & help",
    items: [
      { id: "account", label: "Account & Security", icon: ShieldCheck },
      { id: "pro-billing", label: "PRO & Billing", icon: CreditCard },
      { id: "expert-help", label: "Expert Help", icon: Headset },
      { id: "troubleshooting", label: "Troubleshooting", icon: LifeBuoy },
      { id: "roadmap", label: "Coming Soon", icon: Clock },
      { id: "get-help", label: "Still Stuck?", icon: MessageCircle },
    ],
  },
];

const ALL_SECTIONS = SECTION_GROUPS.flatMap((g) => g.items);

/* ── Small building blocks ────────────────────────────────────────────────── */

type Refs = React.MutableRefObject<Record<string, HTMLElement | null>>;

function Sec({
  id,
  title,
  intro,
  refs,
  children,
}: {
  id: string;
  title: string;
  intro?: React.ReactNode;
  refs: Refs;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      ref={(el) => {
        refs.current[id] = el;
      }}
      className="mb-16 scroll-mt-28"
    >
      <h2 className="font-bebas text-3xl text-slate-900 mb-3">{title}</h2>
      {intro && (
        <p className="text-sm text-slate-600 leading-relaxed mb-6">{intro}</p>
      )}
      {children}
    </section>
  );
}

/** Numbered walkthrough. Children must be <Step> elements. */
function Steps({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  return (
    <div>
      {items.map((child, i) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
              n: i + 1,
              last: i === items.length - 1,
            })
          : child,
      )}
    </div>
  );
}

function Step({
  n,
  title,
  last,
  children,
}: {
  n?: number;
  title: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <span className="w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">
          {n}
        </span>
        {!last && <span className="w-px flex-1 bg-slate-200 my-1.5" />}
      </div>
      <div className={`min-w-0 flex-1 ${last ? "pb-0" : "pb-7"}`}>
        <h3 className="font-semibold text-slate-900 text-sm mb-1.5">{title}</h3>
        <div className="text-sm text-slate-600 leading-relaxed space-y-2.5">
          {children}
        </div>
      </div>
    </div>
  );
}

const NOTE_STYLES: Record<string, { box: string; icon: any; text: string }> = {
  info: {
    box: "border-primary/20 bg-primary-light/40",
    icon: Info,
    text: "text-primary",
  },
  tip: {
    box: "border-green-200 bg-green-50/60",
    icon: Lightbulb,
    text: "text-green-600",
  },
  warn: {
    box: "border-amber-200 bg-amber-50/60",
    icon: AlertTriangle,
    text: "text-amber-600",
  },
};

function Note({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "tip" | "warn";
  title?: string;
  children: React.ReactNode;
}) {
  const s = NOTE_STYLES[tone];
  const Icon = s.icon;
  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${s.box}`}>
      <Icon size={15} className={`shrink-0 mt-0.5 ${s.text}`} />
      <div className="text-sm text-slate-700 leading-relaxed">
        {title && (
          <span className="font-semibold text-slate-900 block mb-0.5">
            {title}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

/**
 * Screenshot with a caption. `n` is the doc-<n>.png in /public/images.
 * `pending` renders a placeholder instead — drop the prop once the image
 * has been added, rather than shipping a broken <img>.
 */
function Shot({
  n,
  alt,
  pending,
}: {
  n: number;
  alt: string;
  pending?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (pending) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-400">
        <ImageIcon size={13} className="shrink-0" />
        <span>Screenshot — {alt}</span>
      </div>
    );
  }

  const src = `${process.env.PUBLIC_URL || ""}/images/doc-${n}.png`;

  return (
    <figure className="my-1">
      {/* Dark window chrome for the same reason as the landing page: these are
          screenshots of a white UI, and on a white page they otherwise have no
          edge at all. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Enlarge screenshot: ${alt}`}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl bg-[#1d1f21] text-left shadow-sm ring-1 ring-slate-900/10"
      >
        <div className="flex items-center gap-1.5 border-b border-black/40 bg-[#2c2f31] px-3 h-8">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>

        <img src={src} alt={alt} loading="lazy" className="w-full bg-white" />

        <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-slate-900/85 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 size={12} />
          Click to enlarge
        </span>
      </button>

      <figcaption className="text-xs text-slate-400 mt-2 leading-relaxed">
        {alt}
      </figcaption>

      {/* Each Shot carries its own viewer rather than the page owning one:
          Shot is used deep inside the article body in ~17 places, and threading
          a callback down to every one of them would touch far more of this
          file than the feature is worth. Only one can be open at a time in
          practice, and the viewer portals to <body> regardless. */}
      <ImageLightbox
        src={open ? src : null}
        alt={alt}
        caption={alt}
        onClose={() => setOpen(false)}
      />
    </figure>
  );
}

function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[.8em] bg-slate-100 text-slate-700 border border-slate-200 rounded px-1.5 py-0.5">
      {children}
    </code>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="text-[11px] leading-relaxed bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto">
      <code>{children}</code>
    </pre>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 border border-slate-200 rounded-xl">
      <h4 className="font-semibold text-slate-900 text-sm mb-2">{title}</h4>
      <div className="text-sm text-slate-600 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function Docs() {
  // Signed in this page sits in the app shell, whose header takes up its
  // own space; the public navbar is fixed and has to be cleared.
  const inShell = useInShell();
  const [activeId, setActiveId] = useState(ALL_SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Scroll-spy. An IntersectionObserver band leaves the last few (short)
  // sections permanently unhighlighted once the page can't scroll any further,
  // so the active item is derived from positions instead — and the bottom of
  // the page always maps to the last section.
  useEffect(() => {
    const ids = ALL_SECTIONS.map((s) => s.id);

    const compute = () => {
      const doc = document.documentElement;
      const atBottom =
        window.scrollY + window.innerHeight >= doc.scrollHeight - 2;
      if (atBottom) {
        setActiveId(ids[ids.length - 1]);
        return;
      }
      const line = 160; // just below the sticky navbar
      let current = ids[0];
      for (const id of ids) {
        const el = sectionRefs.current[id];
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = id;
        else break;
      }
      setActiveId(current);
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        compute();
      });
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && sectionRefs.current[hash]) {
      setTimeout(
        () =>
          sectionRefs.current[hash]?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        120,
      );
    }
  }, []);

  const scrollTo = useCallback((id: string) => {
    setActiveId(id);
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const refs = sectionRefs;

  return (
    <div className={`min-h-screen bg-white pb-20 px-6 ${inShell ? "pt-10" : "pt-28"}`}>
      <div className="max-w-[1200px] mx-auto">
        <h1 className="font-bebas text-5xl text-slate-900 mb-3">
          Documentation
        </h1>
        <p className="text-slate-500 mb-10 leading-relaxed max-w-2xl">
          Everything Chasqr can do, step by step — building a site visually
          without code, deploying a project you already have, and running it
          once it's live.
        </p>

        <div className="flex gap-10 items-start">
          {/* Sidebar */}
          <nav className="w-56 shrink-0 sticky top-28 hidden md:block max-h-[calc(100vh-9rem)] overflow-y-auto pb-6">
            {SECTION_GROUPS.map((group) => (
              <div key={group.label} className="mb-5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-3 mb-1.5">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((s) => {
                    const Icon = s.icon;
                    const active = activeId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => scrollTo(s.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                          active
                            ? "bg-primary-light text-primary"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon
                          size={15}
                          className={active ? "text-primary" : "text-slate-400"}
                        />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Mobile section selector */}
          <div className="md:hidden w-full mb-2">
            <select
              value={activeId}
              onChange={(e) => scrollTo(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium bg-white"
            >
              {ALL_SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 min-w-0 max-w-3xl"
          >
            {/* ── Getting started ───────────────────────────────────────── */}
            <Sec
              id="getting-started"
              title="Getting Started"
              refs={refs}
              intro="Chasqr hosts websites and gives you a visual builder to make them. There are three ways in, and nothing stops you using all of them — one site built by hand, another imported from a repo."
            >
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="p-5 border border-slate-200 rounded-xl">
                  <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-light text-primary mb-3">
                    <FolderGit2 size={18} />
                  </span>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">
                    Import from GitHub
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Connect a repository and deploy the built output committed
                    in it — then let every push update the live site
                    automatically.
                  </p>
                </div>
                <div className="p-5 border border-slate-200 rounded-xl">
                  <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-light text-primary mb-3">
                    <UploadCloud size={18} />
                  </span>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">
                    Upload your files
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Already have HTML/CSS/JS, or a built React, Vue, Angular or
                    Svelte app? Drop in a ZIP or a folder and it's online in
                    seconds.
                  </p>
                </div>
                <div className="p-5 border border-slate-200 rounded-xl">
                  <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-light text-primary mb-3">
                    <Paintbrush size={18} />
                  </span>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">
                    Build from scratch
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Start with a blank page and drop in headings, images,
                    buttons, forms, a navbar and a footer. No code at any point.
                  </p>
                </div>
              </div>

              <Steps>
                <Step title="Create your account">
                  Sign up with your email and verify it, or use{" "}
                  <strong>Continue with Google</strong> or{" "}
                  <strong>Sign up with GitHub</strong> to skip straight past the
                  form. Signing in with GitHub doesn't give Chasqr access to any
                  of your code — that's a separate, per-repository step you take
                  later, only if you want to import something.
                </Step>
                <Step title="Open your dashboard">
                  Your dashboard lists every site you own. Click{" "}
                  <strong>New Site</strong> in the top right — or{" "}
                  <strong>Create Your First Site</strong> if the list is still
                  empty.
                  <Shot
                    n={1}
                    alt="Your dashboard — Create Your First Site while it's empty, or the New Site button once you have sites."
                  />
                </Step>
                <Step title="Choose how to build it">
                  A dialog asks how you want to build:{" "}
                  <strong>Import from GitHub</strong>,{" "}
                  <strong>Deploy existing code</strong>, or{" "}
                  <strong>Build from scratch</strong>. Pick one — the
                  walkthroughs below cover each path in full.
                  <Shot
                    n={2}
                    alt="Choosing how to build: deploy existing code, or build from scratch."
                  />
                </Step>
                <Step title="You're live">
                  Every site is published the moment it is created, at{" "}
                  <C>https://your-name.{APP_DOMAIN}</C> with HTTPS already in
                  place. Connecting your own domain is free and takes about five
                  minutes.
                </Step>
              </Steps>
            </Sec>

            {/* ── Create a site (visual) ────────────────────────────────── */}
            <Sec
              id="visual-builder"
              title="Create a Site Without Code"
              refs={refs}
              intro="This is the “Build from scratch” path. It takes about a minute to get a blank page created and the builder open."
            >
              <Steps>
                <Step title="Dashboard → New Site → Build from scratch">
                  You'll land on the <strong>Build A Site</strong> page.
                  <Shot
                    n={3}
                    alt="The Build A Site form — site name, optional custom URL, and the button that opens the builder."
                  />
                </Step>
                <Step title="Enter a site name">
                  Required, up to 60 characters. This is the label you'll see on
                  your dashboard — visitors never see it, and you can rename it
                  later. Examples: “Portfolio”, “Coffee Shop”, “Client — Acme”.
                </Step>
                <Step title="Pick a custom URL (optional)">
                  <p>
                    This becomes your free subdomain. Type <C>my-portfolio</C>{" "}
                    and your site lives at{" "}
                    <C>https://my-portfolio.{APP_DOMAIN}</C>.
                  </p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Lowercase letters, numbers and hyphens only</li>
                    <li>Between 3 and 50 characters</li>
                    <li>Leave it blank and we'll generate one for you</li>
                    <li>
                      Changeable later from the site's <strong>Site URL</strong>{" "}
                      tab
                    </li>
                  </ul>
                </Step>
                <Step title="Click “Create & Start Building”">
                  The blank site is created and the full-screen builder opens
                  immediately on a white page.
                </Step>
                <Step title="Design, then Save & Deploy">
                  Nothing is published until you press{" "}
                  <strong>Save &amp; Deploy</strong> in the builder's top-right
                  corner — and every press publishes straight to your live URL.
                  <Note tone="tip" title="Coming back later">
                    Dashboard → <strong>Edit</strong> on the site card →{" "}
                    <strong>Layout</strong> tab →{" "}
                    <strong>Open full-screen builder</strong>.
                  </Note>
                </Step>
              </Steps>
            </Sec>

            {/* ── Using the builder ─────────────────────────────────────── */}
            <Sec
              id="builder-guide"
              title="Using the Builder"
              refs={refs}
              intro="The builder takes over the whole screen: a toolbar across the top, the element palette down the left, and your page in the middle."
            >
              <Shot
                n={4}
                alt="The full-screen builder: toolbar across the top, element palette down the left, canvas in the middle."
              />

              <h3 className="font-semibold text-slate-900 text-base mt-8 mb-3">
                The top toolbar
              </h3>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 mb-8">
                {[
                  [
                    "Back",
                    "Leaves the builder and returns to the site's Layout tab. Save first.",
                  ],
                  [
                    "Desktop / Mobile",
                    "Switches the canvas between full width and a phone-sized frame so you can check both.",
                  ],
                  [
                    "Background",
                    "Page-wide settings: background colour or gradient, page font, scroll animations, and page padding.",
                  ],
                  [
                    "Navbar",
                    "Turns the top navigation on and edits its brand, links, dropdowns and style.",
                  ],
                  [
                    "Footer",
                    "Turns the footer on and edits its text, links and colours.",
                  ],
                  [
                    "Preview site",
                    "Opens your published site in a new tab — what visitors currently see.",
                  ],
                  [
                    "Save & Deploy",
                    "Publishes the page. Greyed out until you have unsaved changes.",
                  ],
                ].map(([name, desc]) => (
                  <div key={name} className="flex gap-4 p-4">
                    <p className="w-36 shrink-0 text-sm font-medium text-slate-800">
                      {name}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>

              <h3 className="font-semibold text-slate-900 text-base mb-3">
                The basic loop
              </h3>
              <div className="mb-8">
                <Steps>
                  <Step title="Add a section">
                    Click <strong>Add Section</strong> at the top of the left
                    palette. A section is a horizontal band across your page and
                    holds one or more columns.
                  </Step>
                  <Step title="Select the column you want to fill">
                    Click inside a column — the selected one is highlighted with
                    a blue outline. New elements always land there.
                  </Step>
                  <Step title="Click an element in the palette">
                    Clicking (not dragging) an element drops it into the
                    selected column. To rearrange afterwards, drag blocks around
                    the canvas — including from one column to another.
                  </Step>
                  <Step title="Style it">
                    Click any block to reveal its toolbar: text and colours,
                    size, alignment, spacing, links, image upload, and the
                    options specific to that block.
                  </Step>
                  <Step title="Save & Deploy">
                    Publishes everything at once. Use{" "}
                    <strong>Preview site</strong> to check the result on the
                    real URL.
                  </Step>
                </Steps>
              </div>

              <h3 className="font-semibold text-slate-900 text-base mb-3">
                What's in the palette
              </h3>
              <div className="space-y-3 mb-8">
                {PALETTE_GROUPS.map((g) => (
                  <div
                    key={g.title}
                    className="p-4 border border-slate-200 rounded-xl"
                  >
                    <p className="font-medium text-slate-800 text-sm mb-1">
                      {g.title}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {g.items}
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5">{g.note}</p>
                  </div>
                ))}
              </div>

              <Note
                tone="info"
                title="Page-wide settings live under “Background”"
              >
                Set one background colour or gradient for the whole page, choose
                a page font from 20 Google Fonts (Inter, Poppins, Playfair
                Display, Bebas Neue and more), turn on scroll animations so
                sections fade in as visitors scroll, and add page padding.
                Individual sections can override the font and background.
              </Note>
            </Sec>

            {/* ── Sections & cards ──────────────────────────────────────── */}
            <Sec
              id="builder-sections"
              title="Sections, Columns & Cards"
              refs={refs}
              intro="Three levels of structure: sections stack down the page, columns split a section left-to-right, and blocks (text, images, buttons) sit inside columns. Styling any of the three works the same way — select it, then use its panel."
            >
              <div className="space-y-4 mb-8">
                <Card title="Sections">
                  <p>
                    Select a section to set its background colour, gradient or
                    image with an overlay; rounded corners; padding and margins;
                    full-width or a percentage width; a minimum height (useful
                    for hero banners); its own font; an entrance animation; and
                    vertical alignment of its content.
                  </p>
                  <p>
                    Use the arrows in the section header to move a whole section
                    up or down the page.
                  </p>
                </Card>
                <Card title="Columns">
                  <p>
                    Split a section into columns and drag the divider to change
                    the balance — 50/50, 30/70, three across, whatever the
                    layout needs.
                  </p>
                </Card>
                <Card title="Turning a column into a card">
                  <p>
                    Give a column its own background, padding, rounded corners,
                    shadow, border, background image with overlay and a minimum
                    height, and it reads as a card. Add a hover effect — lift,
                    zoom or reveal — for interactive tiles.
                  </p>
                  <Shot
                    n={5}
                    alt="A section split into two columns, each turned into a card with its own background, padding, rounding and hover effect."
                  />
                </Card>
                <Card title="Navbar & footer">
                  <p>
                    Both are toggled from the top toolbar and are page-wide, not
                    part of any section. The navbar takes a brand name or logo
                    image plus links, each of which can have its own dropdown
                    sub-links, and supports a glass style. The footer takes
                    text, links and its own colours.
                  </p>
                </Card>
                <Card title="Forms">
                  <p>
                    Drop in a <strong>Form</strong> element — or one of the
                    three form templates — and it's already connected. Field
                    types include text, email, phone, long text, dropdown, pill
                    choices, checkbox, file and number; each field has a label,
                    a name, an optional placeholder, a required toggle and a
                    half- or full-width setting.
                  </p>
                  <p>
                    Submissions appear in the site's{" "}
                    <strong>Submissions</strong> tab and are emailed to you. No
                    extra setup.
                  </p>
                </Card>
              </div>

              <Note tone="warn">
                The builder edits one page at a time. Multi-page sites deployed
                from code keep their page tabs — pick the page first, then open
                the builder for it.
              </Note>
            </Sec>

            {/* ── Import from GitHub ────────────────────────────────────── */}
            <Sec
              id="import-github"
              title="Import From GitHub"
              refs={refs}
              intro="Connect a repository once and Chasqr deploys the built output committed in it — then redeploys automatically every time you push. Private repositories work exactly the same as public ones."
            >
              <Note tone="warn" title="Chasqr doesn't run your build">
                We serve static files, so there's no <C>npm run build</C> step
                on our side. Your repository must contain the finished output —
                a committed <C>dist/</C>, <C>build/</C> or <C>out/</C> folder,
                or plain HTML at the root. If your repo only holds source, build
                it locally and commit the output folder before importing.
              </Note>

              <div className="mt-8">
                <Steps>
                  <Step title="Dashboard → New Site → Import from GitHub">
                    The first time through, you'll be asked to connect your
                    GitHub account.
                    <Shot
                      n={15}
                      alt="The Import from GitHub page before a GitHub account is connected."
                    />
                  </Step>

                  <Step title="Choose which repositories Chasqr can see">
                    <p>
                      GitHub asks you to install the Chasqr app. You pick either{" "}
                      <strong>All repositories</strong> or{" "}
                      <strong>Only select repositories</strong> — we'd suggest
                      selecting just the ones you plan to deploy. You can change
                      the list any time from GitHub.
                    </p>
                    <p>
                      Chasqr only ever asks for <strong>read</strong> access to
                      repository contents. It cannot push, open pull requests,
                      or change anything in your code.
                    </p>
                  </Step>

                  <Step title="Pick the repository and branch">
                    Your repositories are listed most-recently-updated first,
                    with a search box. Choose one, then pick the branch to
                    deploy from — usually <C>main</C>.
                    <Shot
                      n={16}
                      alt="Choosing a repository, branch and output folder in the import wizard."
                    />
                  </Step>

                  <Step title="Confirm the output folder">
                    <p>
                      Chasqr scans the branch for <C>index.html</C> and offers
                      the folders it finds, preselecting the most likely one (
                      <C>dist</C>, <C>build</C> and <C>out</C> rank first). Pick{" "}
                      <strong>Repository root</strong> if your HTML sits at the
                      top level.
                    </p>
                    <p>
                      If nothing is found you'll get a text box and a warning —
                      that almost always means the built output isn't committed
                      yet.
                    </p>
                  </Step>

                  <Step title="Name it and choose your options">
                    <p>
                      Site name and custom URL work exactly as everywhere else.
                      Two checkboxes matter here:
                    </p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>
                        <strong>Redeploy automatically on every push</strong> —
                        on by default, and the reason most people use this.
                      </li>
                      <li>
                        <strong>This is an interactive app</strong> — same
                        meaning as on the upload page: tick it for React/Vue/
                        Angular apps that need live JavaScript, leave it off for
                        regular sites so you can edit text and images in the
                        panel.
                      </li>
                    </ul>
                  </Step>

                  <Step title="Deploy From GitHub">
                    We pull the branch, deploy that folder, and your site is
                    live. From here on, pushing to that branch updates it on its
                    own.
                  </Step>
                </Steps>
              </div>

              <h3 className="font-semibold text-slate-900 text-base mt-10 mb-3">
                Automatic deploys
              </h3>
              <div className="space-y-3 mb-6">
                <Card title="What triggers one">
                  <p>
                    Any push to the branch you connected. Pushes to other
                    branches, and tags, are ignored. Your site normally updates
                    within a minute.
                  </p>
                </Card>
                <Card title="Watching what happened">
                  <p>
                    Open your site → <strong>Settings</strong> →{" "}
                    <strong>GitHub</strong>. It shows the connected repo, branch
                    and folder, the auto-deploy toggle, and the result of the
                    last deploy with its commit and timestamp — so a push that
                    didn't take is visible rather than silent.
                  </p>
                  <Shot
                    n={17}
                    alt="The GitHub tab on a site, showing the connected repo, auto-deploy toggle and last deploy status."
                  />
                </Card>
                <Card title="When a deploy is skipped">
                  <p>
                    An automatic deploy never spends money. If a free site's
                    build grows past the 5 MB limit, the deploy is recorded as{" "}
                    <strong>skipped</strong> with an explanation and{" "}
                    <strong>your live site is left exactly as it was</strong> —
                    no credit is consumed and nothing breaks. Upgrade the site
                    to PRO and the next push goes through.
                  </p>
                </Card>
                <Card title="When a deploy fails">
                  <p>
                    Same principle: if the commit you pushed has no{" "}
                    <C>index.html</C> in the configured folder, the failure is
                    recorded and the previously deployed version keeps serving.
                    A broken commit can't take your site down.
                  </p>
                </Card>
                <Card title="Deploying on demand">
                  <p>
                    <strong>Redeploy latest commit</strong> in the GitHub tab
                    pulls the current branch immediately — handy if you turned
                    auto-deploy off, or a webhook was missed.
                  </p>
                </Card>
                <Card title="Disconnecting">
                  <p>
                    <strong>Disconnect</strong> unlinks the repository; your
                    site stays online exactly as last deployed and simply stops
                    updating. To revoke Chasqr's access entirely, remove the app
                    from GitHub → Settings → Applications.
                  </p>
                </Card>
              </div>

              <Note tone="tip" title="Working with a framework">
                Most frameworks gitignore their build folder by default, which
                is the usual reason a first import finds no <C>index.html</C>.
                Either remove that line from <C>.gitignore</C> and commit the
                folder, or add a GitHub Action that builds and commits it on
                every push.
              </Note>
            </Sec>

            {/* ── Deploy existing code ──────────────────────────────────── */}
            <Sec
              id="deploy-code"
              title="Upload Your Files"
              refs={refs}
              intro="Chasqr serves static files. You upload the finished output of your project — not the source folder, and not node_modules. If your project lives on GitHub, importing it is usually less work than uploading."
            >
              <Steps>
                <Step title="Build your project first">
                  Run your framework's build command and note the output folder
                  (<C>build/</C>, <C>dist/</C> or <C>out/</C>). Skip this if you
                  wrote plain HTML/CSS/JS. Exact commands are in{" "}
                  <button
                    onClick={() => scrollTo("supported-types")}
                    className="text-primary hover:underline"
                  >
                    Supported Projects
                  </button>
                  .
                </Step>
                <Step title="Dashboard → New Site → Deploy existing code">
                  You'll land on the <strong>Deploy A Site</strong> page.
                </Step>
                <Step title="Name your site and pick a URL">
                  Same rules as before: a name for your dashboard, and an
                  optional subdomain of 3–50 lowercase characters. Selecting a
                  ZIP fills both in automatically from the file name.
                </Step>
                <Step title="Upload your files">
                  <p>Two options, both fine:</p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>
                      <strong>ZIP file</strong> — with <C>index.html</C> at the
                      top level of the archive
                    </li>
                    <li>
                      <strong>Folder</strong> — pick your build folder and the
                      browser uploads everything inside it, subfolders included
                    </li>
                  </ul>
                  <Shot
                    n={6}
                    alt="The Deploy A Site page — switch between Upload ZIP and Upload Files, then drop your build in."
                  />
                </Step>
                <Step title="Decide how the app should run">
                  <p>
                    Below the uploader is{" "}
                    <strong>“This is an interactive app — keep it live”</strong>
                    . It matters for React/Vue/Angular builds:
                  </p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>
                      <strong>Left unticked (default)</strong> — if your{" "}
                      <C>index.html</C> is an empty app shell, we render it once
                      and store the result as real HTML. Search engines see your
                      content and you can edit text and images from the Editor
                      tab. Interactive behaviour driven by JavaScript may not
                      survive.
                    </li>
                    <li>
                      <strong>Ticked</strong> — your app is served exactly as
                      built, JavaScript intact, so buttons, state and routing
                      all work. In-panel content editing and colour editing are
                      off; change content in code and redeploy.
                    </li>
                  </ul>
                </Step>
                <Step title="Click “Deploy Site”">
                  You're taken to the site's dashboard and the site is already
                  live at <C>https://your-slug.{APP_DOMAIN}</C>.
                </Step>
              </Steps>

              <div className="mt-8 space-y-4">
                <Note tone="tip" title="Client-side routes work">
                  A request for a path that doesn't match a file falls back to
                  your <C>index.html</C>, so deep links like <C>/about</C> in a
                  React Router or Vue Router app resolve correctly.
                </Note>
                <Note tone="tip" title="No base-path configuration needed">
                  Your site is served from the root of its own subdomain, so
                  absolute asset paths such as <C>/assets/app.js</C> work as-is
                  — no <C>homepage</C> or <C>base</C> setting to change.
                </Note>
              </div>
            </Sec>

            {/* ── Supported project types ───────────────────────────────── */}
            <Sec
              id="supported-types"
              title="Supported Project Types"
              refs={refs}
              intro="Anything that compiles down to static files. Build locally, upload the output."
            >
              <div className="space-y-3">
                {SUPPORTED.map((s) => (
                  <div
                    key={s.name}
                    className="p-4 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2
                        size={15}
                        className="text-green-500 shrink-0"
                      />
                      <p className="font-medium text-slate-800 text-sm">
                        {s.name}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 ml-[1.65rem] mb-1.5">
                      {s.detail}
                    </p>
                    <p className="text-xs text-slate-600 ml-[1.65rem] font-mono bg-slate-50 border border-slate-200 rounded px-2 py-1 inline-block">
                      {s.requirement}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <Note tone="warn" title="What doesn't work yet">
                  Anything that needs a server at request time — PHP, a Node
                  backend, Django, Rails, Next.js SSR or API routes. See{" "}
                  <button
                    onClick={() => scrollTo("roadmap")}
                    className="text-primary hover:underline"
                  >
                    Coming Soon
                  </button>
                  . Contact forms are the exception: those are handled for you.
                </Note>
              </div>
            </Sec>

            {/* ── File requirements ─────────────────────────────────────── */}
            <Sec id="file-requirements" title="File Requirements" refs={refs}>
              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <Card title="index.html at the root">
                  <p>
                    Mandatory, and it must sit at the top level of your ZIP —
                    not inside a wrapper folder. If your build tool produces a
                    folder, open it, select the contents, and zip those.
                  </p>
                  <p className="text-xs text-slate-400">
                    Otherwise the upload is rejected with “No index.html found”.
                  </p>
                </Card>
                <Card title="Size">
                  <p>
                    Uploads up to <strong>5 MB</strong> are free. Anything
                    larger needs a one-time payment, which upgrades that site to
                    PRO — after that it can be redeployed at any size, forever.
                  </p>
                </Card>
                <Card title="Everything else comes along">
                  <p>
                    HTML, CSS, JavaScript, images, fonts and other static assets
                    are all stored and served with the right content type,
                    keeping your folder structure intact.
                  </p>
                </Card>
                <Card title="Multiple pages">
                  <p>
                    Every <C>.html</C> file becomes a page you can edit, run SEO
                    checks against and track separately — they show up as tabs
                    in the Editor and SEO tabs.
                  </p>
                </Card>
              </div>
            </Sec>

            {/* ── Site dashboard ────────────────────────────────────────── */}
            <Sec
              id="site-dashboard"
              title="Your Site Dashboard"
              refs={refs}
              intro="Click Edit on any site card to open its dashboard. The card itself also has quick actions: open the live site, pause it, or delete it."
            >
              <Note tone="warn" title="Pausing takes the site offline">
                A paused site returns “404 — Site not found” on both its{" "}
                {APP_DOMAIN} subdomain and any custom domain, and stops
                accepting form submissions. Press play to bring it back.
              </Note>

              <div className="mt-6 mb-6">
                <Shot
                  n={7}
                  alt="A site's dashboard — plan, status and visits at the top, everything else grouped in the left navigation."
                />
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                The header shows the site's plan, whether it's live, and its
                visit count, with buttons to preview the site or upgrade it to
                PRO. Everything else lives in the left navigation:
              </p>

              <div className="space-y-5">
                {ADMIN_TABS.map((g) => (
                  <div key={g.group}>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                      {g.group}
                    </p>
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                      {g.rows.map(([name, desc]) => (
                        <div key={name} className="flex gap-4 p-4">
                          <p className="w-32 shrink-0 text-sm font-medium text-slate-800">
                            {name}
                          </p>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Sec>

            {/* ── Content editor ────────────────────────────────────────── */}
            <Sec
              id="content-editor"
              title="Editing Text & Images"
              refs={refs}
              intro="The Editor tab pulls every piece of text, every image and every link out of your page and lists them as editable fields — no HTML required."
            >
              <Steps>
                <Step title="Pick the page">
                  Sites with more than one page show a tab per file at the top.
                  Switching pages with unsaved changes asks for confirmation
                  first.
                </Step>
                <Step title="Filter to what you're changing">
                  The pills at the top — All, Text, Images, Links — narrow the
                  list, with a count on each.
                </Step>
                <Step title="Edit the values">
                  <p>
                    Type directly into a text field. For images, paste a URL or
                    upload a file from your device, and set alt text describing
                    the image (good for accessibility and SEO). Links take both
                    the visible label and the destination URL.
                  </p>
                  <Shot
                    n={8}
                    alt="The Editor tab — every text, image and link on the page as an editable field, with per-element actions on the right."
                  />
                </Step>
                <Step title="Restructure if you need to">
                  Each element has quick actions: <strong>Duplicate</strong>{" "}
                  (clones the whole card or tile it belongs to),{" "}
                  <strong>Hide</strong> (keeps it in the file but off the live
                  page), <strong>Delete</strong>, and <strong>Add below</strong>{" "}
                  to insert a new text, image or link element.
                </Step>
                <Step title="Save & Deploy">
                  A bar appears at the top of the screen counting your unsaved
                  changes, with <strong>Discard</strong> and{" "}
                  <strong>Save &amp; Deploy</strong>. Saving publishes to the
                  live site right away.
                </Step>
              </Steps>

              <div className="mt-6">
                <Note
                  tone="warn"
                  title="Not available for live JavaScript apps"
                >
                  React, Vue and Angular apps deployed with the interactive
                  option build their pages in the browser, so there's no HTML
                  text to edit here. Update the content in your code and
                  redeploy from <strong>Update Files</strong>.
                </Note>
              </div>
            </Sec>

            {/* ── Update files ──────────────────────────────────────────── */}
            <Sec
              id="update-files"
              title="Updating Your Files"
              refs={refs}
              intro="Shipped a new build? Update Files replaces the site's contents in place. (Sites imported from GitHub update themselves on every push — see the GitHub tab instead.)"
            >
              <Steps>
                <Step title="Open Settings → Update Files">
                  Choose <strong>ZIP File</strong> or <strong>Files</strong>,
                  matching how you want to upload.
                </Step>
                <Step title="Select the new build">
                  The same rule applies — <C>index.html</C> at the root.
                </Step>
                <Step title="Click “Redeploy Site”">
                  All existing files are replaced. Your URL, custom domain, SEO
                  settings, analytics history and form submissions are all kept.
                </Step>
              </Steps>

              <div className="mt-6 space-y-4">
                <Note tone="info" title="Size limits still apply">
                  On a free site, a redeploy over 5 MB prompts the same one-time
                  payment. PRO sites redeploy at any size.
                </Note>
                <Note tone="info" title="Attach source code (PRO)">
                  Below the uploader, PRO sites can attach a ZIP of the real
                  project source. It's never served on your public site — it
                  exists so an expert helping you gets your actual code rather
                  than compiled output.
                </Note>
              </div>
            </Sec>

            {/* ── Colors ───────────────────────────────────────────────── */}
            <Sec
              id="colors"
              title="Recolouring Your Site"
              refs={refs}
              intro="The Colors tab scans a page's stylesheets and lists every colour it uses, with how many times each one appears."
            >
              <Steps>
                <Step title="Choose the page">
                  Multi-page sites get a tab per page.
                </Step>
                <Step title="Click a swatch and pick a new colour">
                  Changed swatches are highlighted and show the value they
                  replaced. <strong>Reset</strong> undoes everything you haven't
                  saved.
                </Step>
                <Step title="Save">
                  The colour is replaced everywhere it's used, including in
                  shared stylesheets, and the site is redeployed.
                  <Shot
                    n={9}
                    alt="The Colors tab — every colour found in the page's styles, with how often each is used."
                  />
                </Step>
              </Steps>

              <div className="mt-6">
                <Note tone="warn">
                  Not available for live JavaScript apps — their styles are
                  bundled at build time. Change your theme in code and redeploy.
                </Note>
              </div>
            </Sec>

            {/* ── Site URL ─────────────────────────────────────────────── */}
            <Sec
              id="site-url"
              title="Changing Your Site URL"
              refs={refs}
              intro={`Every site gets a free subdomain on ${APP_DOMAIN}, with HTTPS included. You can change it whenever you like.`}
            >
              <Steps>
                <Step title="Open Settings → Site URL">
                  You'll see the current address with a <strong>Copy</strong>{" "}
                  button next to it.
                </Step>
                <Step title="Click “Edit URL”">
                  Type the new slug — 3 to 50 characters, lowercase letters,
                  numbers and hyphens. Anything else is stripped as you type.
                </Step>
                <Step title="Confirm with the tick">
                  The change is live immediately.
                </Step>
              </Steps>

              <div className="mt-6">
                <Note tone="warn" title="The old address stops working">
                  Nothing redirects from the previous subdomain, so update any
                  links, QR codes or social profiles that point at it.
                </Note>
              </div>
            </Sec>

            {/* ── Custom domains ───────────────────────────────────────── */}
            <Sec
              id="custom-domains"
              title="Connecting a Custom Domain"
              refs={refs}
              intro="Point a domain you own — example.com, or a subdomain like blog.example.com — at your Chasqr site. It's free on every site, and HTTPS is issued automatically. Budget five minutes of work plus some waiting for DNS."
            >
              <Note tone="info" title="Before you start">
                You need a domain from a registrar (GoDaddy, Namecheap,
                Cloudflare, Hostinger, Google Domains…) and access to its DNS
                settings. Domains typically cost $10–15 a year — Chasqr doesn't
                sell them.
              </Note>

              <div className="mt-6">
                <Steps>
                  <Step title="Add the domain in Chasqr first">
                    <p>
                      Open your site → <strong>Settings</strong> →{" "}
                      <strong>Custom Domain</strong>. Type the exact hostname
                      you want visitors to use — <C>example.com</C> or{" "}
                      <C>blog.example.com</C> — without <C>https://</C> and
                      without a trailing slash. Press the green tick to save.
                    </p>
                    <p className="text-xs text-slate-500">
                      Do this before touching DNS: a certificate is only ever
                      issued for a domain that's already registered here.
                    </p>
                    <Shot
                      n={10}
                      alt="The Custom Domain tab before a domain is connected — type the hostname and press the tick."
                    />
                  </Step>

                  <Step title="Copy the DNS record we show you">
                    <p>
                      As soon as the domain is saved, the tab displays the exact
                      A record to create. It looks like this:
                    </p>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        {["Type", "Name", "Value", "TTL"].map((h) => (
                          <span key={h} className="px-3 py-2">
                            {h}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-4 text-xs font-mono text-slate-700">
                        <span className="px-3 py-2.5">A</span>
                        <span className="px-3 py-2.5">@</span>
                        <span className="px-3 py-2.5 text-primary break-all">
                          {SITE_IP}
                        </span>
                        <span className="px-3 py-2.5">3600</span>
                      </div>
                    </div>
                    <Shot
                      n={11}
                      alt="Once saved, the tab shows the exact A record to create at your registrar — and a green dot marks the site as having a domain."
                    />
                  </Step>

                  <Step title="Create that record at your registrar">
                    <p>
                      Find the DNS management screen for your domain and add a
                      new record:
                    </p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>
                        <strong>Root domain</strong> (<C>example.com</C>) — Type{" "}
                        <C>A</C>, Name <C>@</C>, Value <C>{SITE_IP}</C>, TTL{" "}
                        <C>3600</C>
                      </li>
                      <li>
                        <strong>Subdomain</strong> (<C>blog.example.com</C>) —
                        Type <C>A</C>, Name <C>blog</C> (just the label, not the
                        full domain), same value and TTL
                      </li>
                    </ul>
                    <p>
                      Delete or edit any existing A or CNAME record with the
                      same name — a leftover parking-page record will keep
                      winning.
                    </p>
                    <p className="text-xs text-slate-500">
                      Where to look: GoDaddy → My Products → DNS; Namecheap →
                      Domain List → Manage → Advanced DNS; Cloudflare → DNS →
                      Records; Hostinger → Domains → DNS / Nameservers.
                    </p>
                  </Step>

                  <Step title="Wait for DNS to propagate">
                    <p>
                      Usually a few minutes to a couple of hours, occasionally
                      up to 48. Check progress from a terminal:
                    </p>
                    <Code>{`nslookup example.com

# It's ready when the answer is ${SITE_IP}`}</Code>
                  </Step>

                  <Step title="Open your domain over HTTPS">
                    <p>
                      Visit <C>https://example.com</C>. The certificate is
                      issued on that first request, so the very first load can
                      take a few extra seconds — after that it's instant, and
                      renewals are automatic. There's nothing to upload and no
                      certificate to manage.
                    </p>
                  </Step>
                </Steps>
              </div>

              <h3 className="font-semibold text-slate-900 text-base mt-10 mb-3">
                Rules worth knowing
              </h3>
              <div className="space-y-3">
                <Card title="One domain per site">
                  <p>
                    A site serves one custom hostname, and a hostname can't be
                    connected to two sites — saving one that's already in use is
                    rejected.
                  </p>
                </Card>
                <Card title="www and the root are different hostnames">
                  <p>
                    <C>example.com</C> and <C>www.example.com</C> are treated
                    separately. Connect whichever you want visitors to use, then
                    redirect the other at your DNS provider or registrar (most
                    offer a free forwarding / redirect rule).
                  </p>
                </Card>
                <Card title="Using Cloudflare as your DNS host?">
                  <p>
                    Set the record to <strong>DNS only</strong> (grey cloud)
                    rather than proxied. Proxying puts Cloudflare's own
                    certificate in front of ours and is the usual cause of
                    redirect loops and SSL errors.
                  </p>
                </Card>
                <Card title="Removing a domain">
                  <p>
                    The <strong>Remove</strong> button disconnects it instantly.
                    Your site stays online at its {APP_DOMAIN} subdomain, and
                    the domain is free to reconnect elsewhere.
                  </p>
                </Card>
              </div>

              <div className="mt-6">
                <Note tone="warn" title="Domain not resolving?">
                  Work through it in order: the site is live (not paused) → the
                  hostname in the Custom Domain tab matches exactly what you're
                  typing in the browser → <C>nslookup</C> returns {SITE_IP} → no
                  conflicting A/CNAME record remains. More cases in{" "}
                  <button
                    onClick={() => scrollTo("troubleshooting")}
                    className="text-primary hover:underline"
                  >
                    Troubleshooting
                  </button>
                  .
                </Note>
              </div>
            </Sec>

            {/* ── SEO ──────────────────────────────────────────────────── */}
            <Sec
              id="seo"
              title="SEO"
              refs={refs}
              intro="The SEO tab has three parts: an audit that scores each page, a one-click fixer for the mechanical problems, and manual controls for your titles, descriptions, social previews and favicon."
            >
              <div className="space-y-4 mb-8">
                <Card title="1. Run the SEO check">
                  <p>
                    Pick a page and press <strong>Run SEO Check</strong>. We
                    fetch the live page and run 20+ checks — title, meta
                    description, canonical URL, indexing rules, H1 and heading
                    structure, language attribute, mobile viewport, image alt
                    text, content depth, internal and external links, Open Graph
                    tags, HTTPS and response time — then score it out of 100.
                  </p>
                  <p>
                    Each result is written in plain English: what's wrong, and
                    why it matters.
                  </p>
                  <Shot
                    n={12}
                    alt="An SEO report — overall score, a breakdown by category, and every issue explained in plain English."
                  />
                </Card>
                <Card title="2. Fix issues automatically">
                  <p>
                    <strong>Fix Issues Automatically</strong> handles the
                    mechanical basics — page title, meta description, canonical
                    link, viewport, language attribute, social tags and missing
                    image alt text — then redeploys and re-scores the page, and
                    lists exactly what it changed.
                  </p>
                  <p className="text-xs text-slate-500">
                    It can't write your content for you: depth, linking and page
                    speed stay in your hands.
                  </p>
                </Card>
                <Card title="3. Fine-tune the details">
                  <p>Below the audit you can set, per page:</p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>
                      <strong>Page Title</strong> — up to 60 characters, shown
                      in the browser tab and search results
                    </li>
                    <li>
                      <strong>Meta Description</strong> — up to 160 characters,
                      the snippet under your search result
                    </li>
                    <li>
                      <strong>OG Image URL</strong> — the thumbnail used when
                      your link is shared; at least 1200×630px
                    </li>
                    <li>
                      <strong>OG Title</strong> and{" "}
                      <strong>OG Description</strong> — override the above for
                      social platforms
                    </li>
                  </ul>
                  <p>
                    Live Google and social previews sit beside the form, so you
                    can see truncation before you publish. Saving redeploys.
                  </p>
                </Card>
                <Card title="Favicon">
                  <p>
                    Also in this tab: upload a favicon or paste an image URL. It
                    applies to every page. A square PNG or ICO of at least 32×32
                    works best.
                  </p>
                </Card>
              </div>

              <Note tone="tip" title="Free checker for any website">
                The{" "}
                <Link
                  to="/seo-checker"
                  className="text-primary hover:underline"
                >
                  SEO Checker
                </Link>{" "}
                runs the same audit on any public URL — your site, a client's, a
                competitor's — with no account needed. Sites hosted here get the
                deeper check plus one-click fixes.
              </Note>
            </Sec>

            {/* ── Analytics ────────────────────────────────────────────── */}
            <Sec
              id="analytics"
              title="Analytics"
              refs={refs}
              intro="Visit tracking is built in — nothing to install, no third-party script, no cookie banner."
            >
              <div className="space-y-3 mb-6">
                {[
                  [
                    "Total Visits",
                    "Every page request your site has served since it was created.",
                  ],
                  [
                    "Last 30 Days",
                    "Visits in the last month — the number to watch after a launch or a campaign.",
                  ],
                  [
                    "Daily Average",
                    "Your typical day, useful as a baseline to compare spikes against.",
                  ],
                  [
                    "30-day chart",
                    "A bar per day, with today highlighted. Hover any bar for its exact count.",
                  ],
                ].map(([name, desc]) => (
                  <div
                    key={name}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <p className="font-medium text-slate-800 text-sm mb-0.5">
                      {name}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>

              <Shot
                n={13}
                alt="The Analytics tab — total visits, the last 30 days, your daily average, and a bar per day."
              />

              <div className="mt-6">
                <Note tone="info">
                  Visits are counted on your live site, whether visitors arrive
                  through the {APP_DOMAIN} subdomain or your custom domain.
                  Per-country, per-device and per-page breakdowns aren't
                  available yet — add Google Analytics to your page for those.
                </Note>
              </div>
            </Sec>

            {/* ── Contact forms ────────────────────────────────────────── */}
            <Sec
              id="contact-forms"
              title="Contact Forms"
              refs={refs}
              intro="Chasqr captures form submissions for you — every field lands in the site's Submissions tab and is emailed to you the moment it arrives. No third-party form service, no monthly fee. Pick whichever route matches how your site was made."
            >
              <div className="space-y-4 mb-8">
                <Card title="A. Built with the visual builder — nothing to do">
                  <p>
                    Any <strong>Form</strong> element or form template you drop
                    in is already wired up. Publish and start receiving
                    messages.
                  </p>
                </Card>
                <Card title="B. Uploaded HTML with a form — one click">
                  <p>
                    We scan your pages and list the forms we find. Open{" "}
                    <strong>Submissions</strong>, find yours, and press{" "}
                    <strong>Connect</strong> — likely contact forms are flagged
                    for you. Leave search bars, logins and newsletter widgets
                    disconnected.
                  </p>
                  <Shot
                    n={14}
                    alt="The Submissions tab — a form detected in your uploaded HTML, waiting for one click to connect it."
                  />
                </Card>
                <Card title="C. Your own form, wired manually">
                  <p>
                    Point the form at your site's submit endpoint. The{" "}
                    <strong>Submissions</strong> tab shows the exact URL with a
                    copy button; your site ID is also the code in the dashboard
                    URL (<C>/sites/&lt;id&gt;</C>).
                  </p>
                </Card>
              </div>

              <code className="block text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 font-mono text-slate-700 mb-6 overflow-x-auto">
                {API_URL}/api/forms/&lt;your-site-id&gt;/submit
              </code>

              <p className="text-sm font-semibold text-slate-800 mb-1">
                Option 1 — plain HTML, no JavaScript
              </p>
              <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                Set the form's <C>action</C> and <C>method</C>. The optional
                hidden <C>_redirect</C> field sends visitors to a thank-you page
                after submitting.
              </p>
              <Code>{`<form action="${API_URL}/api/forms/<your-site-id>/submit" method="POST">
  <input type="hidden" name="_redirect" value="https://yoursite.${APP_DOMAIN}/thank-you">
  <input type="text"  name="name"    placeholder="Your name">
  <input type="email" name="email"   placeholder="you@example.com">
  <textarea           name="message" placeholder="Your message"></textarea>
  <button type="submit">Send</button>
</form>`}</Code>
              <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
                <C>_redirect</C> must be an <C>https://</C> address on your own
                site — your {APP_DOMAIN} subdomain or your connected custom
                domain. Anything else is ignored, which keeps the endpoint from
                being used to bounce people elsewhere.
              </p>

              <p className="text-sm font-semibold text-slate-800 mb-1">
                Option 2 — stay on the page
              </p>
              <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                Add <C>data-chasqr-form</C> to your <C>&lt;form&gt;</C> tag,
                then paste this just before <C>&lt;/body&gt;</C>:
              </p>
              <Code>{`<script>
document.querySelectorAll('[data-chasqr-form]').forEach(function (f) {
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = Object.fromEntries(new FormData(f));
    fetch("${API_URL}/api/forms/<your-site-id>/submit", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function () {
      f.reset();
      alert('Thanks — your message was sent!');
    });
  });
});
</script>`}</Code>

              <h3 className="font-semibold text-slate-900 text-base mt-8 mb-3">
                What gets captured
              </h3>
              <ul className="text-sm text-slate-600 leading-relaxed list-disc ml-5 space-y-1.5 mb-6">
                <li>
                  Every field needs a <C>name</C> attribute — fields without one
                  are invisible to the browser and never reach us. One-click
                  Connect handles this for you.
                </li>
                <li>
                  Any field names work; whatever you send is stored and shown.
                </li>
                <li>
                  Up to 30 fields per submission, 5,000 characters per field.
                  Empty fields are dropped.
                </li>
                <li>
                  Names beginning with an underscore are reserved for control
                  parameters like <C>_redirect</C>.
                </li>
              </ul>

              <h3 className="font-semibold text-slate-900 text-base mb-3">
                Where messages land
              </h3>
              <div className="space-y-4">
                <Card title="In your dashboard">
                  <p>
                    The <strong>Submissions</strong> tab holds the 500 most
                    recent, newest first. Each shows the sender's name and email
                    pulled out of the fields, every other field below it, the
                    time it arrived, and a delete button.
                  </p>
                </Card>
                <Card title="In your inbox — automatically">
                  <p>
                    Every submission is emailed to your Chasqr account address
                    the moment it arrives. Nothing to switch on, and no
                    forwarding address to configure.
                  </p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>
                      The subject names the site and the sender, so it's obvious
                      at a glance which form fired
                    </li>
                    <li>Every submitted field is laid out in the body</li>
                    <li>
                      <strong>Reply-to is set to the sender's address</strong>{" "}
                      when we can spot an email among the fields — so hitting
                      reply in your mail client answers the person directly,
                      rather than emailing yourself
                    </li>
                  </ul>
                </Card>
              </div>

              <div className="mt-5">
                <Note tone="tip" title="Not seeing the emails?">
                  Check the spam folder first and mark one as "not spam" —
                  notifications go to the address on your Chasqr account, so
                  it's also worth confirming that address is one you actually
                  read. A missing email never means a lost message: the
                  submission is stored either way and is always in the
                  Submissions tab.
                </Note>
              </div>
            </Sec>

            {/* ── Account & security ───────────────────────────────────── */}
            <Sec
              id="account"
              title="Account & Security"
              refs={refs}
              intro="Everything about your login lives on the Profile page — open it from your avatar in the top-right corner."
            >
              <div className="space-y-4 mb-8">
                <Card title="Display name">
                  <p>
                    The name shown in Chasqr and used when an expert is helping
                    you. Changing it doesn't affect your sites.
                  </p>
                </Card>
                <Card title="Password">
                  <p>
                    Set a new one by entering your current password alongside
                    it. Forgotten it? Use <strong>Forgot password</strong> on
                    the sign-in page and we'll email you a reset link.
                  </p>
                </Card>
                <Card title="Email verification">
                  <p>
                    New accounts get a 6-digit code by email to confirm the
                    address before the first sign-in. Codes last 10 minutes, and
                    you can request a new one after 60 seconds. Signing up with
                    Google or GitHub skips this — those providers have already
                    verified your address.
                  </p>
                </Card>
              </div>

              <h3 className="font-semibold text-slate-900 text-base mb-3">
                Two-factor authentication
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                Adds a second step at sign-in, so a leaked password isn't enough
                on its own to reach your account and your live sites.
              </p>

              <Steps>
                <Step title="Profile → Two-Factor Authentication → Enable">
                  We email a 6-digit code to your account address straight away.
                </Step>
                <Step title="Enter the code">
                  Type it into the six boxes — it submits itself on the last
                  digit. The card then shows an <strong>Enabled</strong> badge.
                </Step>
                <Step title="From then on, every sign-in asks for a code">
                  <p>
                    After your password is accepted we email a fresh code and
                    hold the sign-in until you enter it. Codes expire after 10
                    minutes; you can resend after 60 seconds.
                  </p>
                  <p>
                    This applies to <strong>every</strong> way into your account
                    — password, Google and GitHub all hit the same check, so
                    turning it on can't be sidestepped by using a social login.
                  </p>
                </Step>
                <Step title="Turning it off">
                  Profile → <strong>Disable</strong>, then confirm with your
                  account password.
                </Step>
              </Steps>

              <div className="mt-6 space-y-4">
                <Note tone="warn" title="Signed up with Google or GitHub?">
                  Disabling two-factor asks for an account password, and a
                  social-only account has never had one set. Use{" "}
                  <strong>Forgot password</strong> to create one first, then
                  disable. Worth knowing before you turn it on.
                </Note>
                <Note tone="info" title="Codes arrive by email">
                  There's no authenticator app to set up and nothing to scan —
                  which also means access to your email inbox is what protects
                  the account. Keep that address secure.
                </Note>
              </div>
            </Sec>

            {/* ── PRO & billing ────────────────────────────────────────── */}
            <Sec
              id="pro-billing"
              title="PRO & Billing"
              refs={refs}
              intro="Chasqr is free to use. PRO is a one-time payment per site — no subscription, no renewals."
            >
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="p-5 border border-slate-200 rounded-xl">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">
                    Free on every site
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-1.5 list-disc ml-4">
                    <li>Hosting on a {APP_DOMAIN} subdomain, HTTPS included</li>
                    <li>The visual builder and the content editor</li>
                    <li>A custom domain, with automatic HTTPS</li>
                    <li>SEO audit, auto-fix, analytics and contact forms</li>
                    <li>Uploads up to 5 MB</li>
                    <li>Expert help requests</li>
                  </ul>
                </div>
                <div className="p-5 border border-amber-200 bg-amber-50/40 rounded-xl">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">
                    PRO adds, per site
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-1.5 list-disc ml-4">
                    <li>Uploads and redeploys of any size, forever</li>
                    <li>
                      Attaching your project's source code for experts helping
                      you
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <Card title="Two ways to end up on PRO">
                  <ul className="list-disc ml-5 space-y-1.5">
                    <li>
                      <strong>Deploy something over 5 MB.</strong> You're
                      prompted for a one-time $2.99 payment; it unlocks that
                      upload and upgrades the site to PRO.
                    </li>
                    <li>
                      <strong>Press “Upgrade to PRO”</strong> on the site
                      dashboard. The price is calculated from that specific site
                      — $1.49 base, plus $0.20 per MB of stored size and $0.15
                      per page, with a $1.49 minimum and a $14.99 cap. The modal
                      shows the full breakdown before you pay.
                    </li>
                  </ul>
                </Card>
                <Card title="Paying">
                  <p>
                    Razorpay and Cashfree are both supported — pick either at
                    checkout. If one is unavailable we fall back to the other
                    and tell you.
                  </p>
                  <p className="text-xs text-slate-500">
                    Prices here are shown in US dollars for reference. Checkout
                    is processed in Indian rupees — ₹199 for a large upload, and
                    ₹99–₹999 for a site upgrade.
                  </p>
                </Card>
                <Card title="Transactions">
                  <p>
                    The{" "}
                    <Link
                      to="/transactions"
                      className="text-primary hover:underline"
                    >
                      Transactions
                    </Link>{" "}
                    page lists every payment with its ID and amount, and shows
                    any unused credits — a credit bought for a large upload you
                    didn't finish stays on your account for next time.
                  </p>
                </Card>
              </div>
            </Sec>

            {/* ── Expert help ──────────────────────────────────────────── */}
            <Sec
              id="expert-help"
              title="Expert Help"
              refs={refs}
              intro="Would rather someone else made the change? Every site has an Expert Help tab that connects you to a verified expert about that specific site."
            >
              <Steps>
                <Step title="Open the site → Expert Help">
                  You'll see available experts with their title, skills and
                  current availability.
                </Step>
                <Step title="Pick an expert and describe what you need">
                  Be specific — which page, what should change, what the end
                  result should look like.
                </Step>
                <Step title="Chat it through">
                  Once your request is sent, a live chat opens with that expert.
                  Replies arrive in real time and unread messages show as a
                  badge on the tab while you're elsewhere in the dashboard. You
                  can cancel a request that hasn't been picked up yet.
                </Step>
                <Step title="Share your source code (PRO)">
                  If the site is PRO, attach a ZIP of your real project under{" "}
                  <strong>Update Files</strong> so the expert works with your
                  actual code rather than the compiled output.
                </Step>
              </Steps>
            </Sec>

            {/* ── Troubleshooting ──────────────────────────────────────── */}
            <Sec
              id="troubleshooting"
              title="Troubleshooting"
              refs={refs}
              intro="The problems that come up most often, and what fixes them."
            >
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                {TROUBLESHOOTING.map((t) => (
                  <div key={t.q} className="p-5">
                    <p className="font-semibold text-slate-900 text-sm mb-1.5">
                      {t.q}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {t.a}
                    </p>
                  </div>
                ))}
              </div>
            </Sec>

            {/* ── Roadmap ──────────────────────────────────────────────── */}
            <Sec
              id="roadmap"
              title="Coming Soon"
              refs={refs}
              intro="Chasqr serves static files today, so anything needing code to run on the server at request time isn't supported yet. These are what we're working on:"
            >
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
            </Sec>

            {/* ── Get help ─────────────────────────────────────────────── */}
            <Sec id="get-help" title="Still Stuck?" refs={refs}>
              <div className="p-6 bg-primary-light border border-primary/20 rounded-2xl">
                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                  If none of the above covers it, or you'd rather have someone
                  make the change for you, open your site and use the{" "}
                  <strong>Expert Help</strong> tab — verified experts are ready
                  to assist, and it's free to ask.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm"
                >
                  Go to Dashboard
                </Link>
              </div>
            </Sec>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
