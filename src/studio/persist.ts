import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { updateCanvasAPI } from "../api/site.api";
import { ICONS } from "./icons";
import { StudioElement, StudioPage } from "./types";

/**
 * Turning an edited page into something the server can render.
 *
 * The one non-obvious step is icons. The editor draws them with lucide
 * components, and the backend has no way to reproduce that geometry — shipping
 * a hand-drawn approximation would mean the published page quietly differed
 * from the one the user approved. Serialising the glyph the editor actually
 * drew removes the question entirely, at the cost of a few hundred bytes per
 * icon.
 */
function withIconSvg(el: StudioElement): StudioElement {
  if (el.type !== "icon") return el;
  const Icon = ICONS[el.icon || "star"] || ICONS.star;
  if (!Icon) return el;
  const svg = renderToStaticMarkup(
    createElement(Icon, {
      width: "100%",
      height: "100%",
      color: "currentColor",
      strokeWidth: 1.75,
    }),
  );
  return { ...el, iconSvg: svg };
}

/** The page as it should be stored — nothing editor-only travels with it. */
export function serializeCanvas(page: StudioPage): StudioPage {
  return {
    ...page,
    sections: page.sections.map((s) => ({
      ...s,
      elements: s.elements.map(withIconSvg),
    })),
  };
}

export async function saveCanvas(siteId: string, filename: string, page: StudioPage) {
  return updateCanvasAPI(siteId, filename, serializeCanvas(page));
}
