import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { resolveAsset } from "./assetUrl";
import { fontStack } from "./fonts";
import StudioElementView, { Corner, Handle, SelectionChrome } from "./StudioElementView";
import {
  Box,
  Breakpoint,
  DESIGN_WIDTH,
  StudioElement,
  StudioPage,
  StudioSection,
  boxFor,
  fontSizeFor,
  heightFor,
} from "./types";

/**
 * Keyframes for the animated-banner preview.
 *
 * A style tag rather than a Tailwind utility because the animation is only ever
 * used by one element type, and adding it to the global config would ship it to
 * every page in the app.
 */
const SHADER_KEYFRAMES = `@keyframes cq-shader{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}`;

/** Elements snap to this grid, and to each other's edges within this distance. */
const GRID = 8;
const SNAP = 6;

type Drag =
  | { kind: "move"; sectionId: string; ids: string[]; startX: number; startY: number; origin: Record<string, Box> }
  | {
      kind: "resize";
      sectionId: string;
      id: string;
      handle: Handle;
      startX: number;
      startY: number;
      origin: Box;
      /** Type size when the drag began, so scaling never compounds. */
      originFont?: number;
    }
  | { kind: "section"; sectionId: string; startY: number; origin: number }
  | { kind: "radius"; sectionId: string; id: string; corner: Corner; startX: number; startY: number; origin: number; limit: number };

const snap = (v: number) => Math.round(v / GRID) * GRID;

/**
 * The editing surface.
 *
 * Authored at a fixed design width and scaled to fit, so coordinates mean the
 * same thing on any monitor. Every pointer delta is divided by that scale
 * before being applied — without it, dragging on a scaled-down canvas moves the
 * element further than the cursor, which feels broken within about a second.
 */
export default function StudioCanvas({
  page,
  bp,
  selection,
  editingId,
  onSelectionChange,
  onChange,
  onAddSection,
  onOpenAdd,
  onEditText,
  onCommitText,
  onGestureEnd,
  base,
}: {
  page: StudioPage;
  bp: Breakpoint;
  selection: { sectionId: string | null; elementIds: string[] };
  /** The element whose text is being typed into, if any. */
  editingId: string | null;
  onSelectionChange: (s: { sectionId: string | null; elementIds: string[] }) => void;
  /** `continuous` marks an edit mid-drag, so history records one entry per drag. */
  onChange: (next: StudioPage, continuous?: boolean) => void;
  /** Adds a section; the picker opens on it unless told otherwise. */
  onAddSection: (afterId?: string, openPicker?: boolean) => void;
  onOpenAdd: (sectionId: string) => void;
  onEditText: (sectionId: string, elementId: string) => void;
  onCommitText: (sectionId: string, elementId: string, text: string) => void;
  /** Where this site's own files are served from, for resolving uploads. */
  base?: string;
  /** Called when a drag finishes, closing the current history entry. */
  onGestureEnd: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const drag = useRef<Drag | null>(null);
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });

  const design = DESIGN_WIDTH[bp];

  // Fit the design width to the available space, never enlarging past 1:1.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const avail = el.clientWidth - 64;
      setScale(Math.min(1, Math.max(0.25, avail / design)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [design]);

  const patchSection = useCallback(
    (id: string, patch: Partial<StudioSection>) =>
      onChange(
        {
          ...page,
          sections: page.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        },
        true,
      ),
    [page, onChange],
  );

  const patchBoxes = useCallback(
    (sectionId: string, boxes: Record<string, Box>) => {
      onChange(
        {
          ...page,
          sections: page.sections.map((s) =>
            s.id !== sectionId
              ? s
              : {
                  ...s,
                  elements: s.elements.map((el) =>
                    boxes[el.id] ? { ...el, boxes: { ...el.boxes, [bp]: boxes[el.id] } } : el,
                  ),
                },
          ),
        },
        true,
      );
    },
    [page, onChange, bp],
  );

  const patchElement = useCallback(
    (sectionId: string, id: string, patch: Partial<StudioElement>) => {
      onChange(
        {
          ...page,
          sections: page.sections.map((s) =>
            s.id !== sectionId
              ? s
              : { ...s, elements: s.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)) },
          ),
        },
        true,
      );
    },
    [page, onChange],
  );

  /**
   * Box and type size in a single update.
   *
   * Two separate calls would each be built from the same `page` in this
   * closure, so whichever landed second would discard the other's change.
   */
  const patchResize = useCallback(
    (sectionId: string, id: string, box: Box, fontSize?: number) => {
      onChange(
        {
          ...page,
          sections: page.sections.map((s) =>
            s.id !== sectionId
              ? s
              : {
                  ...s,
                  elements: s.elements.map((el) => {
                    if (el.id !== id) return el;
                    const next: StudioElement = {
                      ...el,
                      boxes: { ...el.boxes, [bp]: box },
                    };
                    if (fontSize !== undefined) {
                      if (bp === "desktop") next.fontSize = fontSize;
                      else next.fontSizes = { ...el.fontSizes, [bp]: fontSize };
                    }
                    return next;
                  }),
                },
          ),
        },
        true,
      );
    },
    [page, onChange, bp],
  );

  /** Edges of everything except the dragged elements, for snapping. */
  const snapTargets = (section: StudioSection, ignore: string[]) => {
    const xs: number[] = [0, design / 2, design];
    const ys: number[] = [0];
    section.elements.forEach((el) => {
      if (ignore.includes(el.id)) return;
      const b = boxFor(el, bp);
      xs.push(b.x, b.x + b.w / 2, b.x + b.w);
      ys.push(b.y, b.y + b.h / 2, b.y + b.h);
    });
    return { xs, ys };
  };

  const applySnap = (value: number, targets: number[]) => {
    let best = value;
    let dist = SNAP;
    targets.forEach((t) => {
      const d = Math.abs(t - value);
      if (d < dist) {
        dist = d;
        best = t;
      }
    });
    return { value: best, hit: dist < SNAP ? best : null };
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      e.preventDefault();

      // Screen pixels → design pixels. Everything downstream is design space.
      const dy = (e.clientY - d.startY) / scale;

      if (d.kind === "section") {
        const next = Math.max(120, Math.round(d.origin + dy));
        patchSection(d.sectionId, {
          heights: {
            ...(page.sections.find((s) => s.id === d.sectionId)?.heights ?? {}),
            [bp]: next,
          },
        });
        return;
      }

      // Only the element drags carry an x origin, so it is read after the
      // section branch has returned.
      const dx = (e.clientX - d.startX) / scale;

      if (d.kind === "radius") {
        // Every corner drags toward the middle of the box, so the sign of each
        // axis depends on which one is being held.
        const sx = d.corner === "nw" || d.corner === "sw" ? 1 : -1;
        const sy = d.corner === "nw" || d.corner === "ne" ? 1 : -1;
        const next = Math.round(d.origin + (sx * dx + sy * dy) / 2);
        // Half the shorter side is a full pill; past that the shape stops
        // changing and the grip would feel dead.
        patchElement(d.sectionId, d.id, { radius: Math.max(0, Math.min(d.limit, next)) });
        return;
      }

      const section = page.sections.find((s) => s.id === d.sectionId);
      if (!section) return;

      if (d.kind === "move") {
        const { xs, ys } = snapTargets(section, d.ids);
        const next: Record<string, Box> = {};
        const gx: number[] = [];
        const gy: number[] = [];

        d.ids.forEach((id) => {
          const o = d.origin[id];
          if (!o) return;
          let x = snap(o.x + dx);
          let y = snap(o.y + dy);

          // Snap whichever edge is closest, so an element can align by its left,
          // centre or right without the user choosing a mode.
          const left = applySnap(x, xs);
          const centre = applySnap(x + o.w / 2, xs);
          const right = applySnap(x + o.w, xs);
          if (left.hit !== null) { x = left.value; gx.push(left.value); }
          else if (centre.hit !== null) { x = centre.value - o.w / 2; gx.push(centre.value); }
          else if (right.hit !== null) { x = right.value - o.w; gx.push(right.value); }

          const top = applySnap(y, ys);
          const midY = applySnap(y + o.h / 2, ys);
          const bottom = applySnap(y + o.h, ys);
          if (top.hit !== null) { y = top.value; gy.push(top.value); }
          else if (midY.hit !== null) { y = midY.value - o.h / 2; gy.push(midY.value); }
          else if (bottom.hit !== null) { y = bottom.value - o.h; gy.push(bottom.value); }

          const el = section.elements.find((e) => e.id === id);
          next[id] = { ...o, x, y: el?.escape ? y : Math.max(0, y) };
        });

        setGuides({ x: gx, y: gy });
        patchBoxes(d.sectionId, next);
        return;
      }

      // Resize. Each handle moves the edges it touches and leaves the rest.
      const o = d.origin;
      let { x, y, w, h } = o;
      if (d.handle.includes("e")) w = o.w + dx;
      if (d.handle.includes("s")) h = o.h + dy;
      if (d.handle.includes("w")) { x = o.x + dx; w = o.w - dx; }
      if (d.handle.includes("n")) { y = o.y + dy; h = o.h - dy; }

      // A minimum stops an element being resized to nothing, which leaves no
      // handle big enough to grab and no way to recover it.
      w = Math.max(24, snap(w));
      h = Math.max(24, snap(h));
      const resized = section.elements.find((e) => e.id === d.id);
      const box: Box = {
        x: snap(x),
        y: resized?.escape ? snap(y) : Math.max(0, snap(y)),
        w,
        h,
      };

      // Whichever axis was dragged further decides the scale: pulling only the
      // right edge should still resize the type, and so should pulling only
      // the bottom one.
      let fontSize: number | undefined;
      if (resized?.autoFit && d.originFont) {
        const rw = o.w > 0 ? w / o.w : 1;
        const rh = o.h > 0 ? h / o.h : 1;
        const ratio = Math.abs(rw - 1) >= Math.abs(rh - 1) ? rw : rh;
        fontSize = Math.max(8, Math.min(400, Math.round(d.originFont * ratio)));
      }

      patchResize(d.sectionId, d.id, box, fontSize);
    };

    const up = () => {
      if (!drag.current) return;
      drag.current = null;
      setGuides({ x: [], y: [] });
      document.body.style.userSelect = "";
      // Closes the history entry this drag has been writing into.
      onGestureEnd();
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [page, scale, bp, patchBoxes, patchSection, patchElement, patchResize, onGestureEnd]);

  const beginMove = (section: StudioSection, elementId: string, e: React.PointerEvent) => {
    const ids = selection.elementIds.includes(elementId) ? selection.elementIds : [elementId];
    const origin: Record<string, Box> = {};
    section.elements.forEach((el) => {
      if (ids.includes(el.id)) origin[el.id] = boxFor(el, bp);
    });
    drag.current = { kind: "move", sectionId: section.id, ids, startX: e.clientX, startY: e.clientY, origin };
    document.body.style.userSelect = "none";
  };

  return (
    <div ref={hostRef} className="h-full overflow-auto bg-slate-100 py-8">
      <style>{SHADER_KEYFRAMES}</style>
      <div
        style={{
          width: design,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          // Reclaim the space the transform visually removes, or the page keeps
          // the untransformed height and scrolls past the end of the content.
          marginBottom: (scale - 1) * 400,
        }}
        className="mx-auto"
      >
        {page.sections.map((section, i) => {
          const height = heightFor(section, bp);
          const isSectionSelected =
            selection.sectionId === section.id && selection.elementIds.length === 0;

          return (
            <div key={section.id}>
              <div
                onPointerDown={() =>
                  onSelectionChange({ sectionId: section.id, elementIds: [] })
                }
                style={{
                  height,
                  // Set here so every element inherits it; an element with its
                  // own family simply overrides in the usual way.
                  fontFamily: fontStack(section.fontFamily ?? page.fontFamily),
                  // The colour stays underneath even with an image, so a
                  // "contain" background has something to sit on.
                  background: section.bg || "#fff",
                }}
                className={`relative ${
                  // Clipping is what stops a background image bleeding, but it
                  // also catches deliberate overhangs — so it is lifted for a
                  // section that holds one.
                  section.elements.some((e) => e.escape) ? "" : "overflow-hidden"
                } ${isSectionSelected ? "outline outline-2 outline-primary" : ""}`}
              >
                {/* An image layer rather than a CSS background, because that is
                    exactly what the published page uses — one mechanism means
                    the editor cannot disagree with the result. */}
                {section.bgImage &&
                  (section.bgFit === "tile" ? (
                    <div
                      style={{
                        backgroundImage: `url(${resolveAsset(section.bgImage, base)})`,
                        backgroundRepeat: "repeat",
                        backgroundPosition: section.bgPosition || "center",
                      }}
                      className="pointer-events-none absolute inset-0"
                    />
                  ) : (
                    <img
                      src={resolveAsset(section.bgImage, base)}
                      alt=""
                      style={{
                        objectFit: section.bgFit === "contain" ? "contain" : "cover",
                        objectPosition: section.bgPosition || "center",
                      }}
                      className="pointer-events-none absolute inset-0 h-full w-full"
                    />
                  ))}

                {section.bgImage && !!section.overlay && (
                  <div
                    style={{ background: `rgba(15,23,42,${section.overlay})` }}
                    className="pointer-events-none absolute inset-0"
                  />
                )}

                {section.elements.map((el) => (
                  <StudioElementView
                    key={el.id}
                    el={el}
                    bp={bp}
                    box={boxFor(el, bp)}
                    selected={selection.elementIds.includes(el.id)}
                    editing={editingId === el.id}
                    base={base}
                    surface={section.bg}
                    onSelect={(additive) =>
                      onSelectionChange({
                        sectionId: section.id,
                        elementIds: additive
                          ? Array.from(new Set([...selection.elementIds, el.id]))
                          : [el.id],
                      })
                    }
                    onDragStart={(e) => beginMove(section, el.id, e)}
                    onDoubleClick={() => onEditText(section.id, el.id)}
                    onCommitText={(text) => onCommitText(section.id, el.id, text)}
                  />
                ))}

                {/* Drawn after every element, so a selected background keeps
                    its own place in the stack and its handles still clear
                    whatever is layered on top of it. */}
                {section.elements
                  .filter((el) => selection.elementIds.includes(el.id) && editingId !== el.id)
                  .map((el) => (
                    <SelectionChrome
                      key={`chrome-${el.id}`}
                      el={el}
                      box={boxFor(el, bp)}
                      onResizeStart={(e, handle) => {
                        drag.current = {
                          kind: "resize",
                          sectionId: section.id,
                          id: el.id,
                          handle,
                          startX: e.clientX,
                          startY: e.clientY,
                          origin: boxFor(el, bp),
                          originFont: fontSizeFor(el, bp),
                        };
                        document.body.style.userSelect = "none";
                      }}
                      onRadiusStart={(e, corner) => {
                        const b = boxFor(el, bp);
                        drag.current = {
                          kind: "radius",
                          sectionId: section.id,
                          id: el.id,
                          corner,
                          startX: e.clientX,
                          startY: e.clientY,
                          origin: el.radius ?? 0,
                          limit: Math.floor(Math.min(b.w, b.h) / 2),
                        };
                        document.body.style.userSelect = "none";
                      }}
                    />
                  ))}

                {/* Alignment guides, drawn only while a drag is snapping. */}
                {guides.x.map((x, k) => (
                  <div key={`gx${k}`} style={{ left: x }} className="pointer-events-none absolute inset-y-0 w-px bg-pink-500" />
                ))}
                {guides.y.map((y, k) => (
                  <div key={`gy${k}`} style={{ top: y }} className="pointer-events-none absolute inset-x-0 h-px bg-pink-500" />
                ))}

                {section.elements.length === 0 && (
                  <button
                    onClick={() => onOpenAdd(section.id)}
                    className="absolute inset-0 m-auto flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400 transition-colors hover:bg-primary-light/30 hover:text-primary"
                  >
                    <Plus size={22} />
                    <span className="text-[13px] font-medium">Add elements, or start from a template</span>
                  </button>
                )}

                {isSectionSelected && (
                  <span className="pointer-events-none absolute left-0 top-0 bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">
                    Section {i + 1}
                  </span>
                )}
              </div>

              {/* Height grip. Dragging the edge is how heights are set here —
                  a slider makes you guess, then look, then guess again. */}
              <div
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.stopPropagation();
                  drag.current = {
                    kind: "section",
                    sectionId: section.id,
                    startY: e.clientY,
                    origin: height,
                  };
                  document.body.style.userSelect = "none";
                }}
                className="group relative flex h-4 cursor-ns-resize items-center justify-center bg-slate-100"
              >
                <span className="h-1 w-16 rounded-full bg-slate-300 transition-colors group-hover:bg-primary" />
              </div>

              <div className="flex items-center gap-2 bg-slate-100 py-2">
                <span className="h-px flex-1 bg-slate-200" />
                <button
                  onClick={() => onAddSection(section.id)}
                  className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-600 transition-colors hover:border-primary hover:text-primary"
                >
                  <Plus size={13} /> Add Section
                </button>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            </div>
          );
        })}

        {page.sections.length === 0 && (
          <button
            onClick={() => onAddSection()}
            className="flex h-[420px] w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 bg-white text-slate-400 transition-colors hover:border-primary hover:text-primary"
          >
            <Plus size={26} />
            <span className="text-sm font-medium">Add your first section</span>
            <span className="text-[12px] text-slate-400">
              Pick elements or a ready-made block
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
