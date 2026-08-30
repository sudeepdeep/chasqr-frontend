import { useEffect } from "react";

/**
 * The families offered, matching the grid builder's list exactly.
 *
 * An allowlist rather than free text: the name is interpolated into a
 * fonts.googleapis.com URL and into a CSS declaration, so anything not on this
 * list is dropped rather than escaped.
 */
export const GOOGLE_FONTS = [
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

const FONT_SET = new Set(GOOGLE_FONTS);
const SERIF = new Set(["Merriweather", "Playfair Display", "Lora"]);

export const safeFont = (f?: string) => (f && FONT_SET.has(f.trim()) ? f.trim() : null);

/** A fallback so text still reads well before the webfont arrives. */
export const fontStack = (f?: string) => {
  const name = safeFont(f);
  if (!name) return undefined;
  return `${name}, ${SERIF.has(name) ? "Georgia, serif" : "system-ui, sans-serif"}`;
};

/**
 * Loads the families in use into the editor.
 *
 * Without this the canvas would preview in the system font while the published
 * page used the chosen one — the editor would be quietly lying about the
 * result. One link element, rewritten as the set of families changes.
 */
export function useGoogleFonts(families: (string | undefined)[]) {
  const list = Array.from(
    new Set(families.map(safeFont).filter(Boolean) as string[]),
  ).sort();
  const key = list.join(",");

  useEffect(() => {
    if (!key) return;
    const href =
      "https://fonts.googleapis.com/css2?" +
      key
        .split(",")
        .map((f) => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700`)
        .join("&") +
      "&display=swap";

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [key]);
}
