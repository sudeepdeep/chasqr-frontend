import { useCallback, useEffect, useRef, useState } from "react";
import { GripHorizontal } from "lucide-react";

const KEY = "chasqr_builder_split";

/**
 * Two stacked panes with a draggable divider between them.
 *
 * The builder needs both at once — the editor to change things and the preview
 * to see the result — but how much of each depends on the job. Laying out a
 * page wants a tall editor; tuning padding wants a tall preview. So the split
 * is the user's to set, and it persists: nobody wants to re-drag it on every
 * page load.
 */
export default function SplitPane({
  top,
  bottom,
  bottomLabel,
}: {
  top: React.ReactNode;
  bottom: React.ReactNode;
  /** Shown on the divider, so the lower pane is self-explanatory. */
  bottomLabel?: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [bottomPct, setBottomPct] = useState<number>(() => {
    const saved = Number(localStorage.getItem(KEY));
    return saved >= 15 && saved <= 80 ? saved : 40;
  });
  const dragging = useRef(false);

  const onMove = useCallback((clientY: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const fromBottom = rect.bottom - clientY;
    // Clamped so neither pane can be dragged away entirely — a zero-height
    // pane looks like a bug and there is no obvious way back from it.
    const pct = Math.min(80, Math.max(15, (fromBottom / rect.height) * 100));
    setBottomPct(pct);
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      onMove(e.clientY);
    };
    const touch = (e: TouchEvent) => {
      if (!dragging.current || !e.touches[0]) return;
      onMove(e.touches[0].clientY);
    };
    const stop = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      localStorage.setItem(KEY, String(Math.round(bottomPct)));
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", touch, { passive: false });
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("touchmove", touch);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
    };
  }, [onMove, bottomPct]);

  const start = () => {
    dragging.current = true;
    // Set on the body, not the handle: the pointer regularly leaves the 8px
    // divider mid-drag, and without this the cursor flickers and text on the
    // page underneath starts selecting.
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div ref={wrapRef} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">{top}</div>

      <div
        onMouseDown={start}
        onTouchStart={start}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize preview"
        className="group flex h-7 shrink-0 cursor-row-resize items-center gap-2 border-y border-slate-200 bg-slate-50 px-3 select-none hover:bg-slate-100"
      >
        <GripHorizontal
          size={13}
          className="text-slate-300 group-hover:text-slate-500"
        />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {bottomLabel ?? "Live preview"}
        </span>
        <span className="ml-auto text-[10.5px] text-slate-300">
          drag to resize
        </span>
      </div>

      <div style={{ height: `${bottomPct}%` }} className="min-h-0 shrink-0">
        {bottom}
      </div>
    </div>
  );
}
