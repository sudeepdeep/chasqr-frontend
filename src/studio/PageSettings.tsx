import { useEffect } from "react";
import { X } from "lucide-react";
import { GOOGLE_FONTS } from "./fonts";
import { ANIMS, Anim, StudioPage } from "./types";

const field =
  "h-8 rounded-lg border border-slate-200 px-2 text-[12.5px] text-slate-700 outline-none focus:border-primary";

const Row = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-3">
    <span className="min-w-0">
      <span className="block text-[12.5px] font-medium text-slate-700">{label}</span>
      {hint && <span className="block text-[11px] leading-snug text-slate-400">{hint}</span>}
    </span>
    <span className="shrink-0">{children}</span>
  </div>
);

/**
 * Settings that belong to the whole page.
 *
 * Each of these is a default rather than a bulk edit: a section or an element
 * that sets its own value keeps it, and everything else follows the page. That
 * distinction matters — a bulk edit would overwrite the exceptions somebody
 * had deliberately made, and there would be no way back to "same as the page".
 */
export default function PageSettings({
  open,
  page,
  onChange,
  onClose,
}: {
  open: boolean;
  page: StudioPage;
  onChange: (patch: Partial<StudioPage>) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40" />

      <div className="fixed left-1/2 top-16 z-50 flex max-h-[calc(100vh-96px)] w-[400px] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,.35)]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <span className="text-[14px] font-semibold text-slate-900">Page settings</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <Row label="Font" hint="Used everywhere unless a section or element sets its own.">
            <select
              value={page.fontFamily ?? ""}
              onChange={(e) => onChange({ fontFamily: e.target.value || undefined })}
              className={`${field} w-40`}
            >
              <option value="">System default</option>
              {GOOGLE_FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </Row>

          <Row label="Page background" hint="Behind every section.">
            <input
              type="color"
              value={page.bg || "#ffffff"}
              onChange={(e) => onChange({ bg: e.target.value })}
              className="h-7 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0"
            />
          </Row>

          <Row
            label="Full width by default"
            hint="Sections span the screen instead of stopping at 1200px. A section can still choose for itself."
          >
            <input
              type="checkbox"
              checked={!!page.fullWidth}
              onChange={(e) => onChange({ fullWidth: e.target.checked || undefined })}
              className="mt-1 h-3.5 w-3.5 accent-[color:var(--primary)]"
            />
          </Row>

          <Row
            label="Scroll animation"
            hint="Applied to anything without its own. Plays on the published page, not while editing."
          >
            <select
              value={page.anim ?? ""}
              onChange={(e) => onChange({ anim: (e.target.value || undefined) as Anim })}
              className={`${field} w-32`}
            >
              <option value="">None</option>
              {ANIMS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </Row>

          <Row
            label="Phone margin"
            hint="Side gap used when a section is auto-arranged for mobile. Re-run Auto-arrange to apply it."
          >
            <span className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={60}
                value={page.padX ?? 20}
                onChange={(e) =>
                  onChange({ padX: Math.min(60, Math.max(0, Number(e.target.value))) })
                }
                className={`${field} w-16`}
              />
              <span className="text-[11px] text-slate-400">px</span>
            </span>
          </Row>
        </div>

        <p className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] leading-snug text-slate-500">
          These are defaults. Anything you set on a section or an element wins
          over them.
        </p>
      </div>
    </>
  );
}
