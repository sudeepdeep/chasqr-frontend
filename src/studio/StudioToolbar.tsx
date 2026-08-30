import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Copy,
  Image as ImageIcon,
  Images,
  Italic,
  Link2,
  MoreHorizontal,
  Palette,
  Pin,
  Rows3,
  Scaling,
  Sparkle,
  Sparkles,
  Squircle,
  Trash2,
  Underline,
  Wand2,
} from "lucide-react";
import { ImageField } from "./ImageField";
import LinkPanel from "./LinkPanel";
import ListInput from "./ListInput";
import MediaPanel from "./MediaPanel";
import TabsPanel from "./TabsPanel";
import { GOOGLE_FONTS } from "./fonts";
import { ICON_NAMES, SOCIAL_LABEL } from "./icons";
import {
  Anim,
  ANIMS,
  BG_POSITIONS,
  BgPosition,
  Breakpoint,
  EDITABLE_TEXT,
  FieldType,
  ROUNDABLE,
  StudioElement,
  StudioSection,
  TAB_TRANSITIONS,
  TAB_VARIANTS,
  TabTransition,
  TabVariant,
  fontSizeFor,
  sectionHasForm,
  tabsOf,
} from "./types";

/** Element types holding a list of pictures rather than a single one. */
const MEDIA_LIST = ["carousel", "gallery", "marquee"];

const FIELD_TYPES: FieldType[] = [
  "text",
  "email",
  "phone",
  "number",
  "textarea",
  "select",
  "checkbox",
  "file",
];

const sep = <span className="mx-1.5 h-5 w-px shrink-0 bg-slate-200" />;

const btn =
  "flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900";
const icon =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent";
const active = "bg-primary-light text-primary hover:bg-primary-light";
const input =
  "h-8 shrink-0 rounded-lg border border-slate-200 px-2 text-[12.5px] outline-none focus:border-primary";
const select =
  "h-8 shrink-0 rounded-lg border border-slate-200 px-1.5 text-[12.5px] text-slate-700 outline-none focus:border-primary";

/**
 * A control that opens a small panel beneath it.
 *
 * The bar used to lay every control out in one row, which overflowed into a
 * horizontal scrollbar the moment a section was selected — the controls were
 * there but you had to scroll sideways to find them, which is worse than a
 * second click. Anything not used on most edits now lives one click down.
 *
 * The panel is rendered into the body rather than beside its button. The
 * toolbar scrolls horizontally, and an `overflow` ancestor clips absolutely
 * positioned descendants — so the panel was being drawn but cropped to
 * nothing, while the full-screen dismiss layer behind it went on swallowing
 * every click. Invisible panel plus invisible click-eater reads exactly like a
 * frozen page.
 *
 * Dismissal is a document listener rather than that layer, which also fixes
 * the second half of it: with a covering element, opening one popover while
 * another was open cost two clicks, because the first was spent on the layer.
 */
function Pop({
  label,
  title,
  children,
  isActive,
  wide,
}: {
  label: React.ReactNode;
  title: string;
  children: React.ReactNode;
  isActive?: boolean;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const width = wide ? 300 : 220;

  // Measured before paint, so the panel never appears in the wrong place first.
  useLayoutEffect(() => {
    const el = trigger.current;
    if (!open || !el) return;
    const r = el.getBoundingClientRect();
    setPos({
      left: Math.max(8, Math.min(r.left, window.innerWidth - width - 12)),
      top: r.bottom + 8,
    });
  }, [open, width]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || trigger.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={trigger}
        onClick={() => setOpen((o) => !o)}
        title={title}
        className={`${icon} ${open || isActive ? active : ""}`}
      >
        {label}
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            style={{ left: pos.left, top: pos.top, width }}
            className="fixed z-[70] flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_20px_50px_-18px_rgba(15,23,42,.35)]"
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex items-center justify-between gap-2 text-[12.5px] text-slate-600">
    <span className="shrink-0">{label}</span>
    {children}
  </label>
);

function Swatch({
  value,
  fallback,
  onChange,
}: {
  value?: string;
  fallback: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="color"
      value={value || fallback}
      onChange={(e) => onChange(e.target.value)}
      className="h-6 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0"
    />
  );
}

const Check = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={(e) => onChange(e.target.checked)}
    className="h-3.5 w-3.5 accent-[color:var(--primary)]"
  />
);

/**
 * The single contextual bar across the top.
 *
 * What it shows follows the selection: a section offers background and order,
 * a heading offers type controls, a form field offers its label and key. This
 * is why the right-hand properties rail is gone — one bar that changes beats a
 * permanent panel that is mostly irrelevant to whatever you have selected.
 */
export default function StudioToolbar({
  siteId,
  base,
  bp,
  section,
  element,
  onPatchSection,
  onPatchElement,
  onDuplicate,
  onDelete,
  onBringForward,
  onReflow,
  onMoveSection,
  onAnimateAll,
  canMoveUp,
  canMoveDown,
}: {
  /** Needed to upload images into this site's asset store. */
  siteId?: string;
  /** Where this site's files are served from, for thumbnails. */
  base?: string;
  bp: Breakpoint;
  section: StudioSection | null;
  element: StudioElement | null;
  onPatchSection: (patch: Partial<StudioSection>) => void;
  onPatchElement: (patch: Partial<StudioElement>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  /** Re-runs the automatic phone layout for the selected section. */
  onReflow: () => void;
  /** Moves the selected section one place up (-1) or down (+1). */
  onMoveSection: (dir: -1 | 1) => void;
  /** Sets the same scroll animation on every element in the section. */
  onAnimateAll: (anim?: Anim) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  // Declared before the branches below: hooks cannot live after an early
  // return, and each branch returns its own bar.
  const [media, setMedia] = useState(false);
  const [links, setLinks] = useState(false);
  const [tabsOpen, setTabsOpen] = useState(false);

  if (element) {
    const isText = element.type === "heading" || element.type === "text";
    const isField = element.type === "field";
    const canEditText = EDITABLE_TEXT.includes(element.type);
    const hasFill =
      element.type === "button" ||
      element.type === "shape" ||
      element.type === "divider" ||
      element.type === "navbar" ||
      element.type === "tags" ||
      element.type === "marquee" ||
      isField;
    const hasPicture =
      element.type === "image" || element.type === "shape" || element.type === "navbar";

    // Type size is per-breakpoint: a headline sized for desktop is unreadable
    // on a phone, and the two have to be adjustable independently.
    const setFontSize = (n: number) =>
      onPatchElement(
        bp === "desktop" ? { fontSize: n } : { fontSizes: { ...element.fontSizes, [bp]: n } },
      );

    return (
      <div className="flex min-w-0 items-center gap-1">
        <span className="mr-0.5 shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {isField ? element.fieldType || "field" : element.type}
        </span>

        {/* The words themselves, so text is reachable without hunting for the
            double-click — and so a heading buried under another element is
            still editable. */}
        {canEditText && (
          <input
            value={element.text ?? ""}
            onChange={(e) => onPatchElement({ text: e.target.value })}
            placeholder={element.type === "shape" ? "Text in box" : "Text"}
            className={`${input} w-36`}
          />
        )}

        {isText && (
          <>
            <select
              value={fontSizeFor(element, bp) ?? 16}
              onChange={(e) => setFontSize(Number(e.target.value))}
              title="Type size"
              className={select}
            >
              {[12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 72].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button
              onClick={() => onPatchElement({ autoFit: !element.autoFit })}
              className={`${icon} ${element.autoFit ? active : ""}`}
              title="Scale the type as the box is resized"
            >
              <Scaling size={15} />
            </button>

            <button
              onClick={() =>
                onPatchElement({ fontWeight: (element.fontWeight ?? 400) >= 600 ? 400 : 700 })
              }
              className={`${icon} ${(element.fontWeight ?? 400) >= 600 ? active : ""}`}
              title="Bold"
            >
              <Bold size={15} />
            </button>
            <button
              onClick={() => onPatchElement({ italic: !element.italic })}
              className={`${icon} ${element.italic ? active : ""}`}
              title="Italic"
            >
              <Italic size={15} />
            </button>
            <button
              onClick={() => onPatchElement({ underline: !element.underline })}
              className={`${icon} ${element.underline ? active : ""}`}
              title="Underline"
            >
              <Underline size={15} />
            </button>

            {(["left", "center", "right"] as const).map((a) => {
              const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
              return (
                <button
                  key={a}
                  onClick={() => onPatchElement({ align: a })}
                  className={`${icon} ${element.align === a ? active : ""}`}
                  title={`Align ${a}`}
                >
                  <Icon size={15} />
                </button>
              );
            })}
          </>
        )}

        {/* A field's label and key matter more than its colour — a submission
            arrives named by `name`, so getting it wrong is invisible until the
            first entry lands with a useless key. */}
        {isField && (
          <>
            <select
              value={element.fieldType || "text"}
              onChange={(e) => onPatchElement({ fieldType: e.target.value as FieldType })}
              className={select}
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              value={element.label ?? ""}
              onChange={(e) => onPatchElement({ label: e.target.value })}
              placeholder="Label"
              className={`${input} w-28`}
            />
            <input
              value={element.name ?? ""}
              onChange={(e) =>
                onPatchElement({ name: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "_") })
              }
              placeholder="field_name"
              title="The key this value is submitted under"
              className={`${input} w-24 font-mono`}
            />
            <Pop label={<MoreHorizontal size={15} />} title="Field options">
              {element.fieldType !== "checkbox" && element.fieldType !== "select" && (
                <Row label="Placeholder">
                  <input
                    value={element.placeholder ?? ""}
                    onChange={(e) => onPatchElement({ placeholder: e.target.value })}
                    className={`${input} w-32`}
                  />
                </Row>
              )}
              {element.fieldType === "select" && (
                <Row label="Choices">
                  <ListInput
                    key={element.id}
                    value={element.options ?? []}
                    onChange={(options) => onPatchElement({ options })}
                    placeholder="One, Two"
                    className={`${input} w-32`}
                  />
                </Row>
              )}
              <Row label="Required">
                <Check
                  checked={!!element.required}
                  onChange={(required) => onPatchElement({ required })}
                />
              </Row>
            </Pop>
          </>
        )}

        {element.type === "navbar" && (
          <>
            <input
              value={element.text ?? ""}
              onChange={(e) => onPatchElement({ text: e.target.value })}
              placeholder="Brand"
              className={`${input} w-28`}
            />
            <button onClick={() => setLinks(true)} className={btn} title="Edit menu items and dropdowns">
              <Link2 size={15} /> Menu
              <span className="rounded bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-500">
                {element.links?.length ?? 0}
              </span>
            </button>
            <button
              onClick={() => onPatchElement({ sticky: !element.sticky })}
              className={`${btn} ${element.sticky ? active : ""}`}
              title="Keep this bar fixed at the top while the page scrolls"
            >
              <Pin size={15} /> Fixed
            </button>
            <button
              onClick={() => onPatchElement({ blur: !element.blur })}
              className={`${btn} ${element.blur ? active : ""}`}
              title="Frost whatever scrolls behind the bar"
            >
              <Sparkle size={15} /> Glass
            </button>
          </>
        )}

        {element.type === "social" && (
          <button onClick={() => setLinks(true)} className={btn} title="Edit each profile and its URL">
            <Link2 size={15} /> Profiles
            <span className="rounded bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-500">
              {element.socials?.length ?? 0}
            </span>
          </button>
        )}

        {MEDIA_LIST.includes(element.type) && (
          <button onClick={() => setMedia(true)} className={btn} title="Add, reorder or remove images">
            <Images size={15} />
            {element.type === "marquee" ? "Logos" : "Images"}
            <span className="rounded bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-500">
              {element.images?.length ?? 0}
            </span>
          </button>
        )}

        {element.type === "carousel" && (
          <select
            value={element.perView ?? 1}
            onChange={(e) => onPatchElement({ perView: Number(e.target.value) })}
            title="Slides visible at once"
            className={select}
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n} up</option>
            ))}
          </select>
        )}

        {(element.type === "tags" || element.type === "marquee") && (
          <>
            <ListInput
              key={element.id}
              value={element.options ?? []}
              onChange={(options) => onPatchElement({ options })}
              placeholder="Tag, tag, tag"
              className={`${input} w-40`}
            />
            <label className="flex shrink-0 items-center gap-1.5 px-1 text-[12.5px] text-slate-600">
              <Check
                checked={element.type === "marquee"}
                onChange={(on) => onPatchElement({ type: on ? "marquee" : "tags" })}
              />
              Scroll
            </label>
          </>
        )}

        {element.type === "tabs" && (
          <>
            <button
              onClick={() => setTabsOpen(true)}
              className={btn}
              title="Edit each tab and what sits under it"
            >
              <Rows3 size={15} /> Tabs
              <span className="rounded bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-500">
                {tabsOf(element).length}
              </span>
            </button>
            <select
              value={element.tabVariant ?? "underline"}
              onChange={(e) =>
                onPatchElement({ tabVariant: e.target.value as TabVariant })
              }
              title="How the tab list is laid out"
              className={select}
            >
              {TAB_VARIANTS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <select
              value={element.tabTransition ?? "fade"}
              onChange={(e) =>
                onPatchElement({ tabTransition: e.target.value as TabTransition })
              }
              title="How a panel arrives when its tab is picked"
              className={select}
            >
              {TAB_TRANSITIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={element.tabImageSide ?? "left"}
              onChange={(e) =>
                onPatchElement({
                  tabImageSide: e.target.value as "left" | "right" | "top",
                })
              }
              title="Where a tab's picture sits"
              className={select}
            >
              <option value="left">Image left</option>
              <option value="right">Image right</option>
              <option value="top">Image top</option>
            </select>
          </>
        )}

        {element.type === "price" && (
          <input
            value={element.caption ?? ""}
            onChange={(e) => onPatchElement({ caption: e.target.value })}
            placeholder="per month"
            className={`${input} w-28`}
          />
        )}

        {element.type === "rating" && (
          <select
            value={element.value ?? 5}
            onChange={(e) => onPatchElement({ value: Number(e.target.value) })}
            className={select}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>
            ))}
          </select>
        )}

        {element.type === "search" && (
          <input
            value={element.placeholder ?? ""}
            onChange={(e) => onPatchElement({ placeholder: e.target.value })}
            placeholder="Placeholder"
            className={`${input} w-36`}
          />
        )}

        {element.type === "icon" && (
          <select
            value={element.icon || "star"}
            onChange={(e) => onPatchElement({ icon: e.target.value })}
            className={select}
          >
            {ICON_NAMES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        )}

        {hasPicture && (
          <ImageField
            siteId={siteId}
            value={element.src}
            onChange={(src) => onPatchElement({ src })}
            placeholder={
              element.type === "shape"
                ? "Image in box"
                : element.type === "navbar"
                  ? "Logo image"
                  : "Image URL"
            }
            width="w-40"
          />
        )}

        {(element.type === "button" ||
          element.type === "video" ||
          element.type === "map" ||
          element.type === "embed") && (
          <input
            value={
              element.type === "map" || element.type === "embed"
                ? element.text ?? ""
                : element.type === "button"
                  ? element.href ?? ""
                  : element.src ?? ""
            }
            onChange={(e) =>
              onPatchElement(
                element.type === "map" || element.type === "embed"
                  ? { text: e.target.value }
                  : element.type === "button"
                    ? { href: e.target.value }
                    : { src: e.target.value },
              )
            }
            placeholder={
              element.type === "map"
                ? "Address"
                : element.type === "embed"
                  ? "Paste an embed link or <iframe>"
                  : element.type === "button"
                    ? "Link URL"
                    : "Video URL"
            }
            className={`${input} ${element.type === "embed" ? "w-64" : "w-40"}`}
          />
        )}

        {sep}

        <Pop label={<Palette size={15} />} title="Colour and shape" wide>
          <Row label="Text colour">
            <Swatch
              value={element.color}
              fallback="#0F172A"
              onChange={(color) => onPatchElement({ color })}
            />
          </Row>
          {hasFill && (
            <Row label="Fill">
              <Swatch
                value={element.bg}
                fallback="#2563EB"
                onChange={(bg) => onPatchElement({ bg })}
              />
            </Row>
          )}

          {/* Separate from Opacity below, which fades the whole element. This
              is the fill alone — what a frosted panel needs to see through. */}
          {hasFill && (
            <Row label="Fill transparency">
              <span className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={element.bgAlpha ?? (element.blur ? 0.55 : 1)}
                  onChange={(e) => onPatchElement({ bgAlpha: Number(e.target.value) })}
                  className="w-24"
                />
                <span className="w-8 text-right text-[11px] tabular-nums text-slate-400">
                  {Math.round((element.bgAlpha ?? (element.blur ? 0.55 : 1)) * 100)}%
                </span>
              </span>
            </Row>
          )}
          {ROUNDABLE.includes(element.type) && (
            <Row label="Corner radius">
              <span className="flex items-center gap-1.5">
                <Squircle size={13} className="text-slate-400" />
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={element.radius ?? 0}
                  onChange={(e) => onPatchElement({ radius: Math.max(0, Number(e.target.value)) })}
                  className={`${input} w-16`}
                />
              </span>
            </Row>
          )}
          {(element.type === "shape" || element.type === "navbar") && (
            <>
              <Row label="Border">
                <Swatch
                  value={element.border}
                  fallback="#E2E8F0"
                  onChange={(border) => onPatchElement({ border })}
                />
              </Row>
              <Row label="Shadow">
                <Check
                  checked={!!element.shadow}
                  onChange={(shadow) => onPatchElement({ shadow })}
                />
              </Row>
              {element.type === "shape" && (
                <Row label="Frosted glass">
                  <Check checked={!!element.blur} onChange={(blur) => onPatchElement({ blur })} />
                </Row>
              )}
            </>
          )}
          {hasPicture && element.src && (
            <Row label="Picture fills">
              <select
                value={element.fit || "cover"}
                onChange={(e) => onPatchElement({ fit: e.target.value as "cover" | "contain" })}
                className={select}
              >
                <option value="cover">Crop to fill</option>
                <option value="contain">Fit inside</option>
              </select>
            </Row>
          )}
          <Row label="Font">
            <select
              value={element.fontFamily ?? ""}
              onChange={(e) => onPatchElement({ fontFamily: e.target.value || undefined })}
              className={select}
            >
              <option value="">Inherit</option>
              {GOOGLE_FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </Row>

          <Row label="Opacity">
            <span className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={element.opacity ?? 1}
                onChange={(e) => onPatchElement({ opacity: Number(e.target.value) })}
                className="w-24"
              />
              <span className="w-8 text-right text-[11px] tabular-nums text-slate-400">
                {Math.round((element.opacity ?? 1) * 100)}%
              </span>
            </span>
          </Row>

          {/* The gradient is the whole element — without these the animated
              banner could be resized and rounded but never restyled. */}
          {element.type === "shader" && (
            <Row label="Gradient">
              <span className="flex items-center gap-1">
                {[0, 1, 2, 3].map((i) => {
                  const stops = element.colors ?? [];
                  return (
                    <Swatch
                      key={i}
                      value={stops[i]}
                      fallback={["#2563EB", "#7C3AED", "#0EA5E9", "#0F172A"][i]}
                      onChange={(c) => {
                        const next = [...stops];
                        while (next.length <= i) {
                          next.push(["#2563EB", "#7C3AED", "#0EA5E9", "#0F172A"][next.length]);
                        }
                        next[i] = c;
                        onPatchElement({ colors: next });
                      }}
                    />
                  );
                })}
              </span>
            </Row>
          )}

          {(element.type === "shader" || element.type === "marquee") && (
            <Row label={element.type === "shader" ? "Speed" : "Seconds per pass"}>
              <input
                type="number"
                min={element.type === "shader" ? 0.2 : 4}
                max={element.type === "shader" ? 5 : 120}
                step={element.type === "shader" ? 0.2 : 1}
                value={element.speed ?? (element.type === "shader" ? 1 : 18)}
                onChange={(e) => onPatchElement({ speed: Number(e.target.value) })}
                className={`${input} w-20`}
              />
            </Row>
          )}

          <p className="text-[11px] leading-snug text-slate-400">
            Corners can also be dragged: the round grips inside each corner on
            the canvas.
          </p>
        </Pop>

        <Pop
          label={<Sparkles size={15} />}
          title="Animation and layering"
          isActive={!!element.anim || !!element.revealOnHover}
        >
          <Row label="On scroll">
            <select
              value={element.anim ?? ""}
              onChange={(e) => onPatchElement({ anim: (e.target.value || undefined) as Anim })}
              className={select}
            >
              <option value="">None</option>
              {ANIMS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </Row>
          <Row label="Overflow the section">
            <Check
              checked={!!element.escape}
              onChange={(escape) => onPatchElement({ escape })}
            />
          </Row>
          <Row label="Show on hover only">
            <Check
              checked={!!element.revealOnHover}
              onChange={(revealOnHover) => onPatchElement({ revealOnHover })}
            />
          </Row>
          {element.type === "button" && (
            <Row label="Submits the form">
              <Check
                checked={!!element.submit}
                onChange={(submit) => onPatchElement({ submit })}
              />
            </Row>
          )}
          <button onClick={onBringForward} className={`${btn} justify-center border border-slate-200`}>
            Bring forward
          </button>
          <p className="text-[11px] leading-snug text-slate-400">
            Overflow lets an element cross the boundary between two sections —
            half in one, half in the next. Animations play on the published
            page, not while editing.
          </p>
        </Pop>

        {sep}
        <button onClick={onDuplicate} className={icon} title="Duplicate">
          <Copy size={15} />
        </button>
        <button
          onClick={onDelete}
          className={`${icon} hover:bg-red-50 hover:text-red-600`}
          title="Delete"
        >
          <Trash2 size={15} />
        </button>

        <LinkPanel
          open={links && element.type === "social"}
          title="Social profiles"
          rows={(element.socials ?? []).map((s) => ({ label: s.icon, href: s.href }))}
          labelPlaceholder="twitter"
          labelOptions={Object.keys(SOCIAL_LABEL)}
          onChange={(rows) =>
            onPatchElement({
              socials: rows.map((r) => ({ icon: r.label.trim().toLowerCase(), href: r.href })),
            })
          }
          onClose={() => setLinks(false)}
        />

        <LinkPanel
          open={links && element.type === "navbar"}
          title="Menu items"
          rows={element.links ?? []}
          labelPlaceholder="About"
          nested
          onChange={(rows) => onPatchElement({ links: rows })}
          onClose={() => setLinks(false)}
        />

        <TabsPanel
          open={tabsOpen && element.type === "tabs"}
          siteId={siteId}
          tabs={tabsOf(element)}
          onChange={(tabs) => onPatchElement({ tabs })}
          onClose={() => setTabsOpen(false)}
        />

        <MediaPanel
          open={media && MEDIA_LIST.includes(element.type)}
          siteId={siteId}
          base={base}
          values={element.images ?? []}
          title={element.type === "marquee" ? "Logos" : "Images"}
          onChange={(images) => onPatchElement({ images })}
          onClose={() => setMedia(false)}
        />
      </div>
    );
  }

  if (section) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <span className="mr-0.5 shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Section
        </span>

        <button
          onClick={() => onMoveSection(-1)}
          disabled={!canMoveUp}
          className={icon}
          title="Move section up"
        >
          <ArrowUp size={15} />
        </button>
        <button
          onClick={() => onMoveSection(1)}
          disabled={!canMoveDown}
          className={icon}
          title="Move section down"
        >
          <ArrowDown size={15} />
        </button>

        {sep}

        <Pop label={<ImageIcon size={15} />} title="Background" isActive={!!section.bgImage} wide>
          <Row label="Colour">
            <Swatch
              value={section.bg}
              fallback="#ffffff"
              onChange={(bg) => onPatchSection({ bg, bgImage: undefined })}
            />
          </Row>
          <Row label="Image">
            <ImageField
              siteId={siteId}
              value={section.bgImage}
              onChange={(bgImage) => onPatchSection({ bgImage })}
              placeholder="URL or upload"
              width="w-36"
            />
          </Row>
          {section.bgImage && (
            <Row label="Fills the section">
              <select
                value={section.bgFit ?? "cover"}
                onChange={(e) =>
                  onPatchSection({ bgFit: e.target.value as "cover" | "contain" | "tile" })
                }
                className={select}
              >
                <option value="cover">Crop to fill</option>
                <option value="contain">Fit inside</option>
                <option value="tile">Tile</option>
              </select>
            </Row>
          )}

          {section.bgImage && (
            <Row label={section.bgFit === "contain" ? "Align" : "Focus on"}>
              <select
                value={section.bgPosition ?? "center"}
                onChange={(e) =>
                  onPatchSection({ bgPosition: e.target.value as BgPosition })
                }
                className={select}
              >
                {BG_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos.charAt(0).toUpperCase() + pos.slice(1)}
                  </option>
                ))}
              </select>
            </Row>
          )}

          {section.bgImage && (
            <Row label="Darken">
              <input
                type="range"
                min={0}
                max={0.8}
                step={0.05}
                value={section.overlay ?? 0}
                onChange={(e) => onPatchSection({ overlay: Number(e.target.value) })}
                className="w-32"
              />
            </Row>
          )}
        </Pop>

        <Pop
          label={<Sparkles size={15} />}
          title="Width and animation"
          isActive={!!section.fullWidth}
          wide
        >
          <Row label="Font">
            <select
              value={section.fontFamily ?? ""}
              onChange={(e) => onPatchSection({ fontFamily: e.target.value || undefined })}
              className={select}
            >
              <option value="">Page font</option>
              {GOOGLE_FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </Row>

          {/* Three-state, not a checkbox: an explicit "contained" has to be
              able to override a page that is full width everywhere else. */}
          <Row label="Width">
            <select
              value={section.fullWidth === undefined ? "" : section.fullWidth ? "full" : "boxed"}
              onChange={(e) =>
                onPatchSection({
                  fullWidth:
                    e.target.value === "" ? undefined : e.target.value === "full",
                })
              }
              className={select}
            >
              <option value="">Follow page</option>
              <option value="full">Full width</option>
              <option value="boxed">Contained</option>
            </select>
          </Row>
          {/* Setting the animation on each element by hand is tedious and the
              answer is almost always "the same for all of them". */}
          <Row label="Animate everything">
            <select
              value=""
              onChange={(e) => onAnimateAll((e.target.value || undefined) as Anim)}
              className={select}
            >
              <option value="">Choose…</option>
              <option value="">None</option>
              {ANIMS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </Row>
          <p className="text-[11px] leading-snug text-slate-400">
            Full width lets the design span the whole screen instead of stopping
            at 1200px. Page settings set the default for both of these.
          </p>
        </Pop>

        {/* Only meaningful once the section holds fields — showing it always
            would imply every section can receive submissions. */}
        {sectionHasForm(section) && (
          <Pop label={<Link2 size={15} />} title="Form" wide>
            <Row label="After submit">
              <input
                value={section.successMessage ?? ""}
                onChange={(e) => onPatchSection({ successMessage: e.target.value })}
                placeholder="Thanks — we got it."
                className={`${input} w-40`}
              />
            </Row>
          </Pop>
        )}

        {/* Only on mobile, because that is the only layout generated for you.
            It overwrites hand-placed phone positions, so it is a deliberate
            action rather than something that happens on every switch. */}
        {bp === "mobile" && (
          <button
            onClick={onReflow}
            className={btn}
            title="Re-stack this section for the phone, replacing any manual positions"
          >
            <Wand2 size={15} /> Auto-arrange
          </button>
        )}

        {sep}
        <button
          onClick={onDelete}
          className={`${icon} hover:bg-red-50 hover:text-red-600`}
          title="Delete section"
        >
          <Trash2 size={15} />
        </button>
      </div>
    );
  }

  return (
    <span className="text-[12.5px] text-slate-400">
      Select a section or an element to edit it
    </span>
  );
}
