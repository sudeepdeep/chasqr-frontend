import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, X } from "lucide-react";

const NOTICE_KEY = "chasqr_hide_storage_notice";

export default function StorageNoticeBanner() {
  const [show, setShow] = useState(() => !localStorage.getItem(NOTICE_KEY));

  const dismiss = () => {
    localStorage.setItem(NOTICE_KEY, "1");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
        >
          <div className="w-full px-6 sm:px-10 py-4 flex items-start sm:items-center gap-4 flex-col sm:flex-row">
            <div className="flex items-start sm:items-center gap-3 flex-1">
              <div className="w-9 h-9 shrink-0 bg-primary-light text-primary rounded-lg flex items-center justify-center">
                <ShieldCheck size={17} />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-800">We store your build output, not your source code.</strong>{" "}
                Chasqr only keeps the compiled files you upload (HTML, CSS, JS, images) — never your
                git history, private repository, or uncompiled source. Your business logic and
                proprietary code stay entirely on your own machine or repo.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
              <button
                onClick={dismiss}
                className="text-sm font-semibold text-primary hover:underline whitespace-nowrap"
              >
                Got it
              </button>
              <button
                onClick={dismiss}
                className="text-slate-400 hover:text-slate-600"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
