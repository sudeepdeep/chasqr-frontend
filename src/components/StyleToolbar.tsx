import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

/** Parse an inline `style` string into a lowercased prop→value map. */
function parseStyle(s?: string): Record<string, string> {
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

function serializeStyle(o: Record<string, string>): string {
  return Object.entries(o)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}

/** Parse any CSS font-size value into pixels (integer). Returns null if unset. */
function parseFontSizePx(v: string): number | null {
  if (!v) return null;
  if (v.endsWith("px")) return Math.round(parseFloat(v));
  if (v.endsWith("rem")) return Math.round(parseFloat(v) * 16);
  if (v.endsWith("em")) return Math.round(parseFloat(v) * 16);
  return null;
}

interface Props {
  /** Current inline style string (edits[key::style] ?? item.style). */
  style?: string;
  /** Called with the new serialized style string. */
  onChange: (style: string) => void;
}

/** Compact per-element styling controls: color, bold/italic/underline, size, alignment. */
export default function StyleToolbar({ style, onChange }: Props) {
  const st = parseStyle(style);

  const setProp = (prop: string, value: string | null) => {
    const next = { ...st };
    if (value === null || value === "") delete next[prop];
    else next[prop] = value;
    onChange(serializeStyle(next));
  };

  const toggle = (prop: string, on: string) =>
    setProp(prop, st[prop] === on ? null : on);

  const color = /^#[0-9a-fA-F]{6}$/.test(st.color || "") ? st.color : "#111827";
  const isBold = st["font-weight"] === "bold" || parseInt(st["font-weight"] || "0", 10) >= 600;
  const isItalic = st["font-style"] === "italic";
  const isUnderline = (st["text-decoration"] || "").includes("underline");
  const align = st["text-align"] || "";

  const btn = (active: boolean) =>
    `w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
      active ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100"
    }`;

  return (
    <div className="flex items-center gap-1 flex-wrap mt-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide pl-0.5 pr-1">Text</span>
      {/* Text color */}
      <label className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 cursor-pointer relative" title="Text color">
        <span className="w-4 h-4 rounded-sm border border-slate-300" style={{ backgroundColor: color }} />
        <input
          type="color"
          value={color}
          onChange={(e) => setProp("color", e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>

      <span className="w-px h-5 bg-slate-200 mx-0.5" />

      <button type="button" className={btn(isBold)} title="Bold" onClick={() => toggle("font-weight", "bold")}>
        <Bold size={13} />
      </button>
      <button type="button" className={btn(isItalic)} title="Italic" onClick={() => toggle("font-style", "italic")}>
        <Italic size={13} />
      </button>
      <button type="button" className={btn(isUnderline)} title="Underline" onClick={() => toggle("text-decoration", "underline")}>
        <Underline size={13} />
      </button>

      <span className="w-px h-5 bg-slate-200 mx-0.5" />

      <button type="button" className={btn(align === "left")} title="Align left" onClick={() => toggle("text-align", "left")}>
        <AlignLeft size={13} />
      </button>
      <button type="button" className={btn(align === "center")} title="Align center" onClick={() => toggle("text-align", "center")}>
        <AlignCenter size={13} />
      </button>
      <button type="button" className={btn(align === "right")} title="Align right" onClick={() => toggle("text-align", "right")}>
        <AlignRight size={13} />
      </button>

      <span className="w-px h-5 bg-slate-200 mx-0.5" />

      {/* Font size +/- controls */}
      {(() => {
        const sizePx = parseFontSizePx(st["font-size"] || "");
        const displayPx = sizePx ?? 16;
        const change = (delta: number) => {
          const next = Math.min(120, Math.max(8, displayPx + delta));
          setProp("font-size", `${next}px`);
        };
        return (
          <div className="flex items-center gap-0.5" title="Font size">
            <button
              type="button"
              onClick={() => change(-1)}
              title="Decrease font size"
              className="w-6 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors text-base leading-none select-none"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => sizePx !== null && setProp("font-size", null)}
              title={sizePx !== null ? "Click to reset to default" : "Font size (default)"}
              className="h-7 px-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition-colors min-w-[3rem] text-center tabular-nums"
            >
              {sizePx !== null ? `${displayPx}px` : "Default"}
            </button>
            <button
              type="button"
              onClick={() => change(+1)}
              title="Increase font size"
              className="w-6 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors text-base leading-none select-none"
            >
              +
            </button>
          </div>
        );
      })()}
    </div>
  );
}
