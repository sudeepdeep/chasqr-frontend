import { useMemo, useState } from "react";
import { ChevronRight, Plus, Search as SearchIcon } from "lucide-react";

/** One insertable thing in the palette. `run` is the existing handler, untouched. */
export interface PaletteEntry {
  key: string;
  label: string;
  icon: any;
  run: () => void;
}

export interface PaletteGroup {
  title: string;
  items: PaletteEntry[];
}

export type PaletteCategory = "Elements" | "Sections" | "Cards" | "Effects";

export interface LayerNode {
  id: string;
  label: string;
  tag: string;
  depth: number;
  selectable?: boolean;
  onSelect?: () => void;
  active?: boolean;
}

/**
 * The builder's left panel.
 *
 * Split out of LayoutBuilder because that file is past five thousand lines and
 * this is the part people actually complained about: every insertable thing —
 * roughly forty of them — used to sit in one long scroll, so finding "Pricing"
 * meant reading past every element, utility and banner first.
 *
 * Categories narrow it to a handful; search cuts across all of them at once,
 * because someone hunting for "carousel" should not have to know whether it is
 * filed under Elements, Sections or Cards. Every entry keeps the handler it
 * always had — this reorganises how they are found, not what they do.
 */
export default function BuilderPaletteBody({
  onAddSection,
  categories,
  layers,
  insertingInto,
}: {
  onAddSection: () => void;
  categories: Record<PaletteCategory, PaletteGroup[]>;
  layers: LayerNode[];
  /** Human-readable description of where the next insert lands. */
  insertingInto?: string;
}) {
  const [pane, setPane] = useState<"Insert" | "Layers">("Insert");
  const [cat, setCat] = useState<PaletteCategory>("Elements");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  // A search spans every category — the whole point is not having to guess
  // which one a thing lives in.
  const results = useMemo(() => {
    if (!q) return null;
    const seen = new Set<string>();
    const hits: PaletteEntry[] = [];
    (Object.keys(categories) as PaletteCategory[]).forEach((c) =>
      categories[c].forEach((g) =>
        g.items.forEach((it) => {
          if (!it.label.toLowerCase().includes(q)) return;
          // The same block can be offered in two categories (Tags appears as an
          // element and a card part); show it once.
          const dedupe = `${it.label}::${g.title}`;
          if (seen.has(dedupe)) return;
          seen.add(dedupe);
          hits.push(it);
        }),
      ),
    );
    return hits;
  }, [q, categories]);

  const row = (it: PaletteEntry) => {
    const Icon = it.icon;
    return (
      <button
        key={it.key}
        onClick={it.run}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-slate-600 transition-colors hover:bg-primary-light hover:text-primary"
      >
        <Icon size={15} className="shrink-0 text-slate-400" />
        <span className="truncate">{it.label}</span>
      </button>
    );
  };

  const CATS: PaletteCategory[] = ["Elements", "Sections", "Cards", "Effects"];

  return (
    <div className="flex w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="shrink-0 border-b border-slate-200 p-3">
        <button
          onClick={onAddSection}
          className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={15} /> Add Section
        </button>

        <div className="mb-3 flex gap-0.5 rounded-[10px] bg-slate-100 p-[3px]">
          {(["Insert", "Layers"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPane(p)}
              className={`flex-1 rounded-lg py-1.5 text-[12px] transition-colors ${
                pane === p
                  ? "bg-white font-semibold text-slate-900 shadow-sm"
                  : "font-medium text-slate-500 hover:text-slate-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {pane === "Insert" && (
          <div className="relative">
            <SearchIcon
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search elements and blocks"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-2 text-[12.5px] outline-none transition-colors focus:border-primary focus:bg-white"
            />
          </div>
        )}
      </div>

      {pane === "Insert" ? (
        <>
          {/* Categories hide while searching — results already span all of them,
              so a highlighted category would be lying about the scope. */}
          {/* One row that scrolls, not a wrapping block — wrapped, the fourth
              pill dropped to its own line and ate vertical space the element
              list needs. */}
          {!q && (
            <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-slate-200 px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`shrink-0 rounded-full px-3 py-1 text-[12px] transition-colors ${
                    cat === c
                      ? "bg-primary font-semibold text-white"
                      : "bg-slate-100 font-medium text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {q ? (
              results && results.length > 0 ? (
                <>
                  <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {results.length} result{results.length === 1 ? "" : "s"}
                  </p>
                  <div className="space-y-0.5">{results.map(row)}</div>
                </>
              ) : (
                <p className="px-1 py-6 text-center text-[12.5px] text-slate-400">
                  Nothing matches “{query.trim()}”.
                </p>
              )
            ) : (
              (categories[cat] || []).map((g) => (
                <div key={g.title} className="mb-4">
                  <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {g.title}
                  </p>
                  <div className="space-y-0.5">{g.items.map(row)}</div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {layers.length === 0 ? (
            <p className="px-1 py-6 text-center text-[12.5px] text-slate-400">
              Nothing on the page yet.
            </p>
          ) : (
            <div className="space-y-0.5">
              {layers.map((l) => (
                <button
                  key={l.id}
                  onClick={l.onSelect}
                  disabled={!l.selectable}
                  style={{ paddingLeft: 10 + l.depth * 12 }}
                  className={`flex w-full items-center gap-1.5 rounded-lg py-1.5 pr-2 text-left text-[12.5px] transition-colors ${
                    l.active
                      ? "bg-primary-light text-primary"
                      : l.selectable
                        ? "text-slate-600 hover:bg-slate-100"
                        : "cursor-default text-slate-500"
                  }`}
                >
                  <span className="truncate">{l.label}</span>
                  <code className="ml-auto shrink-0 rounded bg-slate-100 px-1 font-mono text-[10px] text-slate-400">
                    {l.tag}
                  </code>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Where the next insert lands. The old palette explained this in a
          paragraph of grey text at the top that nobody read once they had
          scrolled; pinned to the bottom it stays true as you browse. */}
      {pane === "Insert" && insertingInto && (
        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Inserting into
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[12px] text-slate-600">
            <ChevronRight size={11} className="shrink-0 text-slate-400" />
            <span className="truncate">{insertingInto}</span>
          </p>
        </div>
      )}
    </div>
  );
}
