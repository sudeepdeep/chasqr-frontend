import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { Image as ImageIcon, Upload, Check } from "lucide-react";
import { uploadAssetAPI, setFaviconAPI } from "../api/site.api";

interface Props {
  siteId: string;
  favicon?: string;
  previewBaseUrl?: string;
  onSaved?: (site: any) => void;
}

export default function FaviconEditor({ siteId, favicon, previewBaseUrl, onSaved }: Props) {
  const [value, setValue] = useState(favicon || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const resolveSrc = (v: string) =>
    /^https?:\/\//i.test(v) ? v : previewBaseUrl ? previewBaseUrl + v : v;

  const handleSave = async (url?: string) => {
    const href = (url ?? value).trim();
    if (!href) {
      toast.error("Enter an image URL or upload a file");
      return;
    }
    setSaving(true);
    try {
      const res = await setFaviconAPI(siteId, href);
      setValue(href);
      onSaved?.(res.data.data.site);
      toast.success("Favicon updated and deployed!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update favicon");
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadAssetAPI(siteId, fd);
      const path = res.data.data.path;
      setValue(path);
      await handleSave(path);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <p className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1.5">
        <ImageIcon size={12} /> Site Favicon
      </p>

      <div className="flex items-center gap-3">
        <span className="w-10 h-10 shrink-0 rounded-lg border border-slate-200 bg-white flex items-center justify-center overflow-hidden">
          {value ? (
            <img
              src={resolveSrc(value)}
              alt="Favicon"
              className="w-6 h-6 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <ImageIcon size={16} className="text-slate-300" />
          )}
        </span>

        <div className="flex items-center flex-1 border border-slate-200 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="https://cdn.example.com/favicon.png — or upload"
            className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white font-mono"
          />
          <button
            onClick={() => handleSave()}
            disabled={saving || uploading || !value.trim()}
            title="Save favicon"
            className="px-3 py-2 text-green-600 hover:text-green-700 disabled:opacity-40 border-l border-slate-200"
          >
            {saving ? (
              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full" />
            ) : (
              <Check size={15} />
            )}
          </button>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={saving || uploading}
          className="flex items-center gap-1.5 shrink-0 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-lg hover:bg-white hover:text-primary transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <Upload size={14} />
          )}
          Upload
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-2">
        Shown in the browser tab of your deployed site. Applies to all pages. Recommended: square PNG/ICO, at least 32×32px.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
