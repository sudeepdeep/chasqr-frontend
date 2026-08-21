import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, MoreHorizontal } from "lucide-react";
import { publicSiteUrl } from "../lib/siteUrl";
import SiteThumbnail from "./SiteThumbnail";

export interface DashSite {
  siteId: string;
  slug?: string;
  name: string;
  status: "active" | "inactive";
  plan: "free" | "paid";
  visits: number;
  created_at: string;
  updated_at?: string;
  customDomain?: string;
  favicon?: string;
}

const nf = new Intl.NumberFormat();

/** "2 hours ago" — the design shows relative deploy times, not timestamps. */
export function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(iso).toLocaleDateString();
}

export default function SiteGridCard({
  site,
  onToggle,
  onRename,
  onDelete,
}: {
  site: DashSite;
  onToggle: (s: DashSite) => void;
  onRename: (s: DashSite) => void;
  onDelete: (s: DashSite) => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape. Without this the menu stays open while you
  // click around the grid, and several cards can end up open at once.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const live = site.status === "active";
  const host = site.customDomain || publicSiteUrl(site.slug || site.siteId).replace(/^https?:\/\//, "");
  const previewUrl = site.customDomain
    ? `https://${site.customDomain}`
    : publicSiteUrl(site.slug || site.siteId);

  const item =
    "text-left text-[12.5px] font-medium text-slate-700 bg-transparent border-0 px-2.5 py-2 rounded-[7px] cursor-pointer hover:bg-slate-100 transition-colors";

  return (
    <div className="relative rounded-[14px] border border-slate-200 bg-white overflow-hidden transition-all hover:border-slate-300 hover:shadow-[0_10px_24px_-12px_rgba(15,23,42,.18)]">
      <button
        type="button"
        onClick={() => navigate(`/sites/${site.siteId}`)}
        aria-label={`Open ${site.name}`}
        className="block w-full text-left"
      >
        <SiteThumbnail seed={site.siteId} name={site.name} url={host} />
      </button>

      <div className="px-3.5 pb-3 pt-3">
        <div className="flex items-center gap-2">
          <span
            title={live ? "Live" : "Paused"}
            className={`h-[7px] w-[7px] flex-none rounded-full ${live ? "bg-green-600" : "bg-amber-500"}`}
          />
          <h3 className="m-0 flex-1 truncate text-[14.5px] font-semibold text-slate-900">
            {site.name}
          </h3>
          {/* The design badges prod/staging; this app has no environments, so
              the plan is shown instead — real data, same visual slot. */}
          <span
            className={`flex-none rounded-[5px] px-[7px] py-[2.5px] text-[9.5px] font-semibold uppercase tracking-[.04em] ${
              site.plan === "paid"
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {site.plan === "paid" ? "Pro" : "Free"}
          </span>
        </div>

        <div className="mt-[7px] flex items-center gap-1.5">
          <span className="truncate text-xs text-slate-500">{host}</span>
          {site.customDomain && (
            <span className="flex-none rounded-[5px] bg-primary-light px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[.04em] text-primary">
              Custom
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11.5px] text-slate-400">
          <span className="font-semibold tabular-nums text-slate-600">
            {nf.format(site.visits || 0)}
          </span>
          visits
          <span className="block h-[3px] w-[3px] rounded-full bg-slate-300" />
          <span>{timeAgo(site.updated_at || site.created_at)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-3.5 py-2.5">
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary hover:text-primary-dark"
        >
          Preview <ExternalLink size={11} />
        </a>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Site actions"
          aria-expanded={open}
          className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] border-0 bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <MoreHorizontal size={15} />
        </button>
      </div>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute bottom-11 right-3 z-10 flex w-[150px] flex-col gap-px rounded-[11px] border border-slate-200 bg-white p-1.5 shadow-[0_14px_32px_-10px_rgba(15,23,42,.28)]"
        >
          <Link to={`/sites/${site.siteId}`} role="menuitem" className={item}>
            Edit site
          </Link>
          <button role="menuitem" className={item} onClick={() => { setOpen(false); onToggle(site); }}>
            {live ? "Pause site" : "Resume site"}
          </button>
          <button role="menuitem" className={item} onClick={() => { setOpen(false); onRename(site); }}>
            Rename
          </button>
          <div className="mx-1.5 my-[3px] h-px bg-slate-100" />
          <button
            role="menuitem"
            className={`${item} !text-red-600 hover:!bg-red-50`}
            onClick={() => { setOpen(false); onDelete(site); }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
