import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  caption?: string;
  onClose: () => void;
}

/**
 * Full-screen viewer for a screenshot.
 *
 * Rendered through a portal on purpose. The pinned chapter stage that opens
 * this lives inside a `sticky` container with `overflow-hidden`, and the page
 * root carries `overflow-x-clip` — both of which clip a dialog rendered in
 * place, `position: fixed` or not. Mounting on document.body sidesteps every
 * ancestor's clipping and stacking context.
 */
export default function ImageLightbox({
  src,
  alt = "",
  caption,
  onClose,
}: ImageLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape to close, and hold the page still underneath so scrolling the
  // wheel doesn't drag the pinned stage along behind the overlay.
  useEffect(() => {
    if (!src) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [src, onClose]);

  // Unmounted outright when closed, rather than animated out under
  // AnimatePresence. An exit animation that fails to finish leaves this
  // overlay in the DOM at opacity 0 with pointer-events still auto — an
  // invisible sheet over the whole page that swallows every click. Losing a
  // 180ms fade is a fair price for that never being possible.
  if (!src) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt || "Screenshot"}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 sm:p-8"
    >
      <button
        ref={closeRef}
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X size={20} />
      </button>

      <motion.figure
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        // Clicks inside the figure must not reach the backdrop handler, or
        // dragging to read the image would dismiss it.
        onClick={(e) => e.stopPropagation()}
        className="max-h-full w-full max-w-6xl"
      >
        <div className="overflow-hidden rounded-xl bg-[#1d1f21] shadow-2xl">
          <div className="flex items-center gap-2 border-b border-black/40 bg-[#2c2f31] px-4 h-10">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <img
            src={src}
            alt={alt}
            className="mx-auto max-h-[80vh] w-auto max-w-full bg-white object-contain"
          />
        </div>
        {caption && (
          <figcaption className="mt-4 text-center text-sm text-white/60">
            {caption}
          </figcaption>
        )}
      </motion.figure>
    </motion.div>,
    document.body,
  );
}
