import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, Trash2, Inbox, Copy, FileSearch, Zap, BookOpen } from "lucide-react";
import { getSubmissionsAPI, deleteSubmissionAPI, connectFormAPI } from "../api/site.api";

interface DetectedForm {
  key: string;
  label: string;
  fields: string[];
  likelyContact: boolean;
  connected: boolean;
}

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

interface Submission {
  _id: string;
  fields: Record<string, string>;
  created_at: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mirrors the backend's best-effort name/email detection so the list header
// reads naturally regardless of what the form's field names were.
function guessEmail(fields: Record<string, string>): string {
  for (const [k, v] of Object.entries(fields)) if (/email/i.test(k) && EMAIL_RE.test(v)) return v;
  for (const v of Object.values(fields)) if (EMAIL_RE.test(v)) return v;
  return "";
}
const NAME_FIELD_RE = /first.?name|last.?name|^fn(ame)?$|^ln(ame)?$|^name$|full.?name/i;
function guessName(fields: Record<string, string>): string {
  const entries = Object.entries(fields);
  const first = entries.find(([k]) => /first.?name|^fn(ame)?$/i.test(k))?.[1];
  const last = entries.find(([k]) => /last.?name|^ln(ame)?$/i.test(k))?.[1];
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return entries.find(([k]) => /^name$|full.?name/i.test(k))?.[1] || "";
}

interface Props {
  siteId: string;
  page?: string;
  forms?: DetectedForm[];
  /** Email notification of new submissions is a PRO feature. */
  isPro?: boolean;
  onFormsChange?: (site: any) => void;
}

export default function Submissions({ siteId, page, forms, isPro, onFormsChange }: Props) {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const toggleForm = async (formKey: string, connect: boolean) => {
    if (!page) return;
    setTogglingKey(formKey);
    try {
      const res = await connectFormAPI(siteId, page, formKey, connect);
      onFormsChange?.(res.data.data.site);
      toast.success(connect ? "Form connected — submissions will show up here" : "Form disconnected");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update form");
    } finally {
      setTogglingKey(null);
    }
  };

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

  const endpoint = `${API_URL}/api/forms/${siteId}/submit`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  if (loading) {
    return <div className="flex justify-center py-16"><span className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Auto-detected forms on this page — one-click connect, never auto-wired */}
      {forms && forms.length > 0 && (
        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileSearch size={15} className="text-primary" />
            <h3 className="font-semibold text-sm text-slate-800">Forms found on this page</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            We detected {forms.length} form{forms.length === 1 ? "" : "s"} in your uploaded HTML. Connect the ones that are actual contact forms — leave search bars, logins, or newsletter widgets off.
          </p>
          <div className="space-y-2">
            {forms.map((f) => (
              <div key={f.key} className={`flex items-center justify-between gap-3 border rounded-lg p-3 ${f.connected ? "border-primary/30 bg-primary-light/40" : "border-slate-200"}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm text-slate-800 truncate">{f.label}</p>
                    {f.likelyContact && !f.connected && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0">
                        <Zap size={9} /> looks like a contact form
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{f.fields.join(", ") || "no named fields"}</p>
                </div>
                <button
                  onClick={() => toggleForm(f.key, !f.connected)}
                  disabled={togglingKey === f.key}
                  className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                    f.connected
                      ? "border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200"
                      : "bg-primary text-white hover:bg-primary-dark"
                  }`}
                >
                  {togglingKey === f.key ? "…" : f.connected ? "Disconnect" : "Connect"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No form auto-detected — point them to the manual setup guide in the Docs */}
      {(!forms || forms.length === 0) && (
        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileSearch size={15} className="text-slate-400" />
            <h3 className="font-semibold text-sm text-slate-800">No contact form detected on this page</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Have your own form (or one on another page)? Point it at this endpoint — any field names work, they'll all show up here:
          </p>
          <div className="flex items-center gap-2 mb-3">
            <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-700 truncate">{endpoint}</code>
            <button onClick={() => copy(endpoint, "Endpoint")} title="Copy endpoint" className="shrink-0 border border-slate-200 text-slate-500 hover:text-primary p-2 rounded-lg"><Copy size={13} /></button>
          </div>
          <Link to="/docs#contact-forms" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            <BookOpen size={13} /> Full setup guide in the Docs
          </Link>
        </div>
      )}

      {/* Say plainly that email delivery is PRO. Silently not sending would
          read as a broken feature, and the support ticket it generates costs
          more than the email would have. */}
      {!isPro && (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Mail size={15} className="text-slate-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm text-slate-700">
              Submissions are saved here on every plan.{" "}
              <span className="font-medium text-slate-900">
                Upgrade to Pro to also get them emailed to you
              </span>{" "}
              the moment they arrive.
            </p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <Inbox size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No form submissions yet.</p>
          <p className="text-slate-400 text-xs mt-1">
            {forms && forms.length > 0
              ? `Connect a form above, or add a Form block in the Layout tab — messages will appear here${isPro ? " and land in your email" : ""}.`
              : `Add a Form block in the Layout tab, or connect your own form (see the setup guide above) — messages will appear here${isPro ? " and land in your email" : ""}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500 mb-1">{items.length} submission{items.length === 1 ? "" : "s"}</p>
          {items.map((s) => {
            const email = guessEmail(s.fields);
            const name = guessName(s.fields) || email || "Submission";
            const rest = Object.entries(s.fields).filter(([k]) => {
              const isEmailField = /email/i.test(k) && s.fields[k] === email;
              const isNameField = NAME_FIELD_RE.test(k) && guessName(s.fields).includes(s.fields[k]);
              return !isEmailField && !isNameField;
            });
            return (
              <div key={s._id} className="border border-slate-200 rounded-xl p-4 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{name}</p>
                    {email && (
                      <a href={`mailto:${email}`} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                        <Mail size={12} /> {email}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400">{new Date(s.created_at).toLocaleString()}</span>
                    <button onClick={() => remove(s._id)} disabled={deleting === s._id} title="Delete" className="text-slate-300 hover:text-red-500 disabled:opacity-40">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 space-y-1.5">
                  {rest.map(([k, v]) => (
                    <div key={k} className="text-sm bg-slate-50 rounded-lg p-3">
                      <span className="text-xs font-medium text-slate-400 block mb-0.5 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                      <span className="text-slate-700 whitespace-pre-wrap">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
