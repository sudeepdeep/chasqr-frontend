import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Palette, RotateCcw, Rocket, FileCode } from "lucide-react";
import { getColorsAPI, updateColorsAPI } from "../api/site.api";
import PreviewModal from "./PreviewModal";

interface ColorEntry {
  color: string;
  count: number;
}

interface Props {
  siteId: string;
  pages: { filename: string }[];
  previewBaseUrl?: string;
}

// ── Color conversion helpers ──────────────────────────────────────────────────
// <input type="color"> only accepts #rrggbb, so convert tokens for display.

function clamp255(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toHex2(n: number) {
  return clamp255(n).toString(16).padStart(2, "0");
}

/** Returns { hex: '#rrggbb', alpha: number|null } or null if unparseable */
function parseColorToken(
  token: string,
): { hex: string; alpha: number | null } | null {
  const t = token.trim();

  if (t.startsWith("#")) {
    const raw = t.slice(1);
    if (raw.length === 3 || raw.length === 4) {
      const r = parseInt(raw[0] + raw[0], 16);
      const g = parseInt(raw[1] + raw[1], 16);
      const b = parseInt(raw[2] + raw[2], 16);
      const a = raw.length === 4 ? parseInt(raw[3] + raw[3], 16) / 255 : null;
      return { hex: `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`, alpha: a };
    }
    if (raw.length === 6 || raw.length === 8) {
      const a = raw.length === 8 ? parseInt(raw.slice(6, 8), 16) / 255 : null;
      return { hex: `#${raw.slice(0, 6).toLowerCase()}`, alpha: a };
    }
    return null;
  }

  const rgbMatch = t.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/i,
  );
  if (rgbMatch) {
    const [, r, g, b, a] = rgbMatch;
    return {
      hex: `#${toHex2(+r)}${toHex2(+g)}${toHex2(+b)}`,
      alpha: a !== undefined ? parseFloat(a) : null,
    };
  }

  const hslMatch = t.match(
    /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)/i,
  );
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]) / 360;
    const s = parseFloat(hslMatch[2]) / 100;
    const l = parseFloat(hslMatch[3]) / 100;
    const a = hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : null;

    const hue2rgb = (p: number, q: number, tt: number) => {
      let x = tt;
      if (x < 0) x += 1;
      if (x > 1) x -= 1;
      if (x < 1 / 6) return p + (q - p) * 6 * x;
      if (x < 1 / 2) return q;
      if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
      return p;
    };

    let r: number, g: number, b: number;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return {
      hex: `#${toHex2(r * 255)}${toHex2(g * 255)}${toHex2(b * 255)}`,
      alpha: a,
    };
  }

  return null;
}

/** Build the replacement CSS value, preserving the original alpha channel if present */
function buildReplacement(originalToken: string, pickedHex: string): string {
  const parsed = parseColorToken(originalToken);
  if (parsed?.alpha !== null && parsed?.alpha !== undefined) {
    const r = parseInt(pickedHex.slice(1, 3), 16);
    const g = parseInt(pickedHex.slice(3, 5), 16);
    const b = parseInt(pickedHex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${parsed.alpha})`;
  }
  return pickedHex;
}

export default function ColorEditor({ siteId, pages, previewBaseUrl }: Props) {
  const [selectedPage, setSelectedPage] = useState(0);
  const [colors, setColors] = useState<ColorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  // originalToken -> picked hex
  const [edits, setEdits] = useState<Record<string, string>>({});

  const cssReplacements = useMemo(() => {
    const replacements: Record<string, string> = {};
    for (const [token, hex] of Object.entries(edits)) {
      replacements[token] = buildReplacement(token, hex);
    }
    return replacements;
  }, [edits]);

  const currentPage = pages[selectedPage];

  const loadColors = useCallback(() => {
    if (!currentPage) return;
    setLoading(true);
    setEdits({});
    getColorsAPI(siteId, currentPage.filename)
      .then((res) => setColors(res.data.data.colors))
      .catch(() => toast.error("Failed to load colors"))
      .finally(() => setLoading(false));
  }, [siteId, currentPage]);

  useEffect(() => {
    loadColors();
  }, [loadColors]);

  const handlePick = (token: string, hex: string) => {
    const parsed = parseColorToken(token);
    if (parsed && hex === parsed.hex) {
      // picked back the original — drop the edit
      setEdits((prev) => {
        const next = { ...prev };
        delete next[token];
        return next;
      });
    } else {
      setEdits((prev) => ({ ...prev, [token]: hex }));
    }
  };

  const handleSave = async () => {
    if (!currentPage || !Object.keys(edits).length) return;
    setSaving(true);
    try {
      await updateColorsAPI(siteId, currentPage.filename, cssReplacements);
      toast.success("Colors updated and deployed!");
      loadColors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update colors");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(edits).length > 0;

  if (!currentPage) {
    return (
      <div className="text-center py-8 text-slate-500">No pages found</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Selector */}
      {pages.length > 1 && (
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {pages.map((page, idx) => (
            <button
              key={page.filename}
              onClick={() => setSelectedPage(idx)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                selectedPage === idx
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <FileCode size={13} /> {page.filename}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Colors found in this page's styles. Changing a color updates it
          everywhere it's used — including shared stylesheets.
        </p>
        {hasChanges && (
          <button
            onClick={() => setEdits({})}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 shrink-0 ml-4"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
        </div>
      ) : colors.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <Palette size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No colors found</p>
          <p className="text-slate-400 text-sm mt-1">
            This page's styles don't contain any recognizable color values.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {colors.map((entry, i) => {
            const parsed = parseColorToken(entry.color);
            const displayHex = edits[entry.color] ?? parsed?.hex ?? "#000000";
            const changed = edits[entry.color] !== undefined;

            return (
              <motion.label
                key={entry.color}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  changed
                    ? "border-primary/40 bg-primary-light"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="relative shrink-0">
                  <input
                    type="color"
                    value={displayHex}
                    onChange={(e) => handlePick(entry.color, e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <span
                    className="block w-9 h-9 rounded-lg border border-slate-200 shadow-sm"
                    style={{ background: displayHex }}
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-mono text-slate-700 truncate">
                    {changed ? displayHex : entry.color}
                  </span>
                  <span className="block text-xs text-slate-400">
                    {changed ? `was ${entry.color}` : `used ${entry.count}×`}
                  </span>
                </span>
              </motion.label>
            );
          })}
        </div>
      )}

      {/* Save bar */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-slate-400">
          {hasChanges
            ? `${Object.keys(edits).length} color(s) changed`
            : "No changes yet"}
        </p>
        <div className="flex items-center gap-2">
          {/* {previewBaseUrl && (
            <button
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-2 border border-slate-200 text-slate-600 font-medium px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Eye size={15} /> Preview
            </button>
          )} */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Rocket size={14} />
            )}
            {saving ? "Deploying..." : "Save & Deploy"}
          </button>
        </div>
      </div>

      {previewBaseUrl && currentPage && (
        <PreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          siteId={siteId}
          page={currentPage.filename}
          edits={{}}
          baseUrl={previewBaseUrl}
          cssReplacements={cssReplacements}
        />
      )}
    </div>
  );
}
