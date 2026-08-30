import { useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { ImageField } from "./ImageField";
import { TabItem } from "./types";

/**
 * Editing tabs, one row per tab.
 *
 * The old control was a comma-separated list of labels beside a single body
 * field, which could not express the one thing tabs exist for: different
 * content behind each label. Whatever you typed showed under every tab, so it
 * looked as though only the first one worked.
 */
export default function TabsPanel({
  open,
  siteId,
  tabs,
  onChange,
  onClose,
}: {
  open: boolean;
  siteId?: string;
  tabs: TabItem[];
  onChange: (next: TabItem[]) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const patch = (i: number, next: Partial<TabItem>) =>
    onChange(tabs.map((t, k) => (k === i ? { ...t, ...next } : t)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= tabs.length) return;
    const next = [...tabs];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const field =
    "w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[12.5px] outline-none focus:border-primary";

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40" />

      <div className="fixed left-1/2 top-16 z-50 flex max-h-[calc(100vh-96px)] w-[460px] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,.35)]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <span className="text-[14px] font-semibold text-slate-900">
            Tabs
            <span className="ml-2 font-normal text-slate-400">{tabs.length}</span>
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          {tabs.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-slate-400">
              No tabs yet. Add the first one below.
            </p>
          ) : (
            tabs.map((tab, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-semibold text-slate-500">
                    {i + 1}
                  </span>
                  <input
                    value={tab.label}
                    onChange={(e) => patch(i, { label: e.target.value })}
                    placeholder="Tab label"
                    className={`${field} font-medium`}
                  />
                  <span className="flex shrink-0 flex-col">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                      className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === tabs.length - 1}
                      aria-label="Move down"
                      className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ChevronDown size={13} />
                    </button>
                  </span>
                  <button
                    onClick={() => onChange(tabs.filter((_, k) => k !== i))}
                    aria-label="Remove tab"
                    className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* The stepper lists this beside the step number; the
                    other layouts ignore it. */}
                <input
                  value={tab.note ?? ""}
                  onChange={(e) => patch(i, { note: e.target.value })}
                  placeholder="Short note under the label (stepper only)"
                  className={`${field} mb-2`}
                />

                <input
                  value={tab.heading ?? ""}
                  onChange={(e) => patch(i, { heading: e.target.value })}
                  placeholder="Panel title"
                  className={`${field} mb-2 font-medium`}
                />

                <textarea
                  value={tab.body ?? ""}
                  onChange={(e) => patch(i, { body: e.target.value })}
                  placeholder="What belongs under this tab"
                  rows={3}
                  className={`${field} mb-2 resize-y`}
                />

                {/* Each tab carries its own picture, so switching tabs can
                    change the image as well as the words. */}
                <ImageField
                  siteId={siteId}
                  value={tab.image}
                  onChange={(image) => patch(i, { image })}
                  placeholder="Image for this tab (optional)"
                  width="w-[300px]"
                />
              </div>
            ))
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 p-3">
          <button
            onClick={() => onChange([...tabs, { label: "", body: "" }])}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2.5 text-[13px] font-medium text-slate-600 transition-colors hover:border-primary hover:text-primary"
          >
            <Plus size={15} /> Add tab
          </button>
        </div>
      </div>
    </>
  );
}
