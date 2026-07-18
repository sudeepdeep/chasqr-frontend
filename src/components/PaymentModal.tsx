import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { Lock, X, CreditCard } from "lucide-react";
import { createPaymentOrderAPI, verifyOrderAPI } from "../api/payment.api";
import { getUpgradeQuoteAPI } from "../api/site.api";
import { loadRazorpayScript } from "../lib/razorpay";
import { loadCashfreeScript } from "../lib/cashfree";

interface UpgradeQuote {
  amountRupees: number;
  sizeMB: number;
  pages: number;
  breakdown: {
    basePaise: number;
    sizePaise: number;
    pagePaise: number;
    floored: boolean;
    capped: boolean;
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Upload size in bytes — omit for a generic upgrade (no upload context). */
  totalSize?: number;
  /** When set, this is a dynamic PRO-upgrade for that site — price is fetched
   *  and computed from the site's size + pages, not the flat credit price. */
  siteId?: string;
  onPaidConfirm: () => void;
  title?: string;
}

export default function PaymentModal({
  open,
  onClose,
  totalSize,
  siteId,
  onPaidConfirm,
  title = "Large Upload",
}: Props) {
  const [paying, setPaying] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"razorpay" | "cashfree">("razorpay");
  const [quote, setQuote] = useState<UpgradeQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Fetch the site-specific price when this modal opens for an upgrade.
  useEffect(() => {
    if (!open || !siteId) { setQuote(null); return; }
    let cancelled = false;
    setQuoteLoading(true);
    getUpgradeQuoteAPI(siteId)
      .then((res) => { if (!cancelled) setQuote(res.data.data.quote); })
      .catch((err) => {
        if (!cancelled) toast.error(err.response?.data?.message || "Could not load upgrade price");
      })
      .finally(() => { if (!cancelled) setQuoteLoading(false); });
    return () => { cancelled = true; };
  }, [open, siteId]);

  const rupees = (paise: number) => `₹${(paise / 100).toFixed(0)}`;
  const payLabel = quote ? `Pay ₹${quote.amountRupees.toFixed(0)} & Unlock` : "Pay & Unlock";

  const handleVerified = () => {
    toast.success("Payment verified — unlocked!");
    onPaidConfirm();
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await createPaymentOrderAPI(selectedProvider, siteId);
      const { orderId, amount, currency, checkout, name, email, fellBack } = res.data.data;

      if (fellBack) {
        toast.info(
          `${selectedProvider === "razorpay" ? "Razorpay" : "Cashfree"} is unavailable right now — using ${checkout.provider === "razorpay" ? "Razorpay" : "Cashfree"} instead.`,
        );
      }

      // Which gateway actually handles this can differ from what was selected
      // (fallback may have kicked in) — always trust checkout.provider, not selectedProvider.
      if (checkout.provider === "cashfree") {
        await loadCashfreeScript();
        const cashfree = new window.Cashfree({ mode: checkout.mode });
        await cashfree.checkout({ paymentSessionId: checkout.paymentSessionId, redirectTarget: "_modal" });
        try {
          await verifyOrderAPI({ cashfree_order_id: orderId });
          handleVerified();
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Payment verification failed");
        } finally {
          setPaying(false);
        }
        return;
      }

      await loadRazorpayScript();
      const razorpay = new window.Razorpay({
        key: checkout.keyId,
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
            handleVerified();
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
                  <strong className="text-amber-600">PRO</strong> unlocks a{" "}
                  <strong>custom domain</strong>,{" "}
                  <strong>expert support chat</strong>, and{" "}
                  <strong>uploads of any size</strong> — one payment, forever,
                  for this site.
                </>
              )}
            </p>

            {/* Dynamic price breakdown for a site upgrade */}
            {siteId && (
              <div className="border border-slate-200 rounded-xl p-4 mb-5 text-sm">
                {quoteLoading || !quote ? (
                  <div className="flex items-center gap-2 text-slate-400 py-1">
                    <span className="animate-spin w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full inline-block" />
                    Calculating your price…
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-500 mb-1">
                      <span>Base</span>
                      <span>{rupees(quote.breakdown.basePaise)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 mb-1">
                      <span>Size · {quote.sizeMB} MB</span>
                      <span>{rupees(quote.breakdown.sizePaise)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 mb-2">
                      <span>Pages · {quote.pages}</span>
                      <span>{rupees(quote.breakdown.pagePaise)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-100 pt-2">
                      <span>Total{quote.breakdown.capped ? " (capped)" : quote.breakdown.floored ? " (min)" : ""}</span>
                      <span>₹{quote.amountRupees.toFixed(0)}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Priced from this site's total size and {quote.pages} page{quote.pages === 1 ? "" : "s"}.
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-3 mb-5">
              {(["razorpay", "cashfree"] as const).map((p) => (
                <label
                  key={p}
                  className={`flex-1 flex items-center gap-2.5 border rounded-xl px-4 py-3 text-sm font-medium cursor-pointer transition-colors ${
                    selectedProvider === p
                      ? "border-primary bg-primary-light text-primary"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-provider"
                    value={p}
                    checked={selectedProvider === p}
                    onChange={() => setSelectedProvider(p)}
                    className="accent-primary"
                  />
                  {p === "razorpay" ? "Razorpay" : "Cashfree"}
                </label>
              ))}
            </div>

            <button
              onClick={handlePay}
              disabled={paying || (!!siteId && (quoteLoading || !quote))}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 rounded-xl hover:bg-primary-dark transition-colors text-sm disabled:opacity-50"
            >
              {paying ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
              ) : (
                <CreditCard size={16} />
              )}
              {paying
                ? "Opening checkout..."
                : siteId
                  ? payLabel
                  : "Pay ₹199 & Unlock"}
            </button>

            <p className="text-xs text-slate-400 text-center mt-4">
              Secure checkout. One payment = this site unlocked forever.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
