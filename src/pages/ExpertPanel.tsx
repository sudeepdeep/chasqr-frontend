import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  Headset, CheckCircle, UploadCloud, ExternalLink, MessageSquare,
} from "lucide-react";
import { AuthStore } from "../store/auth";
import {
  getMyRequestsAPI,
  getSupportRequestAPI,
  getMyExpertProfileAPI,
  acceptRequestAPI,
  updateExpertStatusAPI,
} from "../api/support.api";
import { redeployZipAPI } from "../api/site.api";
import SupportChat from "../components/SupportChat";
import { getSocket } from "../lib/socket";
import { SupportUnreadStore, clearUnread, setOpenSupportRequest } from "../store/supportUnread";
import { publicSiteUrl } from "../lib/siteUrl";

interface Req {
  _id: string;
  siteId: string;
  topic: string;
  status: string; 
  codeShared: boolean;
  deployAccess: boolean;
  userId: { _id: string; name: string; email: string };
  created_at: string;
  lastMessage?: { text: string; created_at: string } | null;
}

const STATUS_GROUPS: { key: string; label: string; filter: (r: Req) => boolean }[] = [
  { key: "active", label: "Active", filter: (r) => r.status === "accepted" },
  { key: "pending", label: "Waiting for you", filter: (r) => r.status === "pending" },
  { key: "past", label: "Past", filter: (r) => ["completed", "cancelled"].includes(r.status) },
];

export default function ExpertPanel() {
  const { user } = AuthStore.useState();
  const { unreadByRequest } = SupportUnreadStore.useState();
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<{ request: Req; site: any } | null>(null);
  const [expertStatus, setExpertStatus] = useState<"available" | "occupied" | "offline">("offline");
  const [redeploying, setRedeploying] = useState(false);
  const zipRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    Promise.all([getMyRequestsAPI(), getMyExpertProfileAPI()])
      .then(([reqRes, meRes]) => {
        setRequests(reqRes.data.data.requests);
        setExpertStatus(meRes.data.data.expert.expertStatus || "offline");
      })
      .catch(() => toast.error("Failed to load requests"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live-refresh the sidebar when a customer opens a new request, instead of
  // only picking it up on the next page load.
  useEffect(() => {
    const socket = getSocket();
    const onNewRequest = () => {
      toast.info("New support request received");
      load();
    };
    socket.on("new-request", onNewRequest);
    return () => { socket.off("new-request", onNewRequest); };
  }, [load]);

  // Keep each sidebar row's preview text current as messages come in,
  // regardless of which conversation is currently open.
  useEffect(() => {
    const socket = getSocket();
    const onMessage = (msg: any) => {
      setRequests((prev) =>
        prev.map((r) =>
          r._id === msg.requestId
            ? { ...r, lastMessage: { text: msg.text, created_at: msg.created_at } }
            : r,
        ),
      );
    };
    socket.on("message", onMessage);
    return () => { socket.off("message", onMessage); };
  }, []);

  const openRequest = useCallback((id: string) => {
    setActiveId(id);
    setActiveDetail(null);
    setOpenSupportRequest(id);
    clearUnread(id);
    getSupportRequestAPI(id)
      .then((res) => setActiveDetail(res.data.data))
      .catch(() => toast.error("Failed to load request"));
  }, []);

  // Stop attributing incoming messages to "currently open" once we navigate away.
  useEffect(() => () => setOpenSupportRequest(null), []);

  // Auto-select the first request once loaded (nice default like a chat app)
  useEffect(() => {
    if (!loading && !activeId && requests.length > 0) {
      openRequest(requests[0]._id);
    }
  }, [loading, activeId, requests, openRequest]);

  const refreshActive = () => {
    load();
    if (activeId) openRequest(activeId);
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptRequestAPI(id);
      toast.success("Request accepted — you're now occupied");
      refreshActive();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to accept");
    }
  };

  const handleToggleAvailability = async () => {
    if (expertStatus === "occupied") return;
    const next = expertStatus === "available" ? "offline" : "available";
    try {
      const res = await updateExpertStatusAPI(next);
      setExpertStatus(res.data.data.expertStatus);
      toast.success(`You are now ${res.data.data.expertStatus}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleExpertRedeploy = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !activeDetail) return;
    setRedeploying(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await redeployZipAPI(activeDetail.request.siteId, fd);
      toast.success("Site redeployed for the customer!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Redeploy failed");
    } finally {
      setRedeploying(false);
    }
  };

  const req = requests.find((r) => r._id === activeId);

  return (
    <div className="h-screen flex flex-col bg-white pt-16">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 shrink-0">
        <div>
          <h1 className="font-bebas text-3xl text-slate-900 leading-none">Expert Panel</h1>
          <p className="text-slate-500 text-xs mt-1">Hey {user?.name}</p>
        </div>
        <button
          onClick={handleToggleAvailability}
          disabled={expertStatus === "occupied"}
          title={
            expertStatus === "occupied"
              ? "You're occupied — finish your active request first"
              : expertStatus === "available"
              ? "Click to go offline"
              : "Click to become available"
          }
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-colors ${
            expertStatus === "available"
              ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
              : expertStatus === "occupied"
              ? "bg-amber-50 border-amber-200 text-amber-600 cursor-not-allowed"
              : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${
            expertStatus === "available" ? "bg-green-500" : expertStatus === "occupied" ? "bg-amber-500" : "bg-slate-400"
          }`} />
          {expertStatus === "available" ? "Available" : expertStatus === "occupied" ? "Occupied" : "Offline"}
        </button>
      </div>

      {/* Body: sidebar + chat */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-80 shrink-0 border-r border-slate-200 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-14 px-3">
                <Headset size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">No requests yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Customer requests appear here.
                </p>
              </div>
            ) : (
              STATUS_GROUPS.map((group) => {
                const items = requests.filter(group.filter);
                if (!items.length) return null;
                return (
                  <div key={group.key}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 mb-1.5">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {items.map((r) => (
                        <button
                          key={r._id}
                          onClick={() => openRequest(r._id)}
                          className={`w-full text-left p-3 rounded-xl transition-colors ${
                            activeId === r._id ? "bg-primary-light" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-sm font-medium text-slate-800 truncate">
                              {r.userId?.name}
                            </span>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              r.status === "accepted" ? "bg-green-500"
                              : r.status === "pending" ? "bg-amber-500"
                              : "bg-slate-300"
                            }`} />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-slate-500 truncate">
                              {r.lastMessage?.text || r.topic}
                            </p>
                            {!!unreadByRequest[r._id] && (
                              <span className="shrink-0 min-w-[16px] h-4 px-1 flex items-center justify-center bg-primary text-white text-[10px] font-semibold rounded-full">
                                {unreadByRequest[r._id] > 9 ? "9+" : unreadByRequest[r._id]}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{r.siteId}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main: selected chat */}
        <div className="flex-1 min-h-0 flex flex-col">
          {!req ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={40} className="mb-3 text-slate-300" />
              <p className="text-sm">Select a request to view the conversation</p>
            </div>
          ) : !activeDetail ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <motion.div
              key={req._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col min-h-0 p-5 gap-3"
            >
              <div className="shrink-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="font-bebas text-2xl text-slate-900 leading-none">
                      {activeDetail.site?.name || req.siteId}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {req.userId?.name} · {req.userId?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeDetail.site && (
                      <a
                        href={publicSiteUrl(activeDetail.site.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-primary border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <ExternalLink size={12} /> Live site
                      </a>
                    )}
                    {req.status === "pending" && (
                      <button
                        onClick={() => handleAccept(req._id)}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        <CheckCircle size={12} /> Accept
                      </button>
                    )}
                    {req.status === "accepted" && req.deployAccess && (
                      <>
                        <button
                          onClick={() => zipRef.current?.click()}
                          disabled={redeploying}
                          className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                          {redeploying
                            ? <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full inline-block" />
                            : <UploadCloud size={12} />}
                          Redeploy (ZIP)
                        </button>
                        <input ref={zipRef} type="file" accept=".zip" className="hidden" onChange={handleExpertRedeploy} />
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  "{req.topic}"
                </p>
              </div>

              <div className="flex-1 min-h-0">
                <SupportChat
                  requestId={req._id}
                  requestStatus={req.status}
                  isCustomer={false}
                  onRequestUpdated={refreshActive}
                  fillHeight
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
