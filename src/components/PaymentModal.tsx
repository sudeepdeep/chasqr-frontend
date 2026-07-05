import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X, CreditCard, Rocket } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Upload size in bytes — omit for a generic upgrade (no upload context). */
  totalSize?: number;
  checkoutUrl: string;
  onPaidConfirm: () => void;
  busy?: boolean;
  confirmLabel?: string;
  title?: string;
}

export default function PaymentModal({
  open,
  onClose,
  totalSize,
  checkoutUrl,
  onPaidConfirm,
  busy,
  confirmLabel = "I've paid — deploy now",
  title = "Large Upload",
}: Props) {
  const handledRef = useRef(false);

  const openCheckoutPopup = () => {
    if (!checkoutUrl) return;
    const w = 520;
    const h = 780;
    const left = Math.max(0, (window.screen.width - w) / 2);
    const top = Math.max(0, (window.screen.height - h) / 2);
    window.open(
      checkoutUrl,
      "chasqr-checkout",
      `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,status=no`,
    );
  };

  // The verify page (running inside the checkout popup) announces success via
  // BroadcastChannel — auto-continue the deploy without any clicks. Also keep
  // a window message listener as a secondary path when window.opener survives.
  useEffect(() => {
    if (!open) return;
    handledRef.current = false;

    const handleVerified = () => {
      if (handledRef.current) return;
      handledRef.current = true;
      onPaidConfirm();
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("chasqr-payments");
      bc.onmessage = (e) => {
        if (e.data?.type === "chasqr:payment-verified") handleVerified();
      };
    } catch { /* BroadcastChannel unsupported — manual button still works */ }

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "chasqr:payment-verified") handleVerified();
    };
    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
      bc?.close();
    };
  }, [open, onPaidConfirm]);
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
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
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

            <h2 className="font-bebas text-3xl text-slate-900 mb-2">
              {title}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-2">
              {totalSize !== undefined ? (
                <>
                  Your upload is{" "}
                  <strong>{(totalSize / 1024 / 1024).toFixed(1)} MB</strong> —
                  uploads over 5 MB require a one-time payment. Once paid, this
                  site is upgraded to <strong className="text-amber-600">PRO</strong>{" "}
                  and can be redeployed at any size, forever.
                </>
              ) : (
                <>
                  Upgrading this site to <strong className="text-amber-600">PRO</strong> requires
                  a one-time payment. Once paid, it can be redeployed at any size, forever.
                </>
              )}
            </p>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Checkout opens in a <strong>secure popup</strong>. After payment
              is verified, this page continues <strong>automatically</strong> —
              no extra clicks needed.
            </p>

            <button
              onClick={openCheckoutPopup}
              disabled={busy || !checkoutUrl}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 rounded-xl hover:bg-primary-dark transition-colors text-sm disabled:opacity-50"
            >
              <CreditCard size={16} /> Pay ₹199.99 & Unlock
            </button>

            <button
              onClick={onPaidConfirm}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm mt-3 disabled:opacity-50"
            >
              {busy ? (
                <span className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full inline-block" />
              ) : (
                <Rocket size={15} />
              )}
              {confirmLabel}
            </button>

            <p className="text-xs text-slate-400 text-center mt-4">
              Secure checkout via Lemon Squeezy. One payment = this site
              unlocked forever.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
