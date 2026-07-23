import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCorners,
  DragOverlay, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, Trash2, Type, Image as ImageIcon, MousePointerClick, GripVertical,
  Monitor, Smartphone, Save, Columns, Upload, Palette, Sparkles, Paintbrush, Mail,
  Heading as HeadingIcon, Film, PanelTop, PanelBottom, Link2,
  AlignLeft, AlignCenter, AlignRight, Ruler, MoveHorizontal,
  GalleryHorizontal, Wand2, ArrowLeft, ImagePlus, Layers, Square, ExternalLink,
} from "lucide-react";
import StyleToolbar from "./StyleToolbar";
import { updateLayoutAPI, uploadAssetAPI } from "../api/site.api";

type BlockType = "text" | "heading" | "image" | "button" | "form" | "embed" | "carousel";
type Align = "left" | "center" | "right";
interface Block { id: string; type: BlockType; text?: string; src?: string; alt?: string; href?: string; target?: string; style?: string; align?: Align; images?: string[]; successMsg?: string; }
interface Column { id: string; span: number; blocks: Block[]; }
interface Section {
  id: string; columns: Column[];
  bg?: string; glass?: boolean; radius?: number; padY?: number; full?: boolean;
  bgImage?: string; overlay?: string; minH?: number; shadow?: boolean;
}
interface LayoutStyle { bg?: string }

interface NavLink { id: string; label: string; href: string; }
interface NavConfig { enabled: boolean; brand?: string; brandImg?: string; links: NavLink[]; bg?: string; color?: string; sticky?: boolean; glass?: boolean; shadow?: boolean; }
interface FooterConfig { enabled: boolean; text?: string; links: NavLink[]; bg?: string; color?: string; }

const emptyNav = (): NavConfig => ({ enabled: false, brand: "", links: [], bg: "#ffffff", color: "#0f172a", sticky: false });
const emptyFooter = (): FooterConfig => ({ enabled: false, text: "", links: [], bg: "#0f172a", color: "#e2e8f0" });

// Live preview of a section's background/effect settings (mirrors the renderer).
function sectionPreviewStyle(sec: Section): React.CSSProperties {
  const s: React.CSSProperties = {};
  if (sec.bgImage) {
    // Hero: overlay gradient layered over the image (uploaded site-relative
    // paths won't resolve in the builder, but pasted URLs preview correctly).
    const ov = sec.overlay || "rgba(15,23,42,0.55)";
    s.backgroundImage = `linear-gradient(${ov}, ${ov}), url(${sec.bgImage})`;
    s.backgroundSize = "cover";
    s.backgroundPosition = "center";
    s.color = "#fff";
  } else if (sec.glass) {
    s.background = "rgba(148,163,184,0.18)";
    s.backdropFilter = "blur(14px)";
    (s as any).WebkitBackdropFilter = "blur(14px)";
    s.border = "1px solid rgba(255,255,255,0.4)";
  } else if (sec.bg) s.background = sec.bg;
  if (sec.radius) s.borderRadius = sec.radius;
  if (sec.shadow) s.boxShadow = "0 18px 40px -18px rgba(15,23,42,.35)";
  if (sec.minH) { s.minHeight = sec.minH; s.display = "flex"; s.flexDirection = "column"; s.justifyContent = "center"; }
  if (sec.padY != null) { s.paddingTop = sec.padY; s.paddingBottom = sec.padY; }
  if (sec.glass || sec.bg || sec.bgImage) { s.paddingLeft = 20; s.paddingRight = 20; }
  return s;
}

const uid = () => Math.random().toString(36).slice(2, 10);

// Client-side mirror of the backend's embed allowlist — used only to show a
// live preview / friendly warning in the builder. The backend re-validates
// independently before ever rendering an iframe on the live site.
function toEmbedSrcPreview(raw: string): string | null {
  let url: URL;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") { const id = url.searchParams.get("v"); return id ? `https://www.youtube.com/embed/${id}` : null; }
    if (url.pathname.startsWith("/embed/")) return url.toString();
    if (url.pathname.startsWith("/shorts/")) { const id = url.pathname.split("/")[2]; return id ? `https://www.youtube.com/embed/${id}` : null; }
    return null;
  }
  if (host === "youtu.be") { const id = url.pathname.slice(1); return id ? `https://www.youtube.com/embed/${id}` : null; }
  if (host === "vimeo.com") { const id = url.pathname.split("/").filter(Boolean)[0]; return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null; }
  if (host === "player.vimeo.com") return url.toString();
  if (host === "google.com" && url.pathname.startsWith("/maps/embed")) return url.toString();
  if (host === "google.com" && url.pathname.startsWith("/maps")) { const q = url.searchParams.get("q") || url.pathname; return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`; }
  if (host === "maps.google.com") { const q = url.searchParams.get("q") || ""; return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`; }
  return null;
}

// Distribute 12 grid units as evenly as possible across n columns.
function evenSpans(n: number): number[] {
  const base = Math.floor(12 / n);
  const spans = Array(n).fill(base);
  let rem = 12 - base * n;
  for (let i = 0; rem > 0; i++, rem--) spans[i]++;
  return spans;
}

function newBlock(type: BlockType): Block {
  if (type === "heading") return { id: uid(), type, text: "Section Heading" };
  if (type === "image") return { id: uid(), type, src: "", alt: "" };
  if (type === "button") return { id: uid(), type, text: "Click me", href: "#", target: "" };
  if (type === "form") return { id: uid(), type, text: "Send message", successMsg: "Thanks — we'll be in touch!" };
  if (type === "embed") return { id: uid(), type, src: "" };
  if (type === "carousel") return { id: uid(), type, images: [] };
  return { id: uid(), type, text: "Your text here" };
}
function newSection(cols = 1): Section {
  const spans = evenSpans(cols);
  return { id: uid(), columns: spans.map((span) => ({ id: uid(), span, blocks: [] })) };
}

// Section presets ("banner" / composite blocks) inserted from the palette.
type PresetKind = "image-banner" | "text-over-image" | "carousel" | "image-text";
function newPreset(kind: PresetKind): Section {
  const col = (span: number, blocks: Block[]): Column => ({ id: uid(), span, blocks });
  if (kind === "image-banner") {
    return { id: uid(), full: true, columns: [col(12, [newBlock("image")])] };
  }
  if (kind === "text-over-image") {
    const heading: Block = { id: uid(), type: "heading", text: "Big bold headline", align: "center", style: "color: #ffffff; font-size: 3rem" };
    const text: Block = { id: uid(), type: "text", text: "A short supporting line that sits over your banner image.", align: "center", style: "color: #f1f5f9" };
    const btn: Block = { id: uid(), type: "button", text: "Get started", href: "#", align: "center" };
    return { id: uid(), full: true, minH: 420, overlay: "linear-gradient(rgba(15,23,42,0.55), rgba(15,23,42,0.55))", bgImage: "", columns: [col(12, [heading, text, btn])] };
  }
  if (kind === "carousel") {
    return { id: uid(), full: true, columns: [col(12, [newBlock("carousel")])] };
  }
  // image-text: two columns side by side
  const img: Block = { id: uid(), type: "image", src: "", alt: "" };
  const h: Block = { id: uid(), type: "heading", text: "A feature or story" };
  const p: Block = { id: uid(), type: "text", text: "Describe it here with a sentence or two of supporting copy." };
  const b: Block = { id: uid(), type: "button", text: "Learn more", href: "#" };
  return { id: uid(), columns: [col(6, [img]), col(6, [h, p, b])] };
}

interface Props {
  siteId: string;
  page: string;
  initialLayout?: Section[];
  initialLayoutStyle?: LayoutStyle;
  initialNav?: NavConfig;
  initialFooter?: FooterConfig;
  fullscreen?: boolean;     // render as a dedicated full-page builder (palette + canvas)
  onExit?: () => void;      // back button in fullscreen mode
  previewUrl?: string;      // public site URL for the "Preview" button (fullscreen)
  onSaved?: (site: any) => void;
}

export default function LayoutBuilder({ siteId, page, initialLayout, initialLayoutStyle, initialNav, initialFooter, fullscreen, onExit, previewUrl, onSaved }: Props) {
  const [sections, setSections] = useState<Section[]>(initialLayout && initialLayout.length ? initialLayout : []);
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>(initialLayoutStyle || {});
  const [nav, setNav] = useState<NavConfig>(initialNav ? { ...emptyNav(), ...initialNav } : emptyNav());
  const [footer, setFooter] = useState<FooterConfig>(initialFooter ? { ...emptyFooter(), ...initialFooter } : emptyFooter());
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  const [settingsFor, setSettingsFor] = useState<string | null>(null); // section id whose style panel is open
  const [layoutSettingsOpen, setLayoutSettingsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [footerOpen, setFooterOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null); // where palette elements land

  const patchNav = (p: Partial<NavConfig>) => { setNav((n) => ({ ...n, ...p })); setDirty(true); };
  const patchFooter = (p: Partial<FooterConfig>) => { setFooter((f) => ({ ...f, ...p })); setDirty(true); };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const update = (next: Section[]) => { setSections(next); setDirty(true); };

  // ── Section / column / block mutations ────────────────────────────────────
  const addSection = () => update([...sections, newSection(1)]);
  const removeSection = (sid: string) => update(sections.filter((s) => s.id !== sid));
  const patchSection = (sid: string, patch: Partial<Section>) => update(sections.map((s) => s.id === sid ? { ...s, ...patch } : s));
  const setLayoutBg = (bg: string | undefined) => { setLayoutStyle(bg ? { bg } : {}); setDirty(true); };
  const moveSection = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= sections.length) return;
    update(arrayMove(sections, idx, j));
  };
  const addColumn = (sid: string) => update(sections.map((s) => {
    if (s.id !== sid || s.columns.length >= 4) return s;
    const spans = evenSpans(s.columns.length + 1);
    const columns = [...s.columns, { id: uid(), span: 0, blocks: [] as Block[] }].map((c, i) => ({ ...c, span: spans[i] }));
    return { ...s, columns };
  }));
  const removeColumn = (sid: string, cid: string) => update(sections.map((s) => {
    if (s.id !== sid || s.columns.length <= 1) return s;
    const remaining = s.columns.filter((c) => c.id !== cid);
    const spans = evenSpans(remaining.length);
    return { ...s, columns: remaining.map((c, i) => ({ ...c, span: spans[i] })) };
  }));
  const setColumnSpans = (sid: string, i: number, spanI: number) => update(sections.map((s) => {
    if (s.id !== sid) return s;
    const columns = s.columns.map((c) => ({ ...c }));
    const pair = columns[i].span + columns[i + 1].span;
    const a = Math.min(pair - 1, Math.max(1, spanI));
    columns[i].span = a;
    columns[i + 1].span = pair - a;
    return { ...s, columns };
  }));
  const addBlock = (sid: string, cid: string, type: BlockType) => update(sections.map((s) => s.id !== sid ? s : {
    ...s, columns: s.columns.map((c) => c.id !== cid ? c : { ...c, blocks: [...c.blocks, newBlock(type)] }),
  }));
  const patchBlock = (bid: string, patch: Partial<Block>) => update(sections.map((s) => ({
    ...s, columns: s.columns.map((c) => ({ ...c, blocks: c.blocks.map((b) => b.id === bid ? { ...b, ...patch } : b) })),
  })));
  const removeBlock = (bid: string) => update(sections.map((s) => ({
    ...s, columns: s.columns.map((c) => ({ ...c, blocks: c.blocks.filter((b) => b.id !== bid) })),
  })));

  // ── Left-palette actions (fullscreen builder) ─────────────────────────────
  // Add an element to the active column; fall back to the last column, and
  // create a fresh section if the canvas is still empty.
  const addElementToActive = (type: BlockType) => {
    let sid: string | undefined;
    let cid: string | undefined;
    if (activeColumnId) {
      for (const s of sections) for (const c of s.columns) if (c.id === activeColumnId) { sid = s.id; cid = c.id; }
    }
    if (!sid && sections.length) { const s = sections[sections.length - 1]; sid = s.id; cid = s.columns[s.columns.length - 1].id; }
    if (sid && cid) { addBlock(sid, cid, type); setActiveColumnId(cid); return; }
    // empty canvas → make a section and drop the block in
    const sec = newSection(1);
    sec.columns[0].blocks = [newBlock(type)];
    setActiveColumnId(sec.columns[0].id);
    update([...sections, sec]);
  };
  const addPreset = (kind: PresetKind) => {
    const sec = newPreset(kind);
    setActiveColumnId(sec.columns[0].id);
    setSettingsFor(kind === "text-over-image" ? sec.id : null); // open style panel so the user can add the hero image
    update([...sections, sec]);
  };
  // Apply a modern-effect preset to the active (or last) section.
  const applyEffect = (patch: Partial<Section>) => {
    const target = (activeColumnId && sections.find((s) => s.columns.some((c) => c.id === activeColumnId))) || sections[sections.length - 1];
    if (!target) { toast.info("Add a section first, then apply an effect."); return; }
    patchSection(target.id, patch);
    setSettingsFor(target.id);
  };

  // ── Cross-column drag ─────────────────────────────────────────────────────
  const findBlock = (id: string) => {
    for (const s of sections) for (const c of s.columns) {
      const b = c.blocks.find((x) => x.id === id);
      if (b) return b;
    }
    return null;
  };
  const colOfBlock = (id: string) => {
    for (const s of sections) for (const c of s.columns) if (c.blocks.some((b) => b.id === id)) return c.id;
    return null;
  };
  const onDragStart = (e: DragStartEvent) => setActiveBlock(findBlock(String(e.active.id)));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveBlock(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const fromCol = colOfBlock(activeId);
    // over target is either a block id (drop before it) or a column id (empty col)
    const toCol = colOfBlock(overId) || (overId.startsWith("col:") ? overId.slice(4) : null);
    if (!fromCol || !toCol) return;

    const next = sections.map((s) => ({ ...s, columns: s.columns.map((c) => ({ ...c, blocks: [...c.blocks] })) }));
    const allCols = next.flatMap((s) => s.columns);
    const src = allCols.find((c) => c.id === fromCol)!;
    const dst = allCols.find((c) => c.id === toCol)!;
    const moving = src.blocks.find((b) => b.id === activeId)!;
    src.blocks = src.blocks.filter((b) => b.id !== activeId);
    const overIdx = dst.blocks.findIndex((b) => b.id === overId);
    if (overIdx >= 0) dst.blocks.splice(overIdx, 0, moving);
    else dst.blocks.push(moving);
    update(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateLayoutAPI(siteId, page, sections, layoutStyle, nav, footer);
      setDirty(false);
      onSaved?.(res.data.data.site);
      toast.success("Layout saved & deployed");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save layout");
    } finally {
      setSaving(false);
    }
  };

  // Small shared controls reused by both the embedded toolbar and the
  // fullscreen top bar.
  const deviceToggle = (
    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
      <button onClick={() => setDevice("desktop")} title="Desktop" className={`p-2 ${device === "desktop" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}><Monitor size={15} /></button>
      <button onClick={() => setDevice("mobile")} title="Mobile" className={`p-2 ${device === "mobile" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}><Smartphone size={15} /></button>
    </div>
  );
  const toggleBtn = (active: boolean, icon: React.ReactNode, label: string, onClick: () => void) => (
    <button onClick={onClick} className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${active ? "border-primary text-primary bg-primary-light" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
      {icon} {label}
    </button>
  );
  const bgBtn = toggleBtn(layoutSettingsOpen || !!layoutStyle.bg, <Palette size={14} />, "Background", () => setLayoutSettingsOpen((o) => !o));
  const navBtn = toggleBtn(navOpen || nav.enabled, <PanelTop size={14} />, "Navbar", () => { setNavOpen((o) => !o); setFooterOpen(false); });
  const footerBtn = toggleBtn(footerOpen || footer.enabled, <PanelBottom size={14} />, "Footer", () => { setFooterOpen((o) => !o); setNavOpen(false); });
  const saveBtn = (
    <button onClick={handleSave} disabled={saving || !dirty} className="flex items-center gap-2 bg-primary text-white font-medium px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50">
      {saving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> : <Save size={15} />}
      {saving ? "Saving..." : "Save & Deploy"}
    </button>
  );

  const panels = (
    <>
      {layoutSettingsOpen && (
        <div className="mb-5 p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-slate-700">Layout background</span>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <span className="w-6 h-6 rounded border border-slate-300" style={{ background: layoutStyle.bg || "#ffffff" }} />
            <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(layoutStyle.bg || "") ? layoutStyle.bg : "#f8fafc"} onChange={(e) => setLayoutBg(e.target.value)} className="w-0 h-0 opacity-0 absolute" />
            <span className="underline">Pick color</span>
          </label>
          {["linear-gradient(135deg,#2563EB,#38bdf8)", "linear-gradient(135deg,#7c3aed,#ec4899)", "linear-gradient(135deg,#0f172a,#334155)"].map((g) => (
            <button key={g} onClick={() => setLayoutBg(g)} title="Gradient" className="w-8 h-8 rounded-md border border-slate-300" style={{ background: g }} />
          ))}
          {layoutStyle.bg && (
            <button onClick={() => setLayoutBg(undefined)} className="text-xs text-slate-500 hover:text-red-500 ml-auto">Clear</button>
          )}
        </div>
      )}
      {navOpen && <NavEditor nav={nav} onPatch={patchNav} />}
      {footerOpen && <FooterEditor footer={footer} onPatch={patchFooter} />}
    </>
  );

  const emptyState = sections.length === 0 && (
    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
      <Columns size={36} className="text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500 text-sm">No sections yet.</p>
      <p className="text-slate-400 text-xs mt-1">{fullscreen ? "Pick elements or a banner from the left to start building." : "Add a section, split it into columns, and drop text / images / buttons in."}</p>
    </div>
  );

  const canvas = (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div
        className={`mx-auto transition-all ${device === "mobile" ? "max-w-[420px]" : "max-w-full"} ${layoutStyle.bg ? "p-4 rounded-2xl" : ""}`}
        style={layoutStyle.bg ? { background: layoutStyle.bg } : undefined}
      >
        {nav.enabled && <NavPreview nav={nav} onEdit={() => { setNavOpen(true); setFooterOpen(false); }} />}
        {sections.map((section, si) => (
          <motion.div layout key={section.id} className="relative mb-4 border border-slate-200 rounded-2xl p-4 bg-white/95 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                Section {si + 1}
                {section.full && <span className="flex items-center gap-1 normal-case font-medium text-[10px] text-primary bg-primary-light px-1.5 py-0.5 rounded-full"><MoveHorizontal size={10} /> Full width</span>}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => moveSection(si, -1)} disabled={si === 0} className="text-xs text-slate-400 hover:text-primary disabled:opacity-30 px-1.5">↑</button>
                <button onClick={() => moveSection(si, 1)} disabled={si === sections.length - 1} className="text-xs text-slate-400 hover:text-primary disabled:opacity-30 px-1.5">↓</button>
                <button
                  onClick={() => setSettingsFor((v) => (v === section.id ? null : section.id))}
                  title="Section style"
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border ml-1 transition-colors ${
                    settingsFor === section.id || section.bg || section.glass
                      ? "border-primary text-primary bg-primary-light"
                      : "border-slate-200 text-slate-500 hover:text-primary"
                  }`}
                >
                  <Paintbrush size={12} /> Style
                </button>
                {section.columns.length < 4 && (
                  <button onClick={() => addColumn(section.id)} title="Add column" className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary border border-slate-200 px-2 py-1 rounded-md">
                    <Columns size={12} /> Column
                  </button>
                )}
                <button onClick={() => removeSection(section.id)} title="Delete section" className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
              </div>
            </div>

            {settingsFor === section.id && (
              <SectionSettings section={section} onPatch={(patch) => patchSection(section.id, patch)} siteId={siteId} />
            )}

            <div style={sectionPreviewStyle(section)}>
              <SectionRow
                section={section}
                device={device}
                activeColumnId={activeColumnId}
                onSelectColumn={setActiveColumnId}
                onResize={(i, spanI) => setColumnSpans(section.id, i, spanI)}
                onAddBlock={(cid, t) => addBlock(section.id, cid, t)}
                onRemoveColumn={(cid) => removeColumn(section.id, cid)}
                canRemoveColumn={section.columns.length > 1}
                onPatchBlock={patchBlock}
                onRemoveBlock={removeBlock}
                siteId={siteId}
              />
            </div>
          </motion.div>
        ))}
        {footer.enabled && <FooterPreview footer={footer} onEdit={() => { setFooterOpen(true); setNavOpen(false); }} />}
        {sections.length > 0 && (
          <button onClick={addSection} className="w-full flex items-center justify-center gap-1.5 py-3 mt-1 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary hover:text-primary text-sm font-medium transition-colors">
            <Plus size={15} /> Add Section
          </button>
        )}
      </div>

      <DragOverlay>
        {activeBlock ? (
          <div className="px-3 py-2 bg-white border border-primary rounded-lg shadow-lg text-sm text-slate-700 opacity-90">
            {{ heading: "Heading", text: "Text", image: "Image", button: "Button", form: "Form", embed: "Embed", carousel: "Carousel" }[activeBlock.type]}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-40 bg-slate-100 flex flex-col">
        <div className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-4 gap-3">
          <div className="flex items-center gap-2">
            {onExit && (
              <button onClick={onExit} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary px-2 py-2 rounded-lg hover:bg-slate-50">
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <span className="w-px h-6 bg-slate-200 mx-1" />
            {deviceToggle}
            {bgBtn}{navBtn}{footerBtn}
          </div>
          <div className="flex items-center gap-2">
            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                <ExternalLink size={15} /> Preview site
              </a>
            )}
            {saveBtn}
          </div>
        </div>
        <div className="flex flex-1 min-h-0">
          <BuilderPalette
            onAddSection={addSection}
            onAddElement={addElementToActive}
            onAddPreset={addPreset}
            onEffect={applyEffect}
            onGlassNav={() => { patchNav({ enabled: true, glass: true }); setNavOpen(true); }}
          />
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-[1040px] mx-auto">
              {panels}
              {emptyState}
              {canvas}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={addSection} className="flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
            <Plus size={14} /> Add Section
          </button>
          {deviceToggle}
          {bgBtn}{navBtn}{footerBtn}
        </div>
        {saveBtn}
      </div>
      {panels}
      {emptyState}
      {canvas}
    </div>
  );
}

// ── Per-section styling panel: background, effects, rounding, padding, hero ───
function SectionSettings({ section, onPatch, siteId }: { section: Section; onPatch: (p: Partial<Section>) => void; siteId: string }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await uploadAssetAPI(siteId, fd);
      onPatch({ bgImage: res.data.data.path });
    } catch (err: any) { toast.error(err.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); }
  };
  const pill = (active: boolean, icon: React.ReactNode, label: string, onClick: () => void) => (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${active ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:text-primary"}`}>
      {icon} {label}
    </button>
  );
  const groupLabel = (t: string) => <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{t}</p>;
  return (
    <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200 text-sm">
      {/* Size & layout */}
      <div className="p-3">
        {groupLabel("Size & layout")}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-xs">Width</span>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button onClick={() => onPatch({ full: false })} className={`px-2.5 py-1 text-xs ${!section.full ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}>Contained</button>
              <button onClick={() => onPatch({ full: true })} className={`px-2.5 py-1 text-xs flex items-center gap-1 ${section.full ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}><MoveHorizontal size={11} /> Full width</button>
            </div>
          </div>
          <label className="flex items-center gap-2 text-slate-600 text-xs">
            Height
            <input type="range" min={0} max={700} step={20} value={section.minH ?? 0} onChange={(e) => onPatch({ minH: Number(e.target.value) || undefined })} className="accent-primary w-28" />
            <span className="w-10 text-right font-mono text-slate-500">{section.minH ? `${section.minH}px` : "auto"}</span>
          </label>
          <label className="flex items-center gap-2 text-slate-600 text-xs">
            Rounded
            <input type="range" min={0} max={40} value={section.radius || 0} onChange={(e) => onPatch({ radius: Number(e.target.value) })} className="accent-primary w-20" />
          </label>
          <label className="flex items-center gap-2 text-slate-600 text-xs">
            Padding
            <input type="range" min={0} max={80} value={section.padY ?? 0} onChange={(e) => onPatch({ padY: Number(e.target.value) })} className="accent-primary w-20" />
          </label>
        </div>
      </div>

      {/* Background & effects */}
      <div className="p-3">
        {groupLabel("Background & effects")}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-slate-600 text-xs">Color</span>
            <span className="relative w-6 h-6 rounded border border-slate-300 inline-block" style={{ background: section.glass ? "rgba(255,255,255,0.4)" : (section.bg || "#ffffff") }}>
              <input type="color" disabled={section.glass} value={/^#[0-9a-fA-F]{6}$/.test(section.bg || "") ? section.bg : "#f8fafc"} onChange={(e) => onPatch({ bg: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" />
            </span>
            {section.bg && !section.glass && <button onClick={() => onPatch({ bg: undefined })} className="text-xs text-slate-400 hover:text-red-500">clear</button>}
          </label>
          {pill(!!section.glass, <Sparkles size={12} />, "Glass / blur", () => onPatch({ glass: !section.glass }))}
          {pill(!!section.shadow, <Layers size={12} />, "Shadow", () => onPatch({ shadow: !section.shadow }))}
        </div>
      </div>

      {/* Banner image */}
      <div className="p-3">
        {groupLabel("Banner image (optional)")}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
            <input type="text" value={section.bgImage || ""} onChange={(e) => onPatch({ bgImage: e.target.value })} placeholder="Image URL, or upload →"
              className="flex-1 min-w-0 text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} title="Upload image" className="shrink-0 border border-slate-200 text-slate-500 hover:text-primary px-2 py-1.5 rounded-md">
              {uploading ? <span className="animate-spin inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full" /> : <Upload size={12} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadBg} />
            {section.bgImage && <button onClick={() => onPatch({ bgImage: undefined })} className="text-xs text-slate-400 hover:text-red-500 shrink-0">clear</button>}
          </div>
          {section.bgImage && (
            <label className="flex items-center gap-1.5 text-slate-600 text-xs cursor-pointer">
              Overlay
              <span className="relative w-6 h-6 rounded border border-slate-300 inline-block" style={{ background: section.overlay || "rgba(15,23,42,0.55)" }}>
                <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(section.overlay || "") ? section.overlay : "#0f172a"} onChange={(e) => onPatch({ overlay: e.target.value + "8c" })} className="absolute inset-0 opacity-0 cursor-pointer" />
              </span>
            </label>
          )}
          {!section.bgImage && <span className="text-[11px] text-slate-400">Add an image to turn this section into a hero / banner (set Height above).</span>}
        </div>
      </div>
    </div>
  );
}

// ── Section row: columns + snap-resize dividers ──────────────────────────────
function SectionRow({
  section, device, activeColumnId, onSelectColumn, onResize, onAddBlock, onRemoveColumn, canRemoveColumn, onPatchBlock, onRemoveBlock, siteId,
}: {
  section: Section; device: "desktop" | "mobile";
  activeColumnId: string | null;
  onSelectColumn: (cid: string) => void;
  onResize: (i: number, spanI: number) => void;
  onAddBlock: (cid: string, t: BlockType) => void;
  onRemoveColumn: (cid: string) => void;
  canRemoveColumn: boolean;
  onPatchBlock: (bid: string, patch: Partial<Block>) => void;
  onRemoveBlock: (bid: string) => void;
  siteId: string;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  const startResize = (i: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    const row = rowRef.current;
    if (!row) return;
    const rect = row.getBoundingClientRect();
    const unit = rect.width / 12;
    const before = section.columns.slice(0, i).reduce((sum, c) => sum + c.span, 0);
    const move = (ev: PointerEvent) => {
      const boundary = Math.round((ev.clientX - rect.left) / unit); // grid units from row start
      onResize(i, boundary - before);
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // On mobile preview, columns stack (span ignored) to mirror the live output.
  const gridStyle = device === "mobile"
    ? { gridTemplateColumns: "1fr" }
    : { gridTemplateColumns: "repeat(12, 1fr)" };

  return (
    <div ref={rowRef} className="grid gap-3 items-start relative" style={gridStyle}>
      {section.columns.map((col, i) => (
        <div key={col.id} style={device === "mobile" ? undefined : { gridColumn: `span ${col.span}` }} className="relative min-w-0">
          <ColumnCell
            col={col} device={device}
            active={activeColumnId === col.id}
            onSelect={() => onSelectColumn(col.id)}
            onAddBlock={(t) => onAddBlock(col.id, t)}
            onRemoveColumn={canRemoveColumn ? () => onRemoveColumn(col.id) : undefined}
            onPatchBlock={onPatchBlock} onRemoveBlock={onRemoveBlock} siteId={siteId}
          />
          {/* Resize divider (between this col and the next) — desktop only */}
          {device === "desktop" && i < section.columns.length - 1 && (
            <div
              onPointerDown={startResize(i)}
              title="Drag to resize — snaps to grid"
              className="absolute top-0 -right-1.5 h-full w-3 cursor-col-resize flex items-center justify-center group z-10"
            >
              <span className="w-1 h-8 rounded-full bg-slate-200 group-hover:bg-primary transition-colors" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Column: droppable + sortable list of blocks ──────────────────────────────
function ColumnCell({
  col, device, active, onSelect, onAddBlock, onRemoveColumn, onPatchBlock, onRemoveBlock, siteId,
}: {
  col: Column; device: "desktop" | "mobile";
  active: boolean;
  onSelect: () => void;
  onAddBlock: (t: BlockType) => void;
  onRemoveColumn?: () => void;
  onPatchBlock: (bid: string, patch: Partial<Block>) => void;
  onRemoveBlock: (bid: string) => void;
  siteId: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${col.id}` });
  return (
    <div
      ref={setNodeRef}
      onPointerDown={onSelect}
      className={`rounded-xl border p-2.5 min-h-[90px] transition-colors ${
        isOver ? "border-primary bg-primary-light/40"
        : active ? "border-primary ring-1 ring-primary/40 bg-white"
        : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        {device === "desktop" && <span className="text-[10px] font-mono text-slate-400">{col.span}/12{active && <span className="text-primary ml-1">• active</span>}</span>}
        {onRemoveColumn && (
          <button onClick={onRemoveColumn} title="Remove column" className="text-slate-300 hover:text-red-500 ml-auto"><Trash2 size={12} /></button>
        )}
      </div>

      <SortableContext items={col.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {col.blocks.map((b) => (
            <SortableBlock key={b.id} block={b} onPatch={onPatchBlock} onRemove={onRemoveBlock} siteId={siteId} />
          ))}
        </div>
      </SortableContext>

      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {([["heading", HeadingIcon], ["text", Type], ["image", ImageIcon], ["button", MousePointerClick], ["form", Mail], ["embed", Film], ["carousel", GalleryHorizontal]] as const).map(([t, Icon]) => (
          <button key={t} onClick={() => onAddBlock(t)} title={`Add ${t}`} className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-primary hover:bg-white border border-slate-200 px-2 py-1 rounded-md capitalize">
            <Icon size={11} /> {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── A draggable block with an inline editor ──────────────────────────────────
function SortableBlock({ block, onPatch, onRemove, siteId }: {
  block: Block; onPatch: (bid: string, patch: Partial<Block>) => void; onRemove: (bid: string) => void; siteId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await uploadAssetAPI(siteId, fd);
      onPatch(block.id, { src: res.data.data.path });
    } catch (err: any) { toast.error(err.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-slate-200 rounded-lg p-2">
      <div className="flex items-start gap-1.5">
        <button {...attributes} {...listeners} title="Drag to move" className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing mt-1 touch-none">
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          {block.type === "heading" && (
            <>
              <input type="text" value={block.text || ""} onChange={(e) => onPatch(block.id, { text: e.target.value })}
                placeholder="Section heading" className="w-full text-base font-semibold text-slate-800 border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
              <StyleToolbar style={block.style} onChange={(s) => onPatch(block.id, { style: s })} />
            </>
          )}
          {block.type === "text" && (
            <>
              <textarea value={block.text || ""} onChange={(e) => onPatch(block.id, { text: e.target.value })} rows={2}
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none" placeholder="Text…" />
              <StyleToolbar style={block.style} onChange={(s) => onPatch(block.id, { style: s })} />
            </>
          )}
          {block.type === "image" && (
            <>
              <div className="flex gap-1.5">
                <input type="text" value={block.src || ""} onChange={(e) => onPatch(block.id, { src: e.target.value })} placeholder="Image URL or upload"
                  className="flex-1 min-w-0 text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="shrink-0 border border-slate-200 text-slate-500 hover:text-primary text-xs px-2 rounded-md">
                  {uploading ? <span className="animate-spin inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full" /> : <Upload size={13} />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadImg} />
              </div>
              {block.src && <img src={block.src} alt="" className="mt-1.5 max-h-24 rounded-md" />}
              <input type="text" value={block.alt || ""} onChange={(e) => onPatch(block.id, { alt: e.target.value })} placeholder="Alt text (SEO)"
                className="w-full mt-1.5 text-xs border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary" />
            </>
          )}
          {block.type === "button" && (
            <div className="space-y-1.5">
              <input type="text" value={block.text || ""} onChange={(e) => onPatch(block.id, { text: e.target.value })} placeholder="Button label"
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
              <input type="text" value={block.href || ""} onChange={(e) => onPatch(block.id, { href: e.target.value })} placeholder="https://…"
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                <input type="checkbox" checked={block.target === "_blank"} onChange={(e) => onPatch(block.id, { target: e.target.checked ? "_blank" : "" })} className="accent-primary w-3 h-3" />
                Open in new tab
              </label>
            </div>
          )}
          {block.type === "form" && (
            <div>
              {/* Live preview of the fields visitors will see */}
              <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/60 p-2 space-y-1.5 pointer-events-none mb-2">
                <div className="text-xs text-slate-400 px-2 py-1.5 bg-white border border-slate-200 rounded">Your name</div>
                <div className="text-xs text-slate-400 px-2 py-1.5 bg-white border border-slate-200 rounded">Your email</div>
                <div className="text-xs text-slate-400 px-2 py-3 bg-white border border-slate-200 rounded">Your message</div>
                <div className="inline-block text-xs text-white bg-primary px-3 py-1.5 rounded">{block.text || "Send message"}</div>
              </div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Submit button label</span>
              <input type="text" value={block.text || ""} onChange={(e) => onPatch(block.id, { text: e.target.value })} placeholder="Send message"
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 mb-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
              <span className="text-[11px] text-slate-400 block mb-0.5">Success message</span>
              <input type="text" value={block.successMsg || ""} onChange={(e) => onPatch(block.id, { successMsg: e.target.value })} placeholder="Thanks — we'll be in touch!"
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
              <p className="text-[11px] text-slate-400 mt-1.5">Submissions are emailed to you and saved in the Submissions tab.</p>
            </div>
          )}
          {block.type === "embed" && (
            <EmbedEditor block={block} onPatch={onPatch} />
          )}
          {block.type === "carousel" && (
            <CarouselEditor block={block} onPatch={onPatch} siteId={siteId} />
          )}
          <BoxToolbar block={block} onPatch={onPatch} />
        </div>
        <button onClick={() => onRemove(block.id)} title="Delete block" className="text-slate-300 hover:text-red-500 mt-1"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

// ── Embed block editor: paste a link, see the live preview or a clear warning ─
function EmbedEditor({ block, onPatch }: { block: Block; onPatch: (bid: string, patch: Partial<Block>) => void }) {
  const src = block.src || "";
  const preview = src.trim() ? toEmbedSrcPreview(src.trim()) : null;
  const showWarning = src.trim().length > 0 && !preview;

  return (
    <div>
      <input
        type="text"
        value={src}
        onChange={(e) => onPatch(block.id, { src: e.target.value })}
        placeholder="Paste a YouTube, Vimeo, or Google Maps link"
        className={`w-full text-sm border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 ${showWarning ? "border-amber-300 focus:ring-amber-400" : "border-slate-200 focus:ring-primary"}`}
      />
      {preview ? (
        <div className="mt-2 rounded-md overflow-hidden border border-slate-200" style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#f1f5f9" }}>
          <iframe
            src={preview}
            title="Embed preview"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
      ) : showWarning ? (
        <p className="text-[11px] text-amber-600 mt-1.5">
          That link isn't supported. Paste a YouTube, Vimeo, or Google Maps link.
        </p>
      ) : (
        <p className="text-[11px] text-slate-400 mt-1.5">Supports YouTube, Vimeo, and Google Maps.</p>
      )}
    </div>
  );
}

// ── Inline style parse/serialize for the box toolbar ─────────────────────────
function parseStyleMap(s?: string): Record<string, string> {
  const out: Record<string, string> = {};
  (s || "").split(";").forEach((part) => {
    const i = part.indexOf(":");
    if (i > 0) {
      const k = part.slice(0, i).trim().toLowerCase();
      const v = part.slice(i + 1).trim();
      if (k && v) out[k] = v;
    }
  });
  return out;
}
function serializeStyleMap(o: Record<string, string>): string {
  return Object.entries(o).map(([k, v]) => `${k}: ${v}`).join("; ");
}

const WIDTHS: { label: string; value: string }[] = [
  { label: "Auto", value: "" },
  { label: "25%", value: "25%" },
  { label: "50%", value: "50%" },
  { label: "75%", value: "75%" },
  { label: "100%", value: "100%" },
];

// ── Per-block box controls: alignment, width, height ─────────────────────────
function BoxToolbar({ block, onPatch }: { block: Block; onPatch: (bid: string, patch: Partial<Block>) => void }) {
  const st = parseStyleMap(block.style);
  const setStyleProp = (prop: string, value: string | null) => {
    const next = { ...st };
    if (!value) delete next[prop]; else next[prop] = value;
    onPatch(block.id, { style: serializeStyleMap(next) });
  };
  const align = block.align || "";
  const width = st["width"] || "";
  const height = st["min-height"] || "";
  const isPresetWidth = WIDTHS.some((w) => w.value === width);

  const alignBtn = (a: Align, Icon: any) => (
    <button
      type="button"
      onClick={() => onPatch(block.id, { align: block.align === a ? undefined : a })}
      title={`Align ${a}`}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${align === a ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100"}`}
    >
      <Icon size={13} />
    </button>
  );

  return (
    <div className="flex items-center gap-2 flex-wrap mt-2 p-1.5 bg-white border border-slate-200 rounded-lg">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide pl-0.5 pr-1">Box</span>
      <div className="flex items-center gap-0.5">
        {alignBtn("left", AlignLeft)}
        {alignBtn("center", AlignCenter)}
        {alignBtn("right", AlignRight)}
      </div>
      <span className="w-px h-5 bg-slate-200" />
      <div className="flex items-center gap-1 text-[11px] text-slate-500" title="Width">
        <Ruler size={11} /> W
        <select
          value={isPresetWidth ? width : "custom"}
          onChange={(e) => { const v = e.target.value; if (v !== "custom") setStyleProp("width", v || null); }}
          className="text-xs bg-white border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          {WIDTHS.map((w) => <option key={w.label} value={w.value}>{w.label}</option>)}
          <option value="custom">Custom…</option>
        </select>
        {!isPresetWidth && (
          <input
            value={width}
            onChange={(e) => setStyleProp("width", e.target.value || null)}
            placeholder="320px"
            className="w-16 text-xs border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        )}
      </div>
      <span className="w-px h-5 bg-slate-200" />
      <label className="flex items-center gap-1 text-[11px] text-slate-500" title="Minimum height">
        H
        <input
          value={height}
          onChange={(e) => setStyleProp("min-height", e.target.value || null)}
          placeholder="auto"
          className="w-16 text-xs border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>
    </div>
  );
}

// ── A small color swatch + native picker used by the nav / footer editors ────
function ColorField({ label, value, fallback, onChange }: { label: string; value?: string; fallback: string; onChange: (v: string) => void }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value || "") ? (value as string) : fallback;
  return (
    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
      <span className="relative w-6 h-6 rounded border border-slate-300 inline-block" style={{ background: value || fallback }}>
        <input type="color" value={safe} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
      </span>
      {label}
    </label>
  );
}

// ── Editable list of navbar / footer links ───────────────────────────────────
function LinkListEditor({ links, onChange }: { links: NavLink[]; onChange: (links: NavLink[]) => void }) {
  const add = () => onChange([...links, { id: uid(), label: "Link", href: "#" }]);
  const patch = (id: string, p: Partial<NavLink>) => onChange(links.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const remove = (id: string) => onChange(links.filter((l) => l.id !== id));
  return (
    <div className="space-y-2">
      {links.map((l) => (
        <div key={l.id} className="flex items-center gap-2">
          <input value={l.label} onChange={(e) => patch(l.id, { label: e.target.value })} placeholder="Label"
            className="flex-1 min-w-0 text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary" />
          <input value={l.href} onChange={(e) => patch(l.id, { href: e.target.value })} placeholder="https://… or #section"
            className="flex-1 min-w-0 text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
          <button onClick={() => remove(l.id)} title="Remove link" className="text-slate-300 hover:text-red-500 shrink-0"><Trash2 size={14} /></button>
        </div>
      ))}
      {links.length < 12 && (
        <button onClick={add} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus size={12} /> Add link</button>
      )}
    </div>
  );
}

// ── Navbar settings panel ────────────────────────────────────────────────────
function NavEditor({ nav, onPatch }: { nav: NavConfig; onPatch: (p: Partial<NavConfig>) => void }) {
  return (
    <div className="mb-5 p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><PanelTop size={14} /> Navigation bar</span>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={nav.enabled} onChange={(e) => onPatch({ enabled: e.target.checked })} className="accent-primary w-4 h-4" />
          Show navbar
        </label>
      </div>
      {nav.enabled && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs text-slate-500 space-y-1 block">
              <span className="block">Brand / site name</span>
              <input value={nav.brand || ""} onChange={(e) => onPatch({ brand: e.target.value })} placeholder="My Site"
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary" />
            </label>
            <label className="text-xs text-slate-500 space-y-1 block">
              <span className="block">Logo image URL (optional)</span>
              <input value={nav.brandImg || ""} onChange={(e) => onPatch({ brandImg: e.target.value })} placeholder="https://…/logo.png"
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
            </label>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5 mb-2"><Link2 size={12} /> Links</span>
            <LinkListEditor links={nav.links} onChange={(links) => onPatch({ links })} />
          </div>
          <div className="flex flex-wrap items-center gap-5 pt-1">
            <ColorField label="Background" value={nav.bg} fallback="#ffffff" onChange={(v) => onPatch({ bg: v })} />
            <ColorField label="Text" value={nav.color} fallback="#0f172a" onChange={(v) => onPatch({ color: v })} />
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={!!nav.sticky} onChange={(e) => onPatch({ sticky: e.target.checked })} className="accent-primary w-4 h-4" />
              Sticky on scroll
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Wand2 size={12} /> Effects</span>
            <button onClick={() => onPatch({ glass: !nav.glass })} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${nav.glass ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:text-primary"}`}>
              <Sparkles size={12} /> Glassmorphism
            </button>
            <button onClick={() => onPatch({ shadow: !nav.shadow })} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${nav.shadow ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:text-primary"}`}>
              <Layers size={12} /> Shadow
            </button>
            {nav.glass && <span className="text-[11px] text-slate-400 w-full">Frosted translucent bar. Turn on <strong>Sticky on scroll</strong> so it frosts the content passing beneath it. Pick a light or dark <em>Text</em> color to suit your background.</span>}
          </div>
        </>
      )}
    </div>
  );
}

// ── Footer settings panel ────────────────────────────────────────────────────
function FooterEditor({ footer, onPatch }: { footer: FooterConfig; onPatch: (p: Partial<FooterConfig>) => void }) {
  return (
    <div className="mb-5 p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><PanelBottom size={14} /> Footer</span>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={footer.enabled} onChange={(e) => onPatch({ enabled: e.target.checked })} className="accent-primary w-4 h-4" />
          Show footer
        </label>
      </div>
      {footer.enabled && (
        <>
          <label className="text-xs text-slate-500 space-y-1 block">
            <span className="block">Footer text / copyright</span>
            <input value={footer.text || ""} onChange={(e) => onPatch({ text: e.target.value })} placeholder="© 2026 My Company. All rights reserved."
              className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary" />
          </label>
          <div>
            <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5 mb-2"><Link2 size={12} /> Links</span>
            <LinkListEditor links={footer.links} onChange={(links) => onPatch({ links })} />
          </div>
          <div className="flex flex-wrap items-center gap-5 pt-1">
            <ColorField label="Background" value={footer.bg} fallback="#0f172a" onChange={(v) => onPatch({ bg: v })} />
            <ColorField label="Text" value={footer.color} fallback="#e2e8f0" onChange={(v) => onPatch({ color: v })} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Live preview of the navbar in the canvas (click to edit) ──────────────────
function NavPreview({ nav, onEdit }: { nav: NavConfig; onEdit: () => void }) {
  return (
    <div onClick={onEdit} title="Click to edit navbar" className={`mb-4 rounded-xl overflow-hidden border border-dashed border-slate-300 cursor-pointer hover:border-primary transition-colors ${nav.shadow ? "shadow-lg" : ""}`}>
      <div
        className="flex items-center justify-between gap-4 px-5 py-3 flex-wrap"
        style={nav.glass
          ? { background: "rgba(255,255,255,0.35)", backdropFilter: "saturate(180%) blur(14px)", WebkitBackdropFilter: "saturate(180%) blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.25)", color: nav.color || "#0f172a" }
          : { background: nav.bg || "#ffffff", color: nav.color || "#0f172a" }}
      >
        <span className="font-bold text-lg flex items-center gap-2">
          {nav.brandImg ? <img src={nav.brandImg} alt="" className="h-7" /> : (nav.brand || "Brand")}
        </span>
        <div className="flex items-center gap-5 text-sm font-medium flex-wrap">
          {nav.links.length
            ? nav.links.map((l) => <span key={l.id} className="opacity-85">{l.label || "Link"}</span>)
            : <span className="opacity-50 italic text-xs">No links yet</span>}
        </div>
      </div>
    </div>
  );
}

// ── Carousel block editor: an ordered list of image URLs (add / upload / remove) ─
function CarouselEditor({ block, onPatch, siteId }: { block: Block; onPatch: (bid: string, patch: Partial<Block>) => void; siteId: string }) {
  const images = block.images || [];
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const setImages = (imgs: string[]) => onPatch(block.id, { images: imgs });
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const added: string[] = [];
      for (const file of files) {
        const fd = new FormData(); fd.append("file", file);
        const res = await uploadAssetAPI(siteId, fd);
        added.push(res.data.data.path);
      }
      setImages([...images, ...added]);
    } catch (err: any) { toast.error(err.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); }
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= images.length) return;
    const next = [...images]; [next[i], next[j]] = [next[j], next[i]]; setImages(next);
  };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1"><GalleryHorizontal size={12} /> Slides ({images.length})</span>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1 text-[11px] text-primary hover:underline ml-auto">
          {uploading ? <span className="animate-spin inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full" /> : <Upload size={11} />} Upload
        </button>
        <button onClick={() => setImages([...images, ""])} className="flex items-center gap-1 text-[11px] text-primary hover:underline"><Plus size={11} /> Add URL</button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={upload} />
      </div>
      {images.length === 0 && <p className="text-[11px] text-slate-400">Add at least 2 images for the slider to rotate.</p>}
      {images.map((src, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {src ? <img src={src} alt="" className="w-9 h-9 rounded object-cover border border-slate-200 shrink-0" /> : <span className="w-9 h-9 rounded bg-slate-100 border border-slate-200 shrink-0" />}
          <input value={src} onChange={(e) => { const next = [...images]; next[i] = e.target.value; setImages(next); }} placeholder="Image URL"
            className="flex-1 min-w-0 text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
          <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-300 hover:text-primary disabled:opacity-30 text-xs px-0.5">↑</button>
          <button onClick={() => move(i, 1)} disabled={i === images.length - 1} className="text-slate-300 hover:text-primary disabled:opacity-30 text-xs px-0.5">↓</button>
          <button onClick={() => setImages(images.filter((_, k) => k !== i))} className="text-slate-300 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
        </div>
      ))}
    </div>
  );
}

// ── Left palette (fullscreen builder): elements, banners, and effects ─────────
function BuilderPalette({ onAddSection, onAddElement, onAddPreset, onEffect, onGlassNav }: {
  onAddSection: () => void;
  onAddElement: (t: BlockType) => void;
  onAddPreset: (k: PresetKind) => void;
  onEffect: (patch: Partial<Section>) => void;
  onGlassNav: () => void;
}) {
  const elements: [BlockType, any, string][] = [
    ["heading", HeadingIcon, "Heading"],
    ["text", Type, "Text"],
    ["image", ImageIcon, "Image"],
    ["button", MousePointerClick, "Button"],
    ["form", Mail, "Form"],
    ["embed", Film, "Embed"],
    ["carousel", GalleryHorizontal, "Carousel"],
  ];
  const presets: [PresetKind, any, string][] = [
    ["text-over-image", ImagePlus, "Text over image"],
    ["image-banner", ImageIcon, "Image banner"],
    ["carousel", GalleryHorizontal, "Carousel slider"],
    ["image-text", Columns, "Image + text"],
  ];
  const effects: { label: string; icon: any; patch?: Partial<Section>; nav?: boolean }[] = [
    { label: "Glassmorphism", icon: Sparkles, patch: { glass: true } },
    { label: "Gradient", icon: Palette, patch: { bg: "linear-gradient(135deg,#6366f1,#ec4899)" } },
    { label: "Soft shadow", icon: Layers, patch: { shadow: true } },
    { label: "Rounded", icon: Square, patch: { radius: 22 } },
    { label: "Hero height", icon: MoveHorizontal, patch: { full: true, minH: 420 } },
    { label: "Glass navbar", icon: PanelTop, nav: true },
  ];
  const heading = (t: string) => <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-1 mt-4 mb-1.5">{t}</p>;
  const item = (Icon: any, label: string, onClick: () => void, key: string) => (
    <button key={key} onClick={onClick} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-slate-600 hover:bg-primary-light hover:text-primary transition-colors text-left">
      <Icon size={15} className="shrink-0 text-slate-400" /> {label}
    </button>
  );
  return (
    <div className="w-60 shrink-0 border-r border-slate-200 bg-white overflow-y-auto p-3">
      <button onClick={onAddSection} className="w-full flex items-center justify-center gap-1.5 bg-primary text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-primary-dark transition-colors mb-2">
        <Plus size={15} /> Add Section
      </button>
      <p className="text-xs text-slate-400 px-1">Then click an element below to drop it into the selected column (highlighted). Presets add a whole new section.</p>
      {heading("Elements")}
      <div className="space-y-0.5">
        {elements.map(([t, Icon, label]) => item(Icon, label, () => onAddElement(t), t))}
      </div>
      {heading("Banners & sections")}
      <div className="space-y-0.5">
        {presets.map(([k, Icon, label]) => item(Icon, label, () => onAddPreset(k), k))}
      </div>
      {heading("Effects")}
      <div className="space-y-0.5">
        {effects.map((e) => item(e.icon, e.label, () => (e.nav ? onGlassNav() : onEffect(e.patch || {})), e.label))}
      </div>
      <p className="text-[11px] text-slate-400 px-1 mt-3">Effects apply to the selected / last section.</p>
    </div>
  );
}

// ── Live preview of the footer in the canvas (click to edit) ──────────────────
function FooterPreview({ footer, onEdit }: { footer: FooterConfig; onEdit: () => void }) {
  return (
    <div onClick={onEdit} title="Click to edit footer" className="mt-4 rounded-xl overflow-hidden border border-dashed border-slate-300 cursor-pointer hover:border-primary transition-colors">
      <div className="flex items-center justify-between gap-4 px-5 py-5 flex-wrap" style={{ background: footer.bg || "#0f172a", color: footer.color || "#e2e8f0" }}>
        <span className="text-sm opacity-80">{footer.text || "© Your Company"}</span>
        <div className="flex items-center gap-5 text-sm font-medium flex-wrap">
          {footer.links.map((l) => <span key={l.id} className="opacity-85">{l.label || "Link"}</span>)}
        </div>
      </div>
    </div>
  );
}
