import { useEffect, useMemo, useState } from "react";
import {
  AlignLeft,
  AtSign,
  BadgeDollarSign,
  CheckSquare,
  ChevronDownSquare,
  Code2,
  GalleryHorizontal,
  Grid3x3,
  FastForward,
  Hash,
  Image as ImageIcon,
  LayoutTemplate,
  Link2,
  MapPin,
  Menu,
  Minus,
  MousePointerClick,
  Phone,
  Play,
  Rows3,
  Search,
  Send,
  Share2,
  Sparkles,
  Square,
  Star,
  Tags,
  TextCursorInput,
  Type,
  Upload,
  X,
} from "lucide-react";
import { TEMPLATES, TEMPLATE_GROUPS } from "./templates";
import { StudioElement, StudioElementType } from "./types";

interface Entry {
  key: string;
  label: string;
  icon: any;
  hint: string;
  type: StudioElementType;
  /** Overrides layered onto the type's defaults — this is what turns one
   *  `field` element into eight different inputs in the panel. */
  extra?: Partial<StudioElement>;
}

/**
 * Grouped the way the grid builder's palette grouped them.
 *
 * Deliberately the same names and the same order — anyone moving across from
 * the old builder is looking for a specific entry in a specific list, and
 * regrouping "better" would make every one of them hunt for it.
 */
const GROUPS: { title: string; items: Entry[] }[] = [
  {
    title: "Elements",
    items: [
      { key: "heading", label: "Heading", icon: Type, hint: "Large title text", type: "heading" },
      { key: "text", label: "Text", icon: AlignLeft, hint: "Body copy", type: "text" },
      { key: "image", label: "Image", icon: ImageIcon, hint: "Photo or graphic", type: "image" },
      { key: "button", label: "Button", icon: MousePointerClick, hint: "Link or action", type: "button" },
      { key: "embed", label: "Embed", icon: Code2, hint: "Your own markup", type: "embed" },
      { key: "carousel", label: "Carousel", icon: GalleryHorizontal, hint: "Sliding images", type: "carousel" },
      { key: "tags", label: "Tags / pills", icon: Tags, hint: "Row of labels", type: "tags" },
      { key: "tabs", label: "Tabs", icon: Rows3, hint: "Switchable panels", type: "tabs" },
      { key: "navbar", label: "Navbar", icon: Menu, hint: "Brand and links", type: "navbar" },
      { key: "search", label: "Search bar", icon: Search, hint: "Site search input", type: "search" },
      { key: "marquee", label: "Marquee", icon: FastForward, hint: "Scrolling strip", type: "marquee" },
    ],
  },
  {
    title: "Utilities (card parts)",
    items: [
      { key: "rating", label: "Rating (stars)", icon: Star, hint: "Star score", type: "rating" },
      { key: "price", label: "Price", icon: BadgeDollarSign, hint: "Amount and period", type: "price" },
      { key: "util-tags", label: "Tags / pills", icon: Tags, hint: "Row of labels", type: "tags" },
      { key: "util-button", label: "Button", icon: MousePointerClick, hint: "Link or action", type: "button" },
    ],
  },
  {
    title: "Form",
    items: [
      {
        key: "field-text", label: "Text field", icon: TextCursorInput, hint: "Single line", type: "field",
        extra: { fieldType: "text", label: "Name", name: "name", placeholder: "Your name" },
      },
      {
        key: "field-email", label: "Email", icon: AtSign, hint: "Validated address", type: "field",
        extra: { fieldType: "email", label: "Email", name: "email", placeholder: "you@example.com" },
      },
      {
        key: "field-phone", label: "Phone", icon: Phone, hint: "Telephone number", type: "field",
        extra: { fieldType: "phone", label: "Phone", name: "phone", placeholder: "" },
      },
      {
        key: "field-number", label: "Number", icon: Hash, hint: "Numeric input", type: "field",
        extra: { fieldType: "number", label: "Quantity", name: "quantity" },
      },
      {
        key: "field-textarea", label: "Message", icon: AlignLeft, hint: "Multi-line box", type: "field",
        extra: { fieldType: "textarea", label: "Message", name: "message" },
      },
      {
        key: "field-select", label: "Dropdown", icon: ChevronDownSquare, hint: "Pick one option", type: "field",
        extra: { fieldType: "select", label: "Subject", name: "subject", options: ["General", "Sales", "Support"] },
      },
      {
        key: "field-checkbox", label: "Checkbox", icon: CheckSquare, hint: "Yes or no", type: "field",
        extra: { fieldType: "checkbox", label: "I agree to the terms", name: "consent" },
      },
      {
        key: "field-file", label: "File upload", icon: Upload, hint: "Attach a file", type: "field",
        extra: { fieldType: "file", label: "Attachment", name: "file" },
      },
      {
        key: "field-submit", label: "Submit button", icon: Send, hint: "Sends the form", type: "button",
        extra: { text: "Submit", submit: true, href: undefined },
      },
    ],
  },
  {
    title: "More",
    items: [
      { key: "shape", label: "Box", icon: Square, hint: "Panel or card surface", type: "shape" },
      { key: "gallery", label: "Gallery", icon: Grid3x3, hint: "Grid of images", type: "gallery" },
      { key: "video", label: "Video", icon: Play, hint: "Embedded video", type: "video" },
      { key: "icon", label: "Icon", icon: Star, hint: "Small symbol", type: "icon" },
      { key: "shader", label: "Animated banner", icon: Sparkles, hint: "Moving gradient", type: "shader" },
      { key: "divider", label: "Divider", icon: Minus, hint: "Horizontal rule", type: "divider" },
      { key: "social", label: "Social links", icon: Share2, hint: "Row of profile links", type: "social" },
      { key: "map", label: "Map", icon: MapPin, hint: "Location embed", type: "map" },
    ],
  },
];

/**
 * The Add panel, opened from the canvas rather than pinned to the side.
 *
 * A permanent palette costs 260px of width on every screen to serve an action
 * taken a handful of times per page. Opening it on demand gives the canvas the
 * full window, which is the point of the redesign.
 *
 * Templates sit in the same popup because "add a contact form" and "add a text
 * field" are the same intent at different scales — splitting them into separate
 * entry points means guessing which one you wanted before you have looked.
 */
export default function AddPanel({
  open,
  onClose,
  onPick,
  onPickTemplate,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (type: StudioElementType, extra?: Partial<StudioElement>) => void;
  onPickTemplate: (key: string) => void;
}) {
  const [tab, setTab] = useState<"Elements" | "Templates">("Elements");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const query = q.trim().toLowerCase();
  const match = (...fields: string[]) =>
    !query || fields.some((f) => f.toLowerCase().includes(query));

  const elementGroups = useMemo(
    () =>
      GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => match(i.label, i.hint)) })).filter(
        (g) => g.items.length,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query],
  );

  const templateGroups = useMemo(
    () =>
      TEMPLATE_GROUPS.map((title) => ({
        title,
        items: TEMPLATES.filter((t) => t.group === title && match(t.label, t.hint)),
      })).filter((g) => g.items.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query],
  );

  if (!open) return null;

  const empty =
    tab === "Elements" ? elementGroups.length === 0 : templateGroups.length === 0;

  return (
    <>
      {/* Dismiss layer. Transparent rather than dimmed: the canvas behind is the
          thing being added to, and dimming it hides the space you are aiming at. */}
      <div onClick={onClose} className="fixed inset-0 z-40" />

      <div className="fixed left-4 top-16 z-50 flex max-h-[calc(100vh-96px)] w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,.35)]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <span className="text-[14px] font-semibold text-slate-900">Add to page</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="shrink-0 space-y-3 border-b border-slate-200 p-3">
          <div className="flex gap-0.5 rounded-[10px] bg-slate-100 p-[3px]">
            {(["Elements", "Templates"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-1.5 text-[12.5px] transition-colors ${
                  tab === t
                    ? "bg-white font-semibold text-slate-900 shadow-sm"
                    : "font-medium text-slate-500 hover:text-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tab === "Elements" ? "Search elements" : "Search templates"}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] outline-none transition-colors focus:border-primary focus:bg-white"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {empty && (
            <p className="py-6 text-center text-[12.5px] text-slate-400">
              Nothing matches “{q.trim()}”.
            </p>
          )}

          {tab === "Elements"
            ? elementGroups.map((g) => (
                <div key={g.title} className="mb-4 last:mb-0">
                  <p className="mb-2 px-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                    {g.title}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {g.items.map((it) => {
                      const Icon = it.icon;
                      return (
                        <button
                          key={it.key}
                          onClick={() => {
                            onPick(it.type, it.extra);
                            onClose();
                          }}
                          className="flex flex-col items-start gap-1.5 rounded-xl border border-slate-200 p-3 text-left transition-colors hover:border-primary hover:bg-primary-light/40"
                        >
                          <Icon size={17} className="text-primary" />
                          <span className="text-[12.5px] font-medium text-slate-800">
                            {it.label}
                          </span>
                          <span className="text-[11px] leading-tight text-slate-400">
                            {it.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            : templateGroups.map((g) => (
                <div key={g.title} className="mb-4 last:mb-0">
                  <p className="mb-2 px-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                    {g.title}
                  </p>
                  <div className="space-y-2">
                    {g.items.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => {
                          onPickTemplate(t.key);
                          onClose();
                        }}
                        className="flex w-full items-start gap-3 rounded-xl border border-slate-200 p-3 text-left transition-colors hover:border-primary hover:bg-primary-light/40"
                      >
                        <LayoutTemplate size={17} className="mt-0.5 shrink-0 text-primary" />
                        <span className="min-w-0">
                          <span className="block text-[12.5px] font-medium text-slate-800">
                            {t.label}
                          </span>
                          <span className="block text-[11px] leading-tight text-slate-400">
                            {t.hint}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
        </div>

        {tab === "Templates" && (
          <p className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] leading-snug text-slate-500">
            <Link2 size={11} className="mr-1 inline align-[-1px]" />
            Templates drop in as ordinary elements — every part stays draggable.
          </p>
        )}
      </div>
    </>
  );
}
