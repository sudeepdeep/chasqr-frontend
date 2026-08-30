import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { Headset, Send, X } from "lucide-react";
import {
  getExpertsAPI,
  getMyRequestsAPI,
  createSupportRequestAPI,
  cancelRequestAPI,
} from "../api/support.api";
import SupportChat from "./SupportChat";

interface Expert {
  _id: string;
  name: string;
  expertTitle: string;
  expertSkills: string[];
  expertBio: string;
  expertStatus: "available" | "occupied" | "offline";
}

interface SupportRequest {
  _id: string;
  siteId: string;
  topic: string;
  status: string;
  codeShared: boolean;
  expertId: { _id: string; name: string; expertTitle?: string };
  created_at: string;
}

interface Props {
  siteId: string;
  hasSourceArchive?: boolean;
  /** Fired whenever the active request changes, so a parent (e.g. SiteAdmin)
   *  can keep a socket subscription alive for it even on other tabs. */
  onActiveRequestChange?: (id: string | null) => void;
}

export default function SupportSection({ siteId, hasSourceArchive, onActiveRequestChange }: Props) {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([getExpertsAPI(), getMyRequestsAPI()])
      .then(([exRes, reqRes]) => {
        setExperts(exRes.data.data.experts);
        setRequests(
          reqRes.data.data.requests.filter((r: SupportRequest) => r.siteId === siteId),
        );
      })
      .catch(() => { if (!silent) toast.error("Failed to load support data"); })
      .finally(() => { if (!silent) setLoading(false); });
  }, [siteId]);

  useEffect(() => { load(); }, [load]);

  const activeRequest = requests.find((r) => ["pending", "accepted"].includes(r.status));
  const pastRequests = requests.filter((r) => ["completed", "cancelled"].includes(r.status));

  useEffect(() => {
    onActiveRequestChange?.(activeRequest?._id || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRequest?._id]);

  const handlePickExpert = (ex: Expert) => {
    setSelectedExpert(ex);
    setTopic("");
  };

  const handleSubmit = async () => {
    if (!selectedExpert || !topic.trim()) {
      toast.error("Describe what you need");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createSupportRequestAPI({
        expertId: selectedExpert._id,
        siteId,
        topic: topic.trim(),
      });
      toast.success("Request sent!");

      // Show the chat instantly — merge the created request with the expert
      // we already have locally, instead of waiting on a full reload.
      const newRequest: SupportRequest = { ...res.data.data.request, expertId: selectedExpert };
      setRequests((prev) => [newRequest, ...prev]);

      setSelectedExpert(null);
      setTopic("");
      load(true); // sync with the server in the background, no spinner flash
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm("Cancel this request?")) return;
    try {
      await cancelRequestAPI(id);
      toast.success("Request cancelled");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── Active request: show the chat ──────────────────────────────────────────
  if (activeRequest) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-bebas text-2xl text-slate-900">
              Chat with {activeRequest.expertId?.name}
            </h2>
            <p className="text-xs text-slate-500">
              {activeRequest.expertId?.expertTitle} — request opened{" "}
              {new Date(activeRequest.created_at).toLocaleDateString()}
            </p>
          </div>
          {activeRequest.status === "pending" && (
            <button
              onClick={() => handleCancel(activeRequest._id)}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <X size={11} /> Cancel request
            </button>
          )}
        </div>

        {activeRequest.status === "pending" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            Waiting for {activeRequest.expertId?.name} to accept your request.
            You can already leave messages below.
          </div>
        )}

        <SupportChat
          requestId={activeRequest._id}
          requestStatus={activeRequest.status}
          isCustomer
          codeShared={activeRequest.codeShared}
          hasSourceArchive={hasSourceArchive}
          onRequestUpdated={load}
        />
      </div>
    );
  }

  // ── No active request: expert list + request form ───────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-slate-500">
          No technical background? Chat with a verified expert, share your site's
          code in one click, and let them make the changes for you.
        </p>
      </div>

      {experts.length === 0 ? (
        <div className="text-center py-14 border-2 border-dashed border-slate-200 rounded-2xl">
          <Headset size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No experts available yet</p>
          <p className="text-slate-400 text-sm mt-1">Check back soon.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {experts.map((ex, i) => {
            const available = ex.expertStatus === "available";
            return (
              <motion.button
                key={ex._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => available && handlePickExpert(ex)}
                disabled={!available}
                className={`text-left p-5 rounded-2xl border transition-all ${
                  available
                    ? "border-slate-200 bg-white hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
                    : "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900">{ex.name}</span>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                    available
                      ? "bg-green-50 text-green-600"
                      : ex.expertStatus === "occupied"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      available ? "bg-green-500" : ex.expertStatus === "occupied" ? "bg-amber-500" : "bg-slate-400"
                    }`} />
                    {ex.expertStatus}
                  </span>
                </div>
                <p className="text-sm text-primary font-medium mb-1.5">{ex.expertTitle}</p>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{ex.expertBio}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {ex.expertSkills.map((s) => (
                    <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Request modal — rendered via portal so it's never clipped by an
          ancestor's CSS transform (e.g. Framer Motion's animated page wrapper),
          which would otherwise turn "fixed" into "fixed relative to that box". */}
      {createPortal(
        <AnimatePresence>
          {selectedExpert && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-6"
              onClick={() => !submitting && setSelectedExpert(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
              >
                <button
                  onClick={() => setSelectedExpert(null)}
                  disabled={submitting}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={18} />
                </button>

                <h2 className="font-bebas text-2xl text-slate-900 mb-1">
                  Message {selectedExpert.name}
                </h2>
                <p className="text-xs text-slate-500 mb-4">{selectedExpert.expertTitle}</p>

                <textarea
                  autoFocus
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="e.g. I want to change my site's layout and add a contact form, but I don't know how to code..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none bg-white mb-4"
                />
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !topic.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm"
                >
                  {submitting
                    ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                    : <Send size={15} />}
                  Send Request
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {pastRequests.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Past requests
          </p>
          <div className="space-y-2">
            {pastRequests.map((r) => (
              <div key={r._id} className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl text-sm">
                <div className="min-w-0">
                  <p className="text-slate-700 truncate">{r.topic}</p>
                  <p className="text-xs text-slate-400">
                    {r.expertId?.name} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full shrink-0">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
