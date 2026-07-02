import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Loader2 } from 'lucide-react';
import { getPageHTMLAPI } from '../api/site.api';

interface Props {
  open: boolean;
  onClose: () => void;
  siteId: string;
  page: string;
  edits: Record<string, string>;
  baseUrl: string;
  /** Optional CSS color replacements (originalToken -> newValue) applied to <style> blocks and inline styles */
  cssReplacements?: Record<string, string>;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyColorReplacements(text: string, replacements: Record<string, string>): string {
  let result = text;
  for (const [oldColor, newColor] of Object.entries(replacements)) {
    if (!oldColor || !newColor || oldColor === newColor) continue;
    let pattern: string;
    if (oldColor.startsWith('#')) {
      pattern = escapeRegExp(oldColor) + '\\b';
    } else {
      pattern = escapeRegExp(oldColor).replace(/,/g, '\\s*,\\s*').replace(/\\\(/g, '\\(\\s*').replace(/\\\)/g, '\\s*\\)');
    }
    result = result.replace(new RegExp(pattern, 'gi'), newColor);
  }
  return result;
}

export default function PreviewModal({ open, onClose, siteId, page, edits, baseUrl, cssReplacements }: Props) {
  const [srcDoc, setSrcDoc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(false);

    getPageHTMLAPI(siteId, page)
      .then((res) => {
        const rawHTML: string = res.data.data.html;
        const doc = new DOMParser().parseFromString(rawHTML, 'text/html');

        // Resolve relative CSS/JS/image URLs against the live site origin
        if (!doc.querySelector('base')) {
          const base = doc.createElement('base');
          base.setAttribute('href', baseUrl);
          doc.head.prepend(base);
        }

        // Apply pending (unsaved) edits on top of the stored HTML
        for (const [key, value] of Object.entries(edits)) {
          const el = doc.querySelector(`[data-chasqr-key="${key}"]`);
          if (!el) continue;
          if (el.tagName.toLowerCase() === 'img') {
            el.setAttribute('src', value);
          } else {
            el.textContent = value;
          }
        }

        // Apply pending (unsaved) color changes to <style> blocks and inline styles
        if (cssReplacements && Object.keys(cssReplacements).length) {
          doc.querySelectorAll('style').forEach(styleEl => {
            styleEl.textContent = applyColorReplacements(styleEl.textContent || '', cssReplacements);
          });
          doc.querySelectorAll('[style]').forEach(el => {
            el.setAttribute('style', applyColorReplacements(el.getAttribute('style') || '', cssReplacements));
          });
        }

        setSrcDoc('<!DOCTYPE html>' + doc.documentElement.outerHTML);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [open, siteId, page, edits, baseUrl, cssReplacements]);

  // Lock the page behind the modal so scrolling never leaks through to it
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Eye size={15} className="text-primary" /> Preview — {page}
              {Object.keys(edits).length > 0 && (
                <span className="text-xs font-normal text-slate-400">(unsaved changes applied)</span>
              )}
            </span>
            <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              <X size={16} /> Close
            </button>
          </div>

          <div className="flex-1 relative bg-slate-50">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={22} className="animate-spin text-primary" />
              </div>
            )}
            {error && !loading && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                Failed to load preview.
              </div>
            )}
            {!loading && !error && (
              <iframe
                title="Site preview"
                srcDoc={srcDoc}
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
