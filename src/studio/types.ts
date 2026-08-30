/**
 * Data model for the free-positioning editor.
 *
 * Deliberately separate from the grid builder's `layout` rather than an
 * extension of it. The two describe pages in incompatible ways — a grid block
 * has a column span and flows, a canvas element has coordinates and does not —
 * and trying to serve both from one shape is how you end up with a schema that
 * can express neither well. A page stores `canvas` or `layout`, never both.
 */

export type StudioElementType =
  | "heading"
  | "text"
  | "image"
  | "button"
  | "shape"
  | "video"
  | "icon"
  | "divider"
  | "embed"
  | "map"
  | "gallery"
  | "social"
  | "field"
  | "carousel"
  | "tags"
  | "tabs"
  | "search"
  | "rating"
  | "price"
  | "navbar"
  | "marquee"
  | "shader";

/** The input kinds a form field can take. Mirrors the grid builder's set. */
export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "file";

/** A device the layout is authored for. */
export type Breakpoint = "desktop" | "mobile";

/** One tab: how it is listed, and everything shown when it is chosen. */
export interface TabItem {
  label: string;
  /** Small line under the label — the stepper lists these beside each step. */
  note?: string;
  /** Panel title, shown above the body. */
  heading?: string;
  body?: string;
  image?: string;
}

/** How a tab's panel arrives when it is selected. */
export type TabTransition = "none" | "fade" | "slide" | "zoom";

/**
 * The shape of the tab list itself.
 *
 * Not a skin: each one puts the labels somewhere different, so the panel has
 * to lay out around them — the index runs down the left, the other two across
 * the top.
 */
export type TabVariant = "underline" | "index" | "stepper";

export const TAB_VARIANTS: TabVariant[] = ["underline", "index", "stepper"];

export const TAB_TRANSITIONS: TabTransition[] = ["none", "fade", "slide", "zoom"];

/** Anchor points offered for a background image. */
export type BgPosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top left"
  | "top right"
  | "bottom left"
  | "bottom right";

export const BG_POSITIONS: BgPosition[] = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "top left",
  "top right",
  "bottom left",
  "bottom right",
];

/** One entry in a navigation bar, optionally with a dropdown under it. */
export interface NavLink {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

/** How an element arrives when it scrolls into view on the published page. */
export type Anim = "fade" | "up" | "down" | "left" | "right" | "zoom";

export const ANIMS: Anim[] = ["fade", "up", "down", "left", "right", "zoom"];

/**
 * Coordinates are plain pixels in a fixed design space, not percentages.
 *
 * The canvas is authored at DESIGN_WIDTH and scaled to fit the viewport, so a
 * box at x:100 sits at the same place on every screen. Percentages would make
 * dragging lossy — every drag would round-trip through a division and elements
 * would creep as the window resized.
 */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const DESIGN_WIDTH: Record<Breakpoint, number> = {
  desktop: 1200,
  mobile: 390,
};

export interface StudioElement {
  id: string;
  type: StudioElementType;
  /** One box per breakpoint. Mobile is derived on first switch, then edited freely. */
  boxes: Partial<Record<Breakpoint, Box>>;
  /** Paint order. Higher sits on top; only meaningful when elements overlap. */
  z?: number;

  text?: string;
  href?: string;
  src?: string;
  alt?: string;
  /** Named lucide icon for `icon` elements. */
  icon?: string;
  /**
   * The glyph serialised at save time.
   *
   * Editor-side only until then: the backend cannot reproduce lucide geometry,
   * so the published page uses exactly what the editor drew rather than an
   * approximation of it.
   */
  iconSvg?: string;
  /** Image URLs for a `gallery`. */
  images?: string[];
  /** How a picture fills its box. Boxes default to covering, logos to fitting. */
  fit?: "cover" | "contain";
  /** Platform/URL pairs for a `social` row. */
  socials?: { icon: string; href: string }[];
  /** Filled stars, 0–5. */
  value?: number;
  /**
   * Tabs and what belongs under each one.
   *
   * Replaces a list of labels plus one shared body: that could only ever show
   * the same words whichever tab was picked, which is why comma-separated
   * content all landed in the first panel.
   */
  tabs?: TabItem[];
  tabTransition?: TabTransition;
  /** Where a tab's picture sits relative to its words. */
  tabImageSide?: "left" | "right" | "top";
  tabVariant?: TabVariant;
  /** Secondary line — a price period, a tab body, an image caption. */
  caption?: string;
  /** Navigation entries for a `navbar`, each able to carry a dropdown. */
  links?: NavLink[];
  /**
   * Pins a navigation bar to the top of the window as the page scrolls.
   *
   * Its section keeps its height, so the content below is never hidden behind
   * the bar — the bar simply stops scrolling away once it reaches the top.
   */
  sticky?: boolean;
  /** Slides visible at once in a `carousel`. */
  perView?: number;
  /** Seconds for one pass of a `marquee` or one shader cycle. */
  speed?: number;
  /** Gradient stops for a `shader` banner. */
  colors?: string[];
  /**
   * Hides this element until its section is hovered.
   *
   * Carried on the element rather than expressed as a template type, so a
   * reveal effect can be added to anything rather than only to the one card
   * layout that shipped with it.
   */
  revealOnHover?: boolean;
  /**
   * Lets the element hang outside its section instead of being clipped by it.
   *
   * What makes a picture straddle the seam between two bands, which is
   * otherwise impossible: sections clip their contents so a background image
   * cannot bleed, and that clipping catches deliberate overhangs too.
   */
  escape?: boolean;
  /** Scroll-reveal animation on the published page. Not played in the editor. */
  anim?: Anim;

  // Form fields. A field is a normal element with coordinates like any other —
  // that is what lets every field in a form template be dragged and resized
  // independently, which a nested form widget could never allow.
  fieldType?: FieldType;
  /** Submitted key. Must be unique within the section's form. */
  name?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  /** Choices for a `select` field. */
  options?: string[];
  /** Marks a button as the form's submit control rather than a link. */
  submit?: boolean;

  // Presentation. Kept as discrete fields rather than a CSS string so the
  // toolbar can read current values back — a parsed style string is guesswork.
  color?: string;
  bg?: string;
  border?: string;
  shadow?: boolean;
  /**
   * Frosts whatever sits behind the element.
   *
   * What makes a translucent bar read as glass rather than as a washed-out
   * rectangle: without the blur there is nothing for the eye to interpret as
   * a pane, only reduced contrast.
   */
  blur?: boolean;
  /**
   * Transparency of the fill alone, 0–1.
   *
   * Distinct from `opacity`, which fades the whole element including its text.
   * A glass panel needs a see-through background with fully solid content on
   * top of it.
   */
  bgAlpha?: number;
  fontSize?: number;
  /**
   * Per-breakpoint type size, falling back to `fontSize`.
   *
   * A 52px headline is unreadable at 390px wide — it wraps to six lines and
   * pushes everything below it off the section. Mobile needs its own value,
   * not a scaled copy applied at render time, or the user could never correct
   * the one case where the automatic choice is wrong.
   */
  fontSizes?: Partial<Record<Breakpoint, number>>;
  /**
   * Scales the type size as the box is resized.
   *
   * Off by default: resizing a text box usually means "give the words more
   * room to wrap", and silently changing the size would fight that. On, the
   * box and its type stay in proportion, which is what you want for a headline
   * being fitted to a space.
   */
  autoFit?: boolean;
  fontWeight?: number;
  fontFamily?: string;
  align?: "left" | "center" | "right";
  italic?: boolean;
  underline?: boolean;
  radius?: number;
  opacity?: number;
}

export interface StudioSection {
  id: string;
  /** Authored height per breakpoint, dragged from the section's bottom edge. */
  heights: Partial<Record<Breakpoint, number>>;
  bg?: string;
  bgImage?: string;
  /** Darkens a background image so text stays readable. 0–1. */
  overlay?: number;
  /** How the background image fills the section. Defaults to covering it. */
  bgFit?: "cover" | "contain" | "tile";
  /** Which part of the image is kept when it is cropped. */
  bgPosition?: BgPosition;
  /**
   * Shown after a successful submit. Only meaningful when the section holds
   * field elements — grouping by section is what ties scattered, freely placed
   * fields into one form without nesting them inside a container.
   */
  successMessage?: string;
  /**
   * Lets the design span the whole viewport instead of stopping at 1200px.
   *
   * The editor always shows the 1200px design; this changes what the published
   * page does on a wider screen — everything scales up together rather than
   * being centred with bands of background either side.
   *
   * Undefined means "follow the page", which is why it is three-state rather
   * than a plain boolean: an explicit false has to be able to override a page
   * default of true.
   */
  fullWidth?: boolean;
  /** Overrides the page font for everything in this section. */
  fontFamily?: string;
  elements: StudioElement[];
}

export interface StudioPage {
  sections: StudioSection[];
  /** Page background behind every section. */
  bg?: string;
  /** Default font. A section or element that sets its own wins over it. */
  fontFamily?: string;
  /** Default for sections that have not chosen for themselves. */
  fullWidth?: boolean;
  /** Applied to any element without its own scroll animation. */
  anim?: Anim;
  /** Side margin used when auto-arranging a section for the phone. */
  padX?: number;
}

/** The width behaviour actually in force for a section. */
export const isFullWidth = (s: StudioSection, page: StudioPage) =>
  s.fullWidth ?? !!page.fullWidth;

export const DEFAULT_SECTION_HEIGHT: Record<Breakpoint, number> = {
  desktop: 520,
  mobile: 480,
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export function emptySection(): StudioSection {
  return {
    id: uid(),
    heights: { ...DEFAULT_SECTION_HEIGHT },
    bg: "#ffffff",
    elements: [],
  };
}

/**
 * A section's height for a breakpoint, falling back to the authored desktop one.
 *
 * The default is only for sections nobody has sized yet. Reaching for it on
 * every mobile switch would turn an 88px navigation bar into a 480px band, and
 * heights are not scaled down for the same reason boxes are not: content wraps
 * taller on a phone, never shorter.
 */
export function heightFor(s: StudioSection, bp: Breakpoint): number {
  return s.heights[bp] ?? s.heights.desktop ?? DEFAULT_SECTION_HEIGHT[bp];
}

/**
 * A tabs element's panels, upgrading anything authored before they existed.
 *
 * Older elements stored labels in `options` and a single body in `caption`;
 * that shared body becomes the first panel's, since there is no way to know
 * which tab the author meant it for.
 */
export function tabsOf(el: StudioElement): TabItem[] {
  if (el.tabs?.length) return el.tabs;
  return (el.options ?? []).map((label, i) => ({
    label,
    body: i === 0 ? el.caption : "",
  }));
}

/** The type size to use at a breakpoint. */
export const fontSizeFor = (el: StudioElement, bp: Breakpoint) =>
  el.fontSizes?.[bp] ?? el.fontSize;

/** Types whose words are edited directly on the canvas. */
export const EDITABLE_TEXT: StudioElementType[] = [
  "heading",
  "text",
  "button",
  "price",
  // A box is a card as often as it is a plain panel, so it takes words too.
  "shape",
];

/**
 * Types that can be rounded, and so get corner grips when selected.
 *
 * Text is excluded: rounding a paragraph's corners does nothing visible, and a
 * grip that produces no change reads as a broken control.
 */
export const ROUNDABLE: StudioElementType[] = [
  "shape",
  // A navigation bar rounds into the floating-pill treatment.
  "navbar",
  "image",
  "button",
  "video",
  "embed",
  "map",
  "gallery",
  "carousel",
  "shader",
  "field",
  "search",
  "tags",
  "marquee",
];

/** True when the section contains anything that has to post to the form endpoint. */
export const sectionHasForm = (s: StudioSection) =>
  s.elements.some((e) => e.type === "field");

/** Sensible starting box and content for each element type. */
export function newElement(
  type: StudioElementType,
  bp: Breakpoint,
  at?: { x: number; y: number },
  extra?: Partial<StudioElement>,
): StudioElement {
  const wide = bp === "desktop";
  const defaults: Record<StudioElementType, { box: Box; extra: Partial<StudioElement> }> = {
    heading: {
      box: { x: 0, y: 0, w: wide ? 560 : 320, h: 64 },
      extra: { text: "Heading", fontSize: wide ? 44 : 32, fontWeight: 700, color: "#0F172A" },
    },
    text: {
      box: { x: 0, y: 0, w: wide ? 460 : 320, h: 72 },
      extra: { text: "A short line of text.", fontSize: 16, color: "#475569" },
    },
    image: {
      box: { x: 0, y: 0, w: wide ? 420 : 320, h: 280 },
      extra: { src: "", alt: "", radius: 12 },
    },
    button: {
      box: { x: 0, y: 0, w: 168, h: 46 },
      extra: { text: "Get started", href: "#", bg: "#2563EB", color: "#ffffff", radius: 8, fontSize: 15, fontWeight: 600 },
    },
    shape: {
      box: { x: 0, y: 0, w: wide ? 320 : 300, h: 200 },
      extra: { bg: "#E2E8F0", radius: 12 },
    },
    video: {
      box: { x: 0, y: 0, w: wide ? 560 : 340, h: 315 },
      extra: { src: "", radius: 12 },
    },
    icon: {
      box: { x: 0, y: 0, w: 56, h: 56 },
      extra: { color: "#2563EB", icon: "star" },
    },
    divider: {
      box: { x: 0, y: 0, w: wide ? 480 : 320, h: 2 },
      extra: { bg: "#E2E8F0" },
    },
    embed: {
      box: { x: 0, y: 0, w: wide ? 560 : 340, h: 320 },
      extra: { text: "", radius: 12 },
    },
    map: {
      box: { x: 0, y: 0, w: wide ? 560 : 340, h: 320 },
      extra: { text: "London", radius: 12 },
    },
    gallery: {
      box: { x: 0, y: 0, w: wide ? 720 : 340, h: 320 },
      extra: { images: [], radius: 12 },
    },
    social: {
      box: { x: 0, y: 0, w: 200, h: 40 },
      extra: {
        color: "#0F172A",
        socials: [
          { icon: "twitter", href: "#" },
          { icon: "instagram", href: "#" },
          { icon: "linkedin", href: "#" },
        ],
      },
    },
    carousel: {
      box: { x: 0, y: 0, w: wide ? 720 : 340, h: 400 },
      extra: { images: [], radius: 16 },
    },
    tags: {
      box: { x: 0, y: 0, w: wide ? 420 : 320, h: 36 },
      extra: { options: ["Design", "Build", "Ship"], bg: "#EFF6FF", color: "#2563EB", fontSize: 13, radius: 999 },
    },
    tabs: {
      box: { x: 0, y: 0, w: wide ? 560 : 340, h: 220 },
      extra: { options: ["Overview", "Details", "Pricing"], caption: "Whatever belongs under the selected tab.", color: "#0F172A", fontSize: 15 },
    },
    search: {
      box: { x: 0, y: 0, w: wide ? 420 : 320, h: 48 },
      extra: { placeholder: "Search…", bg: "#ffffff", border: "#CBD5E1", radius: 999, fontSize: 14, name: "q" },
    },
    rating: {
      box: { x: 0, y: 0, w: 140, h: 28 },
      extra: { value: 5, color: "#F59E0B" },
    },
    price: {
      box: { x: 0, y: 0, w: 220, h: 72 },
      extra: { text: "$29", caption: "per month", color: "#0F172A", fontSize: 42, fontWeight: 700 },
    },
    navbar: {
      box: { x: 0, y: 0, w: wide ? 1000 : 350, h: 64 },
      extra: {
        text: "Brand",
        links: [
          { label: "Home", href: "#" },
          { label: "About", href: "#" },
          { label: "Services", href: "#" },
          { label: "Contact", href: "#" },
        ],
        color: "#0F172A",
        fontSize: 15,
      },
    },
    marquee: {
      box: { x: 0, y: 0, w: wide ? 1000 : 350, h: 48 },
      extra: {
        options: ["New", "Trending", "Featured", "Best seller", "Limited"],
        bg: "#EFF6FF",
        color: "#2563EB",
        fontSize: 14,
        radius: 999,
        speed: 18,
      },
    },
    shader: {
      box: { x: 0, y: 0, w: wide ? 1000 : 350, h: 360 },
      extra: {
        colors: ["#2563EB", "#7C3AED", "#0EA5E9", "#0F172A"],
        speed: 1,
        radius: 16,
      },
    },
    field: {
      box: { x: 0, y: 0, w: wide ? 320 : 320, h: 74 },
      extra: {
        fieldType: "text",
        label: "Label",
        name: "field",
        placeholder: "",
        color: "#0F172A",
        bg: "#ffffff",
        border: "#CBD5E1",
        radius: 8,
        fontSize: 14,
      },
    },
  };

  const d = defaults[type];
  const design = DESIGN_WIDTH[bp];
  // Centre horizontally when dropped without a position — landing everything at
  // 0,0 stacks new elements in the corner where they cover each other.
  const box: Box = at
    ? { ...d.box, x: Math.round(at.x), y: Math.round(at.y) }
    : { ...d.box, x: Math.round((design - d.box.w) / 2), y: 48 };

  return { id: uid(), type, boxes: { [bp]: box }, z: 1, ...d.extra, ...extra };
}

/**
 * The box for a breakpoint, derived from desktop the first time mobile is used.
 *
 * Without this, switching to mobile would show an empty section: desktop
 * coordinates are meaningless at 390px wide. Scaling across gives a starting
 * arrangement that is roughly right and can then be adjusted.
 */
export function boxFor(el: StudioElement, bp: Breakpoint): Box {
  const own = el.boxes[bp];
  if (own) return own;

  const from: Breakpoint = bp === "mobile" ? "desktop" : "mobile";
  const other = el.boxes[from];
  if (!other) return { x: 0, y: 0, w: 200, h: 60 };

  const scale = DESIGN_WIDTH[bp] / DESIGN_WIDTH[from];
  return {
    x: Math.round(other.x * scale),
    y: Math.round(other.y * scale),
    w: Math.round(other.w * scale),
    // Height is not scaled: text does not get shorter on a phone, it wraps and
    // gets taller. Scaling it would clip content on every mobile switch.
    h: other.h,
  };
}
