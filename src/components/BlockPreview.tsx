import {
  GalleryHorizontal,
  Image as ImageIcon,
  Film,
  Search as SearchIcon,
  Star,
} from "lucide-react";

/**
 * Renders a layout block roughly as it will appear on the published page.
 *
 * The canvas used to show a form per block — an input for the heading, a
 * textarea for the text, a URL field for the image — so a page of six blocks
 * read as eighteen form controls and you could not tell what you were making
 * until you deployed it. This draws the thing instead, and the controls open
 * only for the block you are actually editing.
 *
 * A deliberate approximation, not a renderer: it mirrors the real output of
 * layoutRenderer.service closely enough to judge layout, hierarchy and colour,
 * while staying a small readable component. The Preview button remains the
 * source of truth for exact output.
 */

/** Inline style strings are authored in the toolbar; parse them for preview. */
function parseStyle(style?: string): React.CSSProperties {
  if (!style) return {};
  const out: Record<string, string> = {};
  style.split(";").forEach((decl) => {
    const i = decl.indexOf(":");
    if (i < 0) return;
    const prop = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!prop || !value) return;
    // "font-size" → "fontSize"
    out[prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
  });
  return out as React.CSSProperties;
}

const alignClass = (align?: string) =>
  align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

/** Empty blocks still need to occupy space, or the canvas collapses oddly. */
function Placeholder({
  icon: Icon,
  label,
  tall,
}: {
  icon: any;
  label: string;
  tall?: boolean;
}) {
  return (
    <div
      className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-[12px] text-slate-400 ${
        tall ? "h-32" : "h-16"
      }`}
    >
      <Icon size={15} />
      {label}
    </div>
  );
}

export default function BlockPreview({ block }: { block: any }) {
  const style = parseStyle(block.style);
  const align = alignClass(block.align);

  switch (block.type) {
    case "heading":
      return (
        <h2
          style={style}
          className={`m-0 text-[22px] font-bold leading-tight text-slate-900 ${align}`}
        >
          {block.text || "Heading"}
        </h2>
      );

    case "text":
      return (
        <p
          style={style}
          className={`m-0 whitespace-pre-line text-[13.5px] leading-relaxed text-slate-600 ${align}`}
        >
          {block.text || "Text…"}
        </p>
      );

    case "image":
      return block.src ? (
        <img
          src={block.src}
          alt={block.alt || ""}
          style={style}
          className={`max-h-56 w-full rounded-lg object-cover ${
            block.bleed ? "" : ""
          }`}
        />
      ) : (
        <Placeholder icon={ImageIcon} label="No image set" tall />
      );

    case "button":
      return (
        <div className={align}>
          <span
            style={style}
            className="inline-block rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white"
          >
            {block.text || "Button"}
          </span>
        </div>
      );

    case "tags": {
      const tags = (block.text || "")
        .split("\n")
        .map((t: string) => t.trim())
        .filter(Boolean);
      if (!tags.length) return <Placeholder icon={Star} label="No tags yet" />;
      return (
        <div className={`flex flex-wrap gap-1.5 ${block.align === "center" ? "justify-center" : ""}`}>
          {tags.map((t: string, i: number) => (
            <span
              key={i}
              style={{
                background: block.tagBg || "#EEF2FF",
                color: block.tagColor || "#4338CA",
              }}
              className="rounded-full px-2.5 py-1 text-[11.5px] font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      );
    }

    case "rating": {
      const value = Math.max(0, Math.min(5, Math.round(block.value ?? 5)));
      return (
        <div className={`flex gap-0.5 ${block.align === "center" ? "justify-center" : ""}`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              size={15}
              className={i < value ? "fill-amber-400 text-amber-400" : "text-slate-300"}
            />
          ))}
        </div>
      );
    }

    case "price":
      return (
        <p style={style} className={`m-0 text-[20px] font-bold text-slate-900 ${align}`}>
          {block.text || "$0"}
        </p>
      );

    case "search":
      return (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] text-slate-400">
          <SearchIcon size={14} />
          {block.text || "Search…"}
        </div>
      );

    case "navbar": {
      const links = block.links || [];
      return (
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
          <span className="text-[13px] font-bold text-slate-900">
            {block.text || "Brand"}
          </span>
          <span className="flex flex-1 flex-wrap gap-3">
            {(links.length ? links : [{ id: "a", label: "Link" }]).map((l: any) => (
              <span key={l.id} className="text-[12px] text-slate-500">
                {l.label}
              </span>
            ))}
          </span>
        </div>
      );
    }

    case "tabs": {
      const tabs = block.tabs || [];
      const active = block.activeTab ?? 0;
      if (!tabs.length) return <Placeholder icon={GalleryHorizontal} label="No tabs yet" />;
      return (
        <div>
          <div className="flex gap-1 border-b border-slate-200">
            {tabs.map((t: any, i: number) => (
              <span
                key={t.id}
                className={`px-3 py-1.5 text-[12px] ${
                  i === active
                    ? "border-b-2 border-primary font-semibold text-slate-900"
                    : "text-slate-500"
                }`}
              >
                {t.label}
              </span>
            ))}
          </div>
          <p className="mt-2 whitespace-pre-line text-[12.5px] text-slate-600">
            {tabs[active]?.text}
          </p>
        </div>
      );
    }

    case "carousel": {
      const images = (block.images || []).filter(Boolean);
      if (!images.length)
        return <Placeholder icon={GalleryHorizontal} label="No images yet" tall />;
      const per = Math.max(1, Math.min(block.perView || 1, 4));
      return (
        <div className="flex gap-2 overflow-hidden">
          {images.slice(0, per).map((src: string, i: number) => (
            <img
              key={i}
              src={src}
              alt=""
              className="h-32 flex-1 rounded-lg object-cover"
            />
          ))}
        </div>
      );
    }

    case "embed":
      return block.src ? (
        <div className="flex h-32 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-[12px] text-white/70">
          <Film size={16} /> Embedded media
        </div>
      ) : (
        <Placeholder icon={Film} label="No embed URL" tall />
      );

    case "form": {
      const fields = block.fields || [];
      return (
        <div className="space-y-2">
          {(fields.length ? fields : [{ id: "f", label: "Field", width: "full" }]).map(
            (f: any) => (
              <div key={f.id}>
                <p className="mb-1 text-[11px] font-medium text-slate-500">
                  {f.label}
                </p>
                <div className="h-8 rounded-lg border border-slate-200 bg-white" />
              </div>
            ),
          )}
          <span className="inline-block rounded-lg bg-primary px-4 py-2 text-[12.5px] font-semibold text-white">
            {block.text || "Submit"}
          </span>
        </div>
      );
    }

    default:
      return (
        <p className="m-0 text-[12.5px] text-slate-400">{block.type}</p>
      );
  }
}
