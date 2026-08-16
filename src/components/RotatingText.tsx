import { useEffect, useState } from "react";
import { cn } from "../lib/utils";

export interface RotatingTextProps {
  words: string[];
  /** How long each word stays up, in ms. */
  interval?: number;
  /** Freeze on the first word — used for reduced-motion. */
  paused?: boolean;
  className?: string;
}

/** How far out of the clip a word sits when it is not the current one. */
const OFFSCREEN = "115%";

export default function RotatingText({
  words,
  interval = 2400,
  paused = false,
  className,
}: RotatingTextProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (paused || words.length < 2) return;
    const id = window.setInterval(() => setTick((t) => t + 1), interval);
    return () => window.clearInterval(id);
  }, [paused, words.length, interval]);

  const count = words.length;
  const active = paused || count === 0 ? 0 : tick % count;
  // The word that just left. It stays parked above the clip until its turn
  // comes round again, which costs nothing and saves running a timer to
  // decide when the exit has finished.
  const leaving = paused || count < 2 ? -1 : (tick - 1 + count) % count;

  return (
    // Every word is a grid item in the same cell, which does two jobs at once:
    // the browser sizes the box to the widest word — so it never changes width
    // and whatever sits before it, the constant "Free", never gets pushed
    // around — and the words already sit on top of each other, so sliding them
    // needs nothing but a transform. Transforms don't affect layout, so the
    // box stays put while they move, and overflow-hidden clips the travel into
    // a window.
    //
    // Every word also stays mounted for the life of the component. An earlier
    // pass swapped a single child in and out under AnimatePresence; its exit
    // never ran, so nodes piled up in the DOM and the outgoing word slid back
    // down instead of continuing up. A fixed set of nodes has no such mode.
    <span
      className={cn("inline-grid overflow-hidden align-bottom", className)}
    >
      {words.map((w, i) => {
        const isActive = i === active;
        const isLeaving = i === leaving;
        // Words waiting their turn jump straight back to the bottom of the
        // queue. That move is instant on purpose — animating it would drag
        // them down through the visible window in the wrong direction.
        const animated = isActive || isLeaving;
        const y = isActive ? "0%" : isLeaving ? `-${OFFSCREEN}` : OFFSCREEN;

        return (
          <span
            key={w}
            aria-hidden={!isActive}
            style={{
              gridArea: "1 / 1",
              transform: `translateY(${y})`,
              transition: animated
                ? "transform 500ms cubic-bezier(0.16, 1, 0.3, 1)"
                : "none",
            }}
            className="whitespace-nowrap"
          >
            {w}
          </span>
        );
      })}
    </span>
  );
}
