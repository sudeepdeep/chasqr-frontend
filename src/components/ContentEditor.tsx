import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  Pencil,
  Image,
  Link2,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Upload,
  Plus,
  Check,
  Search,
  X,
} from "lucide-react";
import PreviewModal from "./PreviewModal";
import StyleToolbar from "./StyleToolbar";
import { uploadAssetAPI } from "../api/site.api";

interface ContentItem {
  key: string;
  label: string;
  value: string;
  type: "text" | "image" | "link";
  hidden?: boolean;
  href?: string;
  style?: string;
  alt?: string;
  target?: string;
}

export type ElementAction = {
  key: string;
  action: "hide" | "show" | "duplicate" | "delete";
};

interface Props {
  contentMap: ContentItem[];
  onSave: (updates: Record<string, string>) => Promise<void>;
  isSaving: boolean;
  externalEdits?: Record<string, string>;
  onEditsChange?: (edits: Record<string, string>) => void;
  siteId?: string;
  pageFilename?: string;
  previewBaseUrl?: string;
  previewOpen?: boolean;
  onPreviewOpenChange?: (open: boolean) => void;
  onElementsAction?: (actions: ElementAction[]) => Promise<void>;
  onAddElement?: (
    afterKey: string,
    type: "text" | "image" | "link",
    value: string,
    href?: string,
  ) => Promise<void>;
}

const typeIcon = {
  text: <Pencil size={14} className="text-orange-400" />,
  image: <Image size={14} className="text-purple-400" />,
  link: <Link2 size={14} className="text-primary/70" />,
};

const typeLabel = { text: "Text", image: "Image URL", link: "Link" };

/**
 * Thumbnail for an image field.
 *
 * Its own component so the broken/empty states stay local: an editor is
 * precisely where a bad image URL turns up, and a broken <img> icon inside the
 * form is more confusing than a labelled placeholder.
 */
function ImagePreview({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  const clean = (src || "").trim();

  // Reset when the field is edited, or a URL fixed after a failure would stay
  // stuck showing the error state.
  useEffect(() => setFailed(false), [clean]);

  const shell =
    "flex h-[68px] w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50";

  if (!clean || failed) {
    return (
      <div className={shell}>
        <span className="px-1 text-center text-[9.5px] font-medium leading-tight text-slate-400">
          {clean ? "Can't load" : "No image"}
        </span>
      </div>
    );
  }

  return (
    <div className={shell}>
      <img
        src={clean}
        alt=""
        aria-hidden="true"
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

export default function ContentEditor({
  contentMap,
  onSave,
  isSaving,
  externalEdits,
  onEditsChange,
  siteId,
  pageFilename,
  previewBaseUrl,
  previewOpen: externalPreviewOpen,
  onPreviewOpenChange,
  onElementsAction,
  onAddElement,
}: Props) {
  const [localEdits, setLocalEdits] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "text" | "image" | "link">(
    "all",
  );
  const [localPreviewOpen, setLocalPreviewOpen] = useState(false);
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  // Inline "add element after this one" form state
  const [addAfterKey, setAddAfterKey] = useState<string | null>(null);
  const [addType, setAddType] = useState<"text" | "image" | "link">("text");
  const [addValue, setAddValue] = useState("");
  const [addHref, setAddHref] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addUploading, setAddUploading] = useState(false);
  const addImageInputRef = useRef<HTMLInputElement>(null);

  const openAddForm = (key: string) => {
    setAddAfterKey(key);
    setAddType("text");
    setAddValue("");
    setAddHref("");
  };
  const cancelAddForm = () => {
    setAddAfterKey(null);
    setAddValue("");
    setAddHref("");
  };
  const submitAddForm = async (afterKey: string) => {
    if (!onAddElement) return;
    if (!addValue.trim()) {
      toast.error(addType === "image" ? "Enter an image URL" : "Enter some content");
      return;
    }
    setAddBusy(true);
    try {
      await onAddElement(afterKey, addType, addValue.trim(), addType === "link" ? addHref.trim() : undefined);
      cancelAddForm();
    } finally {
      setAddBusy(false);
    }
  };
  // Upload a local image for the add-element form → fills the Image URL field.
  const handleAddImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !siteId) return;
    setAddUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadAssetAPI(siteId, fd);
      setAddValue(res.data.data.path);
      toast.success("Image uploaded — add to deploy");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setAddUploading(false);
    }
  };
  const imageInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetKey = useRef<string | null>(null);
  const previewOpen = externalPreviewOpen ?? localPreviewOpen;
  const setPreviewOpen = onPreviewOpenChange ?? setLocalPreviewOpen;

  const openImagePicker = (key: string) => {
    uploadTargetKey.current = key;
    imageInputRef.current?.click();
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = uploadTargetKey.current;
    e.target.value = "";
    if (!file || !key || !siteId) return;

    setUploadingKey(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadAssetAPI(siteId, fd);
      handleChange(key, res.data.data.path);
      toast.success("Image uploaded — save to deploy");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploadingKey(null);
      uploadTargetKey.current = null;
    }
  };

  const runElementAction = async (
    key: string,
    action: ElementAction["action"],
  ) => {
    if (!onElementsAction || actionBusyKey) return;
    if (
      action === "delete" &&
      !window.confirm(
        "Delete this element permanently? This cannot be undone. Tip: use Hide instead if you might want it back later.",
      )
    )
      return;
    setActionBusyKey(key);
    try {
      await onElementsAction([{ key, action }]);
    } finally {
      setActionBusyKey(null);
    }
  };

  const edits = externalEdits ?? localEdits;
  const setEdits = (
    updater: (prev: Record<string, string>) => Record<string, string>,
  ) => {
    const next = updater(edits);
    if (onEditsChange) onEditsChange(next);
    else setLocalEdits(next);
  };

  const getValue = (item: ContentItem) =>
    edits[item.key] !== undefined ? edits[item.key] : item.value;

  const handleChange = (key: string, value: string) =>
    setEdits((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!Object.keys(edits).length) return;
    await onSave(edits);
    if (!onEditsChange) setLocalEdits({});
  };

  const filteredItems = contentMap
    .filter((i) => filter === "all" || i.type === filter)
    .filter((i) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      // Match the label, the element id and the content itself — people look
      // for an element by what it says as often as by what it is called.
      return (
        i.label.toLowerCase().includes(q) ||
        i.key.toLowerCase().includes(q) ||
        (i.value || "").toLowerCase().includes(q)
      );
    });
  const hasChanges = Object.keys(edits).length > 0;

  const filterCounts = {
    text: contentMap.filter((i) => i.type === "text").length,
    image: contentMap.filter((i) => i.type === "image").length,
    link: contentMap.filter((i) => i.type === "link").length,
  };

  return (
    <div className="space-y-6">
      {/* Toolbar: a segmented control rather than loose chips, so the type
          filters read as one control, plus a find box — a content-heavy page
          can carry a hundred elements and scrolling for one is hopeless. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-0.5 rounded-[10px] bg-slate-100 p-[3px]">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3.5 py-1.5 text-[12.5px] transition-colors ${
              filter === "all"
                ? "bg-white font-semibold text-slate-900 shadow-sm"
                : "font-medium text-slate-500 hover:text-slate-700"
            }`}
          >
            All ({contentMap.length})
          </button>
          {(["text", "image", "link"] as const).map(
            (f) =>
              filterCounts[f] > 0 && (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3.5 py-1.5 text-[12.5px] transition-colors ${
                    filter === f
                      ? "bg-white font-semibold text-slate-900 shadow-sm"
                      : "font-medium text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {typeLabel[f]} ({filterCounts[f]})
                </button>
              ),
          )}
        </div>

        <div className="flex-1" />

        <div className="relative flex-[0_1_260px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find element or id"
            className="w-full rounded-[10px] border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-[13px] text-slate-900 outline-none transition-colors focus:border-primary focus:bg-white"
          />
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {filteredItems.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-8">
            No elements of this type found.
          </p>
        )}

        {filteredItems.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.3) }}
            className={`p-4 rounded-xl border transition-colors ${
              item.hidden
                ? "border-slate-200 bg-slate-50 opacity-70"
                : edits[item.key] !== undefined ||
                    edits[`${item.key}::href`] !== undefined
                  ? "border-primary/30 bg-primary-light"
                  : "border-slate-200 bg-white"
            }`}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                {typeIcon[item.type]}
              </span>
              <label className="truncate text-[13.5px] font-semibold text-slate-900">
                {item.label}
              </label>
              <span className="shrink-0 rounded-[5px] bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[.04em] text-slate-500">
                {typeLabel[item.type]}
              </span>
              {item.hidden && (
                <span className="shrink-0 rounded-[5px] bg-amber-50 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[.04em] text-amber-700">
                  hidden
                </span>
              )}
              <code className="ml-auto hidden shrink-0 rounded bg-slate-50 px-1.5 py-0.5 font-mono text-[10.5px] text-slate-400 sm:block">
                {item.key}
              </code>

              {onElementsAction && (
                <span className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => runElementAction(item.key, "duplicate")}
                    disabled={actionBusyKey !== null}
                    title="Duplicate this block (clones the whole card/tile it belongs to)"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary-light transition-colors disabled:opacity-40"
                  >
                    {actionBusyKey === item.key ? (
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      runElementAction(item.key, item.hidden ? "show" : "hide")
                    }
                    disabled={actionBusyKey !== null}
                    title={item.hidden ? "Show on site" : "Hide from site"}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary-light transition-colors disabled:opacity-40"
                  >
                    {item.hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button
                    onClick={() => runElementAction(item.key, "delete")}
                    disabled={actionBusyKey !== null}
                    title="Delete this element permanently"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                  </button>
                </span>
              )}

              {onAddElement && (
                <button
                  onClick={() =>
                    addAfterKey === item.key ? cancelAddForm() : openAddForm(item.key)
                  }
                  title="Add a new element below this one"
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${onElementsAction ? "ml-1" : "ml-2"} ${
                    addAfterKey === item.key
                      ? "text-primary bg-primary-light"
                      : "text-slate-400 hover:text-primary hover:bg-primary-light"
                  }`}
                >
                  <Plus size={15} />
                </button>
              )}
            </div>

            {item.type === "text" && item.value.length > 80 ? (
              <textarea
                value={getValue(item)}
                onChange={(e) => handleChange(item.key, e.target.value)}
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-white"
              />
            ) : item.type === "image" ? (
              // Preview alongside the fields. Editing an image by URL alone is
              // guesswork — you cannot tell a broken path from a wrong one
              // until the site is republished.
              <div className="flex items-start gap-3">
                <ImagePreview src={getValue(item)} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={getValue(item)}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                      placeholder="Image URL or upload a file"
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {siteId && (
                      <button
                        onClick={() => openImagePicker(item.key)}
                        disabled={uploadingKey !== null}
                        title="Upload an image"
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary disabled:opacity-50"
                      >
                        {uploadingKey === item.key ? (
                          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <Upload size={14} />
                        )}
                        Upload
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : item.type === "link" ? (
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-400 mb-1 block">Text</span>
                  <input
                    type="text"
                    value={getValue(item)}
                    onChange={(e) => handleChange(item.key, e.target.value)}
                    placeholder="Link text"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-400 mb-1 block">URL</span>
                  <div className="relative">
                    <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={
                        edits[`${item.key}::href`] !== undefined
                          ? edits[`${item.key}::href`]
                          : item.href ?? ""
                      }
                      onChange={(e) => handleChange(`${item.key}::href`, e.target.value)}
                      placeholder="https://example.com"
                      className="w-full text-sm border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={getValue(item)}
                onChange={(e) => handleChange(item.key, e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              />
            )}

            {/* Styling controls for text & link elements */}
            {(item.type === "text" || item.type === "link") && (
              <StyleToolbar
                style={
                  edits[`${item.key}::style`] !== undefined
                    ? edits[`${item.key}::style`]
                    : item.style
                }
                onChange={(s) => handleChange(`${item.key}::style`, s)}
              />
            )}

            {/* Open-in-new-tab toggle for links */}
            {item.type === "link" && (
              <label className="flex items-center gap-2 mt-2 text-xs text-slate-600 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={
                    (edits[`${item.key}::target`] !== undefined
                      ? edits[`${item.key}::target`]
                      : item.target) === "_blank"
                  }
                  onChange={(e) =>
                    handleChange(`${item.key}::target`, e.target.checked ? "_blank" : "")
                  }
                  className="accent-primary w-3.5 h-3.5"
                />
                Open in a new tab
              </label>
            )}

            {/* Alt text for images (SEO & accessibility) */}
            {item.type === "image" && (
              <div className="mt-2">
                <span className="text-xs text-slate-400 mb-1 block">
                  Alt text <span className="text-slate-300">— describes the image for SEO &amp; screen readers</span>
                </span>
                <input
                  type="text"
                  value={
                    edits[`${item.key}::alt`] !== undefined
                      ? edits[`${item.key}::alt`]
                      : item.alt ?? ""
                  }
                  onChange={(e) => handleChange(`${item.key}::alt`, e.target.value)}
                  placeholder="e.g. Team photo at the 2026 launch event"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                />
              </div>
            )}

            {/* Inline "add a new element below this one" form */}
            {onAddElement && addAfterKey === item.key && (
              <div className="mt-3 pt-3 border-t border-dashed border-primary/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">Add below:</span>
                  {(["text", "image", "link"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setAddType(t)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        addType === t
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {typeIcon[t]} {typeLabel[t]}
                    </button>
                  ))}
                </div>

                {addType === "text" ? (
                  <textarea
                    value={addValue}
                    onChange={(e) => setAddValue(e.target.value)}
                    rows={2}
                    placeholder="Text to show"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-white"
                  />
                ) : addType === "image" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={addValue}
                      onChange={(e) => setAddValue(e.target.value)}
                      placeholder="Image URL or upload a file"
                      className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    />
                    {siteId && (
                      <button
                        onClick={() => addImageInputRef.current?.click()}
                        disabled={addUploading}
                        title="Upload an image from your device"
                        className="flex items-center gap-1.5 shrink-0 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors disabled:opacity-50"
                      >
                        {addUploading ? (
                          <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full" />
                        ) : (
                          <Upload size={14} />
                        )}
                        Upload
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={addValue}
                      onChange={(e) => setAddValue(e.target.value)}
                      placeholder="Link text"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    />
                    <input
                      type="text"
                      value={addHref}
                      onChange={(e) => setAddHref(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white font-mono"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => submitAddForm(item.key)}
                    disabled={addBusy}
                    className="flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {addBusy ? (
                      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Check size={14} />
                    )}
                    Add & Deploy
                  </button>
                  <button
                    onClick={cancelAddForm}
                    disabled={addBusy}
                    className="flex items-center gap-1.5 text-slate-500 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom save */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-slate-400">
          {hasChanges
            ? `${Object.keys(edits).length} unsaved change(s)`
            : "No changes yet"}
        </p>
        <div className="flex items-center gap-2">
          {/* {siteId && pageFilename && previewBaseUrl && (
            <button
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-2 border border-slate-200 text-slate-600 font-medium px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Eye size={15} /> Preview
            </button>
          )} */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex items-center gap-2 bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : null}
            {isSaving ? "Deploying..." : "Save & Deploy"}
          </button>
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />
      <input
        ref={addImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAddImageFile}
      />

      {siteId && pageFilename && previewBaseUrl && (
        <PreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          siteId={siteId}
          page={pageFilename}
          edits={edits}
          baseUrl={previewBaseUrl}
        />
      )}
    </div>
  );
}
