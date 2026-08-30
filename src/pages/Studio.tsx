import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2,
  Monitor,
  Plus,
  Redo2,
  SlidersHorizontal,
  Smartphone,
  Undo2,
} from "lucide-react";
import AddPanel from "../studio/AddPanel";
import StudioCanvas from "../studio/StudioCanvas";
import StudioToolbar from "../studio/StudioToolbar";
import { useSiteDetail } from "../queries/sites";
import { saveCanvas } from "../studio/persist";
import { siteBaseUrl } from "../studio/assetUrl";
import { useGoogleFonts } from "../studio/fonts";
import PageSettings from "../studio/PageSettings";
import { useAssetUpload } from "../studio/upload";
import { ensureMobileLayout, reflowMobile } from "../studio/responsive";
import { TEMPLATES } from "../studio/templates";
import {
  Anim,
  Breakpoint,
  StudioElement,
  StudioElementType,
  StudioPage,
  boxFor,
  emptySection,
  newElement,
  uid,
} from "../studio/types";

/**
 * The free-positioning editor, at its own route.
 *
 * Deliberately alongside the grid builder rather than replacing it: the two
 * use incompatible layout models, and keeping both means the existing builder
 * stays working while this one is judged.
 *
 * Saved to the page's own `canvas` field, rendered server-side into the
 * deployed HTML. A page carries a canvas or a grid layout, never both.
 */
/**
 * Names the single property a patch touches, for collapsing repeated edits.
 *
 * A patch that changes several things at once is a distinct action and gets
 * its own history entry — only a stream of edits to one field is worth
 * merging.
 */
function propertyKey(patch: Record<string, unknown>, target: string) {
  const keys = Object.keys(patch);
  return keys.length === 1 ? `${target}:${keys[0]}` : null;
}

/** Element types whose content is a picture, so a double-click means "replace it". */
const IMAGE_PICK = ["image", "gallery", "carousel"];

export default function Studio() {
  const { siteId } = useParams<{ siteId: string }>();
  const [params] = useSearchParams();
  const pageName = params.get("page") || "index.html";

  const [page, setPage] = useState<StudioPage>({ sections: [emptySection()] });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loaded = useRef(false);

  /**
   * Undo history.
   *
   * Snapshots of the whole page rather than a log of reversible operations.
   * The page is a few tens of kilobytes of plain objects and every edit
   * already produces a fresh one, so a snapshot costs a pointer copy; writing
   * an inverse for each of the thirty-odd mutations would be far more code and
   * one missed inverse corrupts the document silently.
   */
  const past = useRef<StudioPage[]>([]);
  const future = useRef<StudioPage[]>([]);
  /** Mirrors `page` so edits never read a stale value out of a closure. */
  const current = useRef(page);
  /**
   * True between the first move of a drag and the pointer coming up.
   *
   * A drag emits an edit on every pointer move. Without this, undo would step
   * back one pixel at a time and be useless for the one action people most
   * want to take back.
   */
  const gesture = useRef(false);
  /**
   * Which property was last edited, and when.
   *
   * Typing into a toolbar field fires an edit per keystroke. Left alone that
   * is one history entry per character, so undoing a renamed heading means
   * pressing Ctrl+Z twenty times. Successive edits to the same property of the
   * same selection collapse into one entry while they keep arriving.
   */
  const lastEdit = useRef<{ key: string; at: number } | null>(null);
  const MERGE_MS = 600;
  const [, bumpHistory] = useReducer((n: number) => n + 1, 0);

  /** Older states are dropped rather than growing without bound. */
  const HISTORY_LIMIT = 120;

  const { data: site } = useSiteDetail(siteId);
  // Uploads are stored site-relative, so the editor has to resolve them
  // against the site's own origin rather than its own.
  const base = siteBaseUrl(site?.slug);

  // Load once. Re-running on every cache update would overwrite whatever the
  // user has edited since, which is how autosaving editors lose work.
  useEffect(() => {
    if (loaded.current || !site) return;
    loaded.current = true;
    const stored = site.pages?.find((p: any) => p.filename === pageName)?.canvas;
    if (!stored?.sections?.length) return;
    // Loading is not an edit: it seeds the document, so history starts here.
    current.current = stored;
    past.current = [];
    future.current = [];
    setPage(stored);
    bumpHistory();
  }, [site, pageName]);

  const save = async () => {
    if (!siteId || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveCanvas(siteId, pageName, page);
      setDirty(false);
      setSavedAt(Date.now());
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Every edit goes through here, so nothing can change the page silently and
   * everything lands in history.
   *
   * `continuous` marks an edit that is part of an ongoing drag: the first one
   * records the state to return to, the rest overwrite the live document
   * without adding entries.
   */
  const editPage = (
    next: StudioPage | ((p: StudioPage) => StudioPage),
    continuous = false,
    mergeKey?: string | null,
  ) => {
    const prev = current.current;
    const value = typeof next === "function" ? (next as (p: StudioPage) => StudioPage)(prev) : next;

    const now = Date.now();
    const merges =
      !!mergeKey &&
      lastEdit.current?.key === mergeKey &&
      now - lastEdit.current.at < MERGE_MS;

    if (!(continuous && gesture.current) && !merges) {
      past.current.push(prev);
      if (past.current.length > HISTORY_LIMIT) past.current.shift();
    }
    if (continuous) gesture.current = true;
    lastEdit.current = mergeKey ? { key: mergeKey, at: now } : null;

    // Any new edit abandons the redo branch — you cannot redo into a future
    // that no longer follows from the present.
    future.current = [];
    current.current = value;
    setPage(value);
    setDirty(true);
    bumpHistory();
  };

  /** Called when a drag finishes, so the next one starts its own entry. */
  const endGesture = () => {
    gesture.current = false;
  };

  const step = (from: StudioPage[], to: StudioPage[]) => {
    const target = from.pop();
    if (target === undefined) return;
    to.push(current.current);
    current.current = target;
    setPage(target);
    // Ids in the old selection may not exist in the restored page, and a
    // toolbar pointed at a missing element is worse than no selection.
    setSelection({ sectionId: null, elementIds: [] });
    setEditingId(null);
    setDirty(true);
    lastEdit.current = null;
    bumpHistory();
  };

  const undo = () => step(past.current, future.current);
  const redo = () => step(future.current, past.current);
  const [bp, setBp] = useState<Breakpoint>("desktop");
  const [selection, setSelection] = useState<{
    sectionId: string | null;
    elementIds: string[];
  }>({ sectionId: null, elementIds: [] });
  const [addFor, setAddFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pageOpen, setPageOpen] = useState(false);

  // Load whatever families the page references, so the canvas previews in the
  // font the published page will actually use.
  useGoogleFonts([
    page.fontFamily,
    ...page.sections.flatMap((s) => [
      s.fontFamily,
      ...s.elements.map((e) => e.fontFamily),
    ]),
  ]);

  // Double-click-to-upload. One hidden input serves every element, with the
  // target recorded on the way in.
  const fileRef = useRef<HTMLInputElement>(null);
  const pickFor = useRef<{ sectionId: string; elementId: string; type: string } | null>(null);
  const { upload } = useAssetUpload(siteId);

  const applyUpload = async (files: FileList) => {
    const target = pickFor.current;
    pickFor.current = null;
    if (!target) return;
    const paths = await upload(files);
    if (!paths.length) return;
    editPage((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id !== target.sectionId
          ? s
          : {
              ...s,
              elements: s.elements.map((e) =>
                e.id !== target.elementId
                  ? e
                  : target.type === "image"
                    ? { ...e, src: paths[0] }
                    : { ...e, images: [...(e.images ?? []), ...paths] },
              ),
            },
      ),
    }));
  };

  // Switching to mobile lays out anything that has never been arranged for it.
  // Doing this on the switch rather than at render keeps the result editable —
  // it becomes real mobile boxes the user can then drag.
  const switchBreakpoint = (next: Breakpoint) => {
    setEditingId(null);
    if (next === "mobile") editPage((p) => ensureMobileLayout(p));
    setBp(next);
  };

  const sectionIndex = page.sections.findIndex((s) => s.id === selection.sectionId);
  const section = sectionIndex >= 0 ? page.sections[sectionIndex] : null;
  const element =
    selection.elementIds.length === 1
      ? section?.elements.find((e) => e.id === selection.elementIds[0]) ?? null
      : null;

  const patchSection = useCallback(
    (patch: any) =>
      editPage(
        (p) => ({
        ...p,
          sections: p.sections.map((s) =>
            s.id === selection.sectionId ? { ...s, ...patch } : s,
          ),
        }),
        false,
        propertyKey(patch, `s:${selection.sectionId}`),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selection.sectionId],
  );

  const patchElement = useCallback(
    (patch: any) =>
      editPage(
        (p) => ({
        ...p,
          sections: p.sections.map((s) =>
            s.id !== selection.sectionId
              ? s
              : {
                  ...s,
                  elements: s.elements.map((e) =>
                    selection.elementIds.includes(e.id) ? { ...e, ...patch } : e,
                  ),
                },
          ),
        }),
        false,
        propertyKey(patch, `e:${selection.elementIds.join(",")}`),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selection],
  );

  const commitText = (sectionId: string, elementId: string, text: string) => {
    editPage((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id !== sectionId
          ? s
          : { ...s, elements: s.elements.map((e) => (e.id === elementId ? { ...e, text } : e)) },
      ),
    }));
    setEditingId(null);
  };

  /** Set one scroll animation across everything in the selected section. */
  const animateAll = (anim?: Anim) => {
    if (!section) return;
    editPage((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id !== section.id
          ? s
          : { ...s, elements: s.elements.map((e) => ({ ...e, anim })) },
      ),
    }));
  };

  /**
   * Open the real page in a new tab.
   *
   * Saving first, because the preview reads what is deployed — showing the
   * previous version while the editor holds newer work would be worse than
   * offering no preview at all.
   */
  const preview = async () => {
    if (dirty) await save();
    const url = `${siteBaseUrl(site?.slug)}${pageName}`;
    if (site?.slug) window.open(url, "_blank", "noopener");
  };

  /** Move the selected section one place up or down the page. */
  const moveSection = (dir: -1 | 1) => {
    if (!section) return;
    editPage((p) => {
      const i = p.sections.findIndex((s) => s.id === section.id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.sections.length) return p;
      const sections = [...p.sections];
      [sections[i], sections[j]] = [sections[j], sections[i]];
      return { ...p, sections };
    });
  };

  /** Re-run the automatic phone layout for the selected section. */
  const reflowSection = () => {
    if (!section) return;
    editPage((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id === section.id ? reflowMobile(s, p.padX) : s,
      ),
    }));
  };

  /**
   * Adds a section and, by default, opens the picker on it.
   *
   * An empty section is never the goal — it is a step on the way to putting
   * something in one. Creating it and then making the user click the band they
   * just created was two clicks for one intention.
   */
  const addSection = (afterId?: string, openPicker = true) => {
    // Built before the update so its id is known here, rather than having to
    // be dug back out of the new state.
    const next = emptySection();
    editPage((p) => {
      if (!afterId) return { ...p, sections: [...p.sections, next] };
      const i = p.sections.findIndex((s) => s.id === afterId);
      const sections = [...p.sections];
      sections.splice(i + 1, 0, next);
      return { ...p, sections };
    });
    setSelection({ sectionId: next.id, elementIds: [] });
    if (openPicker) setAddFor(next.id);
    return next.id;
  };

  const addElement = (type: StudioElementType, extra?: Partial<StudioElement>) => {
    const target = addFor;
    if (!target) return;
    const el = newElement(type, bp, undefined, extra);

    editPage((p) => ({
      ...p,
      sections: p.sections.map((s) => {
        if (s.id !== target) return s;
        // Two fields sharing a name silently overwrite each other in the
        // submission, and nothing about the canvas would show it — so a
        // duplicate key is suffixed at insert time rather than left to be
        // discovered in the first entry that arrives.
        if (el.type === "field" && el.name) {
          const taken = new Set(s.elements.filter((e) => e.type === "field").map((e) => e.name));
          if (taken.has(el.name)) {
            let n = 2;
            while (taken.has(`${el.name}_${n}`)) n += 1;
            el.name = `${el.name}_${n}`;
          }
        }
        return { ...s, elements: [...s.elements, el] };
      }),
    }));
    // Select what was just added — the next thing anyone does is move or edit it.
    setSelection({ sectionId: target, elementIds: [el.id] });
  };

  const addTemplate = (key: string) => {
    const def = TEMPLATES.find((t) => t.key === key);
    if (!def) return;
    // Templates are authored at desktop width, so one dropped while the phone
    // is on screen has to be stacked before it is ever shown.
    const built = bp === "mobile" ? reflowMobile(def.build(), page.padX) : def.build();

    editPage((p) => {
      const i = p.sections.findIndex((s) => s.id === addFor);
      const sections = [...p.sections];
      // Landing in an empty section replaces it rather than leaving a blank
      // band above the template — the empty section was only ever a placeholder
      // for whatever was about to fill it.
      if (i >= 0 && sections[i].elements.length === 0) sections[i] = built;
      else sections.splice(i >= 0 ? i + 1 : sections.length, 0, built);
      return { ...p, sections };
    });

    setSelection({ sectionId: built.id, elementIds: [] });
  };

  const duplicate = () => {
    if (!section || !element) return;
    const box = boxFor(element, bp);
    const copy = {
      ...element,
      id: uid(),
      // Offset so the copy is visibly a second object rather than hidden
      // exactly behind the original.
      boxes: { ...element.boxes, [bp]: { ...box, x: box.x + 24, y: box.y + 24 } },
    };
    editPage((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id === section.id ? { ...s, elements: [...s.elements, copy] } : s,
      ),
    }));
    setSelection({ sectionId: section.id, elementIds: [copy.id] });
  };

  const remove = () => {
    if (element && section) {
      editPage((p) => ({
        ...p,
        sections: p.sections.map((s) =>
          s.id !== section.id
            ? s
            : { ...s, elements: s.elements.filter((e) => !selection.elementIds.includes(e.id)) },
        ),
      }));
      setSelection({ sectionId: section.id, elementIds: [] });
      return;
    }
    if (section) {
      editPage((p) => ({ ...p, sections: p.sections.filter((s) => s.id !== section.id) }));
      setSelection({ sectionId: null, elementIds: [] });
    }
  };

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Delete and Escape are the two keys people reach for without being told.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      // Backspace inside a text element is a correction, not a deletion.
      if (editingId || el?.isContentEditable) return;
      // Inside a text box the browser's own undo is the right one, and the
      // guards above have already returned for those.
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === "Escape") setSelection({ sectionId: null, elementIds: [] });
      if ((e.key === "Delete" || e.key === "Backspace") && selection.elementIds.length) {
        e.preventDefault();
        remove();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-100">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
        <Link
          // Not back to the Layout tab: that tab now opens Studio, so returning
          // to it would bounce straight back in here.
          to={`/sites/${siteId}?tab=editor`}
          className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary"
        >
          <ArrowLeft size={16} /> Exit
        </Link>

        <button
          onClick={() => {
            const target = selection.sectionId ?? page.sections[0]?.id;
            // Nothing to add into yet: make the section first rather than
            // sitting there disabled with no way forward.
            if (target) setAddFor(target);
            else addSection();
          }}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          <Plus size={16} /> Add
        </button>

        <span className="flex overflow-hidden rounded-xl border border-slate-200">
          <button
            onClick={undo}
            disabled={!past.current.length}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            className="px-2.5 py-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Undo2 size={15} />
          </button>
          <span className="w-px bg-slate-200" />
          <button
            onClick={redo}
            disabled={!future.current.length}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
            className="px-2.5 py-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Redo2 size={15} />
          </button>
        </span>

        <button
          onClick={save}
          disabled={saving || !dirty}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {saving ? "Saving" : dirty ? "Save" : "Saved"}
        </button>

        <button
          onClick={() => setPageOpen(true)}
          title="Font, background and page-wide defaults"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-primary hover:text-primary"
        >
          <SlidersHorizontal size={15} /> Page
        </button>

        <button
          onClick={preview}
          disabled={saving || !site?.slug}
          title={dirty ? "Saves first, then opens the live page" : "Open the live page"}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <ExternalLink size={15} /> Preview
        </button>

        <span className="mx-1 h-6 w-px bg-slate-200" />

        {/* The contextual controls sit here, exactly where Wix puts them. */}
        <div className="flex min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <StudioToolbar
            siteId={siteId}
            base={base}
            bp={bp}
            section={section}
            element={element}
            onReflow={reflowSection}
            onMoveSection={moveSection}
            onAnimateAll={animateAll}
            canMoveUp={sectionIndex > 0}
            canMoveDown={sectionIndex >= 0 && sectionIndex < page.sections.length - 1}
            onPatchSection={patchSection}
            onPatchElement={patchElement}
            onDuplicate={duplicate}
            onDelete={remove}
            onBringForward={() => patchElement({ z: (element?.z ?? 1) + 1 })}
          />
        </div>

        <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-200">
          {(["desktop", "mobile"] as const).map((d) => {
            const Icon = d === "desktop" ? Monitor : Smartphone;
            return (
              <button
                key={d}
                onClick={() => switchBreakpoint(d)}
                title={d === "desktop" ? "Desktop" : "Mobile"}
                className={`p-2 ${bp === d ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <Icon size={15} />
              </button>
            );
          })}
        </div>

        <span className="hidden truncate text-[12px] text-slate-400 lg:block">
          {error ? (
            <span className="text-red-600">{error}</span>
          ) : savedAt && !dirty ? (
            "Published"
          ) : (
            pageName
          )}
        </span>
      </div>

      <StudioCanvas
        page={page}
        bp={bp}
        selection={selection}
        editingId={editingId}
        base={base}
        onSelectionChange={(next) => {
          setSelection(next);
          setEditingId(null);
        }}
        onChange={editPage}
        onGestureEnd={endGesture}
        onAddSection={addSection}
        onOpenAdd={(sectionId) => {
          setSelection({ sectionId, elementIds: [] });
          setAddFor(sectionId);
        }}
        onEditText={(sectionId, elementId) => {
          setSelection({ sectionId, elementIds: [elementId] });
          const target = page.sections
            .find((s) => s.id === sectionId)
            ?.elements.find((e) => e.id === elementId);
          // Text elements open an inline editor; picture elements open the
          // file picker, since there is nothing to type into them.
          if (target && IMAGE_PICK.includes(target.type)) {
            pickFor.current = { sectionId, elementId, type: target.type };
            fileRef.current?.click();
            return;
          }
          setEditingId(elementId);
        }}
        onCommitText={commitText}
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) applyUpload(e.target.files);
          e.target.value = "";
        }}
      />

      <PageSettings
        open={pageOpen}
        page={page}
        onChange={(patch) => editPage((p) => ({ ...p, ...patch }))}
        onClose={() => setPageOpen(false)}
      />

      <AddPanel
        open={!!addFor}
        onClose={() => setAddFor(null)}
        onPick={addElement}
        onPickTemplate={addTemplate}
      />
    </div>
  );
}
