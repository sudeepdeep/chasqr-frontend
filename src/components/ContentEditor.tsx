import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Image, Link2, AlignLeft } from 'lucide-react';

interface ContentItem {
  key: string;
  label: string;
  value: string;
  type: 'text' | 'image' | 'link';
}

interface Props {
  contentMap: ContentItem[];
  onSave: (updates: Record<string, string>) => Promise<void>;
  isSaving: boolean;
  externalEdits?: Record<string, string>;
  onEditsChange?: (edits: Record<string, string>) => void;
}

const typeIcon = {
  text: <Pencil size={14} className="text-orange-400" />,
  image: <Image size={14} className="text-purple-400" />,
  link: <Link2 size={14} className="text-primary/70" />,
};

const typeLabel = { text: 'Text', image: 'Image URL', link: 'Link' };

export default function ContentEditor({ contentMap, onSave, isSaving, externalEdits, onEditsChange }: Props) {
  const [localEdits, setLocalEdits] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'text' | 'image' | 'link'>('all');

  const edits = externalEdits ?? localEdits;
  const setEdits = (updater: (prev: Record<string, string>) => Record<string, string>) => {
    const next = updater(edits);
    if (onEditsChange) onEditsChange(next);
    else setLocalEdits(next);
  };

  const getValue = (item: ContentItem) =>
    edits[item.key] !== undefined ? edits[item.key] : item.value;

  const handleChange = (key: string, value: string) =>
    setEdits((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!Object.keys(edits).length) return;
    await onSave(edits);
    if (!onEditsChange) setLocalEdits({});
  };

  const filteredItems = contentMap.filter((i) => filter === 'all' || i.type === filter);
  const hasChanges = Object.keys(edits).length > 0;

  const filterCounts = {
    text: contentMap.filter(i => i.type === 'text').length,
    image: contentMap.filter(i => i.type === 'image').length,
    link: contentMap.filter(i => i.type === 'link').length,
  };

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            filter === 'all' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <AlignLeft size={13} /> All ({contentMap.length})
        </button>
        {(['text', 'image', 'link'] as const).map((f) => (
          filterCounts[f] > 0 && (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {typeIcon[f]} {typeLabel[f]} ({filterCounts[f]})
            </button>
          )
        ))}
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {filteredItems.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-8">No elements of this type found.</p>
        )}

        {filteredItems.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.3) }}
            className={`p-4 rounded-xl border transition-colors ${
              edits[item.key] !== undefined
                ? 'border-primary/30 bg-primary-light'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {typeIcon[item.type]}
              <label className="text-sm font-medium text-slate-700">{item.label}</label>
              <span className="text-xs text-slate-400 font-mono ml-auto">{item.key}</span>
            </div>

            {item.type === 'text' && item.value.length > 80 ? (
              <textarea
                value={getValue(item)}
                onChange={(e) => handleChange(item.key, e.target.value)}
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-white"
              />
            ) : (
              <input
                type="text"
                value={getValue(item)}
                onChange={(e) => handleChange(item.key, e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom save */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-slate-400">
          {hasChanges ? `${Object.keys(edits).length} unsaved change(s)` : 'No changes yet'}
        </p>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2 bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving
            ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            : null}
          {isSaving ? 'Deploying...' : 'Save & Deploy'}
        </button>
      </div>
    </div>
  );
}
