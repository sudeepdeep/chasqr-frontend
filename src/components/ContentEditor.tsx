import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  Pencil,
  Image,
  Link2,
  AlignLeft,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Upload,
  Plus,
  Check,
  X,
} from "lucide-react";
import PreviewModal from "./PreviewModal";
import { uploadAssetAPI } from "../api/site.api";

interface ContentItem {
  key: string;
  label: string;
  value: string;
  type: "text" | "image" | "link";
  hidden?: boolean;
  href?: string;
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

  const filteredItems = contentMap.filter(
    (i) => filter === "all" || i.type === filter,
  );
  const hasChanges = Object.keys(edits).length > 0;

  const filterCounts = {
    text: contentMap.filter((i) => i.type === "text").length,
    image: contentMap.filter((i) => i.type === "image").length,
    link: contentMap.filter((i) => i.type === "link").length,
  };

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            filter === "all"
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <AlignLeft size={13} /> All ({contentMap.length})
        </button>
        {(["text", "image", "link"] as const).map(
          (f) =>
            filterCounts[f] > 0 && (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {typeIcon[f]} {typeLabel[f]} ({filterCounts[f]})
              </button>
            ),
        )}
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
            <div className="flex items-center gap-2 mb-2">
              {typeIcon[item.type]}
              <label className="text-sm font-medium text-slate-700">
                {item.label}
              </label>
              {item.hidden && (
                <span className="text-xs font-medium bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                  hidden
                </span>
              )}
              <span className="text-xs text-slate-400 font-mono ml-auto">
                {item.key}
              </span>

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
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={getValue(item)}
                  onChange={(e) => handleChange(item.key, e.target.value)}
                  placeholder="Image URL or upload a file"
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                />
                {siteId && (
                  <button
                    onClick={() => openImagePicker(item.key)}
                    disabled={uploadingKey !== null}
                    title="Upload an image"
                    className="flex items-center gap-1.5 shrink-0 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {uploadingKey === item.key ? (
                      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full" />
                    ) : (
                      <Upload size={14} />
                    )}
                    Upload
                  </button>
                )}
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
