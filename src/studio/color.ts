/**
 * Applies an alpha to a hex colour.
 *
 * Frosted glass only reads as glass if there is something to see through: a
 * fully opaque fill hides the blur behind it completely. Element opacity is
 * not the answer — it fades the text and links along with the panel. The fill
 * itself has to carry the transparency, which means turning the hex into rgba.
 */
export function withAlpha(hex?: string, alpha?: number): string | undefined {
  if (!hex) return hex;
  if (alpha === undefined || alpha >= 1) return hex;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r},${g},${b},${a})`;
}

/** The fill an element should paint, accounting for glass and any tint. */
export const fillOf = (el: { bg?: string; bgAlpha?: number; blur?: boolean }) =>
  // A bar switched to glass with no tint of its own gets a sensible default,
  // so turning the effect on does something visible straight away.
  withAlpha(el.bg, el.bgAlpha ?? (el.blur ? 0.55 : undefined));
