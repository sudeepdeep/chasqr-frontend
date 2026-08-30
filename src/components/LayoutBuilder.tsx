import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash2,
  Type,
  Image as ImageIcon,
  MousePointerClick,
  GripVertical,
  Monitor,
  Smartphone,
  Save,
  Columns,
  Upload,
  Palette,
  Sparkles,
  Paintbrush,
  Mail,
  Heading as HeadingIcon,
  Film,
  PanelTop,
  PanelBottom,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Ruler,
  MoveHorizontal,
  GalleryHorizontal,
  Wand2,
  ArrowLeft,
  ImagePlus,
  Layers,
  Square,
  ExternalLink,
  LayoutGrid,
  CreditCard,
  Quote,
  Megaphone,
  Tag,
  Rows,
  FastForward,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Search,
  Menu,
  Star,
  DollarSign,
  Copy,
} from "lucide-react";
import ShaderCanvas from "./ShaderCanvas";
import StyleToolbar from "./StyleToolbar";
import BlockPreview from "./BlockPreview";
import LivePreview from "./LivePreview";
import SplitPane from "./SplitPane";
import BuilderPaletteBody, {
  LayerNode,
  PaletteCategory,
  PaletteEntry,
  PaletteGroup,
} from "./BuilderPaletteBody";
import { updateLayoutAPI, uploadAssetAPI } from "../api/site.api";

type BlockType =
  | "text"
  | "heading"
  | "image"
  | "button"
  | "form"
  | "embed"
  | "carousel"
  | "tags"
  | "tabs"
  | "search"
  | "navbar"
  | "rating"
  | "price";
type Anim = "fade" | "up" | "down" | "left" | "right" | "zoom";
interface Tab {
  id: string;
  label: string;
  text: string;
}
type Align = "left" | "center" | "right";
type Hover = "lift" | "zoom" | "reveal";
export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "pills"
  | "checkbox"
  | "file"
  | "number";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  width?: "full" | "half";
  options?: string[];
  defaultValue?: string;
}

interface Block {
  id: string;
  type: BlockType;
  text?: string;
  src?: string;
  alt?: string;
  href?: string;
  target?: string;
  style?: string;
  align?: Align;
  bleed?: boolean;
  fade?: boolean;
  images?: string[];
  perView?: number;
  value?: number;
  tagBg?: string;
  tagColor?: string;
  marquee?: boolean;
  tabs?: Tab[];
  links?: NavLink[];       // navbar block: nav links (with optional submenus)
  activeTab?: number;      // index of the tab shown by default
  tabStyle?: "pills" | "underline" | "segment" | "boxed"; // tab visual style
  activeBg?: string;       // active tab pill background
  activeColor?: string;    // active tab pill text
  inactiveBg?: string;     // inactive tab pill background
  inactiveColor?: string;  // inactive tab pill text
  successMsg?: string;
  fields?: FormField[];
  submitStyle?: "primary" | "dark" | "gradient" | "accent";
  layoutStyle?: "stacked" | "card" | "minimal";
  imagePosition?: "left" | "right";
}
interface Column {
  id: string;
  span: number;
  blocks: Block[];
  // Card styling — turns a column into a visual card
  bg?: string;
  pad?: number;
  radius?: number;
  shadow?: boolean;
  borderW?: number;
  borderColor?: string;
  align?: Align;
  cardImg?: string;
  overlay?: string;
  minH?: number;
  hover?: Hover;
  full?: any;
  widthPct?: number;
}
interface Section {
  id: string;
  columns: Column[];
  bg?: string;
  glass?: boolean;
  radius?: number;
  padY?: number;
  padX?: number;
  full?: boolean;
  widthPct?: number;
  mt?: number;
  mb?: number;
  ml?: number;
  mr?: number;
  borderW?: number;
  borderColor?: string;
  bgImage?: string;
  overlay?: string;
  minH?: number;
  /** Animated WebGL background preset painted behind the content. */
  shader?: string;
  shadow?: boolean;
  font?: string;
  anim?: Anim;
  vAlign?: "top" | "center" | "bottom" | "stretch";
  scrollX?: boolean;
  slider?: boolean;
  perView?: number;
}
interface LayoutStyle {
  bg?: string;
  font?: string;
  reveal?: boolean;
  padX?: number;
  padY?: number;
}

// Mirrors the allowlist in the backend renderer — only these are accepted.
const GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Raleway",
  "Nunito",
  "Work Sans",
  "DM Sans",
  "Manrope",
  "Rubik",
  "Quicksand",
  "Space Grotesk",
  "Source Sans 3",
  "Oswald",
  "Bebas Neue",
  "Merriweather",
  "Playfair Display",
  "Lora",
];

/** Font dropdown shared by the page-level and section-level font pickers. */
function FontSelect({
  value,
  onChange,
  label,
}: {
  value?: string;
  onChange: (f?: string) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-slate-600 text-xs">
      {label}
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        style={value ? { fontFamily: value } : undefined}
        className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[170px]"
      >
        <option value="">Default</option>
        {GOOGLE_FONTS.map((f) => (
          <option key={f} value={f} style={{ fontFamily: f }}>
            {f}
          </option>
        ))}
      </select>
    </label>
  );
}

interface SubLink { id: string; label: string; href: string; }
interface NavLink {
  id: string;
  label: string;
  href: string;
  children?: SubLink[];
}
interface NavConfig {
  enabled: boolean;
  brand?: string;
  brandImg?: string;
  links: NavLink[];
  bg?: string;
  color?: string;
  sticky?: boolean;
  glass?: boolean;
  shadow?: boolean;
  full?: boolean;
  widthPct?: number;
  minH?: number;
  radius?: number;
  mt?: number;
  mb?: number;
  ml?: number;
  mr?: number;
}
interface FooterConfig {
  enabled: boolean;
  text?: string;
  links: NavLink[];
  bg?: string;
  color?: string;
  full?: boolean;
  widthPct?: number;
  minH?: number;
  radius?: number;
  mt?: number;
  mb?: number;
  ml?: number;
  mr?: number;
}

const emptyNav = (): NavConfig => ({
  enabled: false,
  brand: "",
  links: [],
  bg: "#ffffff",
  color: "#0f172a",
  sticky: false,
});
const emptyFooter = (): FooterConfig => ({
  enabled: false,
  text: "",
  links: [],
  bg: "#0f172a",
  color: "#e2e8f0",
});

// Live preview of a section's background/effect settings (mirrors the renderer).
function sectionPreviewStyle(sec: Section): React.CSSProperties {
  const s: React.CSSProperties = {};
  if (sec.shader) {
    // Same fallback gradient the renderer puts on .cq-shader-wrap, so the
    // section reads correctly before (or without) the canvas painting.
    s.background =
      "radial-gradient(120% 90% at 50% 40%, #1d4ed8 0%, #1e3a8a 45%, #020617 100%)";
    s.color = "#fff";
    s.position = "relative";
    s.overflow = "hidden";
  } else if (sec.bgImage) {
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
  // A custom width narrows the whole card (background included), not just its
  // content — auto-centered unless an explicit left/right margin is given.
  if (sec.widthPct) s.maxWidth = `${sec.widthPct}%`;
  s.marginLeft = sec.ml != null ? sec.ml : sec.widthPct ? "auto" : undefined;
  s.marginRight = sec.mr != null ? sec.mr : sec.widthPct ? "auto" : undefined;
  if (sec.minH) {
    s.minHeight = sec.minH;
    s.display = "flex";
    s.flexDirection = "column";
    s.justifyContent = "center";
  }
  if (sec.padY != null) {
    s.paddingTop = sec.padY;
    s.paddingBottom = sec.padY;
  }
  if (sec.padX != null) {
    s.paddingLeft = sec.padX;
    s.paddingRight = sec.padX;
  } else if (sec.glass || sec.bg || sec.bgImage) {
    s.paddingLeft = 20;
    s.paddingRight = 20;
  }
  if (sec.mt) s.marginTop = sec.mt;
  if (sec.mb) s.marginBottom = sec.mb;
  if (sec.borderW)
    s.border = `${sec.borderW}px solid ${sec.borderColor || "#e5e7eb"}`;
  if (sec.font) s.fontFamily = sec.font;
  return s;
}

const uid = () => Math.random().toString(36).slice(2, 10);

// Client-side mirror of the backend's embed allowlist — used only to show a
// live preview / friendly warning in the builder. The backend re-validates
// independently before ever rendering an iframe on the live site.
function toEmbedSrcPreview(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.pathname.startsWith("/embed/")) return url.toString();
    if (url.pathname.startsWith("/shorts/")) {
      const id = url.pathname.split("/")[2];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^\d+$/.test(id)
      ? `https://player.vimeo.com/video/${id}`
      : null;
  }
  if (host === "player.vimeo.com") return url.toString();
  if (host === "google.com" && url.pathname.startsWith("/maps/embed"))
    return url.toString();
  if (host === "google.com" && url.pathname.startsWith("/maps")) {
    const q = url.searchParams.get("q") || url.pathname;
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
  }
  if (host === "maps.google.com") {
    const q = url.searchParams.get("q") || "";
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
  }
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
  if (type === "button")
    return { id: uid(), type, text: "Click me", href: "#", target: "" };
  if (type === "form")
    return {
      id: uid(),
      type,
      text: "Send message",
      successMsg: "Thanks — we'll be in touch!",
      submitStyle: "dark",
      fields: [
        { id: uid(), type: "text", label: "First name", name: "first_name", placeholder: "First name", width: "half", required: true },
        { id: uid(), type: "text", label: "Last name", name: "last_name", placeholder: "Last name", width: "half", required: true },
        { id: uid(), type: "email", label: "Email", name: "email", placeholder: "you@company.com", width: "full", required: true },
        { id: uid(), type: "phone", label: "Phone number", name: "phone", placeholder: "+1 (555) 000-0000", width: "full" },
        { id: uid(), type: "textarea", label: "Message", name: "message", placeholder: "Leave us a message...", width: "full", required: true },
        { id: uid(), type: "checkbox", label: "You agree to our friendly privacy policy.", name: "privacy", width: "full", required: true },
      ],
    };
  if (type === "embed") return { id: uid(), type, src: "" };
  if (type === "carousel") return { id: uid(), type, images: [] };
  if (type === "tags") return { id: uid(), type, text: "4.8\nNew\nPopular" };
  if (type === "tabs")
    return {
      id: uid(),
      type,
      tabs: [
        { id: uid(), label: "Tab one", text: "Content for the first tab." },
        { id: uid(), label: "Tab two", text: "Content for the second tab." },
      ],
    };
  if (type === "rating") return { id: uid(), type, value: 4, text: "(11)" };
  if (type === "price") return { id: uid(), type, text: "$499.99", alt: "" };
  if (type === "search") return { id: uid(), type, text: "Search this page…" };
  if (type === "navbar")
    return {
      id: uid(),
      type,
      text: "Brand",
      links: [
        { id: uid(), label: "Home", href: "#" },
        { id: uid(), label: "About", href: "#" },
        { id: uid(), label: "Contact", href: "#" },
      ],
    };
  return { id: uid(), type, text: "Your text here" };
}

// A neutral stock placeholder so image/overlay/reveal templates look real out of
// the box; the user swaps it for their own photo.
const stock = (seed: string | number) =>
  `https://picsum.photos/seed/cq${seed}/700/560`;
function newSection(cols = 1): Section {
  const spans = evenSpans(cols);
  return {
    id: uid(),
    columns: spans.map((span) => ({ id: uid(), span, blocks: [] })),
  };
}

// Section presets ("banner" / composite blocks) inserted from the palette.
type PresetKind =
  | "image-banner"
  | "shader-banner"
  | "text-over-image"
  | "carousel"
  | "image-text"
  | "cards-image-3"
  | "cards-text-3"
  | "pricing-3"
  | "testimonials-3"
  | "cta"
  | "overlay-cards"
  | "reveal-cards"
  | "profile-cards"
  | "showcase-card"
  | "multi-carousel"
  | "product-carousel"
  | "form-split-modern"
  | "form-split-agency"
  | "form-survey-wizard"
  | "nav-simple"
  | "nav-search"
  | "footer-columns"
  | "footer-simple";

const uidBlock = (b: Omit<Block, "id">): Block =>
  ({ id: uid(), ...b }) as Block;

function newPreset(kind: PresetKind): Section {
  const col = (span: number, blocks: Block[]): Column => ({
    id: uid(),
    span,
    blocks,
  });
  // A column styled as a card (white surface, padding, rounding, soft shadow).
  const card = (
    span: number,
    blocks: Block[],
    extra?: Partial<Column>,
  ): Column => ({
    id: uid(),
    span,
    blocks,
    bg: "#ffffff",
    pad: 24,
    radius: 16,
    shadow: true,
    align: "left",
    ...extra,
  });

  if (kind === "cards-image-3") {
    // Image sits flush at the top of the card (full-bleed), text is padded below.
    const make = (title: string) =>
      card(
        4,
        [
          uidBlock({ type: "image", src: "", alt: "", bleed: true }),
          uidBlock({
            type: "heading",
            text: title,
            style: "font-size: 1.25rem",
          }),
          uidBlock({
            type: "text",
            text: "A short description of this feature or service goes here.",
          }),
          uidBlock({ type: "button", text: "Learn more", href: "#" }),
        ],
        { hover: "lift" },
      );
    return {
      id: uid(),
      padY: 48,
      columns: [make("First card"), make("Second card"), make("Third card")],
    };
  }
  // Full-image surface cards with a gradient + text overlaid at the bottom.
  if (kind === "overlay-cards") {
    const make = (title: string, i: number) =>
      card(
        4,
        [
          uidBlock({
            type: "heading",
            text: title,
            style: "color: #ffffff; font-size: 1.5rem",
          }),
          uidBlock({
            type: "text",
            text: "A short line describing this place or product.",
            style: "color: #e5e7eb",
          }),
          uidBlock({ type: "button", text: "Reserve now", href: "#" }),
        ],
        {
          pad: 22,
          cardImg: stock(i),
          overlay:
            "linear-gradient(to top, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.15) 55%, rgba(2,6,23,0) 100%)",
          minH: 380,
          hover: "lift",
          bg: "#0f172a",
        },
      );
    return {
      id: uid(),
      padY: 48,
      columns: [
        make("Santorini Villa", 11),
        make("Swiss Chalet", 12),
        make("Kyoto Ryokan", 13),
      ],
    };
  }
  // Card shows only the image; the text fades in over it on hover.
  if (kind === "reveal-cards") {
    const make = (title: string, i: number) =>
      card(
        4,
        [
          uidBlock({
            type: "heading",
            text: title,
            style: "color: #ffffff; font-size: 1.4rem",
          }),
          uidBlock({
            type: "text",
            text: "Hover to reveal the details of this item.",
            style: "color: #e5e7eb",
          }),
        ],
        {
          pad: 22,
          cardImg: stock(i),
          overlay: "rgba(2,6,23,0.72)",
          minH: 320,
          hover: "reveal",
          bg: "#0f172a",
          align: "center",
        },
      );
    return {
      id: uid(),
      padY: 48,
      columns: [make("Discover", 21), make("Explore", 22), make("Create", 23)],
    };
  }
  // A single rich showcase card: image top, dark body, title + price, tags, button.
  if (kind === "showcase-card") {
    const cardCol = card(
      12,
      [
        uidBlock({
          type: "image",
          src: stock(31),
          alt: "",
          bleed: true,
          fade: true,
          style: "height: 300px; object-fit: cover",
        }),
        uidBlock({
          type: "heading",
          text: "Santorini Sunset Loft",
          style: "color: #ffffff; font-size: 1.6rem",
        }),
        uidBlock({
          type: "text",
          text: "Experience a cliffside loft with iconic white walls, blue domes, and magical sunset views.",
          style: "color: #cbd5e1",
        }),
        uidBlock({ type: "tags", text: "★ 4.8\nRomantic Stay\n2 Night Trip" }),
        uidBlock({
          type: "button",
          text: "Book now",
          href: "#",
          align: "center",
          style:
            "background: #ffffff; color: #0f172a; width: 100%; text-align: center",
        }),
      ],
      { bg: "#1f2937", pad: 22, radius: 28, shadow: true, hover: "lift" },
    );
    // Narrow, centered section so the card reads like the reference.
    return { id: uid(), padY: 48, widthPct: 34, columns: [cardCol] };
  }
  // Profile / avatar cards: centered circular image, name, role, button.
  if (kind === "profile-cards") {
    const make = (name: string, role: string) =>
      card(
        4,
        [
          uidBlock({
            type: "image",
            src: "",
            alt: name,
            style:
              "width: 96px; height: 96px; border-radius: 999px; object-fit: cover",
            align: "center",
          }),
          uidBlock({ type: "heading", text: name, style: "font-size: 1.2rem" }),
          uidBlock({ type: "text", text: role, style: "color: #64748b" }),
          uidBlock({
            type: "button",
            text: "View profile",
            href: "#",
            align: "center",
          }),
        ],
        { align: "center", hover: "lift" },
      );
    return {
      id: uid(),
      padY: 48,
      columns: [
        make("Alex Doe", "Product Designer"),
        make("Sam Ray", "Engineer"),
        make("Jo Kim", "Founder"),
      ],
    };
  }
  if (kind === "cards-text-3") {
    const make = (title: string) =>
      card(
        4,
        [
          uidBlock({
            type: "heading",
            text: title,
            style: "font-size: 1.25rem",
          }),
          uidBlock({
            type: "text",
            text: "Explain the idea in a sentence or two — no image needed.",
          }),
        ],
        { align: "center" },
      );
    return {
      id: uid(),
      padY: 48,
      columns: [make("Simple"), make("Fast"), make("Reliable")],
    };
  }
  if (kind === "pricing-3") {
    const make = (plan: string, price: string, highlight?: boolean) =>
      card(
        4,
        [
          uidBlock({ type: "heading", text: plan, style: "font-size: 1.1rem" }),
          uidBlock({
            type: "heading",
            text: price,
            style: "font-size: 2.5rem",
          }),
          uidBlock({
            type: "text",
            text: "Everything you need to get started.\nUnlimited projects\nEmail support",
          }),
          uidBlock({
            type: "button",
            text: "Choose plan",
            href: "#",
            align: "center",
          }),
        ],
        {
          align: "center",
          ...(highlight ? { borderW: 2, borderColor: "#2563EB" } : {}),
        },
      );
    return {
      id: uid(),
      padY: 48,
      columns: [
        make("Starter", "$0"),
        make("Pro", "$19", true),
        make("Team", "$49"),
      ],
    };
  }
  if (kind === "testimonials-3") {
    const make = (name: string) =>
      card(4, [
        uidBlock({
          type: "text",
          text: "“This product completely changed how our team works. Setup took minutes.”",
          style: "font-style: italic",
        }),
        uidBlock({ type: "text", text: name, style: "font-weight: bold" }),
      ]);
    return {
      id: uid(),
      padY: 48,
      columns: [make("Alex Doe"), make("Sam Ray"), make("Jo Kim")],
    };
  }
  if (kind === "cta") {
    return {
      id: uid(),
      full: true,
      padY: 64,
      bg: "linear-gradient(135deg,#2563EB,#7c3aed)",
      columns: [
        col(12, [
          uidBlock({
            type: "heading",
            text: "Ready to get started?",
            align: "center",
            style: "color: #ffffff; font-size: 2.25rem",
          }),
          uidBlock({
            type: "text",
            text: "Join thousands already building with us.",
            align: "center",
            style: "color: #e0e7ff",
          }),
          uidBlock({
            type: "button",
            text: "Get started free",
            href: "#",
            align: "center",
          }),
        ]),
      ],
    };
  }
  if (kind === "image-banner") {
    return { id: uid(), full: true, columns: [col(12, [newBlock("image")])] };
  }
  // Animated banner — the same moving gradient as the Chasqr landing page.
  // Every text block is a normal block, so it stays fully editable.
  if (kind === "shader-banner") {
    const heading: Block = {
      id: uid(),
      type: "heading",
      text: "Your headline goes here",
      align: "center",
      style: "color: #ffffff; font-size: 3.25rem; line-height: 1.1",
    };
    const text: Block = {
      id: uid(),
      type: "text",
      text: "A short supporting line. Click any text here to edit it.",
      align: "center",
      style: "color: rgba(255,255,255,0.72); font-size: 1.05rem",
    };
    const btn: Block = {
      id: uid(),
      type: "button",
      text: "Get started",
      href: "#",
      align: "center",
      style: "background: #ffffff; color: #0f172a",
    };
    return {
      id: uid(),
      full: true,
      minH: 520,
      vAlign: "center",
      padY: 72,
      shader: "aurora",
      columns: [col(12, [heading, text, btn])],
    };
  }
  if (kind === "text-over-image") {
    const heading: Block = {
      id: uid(),
      type: "heading",
      text: "Big bold headline",
      align: "center",
      style: "color: #ffffff; font-size: 3rem",
    };
    const text: Block = {
      id: uid(),
      type: "text",
      text: "A short supporting line that sits over your banner image.",
      align: "center",
      style: "color: #f1f5f9",
    };
    const btn: Block = {
      id: uid(),
      type: "button",
      text: "Get started",
      href: "#",
      align: "center",
    };
    return {
      id: uid(),
      full: true,
      minH: 420,
      overlay: "linear-gradient(rgba(15,23,42,0.55), rgba(15,23,42,0.55))",
      bgImage: "",
      columns: [col(12, [heading, text, btn])],
    };
  }
  if (kind === "carousel") {
    return {
      id: uid(),
      full: true,
      columns: [col(12, [newBlock("carousel")])],
    };
  }
  // Product-card carousel: each column is a full card that slides.
  if (kind === "product-carousel") {
    const prod = (name: string, price: string, i: number): Column => card(4, [
      uidBlock({ type: "image", src: stock(i), alt: name, bleed: true, style: "height: 200px; object-fit: cover" }),
      uidBlock({ type: "tags", text: "Online Only\nInstant Savings", tagBg: "#2563eb", tagColor: "#ffffff" }),
      uidBlock({ type: "heading", text: name, style: "font-size: 1.05rem" }),
      uidBlock({ type: "rating", value: 4, text: "(11)" }),
      uidBlock({ type: "price", text: price, alt: "" }),
      uidBlock({ type: "button", text: "See Details", href: "#", align: "center", style: "width: 100%; text-align: center" }),
    ], { pad: 14, radius: 16, borderW: 1, borderColor: "#e5e7eb", shadow: false, align: "left" });
    return {
      id: uid(), padY: 40, slider: true, perView: 4,
      columns: [
        prod("Leather Power Recliner", "$499.99", 41),
        prod("Modular Sectional Sofa", "$1,499.99", 42),
        prod("Queen Firm Mattress", "$719.99", 43),
        prod("Standby Generator", "$4,999.99", 44),
        prod("Choice Strip Steak", "$149.99", 45),
      ],
    };
  }
  if (kind === "form-split-modern") {
    const leftCol = card(
      6,
      [
        uidBlock({
          type: "heading",
          text: "We'd love to help",
          style: "font-size: 2rem; color: #0f172a; font-weight: 700; margin-bottom: 4px",
        }),
        uidBlock({
          type: "text",
          text: "We're a full service agency with experts ready to help. We'll get in touch within 24 hours.",
          style: "color: #64748b; font-size: 0.95rem; margin-bottom: 16px",
        }),
        uidBlock({
          type: "form",
          text: "Send message",
          successMsg: "Thanks — we'll be in touch!",
          submitStyle: "dark",
          fields: [
            { id: uid(), type: "text", label: "First name", name: "first_name", placeholder: "First name", width: "half", required: true },
            { id: uid(), type: "text", label: "Last name", name: "last_name", placeholder: "Last name", width: "half", required: true },
            { id: uid(), type: "email", label: "Email", name: "email", placeholder: "you@company.com", width: "full", required: true },
            { id: uid(), type: "phone", label: "Phone number", name: "phone", placeholder: "+1 (555) 000-0000", width: "full" },
            { id: uid(), type: "textarea", label: "Message", name: "message", placeholder: "Leave us a message...", width: "full", required: true },
            { id: uid(), type: "checkbox", label: "You agree to our friendly privacy policy.", name: "privacy", width: "full", required: true },
          ],
        }),
      ],
      { bg: "#f8fafc", pad: 32, radius: 24, shadow: true }
    );
    const rightCol = card(
      6,
      [
        uidBlock({ type: "rating", value: 5, text: "★★★★★" }),
        uidBlock({
          type: "text",
          text: "“Untitled UI is the real deal. We've worked with a dozen agencies that simply don't deliver. Working with experienced and knowledgeable professionals at the helm is a breath of fresh air.”",
          style: "color: #ffffff; font-size: 1.05rem; font-style: italic; line-height: 1.6",
        }),
        uidBlock({
          type: "text",
          text: "— Ellie Simpson\nHead of Design, Sisyphus Labs",
          style: "color: #94a3b8; font-weight: 600; font-size: 0.85rem",
        }),
      ],
      {
        cardImg: stock(88),
        bg: "#0f172a",
        radius: 24,
        pad: 32,
        minH: 520,
        overlay: "linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.3) 60%, rgba(15,23,42,0.1) 100%)",
        align: "left",
      }
    );
    return { id: uid(), padY: 48, columns: [leftCol, rightCol] };
  }

  if (kind === "form-split-agency") {
    const leftCol = col(5, [
      uidBlock({
        type: "heading",
        text: "Let's Make\nProblems Nervous.",
        style: "font-size: 2.5rem; font-weight: 800; color: #0f172a; line-height: 1.15",
      }),
      uidBlock({
        type: "text",
        text: "Tell us what keeps you stuck, we'll turn it into your next competitive advantage.",
        style: "color: #64748b; font-size: 0.95rem; margin-top: 12px",
      }),
      uidBlock({
        type: "image",
        src: stock(92),
        alt: "Illustration",
        style: "height: 180px; object-fit: contain; margin-top: 20px; margin-bottom: 20px",
      }),
      uidBlock({
        type: "text",
        text: "Start a project: sales@orfactor.com    •    Partner with us: sales@orfactor.com    •    Work with us: career@orfactor.com",
        style: "font-size: 0.8rem; color: #475569; border-t: 1px solid #e2e8f0; padding-top: 16px",
      }),
    ]);
    const rightCol = card(
      7,
      [
        uidBlock({
          type: "form",
          text: "Let's Connect ↗",
          submitStyle: "accent",
          fields: [
            { id: uid(), type: "text", label: "Full name*", name: "full_name", placeholder: "Full name", width: "full", required: true },
            { id: uid(), type: "email", label: "Email*", name: "email", placeholder: "Email", width: "half", required: true },
            { id: uid(), type: "phone", label: "Phone number", name: "phone", placeholder: "Phone number", width: "half" },
            { id: uid(), type: "text", label: "Company name", name: "company", placeholder: "Company name", width: "half" },
            { id: uid(), type: "select", label: "Inquiry Reason*", name: "reason", placeholder: "Select reason", width: "half", required: true, options: ["Web Design", "Development", "Branding", "Consulting"] },
            { id: uid(), type: "pills", label: "Project budget*", name: "budget", width: "full", required: true, options: ["< $3K", "$3K-$5K", "$5K-$10K", "$10K-$20K", "> $20K"] },
            { id: uid(), type: "textarea", label: "Project details*", name: "details", placeholder: "Tell us about your project requirements...", width: "full", required: true },
          ],
        }),
      ],
      { bg: "#f8fafc", pad: 32, radius: 24, shadow: true, borderW: 1, borderColor: "#f1f5f9" }
    );
    return { id: uid(), padY: 48, columns: [leftCol, rightCol] };
  }

  if (kind === "form-survey-wizard") {
    const mainCol = card(
      8,
      [
        uidBlock({
          type: "tags",
          text: "1 Organization details   →   2 Solutions profile   →   3 Review details   →   4 ROI results",
          tagBg: "#f1f5f9",
          tagColor: "#334155",
        }),
        uidBlock({
          type: "heading",
          text: "Please enter following information",
          style: "font-size: 1.15rem; color: #1e293b; margin-top: 16px; margin-bottom: 12px",
        }),
        uidBlock({
          type: "form",
          text: "Continue →",
          submitStyle: "primary",
          fields: [
            { id: uid(), type: "select", label: "Closest match to your industry", name: "industry", width: "half", options: ["Education", "Technology", "Healthcare", "Finance", "Retail"] },
            { id: uid(), type: "select", label: "Total number of employees", name: "employees", width: "half", options: ["1 - 9", "10 - 49", "50 - 249", "250+"] },
            { id: uid(), type: "select", label: "Primary location where solution will be used", name: "location", width: "half", options: ["Asia", "North America", "Europe", "Global"] },
            { id: uid(), type: "select", label: "Preferred currency", name: "currency", width: "half", options: ["USD", "EUR", "GBP", "INR"] },
            { id: uid(), type: "pills", label: "Select your functional area", name: "functional_area", width: "full", options: ["Information Technology", "Operations", "HR", "Call / Contact Center", "Finance", "Other"] },
            { id: uid(), type: "pills", label: "What solution(s) would you like to include in your analysis?", name: "solutions", width: "full", options: ["Communication & Collaboration", "Contact Center", "Analytics"] },
          ],
        }),
      ],
      { bg: "#ffffff", pad: 32, radius: 24, shadow: true, borderW: 1, borderColor: "#e2e8f0" }
    );
    const sideCol = card(
      4,
      [
        uidBlock({
          type: "heading",
          text: "About Organization",
          style: "font-size: 1.5rem; color: #0f172a",
        }),
        uidBlock({
          type: "text",
          text: "Enter the basic details about the organization to proceed further.",
          style: "color: #64748b; font-size: 0.9rem; margin-top: 8px",
        }),
        uidBlock({
          type: "image",
          src: stock(77),
          alt: "Illustration",
          style: "height: 220px; object-fit: contain; margin-top: 24px",
        }),
      ],
      { bg: "#f8fafc", pad: 28, radius: 24, align: "left" }
    );
    return { id: uid(), padY: 48, columns: [mainCol, sideCol] };
  }

  // ── Navbar section presets ────────────────────────────────────────────────
  if (kind === "nav-simple" || kind === "nav-search") {
    const navBlock = uidBlock({
      type: "navbar",
      text: "Brand",
      style: "color: #0f172a",
      links: [
        { id: uid(), label: "Home", href: "#" },
        { id: uid(), label: "About", href: "#" },
        { id: uid(), label: "Contact", href: "#" },
        { id: uid(), label: "Locations", href: "#", children: [
          { id: uid(), label: "USA", href: "#" },
          { id: uid(), label: "Canada", href: "#" },
        ] },
      ],
    });
    if (kind === "nav-search") {
      return {
        id: uid(), full: true, vAlign: "center", padY: 14, padX: 28, bg: "#ffffff",
        columns: [col(8, [navBlock]), col(4, [uidBlock({ type: "search", text: "Search this page…" })])],
      };
    }
    return { id: uid(), full: true, vAlign: "center", padY: 14, padX: 28, bg: "#ffffff", columns: [col(12, [navBlock])] };
  }

  // ── Footer section presets ────────────────────────────────────────────────
  if (kind === "footer-columns" || kind === "footer-simple") {
    const flink = (label: string): Block =>
      uidBlock({ type: "text", text: label, href: "#", style: "color: #94a3b8; font-size: .9rem" });
    const fhead = (t: string): Block =>
      uidBlock({ type: "heading", text: t, style: "color: #ffffff; font-size: .8rem; letter-spacing: .5px; text-transform: uppercase; opacity: .7" });
    if (kind === "footer-simple") {
      return {
        id: uid(), full: true, bg: "#0f172a", padY: 28, padX: 24, vAlign: "center",
        columns: [
          col(6, [uidBlock({ type: "text", text: "© 2026 Your Company. All rights reserved.", style: "color: #94a3b8; font-size: .9rem" })]),
          col(6, [uidBlock({ type: "tags", text: "Twitter\nGitHub\nLinkedIn", tagBg: "#1e293b", tagColor: "#e2e8f0" })]),
        ],
      };
    }
    return {
      id: uid(), full: true, bg: "#0f172a", padY: 56, padX: 24,
      columns: [
        col(3, [
          uidBlock({ type: "heading", text: "Brand", style: "color: #ffffff; font-size: 1.3rem" }),
          uidBlock({ type: "text", text: "Building better websites, one block at a time.", style: "color: #94a3b8; font-size: .9rem" }),
          uidBlock({ type: "tags", text: "X\nIG\nIn", tagBg: "#1e293b", tagColor: "#e2e8f0" }),
        ]),
        col(3, [fhead("Product"), flink("Features"), flink("Pricing"), flink("Docs")]),
        col(3, [fhead("Company"), flink("About"), flink("Blog"), flink("Careers")]),
        col(3, [fhead("Legal"), flink("Privacy"), flink("Terms"), flink("Contact")]),
      ],
    };
  }

  // image-text: two columns side by side
  const img: Block = { id: uid(), type: "image", src: "", alt: "" };
  const h: Block = { id: uid(), type: "heading", text: "A feature or story" };
  const p: Block = {
    id: uid(),
    type: "text",
    text: "Describe it here with a sentence or two of supporting copy.",
  };
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
  fullscreen?: boolean; // render as a dedicated full-page builder (palette + canvas)
  onExit?: () => void; // back button in fullscreen mode
  previewUrl?: string; // public site URL for the "Preview" button (fullscreen)
  onSaved?: (site: any) => void;
}

export default function LayoutBuilder({
  siteId,
  page,
  initialLayout,
  initialLayoutStyle,
  initialNav,
  initialFooter,
  fullscreen,
  onExit,
  previewUrl,
  onSaved,
}: Props) {
  const [sections, setSections] = useState<Section[]>(
    initialLayout && initialLayout.length ? initialLayout : [],
  );
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>(
    initialLayoutStyle || {},
  );
  const [nav, setNav] = useState<NavConfig>(
    initialNav ? { ...emptyNav(), ...initialNav } : emptyNav(),
  );
  const [footer, setFooter] = useState<FooterConfig>(
    initialFooter ? { ...emptyFooter(), ...initialFooter } : emptyFooter(),
  );
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  const [settingsFor, setSettingsFor] = useState<string | null>(null); // section id whose style panel is open
  const [layoutSettingsOpen, setLayoutSettingsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [footerOpen, setFooterOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null); // where palette elements land
  const [focusId, setFocusId] = useState<string | null>(null); // just-added section/block: scroll to it + flash a ring

  // Scroll the newly added section/block into view, then drop the highlight.
  useEffect(() => {
    if (!focusId) return;
    // Small delay so the new node is laid out (framer-motion) before scrolling.
    const scroll = setTimeout(() => {
      document
        .querySelector(`[data-cq-id="${focusId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    const clear = setTimeout(() => setFocusId(null), 1600);
    return () => {
      clearTimeout(scroll);
      clearTimeout(clear);
    };
  }, [focusId]);

  const patchNav = (p: Partial<NavConfig>) => {
    setNav((n) => ({ ...n, ...p }));
    setDirty(true);
  };
  const patchFooter = (p: Partial<FooterConfig>) => {
    setFooter((f) => ({ ...f, ...p }));
    setDirty(true);
  };

  // Load the Google Fonts in use so the canvas previews them accurately.
  useEffect(() => {
    const used = Array.from(
      new Set(
        [layoutStyle.font, ...sections.map((s) => s.font)].filter(
          Boolean,
        ) as string[],
      ),
    );
    if (!used.length) return;
    const href = `https://fonts.googleapis.com/css2?${used
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700`)
      .join("&")}&display=swap`;
    let link = document.getElementById(
      "chasqr-builder-fonts",
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = "chasqr-builder-fonts";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }, [layoutStyle.font, sections]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const update = (next: Section[]) => {
    setSections(next);
    setDirty(true);
  };

  // ── Section / column / block mutations ────────────────────────────────────
  const addSection = () => {
    const s = newSection(1);
    setActiveColumnId(s.columns[0].id);
    setFocusId(s.id);
    update([...sections, s]);
  };
  const removeSection = (sid: string) =>
    update(sections.filter((s) => s.id !== sid));
  const patchSection = (sid: string, patch: Partial<Section>) =>
    update(sections.map((s) => (s.id === sid ? { ...s, ...patch } : s)));

  // ── Deep-clone with fresh ids (so duplicates don't share keys) ─────────────
  const cloneBlock = (b: Block): Block => ({
    ...b,
    id: uid(),
    ...(b.tabs ? { tabs: b.tabs.map((t) => ({ ...t, id: uid() })) } : {}),
    ...(b.links ? { links: b.links.map((l) => ({ ...l, id: uid(), children: l.children?.map((c) => ({ ...c, id: uid() })) })) } : {}),
    ...(b.fields ? { fields: b.fields.map((f) => ({ ...f, id: uid() })) } : {}),
    ...(b.images ? { images: [...b.images] } : {}),
  });
  const cloneColumn = (c: Column): Column => ({ ...c, id: uid(), blocks: c.blocks.map(cloneBlock) });
  const cloneSection = (s: Section): Section => ({ ...s, id: uid(), columns: s.columns.map(cloneColumn) });

  const duplicateSection = (sid: string) => {
    const idx = sections.findIndex((s) => s.id === sid);
    if (idx < 0) return;
    const copy = cloneSection(sections[idx]);
    const next = [...sections];
    next.splice(idx + 1, 0, copy);
    setFocusId(copy.id);
    update(next);
  };
  // Duplicate a column (card) beside itself in the same section. Its span is kept,
  // so two full-width columns stack and half-width ones sit side by side — the
  // user controls the arrangement with the width dropdown.
  const duplicateColumn = (sid: string, cid: string) => {
    update(sections.map((s) => {
      if (s.id !== sid || s.columns.length >= 12) return s;
      const idx = s.columns.findIndex((c) => c.id === cid);
      if (idx < 0) return s;
      const copy = cloneColumn(s.columns[idx]);
      const columns = [...s.columns];
      columns.splice(idx + 1, 0, copy);
      setActiveColumnId(copy.id);
      return { ...s, columns };
    }));
  };
  const patchLayoutStyle = (p: Partial<LayoutStyle>) => {
    setLayoutStyle((s) => ({ ...s, ...p }));
    setDirty(true);
  };
  const setLayoutBg = (bg: string | undefined) => patchLayoutStyle({ bg });
  const moveSection = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= sections.length) return;
    update(arrayMove(sections, idx, j));
  };
  const addColumn = (sid: string) =>
    update(
      sections.map((s) => {
        if (s.id !== sid || s.columns.length >= 12) return s;
        const spans = evenSpans(s.columns.length + 1);
        const columns = [
          ...s.columns,
          { id: uid(), span: 0, blocks: [] as Block[] },
        ].map((c, i) => ({ ...c, span: spans[i] }));
        return { ...s, columns };
      }),
    );
  const removeColumn = (sid: string, cid: string) =>
    update(
      sections.map((s) => {
        if (s.id !== sid || s.columns.length <= 1) return s;
        const remaining = s.columns.filter((c) => c.id !== cid);
        const spans = evenSpans(remaining.length);
        return {
          ...s,
          columns: remaining.map((c, i) => ({ ...c, span: spans[i] })),
        };
      }),
    );
  const setColumnSpans = (sid: string, i: number, spanI: number) =>
    update(
      sections.map((s) => {
        if (s.id !== sid) return s;
        const columns = s.columns.map((c) => ({ ...c }));
        const pair = columns[i].span + columns[i + 1].span;
        const a = Math.min(pair - 1, Math.max(1, spanI));
        columns[i].span = a;
        columns[i + 1].span = pair - a;
        return { ...s, columns };
      }),
    );
  const patchColumn = (sid: string, cid: string, patch: Partial<Column>) =>
    update(
      sections.map((s) =>
        s.id !== sid
          ? s
          : {
              ...s,
              columns: s.columns.map((c) =>
                c.id !== cid ? c : { ...c, ...patch },
              ),
            },
      ),
    );
  const addBlock = (sid: string, cid: string, type: BlockType) =>
    update(
      sections.map((s) =>
        s.id !== sid
          ? s
          : {
              ...s,
              columns: s.columns.map((c) =>
                c.id !== cid
                  ? c
                  : { ...c, blocks: [...c.blocks, newBlock(type)] },
              ),
            },
      ),
    );
  const patchBlock = (bid: string, patch: Partial<Block>) =>
    update(
      sections.map((s) => ({
        ...s,
        columns: s.columns.map((c) => ({
          ...c,
          blocks: c.blocks.map((b) => (b.id === bid ? { ...b, ...patch } : b)),
        })),
      })),
    );
  const removeBlock = (bid: string) =>
    update(
      sections.map((s) => ({
        ...s,
        columns: s.columns.map((c) => ({
          ...c,
          blocks: c.blocks.filter((b) => b.id !== bid),
        })),
      })),
    );

  // ── Left-palette actions (fullscreen builder) ─────────────────────────────
  // Add an element to the active column; fall back to the last column, and
  // create a fresh section if the canvas is still empty.
  const addElementToActive = (type: BlockType, patch?: Partial<Block>) => {
    const mk = () => ({ ...newBlock(type), ...patch });
    let sid: string | undefined;
    let cid: string | undefined;
    if (activeColumnId) {
      for (const s of sections)
        for (const c of s.columns)
          if (c.id === activeColumnId) {
            sid = s.id;
            cid = c.id;
          }
    }
    if (!sid && sections.length) {
      const s = sections[sections.length - 1];
      sid = s.id;
      cid = s.columns[s.columns.length - 1].id;
    }
    if (sid && cid) {
      const b = mk();
      update(
        sections.map((s) =>
          s.id !== sid
            ? s
            : {
                ...s,
                columns: s.columns.map((c) =>
                  c.id !== cid ? c : { ...c, blocks: [...c.blocks, b] },
                ),
              },
        ),
      );
      setActiveColumnId(cid);
      setFocusId(b.id);
      return;
    }
    // empty canvas → make a section and drop the block in
    const sec = newSection(1);
    sec.columns[0].blocks = [mk()];
    setActiveColumnId(sec.columns[0].id);
    setFocusId(sec.id);
    update([...sections, sec]);
  };
  const addPreset = (kind: PresetKind) => {
    const sec = newPreset(kind);
    setActiveColumnId(sec.columns[0].id);
    setSettingsFor(kind === "text-over-image" ? sec.id : null); // open style panel so the user can add the hero image
    setFocusId(sec.id);
    update([...sections, sec]);
  };
  // Apply a modern-effect preset to the active (or last) section.
  const applyEffect = (patch: Partial<Section>) => {
    const target =
      (activeColumnId &&
        sections.find((s) => s.columns.some((c) => c.id === activeColumnId))) ||
      sections[sections.length - 1];
    if (!target) {
      toast.info("Add a section first, then apply an effect.");
      return;
    }
    patchSection(target.id, patch);
    setSettingsFor(target.id);
  };

  // ── Cross-column drag ─────────────────────────────────────────────────────
  const findBlock = (id: string) => {
    for (const s of sections)
      for (const c of s.columns) {
        const b = c.blocks.find((x) => x.id === id);
        if (b) return b;
      }
    return null;
  };
  const colOfBlock = (id: string) => {
    for (const s of sections)
      for (const c of s.columns)
        if (c.blocks.some((b) => b.id === id)) return c.id;
    return null;
  };
  const onDragStart = (e: DragStartEvent) =>
    setActiveBlock(findBlock(String(e.active.id)));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveBlock(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const fromCol = colOfBlock(activeId);
    // over target is either a block id (drop before it) or a column id (empty col)
    const toCol =
      colOfBlock(overId) ||
      (overId.startsWith("col:") ? overId.slice(4) : null);
    if (!fromCol || !toCol) return;

    const next = sections.map((s) => ({
      ...s,
      columns: s.columns.map((c) => ({ ...c, blocks: [...c.blocks] })),
    }));
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
      const res = await updateLayoutAPI(
        siteId,
        page,
        sections,
        layoutStyle,
        nav,
        footer,
      );
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
      <button
        onClick={() => setDevice("desktop")}
        title="Desktop"
        className={`p-2 ${device === "desktop" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}
      >
        <Monitor size={15} />
      </button>
      <button
        onClick={() => setDevice("mobile")}
        title="Mobile"
        className={`p-2 ${device === "mobile" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}
      >
        <Smartphone size={15} />
      </button>
    </div>
  );
  const toggleBtn = (
    active: boolean,
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
  ) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${active ? "border-primary text-primary bg-primary-light" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
    >
      {icon} {label}
    </button>
  );
  const bgBtn = toggleBtn(
    layoutSettingsOpen || !!layoutStyle.bg,
    <Palette size={14} />,
    "Background",
    () => setLayoutSettingsOpen((o) => !o),
  );
  const navBtn = toggleBtn(
    navOpen || nav.enabled,
    <PanelTop size={14} />,
    "Navbar",
    () => {
      setNavOpen((o) => !o);
      setFooterOpen(false);
    },
  );
  const footerBtn = toggleBtn(
    footerOpen || footer.enabled,
    <PanelBottom size={14} />,
    "Footer",
    () => {
      setFooterOpen((o) => !o);
      setNavOpen(false);
    },
  );
  const saveBtn = (
    <button
      onClick={handleSave}
      disabled={saving || !dirty}
      className="flex items-center gap-2 bg-primary text-white font-medium px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
    >
      {saving ? (
        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
      ) : (
        <Save size={15} />
      )}
      {saving ? "Saving..." : "Save & Deploy"}
    </button>
  );

  const panels = (
    <>
      {layoutSettingsOpen && (
        <div className="mb-5 p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-slate-700">
            Layout background
          </span>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <span
              className="w-6 h-6 rounded border border-slate-300"
              style={{ background: layoutStyle.bg || "#ffffff" }}
            />
            <input
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(layoutStyle.bg || "")
                  ? layoutStyle.bg
                  : "#f8fafc"
              }
              onChange={(e) => setLayoutBg(e.target.value)}
              className="w-0 h-0 opacity-0 absolute"
            />
            <span className="underline">Pick color</span>
          </label>
          {[
            "linear-gradient(135deg,#2563EB,#38bdf8)",
            "linear-gradient(135deg,#7c3aed,#ec4899)",
            "linear-gradient(135deg,#0f172a,#334155)",
          ].map((g) => (
            <button
              key={g}
              onClick={() => setLayoutBg(g)}
              title="Gradient"
              className="w-8 h-8 rounded-md border border-slate-300"
              style={{ background: g }}
            />
          ))}
          {layoutStyle.bg && (
            <button
              onClick={() => setLayoutBg(undefined)}
              className="text-xs text-slate-500 hover:text-red-500"
            >
              Clear
            </button>
          )}
          <span className="w-px h-6 bg-slate-200 mx-1" />
          <FontSelect
            label="Page font"
            value={layoutStyle.font}
            onChange={(font) => patchLayoutStyle({ font })}
          />
          <span className="text-[11px] text-slate-400">
            Applies to the whole page — sections can override it.
          </span>
          <span className="w-px h-6 bg-slate-200 mx-1" />
          <button
            onClick={() => patchLayoutStyle({ reveal: !layoutStyle.reveal })}
            title="Fade the page in on load and reveal each section as it scrolls into view"
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${layoutStyle.reveal ? "border-primary text-primary bg-primary-light" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            <Wand2 size={14} /> Scroll animations
          </button>
          <span className="w-full basis-full h-0" />
          <span className="text-xs font-medium text-slate-500">Page padding</span>
          <label className="flex items-center gap-2 text-slate-600 text-xs">
            Sides
            <input type="range" min={0} max={120} step={4} value={layoutStyle.padX ?? 0} onChange={(e) => patchLayoutStyle({ padX: Number(e.target.value) || undefined })} className="accent-primary w-28" />
            <span className="w-9 text-right font-mono text-slate-500">{layoutStyle.padX ? `${layoutStyle.padX}px` : "0"}</span>
          </label>
          <label className="flex items-center gap-2 text-slate-600 text-xs">
            Top &amp; bottom
            <input type="range" min={0} max={160} step={4} value={layoutStyle.padY ?? 0} onChange={(e) => patchLayoutStyle({ padY: Number(e.target.value) || undefined })} className="accent-primary w-28" />
            <span className="w-9 text-right font-mono text-slate-500">{layoutStyle.padY ? `${layoutStyle.padY}px` : "0"}</span>
          </label>
          <span className="text-[11px] text-slate-400 basis-full">Sections are edge-to-edge by default — add page padding here, or padding per-section / per-card.</span>
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
      <p className="text-slate-400 text-xs mt-1">
        {fullscreen
          ? "Pick elements or a banner from the left to start building."
          : "Add a section, split it into columns, and drop text / images / buttons in."}
      </p>
    </div>
  );

  const canvas = (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div
        className={`mx-auto transition-all ${device === "mobile" ? "max-w-[420px]" : "max-w-full"} ${layoutStyle.bg ? "p-4 rounded-2xl" : ""}`}
        style={{
          ...(layoutStyle.bg ? { background: layoutStyle.bg } : {}),
          ...(layoutStyle.font ? { fontFamily: layoutStyle.font } : {}),
        }}
      >
        {nav.enabled && (
          <NavPreview
            nav={nav}
            onEdit={() => {
              setNavOpen(true);
              setFooterOpen(false);
            }}
          />
        )}
        {sections.map((section, si) => (
          <motion.div
            layout
            key={section.id}
            data-cq-id={section.id}
            className={`relative mb-4 border rounded-2xl p-4 bg-white/95 backdrop-blur-sm transition-shadow ${focusId === section.id ? "border-primary ring-2 ring-primary/40" : "border-slate-200"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                Section {si + 1}
                {section.full && (
                  <span className="flex items-center gap-1 normal-case font-medium text-[10px] text-primary bg-primary-light px-1.5 py-0.5 rounded-full">
                    <MoveHorizontal size={10} /> Full width
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveSection(si, -1)}
                  disabled={si === 0}
                  className="text-xs text-slate-400 hover:text-primary disabled:opacity-30 px-1.5"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveSection(si, 1)}
                  disabled={si === sections.length - 1}
                  className="text-xs text-slate-400 hover:text-primary disabled:opacity-30 px-1.5"
                >
                  ↓
                </button>
                <button
                  onClick={() =>
                    setSettingsFor((v) =>
                      v === section.id ? null : section.id,
                    )
                  }
                  title="Section style"
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border ml-1 transition-colors ${
                    settingsFor === section.id || section.bg || section.glass
                      ? "border-primary text-primary bg-primary-light"
                      : "border-slate-200 text-slate-500 hover:text-primary"
                  }`}
                >
                  <Paintbrush size={12} /> Style
                </button>
                {section.columns.length < 12 && (
                  <button
                    onClick={() => addColumn(section.id)}
                    title="Add column"
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary border border-slate-200 px-2 py-1 rounded-md"
                  >
                    <Columns size={12} /> Column
                  </button>
                )}
                <button
                  onClick={() => duplicateSection(section.id)}
                  title="Duplicate section"
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary border border-slate-200 px-2 py-1 rounded-md"
                >
                  <Copy size={12} /> Duplicate
                </button>
                <button
                  onClick={() => removeSection(section.id)}
                  title="Delete section"
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {settingsFor === section.id && !fullscreen && (
              <SectionSettings
                section={section}
                onPatch={(patch) => patchSection(section.id, patch)}
                siteId={siteId}
              />
            )}

            <div style={sectionPreviewStyle(section)}>
              {section.shader && (
                <ShaderCanvas
                  preset={section.shader}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              )}
              {/* The canvas is absolutely positioned, so it paints above any
                  static sibling. The row has to be lifted out of its way or
                  the whole section becomes unclickable behind the shader. */}
              <div className={section.shader ? "relative z-10" : undefined}>
              <SectionRow
                section={section}
                device={device}
                activeColumnId={activeColumnId}
                onSelectColumn={setActiveColumnId}
                onPatchColumn={(cid, patch) =>
                  patchColumn(section.id, cid, patch)
                }
                onDuplicateColumn={(cid) => duplicateColumn(section.id, cid)}
                onResize={(i, spanI) => setColumnSpans(section.id, i, spanI)}
                onAddBlock={(cid, t) => addBlock(section.id, cid, t)}
                onRemoveColumn={(cid) => removeColumn(section.id, cid)}
                canRemoveColumn={section.columns.length > 1}
                onPatchBlock={patchBlock}
                onRemoveBlock={removeBlock}
                siteId={siteId}
              />
              </div>
            </div>
          </motion.div>
        ))}
        {footer.enabled && (
          <FooterPreview
            footer={footer}
            onEdit={() => {
              setFooterOpen(true);
              setNavOpen(false);
            }}
          />
        )}
        {sections.length > 0 && (
          <button
            onClick={addSection}
            className="w-full flex items-center justify-center gap-1.5 py-3 mt-1 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary hover:text-primary text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Add Section
          </button>
        )}
      </div>

      <DragOverlay>
        {activeBlock ? (
          <div className="px-3 py-2 bg-white border border-primary rounded-lg shadow-lg text-sm text-slate-700 opacity-90">
            {
              {
                heading: "Heading",
                text: "Text",
                image: "Image",
                button: "Button",
                form: "Form",
                embed: "Embed",
                carousel: "Carousel",
                tags: "Tags",
                tabs: "Tabs",
                navbar: "Navbar",
                search: "Search",
                rating: "Rating",
                price: "Price",
              }[activeBlock.type]
            }
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );

  /**
   * Flattened section → column → block tree for the Layers panel.
   *
   * Built here rather than in the panel because this is where the sections and
   * the selection live. Columns are the only selectable rows: they are what the
   * palette actually inserts into, so clicking one both highlights it on the
   * canvas and retargets the next insert.
   */
  const layers: LayerNode[] = sections.flatMap((sec, si) => {
    const rows: LayerNode[] = [
      {
        id: sec.id,
        label: `Section ${si + 1}${sec.full ? " — full width" : ""}`,
        tag: "section",
        depth: 0,
      },
    ];
    (sec.columns || []).forEach((col, ci) => {
      rows.push({
        id: col.id,
        label: `Column ${ci + 1} · ${col.span}/12`,
        tag: "col",
        depth: 1,
        selectable: true,
        active: activeColumnId === col.id,
        onSelect: () => setActiveColumnId(col.id),
      });
      (col.blocks || []).forEach((b) =>
        rows.push({
          id: b.id,
          label: b.text?.trim() ? b.text.trim().slice(0, 28) : b.type,
          tag: b.type,
          depth: 2,
        }),
      );
    });
    return rows;
  });

  // Where the next inserted element lands, in the same words the canvas uses.
  const insertingInto = (() => {
    if (!sections.length) return "a new section";
    let target: string | null = null;
    sections.forEach((sec, si) =>
      (sec.columns || []).forEach((col, ci) => {
        if (col.id === activeColumnId) target = `Section ${si + 1} › Column ${ci + 1}`;
      }),
    );
    return target
      ? `${target} · at the end`
      : `Section ${sections.length} · last column`;
  })();

  // The rail follows the Style button, falling back to whichever section owns
  // the selected column so it is rarely empty while you are working.
  const inspectorIndex = (() => {
    const byStyle = sections.findIndex((sec) => sec.id === settingsFor);
    if (byStyle >= 0) return byStyle;
    return sections.findIndex((sec) =>
      (sec.columns || []).some((c) => c.id === activeColumnId),
    );
  })();
  const inspectorSection = inspectorIndex >= 0 ? sections[inspectorIndex] : null;

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-40 bg-slate-100 flex flex-col">
        <div className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center px-4 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {onExit && (
              <button
                onClick={onExit}
                className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary px-2 py-2 rounded-lg hover:bg-slate-50"
              >
                <ArrowLeft size={16} /> Editor
              </button>
            )}
            <span className="w-px h-6 bg-slate-200 mx-1" />
            {/* Says what you are editing. Without it the builder is a bare
                canvas with no indication of which page it belongs to. */}
            <div className="min-w-0 leading-tight">
              <p className="text-[15px] font-semibold text-slate-900">Layout</p>
              <p className="truncate text-[11.5px] text-slate-400">
                {page} · {sections.length} section{sections.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="flex-1" />
          {deviceToggle}
          <div className="flex items-center gap-2">
            {bgBtn}
            {navBtn}
            {footerBtn}
          </div>
          <div className="flex-1" />

          <div className="flex items-center gap-2 shrink-0">
            {/* Unsaved work is the one thing worth interrupting for, so it sits
                next to the button that resolves it. */}
            <span
              className={`hidden rounded-lg px-2.5 py-1.5 text-[12px] font-semibold sm:block ${
                dirty ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
              }`}
            >
              {dirty ? "Unsaved" : "Saved"}
            </span>
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ExternalLink size={15} /> Preview
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
            onGlassNav={() => {
              patchNav({ enabled: true, glass: true });
              setNavOpen(true);
            }}
            layers={layers}
            insertingInto={insertingInto}
          />
          {/* Editor on top, live result underneath, divider draggable between
              them. Both are needed at once — one to change things, one to see
              what changed — and how much of each depends on the task. */}
          <div className="flex min-w-0 flex-1 flex-col">
            <SplitPane
              bottomLabel={
                <>
                  Live preview
                  <span className="ml-1.5 font-normal normal-case text-slate-400">
                    · {device === "mobile" ? "mobile 390px" : "desktop"}
                  </span>
                </>
              }
              top={
                <div className="p-6">
                  <div className="mx-auto max-w-[1040px]">
                    {panels}
                    {emptyState}
                    {canvas}
                  </div>
                </div>
              }
              bottom={
                <LivePreview
                  sections={sections}
                  layoutStyle={layoutStyle}
                  nav={nav}
                  footer={footer}
                  device={device}
                />
              }
            />
          </div>

          {/* Inspector. The same SectionSettings that used to open inline under
              a section — moving it here is the point: inline, it shoved the
              canvas down every time you opened it, so you lost sight of the
              thing you were styling. */}
          <aside className="hidden w-[300px] shrink-0 flex-col border-l border-slate-200 bg-white xl:flex">
            {inspectorSection ? (
              <>
                <div className="shrink-0 border-b border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-1 text-[11.5px] text-slate-400">
                    <span>Page</span>
                    <ChevronRight size={11} />
                    <span className="font-medium text-slate-700">
                      Section {inspectorIndex + 1}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] font-semibold text-slate-900">
                    {inspectorSection.full ? "Full width" : "Contained"} ·{" "}
                    {inspectorSection.columns.length} column
                    {inspectorSection.columns.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <SectionSettings
                    section={inspectorSection}
                    onPatch={(patch) => patchSection(inspectorSection.id, patch)}
                    siteId={siteId}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-center">
                <p className="text-[12.5px] leading-relaxed text-slate-400">
                  Select a section on the canvas — or press its Style button — to
                  edit size, background and spacing here.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={addSection}
            className="flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={14} /> Add Section
          </button>
          {deviceToggle}
          {bgBtn}
          {navBtn}
          {footerBtn}
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
function SectionSettings({
  section,
  onPatch,
  siteId,
}: {
  section: Section;
  onPatch: (p: Partial<Section>) => void;
  siteId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadAssetAPI(siteId, fd);
      onPatch({ bgImage: res.data.data.path });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  const pill = (
    active: boolean,
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
  ) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${active ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:text-primary"}`}
    >
      {icon} {label}
    </button>
  );
  const groupLabel = (t: string) => (
    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
      {t}
    </p>
  );
  const slider = (
    label: string,
    value: number | undefined,
    max: number,
    key: keyof Section,
    step = 4,
  ) => (
    <label className="flex items-center gap-2 text-slate-600 text-xs">
      {label}
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value ?? 0}
        onChange={(e) =>
          onPatch({
            [key]: Number(e.target.value) || undefined,
          } as Partial<Section>)
        }
        className="accent-primary w-20"
      />
      <span className="w-9 text-right font-mono text-slate-500">
        {value ? `${value}px` : "0"}
      </span>
    </label>
  );
  return (
    <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200 text-sm">
      {/* Size & layout */}
      <div className="p-3">
        {groupLabel("Size & layout")}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <WidthControl
            full={section.full}
            widthPct={section.widthPct}
            onChange={onPatch}
          />
          <label className="flex items-center gap-2 text-slate-600 text-xs">
            Height
            <input
              type="range"
              min={0}
              max={700}
              step={20}
              value={section.minH ?? 0}
              onChange={(e) =>
                onPatch({ minH: Number(e.target.value) || undefined })
              }
              className="accent-primary w-28"
            />
            <span className="w-10 text-right font-mono text-slate-500">
              {section.minH ? `${section.minH}px` : "auto"}
            </span>
          </label>
          <label className="flex items-center gap-2 text-slate-600 text-xs">
            Rounded
            <input
              type="range"
              min={0}
              max={40}
              value={section.radius || 0}
              onChange={(e) => onPatch({ radius: Number(e.target.value) })}
              className="accent-primary w-20"
            />
          </label>
          <label className="flex items-center gap-2 text-slate-600 text-xs">
            <Wand2 size={12} /> Reveal
            <select
              value={section.anim || ""}
              onChange={(e) => onPatch({ anim: (e.target.value || undefined) as Anim | undefined })}
              className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">None</option>
              <option value="fade">Fade in</option>
              <option value="up">Slide up</option>
              <option value="down">Slide down</option>
              <option value="left">Slide left</option>
              <option value="right">Slide right</option>
              <option value="zoom">Zoom in</option>
            </select>
          </label>
          <div className="flex items-center gap-2 text-slate-600 text-xs">
            <span>Align items</span>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              {([["top", "Top"], ["center", "Middle"], ["bottom", "Bottom"], ["stretch", "Stretch"]] as const).map(([v, label]) => {
                const active = (section.vAlign || "top") === v;
                return (
                  <button key={v} onClick={() => onPatch({ vAlign: v === "top" ? undefined : v })}
                    className={`px-2 py-1 text-[11px] ${active ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => onPatch({ scrollX: !section.scrollX })}
            title="When the columns don't fit, scroll the row horizontally instead of squeezing them"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${section.scrollX ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:text-primary"}`}
          >
            <MoveHorizontal size={12} /> Horizontal scroll
          </button>
          <button
            onClick={() => onPatch({ slider: !section.slider })}
            title="Turn the columns into an infinite card carousel (slides several cards at a time)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${section.slider ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:text-primary"}`}
          >
            <GalleryHorizontal size={12} /> Card slider
          </button>
          {section.slider && (
            <label className="flex items-center gap-2 text-slate-600 text-xs">
              Per view
              <select
                value={section.perView || 3}
                onChange={(e) => onPatch({ perView: Number(e.target.value) })}
                className="text-xs bg-white border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {[2, 3, 4, 5, 6].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          )}
        </div>
      </div>

      {/* Spacing & border */}
      <div className="p-3">
        {groupLabel("Spacing & border")}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {slider("Margin top", section.mt, 200, "mt")}
          {slider("Margin bottom", section.mb, 200, "mb")}
          {slider("Margin left", section.ml, 300, "ml")}
          {slider("Margin right", section.mr, 300, "mr")}
          {slider("Padding Y", section.padY, 160, "padY")}
          {slider("Padding X", section.padX, 200, "padX")}
          <label className="flex items-center gap-2 text-slate-600 text-xs">
            Border
            <input
              type="range"
              min={0}
              max={12}
              value={section.borderW ?? 0}
              onChange={(e) =>
                onPatch({ borderW: Number(e.target.value) || undefined })
              }
              className="accent-primary w-16"
            />
            <span
              className="relative w-6 h-6 rounded border border-slate-300 inline-block cursor-pointer"
              style={{ background: section.borderColor || "#e5e7eb" }}
            >
              <input
                type="color"
                value={
                  /^#[0-9a-fA-F]{6}$/.test(section.borderColor || "")
                    ? section.borderColor
                    : "#e5e7eb"
                }
                onChange={(e) => onPatch({ borderColor: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </span>
          </label>
        </div>
      </div>

      {/* Typography */}
      <div className="p-3">
        {groupLabel("Typography")}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <FontSelect
            label="Font"
            value={section.font}
            onChange={(font) => onPatch({ font })}
          />
          <span className="text-[11px] text-slate-400">
            Overrides the page font for this section only.
          </span>
        </div>
      </div>

      {/* Background & effects */}
      <div className="p-3">
        {groupLabel("Background & effects")}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-slate-600 text-xs">Color</span>
            <span
              className="relative w-6 h-6 rounded border border-slate-300 inline-block"
              style={{
                background: section.glass
                  ? "rgba(255,255,255,0.4)"
                  : section.bg || "#ffffff",
              }}
            >
              <input
                type="color"
                disabled={section.glass}
                value={
                  /^#[0-9a-fA-F]{6}$/.test(section.bg || "")
                    ? section.bg
                    : "#f8fafc"
                }
                onChange={(e) => onPatch({ bg: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </span>
            {section.bg && !section.glass && (
              <button
                onClick={() => onPatch({ bg: undefined })}
                className="text-xs text-slate-400 hover:text-red-500"
              >
                clear
              </button>
            )}
          </label>
          {pill(!!section.glass, <Sparkles size={12} />, "Glass / blur", () =>
            onPatch({ glass: !section.glass }),
          )}
          {pill(!!section.shadow, <Layers size={12} />, "Shadow", () =>
            onPatch({ shadow: !section.shadow }),
          )}
        </div>
      </div>

      {/* Banner image */}
      <div className="p-3">
        {groupLabel("Banner image (optional)")}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
            <input
              type="text"
              value={section.bgImage || ""}
              onChange={(e) => onPatch({ bgImage: e.target.value })}
              placeholder="Image URL, or upload →"
              className="flex-1 min-w-0 text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Upload image"
              className="shrink-0 border border-slate-200 text-slate-500 hover:text-primary px-2 py-1.5 rounded-md"
            >
              {uploading ? (
                <span className="animate-spin inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <Upload size={12} />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={uploadBg}
            />
            {section.bgImage && (
              <button
                onClick={() => onPatch({ bgImage: undefined })}
                className="text-xs text-slate-400 hover:text-red-500 shrink-0"
              >
                clear
              </button>
            )}
          </div>
          {section.bgImage && (
            <label className="flex items-center gap-1.5 text-slate-600 text-xs cursor-pointer">
              Overlay
              <span
                className="relative w-6 h-6 rounded border border-slate-300 inline-block"
                style={{ background: section.overlay || "rgba(15,23,42,0.55)" }}
              >
                <input
                  type="color"
                  value={
                    /^#[0-9a-fA-F]{6}$/.test(section.overlay || "")
                      ? section.overlay
                      : "#0f172a"
                  }
                  onChange={(e) => onPatch({ overlay: e.target.value + "8c" })}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </span>
            </label>
          )}
          {!section.bgImage && (
            <span className="text-[11px] text-slate-400">
              Add an image to turn this section into a hero / banner (set Height
              above).
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Section row: columns + snap-resize dividers ──────────────────────────────
function SectionRow({
  section,
  device,
  activeColumnId,
  onSelectColumn,
  onPatchColumn,
  onDuplicateColumn,
  onResize,
  onAddBlock,
  onRemoveColumn,
  canRemoveColumn,
  onPatchBlock,
  onRemoveBlock,
  siteId,
}: {
  section: Section;
  device: "desktop" | "mobile";
  activeColumnId: string | null;
  onSelectColumn: (cid: string) => void;
  onPatchColumn: (cid: string, patch: Partial<Column>) => void;
  onDuplicateColumn: (cid: string) => void;
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
    const before = section.columns
      .slice(0, i)
      .reduce((sum, c) => sum + c.span, 0);
    const move = (ev: PointerEvent) => {
      const boundary = Math.round((ev.clientX - rect.left) / unit); // grid units from row start
      onResize(i, boundary - before);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // On mobile preview, columns stack (span ignored) to mirror the live output.
  const gridStyle =
    device === "mobile"
      ? { gridTemplateColumns: "1fr" }
      : { gridTemplateColumns: "repeat(12, 1fr)" };

  const valignMap: Record<string, string> = { top: "start", center: "center", bottom: "end", stretch: "stretch" };
  // Editing comfort: once a section has several columns the grid squeezes each one
  // too thin to edit, so the builder switches that section to a horizontally
  // scrolling row (each column gets a comfortable min width). This is builder-only
  // and never changes the live layout. The live scroll is opt-in via scrollX.
  const horiz = device === "desktop" && (!!section.scrollX || !!section.slider || section.columns.length > 1);
  const rowStyle: React.CSSProperties = horiz
    ? { display: "flex", flexWrap: "nowrap", overflowX: "auto", gap: 12, paddingBottom: 6, alignItems: valignMap[section.vAlign || "top"] }
    : { ...gridStyle, alignItems: valignMap[section.vAlign || "top"] };
  return (
    <div
      ref={rowRef}
      className={horiz ? "gap-3 relative" : "grid gap-3 relative"}
      style={rowStyle}
    >
      {section.columns.map((col, i) => (
        <div
          key={col.id}
          style={
            horiz
              ? { flex: "0 0 auto", width: `calc(${col.span} / 12 * 100%)`, minWidth: 300 }
              : device === "mobile" ? undefined : { gridColumn: `span ${col.span}` }
          }
          className="relative min-w-0"
        >
          <ColumnCell
            col={col}
            device={device}
            active={activeColumnId === col.id}
            onSelect={() => onSelectColumn(col.id)}
            onPatchColumn={(patch) => onPatchColumn(col.id, patch)}
            onDuplicate={() => onDuplicateColumn(col.id)}
            onAddBlock={(t) => onAddBlock(col.id, t)}
            onRemoveColumn={
              canRemoveColumn ? () => onRemoveColumn(col.id) : undefined
            }
            onPatchBlock={onPatchBlock}
            onRemoveBlock={onRemoveBlock}
            siteId={siteId}
          />
          {/* Resize divider (between this col and the next) — grid mode only */}
          {!horiz && device === "desktop" && i < section.columns.length - 1 && (
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
  col,
  device,
  active,
  onSelect,
  onPatchColumn,
  onDuplicate,
  onAddBlock,
  onRemoveColumn,
  onPatchBlock,
  onRemoveBlock,
  siteId,
}: {
  col: Column;
  device: "desktop" | "mobile";
  active: boolean;
  onSelect: () => void;
  onPatchColumn: (patch: Partial<Column>) => void;
  onDuplicate: () => void;
  onAddBlock: (t: BlockType) => void;
  onRemoveColumn?: () => void;
  onPatchBlock: (bid: string, patch: Partial<Block>) => void;
  onRemoveBlock: (bid: string) => void;
  siteId: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${col.id}` });
  const [cardOpen, setCardOpen] = useState(false);
  const isCard = !!(
    col.bg ||
    col.pad ||
    col.radius ||
    col.shadow ||
    col.borderW ||
    col.cardImg
  );
  // A "surface card" uses a full-bleed background image (overlay / reveal / zoom
  // cards). For those, surface the image uploader right here so the user doesn't
  // have to hunt for it inside the Card panel.
  const isSurfaceCard =
    col.cardImg != null ||
    col.overlay != null ||
    col.hover === "reveal" ||
    col.hover === "zoom";
  // Mirrors the renderer so the card look is visible while editing.
  const cardStyle: React.CSSProperties = { position: "relative" };
  if (col.bg) cardStyle.background = col.bg;
  if (col.pad) cardStyle.padding = col.pad;
  if (col.radius) cardStyle.borderRadius = col.radius;
  if (col.shadow) cardStyle.boxShadow = "0 14px 34px -16px rgba(15,23,42,.35)";
  if (col.borderW)
    cardStyle.border = `${col.borderW}px solid ${col.borderColor || "#e5e7eb"}`;
  if (col.align) cardStyle.textAlign = col.align;
  if (col.minH) cardStyle.minHeight = col.minH;
  if (col.cardImg || col.radius) cardStyle.overflow = "hidden";
  if (col.cardImg) {
    cardStyle.display = "flex";
    cardStyle.flexDirection = "column";
    cardStyle.justifyContent = "flex-end";
  }

  return (
    <div
      ref={setNodeRef}
      onPointerDown={onSelect}
      className={`rounded-xl border p-2.5 min-h-[90px] transition-colors ${
        isOver
          ? "border-primary bg-primary-light/40"
          : active
            ? "border-primary ring-1 ring-primary/40 bg-white"
            : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-1 mb-2">
        {device === "desktop" && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400" title="Column width in 12ths — set precisely or drag the divider">
            <select
              value={col.span}
              onChange={(e) => onPatchColumn({ span: Number(e.target.value) })}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-[10px] font-mono border border-slate-200 rounded px-1 py-0.5 bg-white text-slate-600 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Array.from({ length: 12 }, (_, k) => k + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            /12
            {active && <span className="text-primary ml-1">• active</span>}
          </span>
        )}
        {col.hover && (
          <span className="text-[9px] uppercase tracking-wide font-semibold text-primary bg-primary-light px-1.5 py-0.5 rounded-full">
            Hover: {col.hover} ↗
          </span>
        )}
        <button
          onClick={() => setCardOpen((o) => !o)}
          title="Card style for this column"
          className={`ml-auto flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
            cardOpen || isCard
              ? "border-primary text-primary bg-primary-light"
              : "border-slate-200 text-slate-400 hover:text-primary"
          }`}
        >
          <Square size={10} /> Card
        </button>
        <button
          onClick={onDuplicate}
          title="Duplicate this column / card"
          className="flex items-center text-[10px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-colors"
        >
          <Copy size={10} />
        </button>
        {onRemoveColumn && (
          <button
            onClick={onRemoveColumn}
            title="Remove column"
            className="text-slate-300 hover:text-red-500"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {cardOpen && (
        <ColumnCardSettings col={col} onPatch={onPatchColumn} siteId={siteId} />
      )}

      {isSurfaceCard && !cardOpen && (
        <CardImageQuickUpload
          col={col}
          onPatch={onPatchColumn}
          siteId={siteId}
        />
      )}

      <SortableContext
        items={col.blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2" style={cardStyle}>
          {/* Card background image + overlay preview (mirrors the live surface card) */}
          {col.cardImg && (
            <>
              <img
                src={col.cardImg}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ zIndex: 0 }}
              />
              {col.overlay && (
                <div
                  className="absolute inset-0"
                  style={{ background: col.overlay, zIndex: 1 }}
                />
              )}
            </>
          )}
          <div
            className="space-y-2"
            style={
              col.cardImg ? { position: "relative", zIndex: 2 } : undefined
            }
          >
            {col.blocks.map((b) => (
              <SortableBlock
                key={b.id}
                block={b}
                onPatch={onPatchBlock}
                onRemove={onRemoveBlock}
                siteId={siteId}
              />
            ))}
          </div>
        </div>
      </SortableContext>

      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {(
          [
            ["heading", HeadingIcon],
            ["text", Type],
            ["image", ImageIcon],
            ["button", MousePointerClick],
            ["form", Mail],
            ["embed", Film],
            ["carousel", GalleryHorizontal],
            ["tags", Tag],
            ["tabs", Rows],
            ["navbar", Menu],
            ["search", Search],
            ["rating", Star],
            ["price", DollarSign],
          ] as const
        ).map(([t, Icon]) => (
          <button
            key={t}
            onClick={() => onAddBlock(t)}
            title={`Add ${t}`}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-primary hover:bg-white border border-slate-200 px-2 py-1 rounded-md capitalize"
          >
            <Icon size={11} /> {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Prominent card-image uploader shown on surface (image/overlay/reveal) cards ─
function CardImageQuickUpload({
  col,
  onPatch,
  siteId,
}: {
  col: Column;
  onPatch: (p: Partial<Column>) => void;
  siteId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadAssetAPI(siteId, fd);
      onPatch({ cardImg: res.data.data.path });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="mb-2 p-2 rounded-lg border border-dashed border-primary/40 bg-primary-light/30">
      <div className="flex items-center gap-2">
        {col.cardImg ? (
          <img
            src={col.cardImg}
            alt=""
            className="w-10 h-10 rounded object-cover border border-slate-200 shrink-0"
          />
        ) : (
          <span className="w-10 h-10 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0">
            <ImagePlus size={16} className="text-primary" />
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-slate-600 leading-tight">
            Card image
          </p>
          <input
            type="text"
            value={col.cardImg || ""}
            onChange={(e) => onPatch({ cardImg: e.target.value })}
            placeholder="Paste URL, or upload →"
            className="w-full mt-0.5 text-[11px] border border-slate-200 rounded px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="shrink-0 flex items-center gap-1 bg-primary text-white text-[11px] font-medium px-2.5 py-1.5 rounded-md hover:bg-primary-dark"
        >
          {uploading ? (
            <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Upload size={12} />
          )}{" "}
          Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={upload}
        />
        {col.cardImg && (
          <button
            onClick={() => onPatch({ cardImg: undefined })}
            title="Remove"
            className="text-slate-400 hover:text-red-500 shrink-0"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Card styling for a single column (background, image, effects, hover) ──────
function ColumnCardSettings({
  col,
  onPatch,
  siteId,
}: {
  col: Column;
  onPatch: (p: Partial<Column>) => void;
  siteId: string;
}) {
  const isCard = !!(
    col.bg ||
    col.pad ||
    col.radius ||
    col.shadow ||
    col.borderW ||
    col.cardImg
  );
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadAssetAPI(siteId, fd);
      onPatch({ cardImg: res.data.data.path });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="mb-2 p-2 rounded-lg border border-slate-200 bg-white space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() =>
            onPatch(
              isCard
                ? {
                    bg: undefined,
                    pad: undefined,
                    radius: undefined,
                    shadow: undefined,
                    borderW: undefined,
                  }
                : { bg: "#ffffff", pad: 24, radius: 16, shadow: true },
            )
          }
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isCard ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:text-primary"}`}
        >
          {isCard ? "Card on" : "Make a card"}
        </button>
        <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
          Bg
          <span
            className="relative w-5 h-5 rounded border border-slate-300 inline-block"
            style={{ background: col.bg || "#ffffff" }}
          >
            <input
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(col.bg || "") ? col.bg : "#ffffff"
              }
              onChange={(e) => onPatch({ bg: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </span>
        </label>
        <button
          onClick={() => onPatch({ shadow: !col.shadow })}
          className={`text-[10px] px-2 py-0.5 rounded-full ${col.shadow ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:text-primary"}`}
        >
          Shadow
        </button>
        <div className="flex items-center gap-0.5 ml-auto">
          {(["left", "center", "right"] as const).map((a) => {
            const Icon =
              a === "left"
                ? AlignLeft
                : a === "center"
                  ? AlignCenter
                  : AlignRight;
            return (
              <button
                key={a}
                onClick={() =>
                  onPatch({ align: col.align === a ? undefined : a })
                }
                title={`Align ${a}`}
                className={`w-6 h-6 flex items-center justify-center rounded ${col.align === a ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-100"}`}
              >
                <Icon size={11} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-1 text-[10px] text-slate-500">
          Pad
          <input
            type="range"
            min={0}
            max={64}
            step={4}
            value={col.pad ?? 0}
            onChange={(e) =>
              onPatch({ pad: Number(e.target.value) || undefined })
            }
            className="accent-primary w-16"
          />
        </label>
        <label className="flex items-center gap-1 text-[10px] text-slate-500">
          Round
          <input
            type="range"
            min={0}
            max={40}
            value={col.radius ?? 0}
            onChange={(e) =>
              onPatch({ radius: Number(e.target.value) || undefined })
            }
            className="accent-primary w-16"
          />
        </label>
        <label className="flex items-center gap-1 text-[10px] text-slate-500">
          Border
          <input
            type="range"
            min={0}
            max={8}
            value={col.borderW ?? 0}
            onChange={(e) =>
              onPatch({ borderW: Number(e.target.value) || undefined })
            }
            className="accent-primary w-12"
          />
          <span
            className="relative w-5 h-5 rounded border border-slate-300 inline-block"
            style={{ background: col.borderColor || "#e5e7eb" }}
          >
            <input
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(col.borderColor || "")
                  ? col.borderColor
                  : "#e5e7eb"
              }
              onChange={(e) => onPatch({ borderColor: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </span>
        </label>
        <label className="flex items-center gap-1 text-[10px] text-slate-500">
          Height
          <input
            type="range"
            min={0}
            max={520}
            step={20}
            value={col.minH ?? 0}
            onChange={(e) =>
              onPatch({ minH: Number(e.target.value) || undefined })
            }
            className="accent-primary w-16"
          />
        </label>

        <WidthControl
          full={col.full}
          widthPct={col.widthPct}
          onChange={onPatch}
        />

        {/* <label className="flex items-center gap-1 text-[10px] text-slate-500">
          Width
          <input
            type="range"
            min={0}
            max={520}
            step={20}
            value={col.minW ?? 0}
            onChange={(e) =>
              onPatch({ minW: Number(e.target.value) || undefined })
            }
            className="accent-primary w-16"
          />
        </label> */}
      </div>

      {/* Surface image (full-bleed background) + overlay */}
      <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-100 pt-2">
        <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
          <ImagePlus size={11} /> Card image
        </span>
        <input
          type="text"
          value={col.cardImg || ""}
          onChange={(e) => onPatch({ cardImg: e.target.value })}
          placeholder="Image URL, or upload →"
          className="flex-1 min-w-[140px] text-[11px] border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Upload"
          className="shrink-0 border border-slate-200 text-slate-500 hover:text-primary px-1.5 py-1 rounded-md"
        >
          {uploading ? (
            <span className="animate-spin inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <Upload size={11} />
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={uploadImg}
        />
        {col.cardImg && (
          <label
            className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer"
            title="Overlay over the image"
          >
            Overlay
            <span
              className="relative w-5 h-5 rounded border border-slate-300 inline-block"
              style={{ background: col.overlay || "rgba(2,6,23,0.6)" }}
            >
              <input
                type="color"
                value={
                  /^#[0-9a-fA-F]{6}$/.test(col.overlay || "")
                    ? col.overlay
                    : "#020617"
                }
                onChange={(e) => onPatch({ overlay: e.target.value + "a6" })}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </span>
          </label>
        )}
        {col.cardImg && (
          <button
            onClick={() => onPatch({ cardImg: undefined })}
            className="text-[10px] text-slate-400 hover:text-red-500"
          >
            clear
          </button>
        )}
      </div>

      {/* Hover animation */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-medium text-slate-500">Hover</span>
        {(
          [
            ["none", "None"],
            ["lift", "Lift"],
            ["zoom", "Zoom"],
            ["reveal", "Reveal"],
          ] as const
        ).map(([v, label]) => {
          const active = (col.hover ?? "none") === v;
          return (
            <button
              key={v}
              onClick={() =>
                onPatch({ hover: v === "none" ? undefined : (v as Hover) })
              }
              className={`text-[10px] px-2 py-0.5 rounded-full ${active ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:text-primary"}`}
            >
              {label}
            </button>
          );
        })}
        {col.hover === "reveal" && (
          <span className="text-[10px] text-slate-400 w-full">
            Reveal shows only the image; text fades in on hover (needs a card
            image).
          </span>
        )}
      </div>
    </div>
  );
}

// ── A draggable block with an inline editor ──────────────────────────────────
function SortableBlock({
  block,
  onPatch,
  onRemove,
  siteId,
}: {
  block: Block;
  onPatch: (bid: string, patch: Partial<Block>) => void;
  onRemove: (bid: string) => void;
  siteId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const [uploading, setUploading] = useState(false);
  // Controls stay mounted but hidden rather than unmounted: several of them
  // hold their own local state (upload progress, carousel drafts), and tearing
  // that down every time you clicked away would lose work in progress.
  const [editing, setEditing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadAssetAPI(siteId, fd);
      onPatch(block.id, { src: res.data.data.path });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-cq-id={block.id}
      className={`rounded-lg border p-2 transition-colors ${
        editing ? "border-primary bg-primary-light/20" : "border-transparent bg-white hover:border-slate-200"
      }`}
    >
      <div className="flex items-start gap-1.5">
        <button
          {...attributes}
          {...listeners}
          title="Drag to move"
          className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing mt-1 touch-none"
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          {/* Preview first. The controls below open only for the block being
              edited, so the canvas reads as a page instead of a stack of
              forms — the whole point of the redesign. */}
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              title="Click to edit this block"
              className="block w-full cursor-text rounded-md p-1 text-left transition-colors hover:bg-primary-light/40"
            >
              <BlockPreview block={block} />
            </button>
          )}
          <div className={editing ? "" : "hidden"}>
          {block.type === "heading" && (
            <>
              <input
                type="text"
                value={block.text || ""}
                onChange={(e) => onPatch(block.id, { text: e.target.value })}
                placeholder="Section heading"
                className="w-full text-base font-semibold text-slate-800 border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <StyleToolbar
                style={block.style}
                onChange={(s) => onPatch(block.id, { style: s })}
              />
              <LinkToggle block={block} onPatch={onPatch} />
            </>
          )}
          {block.type === "text" && (
            <>
              <textarea
                value={block.text || ""}
                onChange={(e) => onPatch(block.id, { text: e.target.value })}
                rows={2}
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                placeholder="Text…"
              />
              <StyleToolbar
                style={block.style}
                onChange={(s) => onPatch(block.id, { style: s })}
              />
              <LinkToggle block={block} onPatch={onPatch} />
            </>
          )}
          {block.type === "image" && (
            <>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={block.src || ""}
                  onChange={(e) => onPatch(block.id, { src: e.target.value })}
                  placeholder="Image URL or upload"
                  className="flex-1 min-w-0 text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="shrink-0 border border-slate-200 text-slate-500 hover:text-primary text-xs px-2 rounded-md"
                >
                  {uploading ? (
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
                  ) : (
                    <Upload size={13} />
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadImg}
                />
              </div>
              {block.src && (
                <img
                  src={block.src}
                  alt=""
                  className="mt-1.5 max-h-24 rounded-md"
                />
              )}
              <input
                type="text"
                value={block.alt || ""}
                onChange={(e) => onPatch(block.id, { alt: e.target.value })}
                placeholder="Alt text (SEO)"
                className="w-full mt-1.5 text-xs border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={!!block.bleed}
                    onChange={(e) =>
                      onPatch(block.id, { bleed: e.target.checked })
                    }
                    className="accent-primary w-3.5 h-3.5"
                  />
                  Full-bleed{" "}
                  <span className="text-slate-400">(edge-to-edge)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={!!block.fade}
                    onChange={(e) =>
                      onPatch(block.id, { fade: e.target.checked })
                    }
                    className="accent-primary w-3.5 h-3.5"
                  />
                  Fade bottom{" "}
                  <span className="text-slate-400">
                    (blends into a dark card)
                  </span>
                </label>
              </div>
            </>
          )}
          {block.type === "button" && (
            <div className="space-y-1.5">
              <input
                type="text"
                value={block.text || ""}
                onChange={(e) => onPatch(block.id, { text: e.target.value })}
                placeholder="Button label"
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="text"
                value={block.href || ""}
                onChange={(e) => onPatch(block.id, { href: e.target.value })}
                placeholder="https://…"
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={block.target === "_blank"}
                  onChange={(e) =>
                    onPatch(block.id, {
                      target: e.target.checked ? "_blank" : "",
                    })
                  }
                  className="accent-primary w-3 h-3"
                />
                Open in new tab
              </label>
            </div>
          )}
          {block.type === "form" && (
            <div>
              <div className="mb-2">
                <FormBlockPreview block={block} />
              </div>
              <FormBlockEditor block={block} onPatch={onPatch} />
            </div>
          )}
          {block.type === "embed" && (
            <EmbedEditor block={block} onPatch={onPatch} />
          )}
          {block.type === "carousel" && (
            <CarouselEditor block={block} onPatch={onPatch} siteId={siteId} />
          )}
          {block.type === "tags" && (
            <div>
              <div
                className={`flex gap-1.5 mb-1.5 ${block.marquee ? "flex-nowrap overflow-hidden" : "flex-wrap"}`}
              >
                {(block.text || "")
                  .split(/[\n,]/)
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs border whitespace-nowrap"
                      style={{
                        background: block.tagBg || "#f1f5f9",
                        color: block.tagColor || "#475569",
                        borderColor: "rgba(148,163,184,.4)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
              </div>
              <textarea
                value={block.text || ""}
                onChange={(e) => onPatch(block.id, { text: e.target.value })}
                rows={3}
                placeholder="One tag per line"
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <div className="flex items-center gap-3 flex-wrap mt-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                  Pill
                  <span
                    className="relative w-5 h-5 rounded border border-slate-300 inline-block"
                    style={{ background: block.tagBg || "#f1f5f9" }}
                  >
                    <input
                      type="color"
                      value={
                        /^#[0-9a-fA-F]{6}$/.test(block.tagBg || "")
                          ? block.tagBg
                          : "#f1f5f9"
                      }
                      onChange={(e) =>
                        onPatch(block.id, { tagBg: e.target.value })
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </span>
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                  Text
                  <span
                    className="relative w-5 h-5 rounded border border-slate-300 inline-block"
                    style={{ background: block.tagColor || "#475569" }}
                  >
                    <input
                      type="color"
                      value={
                        /^#[0-9a-fA-F]{6}$/.test(block.tagColor || "")
                          ? block.tagColor
                          : "#475569"
                      }
                      onChange={(e) =>
                        onPatch(block.id, { tagColor: e.target.value })
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </span>
                </label>
                {(block.tagBg || block.tagColor) && (
                  <button
                    onClick={() =>
                      onPatch(block.id, {
                        tagBg: undefined,
                        tagColor: undefined,
                      })
                    }
                    className="text-[11px] text-slate-400 hover:text-red-500"
                  >
                    reset
                  </button>
                )}
                <button
                  onClick={() => onPatch(block.id, { marquee: !block.marquee })}
                  className={`ml-auto flex items-center gap-1 text-[11px] px-2 py-1 rounded-full ${block.marquee ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:text-primary"}`}
                >
                  <FastForward size={11} /> Marquee
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                One pill per line (or comma-separated).
                {block.marquee &&
                  " Marquee scrolls them horizontally on the live site."}
              </p>
            </div>
          )}
          {block.type === "tabs" && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-medium text-slate-500">Style</span>
                {([["pills", "Pills"], ["underline", "Underline"], ["segment", "Segment"], ["boxed", "Boxed"]] as const).map(([v, label]) => {
                  const active = (block.tabStyle || "pills") === v;
                  return (
                    <button key={v} type="button" onClick={() => onPatch(block.id, { tabStyle: v })}
                      className={`text-[11px] px-2 py-1 rounded-full ${active ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:text-primary"}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-1.5 mb-2">
                {block &&
                  block.tabs &&
                  block.tabs.length > 0 &&
                  block.tabs.map((tab, i) => (
                    <div
                      key={tab.id}
                      className="border border-slate-200 rounded-md p-2 bg-slate-50"
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <button
                          type="button"
                          onClick={() => onPatch(block.id, { activeTab: i })}
                          title="Set as the default open tab"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border whitespace-nowrap shrink-0 cursor-pointer"
                          style={{
                            background:
                              i === (block.activeTab || 0)
                                ? block.activeBg || "#0f172a"
                                : block.inactiveBg || "#f1f5f9",
                            color:
                              i === (block.activeTab || 0)
                                ? block.activeColor || "#ffffff"
                                : block.inactiveColor || "#475569",
                            borderColor: "rgba(148,163,184,.4)",
                          }}
                        >
                          {i === (block.activeTab || 0) && <Check size={10} />}
                          Tab {i + 1}
                        </button>

                        <input
                          value={tab.label || ""}
                          onChange={(e) =>
                            onPatch(block.id, {
                              tabs:
                                block?.tabs &&
                                block?.tabs.map((t) =>
                                  t.id === tab.id
                                    ? { ...t, label: e.target.value }
                                    : t,
                                ),
                            })
                          }
                          placeholder="Tab label"
                          className="flex-1 text-sm border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          disabled={i === 0}
                          onClick={() => {
                            const tabs = [...(block.tabs ?? [])];
                            [tabs[i - 1], tabs[i]] = [tabs[i], tabs[i - 1]];
                            onPatch(block.id, { tabs });
                          }}
                          className="text-slate-400 hover:text-primary disabled:opacity-30 disabled:hover:text-slate-400 shrink-0"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          disabled={i === (block.tabs ?? []).length - 1}
                          onClick={() => {
                            const tabs = [...(block.tabs ?? [])];
                            [tabs[i], tabs[i + 1]] = [tabs[i + 1], tabs[i]];
                            onPatch(block.id, { tabs });
                          }}
                          className="text-slate-400 hover:text-primary disabled:opacity-30 disabled:hover:text-slate-400 shrink-0"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          onClick={() =>
                            onPatch(block.id, {
                              tabs:
                                block?.tabs &&
                                block.tabs.filter((t) => t.id !== tab.id),
                              activeTab:
                                (block.activeTab || 0) >= i &&
                                (block.activeTab || 0) > 0
                                  ? (block.activeTab || 0) - 1
                                  : block.activeTab || 0,
                            })
                          }
                          className="text-slate-400 hover:text-red-500 shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <textarea
                        value={tab.text || ""}
                        onChange={(e) =>
                          onPatch(block.id, {
                            tabs:
                              block?.tabs &&
                              block.tabs.map((t) =>
                                t.id === tab.id
                                  ? { ...t, text: e.target.value }
                                  : t,
                              ),
                          })
                        }
                        rows={3}
                        placeholder="Tab content"
                        className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      />
                    </div>
                  ))}
              </div>

              <button
                onClick={() =>
                  onPatch(block.id, {
                    tabs: [
                      ...(block.tabs || []),
                      {
                        id: uid(),
                        label: `Tab ${(block.tabs || []).length + 1}`,
                        text: "",
                      },
                    ],
                  })
                }
                className="w-full text-xs text-primary border border-dashed border-primary/40 rounded-md py-1.5 hover:bg-primary/5 mb-2"
              >
                + Add tab
              </button>

              <div className="flex items-center gap-3 flex-wrap p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                  Active bg
                  <span
                    className="relative w-5 h-5 rounded border border-slate-300 inline-block"
                    style={{ background: block.activeBg || "#0f172a" }}
                  >
                    <input
                      type="color"
                      value={
                        /^#[0-9a-fA-F]{6}$/.test(block.activeBg || "")
                          ? block.activeBg
                          : "#0f172a"
                      }
                      onChange={(e) =>
                        onPatch(block.id, { activeBg: e.target.value })
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </span>
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                  Active text
                  <span
                    className="relative w-5 h-5 rounded border border-slate-300 inline-block"
                    style={{ background: block.activeColor || "#ffffff" }}
                  >
                    <input
                      type="color"
                      value={
                        /^#[0-9a-fA-F]{6}$/.test(block.activeColor || "")
                          ? block.activeColor
                          : "#ffffff"
                      }
                      onChange={(e) =>
                        onPatch(block.id, { activeColor: e.target.value })
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </span>
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                  Inactive bg
                  <span
                    className="relative w-5 h-5 rounded border border-slate-300 inline-block"
                    style={{ background: block.inactiveBg || "#f1f5f9" }}
                  >
                    <input
                      type="color"
                      value={
                        /^#[0-9a-fA-F]{6}$/.test(block.inactiveBg || "")
                          ? block.inactiveBg
                          : "#f1f5f9"
                      }
                      onChange={(e) =>
                        onPatch(block.id, { inactiveBg: e.target.value })
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </span>
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                  Inactive text
                  <span
                    className="relative w-5 h-5 rounded border border-slate-300 inline-block"
                    style={{ background: block.inactiveColor || "#475569" }}
                  >
                    <input
                      type="color"
                      value={
                        /^#[0-9a-fA-F]{6}$/.test(block.inactiveColor || "")
                          ? block.inactiveColor
                          : "#475569"
                      }
                      onChange={(e) =>
                        onPatch(block.id, { inactiveColor: e.target.value })
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </span>
                </label>
                {(block.activeBg ||
                  block.activeColor ||
                  block.inactiveBg ||
                  block.inactiveColor) && (
                  <button
                    onClick={() =>
                      onPatch(block.id, {
                        activeBg: undefined,
                        activeColor: undefined,
                        inactiveBg: undefined,
                        inactiveColor: undefined,
                      })
                    }
                    className="text-[11px] text-slate-400 hover:text-red-500"
                  >
                    reset
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click a <strong>Tab N</strong> chip to set which tab opens by default.
              </p>
            </div>
          )}
          {block.type === "rating" && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base tracking-wider" style={{ color: "#e2e8f0" }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} style={{ color: i < Math.round(block.value ?? 0) ? "#f59e0b" : "#e2e8f0" }}>★</span>
                  ))}
                </span>
                <span className="text-xs text-slate-500">{block.text}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-500 flex-1">
                  Stars
                  <input type="range" min={0} max={5} step={0.5} value={block.value ?? 0} onChange={(e) => onPatch(block.id, { value: Number(e.target.value) })} className="accent-primary flex-1" />
                  <span className="w-6 font-mono text-slate-600">{block.value ?? 0}</span>
                </label>
                <input value={block.text || ""} onChange={(e) => onPatch(block.id, { text: e.target.value })} placeholder="(count)"
                  className="w-20 text-sm border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
          )}
          {block.type === "price" && (
            <div className="flex items-center gap-2">
              <input value={block.text || ""} onChange={(e) => onPatch(block.id, { text: e.target.value })} placeholder="$499.99"
                className="flex-1 min-w-0 text-sm font-bold border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
              <input value={block.alt || ""} onChange={(e) => onPatch(block.id, { alt: e.target.value })} placeholder="was $699 (optional)"
                className="flex-1 min-w-0 text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary line-through text-slate-400" />
            </div>
          )}
          {block.type === "search" && (
            <div>
              <div className="flex items-center gap-2 border border-slate-300 rounded-full px-3 py-2 bg-white mb-1.5">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth={2}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <span className="text-sm text-slate-400 truncate">{block.text || "Search this page…"}</span>
              </div>
              <input
                value={block.text || ""}
                onChange={(e) => onPatch(block.id, { text: e.target.value })}
                placeholder="Placeholder text"
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">Searches all text on the page and highlights matches (works on the live site).</p>
            </div>
          )}
          {block.type === "navbar" && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={block.text || ""}
                  onChange={(e) => onPatch(block.id, { text: e.target.value })}
                  placeholder="Brand / site name"
                  className="flex-1 min-w-0 text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  value={block.src || ""}
                  onChange={(e) => onPatch(block.id, { src: e.target.value })}
                  placeholder="Logo URL (optional)"
                  className="flex-1 min-w-0 text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                  Text color
                  {(() => {
                    const cur = parseStyleMap(block.style)["color"] || "";
                    return (
                      <span className="relative w-5 h-5 rounded border border-slate-300 inline-block" style={{ background: cur || "#0f172a" }}>
                        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(cur) ? cur : "#0f172a"}
                          onChange={(e) => { const m = parseStyleMap(block.style); m.color = e.target.value; onPatch(block.id, { style: serializeStyleMap(m) }); }}
                          className="absolute inset-0 opacity-0 cursor-pointer" />
                      </span>
                    );
                  })()}
                </label>
                <span className="text-[11px] text-slate-400">Set light text for a dark navbar section.</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mb-1"><Link2 size={12} /> Links (add submenu items for hover dropdowns)</span>
              <LinkListEditor links={block.links || []} onChange={(links) => onPatch(block.id, { links })} />
              <p className="text-[11px] text-slate-400 mt-1">Style this bar with the section / card background — put it in a full-width section, and reorder sections to place it anywhere (e.g. under a banner).</p>
            </div>
          )}
          <BoxToolbar block={block} onPatch={onPatch} />
          </div>
        </div>
        <div className="mt-1 flex flex-col items-center gap-1">
          {editing && (
            <button
              onClick={() => setEditing(false)}
              title="Done editing this block"
              className="text-primary hover:text-primary-dark"
            >
              <Check size={13} />
            </button>
          )}
          <button
            onClick={() => onRemove(block.id)}
            title="Delete block"
            className="text-slate-300 hover:text-red-500"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Embed block editor: paste a link, see the live preview or a clear warning ─
function EmbedEditor({
  block,
  onPatch,
}: {
  block: Block;
  onPatch: (bid: string, patch: Partial<Block>) => void;
}) {
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
        <div
          className="mt-2 rounded-md overflow-hidden border border-slate-200"
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16/9",
            background: "#f1f5f9",
          }}
        >
          <iframe
            src={preview}
            title="Embed preview"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: 0,
            }}
          />
        </div>
      ) : showWarning ? (
        <p className="text-[11px] text-amber-600 mt-1.5">
          That link isn't supported. Paste a YouTube, Vimeo, or Google Maps
          link.
        </p>
      ) : (
        <p className="text-[11px] text-slate-400 mt-1.5">
          Supports YouTube, Vimeo, and Google Maps.
        </p>
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
  return Object.entries(o)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}

const WIDTHS: { label: string; value: string }[] = [
  { label: "Auto", value: "" },
  { label: "25%", value: "25%" },
  { label: "50%", value: "50%" },
  { label: "75%", value: "75%" },
  { label: "100%", value: "100%" },
];

// ── Make a text / heading block a link (toggle) ──────────────────────────────
function LinkToggle({ block, onPatch }: { block: Block; onPatch: (bid: string, patch: Partial<Block>) => void }) {
  const isLink = !!(block.href && block.href.trim() && block.href.trim() !== "#");
  return (
    <div className="mt-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
        <input
          type="checkbox"
          checked={isLink}
          onChange={(e) => onPatch(block.id, { href: e.target.checked ? (block.href && block.href !== "#" ? block.href : "https://") : "" })}
          className="accent-primary w-3.5 h-3.5"
        />
        <Link2 size={11} /> Make it a link
      </label>
      {isLink && (
        <div className="flex items-center gap-2 mt-1.5">
          <input
            value={block.href || ""}
            onChange={(e) => onPatch(block.id, { href: e.target.value })}
            placeholder="https://… or #section"
            className="flex-1 min-w-0 text-xs border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
          <label className="flex items-center gap-1 text-[11px] text-slate-500 whitespace-nowrap cursor-pointer">
            <input
              type="checkbox"
              checked={block.target === "_blank"}
              onChange={(e) => onPatch(block.id, { target: e.target.checked ? "_blank" : "" })}
              className="accent-primary w-3 h-3"
            />
            New tab
          </label>
        </div>
      )}
    </div>
  );
}

// ── Per-block box controls: alignment, width, height ─────────────────────────
function BoxToolbar({
  block,
  onPatch,
}: {
  block: Block;
  onPatch: (bid: string, patch: Partial<Block>) => void;
}) {
  const st = parseStyleMap(block.style);
  const setStyleProp = (prop: string, value: string | null) => {
    const next = { ...st };
    if (!value) delete next[prop];
    else next[prop] = value;
    onPatch(block.id, { style: serializeStyleMap(next) });
  };
  const align = block.align || "";
  const width = st["width"] || "";
  // Height sets `height` (not min-height) so it can shrink elements that have an
  // intrinsic ratio — a carousel is 16/9 and min-height could never reduce it.
  // Older blocks stored min-height, so read that as a fallback.
  const height = st["height"] || st["min-height"] || "";
  const setHeight = (v: string) => {
    const next = { ...st };
    delete next["min-height"];
    if (v) next["height"] = v;
    else delete next["height"];
    onPatch(block.id, { style: serializeStyleMap(next) });
  };
  const isPresetWidth = WIDTHS.some((w) => w.value === width);

  const alignBtn = (a: Align, Icon: any) => (
    <button
      type="button"
      onClick={() =>
        onPatch(block.id, { align: block.align === a ? undefined : a })
      }
      title={`Align ${a}`}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${align === a ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100"}`}
    >
      <Icon size={13} />
    </button>
  );

  return (
    <div className="flex items-center gap-2 flex-wrap mt-2 p-1.5 bg-white border border-slate-200 rounded-lg">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide pl-0.5 pr-1">
        Box
      </span>
      <div className="flex items-center gap-0.5">
        {alignBtn("left", AlignLeft)}
        {alignBtn("center", AlignCenter)}
        {alignBtn("right", AlignRight)}
      </div>
      <span className="w-px h-5 bg-slate-200" />
      <div
        className="flex items-center gap-1 text-[11px] text-slate-500"
        title="Width"
      >
        <Ruler size={11} /> W
        <select
          value={isPresetWidth ? width : "custom"}
          onChange={(e) => {
            const v = e.target.value;
            if (v !== "custom") setStyleProp("width", v || null);
          }}
          className="text-xs bg-white border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          {WIDTHS.map((w) => (
            <option key={w.label} value={w.value}>
              {w.label}
            </option>
          ))}
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
      <label
        className="flex items-center gap-1 text-[11px] text-slate-500"
        title="Height — e.g. 300px or 50vh"
      >
        H
        <input
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          placeholder="auto"
          className="w-16 text-xs border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>
    </div>
  );
}

// ── Shared width control: Contained | Custom (% slider) | Full width ─────────
// Used by sections, the navbar and the footer so "width" behaves identically
// everywhere: a custom % narrows the whole box (background included) and centers it.
function WidthControl({
  full,
  widthPct,
  onChange,
}: {
  full?: boolean;
  widthPct?: number;
  onChange: (p: { full?: boolean; widthPct?: number }) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-slate-600 text-xs">Width</span>
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
          <button
            onClick={() => onChange({ full: false, widthPct: undefined })}
            className={`px-2.5 py-1 text-xs ${!full && !widthPct ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Contained
          </button>
          <button
            onClick={() => onChange({ full: false, widthPct: widthPct ?? 60 })}
            className={`px-2.5 py-1 text-xs ${widthPct ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Custom
          </button>
          <button
            onClick={() => onChange({ full: true, widthPct: undefined })}
            className={`px-2.5 py-1 text-xs flex items-center gap-1 ${full ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <MoveHorizontal size={11} /> Full width
          </button>
        </div>
      </div>
      {widthPct != null && (
        <label className="flex items-center gap-2 text-slate-600 text-xs">
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={widthPct}
            onChange={(e) =>
              onChange({ full: false, widthPct: Number(e.target.value) })
            }
            className="accent-primary w-28"
          />
          <span className="w-9 text-right font-mono text-slate-500">
            {widthPct}%
          </span>
        </label>
      )}
    </>
  );
}

// ── A small color swatch + native picker used by the nav / footer editors ────
function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value?: string;
  fallback: string;
  onChange: (v: string) => void;
}) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value || "")
    ? (value as string)
    : fallback;
  return (
    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
      <span
        className="relative w-6 h-6 rounded border border-slate-300 inline-block"
        style={{ background: value || fallback }}
      >
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </span>
      {label}
    </label>
  );
}

// ── Editable list of navbar / footer links ───────────────────────────────────
function LinkListEditor({
  links,
  onChange,
}: {
  links: NavLink[];
  onChange: (links: NavLink[]) => void;
}) {
  const add = () =>
    onChange([...links, { id: uid(), label: "Link", href: "#" }]);
  const patch = (id: string, p: Partial<NavLink>) =>
    onChange(links.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const remove = (id: string) => onChange(links.filter((l) => l.id !== id));
  // Submenu (children) helpers
  const addChild = (l: NavLink) =>
    patch(l.id, { children: [...(l.children || []), { id: uid(), label: "Sub-link", href: "#" }] });
  const patchChild = (l: NavLink, cid: string, p: Partial<SubLink>) =>
    patch(l.id, { children: (l.children || []).map((c) => (c.id === cid ? { ...c, ...p } : c)) });
  const removeChild = (l: NavLink, cid: string) =>
    patch(l.id, { children: (l.children || []).filter((c) => c.id !== cid) });
  return (
    <div className="space-y-2">
      {links.map((l) => (
        <div key={l.id} className="border border-slate-200 rounded-md p-1.5 bg-white/60">
          <div className="flex items-center gap-2">
            <input
              value={l.label}
              onChange={(e) => patch(l.id, { label: e.target.value })}
              placeholder="Label"
              className="flex-1 min-w-0 text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              value={l.href}
              onChange={(e) => patch(l.id, { href: e.target.value })}
              placeholder="https://… or #section"
              className="flex-1 min-w-0 text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            <button
              onClick={() => remove(l.id)}
              title="Remove link"
              className="text-slate-300 hover:text-red-500 shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
          {/* Submenu items (dropdown on hover) */}
          {(l.children || []).length > 0 && (
            <div className="mt-1.5 ml-4 pl-2 border-l-2 border-slate-200 space-y-1.5">
              {(l.children || []).map((c) => (
                <div key={c.id} className="flex items-center gap-1.5">
                  <input
                    value={c.label}
                    onChange={(e) => patchChild(l, c.id, { label: e.target.value })}
                    placeholder="Sub-label"
                    className="flex-1 min-w-0 text-xs border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    value={c.href}
                    onChange={(e) => patchChild(l, c.id, { href: e.target.value })}
                    placeholder="#link"
                    className="flex-1 min-w-0 text-xs border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                  <button onClick={() => removeChild(l, c.id)} title="Remove sub-link" className="text-slate-300 hover:text-red-500 shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => addChild(l)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-primary mt-1 ml-1"
          >
            <Plus size={10} /> Add submenu item
          </button>
        </div>
      ))}
      {links.length < 12 && (
        <button
          onClick={add}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus size={12} /> Add link
        </button>
      )}
    </div>
  );
}

// ── Navbar settings panel ────────────────────────────────────────────────────
function NavEditor({
  nav,
  onPatch,
}: {
  nav: NavConfig;
  onPatch: (p: Partial<NavConfig>) => void;
}) {
  return (
    <div className="mb-5 p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <PanelTop size={14} /> Navigation bar
        </span>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={nav.enabled}
            onChange={(e) => onPatch({ enabled: e.target.checked })}
            className="accent-primary w-4 h-4"
          />
          Show navbar
        </label>
      </div>
      {nav.enabled && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs text-slate-500 space-y-1 block">
              <span className="block">Brand / site name</span>
              <input
                value={nav.brand || ""}
                onChange={(e) => onPatch({ brand: e.target.value })}
                placeholder="My Site"
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>
            <label className="text-xs text-slate-500 space-y-1 block">
              <span className="block">Logo image URL (optional)</span>
              <input
                value={nav.brandImg || ""}
                onChange={(e) => onPatch({ brandImg: e.target.value })}
                placeholder="https://…/logo.png"
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </label>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5 mb-2">
              <Link2 size={12} /> Links
            </span>
            <LinkListEditor
              links={nav.links}
              onChange={(links) => onPatch({ links })}
            />
          </div>
          <div className="flex flex-wrap items-center gap-5 pt-1">
            <ColorField
              label="Background"
              value={nav.bg}
              fallback="#ffffff"
              onChange={(v) => onPatch({ bg: v })}
            />
            <button
              onClick={() =>
                onPatch({
                  bg: nav.bg === "transparent" ? "#ffffff" : "transparent",
                })
              }
              title="Let the layout background show through the navbar"
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${nav.bg === "transparent" ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:text-primary"}`}
            >
              Transparent
            </button>
            <ColorField
              label="Text"
              value={nav.color}
              fallback="#0f172a"
              onChange={(v) => onPatch({ color: v })}
            />
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={!!nav.sticky}
                onChange={(e) => onPatch({ sticky: e.target.checked })}
                className="accent-primary w-4 h-4"
              />
              Sticky on scroll
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Wand2 size={12} /> Effects
            </span>
            <button
              onClick={() => onPatch({ glass: !nav.glass })}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${nav.glass ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:text-primary"}`}
            >
              <Sparkles size={12} /> Glassmorphism
            </button>
            <button
              onClick={() => onPatch({ shadow: !nav.shadow })}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${nav.shadow ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:text-primary"}`}
            >
              <Layers size={12} /> Shadow
            </button>
            {nav.glass && (
              <span className="text-[11px] text-slate-400 w-full">
                Frosted translucent bar — it picks up the{" "}
                <strong>Layout background</strong> behind it. Turn on{" "}
                <strong>Sticky on scroll</strong> so it frosts content passing
                beneath, and pick a light or dark <em>Text</em> color to suit.
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Ruler size={12} /> Size &amp; shape
            </span>
            <WidthControl
              full={nav.full}
              widthPct={nav.widthPct}
              onChange={onPatch}
            />
            <label className="flex items-center gap-2 text-slate-600 text-xs">
              Height
              <input
                type="range"
                min={0}
                max={160}
                step={4}
                value={nav.minH ?? 0}
                onChange={(e) =>
                  onPatch({ minH: Number(e.target.value) || undefined })
                }
                className="accent-primary w-24"
              />
              <span className="w-10 text-right font-mono text-slate-500">
                {nav.minH ? `${nav.minH}px` : "auto"}
              </span>
            </label>
            <label className="flex items-center gap-2 text-slate-600 text-xs">
              Rounded
              <input
                type="range"
                min={0}
                max={40}
                value={nav.radius ?? 0}
                onChange={(e) =>
                  onPatch({ radius: Number(e.target.value) || undefined })
                }
                className="accent-primary w-20"
              />
            </label>
            <label className="flex items-center gap-2 text-slate-600 text-xs">
              Margin top
              <input
                type="range"
                min={0}
                max={120}
                step={4}
                value={nav.mt ?? 0}
                onChange={(e) =>
                  onPatch({ mt: Number(e.target.value) || undefined })
                }
                className="accent-primary w-20"
              />
              <span className="w-9 text-right font-mono text-slate-500">
                {nav.mt ? `${nav.mt}px` : "0"}
              </span>
            </label>
            <label className="flex items-center gap-2 text-slate-600 text-xs">
              Margin bottom
              <input
                type="range"
                min={0}
                max={120}
                step={4}
                value={nav.mb ?? 0}
                onChange={(e) =>
                  onPatch({ mb: Number(e.target.value) || undefined })
                }
                className="accent-primary w-20"
              />
              <span className="w-9 text-right font-mono text-slate-500">
                {nav.mb ? `${nav.mb}px` : "0"}
              </span>
            </label>
            <label className="flex items-center gap-2 text-slate-600 text-xs">
              Margin left
              <input
                type="range"
                min={0}
                max={300}
                step={4}
                value={nav.ml ?? 0}
                onChange={(e) =>
                  onPatch({ ml: Number(e.target.value) || undefined })
                }
                className="accent-primary w-20"
              />
              <span className="w-9 text-right font-mono text-slate-500">
                {nav.ml ? `${nav.ml}px` : "auto"}
              </span>
            </label>
            <label className="flex items-center gap-2 text-slate-600 text-xs">
              Margin right
              <input
                type="range"
                min={0}
                max={300}
                step={4}
                value={nav.mr ?? 0}
                onChange={(e) =>
                  onPatch({ mr: Number(e.target.value) || undefined })
                }
                className="accent-primary w-20"
              />
              <span className="w-9 text-right font-mono text-slate-500">
                {nav.mr ? `${nav.mr}px` : "auto"}
              </span>
            </label>
          </div>
        </>
      )}
    </div>
  );
}

// ── Footer settings panel ────────────────────────────────────────────────────
function FooterEditor({
  footer,
  onPatch,
}: {
  footer: FooterConfig;
  onPatch: (p: Partial<FooterConfig>) => void;
}) {
  return (
    <div className="mb-5 p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <PanelBottom size={14} /> Footer
        </span>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={footer.enabled}
            onChange={(e) => onPatch({ enabled: e.target.checked })}
            className="accent-primary w-4 h-4"
          />
          Show footer
        </label>
      </div>
      {footer.enabled && (
        <>
          <label className="text-xs text-slate-500 space-y-1 block">
            <span className="block">Footer text / copyright</span>
            <input
              value={footer.text || ""}
              onChange={(e) => onPatch({ text: e.target.value })}
              placeholder="© 2026 My Company. All rights reserved."
              className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <div>
            <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5 mb-2">
              <Link2 size={12} /> Links
            </span>
            <LinkListEditor
              links={footer.links}
              onChange={(links) => onPatch({ links })}
            />
          </div>
          <div className="flex flex-wrap items-center gap-5 pt-1">
            <ColorField
              label="Background"
              value={footer.bg}
              fallback="#0f172a"
              onChange={(v) => onPatch({ bg: v })}
            />
            <ColorField
              label="Text"
              value={footer.color}
              fallback="#e2e8f0"
              onChange={(v) => onPatch({ color: v })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Ruler size={12} /> Size &amp; shape
            </span>
            <WidthControl
              full={footer.full}
              widthPct={footer.widthPct}
              onChange={onPatch}
            />
            <label className="flex items-center gap-2 text-slate-600 text-xs">
              Height
              <input
                type="range"
                min={0}
                max={300}
                step={10}
                value={footer.minH ?? 0}
                onChange={(e) =>
                  onPatch({ minH: Number(e.target.value) || undefined })
                }
                className="accent-primary w-24"
              />
              <span className="w-10 text-right font-mono text-slate-500">
                {footer.minH ? `${footer.minH}px` : "auto"}
              </span>
            </label>
            <label className="flex items-center gap-2 text-slate-600 text-xs">
              Rounded
              <input
                type="range"
                min={0}
                max={40}
                value={footer.radius ?? 0}
                onChange={(e) =>
                  onPatch({ radius: Number(e.target.value) || undefined })
                }
                className="accent-primary w-20"
              />
            </label>
            <label className="flex items-center gap-2 text-slate-600 text-xs">
              Margin top
              <input
                type="range"
                min={0}
                max={120}
                step={4}
                value={footer.mt ?? 0}
                onChange={(e) =>
                  onPatch({ mt: Number(e.target.value) || undefined })
                }
                className="accent-primary w-20"
              />
              <span className="w-9 text-right font-mono text-slate-500">
                {footer.mt ? `${footer.mt}px` : "0"}
              </span>
            </label>
            <label className="flex items-center gap-2 text-slate-600 text-xs">
              Margin bottom
              <input
                type="range"
                min={0}
                max={120}
                step={4}
                value={footer.mb ?? 0}
                onChange={(e) =>
                  onPatch({ mb: Number(e.target.value) || undefined })
                }
                className="accent-primary w-20"
              />
              <span className="w-9 text-right font-mono text-slate-500">
                {footer.mb ? `${footer.mb}px` : "0"}
              </span>
            </label>
            <label className="flex items-center gap-2 text-slate-600 text-xs">
              Margin left
              <input
                type="range"
                min={0}
                max={300}
                step={4}
                value={footer.ml ?? 0}
                onChange={(e) =>
                  onPatch({ ml: Number(e.target.value) || undefined })
                }
                className="accent-primary w-20"
              />
              <span className="w-9 text-right font-mono text-slate-500">
                {footer.ml ? `${footer.ml}px` : "auto"}
              </span>
            </label>
            <label className="flex items-center gap-2 text-slate-600 text-xs">
              Margin right
              <input
                type="range"
                min={0}
                max={300}
                step={4}
                value={footer.mr ?? 0}
                onChange={(e) =>
                  onPatch({ mr: Number(e.target.value) || undefined })
                }
                className="accent-primary w-20"
              />
              <span className="w-9 text-right font-mono text-slate-500">
                {footer.mr ? `${footer.mr}px` : "auto"}
              </span>
            </label>
          </div>
        </>
      )}
    </div>
  );
}

// ── Dynamic Form Block Preview & Custom Field Editor ─────────────────────────
function FormBlockPreview({ block }: { block: Block }) {
  const fields = block.fields && block.fields.length > 0 ? block.fields : [
    { id: "1", type: "text" as FormFieldType, label: "First name", name: "first_name", placeholder: "First name", width: "half" as const },
    { id: "2", type: "text" as FormFieldType, label: "Last name", name: "last_name", placeholder: "Last name", width: "half" as const },
    { id: "3", type: "email" as FormFieldType, label: "Email", name: "email", placeholder: "you@company.com", width: "full" as const },
    { id: "4", type: "phone" as FormFieldType, label: "Phone number", name: "phone", placeholder: "+1 (555) 000-0000", width: "full" as const },
    { id: "5", type: "textarea" as FormFieldType, label: "Message", name: "message", placeholder: "Leave us a message...", width: "full" as const },
  ];

  const submitBtnStyle =
    block.submitStyle === "dark"
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : block.submitStyle === "accent"
      ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
      : block.submitStyle === "gradient"
      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
      : "bg-primary text-white hover:bg-primary-dark";

  return (
    <div className="w-full space-y-3 pointer-events-none">
      <div className="grid grid-cols-2 gap-2.5">
        {fields.map((f) => {
          const isHalf = f.width === "half";
          const colClass = isHalf ? "col-span-1" : "col-span-2";
          return (
            <div key={f.id} className={`${colClass} space-y-1`}>
              {f.label && (
                <label className="block text-[11px] font-semibold text-slate-700">
                  {f.label}
                  {f.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
              )}
              {f.type === "textarea" ? (
                <textarea
                  disabled
                  placeholder={f.placeholder || "Your message"}
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-400 resize-none shadow-sm"
                />
              ) : f.type === "select" ? (
                <div className="relative">
                  <select
                    disabled
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-500 appearance-none shadow-sm cursor-pointer pr-7"
                  >
                    <option>{f.placeholder || "Select option..."}</option>
                    {(f.options || []).map((opt, idx) => (
                      <option key={idx}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none" />
                </div>
              ) : f.type === "pills" ? (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {(f.options && f.options.length ? f.options : ["Option 1", "Option 2", "Option 3"]).map((opt, idx) => (
                    <span
                      key={idx}
                      className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                        idx === 0
                          ? "border-primary bg-primary-light/60 text-primary"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              ) : f.type === "checkbox" ? (
                <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" disabled checked className="accent-primary w-3.5 h-3.5 rounded border-slate-300" />
                  <span className="text-[11px] text-slate-600">{f.label}</span>
                </div>
              ) : f.type === "phone" ? (
                <div className="flex rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden text-xs">
                  <span className="px-2 py-1.5 bg-slate-50 border-r border-slate-200 text-slate-500 font-medium shrink-0 flex items-center gap-0.5 text-[11px]">
                    US ▾
                  </span>
                  <input
                    disabled
                    placeholder={f.placeholder || "+1 (555) 000-0000"}
                    className="w-full px-2.5 py-1.5 bg-white text-slate-400 outline-none text-xs"
                  />
                </div>
              ) : f.type === "file" ? (
                <div className="border border-dashed border-slate-300 rounded-lg p-2.5 text-center bg-slate-50/50">
                  <Upload size={14} className="mx-auto text-slate-400 mb-0.5" />
                  <span className="text-[10px] text-slate-500 font-medium">Upload file or drag & drop</span>
                </div>
              ) : (
                <input
                  disabled
                  type={f.type === "email" ? "email" : f.type === "number" ? "number" : "text"}
                  placeholder={f.placeholder || f.label}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-400 shadow-sm"
                />
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className={`w-full text-xs font-semibold py-2 px-3 rounded-lg transition-all shadow-sm ${submitBtnStyle}`}
      >
        {block.text || "Send message"}
      </button>
    </div>
  );
}

function FormBlockEditor({
  block,
  onPatch,
}: {
  block: Block;
  onPatch: (bid: string, patch: Partial<Block>) => void;
}) {
  const fields = block.fields || [];

  const addField = (type: FormFieldType) => {
    const labelMap: Record<FormFieldType, string> = {
      text: "Text field",
      email: "Email address",
      phone: "Phone number",
      textarea: "Message",
      select: "Dropdown choice",
      pills: "Selection pills",
      checkbox: "Checkbox",
      file: "File upload",
      number: "Quantity",
    };
    const defaultOptions =
      type === "select" ? ["Option A", "Option B"] : type === "pills" ? ["Standard", "Express", "Custom"] : undefined;

    const newField: FormField = {
      id: uid(),
      type,
      label: labelMap[type] || "Field label",
      name: `field_${uid()}`,
      placeholder: type === "select" ? "Select..." : type === "textarea" ? "Type here..." : "",
      width: type === "text" || type === "select" || type === "phone" ? "half" : "full",
      options: defaultOptions,
    };
    onPatch(block.id, { fields: [...fields, newField] });
  };

  const updateField = (fid: string, patch: Partial<FormField>) => {
    const updated = fields.map((f) => (f.id === fid ? { ...f, ...patch } : f));
    onPatch(block.id, { fields: updated });
  };

  const removeField = (fid: string) => {
    onPatch(block.id, { fields: fields.filter((f) => f.id !== fid) });
  };

  const moveField = (index: number, dir: -1 | 1) => {
    const nextIndex = index + dir;
    if (nextIndex < 0 || nextIndex >= fields.length) return;
    const nextFields = [...fields];
    const [moved] = nextFields.splice(index, 1);
    nextFields.splice(nextIndex, 0, moved);
    onPatch(block.id, { fields: nextFields });
  };

  return (
    <div className="space-y-3 border-t border-slate-200 pt-2.5 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Mail size={13} className="text-primary" /> Form Fields ({fields.length})
        </span>
      </div>

      {/* Field List */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {fields.map((field, idx) => (
          <div
            key={field.id}
            className="p-2 border border-slate-200 rounded-lg bg-slate-50/80 space-y-2 text-xs"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-slate-400 bg-white border border-slate-200 px-1 py-0.5 rounded shrink-0">
                {field.type}
              </span>
              <input
                type="text"
                value={field.label}
                onChange={(e) => updateField(field.id, { label: e.target.value })}
                placeholder="Field Label"
                className="flex-1 min-w-0 font-medium text-slate-800 border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => updateField(field.id, { width: field.width === "half" ? "full" : "half" })}
                title="Toggle width (Half 50% vs Full 100%)"
                className={`px-1.5 py-0.5 text-[10px] rounded border font-medium transition-colors shrink-0 ${
                  field.width === "half" ? "bg-primary-light text-primary border-primary" : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {field.width === "half" ? "50% (Half)" : "100% (Full)"}
              </button>
              <button
                type="button"
                onClick={() => moveField(idx, -1)}
                disabled={idx === 0}
                className="text-slate-400 hover:text-primary disabled:opacity-30 px-0.5"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveField(idx, 1)}
                disabled={idx === fields.length - 1}
                className="text-slate-400 hover:text-primary disabled:opacity-30 px-0.5"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeField(field.id)}
                className="text-slate-400 hover:text-red-500 shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* Field settings for select & pills */}
            {(field.type === "select" || field.type === "pills") && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                <span className="text-[11px] text-slate-500 shrink-0">Options:</span>
                <input
                  type="text"
                  value={(field.options || []).join(", ")}
                  onChange={(e) =>
                    updateField(field.id, {
                      options: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Option 1, Option 2, Option 3"
                  className="flex-1 text-[11px] border border-slate-200 rounded px-2 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
            {field.type !== "checkbox" && (
              <div className="flex items-center gap-3 pt-0.5 text-[11px] text-slate-500">
                <input
                  type="text"
                  value={field.placeholder || ""}
                  onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                  placeholder="Placeholder text..."
                  className="flex-1 text-[11px] border border-slate-200 rounded px-2 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <label className="flex items-center gap-1 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={!!field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    className="accent-primary w-3 h-3"
                  />
                  Required
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Field Buttons */}
      <div className="pt-1">
        <span className="text-[11px] text-slate-400 block mb-1 font-medium">Add field element:</span>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["text", "Text field"],
              ["email", "Email"],
              ["phone", "Phone number"],
              ["select", "Dropdown"],
              ["pills", "Pill choices"],
              ["checkbox", "Checkbox"],
              ["textarea", "Text area"],
              ["file", "File upload"],
            ] as const
          ).map(([t, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => addField(t)}
              className="text-[11px] bg-white border border-slate-200 hover:border-primary hover:text-primary text-slate-600 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
            >
              <Plus size={10} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button & Style Settings */}
      <div className="pt-2 border-t border-slate-200 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Submit button label</span>
            <input
              type="text"
              value={block.text || ""}
              onChange={(e) => onPatch(block.id, { text: e.target.value })}
              placeholder="Send message"
              className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Button style</span>
            <select
              value={block.submitStyle || "dark"}
              onChange={(e) => onPatch(block.id, { submitStyle: e.target.value as any })}
              className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="dark">Dark solid</option>
              <option value="primary">Primary blue</option>
              <option value="accent">Emerald green</option>
              <option value="gradient">Purple gradient</option>
            </select>
          </div>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block mb-1">Success message</span>
          <input
            type="text"
            value={block.successMsg || ""}
            onChange={(e) => onPatch(block.id, { successMsg: e.target.value })}
            placeholder="Thanks — we'll be in touch!"
            className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}

// ── Live preview of the navbar in the canvas (click to edit) ──────────────────
function NavPreview({ nav, onEdit }: { nav: NavConfig; onEdit: () => void }) {
  const barStyle: React.CSSProperties = nav.glass
    ? {
        background: "rgba(255,255,255,0.35)",
        backdropFilter: "saturate(180%) blur(14px)",
        WebkitBackdropFilter: "saturate(180%) blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.25)",
        color: nav.color || "#0f172a",
      }
    : { background: nav.bg || "#ffffff", color: nav.color || "#0f172a" };
  if (nav.minH) barStyle.minHeight = nav.minH;
  if (nav.radius) barStyle.borderRadius = nav.radius;
  return (
    <div
      onClick={onEdit}
      title="Click to edit navbar"
      className={`overflow-hidden border border-dashed border-slate-300 cursor-pointer hover:border-primary transition-colors ${nav.shadow ? "shadow-lg" : ""}`}
      style={{
        borderRadius: nav.radius ?? 12,
        marginTop: nav.mt ?? 0,
        marginBottom: nav.mb ?? 16,
        ...(nav.widthPct ? { maxWidth: `${nav.widthPct}%` } : {}),
        marginLeft: nav.ml != null ? nav.ml : nav.widthPct ? "auto" : undefined,
        marginRight:
          nav.mr != null ? nav.mr : nav.widthPct ? "auto" : undefined,
      }}
    >
      <div
        className="flex items-center justify-between gap-4 px-5 py-3 flex-wrap"
        style={barStyle}
      >
        <div
          className={`flex items-center justify-between gap-4 flex-wrap w-full ${nav.full || nav.widthPct ? "" : "max-w-[1100px] mx-auto"}`}
        >
          <span className="font-bold text-lg flex items-center gap-2">
            {nav.brandImg ? (
              <img src={nav.brandImg} alt="" className="h-7" />
            ) : (
              nav.brand || "Brand"
            )}
          </span>
          <div className="flex items-center gap-5 text-sm font-medium flex-wrap">
            {nav.links.length ? (
              nav.links.map((l) => (
                <span key={l.id} className="opacity-85">
                  {l.label || "Link"}
                </span>
              ))
            ) : (
              <span className="opacity-50 italic text-xs">No links yet</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Carousel block editor: an ordered list of image URLs (add / upload / remove) ─
function CarouselEditor({
  block,
  onPatch,
  siteId,
}: {
  block: Block;
  onPatch: (bid: string, patch: Partial<Block>) => void;
  siteId: string;
}) {
  const images = block.images || [];
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const setImages = (imgs: string[]) => onPatch(block.id, { images: imgs });
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const added: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadAssetAPI(siteId, fd);
        added.push(res.data.data.path);
      }
      setImages([...images, ...added]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    setImages(next);
  };
  const perView = block.perView || 1;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 mb-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
        <span className="text-[11px] font-medium text-slate-500">Images per view</span>
        <select
          value={perView}
          onChange={(e) => onPatch(block.id, { perView: Number(e.target.value) || undefined })}
          className="text-xs bg-white border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option value={1}>1 — fade</option>
          {[2, 3, 4, 5, 6].map((v) => <option key={v} value={v}>{v} — slider</option>)}
        </select>
        <span className="text-[11px] text-slate-400">{perView > 1 ? "Shows several at once, infinite slide (fewer on small screens)." : "One image at a time, cross-fade."}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
          <GalleryHorizontal size={12} /> Slides ({images.length})
        </span>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 text-[11px] text-primary hover:underline ml-auto"
        >
          {uploading ? (
            <span className="animate-spin inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <Upload size={11} />
          )}{" "}
          Upload
        </button>
        <button
          onClick={() => setImages([...images, ""])}
          className="flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          <Plus size={11} /> Add URL
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={upload}
        />
      </div>
      {images.length === 0 && (
        <p className="text-[11px] text-slate-400">
          Add at least 2 images for the slider to rotate.
        </p>
      )}
      {images.map((src, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {src ? (
            <img
              src={src}
              alt=""
              className="w-9 h-9 rounded object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <span className="w-9 h-9 rounded bg-slate-100 border border-slate-200 shrink-0" />
          )}
          <input
            value={src}
            onChange={(e) => {
              const next = [...images];
              next[i] = e.target.value;
              setImages(next);
            }}
            placeholder="Image URL"
            className="flex-1 min-w-0 text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
          <button
            onClick={() => move(i, -1)}
            disabled={i === 0}
            className="text-slate-300 hover:text-primary disabled:opacity-30 text-xs px-0.5"
          >
            ↑
          </button>
          <button
            onClick={() => move(i, 1)}
            disabled={i === images.length - 1}
            className="text-slate-300 hover:text-primary disabled:opacity-30 text-xs px-0.5"
          >
            ↓
          </button>
          <button
            onClick={() => setImages(images.filter((_, k) => k !== i))}
            className="text-slate-300 hover:text-red-500 shrink-0"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Left palette (fullscreen builder): elements, banners, and effects ─────────
function BuilderPalette({
  onAddSection,
  onAddElement,
  onAddPreset,
  onEffect,
  onGlassNav,
  layers,
  insertingInto,
}: {
  onAddSection: () => void;
  onAddElement: (t: BlockType, patch?: Partial<Block>) => void;
  onAddPreset: (k: PresetKind) => void;
  onEffect: (patch: Partial<Section>) => void;
  onGlassNav: () => void;
  layers: LayerNode[];
  insertingInto?: string;
}) {
  const elements: [BlockType, any, string][] = [
    ["heading", HeadingIcon, "Heading"],
    ["text", Type, "Text"],
    ["image", ImageIcon, "Image"],
    ["button", MousePointerClick, "Button"],
    ["form", Mail, "Form"],
    ["embed", Film, "Embed"],
    ["carousel", GalleryHorizontal, "Carousel"],
    ["tags", Tag, "Tags / pills"],
    ["tabs", Rows, "Tabs"],
    ["navbar", Menu, "Navbar"],
    ["search", Search, "Search bar"],
  ];
  // Small building blocks for composing custom cards.
  const utilities: [BlockType, any, string][] = [
    ["rating", Star, "Rating (stars)"],
    ["price", DollarSign, "Price"],
    ["tags", Tag, "Tags / pills"],
    ["button", MousePointerClick, "Button"],
  ];
  const formTemplates: [PresetKind, any, string][] = [
    ["form-split-modern", Mail, "Split Form (Untitled UI)"],
    ["form-split-agency", Columns, "Agency Form (Orfactor)"],
    ["form-survey-wizard", Rows, "Survey Step Form"],
  ];
  const presets: [PresetKind, any, string][] = [
    ["nav-simple", Menu, "Navbar"],
    ["nav-search", Search, "Navbar + search"],
    ["shader-banner", Sparkles, "Animated banner"],
    ["text-over-image", ImagePlus, "Text over image"],
    ["image-banner", ImageIcon, "Image banner"],
    ["carousel", GalleryHorizontal, "Carousel slider"],
    ["image-text", Columns, "Image + text"],
    ["footer-columns", PanelBottom, "Footer (4 columns)"],
    ["footer-simple", PanelBottom, "Footer (simple)"],
  ];
  const templates: [PresetKind, any, string][] = [
    ["showcase-card", CreditCard, "Showcase card"],
    ["overlay-cards", ImagePlus, "Image overlay cards"],
    ["reveal-cards", Sparkles, "Hover reveal cards"],
    ["multi-carousel", GalleryHorizontal, "Multi-image carousel"],
    ["product-carousel", CreditCard, "Product-card carousel"],
    ["cards-image-3", LayoutGrid, "Image-top cards"],
    ["profile-cards", ImageIcon, "Profile cards"],
    ["cards-text-3", LayoutGrid, "Text cards"],
    ["pricing-3", CreditCard, "Pricing (3 tiers)"],
    ["testimonials-3", Quote, "Testimonials"],
    ["cta", Megaphone, "Call to action"],
  ];
  const effects: {
    label: string;
    icon: any;
    patch?: Partial<Section>;
    nav?: boolean;
  }[] = [
    { label: "Glassmorphism", icon: Sparkles, patch: { glass: true } },
    {
      label: "Gradient",
      icon: Palette,
      patch: { bg: "linear-gradient(135deg,#6366f1,#ec4899)" },
    },
    { label: "Soft shadow", icon: Layers, patch: { shadow: true } },
    { label: "Rounded", icon: Square, patch: { radius: 22 } },
    {
      label: "Hero height",
      icon: MoveHorizontal,
      patch: { full: true, minH: 420 },
    },
    { label: "Glass navbar", icon: PanelTop, nav: true },
  ];
  // The lists above are unchanged; this only groups them for the panel. Each
  // entry keeps the exact handler it had, so inserting behaves identically.
  const entry = (
    key: string,
    label: string,
    icon: any,
    run: () => void,
  ): PaletteEntry => ({ key, label, icon, run });

  const categories: Record<PaletteCategory, PaletteGroup[]> = {
    Elements: [
      {
        title: "Elements",
        items: [
          ...elements.map(([t, Icon, label]) =>
            entry(`el-${t}`, label, Icon, () => onAddElement(t)),
          ),
          entry("el-marquee", "Marquee", FastForward, () =>
            onAddElement("tags", {
              marquee: true,
              text: "New\nTrending\nFeatured\nBest seller\nLimited",
            }),
          ),
        ],
      },
      {
        title: "Utilities (card parts)",
        items: utilities.map(([t, Icon, label], i) =>
          entry(`util-${t}-${i}`, label, Icon, () => onAddElement(t)),
        ),
      },
    ],
    Sections: [
      {
        title: "Banners & sections",
        items: presets.map(([k, Icon, label]) =>
          entry(`sec-${k}`, label, Icon, () => onAddPreset(k)),
        ),
      },
      {
        title: "Forms",
        items: formTemplates.map(([k, Icon, label]) =>
          entry(`form-${k}`, label, Icon, () => onAddPreset(k)),
        ),
      },
    ],
    Cards: [
      {
        title: "Card templates",
        items: templates.map(([k, Icon, label]) =>
          entry(`card-${k}`, label, Icon, () => onAddPreset(k)),
        ),
      },
    ],
    Effects: [
      {
        title: "Applies to the selected section",
        items: effects.map((e) =>
          entry(`fx-${e.label}`, e.label, e.icon, () =>
            e.nav ? onGlassNav() : onEffect(e.patch || {}),
          ),
        ),
      },
    ],
  };

  return (
    <BuilderPaletteBody
      onAddSection={onAddSection}
      categories={categories}
      layers={layers}
      insertingInto={insertingInto}
    />
  );
}

// ── Live preview of the footer in the canvas (click to edit) ──────────────────
function FooterPreview({
  footer,
  onEdit,
}: {
  footer: FooterConfig;
  onEdit: () => void;
}) {
  const barStyle: React.CSSProperties = {
    background: footer.bg || "#0f172a",
    color: footer.color || "#e2e8f0",
  };
  if (footer.minH) barStyle.minHeight = footer.minH;
  return (
    <div
      onClick={onEdit}
      title="Click to edit footer"
      className="overflow-hidden border border-dashed border-slate-300 cursor-pointer hover:border-primary transition-colors"
      style={{
        borderRadius: footer.radius ?? 12,
        marginTop: footer.mt ?? 16,
        marginBottom: footer.mb ?? 0,
        ...(footer.widthPct ? { maxWidth: `${footer.widthPct}%` } : {}),
        marginLeft:
          footer.ml != null ? footer.ml : footer.widthPct ? "auto" : undefined,
        marginRight:
          footer.mr != null ? footer.mr : footer.widthPct ? "auto" : undefined,
      }}
    >
      <div
        className="flex items-center justify-between gap-4 px-5 py-5 flex-wrap"
        style={barStyle}
      >
        <div
          className={`flex items-center justify-between gap-4 flex-wrap w-full ${footer.full || footer.widthPct ? "" : "max-w-[1100px] mx-auto"}`}
        >
          <span className="text-sm opacity-80">
            {footer.text || "© Your Company"}
          </span>
          <div className="flex items-center gap-5 text-sm font-medium flex-wrap">
            {footer.links.map((l) => (
              <span key={l.id} className="opacity-85">
                {l.label || "Link"}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
