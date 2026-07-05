import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { FileCode2, Upload, Trash2, ShieldCheck, Info } from "lucide-react";
import { uploadSourceArchiveAPI, removeSourceArchiveAPI } from "../api/site.api";

interface Props {
  siteId: string;
  hasSourceArchive?: boolean;
  onChange: (site: any) => void;
}

export default function SourceArchiveControl({ siteId, hasSourceArchive, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast.error("Please select a .zip file");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadSourceArchiveAPI(siteId, fd);
      onChange(res.data.data.site);
      toast.success("Source code attached");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("Remove the attached source code? Experts will only receive build output from then on.")) return;
    setRemoving(true);
    try {
      const res = await removeSourceArchiveAPI(siteId);
      onChange(res.data.data.site);
      toast.success("Source code removed");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
      <div>
        <h2 className="font-bebas text-2xl text-slate-900 mb-1 flex items-center gap-2">
          <FileCode2 size={18} className="text-primary" />
          Original Source Code
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Chasqr hosts your compiled build output — it never sees your original project files. If
          you plan to get help from an expert, attach your real source code (zip your project
          folder, excluding <code className="bg-white border border-slate-200 px-1 rounded">node_modules</code>).
          It's kept private and only released to an expert when you click "Share my code" in a
          support chat.
        </p>
      </div>

      {hasSourceArchive ? (
        <div className="flex items-center justify-between gap-3 bg-white border border-green-200 rounded-lg p-3">
          <span className="flex items-center gap-2 text-sm text-green-700 font-medium">
            <ShieldCheck size={15} /> Source code attached
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs font-medium text-slate-500 hover:text-primary border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Replace
            </button>
            <button
              onClick={handleRemove}
              disabled={removing}
              className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 size={11} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            <Info size={13} className="shrink-0 mt-0.5" />
            No source code attached — if you share this site with an expert, they'll only
            receive the compiled build output, not editable original files.
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm"
          >
            {uploading ? (
              <span className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full inline-block" />
            ) : (
              <Upload size={14} />
            )}
            {uploading ? "Uploading..." : "Attach Source Code (ZIP)"}
          </button>
        </>
      )}

      <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={handleFile} />
    </div>
  );
}
