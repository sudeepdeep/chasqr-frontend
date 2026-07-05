import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { ChevronRight, Receipt, Crown } from "lucide-react";
import { getTransactionsAPI, getPaymentInfoAPI } from "../api/payment.api";

interface Tx {
  orderId: string;
  amount: number;
  currency: string;
  created_at: string;
}

export default function Transactions() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTransactionsAPI(), getPaymentInfoAPI()])
      .then(([txRes, infoRes]) => {
        setTxs(txRes.data.data.payments);
        setCredits(infoRes.data.data.credits || 0);
      })
      .catch(() => toast.error("Failed to load transactions"))
      .finally(() => setLoading(false));
  }, []);

  const formatAmount = (amount: number, currency: string) => {
    const value = (amount / 100).toFixed(2);
    const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : `${currency} `;
    return `${symbol}${value}`;
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-6">
      <div className="max-w-[900px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-6">
            <Link to="/dashboard" className="hover:text-primary transition-colors">
              Dashboard
            </Link>
            <ChevronRight size={14} />
            <span className="text-slate-700 font-medium">Transactions</span>
          </div>

          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="font-bebas text-5xl text-slate-900">Transactions</h1>
              <p className="text-slate-500 text-sm mt-1">
                Your large-upload payments on Chasqr
              </p>
            </div>
            {credits > 0 && (
              <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-xl">
                <Crown size={14} />
                {credits} unused credit{credits !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : txs.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl">
              <Receipt size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No transactions yet</p>
              <p className="text-slate-400 text-sm mt-1">
                Payments for large uploads (over 5 MB) will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {txs.map((tx, i) => (
                <motion.div
                  key={tx.orderId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl"
                >
                  <div className="w-10 h-10 shrink-0 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                    <Crown size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      Large upload — PRO site unlock
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      Order #{tx.orderId}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatAmount(tx.amount, tx.currency)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
