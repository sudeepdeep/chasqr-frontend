import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Send, CheckCircle, Share2, Info, IndianRupee } from "lucide-react";
import { AuthStore } from "../store/auth";
import { getSocket } from "../lib/socket";
import {
  getMessagesAPI,
  sendMessageAPI,
  completeRequestAPI,
  shareCodeAPI,
  createPaymentLinkAPI,
} from "../api/support.api";

interface Msg {
  _id: string;
  text: string;
  system: boolean;
  created_at: string;
  senderId: { _id: string; name: string; role: string };
}

const URL_REGEX = /(https?:\/\/[^\s]+|upi:\/\/[^\s]+)/g;

/** Render message text with clickable links (payment links, download links, etc.) */
function LinkifiedText({ text, mine }: { text: string; mine: boolean }) {
  const parts = text.split(URL_REGEX);
  return (
    <p className="whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        /^(https?:\/\/|upi:\/\/)/.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline font-medium break-all ${mine ? "text-white" : "text-primary"}`}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

interface Props {
  requestId: string;
  requestStatus: string;
  isCustomer: boolean;
  codeShared?: boolean;
  hasSourceArchive?: boolean;
  onRequestUpdated?: () => void;
  /** Fill the parent's height instead of using a fixed height (for flex-based layouts). */
  fillHeight?: boolean;
}

export default function SupportChat({
  requestId,
  requestStatus,
  isCustomer,
  codeShared,
  hasSourceArchive,
  onRequestUpdated,
  fillHeight,
}: Props) {
  const { user } = AuthStore.useState();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isClosed = ["completed", "cancelled"].includes(requestStatus);

  const loadMessages = useCallback(() => {
    getMessagesAPI(requestId)
      .then((res) => setMessages(res.data.data.messages))
      .catch(() => toast.error("Failed to load messages"))
      .finally(() => setLoading(false));
  }, [requestId]);

  useEffect(() => {
    loadMessages();
    const socket = getSocket();

    // Room membership lives on the server connection, not the client — if the
    // socket ever reconnects (server restart, network blip), we've silently
    // fallen out of the room unless we rejoin on every "connect", not just once.
    const joinRoom = () => socket.emit("join", requestId);
    joinRoom();
    socket.on("connect", joinRoom);

    const onMessage = (msg: Msg) => {
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
      );
    };
    const onRequestUpdatedEvt = () => onRequestUpdated?.();

    socket.on("message", onMessage);
    socket.on("request-updated", onRequestUpdatedEvt);

    return () => {
      socket.emit("leave", requestId);
      socket.off("connect", joinRoom);
      socket.off("message", onMessage);
      socket.off("request-updated", onRequestUpdatedEvt);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const t = text.trim();
    if (!t || isClosed) return;
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const socket = getSocket();
    if (socket.connected) {
      socket.emit("message", { requestId, text: t }, (ok: boolean) => {
        if (!ok) {
          // fall back to REST
          sendMessageAPI(requestId, t).catch(() =>
            toast.error("Failed to send message"),
          );
        }
      });
    } else {
      sendMessageAPI(requestId, t)
        .then((res) => setMessages((prev) => [...prev, res.data.data.message]))
        .catch(() => toast.error("Failed to send message"));
    }
  };

  const handleShareCode = async () => {
    const confirmMsg = hasSourceArchive
      ? "Share your site's source code with the expert? They'll receive a download link by email and get redeploy access to this site until the request is completed."
      : "No source code is attached to this site — the expert will only receive the compiled build output, not editable original files. Attach your source code in Update Files first if you want them to make real code changes. Share build output anyway?";
    if (!window.confirm(confirmMsg)) return;
    setSharing(true);
    try {
      await shareCodeAPI(requestId);
      toast.success("Code shared — expert emailed a download link");
      onRequestUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to share code");
    } finally {
      setSharing(false);
    }
  };

  const handleRequestPayment = async () => {
    const raw = window.prompt("Amount to request (₹):");
    if (!raw?.trim()) return;
    const amount = Number(raw.replace(/[^\d.]/g, ""));
    if (!amount || amount < 10) {
      toast.error("Enter a valid amount (minimum ₹10)");
      return;
    }

    try {
      // Auto-generate a secure checkout link and drop it in the chat
      await createPaymentLinkAPI(requestId, amount);
      toast.success("Payment link sent in chat");
    } catch (err: any) {
      // Fallback: paste a manual payment link
      const link = window.prompt(
        (err.response?.data?.message || "Couldn't auto-generate a link.") +
          "\n\nPaste your own payment link instead (UPI, PayPal, etc.):",
      );
      if (!link?.trim()) return;
      const msg = `💳 Payment request — ₹${amount}\nPay here: ${link.trim()}`;
      const socket = getSocket();
      if (socket.connected) {
        socket.emit("message", { requestId, text: msg }, (ok: boolean) => {
          if (!ok) sendMessageAPI(requestId, msg).catch(() => toast.error("Failed to send"));
        });
      } else {
        sendMessageAPI(requestId, msg)
          .then((res) => setMessages((prev) => [...prev, res.data.data.message]))
          .catch(() => toast.error("Failed to send"));
      }
    }
  };

  const handleComplete = async () => {
    if (!window.confirm("Mark this request as completed? The expert's access will be revoked and the chat will close.")) return;
    setCompleting(true);
    try {
      await completeRequestAPI(requestId);
      toast.success("Request completed");
      onRequestUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to complete");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div
      className={`flex flex-col border border-slate-200 rounded-2xl overflow-hidden bg-white ${fillHeight ? "h-full" : ""}`}
      style={fillHeight ? undefined : { height: "32rem" }}
    >
      {/* Action bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          requestStatus === "accepted"
            ? "bg-green-50 text-green-600"
            : requestStatus === "pending"
            ? "bg-amber-50 text-amber-600"
            : "bg-slate-100 text-slate-500"
        }`}>
          {requestStatus}
        </span>
        <div className="flex items-center gap-2">
          {!isCustomer && requestStatus === "accepted" && (
            <button
              onClick={handleRequestPayment}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-primary border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
            >
              <IndianRupee size={12} /> Request payment
            </button>
          )}
          {isCustomer && requestStatus === "accepted" && (
            <button
              onClick={handleShareCode}
              disabled={sharing}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-primary border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
            >
              <Share2 size={12} />
              {sharing ? "Sharing..." : codeShared ? "Re-share code" : "Share my code"}
            </button>
          )}
          {requestStatus === "accepted" && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={12} />
              {completing ? "..." : "Mark complete"}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">No messages yet</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId?._id === user?.id;
            if (m.system) {
              return (
                <div key={m._id} className="flex justify-center">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
                    <Info size={11} /> {m.text}
                  </span>
                </div>
              );
            }
            return (
              <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  mine
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                }`}>
                  {!mine && (
                    <p className="text-xs font-semibold mb-0.5 text-primary">
                      {m.senderId?.name}
                    </p>
                  )}
                  <LinkifiedText text={m.text} mine={mine} />
                  <p className={`text-[10px] mt-1 ${mine ? "text-white/60" : "text-slate-400"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 p-3 shrink-0 bg-white">
        {isClosed ? (
          <p className="text-center text-xs text-slate-400 py-1.5">
            This conversation is closed.
          </p>
        ) : (
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message... (Shift+Enter for a new line)"
              rows={1}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none max-h-32 overflow-y-auto"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="w-11 h-11 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
