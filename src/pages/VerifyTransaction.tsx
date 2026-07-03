import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Rocket } from "lucide-react";
import { verifyOrderAPI } from "../api/payment.api";

export default function VerifyTransaction() {
  const { orderId } = useParams<{ orderId: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (!orderId || ran.current) return;
    ran.current = true;

    verifyOrderAPI(orderId)
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message || "Payment verified!");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.message || "We couldn't verify this payment.",
        );
      });
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
            <p className="text-slate-500 text-sm mb-8">{message}</p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-dark transition-all hover:scale-105"
            >
              <Rocket size={15} /> Continue Your Upload
            </Link>
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
