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
} from "lucide-react";
import StyleToolbar from "./StyleToolbar";
import { updateLayoutAPI, uploadAssetAPI } from "../api/site.api";

type BlockType = "text" | "image" | "button" | "form";
interface Block { id: string; type: BlockType; text?: string; src?: string; alt?: string; href?: string; target?: string; style?: string; successMsg?: string; }
interface Column { id: string; span: number; blocks: Block[]; }
interface Section {
  id: string; columns: Column[];
  bg?: string; glass?: boolean; radius?: number; padY?: number;
}
interface LayoutStyle { bg?: string }

// Live preview of a section's background/effect settings (mirrors the renderer).
function sectionPreviewStyle(sec: Section): React.CSSProperties {
  const s: React.CSSProperties = {};
  if (sec.glass) {
    s.background = "rgba(255,255,255,0.15)";
    s.backdropFilter = "blur(14px)";
    (s as any).WebkitBackdropFilter = "blur(14px)";
    s.border = "1px solid rgba(255,255,255,0.25)";
  } else if (sec.bg) s.background = sec.bg;
  if (sec.radius) s.borderRadius = sec.radius;
  if (sec.padY != null) { s.paddingTop = sec.padY; s.paddingBottom = sec.padY; }
  if (sec.glass || sec.bg) { s.paddingLeft = 20; s.paddingRight = 20; }
  return s;
}

const uid = () => Math.random().toString(36).slice(2, 10);

// Distribute 12 grid units as evenly as possible across n columns.
function evenSpans(n: number): number[] {
  const base = Math.floor(12 / n);
  const spans = Array(n).fill(base);
  let rem = 12 - base * n;
  for (let i = 0; rem > 0; i++, rem--) spans[i]++;
  return spans;
}

function newBlock(type: BlockType): Block {
  if (type === "image") return { id: uid(), type, src: "", alt: "" };
  if (type === "button") return { id: uid(), type, text: "Click me", href: "#", target: "" };
  if (type === "form") return { id: uid(), type, text: "Send message", successMsg: "Thanks — we'll be in touch!" };
  return { id: uid(), type, text: "Your text here" };
}
function newSection(cols = 1): Section {
  const spans = evenSpans(cols);
  return { id: uid(), columns: spans.map((span) => ({ id: uid(), span, blocks: [] })) };
}

interface Props {
  siteId: string;
  page: string;
  initialLayout?: Section[];
  initialLayoutStyle?: LayoutStyle;
  onSaved?: (site: any) => void;
}

export default function LayoutBuilder({ siteId, page, initialLayout, initialLayoutStyle, onSaved }: Props) {
  const [sections, setSections] = useState<Section[]>(initialLayout && initialLayout.length ? initialLayout : []);
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>(initialLayoutStyle || {});
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  const [settingsFor, setSettingsFor] = useState<string | null>(null); // section id whose style panel is open
  const [layoutSettingsOpen, setLayoutSettingsOpen] = useState(false);

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
      const res = await updateLayoutAPI(siteId, page, sections, layoutStyle);
      setDirty(false);
      onSaved?.(res.data.data.site);
      toast.success("Layout saved & deployed");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save layout");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={addSection} className="flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
            <Plus size={14} /> Add Section
          </button>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => setDevice("desktop")} title="Desktop" className={`p-2 ${device === "desktop" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}><Monitor size={15} /></button>
            <button onClick={() => setDevice("mobile")} title="Mobile" className={`p-2 ${device === "mobile" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}><Smartphone size={15} /></button>
          </div>
          <button onClick={() => setLayoutSettingsOpen((o) => !o)} className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${layoutSettingsOpen || layoutStyle.bg ? "border-primary text-primary bg-primary-light" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            <Palette size={14} /> Background
          </button>
        </div>
        <button onClick={handleSave} disabled={saving || !dirty} className="flex items-center gap-2 bg-primary text-white font-medium px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50">
          {saving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> : <Save size={15} />}
          {saving ? "Saving..." : "Save & Deploy"}
        </button>
      </div>

      {/* Layout-wide background panel */}
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

      {sections.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <Columns size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No sections yet.</p>
          <p className="text-slate-400 text-xs mt-1">Add a section, split it into columns, and drop text / images / buttons in.</p>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div
          className={`mx-auto transition-all ${device === "mobile" ? "max-w-[420px]" : "max-w-full"} ${layoutStyle.bg ? "p-4 rounded-2xl" : ""}`}
          style={layoutStyle.bg ? { background: layoutStyle.bg } : undefined}
        >
          {sections.map((section, si) => (
            <motion.div layout key={section.id} className="relative mb-4 border border-slate-200 rounded-2xl p-4 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Section {si + 1}</span>
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
                <SectionSettings section={section} onPatch={(patch) => patchSection(section.id, patch)} />
              )}

              <div style={sectionPreviewStyle(section)}>
                <SectionRow
                  section={section}
                  device={device}
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
        </div>

        <DragOverlay>
          {activeBlock ? (
            <div className="px-3 py-2 bg-white border border-primary rounded-lg shadow-lg text-sm text-slate-700 opacity-90">
              {activeBlock.type === "text" ? "Text" : activeBlock.type === "image" ? "Image" : activeBlock.type === "form" ? "Form" : "Button"}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ── Per-section styling panel: background, glass, rounding, padding ──────────
function SectionSettings({ section, onPatch }: { section: Section; onPatch: (p: Partial<Section>) => void }) {
  return (
    <div className="mb-3 p-3 border border-slate-200 rounded-xl bg-slate-50 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
      <label className="flex items-center gap-2 cursor-pointer">
        <span className="text-slate-600">Background</span>
        <span className="relative w-6 h-6 rounded border border-slate-300 inline-block" style={{ background: section.glass ? "rgba(255,255,255,0.4)" : (section.bg || "#ffffff") }}>
          <input type="color" disabled={section.glass} value={/^#[0-9a-fA-F]{6}$/.test(section.bg || "") ? section.bg : "#f8fafc"} onChange={(e) => onPatch({ bg: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" />
        </span>
        {section.bg && !section.glass && <button onClick={() => onPatch({ bg: undefined })} className="text-xs text-slate-400 hover:text-red-500">clear</button>}
      </label>

      <button onClick={() => onPatch({ glass: !section.glass })} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${section.glass ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:text-primary"}`}>
        <Sparkles size={12} /> Glass / blur
      </button>

      <label className="flex items-center gap-2 text-slate-600 text-xs">
        Rounded
        <input type="range" min={0} max={40} value={section.radius || 0} onChange={(e) => onPatch({ radius: Number(e.target.value) })} className="accent-primary w-24" />
      </label>

      <label className="flex items-center gap-2 text-slate-600 text-xs">
        Padding
        <input type="range" min={0} max={80} value={section.padY ?? 0} onChange={(e) => onPatch({ padY: Number(e.target.value) })} className="accent-primary w-24" />
      </label>
    </div>
  );
}

// ── Section row: columns + snap-resize dividers ──────────────────────────────
function SectionRow({
  section, device, onResize, onAddBlock, onRemoveColumn, canRemoveColumn, onPatchBlock, onRemoveBlock, siteId,
}: {
  section: Section; device: "desktop" | "mobile";
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
  col, device, onAddBlock, onRemoveColumn, onPatchBlock, onRemoveBlock, siteId,
}: {
  col: Column; device: "desktop" | "mobile";
  onAddBlock: (t: BlockType) => void;
  onRemoveColumn?: () => void;
  onPatchBlock: (bid: string, patch: Partial<Block>) => void;
  onRemoveBlock: (bid: string) => void;
  siteId: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${col.id}` });
  return (
    <div ref={setNodeRef} className={`rounded-xl border p-2.5 min-h-[90px] transition-colors ${isOver ? "border-primary bg-primary-light/40" : "border-slate-200 bg-slate-50"}`}>
      <div className="flex items-center justify-between mb-2">
        {device === "desktop" && <span className="text-[10px] font-mono text-slate-400">{col.span}/12</span>}
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

      <div className="flex items-center gap-1 mt-2">
        {([["text", Type], ["image", ImageIcon], ["button", MousePointerClick], ["form", Mail]] as const).map(([t, Icon]) => (
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
        </div>
        <button onClick={() => onRemove(block.id)} title="Delete block" className="text-slate-300 hover:text-red-500 mt-1"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}
