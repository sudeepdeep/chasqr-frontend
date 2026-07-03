import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Rocket, Search } from "lucide-react";
import { verifyOrderAPI } from "../api/payment.api";

export default function VerifyTransaction() {
  const { orderId: pathOrderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const orderId = pathOrderId || searchParams.get("order_id") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error" | "manual">(
    orderId ? "loading" : "manual",
  );
  const [message, setMessage] = useState("");
  const [manualId, setManualId] = useState("");
  const ran = useRef(false);

  const isPopup = Boolean(window.opener);

  const verify = (id: string) => {
    setStatus("loading");
    verifyOrderAPI(id)
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message || "Payment verified!");
        // Running inside the checkout popup — tell the main page to continue
        // the deploy automatically, then close ourselves.
        if (window.opener) {
          window.opener.postMessage(
            { type: "chasqr:payment-verified" },
            window.location.origin,
          );
          setTimeout(() => window.close(), 2000);
        }
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.message || "We couldn't verify this payment.",
        );
      });
  };

  useEffect(() => {
    if (!orderId || ran.current) return;
    ran.current = true;
    verify(orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {status === "loading" && (
          <>
            <Loader2 size={48} className="animate-spin text-primary mx-auto mb-6" />
            <h1 className="font-bebas text-4xl text-slate-900 mb-2">
              Verifying Payment
            </h1>
            <p className="text-slate-500 text-sm">
              Confirming your order with our payment provider...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle size={56} className="text-green-500 mx-auto mb-6" />
            <h1 className="font-bebas text-4xl text-slate-900 mb-2">
              Payment Confirmed!
            </h1>
            <p className="text-slate-500 text-sm mb-3">{message}</p>
            {isPopup ? (
              <p className="text-slate-500 text-sm mb-8">
                Your deploy is continuing in the main window — this popup will
                close automatically.
              </p>
            ) : (
              <>
                <p className="text-slate-500 text-sm mb-8">
                  Your credit is saved on your account — start an upload below
                  to use it.
                </p>
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-dark transition-all hover:scale-105"
                >
                  <Rocket size={15} /> Start a New Upload
                </Link>
              </>
            )}
          </>
        )}

        {status === "manual" && (
          <>
            <Search size={48} className="text-slate-300 mx-auto mb-6" />
            <h1 className="font-bebas text-4xl text-slate-900 mb-2">
              Verify Your Payment
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              Enter your Lemon Squeezy order ID (from your receipt email) to
              claim your large-upload credit.
            </p>
            <div className="flex gap-2 max-w-xs mx-auto">
              <input
                value={manualId}
                onChange={(e) => setManualId(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && manualId) verify(manualId);
                }}
                placeholder="Order ID"
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
              />
              <button
                onClick={() => manualId && verify(manualId)}
                disabled={!manualId}
                className="bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm"
              >
                Verify
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={56} className="text-red-400 mx-auto mb-6" />
            <h1 className="font-bebas text-4xl text-slate-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-slate-500 text-sm mb-8">{message}</p>
            <div className="flex gap-3 justify-center">
              <Link
                to="/upload"
                className="border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-all text-sm"
              >
                Back to Upload
              </Link>
              <Link
                to="/dashboard"
                className="border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-all text-sm"
              >
                Dashboard
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
