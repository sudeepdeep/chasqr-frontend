import { useEffect } from "react";
import { ChevronDown, ChevronUp, CornerDownRight, Plus, X } from "lucide-react";

export interface LinkRow {
  label: string;
  href: string;
  /** Dropdown entries. Only navigation uses these; social rows never do. */
  children?: { label: string; href: string }[];
}

/**
 * Editing a list of links one row at a time.
 *
 * Social icons and navigation entries are both a label paired with a URL, and
 * neither survives being flattened into a comma-separated string: doing that
 * left the URLs unreachable, so every social circle pointed at "#" with no way
 * to change it. A row per link is the only shape that lets both halves be
 * edited.
 */
export default function LinkPanel({
  open,
  title,
  rows,
  labelPlaceholder,
  labelOptions,
  nested,
  onChange,
  onClose,
}: {
  open: boolean;
  title: string;
  rows: LinkRow[];
  labelPlaceholder: string;
  /** Suggestions offered while still allowing anything to be typed. */
  labelOptions?: string[];
  /** Allows a dropdown of sub-items under each row. */
  nested?: boolean;
  onChange: (next: LinkRow[]) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const listId = `cq-opts-${title.replace(/\W+/g, "")}`;
  const patch = (i: number, next: Partial<LinkRow>) =>
    onChange(rows.map((r, k) => (k === i ? { ...r, ...next } : r)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const field =
    "h-8 w-full rounded-lg border border-slate-200 px-2 text-[12.5px] outline-none focus:border-primary";

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40" />

      <div className="fixed left-1/2 top-16 z-50 flex max-h-[calc(100vh-96px)] w-[420px] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,.35)]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <span className="text-[14px] font-semibold text-slate-900">{title}</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {labelOptions && (
            <datalist id={listId}>
              {labelOptions.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          )}

          {rows.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-slate-400">
              Nothing here yet. Add the first one below.
            </p>
          ) : (
            <div className="space-y-3">
              {rows.map((row, i) => (
                <div key={i}>
                  <div className="flex items-center gap-1.5">
                    <input
                      value={row.label}
                      list={labelOptions ? listId : undefined}
                      onChange={(e) => patch(i, { label: e.target.value })}
                      placeholder={labelPlaceholder}
                      className={`${field} w-[120px] shrink-0`}
                    />
                    <input
                      value={row.href}
                      onChange={(e) => patch(i, { href: e.target.value })}
                      placeholder="https://…"
                      className={field}
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
                        disabled={i === rows.length - 1}
                        aria-label="Move down"
                        className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </span>
                    <button
                      onClick={() => onChange(rows.filter((_, k) => k !== i))}
                      aria-label="Remove"
                      className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Sub-items are indented under their parent rather than
                      hidden behind a second dialog — a two-level menu is small
                      enough to see all of at once. */}
                  {nested && (
                    <div className="mt-1.5 space-y-1.5 border-l-2 border-slate-100 pl-3">
                      {(row.children ?? []).map((kid, k) => (
                        <div key={k} className="flex items-center gap-1.5">
                          <CornerDownRight size={13} className="shrink-0 text-slate-300" />
                          <input
                            value={kid.label}
                            onChange={(e) =>
                              patch(i, {
                                children: (row.children ?? []).map((c, n) =>
                                  n === k ? { ...c, label: e.target.value } : c,
                                ),
                              })
                            }
                            placeholder="Sub-item"
                            className={`${field} w-[104px] shrink-0`}
                          />
                          <input
                            value={kid.href}
                            onChange={(e) =>
                              patch(i, {
                                children: (row.children ?? []).map((c, n) =>
                                  n === k ? { ...c, href: e.target.value } : c,
                                ),
                              })
                            }
                            placeholder="https://…"
                            className={field}
                          />
                          <button
                            onClick={() =>
                              patch(i, {
                                children: (row.children ?? []).filter((_, n) => n !== k),
                              })
                            }
                            aria-label="Remove sub-item"
                            className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          patch(i, {
                            children: [...(row.children ?? []), { label: "", href: "#" }],
                          })
                        }
                        className="flex items-center gap-1 pl-[18px] text-[11.5px] font-medium text-slate-400 transition-colors hover:text-primary"
                      >
                        <Plus size={12} /> Sub-item
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 p-3">
          <button
            onClick={() => onChange([...rows, { label: "", href: "#" }])}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2.5 text-[13px] font-medium text-slate-600 transition-colors hover:border-primary hover:text-primary"
          >
            <Plus size={15} /> Add link
          </button>
        </div>
      </div>
    </>
  );
}
