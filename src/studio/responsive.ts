import {
  Box,
  DESIGN_WIDTH,
  StudioElement,
  StudioPage,
  StudioSection,
  boxFor,
} from "./types";

/**
 * Automatic mobile layout.
 *
 * Free positioning has one well-known cost: a desktop arrangement means
 * nothing at 390px wide. Scaling coordinates across — the obvious move — is
 * what produced the overlapping mess, because widths shrink to a third while
 * text keeps its size and wraps to six lines.
 *
 * So mobile is not a scaled desktop. It is a genuine re-layout: elements are
 * read in visual order, stacked in one column at full width, and given type
 * sizes that fit. The result is stored as ordinary mobile boxes, which means
 * every automatic decision here can be dragged afterwards — this sets a
 * sensible starting point, it does not take control away.
 */

const DEFAULT_PAD = 20;
const GAP = 20;
const INNER = 20;

/** Types laid out at their own width rather than stretched across the column. */
const INTRINSIC: StudioElement["type"][] = [
  "button",
  "icon",
  "rating",
  "social",
  "tags",
  "price",
  "search",
];

/** Types whose height should follow their width, preserving the aspect ratio. */
const ASPECT: StudioElement["type"][] = [
  "image",
  "video",
  "map",
  "embed",
  "gallery",
  "carousel",
  "shader",
];

/** Type sizes that work on a phone. Large display sizes shrink hardest. */
function mobileFontSize(fs?: number): number | undefined {
  if (!fs) return fs;
  if (fs >= 44) return Math.max(28, Math.round(fs * 0.58));
  if (fs >= 32) return Math.max(24, Math.round(fs * 0.7));
  if (fs >= 24) return Math.max(19, Math.round(fs * 0.82));
  return fs;
}

/**
 * Rough rendered height of a run of text.
 *
 * An estimate rather than a measurement because this runs while laying out,
 * before anything is in the DOM. It errs generous — a box slightly too tall
 * leaves a gap, one too short clips the words.
 */
function textHeight(text: string, fs: number, w: number, lineHeight: number) {
  const perLine = Math.max(1, Math.floor(w / (fs * 0.52)));
  const lines = (text || " ")
    .split("\n")
    .reduce((n, line) => n + Math.max(1, Math.ceil(line.length / perLine)), 0);
  return Math.ceil(lines * fs * lineHeight) + 6;
}

const contains = (outer: Box, inner: Box) =>
  outer.x <= inner.x + 2 &&
  outer.y <= inner.y + 2 &&
  outer.x + outer.w >= inner.x + inner.w - 2 &&
  outer.y + outer.h >= inner.y + inner.h - 2;

/**
 * Small square images — avatars, logos, badges — keep their size.
 *
 * Stretching one to the full column turns a 96px portrait into a 350px slab
 * and buries the name under it, which is the opposite of what the card meant.
 */
const isBadge = (el: StudioElement, d: Box) =>
  el.type === "image" && d.w <= 200 && d.h / Math.max(1, d.w) >= 0.8;

/** Height an element needs once it is `w` wide on a phone. */
function heightAt(el: StudioElement, desktop: Box, w: number, fs?: number): number {
  if (ASPECT.includes(el.type)) {
    const ratio = desktop.w > 0 ? desktop.h / desktop.w : 0.7;
    // A wide desktop banner would otherwise become a 140px sliver on a phone.
    return Math.min(460, Math.max(180, Math.round(w * ratio)));
  }
  if (el.type === "heading") return textHeight(el.text || "Heading", fs || 28, w, 1.2);
  if (el.type === "text") return textHeight(el.text || "Text", fs || 16, w, 1.6);
  if (el.type === "price") return Math.round((fs || 34) * 1.2) + 24;
  if (el.type === "field") {
    // A message box stays a message box; every other input is one line tall.
    return el.fieldType === "textarea" ? Math.max(120, desktop.h) : el.fieldType === "checkbox" ? 40 : 74;
  }
  if (el.type === "divider") return Math.max(1, desktop.h);
  // A horizontal navigation cannot stay horizontal at 350px, so it becomes the
  // stacked list a phone menu would show once opened.
  if (el.type === "navbar") return 56 + (el.links?.length ?? 0) * 40;
  return desktop.h;
}

/** True once anything in the section has been positioned for mobile. */
export const hasMobileLayout = (s: StudioSection) =>
  s.elements.some((e) => !!e.boxes.mobile);

/**
 * Re-lay a section for mobile, returning a new section.
 *
 * Elements sitting inside a background shape are kept with it, so a card does
 * not separate from its own contents — that grouping is the difference between
 * a stacked page and a pile of loose text.
 */
export function reflowMobile(section: StudioSection, padX?: number): StudioSection {
  const W = DESIGN_WIDTH.mobile;
  const PAD = Math.min(60, Math.max(0, padX ?? DEFAULT_PAD));
  const col = W - PAD * 2;

  const desktop = new Map<string, Box>();
  section.elements.forEach((el) => desktop.set(el.id, boxFor(el, "desktop")));

  // Only shapes act as containers. Letting images swallow their overlay text
  // would nest a headline inside a photo and shrink it to the photo's width.
  const containerIds = new Set<string>();
  const childOf = new Map<string, string>();

  section.elements.forEach((outer) => {
    if (outer.type !== "shape") return;
    const ob = desktop.get(outer.id)!;
    section.elements.forEach((inner) => {
      if (inner.id === outer.id) return;
      const ib = desktop.get(inner.id)!;
      if (!contains(ob, ib)) return;
      // Nested shapes would fight over the same child; the tighter one wins.
      const current = childOf.get(inner.id);
      if (current) {
        const cb = desktop.get(current)!;
        if (cb.w * cb.h <= ob.w * ob.h) return;
      }
      childOf.set(inner.id, outer.id);
      containerIds.add(outer.id);
    });
  });

  const byReadingOrder = (a: StudioElement, b: StudioElement) => {
    const ab = desktop.get(a.id)!;
    const bb = desktop.get(b.id)!;
    // Elements within ~40px vertically read as one row, so x decides.
    if (Math.abs(ab.y - bb.y) > 40) return ab.y - bb.y;
    return ab.x - bb.x;
  };

  type Group = { lead: StudioElement; container?: StudioElement; children: StudioElement[] };

  const groups: Group[] = [];
  section.elements
    .filter((el) => !childOf.has(el.id))
    .sort(byReadingOrder)
    .forEach((el) => {
      if (containerIds.has(el.id)) {
        const children = section.elements
          .filter((c) => childOf.get(c.id) === el.id)
          .sort(byReadingOrder);
        groups.push({ lead: el, container: el, children });
      } else {
        groups.push({ lead: el, children: [el] });
      }
    });

  const boxes = new Map<string, Box>();
  const sizes = new Map<string, number | undefined>();

  const place = (el: StudioElement, x: number, y: number, avail: number): number => {
    const d = desktop.get(el.id)!;
    const fs = mobileFontSize(el.fontSizes?.mobile ?? el.fontSize);
    sizes.set(el.id, fs);

    // Buttons, icons and pills keep their natural size; everything else fills
    // the column, because a half-width paragraph on a phone is just a worse
    // paragraph.
    const badge = isBadge(el, d);
    let w = INTRINSIC.includes(el.type) || badge ? Math.min(d.w, avail) : avail;
    if (el.type === "divider") w = avail;

    const h = badge ? Math.round(d.h * (w / d.w)) : heightAt(el, d, w, fs);
    // Centred content stays centred; a badge always centres, because a lone
    // small image in a stacked column reads as an avatar, not as a margin note.
    const cx =
      el.align === "center" || badge ? Math.round(x + (avail - w) / 2) : x;
    boxes.set(el.id, { x: cx, y, w, h });
    return h;
  };

  let cursor = 28;
  groups.forEach((g, i) => {
    if (g.container) {
      const innerX = PAD + INNER;
      const innerW = col - INNER * 2;
      let inner = cursor + INNER;
      g.children.forEach((child, k) => {
        const h = place(child, innerX, inner, innerW);
        inner += h + (k === g.children.length - 1 ? 0 : 14);
      });
      const height = inner + INNER - cursor;
      boxes.set(g.container.id, { x: PAD, y: cursor, w: col, h: height });
      cursor += height;
    } else {
      cursor += place(g.lead, PAD, cursor, col);
    }
    if (i !== groups.length - 1) cursor += GAP;
  });

  return {
    ...section,
    heights: { ...section.heights, mobile: cursor + 28 },
    elements: section.elements.map((el) => {
      const box = boxes.get(el.id);
      if (!box) return el;
      const fs = sizes.get(el.id);
      return {
        ...el,
        boxes: { ...el.boxes, mobile: box },
        fontSizes: fs ? { ...el.fontSizes, mobile: fs } : el.fontSizes,
      };
    }),
  };
}

/**
 * Give every section a mobile layout it does not already have.
 *
 * Sections already arranged by hand are left alone — regenerating them would
 * throw away the user's corrections every time they switched device.
 */
export function ensureMobileLayout(page: StudioPage): StudioPage {
  if (page.sections.every(hasMobileLayout)) return page;
  return {
    ...page,
    sections: page.sections.map((s) =>
      hasMobileLayout(s) ? s : reflowMobile(s, page.padX),
    ),
  };
}
