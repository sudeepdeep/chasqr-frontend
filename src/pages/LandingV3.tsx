import {
  ArrowRight,
  BarChart2,
  Check,
  Eye,
  FolderGit2,
  Globe,
  Headset,
  Inbox,
  LayoutTemplate,
  Lock,
  Palette,
  Pencil,
  Search,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AuthStore } from "../store/auth";
import LandingBanner from "../components/LandingBanner";
import StorageNoticeBanner from "../components/StorageNoticeBanner";

const IMG = process.env.PUBLIC_URL || "";

/**
 * The four things the product actually does, each paired with a real
 * screenshot from the docs (public/images/doc-<n>.png) rather than an icon.
 */
const SECTIONS = [
  {
    kicker: "Deploy from GitHub",
    title: "Connect a repo. Every push rebuilds the site.",
    body: "Pick the repository, the branch, and the folder your build ends up in. After that, pushing to that branch redeploys the site on its own.",
    points: [
      "Repository, branch and output folder are set once",
      "Auto-deploy can be switched off per site",
      "A failed build leaves the live version untouched",
    ],
    icon: FolderGit2,
    shot: 16,
    caption:
      "Choosing a repository, branch and output folder in the import wizard.",
  },
  {
    kicker: "Or build it here",
    title: "No repo? Start from a blank page.",
    body: "Drag in sections, columns, navbars and footers, then style them from the toolbar. Saving publishes the page — there is no separate deploy step.",
    points: [
      "Drag-and-drop sections, columns, navbars and footers",
      "Edit text, images and links after the site is live",
      "Save and deploy happen in the same click",
    ],
    icon: LayoutTemplate,
    shot: 4,
    caption:
      "The builder: toolbar across the top, element palette on the left, canvas in the middle.",
  },
  {
    kicker: "Domains and HTTPS",
    title: "One DNS record connects your domain.",
    body: "Add the hostname in the Custom Domain tab and Chasqr shows you the exact A record to create at your registrar. The certificate is issued the first time someone visits.",
    points: [
      "A single A record at your registrar",
      "Certificate issued on the first request to the domain",
      "Renewals are automatic and cost nothing",
    ],
    icon: ShieldCheck,
    shot: 11,
    caption:
      "The A record to create at your registrar, shown once the domain is saved.",
  },
];

/** The post-launch tools, shown as three real screenshots side by side. */
const AFTER_LAUNCH = [
  {
    shot: 12,
    title: "SEO report",
    desc: "A score, a breakdown by category, and every issue written out in plain English.",
  },
  {
    shot: 13,
    title: "Analytics",
    desc: "Total visits, the last 30 days and a daily average. Counted server-side, no script to add.",
  },
  {
    shot: 14,
    title: "Form submissions",
    desc: "Forms already in your HTML are detected. One click connects them to the dashboard.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Bring your files",
    desc: "Connect a GitHub repository, drop a ZIP, or select a project folder.",
  },
  {
    n: "2",
    title: "Get a URL",
    desc: "The site is live on a Chasqr subdomain straight away. Add your own domain whenever you want.",
  },
  {
    n: "3",
    title: "Change it later",
    desc: "Edit text, images, colours and SEO from the dashboard. Changes go live when you save.",
  },
];

/** Product facts, not marketing metrics — each one is checkable in the app. */
const FACTS = [
  { value: "1", label: "DNS record to connect a domain" },
  { value: "0", label: "build config files to write" },
  { value: "Free", label: "HTTPS, issued and renewed for you" },
  { value: "3", label: "ways in: GitHub, ZIP upload, or the builder" },
];

const EXTRAS = [
  {
    icon: UploadCloud,
    title: "ZIP or folder upload",
    desc: "Plain HTML, or a built React, Vue or Angular app. No CLI to install.",
  },
  {
    icon: Globe,
    title: "Custom domains",
    desc: "Point any domain you own at a site, including on the free tier.",
  },
  {
    icon: Pencil,
    title: "Content editor",
    desc: "Every text, image and link on the page becomes an editable field.",
  },
  {
    icon: Palette,
    title: "Colour editor",
    desc: "Every colour found in the page's styles, listed with how often it is used.",
  },
  {
    icon: Search,
    title: "SEO fields",
    desc: "Titles, meta descriptions, social share cards and favicons, per page.",
  },
  {
    icon: Eye,
    title: "Preview before publish",
    desc: "See the full page with your changes applied before anything goes public.",
  },
  {
    icon: BarChart2,
    title: "Visit analytics",
    desc: "Daily visit counts per site, with no third-party tracking script.",
  },
  {
    icon: Inbox,
    title: "Redeploys",
    desc: "Ship a new version any time. The URL, domain and settings stay the same.",
  },
];

const TRUST = [
  { icon: ShieldCheck, label: "Payments handled by Razorpay and Cashfree" },
  { icon: Lock, label: "Free SSL on every domain" },
  { icon: Headset, label: "Support from a person, not just docs" },
  { icon: ShieldAlert, label: "Two-factor authentication on every account" },
];

/** A screenshot in a plain frame with the caption that explains it. */
function Shot({
  n,
  caption,
  className = "",
}: {
  n: number;
  caption: string;
  className?: string;
}) {
  return (
    <figure className={className}>
      <img
        src={`${IMG}/images/doc-${n}.png`}
        alt={caption}
        loading="lazy"
        className="w-full rounded-lg border border-slate-200 bg-white"
      />
      <figcaption className="mt-3 text-sm leading-relaxed text-slate-500">
        {caption}
      </figcaption>
    </figure>
  );
}

export default function LandingV3() {
  const { user } = AuthStore.useState();

  const primaryCTA = user
    ? { to: "/dashboard", label: "Go to dashboard" }
    : { to: "/register", label: "Create an account" };

  return (
    <div className="font-inter bg-white text-slate-900">
      {/* ── Banner ────────────────────────────────────────────────────────── */}
      <LandingBanner
        title="Put your website online in about a minute."
        subtitle="Connect a repository, upload a folder, or build the page here. Your site goes live on a URL straight away, with nothing to configure."
      />

      {/* ── What you actually get ─────────────────────────────────────────── */}
      <section className="border-b border-slate-200 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <Shot
            n={7}
            caption="A site's dashboard — plan, status and visit count at the top, everything else in the left navigation."
          />
          <p className="mt-8 text-base leading-[1.7] text-slate-600">
            Free tier, no card needed. Chasqr stores your build output only —
            never your source code or git history.
          </p>
        </div>
      </section>

      {/* ── Three steps ───────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            How it works
          </h2>
          <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="mb-4 flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-sm font-medium text-slate-600">
                  {s.n}
                </span>
                <h3 className="mb-2 text-lg font-semibold leading-snug">
                  {s.title}
                </h3>
                <p className="text-base leading-[1.7] text-slate-600">
                  {s.desc}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Feature sections, each with a real screenshot ──────────────────── */}
      {SECTIONS.map((s, i) => {
        const Icon = s.icon;
        // Alternate which side the screenshot sits on so the page has a rhythm
        // without needing any decoration to create one.
        const shotFirst = i % 2 === 1;
        return (
          <section
            key={s.title}
            className="border-b border-slate-200 px-6 py-20"
          >
            <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className={shotFirst ? "lg:order-2" : ""}>
                <p className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
                  <Icon size={16} />
                  {s.kicker}
                </p>
                <h2 className="mb-5 max-w-lg text-3xl font-semibold leading-[1.2] tracking-tight sm:text-4xl">
                  {s.title}
                </h2>
                <p className="mb-7 max-w-xl text-lg leading-[1.7] text-slate-600">
                  {s.body}
                </p>
                <ul className="space-y-3">
                  {s.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-3 text-base leading-[1.6] text-slate-700"
                    >
                      <Check
                        size={18}
                        className="mt-0.5 shrink-0 text-primary"
                        strokeWidth={2.5}
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <Shot
                n={s.shot}
                caption={s.caption}
                className={shotFirst ? "lg:order-1" : ""}
              />
            </div>
          </section>
        );
      })}

      {/* ── After launch ──────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            SEO, analytics and forms are already in there
          </h2>
          <p className="mb-12 max-w-2xl text-lg leading-[1.7] text-slate-600">
            Three tabs on every site. Nothing to install, nothing extra to pay
            for.
          </p>
          <div className="grid gap-10 md:grid-cols-3 md:gap-8">
            {AFTER_LAUNCH.map((a) => (
              <div key={a.title}>
                <img
                  src={`${IMG}/images/doc-${a.shot}.png`}
                  alt={a.desc}
                  loading="lazy"
                  className="mb-5 w-full rounded-lg border border-slate-200 bg-white"
                />
                <h3 className="mb-2 text-lg font-semibold leading-snug">
                  {a.title}
                </h3>
                <p className="text-base leading-[1.7] text-slate-600">
                  {a.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Facts ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-slate-50 px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {FACTS.map((f) => (
            <div key={f.label}>
              <p className="mb-2 text-4xl font-semibold leading-none tracking-tight text-slate-900">
                {f.value}
              </p>
              <p className="text-base leading-[1.6] text-slate-600">
                {f.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Everything else ───────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Also included
          </h2>
          <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {EXTRAS.map((e) => {
              const Icon = e.icon;
              return (
                <div key={e.title}>
                  <Icon size={20} className="mb-3 text-primary" />
                  <h3 className="mb-1.5 text-base font-semibold leading-snug">
                    {e.title}
                  </h3>
                  <p className="text-sm leading-[1.7] text-slate-600">
                    {e.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Trust ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 px-6 py-10">
        <ul className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-10 gap-y-3">
          {TRUST.map((t) => {
            const Icon = t.icon;
            return (
              <li
                key={t.label}
                className="flex items-center gap-2 text-sm leading-relaxed text-slate-600"
              >
                <Icon size={15} className="text-slate-400" />
                {t.label}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Closing CTA ───────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Put a site up today
          </h2>
          <p className="mb-8 max-w-xl text-lg leading-[1.7] text-slate-600">
            Free to start and free to keep. Bring a repository, a folder, or
            nothing at all.
          </p>
          <Link
            to={primaryCTA.to}
            className="group inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-white transition-colors hover:bg-primary-dark"
          >
            {primaryCTA.label}
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <img src="/logo.svg" alt="" className="h-5 w-5" aria-hidden="true" />
            Chasqr © {new Date().getFullYear()}
          </span>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <Link to="/docs" className="hover:text-slate-900">
              Docs
            </Link>
            <Link to="/seo-checker" className="hover:text-slate-900">
              SEO checker
            </Link>
            <Link to="/terms" className="hover:text-slate-900">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-slate-900">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>

      <StorageNoticeBanner />
    </div>
  );
}
