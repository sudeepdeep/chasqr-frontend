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
  Globe,
  Headset,
  Inbox,
  LayoutTemplate,
  Link2,
  Palette,
  Pencil,
  Rocket,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getPaymentInfoAPI } from "../api/payment.api";
import {
  addElementAPI,
  getSiteAPI,
  redeployFilesAPI,
  redeployZipAPI,
  removeCustomDomainAPI,
  setCustomDomainAPI,
  updateContentAPI,
  updateElementsAPI,
  updateSlugAPI,
} from "../api/site.api";
import { getMyRequestsAPI } from "../api/support.api";
import AnalyticsChart from "../components/AnalyticsChart";
import ColorEditor from "../components/ColorEditor";
import ContentEditor from "../components/ContentEditor";
import FaviconEditor from "../components/FaviconEditor";
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
  | "editor"
  | "layout"
  | "colors"
  | "seo"
  | "analytics"
  | "submissions"
  | "support";

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
];

const VALID_SECTIONS = new Set<Section>(
  NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id)),
);

export default function SiteAdmin() {
  const { siteId } = useParams<{ siteId: string }>();
  const { user } = AuthStore.useState();
  const [searchParams, setSearchParams] = useSearchParams();
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!siteId) return;
    getSiteAPI(siteId)
      .then((res) => {
        const s = res.data.data.site;
        setSite(s);
        setSlugValue(s.slug);
        setDomainValue(s.customDomain || "");
      })
      .catch(() => toast.error("Failed to load site"))
      .finally(() => setLoading(false));
  }, [siteId]);

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
      const res = await getSiteAPI(siteId);
      setSite(res.data.data.site);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-white pt-24 text-center">
        <p className="text-slate-500">Site not found.</p>
        <Link
          to="/dashboard"
          className="text-primary text-sm mt-2 inline-block hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const pages: Page[] = site.pages || [];
  const currentPage = pages[activePage];
  // JS-rendered apps (React/Vue builds) have no instrumentable content on any page
  const isJSRenderedApp =
    pages.length > 0 && pages.every((p) => !p.contentMap?.length);

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-6">
      {/* Sticky save bar */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-16 left-0 right-0 z-40 bg-primary shadow-lg"
          >
            <div className="max-w-[1300px] mx-auto px-6 h-12 flex items-center justify-between">
              <span className="text-white text-sm font-medium">
                {Object.keys(pendingEdits).length} unsaved change
                {Object.keys(pendingEdits).length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPendingEdits({})}
                  className="flex items-center gap-1 text-white/70 hover:text-white text-sm transition-colors"
                >
                  <X size={14} /> Discard
                </button>
                <button
                  onClick={() => handleSave(pendingEdits)}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-white text-primary text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-primary-light transition-colors disabled:opacity-60"
                >
                  {saving ? (
                    <span className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full inline-block" />
                  ) : (
                    <Rocket size={13} />
                  )}
                  {saving ? "Deploying..." : "Save & Deploy"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <div className="max-w-[1300px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-6">
            <Link
              to="/dashboard"
              className="hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight size={14} />
            <span className="text-slate-700 font-medium">{site.name}</span>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="font-bebas text-5xl text-slate-900">
                {site.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {site.plan === "paid" && (
                  <span
                    title="PRO site — unlimited upload size"
                    className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-300"
                  >
                    <Crown
                      size={11}
                      className="fill-amber-500 text-amber-500"
                    />{" "}
                    PRO
                  </span>
                )}
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    site.status === "active"
                      ? "bg-green-50 text-green-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {site.status}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Eye size={11} /> {site.visits} visits
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* {activeSection === 'editor' && currentPage && (
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <Eye size={14} /> Preview Changes
                </button>
              )} */}
              {site.plan !== "paid" && (
                <button
                  onClick={handleUpgradeClick}
                  disabled={upgrading}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-colors disabled:opacity-60"
                >
                  {upgrading ? (
                    <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full inline-block" />
                  ) : (
                    <Crown size={14} className="fill-white" />
                  )}
                  Upgrade to PRO
                </button>
              )}
              <a
                href={site ? publicSiteUrl(site.slug) : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <ExternalLink size={14} /> Preview Site
              </a>
            </div>
          </div>

          <div className="flex gap-8 items-start">
            {/* Left sidebar nav */}
            <nav className="w-56 shrink-0 sticky top-24 hidden md:block">
              {NAV_GROUPS.map((group) => (
                <div key={group.label} className="mb-6">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 mb-2">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveSection(item.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                            active
                              ? "bg-primary-light text-primary"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Icon
                            size={15}
                            className={
                              active ? "text-primary" : "text-slate-400"
                            }
                          />
                          {item.label}
                          {item.id === "domain" && site.customDomain && (
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-auto" />
                          )}
                          {item.id === "support" && unreadSupportCount > 0 && (
                            <span className="ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-primary text-white text-[10px] font-semibold rounded-full">
                              {unreadSupportCount > 9
                                ? "9+"
                                : unreadSupportCount}
                            </span>
                          )}
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
                  <h2 className="font-bebas text-2xl text-slate-900 mb-1">
                    Site URL
                  </h2>
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
                    <h2 className="font-bebas text-2xl text-slate-900 mb-1">
                      Custom Domain
                    </h2>
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
                    <h2 className="font-bebas text-2xl text-slate-900 mb-1">
                      Update Site Files
                    </h2>
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
                    <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
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

              {/* Layout builder */}
              {activeSection === "layout" && site && siteId && currentPage && (
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

              {/* Form submissions */}
              {activeSection === "submissions" && siteId && currentPage && (
                <div>
                  <h2 className="font-bebas text-2xl text-slate-900 mb-1">
                    Form Submissions
                  </h2>
                  <p className="text-xs text-slate-500 mb-4">
                    Messages sent through your site's contact form.
                  </p>
                  <Submissions
                    siteId={siteId}
                    page={currentPage.filename}
                    forms={currentPage.forms}
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
  );
}
