import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Mail, Trash2, Inbox } from "lucide-react";
import { getSubmissionsAPI, deleteSubmissionAPI } from "../api/site.api";

interface Submission {
  _id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export default function Submissions({ siteId }: { siteId: string }) {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSubmissionsAPI(siteId)
      .then((res) => { if (!cancelled) setItems(res.data.data.submissions); })
      .catch(() => { if (!cancelled) toast.error("Failed to load submissions"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [siteId]);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this submission permanently?")) return;
    setDeleting(id);
    try {
      await deleteSubmissionAPI(siteId, id);
      setItems((prev) => prev.filter((s) => s._id !== id));
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><span className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
        <Inbox size={36} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No form submissions yet.</p>
        <p className="text-slate-400 text-xs mt-1">Add a Form block in the Layout tab — messages will appear here and land in your email.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 mb-1">{items.length} submission{items.length === 1 ? "" : "s"}</p>
      {items.map((s) => (
        <div key={s._id} className="border border-slate-200 rounded-xl p-4 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{s.name}</p>
              <a href={`mailto:${s.email}`} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <Mail size={12} /> {s.email}
              </a>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-slate-400">{new Date(s.created_at).toLocaleString()}</span>
              <button onClick={() => remove(s._id)} disabled={deleting === s._id} title="Delete" className="text-slate-300 hover:text-red-500 disabled:opacity-40">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap bg-slate-50 rounded-lg p-3">{s.message}</p>
        </div>
      ))}
    </div>
  );
}
