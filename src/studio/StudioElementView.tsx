import { useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  Image as ImageIcon,
  MapPin,
  Play,
  Search,
  Star,
  Upload,
} from "lucide-react";
import { resolveAsset } from "./assetUrl";
import { fillOf } from "./color";
import { ICONS, SOCIAL_LABEL } from "./icons";
import {
  Box,
  Breakpoint,
  EDITABLE_TEXT,
  ROUNDABLE,
  StudioElement,
  fontSizeFor,
  tabsOf,
} from "./types";

/** Eight resize grips, in the order Wix and every design tool uses. */
export type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

/** The four corners that can be dragged inward to round the shape. */
export type Corner = "nw" | "ne" | "se" | "sw";

const CORNERS: { id: Corner; css: React.CSSProperties }[] = [
  { id: "nw", css: { left: 0, top: 0 } },
  { id: "ne", css: { right: 0, top: 0 } },
  { id: "se", css: { right: 0, bottom: 0 } },
  { id: "sw", css: { left: 0, bottom: 0 } },
];

const HANDLES: { id: Handle; css: React.CSSProperties; cursor: string }[] = [
  { id: "nw", css: { left: -4, top: -4 }, cursor: "nwse-resize" },
  { id: "n", css: { left: "50%", top: -4, marginLeft: -4 }, cursor: "ns-resize" },
  { id: "ne", css: { right: -4, top: -4 }, cursor: "nesw-resize" },
  { id: "e", css: { right: -4, top: "50%", marginTop: -4 }, cursor: "ew-resize" },
  { id: "se", css: { right: -4, bottom: -4 }, cursor: "nwse-resize" },
  { id: "s", css: { left: "50%", bottom: -4, marginLeft: -4 }, cursor: "ns-resize" },
  { id: "sw", css: { left: -4, bottom: -4 }, cursor: "nesw-resize" },
  { id: "w", css: { left: -4, top: "50%", marginTop: -4 }, cursor: "ew-resize" },
];

/** The chrome shared by every form input, so they line up visually. */
function fieldShell(el: StudioElement, fs?: number): React.CSSProperties {
  return {
    background: fillOf(el) || "#ffffff",
    border: `1px solid ${el.border || "#CBD5E1"}`,
    borderRadius: el.radius ?? 8,
    color: el.color || "#0F172A",
    fontSize: fs ?? 14,
  };
}

function Field({ el, fs }: { el: StudioElement; fs?: number }) {
  const type = el.fieldType || "text";
  const label = (
    <span
      className="mb-1.5 block shrink-0 truncate text-[12px] font-medium"
      style={{ color: el.color || "#334155" }}
    >
      {el.label || "Label"}
      {el.required && <span className="text-red-500"> *</span>}
    </span>
  );

  if (type === "checkbox") {
    return (
      <div className="flex h-full w-full items-center gap-2.5">
        <span
          className="h-[18px] w-[18px] shrink-0 rounded-[4px]"
          style={{ border: `1px solid ${el.border || "#CBD5E1"}`, background: el.bg || "#fff" }}
        />
        <span className="truncate" style={{ color: el.color || "#334155", fontSize: fs ?? 14 }}>
          {el.label || "Checkbox"}
          {el.required && <span className="text-red-500"> *</span>}
        </span>
      </div>
    );
  }

  if (type === "file") {
    return (
      <div className="flex h-full w-full flex-col">
        {label}
        <div
          style={{ ...fieldShell(el, fs), borderStyle: "dashed" }}
          className="flex flex-1 items-center justify-center gap-2 text-slate-400"
        >
          <Upload size={15} />
          <span className="text-[12.5px]">{el.placeholder || "Choose a file"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      {label}
      <div
        style={fieldShell(el, fs)}
        className={`flex flex-1 gap-2 px-3 ${
          type === "textarea" ? "items-start py-2" : "items-center"
        }`}
      >
        <span className="flex-1 truncate text-slate-400" style={{ fontSize: fs ?? 14 }}>
          {el.placeholder || (type === "select" ? el.options?.[0] || "Choose…" : "")}
        </span>
        {type === "select" && <ChevronDown size={15} className="shrink-0 text-slate-400" />}
      </div>
    </div>
  );
}

/** The element's own appearance, with no editor chrome. */
function Content({
  el,
  bp,
  siteBase,
  surface,
}: {
  el: StudioElement;
  bp: Breakpoint;
  siteBase?: string;
  /** The section colour behind the element — a filled step marker draws its
   *  number in this, since the marker itself is the text colour. */
  surface?: string;
}) {
  const fs = fontSizeFor(el, bp);
  // The fill carries its own transparency so glass has something to show
  // through, without fading the words sitting on it.
  const fill = fillOf(el);
  const asset = (src?: string) => resolveAsset(src, siteBase);
  const base: React.CSSProperties = {
    color: el.color,
    fontSize: fs,
    fontWeight: el.fontWeight,
    fontFamily: el.fontFamily,
    textAlign: el.align,
    fontStyle: el.italic ? "italic" : undefined,
    textDecoration: el.underline ? "underline" : undefined,
    opacity: el.opacity,
  };

  switch (el.type) {
    case "heading":
      return (
        <h2
          style={{ ...base, margin: 0, lineHeight: 1.15, whiteSpace: "pre-wrap" }}
          className="h-full w-full"
        >
          {el.text || "Heading"}
        </h2>
      );

    case "text":
      return (
        <p
          style={{ ...base, margin: 0, lineHeight: 1.55, whiteSpace: "pre-wrap" }}
          className="h-full w-full"
        >
          {el.text || "Text"}
        </p>
      );

    case "button":
      return (
        <span
          style={{
            ...base,
            background: fill,
            borderRadius: el.radius,
            border: el.border ? `1px solid ${el.border}` : undefined,
          }}
          className="flex h-full w-full items-center justify-center px-4"
        >
          {el.text || "Button"}
        </span>
      );

    case "price":
      return (
        <div className="flex h-full w-full flex-col justify-center" style={{ opacity: el.opacity }}>
          <span style={{ ...base, lineHeight: 1.1 }}>{el.text || "$0"}</span>
          {el.caption && (
            <span style={{ color: "#64748B", fontSize: Math.max(12, Math.round((fs || 32) * 0.34)) }}>
              {el.caption}
            </span>
          )}
        </div>
      );

    case "image":
      return el.src ? (
        <img
          src={asset(el.src)}
          alt={el.alt || ""}
          style={{ borderRadius: el.radius, opacity: el.opacity }}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          style={{ borderRadius: el.radius }}
          className="flex h-full w-full flex-col items-center justify-center gap-1 border border-dashed border-slate-300 bg-slate-50 text-slate-400"
        >
          <ImageIcon size={20} />
          <span className="text-[11px]">Double-click to upload</span>
        </div>
      );

    case "video":
      return (
        <div
          style={{ borderRadius: el.radius }}
          className="flex h-full w-full items-center justify-center gap-2 bg-slate-900 text-white/70"
        >
          <Play size={18} />
          <span className="text-[12px]">{el.src ? "Video" : "No video URL"}</span>
        </div>
      );

    case "icon": {
      const Icon = ICONS[el.icon || "star"] || Star;
      return (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ color: el.color, opacity: el.opacity }}
        >
          <Icon size={Math.max(16, Math.min(el.boxes[bp]?.w ?? 40, 96))} />
        </div>
      );
    }

    case "rating": {
      const filled = Math.round(el.value ?? 5);
      return (
        <div className="flex h-full w-full items-center gap-1" style={{ color: el.color || "#F59E0B" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              size={Math.min(24, Math.max(12, (el.boxes[bp]?.h ?? 24) - 4))}
              fill={i < filled ? "currentColor" : "none"}
              strokeWidth={1.5}
            />
          ))}
        </div>
      );
    }

    case "tags":
      return (
        <div className="flex h-full w-full flex-wrap items-center gap-1.5">
          {(el.options || []).map((t, i) => (
            <span
              key={i}
              style={{
                background: fill || "#EFF6FF",
                color: el.color || "#2563EB",
                borderRadius: el.radius ?? 999,
                fontSize: fs ?? 13,
              }}
              className="px-2.5 py-1 font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      );

    case "tabs": {
      // The first tab stands in for the set: the canvas is for arranging, and
      // a panel that changed under the cursor would fight with dragging.
      const items = tabsOf(el);
      const first = items[0];
      const side = el.tabImageSide || "left";
      const variant = el.tabVariant || "underline";

      const panel = (
        <div
          className={`flex min-h-0 flex-1 gap-5 ${
            side === "top" ? "flex-col" : side === "right" ? "flex-row-reverse" : ""
          }`}
        >
          {first?.image && (
            <img
              src={asset(first.image)}
              alt=""
              className={`block rounded-[10px] object-cover ${
                side === "top" ? "h-[60%] w-full" : "h-full w-[45%] shrink-0"
              }`}
            />
          )}
          <div className="min-w-0 flex-1 overflow-hidden">
            {first?.heading && (
              <p
                style={{ color: el.color, fontSize: (fs ?? 15) * 1.5, lineHeight: 1.15 }}
                className="mb-2"
              >
                {first.heading}
              </p>
            )}
            <p
              style={{ color: el.color, fontSize: fs ?? 15, whiteSpace: "pre-wrap" }}
              className="leading-relaxed opacity-80"
            >
              {first?.body || "What belongs under this tab"}
            </p>
          </div>
        </div>
      );

      const bar = items.map((t, i) => {
        const on = i === 0;
        const label = t.label || `Tab ${i + 1}`;

        if (variant === "index") {
          return (
            <span
              key={i}
              style={{ fontSize: fs ?? 14, color: el.color }}
              className={`flex items-baseline gap-3.5 border-t border-current/25 py-3 ${
                on ? "opacity-100" : "opacity-55"
              } ${i === items.length - 1 ? "border-b" : ""}`}
            >
              <span className="text-[0.8em] opacity-70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block truncate">{label}</span>
                {t.note && <span className="block text-[0.82em] opacity-65">{t.note}</span>}
              </span>
            </span>
          );
        }

        if (variant === "stepper") {
          return (
            <span
              key={i}
              style={{ fontSize: fs ?? 14, color: el.color }}
              className={`flex flex-col gap-3 pr-7 ${on ? "opacity-100" : "opacity-60"}`}
            >
              <span className="flex items-center gap-3">
                <span
                  style={on ? { color: surface || "#ffffff" } : undefined}
                  className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-current text-[0.8em] ${
                    on ? "bg-[currentColor] font-semibold" : ""
                  }`}
                >
                  {/* The marker is filled in the text colour, so the number
                      has to be drawn in the surface colour to stay legible. */}
                  <span style={on ? { color: surface || "#ffffff" } : undefined}>
                    {i + 1}
                  </span>
                </span>
                {i !== items.length - 1 && (
                  <span className="h-px flex-1 bg-current opacity-35" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate">{label}</span>
                {t.note && <span className="block text-[0.82em] opacity-65">{t.note}</span>}
              </span>
            </span>
          );
        }

        return (
          <span
            key={i}
            style={{ fontSize: (fs ?? 14) * 1.06, color: el.color }}
            className={`-mb-px whitespace-nowrap border-b-2 pb-3.5 ${
              on ? "border-current font-medium opacity-100" : "border-transparent opacity-60"
            }`}
          >
            {label}
          </span>
        );
      });

      return (
        <div className="relative h-full w-full">
          {/* The index runs down the side, so it is a two-column element
              rather than a bar above a panel. */}
          {variant === "index" ? (
            <div className="grid h-full w-full grid-cols-[232px_1fr] items-start gap-12">
              <div className="flex flex-col">{bar}</div>
              {panel}
            </div>
          ) : (
            <div className="flex h-full w-full flex-col">
              <div
                className={
                  variant === "stepper"
                    ? "grid shrink-0 grid-flow-col auto-cols-fr"
                    : "flex shrink-0 gap-9 border-b border-current/20"
                }
                style={{ color: el.color }}
              >
                {bar}
              </div>
              <div className="min-h-0 flex-1 pt-8">{panel}</div>
            </div>
          )}
        </div>
      );
    }

    case "search":
      return (
        <div style={fieldShell(el, fs)} className="flex h-full w-full items-center gap-2 px-4">
          <Search size={15} className="shrink-0 text-slate-400" />
          <span className="flex-1 truncate text-slate-400" style={{ fontSize: fs ?? 14 }}>
            {el.placeholder || "Search…"}
          </span>
        </div>
      );

    case "divider":
      return (
        <div className="flex h-full w-full items-center">
          <div
            className="w-full"
            style={{ height: Math.max(1, el.boxes[bp]?.h ?? 1), background: fill || "#E2E8F0" }}
          />
        </div>
      );

    case "embed":
      return (
        <div
          style={{ borderRadius: el.radius }}
          className="flex h-full w-full flex-col items-center justify-center gap-1.5 border border-dashed border-slate-300 bg-slate-50 text-slate-400"
        >
          <Code2 size={20} />
          <span className="px-4 text-center text-[11px] leading-tight">
            {el.text
              ? "Embed — shown on the published page"
              : "Paste an embed link or iframe"}
          </span>
        </div>
      );

    case "map":
      return (
        <div
          style={{ borderRadius: el.radius }}
          className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-slate-200 text-slate-500"
        >
          <MapPin size={20} />
          <span className="text-[12px]">{el.text || "Set a location"}</span>
        </div>
      );

    case "carousel": {
      const per = Math.max(1, el.perView ?? 1);
      const shown = (el.images ?? []).slice(0, per);
      const count = Math.max(3, el.images?.length ?? 3);
      return (
        <div
          style={{ borderRadius: el.radius, opacity: el.opacity }}
          className="relative h-full w-full overflow-hidden bg-slate-100"
        >
          {/* Showing `perView` slides side by side rather than one, because a
              three-up carousel that previews as a single image gives no idea
              what the published page will look like. */}
          <div className="flex h-full w-full gap-3">
            {(shown.length ? shown : Array.from({ length: per })).map((src: any, i: number) => (
              <div
                key={i}
                style={{ borderRadius: el.radius }}
                className="min-w-0 flex-1 overflow-hidden bg-slate-100"
              >
                {src ? (
                  <img src={asset(src)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <ImageIcon size={22} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <span className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm">
            <ChevronLeft size={16} />
          </span>
          <span className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm">
            <ChevronRight size={16} />
          </span>
          <span className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {Array.from({ length: count }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full ${i === 0 ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
              />
            ))}
          </span>
        </div>
      );
    }

    case "gallery": {
      const imgs = el.images?.length ? el.images : [];
      return (
        <div className="grid h-full w-full grid-cols-3 gap-2" style={{ opacity: el.opacity }}>
          {(imgs.length ? imgs : Array.from({ length: 6 })).map((src: any, i: number) => (
            <div key={i} style={{ borderRadius: el.radius }} className="overflow-hidden bg-slate-100">
              {src ? (
                <img src={asset(src)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <ImageIcon size={16} />
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    case "social":
      return (
        <div className="flex h-full w-full items-center gap-2">
          {(el.socials || []).map((s, i) => (
            <span
              key={i}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{
                color: el.color || "#0F172A",
                border: `1px solid ${el.border || "currentColor"}`,
                opacity: 0.9,
              }}
            >
              {SOCIAL_LABEL[s.icon] || s.icon.slice(0, 2)}
            </span>
          ))}
        </div>
      );

    case "navbar":
      return (
        <div
          className="flex h-full w-full items-center gap-6 px-4"
          style={{
            opacity: el.opacity,
            background: fill,
            borderRadius: el.radius,
            border: el.border ? `1px solid ${el.border}` : undefined,
            boxShadow: el.shadow ? "0 10px 30px -12px rgba(15,23,42,.25)" : undefined,
            backdropFilter: el.blur ? "blur(18px) saturate(160%)" : undefined,
          }}
        >
          {/* A logo replaces the wordmark rather than sitting beside it —
              a brand is one thing or the other. */}
          {el.src ? (
            <img
              src={asset(el.src)}
              alt={el.text || "Brand"}
              className="h-[70%] w-auto shrink-0 object-contain"
            />
          ) : (
            <span style={{ color: el.color, fontSize: (fs ?? 15) + 7, fontWeight: 700 }}>
              {el.text || "Brand"}
            </span>
          )}
          {/* Items lay themselves out, so adding one never needs repositioning. */}
          <span className="flex min-w-0 flex-1 items-center justify-end gap-6 overflow-hidden">
            {(el.links || []).map((l, i) => (
              <span
                key={i}
                className="flex shrink-0 items-center gap-1 whitespace-nowrap"
                style={{ color: el.color, fontSize: fs ?? 15, opacity: 0.75 }}
              >
                {l.label}
                {!!l.children?.length && <ChevronDown size={12} />}
              </span>
            ))}
          </span>
          {el.sticky && (
            <span className="shrink-0 rounded bg-slate-900/70 px-1.5 text-[9px] font-semibold uppercase tracking-wide text-white">
              fixed
            </span>
          )}
        </div>
      );

    case "marquee": {
      const logos = el.images ?? [];
      return (
        <div
          className="flex h-full w-full items-center gap-3 overflow-hidden"
          style={{ opacity: el.opacity }}
        >
          {/* Static in the editor: a strip sliding under the cursor makes the
              element impossible to click, and the motion is only meaningful on
              the published page anyway. */}
          {logos.length
            ? logos.map((src, i) => (
                <img
                  key={i}
                  src={asset(src)}
                  alt=""
                  style={{ borderRadius: el.radius === 999 ? 8 : el.radius }}
                  className="h-full w-auto shrink-0 object-contain"
                />
              ))
            : (el.options || []).map((t, i) => (
                <span
                  key={i}
                  style={{
                    background: fill || "#EFF6FF",
                    color: el.color || "#2563EB",
                    borderRadius: el.radius ?? 999,
                    fontSize: fs ?? 14,
                  }}
                  className="shrink-0 px-3 py-1 font-medium"
                >
                  {t}
                </span>
              ))}
        </div>
      );
    }

    case "shader": {
      const stops = el.colors?.length ? el.colors : ["#2563EB", "#7C3AED", "#0EA5E9"];
      return (
        <div
          style={{
            borderRadius: el.radius,
            opacity: el.opacity,
            backgroundImage: `linear-gradient(120deg, ${stops.join(", ")})`,
            backgroundSize: "220% 220%",
            animation: `cq-shader ${(el.speed ?? 1) * 14}s ease-in-out infinite`,
          }}
          className="h-full w-full"
        />
      );
    }

    case "field":
      return <Field el={el} fs={fs} />;

    case "shape":
    default: {
      const img = asset(el.src);
      return (
        <div
          style={{
            background: fill,
            borderRadius: el.radius,
            opacity: el.opacity,
            border: el.border ? `1px solid ${el.border}` : undefined,
            boxShadow: el.shadow ? "0 10px 30px -12px rgba(15,23,42,.25)" : undefined,
            backdropFilter: el.blur ? "blur(18px) saturate(160%)" : undefined,
          }}
          className="relative h-full w-full overflow-hidden"
        >
          {img && (
            <img
              src={img}
              alt={el.alt || ""}
              style={{ objectFit: el.fit || "cover", padding: el.fit === "contain" ? 12 : 0 }}
              className="absolute inset-0 h-full w-full"
            />
          )}
          {!!el.text && (
            <span
              style={{ ...base, lineHeight: 1.4, whiteSpace: "pre-wrap" }}
              className="relative flex h-full w-full items-center justify-center p-4"
            >
              {el.text}
            </span>
          )}
        </div>
      );
    }
  }
}

/**
 * Editing words in place, the way every other canvas editor does it.
 *
 * The text is written into the node once on mount and read back on commit
 * rather than being a controlled value — re-rendering a contentEditable from
 * state on every keystroke moves the caret to the end of the line, which makes
 * correcting a typo in the middle of a sentence impossible.
 */
function TextEditor({
  el,
  bp,
  onCommit,
}: {
  el: StudioElement;
  bp: Breakpoint;
  onCommit: (text: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  // Held in a ref so the unmount cleanup below always calls the current
  // handler without re-running the mount effect.
  const commit = useRef(onCommit);
  commit.current = onCommit;

  /**
   * The text is mirrored on every keystroke rather than read from the DOM when
   * the edit ends.
   *
   * Clicking another element unmounts this one, and React detaches the ref and
   * removes the node before the effect cleanup runs — so reading `innerText`
   * there returns nothing and commits an empty string, wiping the words the
   * user just typed. Mirroring is the only value still available at that point.
   */
  const latest = useRef(el.text ?? "");

  const finish = () => {
    if (done.current) return;
    done.current = true;
    commit.current(latest.current);
  };

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.innerText = el.text ?? "";
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    document.getSelection()?.removeAllRanges();
    document.getSelection()?.addRange(range);

    // Clicking straight onto another element unmounts this without ever firing
    // blur, and the typing would be lost — so the edit is also committed on the
    // way out.
    return finish;
    // Mount-time only: re-running would reset the caret mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fs = fontSizeFor(el, bp);
  const centred = el.type === "button" || el.type === "price";

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onPointerDown={(e) => e.stopPropagation()}
      onInput={(e) => {
        latest.current = (e.target as HTMLDivElement).innerText;
      }}
      onBlur={finish}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
          e.preventDefault();
          finish();
        }
      }}
      style={{
        color: el.color,
        fontSize: fs,
        fontWeight: el.fontWeight,
        fontFamily: el.fontFamily,
        textAlign: el.align,
        fontStyle: el.italic ? "italic" : undefined,
        textDecoration: el.underline ? "underline" : undefined,
        lineHeight: el.type === "text" ? 1.55 : 1.15,
        background: el.type === "button" ? el.bg : undefined,
        borderRadius: el.radius,
        whiteSpace: "pre-wrap",
        cursor: "text",
      }}
      className={`h-full w-full overflow-hidden outline-none ring-2 ring-primary ${
        centred ? "flex items-center justify-center px-4" : ""
      }`}
    />
  );
}

/**
 * One element on the canvas.
 *
 * Only the content and the drag-to-move behaviour: the selection outline and
 * its grips are a separate layer (`SelectionChrome`) that the canvas paints
 * above every element. Pointer events start here so a drag can begin anywhere
 * on the element; the canvas does the arithmetic, because only it knows the
 * scale.
 */
export default function StudioElementView({
  el,
  bp,
  box,
  selected,
  editing,
  onSelect,
  onDragStart,
  onDoubleClick,
  onCommitText,
  base,
  surface,
}: {
  el: StudioElement;
  bp: Breakpoint;
  box: Box;
  selected: boolean;
  editing: boolean;
  /** Where this site's own files are served from, for resolving uploads. */
  base?: string;
  /** The section colour behind this element. */
  surface?: string;
  onSelect: (additive: boolean) => void;
  onDragStart: (e: React.PointerEvent) => void;
  onDoubleClick: () => void;
  onCommitText: (text: string) => void;
}) {
  const canEditText = EDITABLE_TEXT.includes(el.type);

  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        // An element allowed out of its section has to paint over the band
        // below, which is later in the document and would otherwise cover it.
        zIndex: el.escape ? Math.max(60, el.z ?? 1) : el.z ?? 1,
      }}
      onPointerDown={(e) => {
        // Left button only: a right-click should open a context menu later, not
        // begin a drag the user cannot see the end of.
        if (e.button !== 0) return;
        e.stopPropagation();
        // While editing, the pointer belongs to the caret, not to a drag.
        if (editing) return;
        onSelect(e.shiftKey);
        onDragStart(e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      className={`group select-none ${editing ? "cursor-text" : "cursor-move"} ${
        selected || editing ? "" : "hover:outline hover:outline-1 hover:outline-primary/40"
      }`}
      title={canEditText && !editing ? "Double-click to edit the text" : undefined}
    >
      {editing ? (
        <TextEditor el={el} bp={bp} onCommit={onCommitText} />
      ) : (
        <Content el={el} bp={bp} siteBase={base} surface={surface} />
      )}

      {/* Reveal-on-hover elements are drawn normally here — hiding them would
          make them uneditable — so a corner marker is the only cue that they
          start invisible on the published page. */}
      {el.revealOnHover && (
        <span
          title="Hidden until the section is hovered"
          className="pointer-events-none absolute right-1 top-1 rounded bg-slate-900/70 px-1 text-[9px] font-semibold uppercase tracking-wide text-white"
        >
          hover
        </span>
      )}

    </div>
  );
}


/**
 * Selection outline, resize handles and corner grips, drawn above everything.
 *
 * Kept out of the element itself because the element used to be lifted a
 * thousand layers while selected so its handles would clear its neighbours.
 * That worked for a small heading and failed completely for a background:
 * selecting the animated backdrop raised it over the whole design, which then
 * vanished until something else was clicked.
 *
 * The chrome ignores the pointer except on the grips themselves, so clicking
 * the middle of a selected element still starts a drag on the element beneath.
 */
export function SelectionChrome({
  el,
  box,
  onResizeStart,
  onRadiusStart,
}: {
  el: StudioElement;
  box: Box;
  onResizeStart: (e: React.PointerEvent, handle: Handle) => void;
  onRadiusStart: (e: React.PointerEvent, corner: Corner) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        zIndex: 5000,
      }}
      className="pointer-events-none"
    >
      <div className="absolute inset-0 outline outline-[1.5px] outline-primary" />

      {HANDLES.map((h) => (
        <div
          key={h.id}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            // Stop the canvas seeing this as a click on empty space.
            e.stopPropagation();
            onResizeStart(e, h.id);
          }}
          style={{ ...h.css, position: "absolute", cursor: h.cursor }}
          className="pointer-events-auto h-2 w-2 rounded-[2px] border border-primary bg-white"
        />
      ))}

      {/* Corner grips sit inside the box, offset from the square resize
          handles so the two are never ambiguous under the cursor. Dragging
          one inward rounds every corner together. */}
      {ROUNDABLE.includes(el.type) &&
        box.w > 44 &&
        box.h > 44 &&
        CORNERS.map((c) => (
          <div
            key={c.id}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.stopPropagation();
              onRadiusStart(e, c.id);
            }}
            style={{ ...c.css, position: "absolute", margin: 11, cursor: "nwse-resize" }}
            title="Drag to round the corners"
            className="pointer-events-auto h-[9px] w-[9px] rounded-full border-[1.5px] border-primary bg-white shadow-sm"
          />
        ))}
    </div>
  );
}
