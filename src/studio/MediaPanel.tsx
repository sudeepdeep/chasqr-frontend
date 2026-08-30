import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Plus, X } from "lucide-react";
import { resolveAsset } from "./assetUrl";
import { useAssetUpload } from "./upload";

/**
 * Managing the pictures in a carousel, gallery or logo strip.
 *
 * The comma-separated URL box this replaces was technically complete and
 * practically unusable: you could not see what was in the list, could not tell
 * which entry was which, and reordering meant retyping paths by hand. Anything
 * involving more than two images needs thumbnails.
 */
export default function MediaPanel({
  open,
  siteId,
  base,
  values,
  title,
  onChange,
  onClose,
}: {
  open: boolean;
  siteId?: string;
  base?: string;
  values: string[];
  title: string;
  onChange: (next: string[]) => void;
  onClose: () => void;
}) {
  const { upload, busy, error } = useAssetUpload(siteId);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= values.length) return;
    const next = [...values];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const addUrl = () => {
    const v = url.trim();
    if (!v) return;
    onChange([...values, v]);
    setUrl("");
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40" />

      <div className="fixed left-1/2 top-16 z-50 flex max-h-[calc(100vh-96px)] w-[440px] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,.35)]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <span className="text-[14px] font-semibold text-slate-900">
            {title}
            <span className="ml-2 font-normal text-slate-400">
              {values.length} image{values.length === 1 ? "" : "s"}
            </span>
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {values.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-slate-400">
              No images yet. Upload some below.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {values.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                >
                  <img
                    src={resolveAsset(src, base)}
                    alt=""
                    className="h-full w-full object-cover"
                  />

                  {/* Position matters in a carousel, so the order is shown and
                      adjustable rather than implied by the order you uploaded. */}
                  <span className="absolute left-1 top-1 rounded bg-slate-900/70 px-1.5 text-[10px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <button
                    onClick={() => onChange(values.filter((_, k) => k !== i))}
                    aria-label="Remove"
                    className="absolute right-1 top-1 rounded bg-slate-900/70 p-0.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                  <span className="absolute inset-x-0 bottom-0 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Move earlier"
                      className="bg-slate-900/70 p-1 text-white disabled:opacity-30"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === values.length - 1}
                      aria-label="Move later"
                      className="bg-slate-900/70 p-1 text-white disabled:opacity-30"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}

          {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
        </div>

        <div className="shrink-0 space-y-2 border-t border-slate-200 p-3">
          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2.5 text-[13px] font-medium text-slate-600 transition-colors hover:border-primary hover:text-primary">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
            {busy ? "Uploading…" : "Upload images"}
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              disabled={busy}
              onChange={async (e) => {
                if (!e.target.files?.length) return;
                const paths = await upload(e.target.files);
                e.target.value = "";
                if (paths.length) onChange([...values, ...paths]);
              }}
            />
          </label>

          <div className="flex gap-1.5">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addUrl()}
              placeholder="…or paste an image URL"
              className="h-8 flex-1 rounded-lg border border-slate-200 px-2 text-[12.5px] outline-none focus:border-primary"
            />
            <button
              onClick={addUrl}
              disabled={!url.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
