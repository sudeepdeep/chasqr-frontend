import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArrowUp,
  BarChart3,
  Check,
  ChevronRight,
  Crown,
  ExternalLink,
  Eye,
  FileCode,
  FileText,
  FolderGit2,
  Globe,
  Headset,
  Inbox,
  LayoutTemplate,
  Link2,
  Palette,
  Pause,
  Pencil,
  Play,
  Power,
  Rocket,
  Trash2,
  UploadCloud,
  X,
  MousePointer2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { toast } from "react-toastify";
import { getPaymentInfoAPI } from "../api/payment.api";
import { useQueryClient } from "@tanstack/react-query";
import { siteKeys, useSiteDetail } from "../queries/sites";
import {
  addElementAPI,
  deleteSiteAPI,
  redeployFilesAPI,
  redeployZipAPI,
  removeCustomDomainAPI,
  setCustomDomainAPI,
  toggleStatusAPI,
  updateContentAPI,
  updateElementsAPI,
  updateSlugAPI,
} from "../api/site.api";
import { getMyRequestsAPI } from "../api/support.api";
import AnalyticsChart from "../components/AnalyticsChart";
import ColorEditor from "../components/ColorEditor";
import ContentEditor from "../components/ContentEditor";
import FaviconEditor from "../components/FaviconEditor";
import GitSettings from "../components/GitSettings";
import PaymentModal from "../components/PaymentModal";
import ProLockedGate from "../components/ProLockedGate";
import SEOEditor from "../components/SEOEditor";
import SiteSeoChecker from "../components/SiteSeoChecker";
import SourceArchiveControl from "../components/SourceArchiveControl";
import Submissions from "../components/Submissions";
import SupportSection from "../components/SupportSection";
import { APP_DOMAIN, publicSiteUrl } from "../lib/siteUrl";
import { getSocket } from "../lib/socket";
import { AuthStore } from "../store/auth";
import ShellHeader from "../layout/ShellHeader";
import { CollapseToggle } from "../layout/SideNav";
import { navRowClass, navShellClass } from "../layout/navStyles";
import { SidebarStore } from "../store/sidebar";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

interface ContentItem {
  key: string;
  label: string;
  value: string;
  type: "text" | "image" | "link";
}
interface Page {
  filename: string;
  title: string;
  contentMap: ContentItem[];
  forms?: {
    key: string;
    label: string;
    fields: string[];
    likelyContact: boolean;
    connected: boolean;
  }[];
  layout?: any[];
}

type Section =
  | "url"
  | "domain"
  | "files"
  | "git"
  | "editor"
  | "layout"
  | "colors"
  | "seo"
  | "analytics"
  | "submissions"
  | "support"
  | "controls";

const NAV_GROUPS: {
  label: string;
  items: { id: Section; label: string; icon: any }[];
}[] = [
  {
    label: "Settings",
    items: [
      { id: "url", label: "Site URL", icon: Link2 },
      { id: "domain", label: "Custom Domain", icon: Globe },
      { id: "files", label: "Update Files", icon: UploadCloud },
      { id: "git", label: "GitHub", icon: FolderGit2 },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "editor", label: "Editor", icon: FileCode },
      { id: "layout", label: "Layout", icon: LayoutTemplate },
      { id: "colors", label: "Colors", icon: Palette },
      { id: "seo", label: "SEO", icon: Globe },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
      { id: "submissions", label: "Submissions", icon: Inbox },
    ],
  },
  {
    label: "Help",
    items: [{ id: "support", label: "Expert Help", icon: Headset }],
  },
  {
    label: "Danger zone",
    items: [{ id: "controls", label: "Pause & Delete", icon: Power }],
  },
];

const VALID_SECTIONS = new Set<Section>(
  NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id)),
);

export default function SiteAdmin() {
  const { siteId } = useParams<{ siteId: string }>();
  const { user } = AuthStore.useState();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Cached per site id, so the dashboard → site → dashboard loop (much the most
  // travelled path in the app) stops refetching the same document every time.
  const qc = useQueryClient();
  const { data: site, isPending: loading, isError: siteFailed } = useSiteDetail(siteId);

  /**
   * Drop-in replacement for the old useState setter.
   *
   * Every mutation on this page already ends by handing back the updated site,
   * and setQueryData takes either a value or an updater — exactly the two
   * shapes the fourteen existing call sites use. Writing straight to the cache
   * keeps them working untouched, and means a save is reflected on the
   * dashboard without a refetch.
   */
  const setSite = (updater: any) =>
    qc.setQueryData(siteKeys.detail(siteId ?? ''), updater);
  const [saving, setSaving] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [pendingEdits, setPendingEdits] = useState<Record<string, string>>({});
  // "seo-check" was merged into "seo" — keep old bookmarks working.
  const rawTab = searchParams.get("tab");
  const tabParam = (rawTab === "seo-check" ? "seo" : rawTab) as Section | null;
  const [activeSection, setActiveSectionState] = useState<Section>(
    tabParam && VALID_SECTIONS.has(tabParam) ? tabParam : "editor",
  );
  const activeSectionRef = useRef(activeSection);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [busyControl, setBusyControl] = useState(false);
  const { collapsed: navCollapsed } = SidebarStore.useState();
  const togglePause = async () => {
    if (!siteId) return;
    setBusyControl(true);
    try {
      const res = await toggleStatusAPI(siteId);
      // Trust the server's new status rather than flipping locally — a failed
      // toggle would otherwise leave the panel showing the wrong state.
      const next = res.data?.data?.site?.status;
      setSite((prev: any) => ({
        ...prev,
        status: next ?? (prev.status === "active" ? "inactive" : "active"),
      }));
      toast.success(next === "inactive" ? "Site paused" : "Site is live again");
    } catch {
      toast.error("Could not change the site status");
    } finally {
      setBusyControl(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!siteId) return;
    // Typing the name is deliberate friction: this drops files, submissions
    // and analytics, and frees the URL for anyone else to take.
    const typed = window.prompt(
      `Deleting "${site?.name}" removes its files, form submissions and analytics, and frees its URL. This cannot be undone.\n\nType the site name to confirm:`,
    );
    if (typed === null) return;
    if (typed.trim() !== site?.name?.trim()) {
      toast.error("That didn't match the site name — nothing was deleted");
      return;
    }
    setBusyControl(true);
    try {
      await deleteSiteAPI(siteId);
      toast.success("Site deleted");
      navigate("/dashboard");
    } catch {
      toast.error("Could not delete the site");
      setBusyControl(false);
    }
  };

  const setActiveSection = (section: Section) => {
    setActiveSectionState(section);
    activeSectionRef.current = section;
    if (section === "support") setUnreadSupportCount(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", section);
        return next;
      },
      { replace: true },
    );
  };
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Slug editing
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugValue, setSlugValue] = useState("");
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugError, setSlugError] = useState("");

  // Redeploy
  const [redeployMode, setRedeployMode] = useState<"zip" | "files">("zip");
  const [redeploying, setRedeploying] = useState(false);
  const [redeployFile, setRedeployFile] = useState<File | null>(null);
  const [redeployFiles, setRedeployFilesState] = useState<File[]>([]);
  const [redeployPaths, setRedeployPaths] = useState<string[]>([]);
  const zipRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);

  // Custom domain
  const [domainValue, setDomainValue] = useState("");
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainRemoving, setDomainRemoving] = useState(false);

  // Large redeploy payment gate
  const [payModalOpen, setPayModalOpen] = useState(false);

  // Direct "Upgrade to PRO" payment gate
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const hasChanges = Object.keys(pendingEdits).length > 0;
  const previewUrl = site ? `${BASE_URL}/sites/${site.slug}/` : "";

  // The slug and domain inputs are seeded from the site once it arrives. They
  // stay local state because the user types into them, and resetting on every
  // cache write would wipe an edit mid-keystroke — so this syncs on identity
  // change only, not on every render.
  useEffect(() => {
    if (!site) return;
    setSlugValue(site.slug);
    setDomainValue(site.customDomain || "");
  }, [site?.siteId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (siteFailed) toast.error("Failed to load site");
  }, [siteFailed]);

  // Find this site's active support request (if any) so we can listen for
  // expert replies even while the customer is on a different tab.
  const [activeSupportRequestId, setActiveSupportRequestId] = useState<
    string | null
  >(null);
  useEffect(() => {
    if (!siteId) return;
    getMyRequestsAPI()
      .then((res) => {
        const active = res.data.data.requests.find(
          (r: any) =>
            r.siteId === siteId && ["pending", "accepted"].includes(r.status),
        );
        setActiveSupportRequestId(active?._id || null);
      })
      .catch(() => {});
  }, [siteId]);

  useEffect(() => {
    if (!activeSupportRequestId) return;
    const socket = getSocket();
    const joinRoom = () => socket.emit("join", activeSupportRequestId);
    joinRoom();
    socket.on("connect", joinRoom);

    const onMessage = (msg: any) => {
      if (
        msg.senderId?._id !== user?.id &&
        activeSectionRef.current !== "support"
      ) {
        setUnreadSupportCount((c) => c + 1);
      }
    };
    socket.on("message", onMessage);

    return () => {
      socket.emit("leave", activeSupportRequestId);
      socket.off("connect", joinRoom);
      socket.off("message", onMessage);
    };
  }, [activeSupportRequestId, user?.id]);

  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSave = async (updates: Record<string, string>) => {
    if (!siteId || !site) return;
    const page = site.pages[activePage];
    if (!page) return;
    setSaving(true);
    try {
      const res = await updateContentAPI(siteId, page.filename, updates);
      setSite(res.data.data.site);
      setPendingEdits({});
      toast.success("Content deployed!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSlugChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlugValue(cleaned);
    if (cleaned.length < 3) setSlugError("At least 3 characters");
    else if (cleaned.length > 50) setSlugError("50 characters max");
    else setSlugError("");
  };

  const handleSlugSave = async () => {
    if (!siteId || slugError || !slugValue) return;
    setSlugSaving(true);
    try {
      const res = await updateSlugAPI(siteId, slugValue);
      setSite(res.data.data.site);
      setEditingSlug(false);
      toast.success("URL updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update URL");
    } finally {
      setSlugSaving(false);
    }
  };

  const redeployTotalSize = redeployFile
    ? redeployFile.size
    : redeployFiles.reduce((acc, f) => acc + f.size, 0);

  const handleRedeploy = async () => {
    if (!siteId) return;
    const hasSelection = redeployFile || redeployFiles.length > 0;
    if (!hasSelection) {
      toast.error("Please select a file first");
      return;
    }

    // Free sites need a credit for redeploys over 5MB — PRO sites are unlimited
    if (site?.plan !== "paid" && redeployTotalSize > 5 * 1024 * 1024) {
      try {
        const info = await getPaymentInfoAPI();
        if ((info.data.data.credits || 0) < 1) {
          setPayModalOpen(true);
          return;
        }
      } catch {
        // fall through — backend enforces with a 402
      }
    }

    await performRedeploy();
  };

  // Called from the payment modal once Razorpay checkout is verified
  const handlePaidAndRedeploy = async () => {
    setPayModalOpen(false);
    await performRedeploy();
  };

  const performRedeploy = async () => {
    if (!siteId) return;
    setRedeploying(true);
    try {
      let res;
      if (redeployFile) {
        const fd = new FormData();
        fd.append("file", redeployFile);
        res = await redeployZipAPI(siteId, fd);
      } else {
        const fd = new FormData();
        redeployFiles.forEach((f) => fd.append("files", f));
        fd.append("paths", JSON.stringify(redeployPaths));
        res = await redeployFilesAPI(siteId, fd);
      }
      setSite(res.data.data.site);
      setActivePage(0);
      setRedeployFile(null);
      setRedeployFilesState([]);
      toast.success("Site redeployed successfully!");
    } catch (err: any) {
      if (err.response?.status === 402) {
        setPayModalOpen(true);
      } else {
        toast.error(err.response?.data?.message || "Redeploy failed");
      }
    } finally {
      setRedeploying(false);
    }
  };

  // Upgrading a project is a dynamic, per-site payment (priced from its size +
  // pages), so the button opens the payment modal directly — the modal fetches
  // the quote and, once paid, the backend has already marked the site PRO.
  const handleUpgradeClick = () => {
    if (!siteId) return;
    setUpgradeModalOpen(true);
  };

  // Called from the payment modal once checkout is verified — the site is
  // already marked PRO server-side, so just refetch to reflect the new plan.
  const handlePaidAndUpgrade = async () => {
    if (!siteId) return;
    setUpgrading(true);
    try {
      // A real refetch: the plan changed server-side during checkout, so there
      // is nothing local to write. The list is invalidated too — the dashboard
      // card shows the plan badge and would otherwise still read "Free".
      await qc.invalidateQueries({ queryKey: siteKeys.detail(siteId) });
      qc.invalidateQueries({ queryKey: siteKeys.list() });
      setUpgradeModalOpen(false);
      toast.success("Site upgraded to PRO!");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Upgrade succeeded but refresh failed — reload the page",
      );
    } finally {
      setUpgrading(false);
    }
  };

  const handleDomainSave = async () => {
    if (!siteId || !domainValue.trim()) return;
    setDomainSaving(true);
    try {
      const res = await setCustomDomainAPI(siteId, domainValue.trim());
      setSite(res.data.data.site);
      setDomainValue(res.data.data.site.customDomain || "");
      toast.success("Custom domain saved!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save domain");
    } finally {
      setDomainSaving(false);
    }
  };

  const handleDomainRemove = async () => {
    if (!siteId || !window.confirm("Remove custom domain?")) return;
    setDomainRemoving(true);
    try {
      const res = await removeCustomDomainAPI(siteId);
      setSite(res.data.data.site);
      setDomainValue("");
      toast.success("Custom domain removed");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove domain");
    } finally {
      setDomainRemoving(false);
    }
  };

  const handleElementsAction = async (
    actions: {
      key: string;
      action: "hide" | "show" | "duplicate" | "delete";
    }[],
  ) => {
    if (!siteId || !site) return;
    const page = site.pages[activePage];
    if (!page) return;
    try {
      const res = await updateElementsAPI(siteId, page.filename, actions);
      setSite(res.data.data.site);
      const verbs: Record<string, string> = {
        duplicate: "duplicated",
        hide: "hidden",
        show: "visible again",
        delete: "deleted",
      };
      toast.success(`Element ${verbs[actions[0].action]} and deployed`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleAddElement = async (
    afterKey: string,
    type: "text" | "image" | "link",
    value: string,
    href?: string,
  ) => {
    if (!siteId || !site) return;
    const page = site.pages[activePage];
    if (!page) return;
    try {
      const res = await addElementAPI(
        siteId,
        page.filename,
        afterKey,
        type,
        value,
        href,
      );
      setSite(res.data.data.site);
      toast.success("Element added and deployed");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not add element");
    }
  };

  const handlePageSwitch = (idx: number) => {
    if (
      hasChanges &&
      !window.confirm("You have unsaved changes. Switch page anyway?")
    )
      return;
    setActivePage(idx);
    setPendingEdits({});
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Both early states keep the header, so a slow load or a bad id still leaves
  // the user somewhere they recognise with a way out.
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <ShellHeader />
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-white">
        <ShellHeader />
        <div className="py-32 text-center">
          <p className="text-slate-500">Site not found.</p>
          <Link
            to="/dashboard"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const pages: Page[] = site.pages || [];
  const currentPage = pages[activePage];
  // JS-rendered apps (React/Vue builds) have no instrumentable content on any page
  const isJSRenderedApp =
    pages.length > 0 && pages.every((p) => !p.contentMap?.length);

  const currentSection = NAV_GROUPS.flatMap((g) => g.items).find(
    (i) => i.id === activeSection,
  );

  return (
    <div className="min-h-screen bg-white">
      <ShellHeader />

      <div className="flex">
        {/* Site sidebar. Sections are local state driving ?tab=, not routes, so
            these are buttons — styled to match the workspace SideNav exactly so
            the two shells read as one product. */}
        <nav className={navShellClass(navCollapsed)}>
          <Link
            to="/dashboard"
            title={navCollapsed ? "All sites" : undefined}
            className={
              navCollapsed
                ? "mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary"
                : "mb-3 flex items-center gap-1.5 px-2.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:text-primary"
            }
          >
            <ChevronRight size={13} className="rotate-180" />
            {!navCollapsed && "All sites"}
          </Link>

          {/* Which site you are in — the sections below are meaningless without
              it, and the breadcrumb alone scrolls away. Collapsed it shrinks to
              the initial plus its status dot, which still answers "which site". */}
          {navCollapsed ? (
            <div
              title={site.name}
              className="relative mx-auto mb-4 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-700"
            >
              {site.name?.[0]?.toUpperCase() || "?"}
              <span
                className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-white ${
                  site.status === "active" ? "bg-green-600" : "bg-amber-500"
                }`}
              />
            </div>
          ) : (
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-[7px] w-[7px] shrink-0 rounded-full ${
                    site.status === "active" ? "bg-green-600" : "bg-amber-500"
                  }`}
                />
                <span className="truncate text-[13px] font-semibold text-slate-900">
                  {site.name}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">
                {site.customDomain || publicSiteUrl(site.slug).replace(/^https?:\/\//, "")}
              </p>
            </div>
          )}

          <div className="flex flex-1 flex-col gap-5">
            {NAV_GROUPS.map((group, gi) => (
              <div key={group.label} className="flex flex-col gap-0.5">
                {navCollapsed
                  ? gi > 0 && <span className="mx-auto mb-1 h-px w-6 bg-slate-200" />
                  : (
                    <span className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      {group.label}
                    </span>
                  )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeSection === item.id;
                  const danger = item.id === "controls";
                  const unread = item.id === "support" && unreadSupportCount > 0;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      title={navCollapsed ? item.label : undefined}
                      className={`${navRowClass(active, { danger, collapsed: navCollapsed })} text-left`}
                    >
                      <span className="relative shrink-0">
                        <Icon size={16} />
                        {navCollapsed && unread && (
                          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-white" />
                        )}
                      </span>
                      {!navCollapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {unread && (
                            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                              {unreadSupportCount > 9 ? "9+" : unreadSupportCount}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <CollapseToggle collapsed={navCollapsed} />
        </nav>

        <main className="min-w-0 flex-1">
          {/* Page bar: where you are, and what you can do to this site. Sticky
              so Preview and Upgrade stay reachable down a long section. */}
          <div className="sticky top-14 z-30 border-b border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur">
            <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
                  <Link to="/dashboard" className="transition-colors hover:text-primary">
                    Dashboard
                  </Link>
                  <span>/</span>
                  <span className="max-w-[160px] truncate text-slate-500">{site.name}</span>
                  <span>/</span>
                  <span className="font-medium text-slate-700">
                    {currentSection?.label ?? "Editor"}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2.5">
                  <h1 className="font-bebas text-2xl leading-none text-slate-900">
                    {currentSection?.label ?? "Editor"}
                  </h1>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      site.status === "active"
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        site.status === "active" ? "bg-green-600" : "bg-slate-400"
                      }`}
                    />
                    {site.status === "active" ? "Active" : "Paused"}
                  </span>
                  {site.plan === "paid" && (
                    <span className="flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                      <Crown size={10} className="fill-amber-500 text-amber-500" /> PRO
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {/* Save state and publishing, only where edits are possible.
                    Showing "All changes saved" on the Analytics tab would be
                    answering a question nobody asked. */}
                {activeSection === "editor" && (
                  <>
                    <span
                      className={`hidden rounded-lg px-2.5 py-1.5 text-[12px] font-semibold sm:block ${
                        hasChanges
                          ? "bg-amber-50 text-amber-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {hasChanges
                        ? `${Object.keys(pendingEdits).length} unsaved change${
                            Object.keys(pendingEdits).length === 1 ? "" : "s"
                          }`
                        : "All changes saved"}
                    </span>
                    {hasChanges && (
                      <button
                        onClick={() => setPendingEdits({})}
                        className="flex items-center gap-1 rounded-lg px-2 py-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900"
                      >
                        <X size={13} /> Discard
                      </button>
                    )}
                    <button
                      onClick={() => handleSave(pendingEdits)}
                      disabled={!hasChanges || saving}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {saving ? (
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Rocket size={13} />
                      )}
                      {saving ? "Publishing…" : "Publish changes"}
                    </button>
                  </>
                )}

                {site.plan !== "paid" && (
                  <button
                    onClick={handleUpgradeClick}
                    disabled={upgrading}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
                  >
                    {upgrading ? (
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Crown size={13} className="fill-white" />
                    )}
                    Upgrade to PRO
                  </button>
                )}
                <a
                  href={site ? publicSiteUrl(site.slug) : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                >
                  <ExternalLink size={13} /> Preview Site
                </a>
              </div>
            </div>
          </div>

          <div className="px-6 pb-16 pt-6">
      {/* The old floating save bar lived here. Publishing now sits in the page
          bar above, so the controls are in one place instead of a second bar
          sliding over the content the moment you type. */}

      {/* Large redeploy payment modal */}
      <PaymentModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        totalSize={redeployTotalSize}
        onPaidConfirm={handlePaidAndRedeploy}
      />

      {/* Direct "Upgrade to PRO" payment modal — dynamic per-site pricing */}
      <PaymentModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        siteId={siteId}
        onPaidConfirm={handlePaidAndUpgrade}
        title="Upgrade to PRO"
      />

      {/* Back to top */}
      <AnimatePresence>
        {showTopBtn && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-40 w-11 h-11 flex items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary-dark transition-colors"
            title="Back to top"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-[1180px]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="items-start">

            {/* Mobile section selector */}
            <div className="md:hidden w-full mb-2">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value as Section)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium bg-white"
              >
                {NAV_GROUPS.flatMap((g) => g.items).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Site URL */}
              {activeSection === "url" && (
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 mb-4">
                    The public link where your site is hosted on Chasqr.
                  </p>
                  {editingSlug ? (
                    <div className="space-y-2">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary">
                        <span className="bg-slate-50 text-slate-400 text-sm px-3 py-2 border-r border-slate-200 whitespace-nowrap shrink-0">
                          https://
                        </span>
                        <input
                          autoFocus
                          value={slugValue}
                          onChange={(e) => handleSlugChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSlugSave();
                            if (e.key === "Escape") {
                              setEditingSlug(false);
                              setSlugValue(site.slug);
                              setSlugError("");
                            }
                          }}
                          className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white font-mono min-w-0"
                          maxLength={50}
                        />
                        <span className="bg-slate-50 text-slate-400 text-sm px-3 py-2 border-l border-slate-200 whitespace-nowrap shrink-0">
                          .{APP_DOMAIN}
                        </span>
                        <button
                          onClick={handleSlugSave}
                          disabled={!!slugError || slugSaving}
                          className="px-3 py-2 text-green-600 hover:text-green-700 disabled:opacity-40 border-l border-slate-200"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingSlug(false);
                            setSlugValue(site.slug);
                            setSlugError("");
                          }}
                          className="px-3 py-2 text-slate-400 hover:text-slate-600 border-l border-slate-200"
                        >
                          <X size={15} />
                        </button>
                      </div>
                      {slugError && (
                        <p className="text-xs text-red-500">{slugError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <a
                        href={publicSiteUrl(site.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono text-primary truncate hover:underline"
                      >
                        {publicSiteUrl(site.slug)}
                      </a>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              publicSiteUrl(site.slug),
                            );
                            toast.success("Link copied");
                          }}
                          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
                        >
                          <Link2 size={11} /> Copy
                        </button>
                        <button
                          onClick={() => setEditingSlug(true)}
                          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
                        >
                          <Pencil size={11} /> Edit URL
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Domain — free for all sites */}
              {activeSection === "domain" && (
                  <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 mb-4">
                      Connect your own domain to this site.
                    </p>

                    {site.customDomain ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <a
                            href={`https://${site.customDomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-mono text-green-600 truncate hover:underline"
                          >
                            https://{site.customDomain}
                          </a>
                          <button
                            onClick={handleDomainRemove}
                            disabled={domainRemoving}
                            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0 disabled:opacity-50"
                          >
                            <X size={11} />{" "}
                            {domainRemoving ? "Removing..." : "Remove"}
                          </button>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1.5">
                          <p className="font-semibold">DNS setup required</p>
                          <p>Add this A record at your domain registrar:</p>
                          <div className="font-mono bg-white border border-blue-200 rounded px-2 py-1.5 text-blue-900 space-y-1">
                            <div className="flex gap-4">
                              <span className="text-slate-400 w-16">Type</span>
                              <span>A</span>
                            </div>
                            <div className="flex gap-4">
                              <span className="text-slate-400 w-16">Name</span>
                              <span>@</span>
                            </div>
                            <div className="flex gap-4">
                              <span className="text-slate-400 w-16">Value</span>
                              <span className="text-primary">
                                137.184.18.70
                              </span>
                            </div>
                            <div className="flex gap-4">
                              <span className="text-slate-400 w-16">TTL</span>
                              <span>3600</span>
                            </div>
                          </div>
                          <p className="text-blue-600">
                            DNS changes can take a few minutes to a few hours to
                            propagate. HTTPS is issued automatically once your
                            domain resolves here — no extra setup needed.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary">
                          <span className="bg-slate-50 text-slate-400 text-sm px-3 py-2 border-r border-slate-200 whitespace-nowrap shrink-0">
                            http://
                          </span>
                          <input
                            value={domainValue}
                            onChange={(e) =>
                              setDomainValue(
                                e.target.value
                                  .toLowerCase()
                                  .replace(/^https?:\/\//, ""),
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleDomainSave();
                            }}
                            placeholder="yourdomain.com"
                            className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white font-mono"
                          />
                          <button
                            onClick={handleDomainSave}
                            disabled={domainSaving || !domainValue.trim()}
                            className="px-3 py-2 text-green-600 hover:text-green-700 disabled:opacity-40 border-l border-slate-200"
                          >
                            <Check size={15} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400">
                          Enter your domain (e.g. mysite.com or blog.mysite.com)
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {/* Update Files */}
              {activeSection === "files" && (
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      Upload a new version of your site. All existing files will
                      be replaced. Your URL and settings stay the same.
                    </p>
                  </div>

                  {/* Mode toggle */}
                  <div className="flex bg-slate-100 rounded-lg p-1 w-fit">
                    {(["zip", "files"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setRedeployMode(m);
                          setRedeployFile(null);
                          setRedeployFilesState([]);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                          redeployMode === m
                            ? "bg-white text-primary shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {m === "zip" ? (
                          <Archive size={13} />
                        ) : (
                          <FileText size={13} />
                        )}
                        {m === "zip" ? "ZIP File" : "Files"}
                      </button>
                    ))}
                  </div>

                  {/* File picker */}
                  <div
                    onClick={() =>
                      redeployMode === "zip"
                        ? zipRef.current?.click()
                        : filesRef.current?.click()
                    }
                    className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary-light/30 transition-colors bg-white"
                  >
                    {redeployMode === "zip" ? (
                      redeployFile ? (
                        <p className="text-sm text-primary font-medium">
                          📦 {redeployFile.name} —{" "}
                          {(redeployFile.size / 1024).toFixed(1)} KB
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400">
                          Click to select a ZIP file
                        </p>
                      )
                    ) : redeployFiles.length > 0 ? (
                      <p className="text-sm text-primary font-medium">
                        📄 {redeployFiles.length} file
                        {redeployFiles.length !== 1 ? "s" : ""} selected
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400">
                        Click to select files or a folder
                      </p>
                    )}
                  </div>

                  <input
                    ref={zipRef}
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setRedeployFile(f);
                    }}
                  />
                  <input
                    ref={filesRef}
                    type="file"
                    multiple
                    // @ts-ignore
                    webkitdirectory=""
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const paths = files.map(
                        (f) => (f as any).webkitRelativePath || f.name,
                      );
                      setRedeployFilesState(files);
                      setRedeployPaths(paths);
                    }}
                  />

                  <button
                    onClick={handleRedeploy}
                    disabled={
                      redeploying ||
                      (!redeployFile && redeployFiles.length === 0)
                    }
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {redeploying ? (
                      <>
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />{" "}
                        Redeploying...
                      </>
                    ) : (
                      <>
                        <Rocket size={14} /> Redeploy Site
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* GitHub */}
              {activeSection === "git" && siteId && (
                <GitSettings siteId={siteId} site={site} onChange={setSite} />
              )}

              {activeSection === "files" && siteId && (
                <div className="mt-6">
                  {site.plan !== "paid" ? (
                    <ProLockedGate
                      title="Attach Source Code — PRO Feature"
                      description="Let experts receive your real project source (not just build output) when you request support. Upgrade this site to PRO to unlock it, along with unlimited upload size."
                      onUpgradeClick={handleUpgradeClick}
                      upgrading={upgrading}
                    />
                  ) : (
                    <SourceArchiveControl
                      siteId={siteId}
                      hasSourceArchive={site.hasSourceArchive}
                      onChange={setSite}
                    />
                  )}
                </div>
              )}

              {/* Editor */}
              {activeSection === "editor" && (
                <div>
                  {pages.length > 1 && (
                    <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {pages.map((page, idx) => (
                        <button
                          key={page.filename}
                          onClick={() => handlePageSwitch(idx)}
                          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                            activePage === idx
                              ? "border-primary text-primary"
                              : "border-transparent text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <FileCode size={13} />
                          {page.filename}
                          <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full ml-1">
                            {page.contentMap.length}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!currentPage || currentPage.contentMap.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
                      <FileCode
                        size={40}
                        className="text-slate-300 mx-auto mb-3"
                      />
                      <p className="text-slate-600 font-medium">
                        No editable content found
                      </p>
                      <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
                        JS-rendered apps (React, Vue, etc.) build their pages at
                        runtime, so their content can't be edited here. Hosting,
                        custom domains, SEO, and analytics still work — update
                        content by redeploying a new build.
                      </p>
                    </div>
                  ) : (
                    <ContentEditor
                      contentMap={currentPage.contentMap}
                      onSave={handleSave}
                      isSaving={saving}
                      externalEdits={pendingEdits}
                      onEditsChange={setPendingEdits}
                      siteId={siteId}
                      pageFilename={currentPage.filename}
                      previewBaseUrl={previewUrl}
                      previewOpen={previewOpen}
                      onPreviewOpenChange={setPreviewOpen}
                      onElementsAction={handleElementsAction}
                      onAddElement={handleAddElement}
                    />
                  )}
                </div>
              )}

              {/* Layout opens Studio directly. A page still holding a grid
                  layout keeps the choice below, because that layout can only
                  be edited in the builder that made it. */}
              {activeSection === "layout" &&
                siteId &&
                currentPage &&
                !(currentPage as any).layout?.length && (
                  <Navigate
                    replace
                    to={`/sites/${siteId}/studio?page=${encodeURIComponent(
                      currentPage.filename,
                    )}`}
                  />
                )}

              {activeSection === "layout" &&
                site &&
                siteId &&
                currentPage &&
                !!(currentPage as any).layout?.length && (
                <div>
                  <div className="mb-5 flex items-center justify-between gap-3 flex-wrap p-4 rounded-xl border border-primary/20 bg-primary-light/40">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <LayoutTemplate size={16} className="text-primary" />
                      Design this page visually with the full-screen builder — a
                      left palette of elements &amp; banners, drag-and-drop
                      canvas, and modern effects.
                    </div>
                    <Link
                      to={`/sites/${siteId}/builder?page=${encodeURIComponent(currentPage.filename)}`}
                      className="shrink-0 flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      <LayoutTemplate size={14} /> Open full-screen builder
                    </Link>
                  </div>

                  {/* The two editors use incompatible layout models, so a page
                      is designed in one or the other rather than both. */}
                  <div className="mb-5 flex items-center justify-between gap-3 flex-wrap p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MousePointer2 size={16} className="text-primary" />
                      Or design it freely in Studio — drag elements anywhere,
                      with prebuilt sections and its own phone layout.
                    </div>
                    <Link
                      to={`/sites/${siteId}/studio?page=${encodeURIComponent(currentPage.filename)}`}
                      className="shrink-0 flex items-center gap-1.5 border border-slate-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg hover:border-primary hover:text-primary transition-colors"
                    >
                      <MousePointer2 size={14} /> Open Studio
                    </Link>
                  </div>
                  {/* <LayoutBuilder
                    key={currentPage.filename}
                    siteId={siteId}
                    page={currentPage.filename}
                    initialLayout={currentPage.layout}
                    initialLayoutStyle={(currentPage as any).layoutStyle}
                    initialNav={(currentPage as any).nav}
                    initialFooter={(currentPage as any).footer}
                    onSaved={(updatedSite) => setSite(updatedSite)}
                  /> */}
                </div>
              )}

              {/* Pause & delete */}
              {activeSection === "controls" && (
                <div>
                  <p className="text-xs text-slate-500 mb-5">
                    Take this site offline temporarily, or remove it for good.
                  </p>

                  <div className="border border-slate-200 rounded-xl p-5 mb-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-slate-800 mb-1">
                          {site.status === "active"
                            ? "Pause this site"
                            : "Resume this site"}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                          {site.status === "active"
                            ? "Visitors will see an “offline” page instead of your site. Your files, domain and settings are all kept, and resuming puts it straight back."
                            : "This site is currently paused and not serving visitors. Resuming brings it back on the same URL."}
                        </p>
                      </div>
                      <button
                        onClick={togglePause}
                        disabled={busyControl}
                        className="shrink-0 inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg hover:border-slate-400 transition-colors disabled:opacity-60"
                      >
                        {site.status === "active" ? (
                          <>
                            <Pause size={14} /> Pause site
                          </>
                        ) : (
                          <>
                            <Play size={14} /> Resume site
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="border border-red-200 bg-red-50/40 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-red-700 mb-1">
                          Delete this site
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                          Removes the site, its files, submissions and analytics.
                          The URL is freed for anyone to claim. This cannot be
                          undone — pause it instead if you only want it offline.
                        </p>
                      </div>
                      <button
                        onClick={handleDeleteSite}
                        disabled={busyControl}
                        className="shrink-0 inline-flex items-center gap-1.5 bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                      >
                        <Trash2 size={14} /> Delete site
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Form submissions */}
              {activeSection === "submissions" && siteId && currentPage && (
                <div>
                  <p className="text-xs text-slate-500 mb-4">
                    Messages sent through your site's contact form.
                  </p>
                  <Submissions
                    siteId={siteId}
                    page={currentPage.filename}
                    forms={currentPage.forms}
                    isPro={site.plan === "paid"}
                    onFormsChange={(updatedSite) => setSite(updatedSite)}
                  />
                </div>
              )}

              {/* Colors */}
              {activeSection === "colors" &&
                site &&
                siteId &&
                (isJSRenderedApp ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
                    <Palette
                      size={40}
                      className="text-slate-300 mx-auto mb-3"
                    />
                    <p className="text-slate-600 font-medium">
                      Color editing not available
                    </p>
                    <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
                      JS-rendered apps (React, Vue, etc.) bundle their styles at
                      build time, so colors can't be edited here. Update your
                      theme in code and redeploy a new build.
                    </p>
                  </div>
                ) : (
                  <ColorEditor
                    siteId={siteId}
                    pages={site.pages}
                    previewBaseUrl={previewUrl}
                  />
                ))}

              {/* SEO — audit + one-click fixes, then manual fine-tuning */}
              {activeSection === "seo" && site && (
                <div className="space-y-10">
                  <SiteSeoChecker
                    siteId={site.siteId}
                    pages={site.pages}
                    onSiteUpdated={setSite}
                  />

                  <div className="border-t border-slate-200 pt-8">
                    <FaviconEditor
                      siteId={site.siteId}
                      favicon={site.favicon}
                      previewBaseUrl={previewUrl}
                      onSaved={(updated) => setSite(updated)}
                    />
                    <SEOEditor
                      siteId={site.siteId}
                      siteSlug={site.slug}
                      pages={site.pages}
                      onSaveSuccess={(updatedPages) => {
                        setSite((prev: any) => ({
                          ...prev,
                          pages: updatedPages,
                        }));
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Analytics */}
              {activeSection === "analytics" && siteId && (
                <AnalyticsChart siteId={siteId} />
              )}

              {/* Expert Help — free for all sites */}
              {activeSection === "support" && siteId && (
                <SupportSection
                  siteId={siteId}
                  hasSourceArchive={site.hasSourceArchive}
                  onActiveRequestChange={setActiveSupportRequestId}
                />
              )}
            </div>
          </div>
        </motion.div>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
