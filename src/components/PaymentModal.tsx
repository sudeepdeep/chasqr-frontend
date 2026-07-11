import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { Lock, X, CreditCard } from "lucide-react";
import { createPaymentOrderAPI, verifyOrderAPI } from "../api/payment.api";
import { loadRazorpayScript } from "../lib/razorpay";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Upload size in bytes — omit for a generic upgrade (no upload context). */
  totalSize?: number;
  onPaidConfirm: () => void;
  title?: string;
}

export default function PaymentModal({
  open,
  onClose,
  totalSize,
  onPaidConfirm,
  title = "Large Upload",
}: Props) {
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    try {
      await loadRazorpayScript();
      const res = await createPaymentOrderAPI();
      const { orderId, amount, currency, keyId, name, email } = res.data.data;

      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "Chasqr",
        description: "Large-upload credit",
        prefill: { name, email },
        theme: { color: "#2563EB" },
        handler: async (response) => {
          try {
            await verifyOrderAPI(response);
            toast.success("Payment verified — unlocked!");
            onPaidConfirm();
          } catch (err: any) {
            toast.error(err.response?.data?.message || "Payment verification failed");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });
      razorpay.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not start checkout");
      setPaying(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-[40rem] w-full p-8 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-5">
              <Lock size={22} />
            </div>

            <h2 className="font-bebas text-3xl text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              {totalSize !== undefined ? (
                <>
                  Your upload is{" "}
                  <strong>{(totalSize / 1024 / 1024).toFixed(1)} MB</strong> —
                  uploads over 5 MB require a one-time payment. Once paid, this
                  site is upgraded to{" "}
                  <strong className="text-amber-600">PRO</strong> and can be
                  redeployed at any size, forever.
                </>
              ) : (
                <>
                  Upgrading this site to{" "}
                  <strong className="text-amber-600">PRO</strong> requires a
                  one-time payment. Once paid, it unlocks a{" "}
                  <strong>custom domain</strong>,{" "}
                  <strong>expert support chat</strong>, and{" "}
                  <strong>uploads of any size</strong> — forever, for this site.
                </>
              )}
            </p>

            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 rounded-xl hover:bg-primary-dark transition-colors text-sm disabled:opacity-50"
            >
              {paying ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
              ) : (
                <CreditCard size={16} />
              )}
              {paying ? "Opening checkout..." : "Pay ₹199 & Unlock"}
            </button>

            <p className="text-xs text-slate-400 text-center mt-4">
              Secure checkout via Razorpay. One payment = this site unlocked forever.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
