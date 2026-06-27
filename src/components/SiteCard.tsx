import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Eye, Layers, Pencil, ExternalLink, Pause, Play, Trash2, Calendar, Check, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { renameSiteAPI } from '../api/site.api';

interface Site {
  siteId: string;
  slug?: string;
  name: string;
  status: 'active' | 'inactive';
  plan: 'free' | 'paid';
  visits: number;
  created_at: string;
  pages: { filename: string; contentMap: { key: string }[] }[];
}

interface Props {
  site: Site;
  onDelete: (siteId: string) => void;
  onToggle: (siteId: string) => void;
  onRename: (siteId: string, newName: string) => void;
}


export default function SiteCard({ site, onDelete, onToggle, onRename }: Props) {
  const previewUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/sites/${site.slug || site.siteId}/`;
  const totalElements = site.pages?.reduce((acc, p) => acc + p.contentMap.length, 0) ?? 0;
  const isActive = site.status === 'active';

  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(site.name);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleRename = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === site.name) { setEditing(false); setNameValue(site.name); return; }
    setSaving(true);
    try {
      await renameSiteAPI(site.siteId, trimmed);
      onRename(site.siteId, trimmed);
      setEditing(false);
      toast.success('Site renamed');
    } catch {
      toast.error('Failed to rename site');
      setNameValue(site.name);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRename();
    if (e.key === 'Escape') { setEditing(false); setNameValue(site.name); }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      whileHover={{ y: -3, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.10)' }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col relative shadow-sm"
    >
      {/* Decorative circle — top right, always */}
      <div
        className="absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none"
        style={{ background: 'rgb(var(--primary))', opacity: 0.08 }}
      />

      <div className="relative p-6 flex flex-col flex-1">
        {/* Name row */}
        <div className="flex items-start justify-between mb-1 gap-2">
          {editing ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <input
                ref={inputRef}
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="font-bebas text-xl text-slate-900 tracking-wide bg-transparent border-b-2 border-primary outline-none w-full leading-tight pb-0.5"
                disabled={saving}
              />
              <button onClick={handleRename} disabled={saving} className="text-green-500 hover:text-green-600 shrink-0">
                <Check size={15} />
              </button>
              <button onClick={() => { setEditing(false); setNameValue(site.name); }} className="text-slate-400 hover:text-slate-600 shrink-0">
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group flex-1 min-w-0">
              <h3 className="font-bebas text-2xl text-slate-900 tracking-wide leading-tight truncate">
                {site.name}
              </h3>
              <button
                onClick={() => setEditing(true)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-all shrink-0"
                title="Rename site"
              >
                <Pencil size={13} />
              </button>
            </div>
          )}

          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
            isActive ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
            {site.status}
          </span>
        </div>

        <p className="text-xs text-slate-400 font-mono mb-5">{site.siteId}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Eye size={12} className="text-slate-400" />
            <strong className="text-slate-700 font-semibold">{site.visits}</strong> visits
          </span>
          <span className="flex items-center gap-1.5">
            <Layers size={12} className="text-slate-400" />
            <strong className="text-slate-700 font-semibold">{totalElements}</strong> elements
          </span>
          <span className="flex items-center gap-1.5 ml-auto whitespace-nowrap text-slate-400">
            <Calendar size={11} />
            {new Date(site.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Page pills */}
        {site.pages?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-5">
            {site.pages.map(p => (
              <span key={p.filename} className="text-xs bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg font-mono border border-slate-200">
                {p.filename}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
          <Link
            to={`/sites/${site.siteId}`}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
          >
            <Pencil size={13} /> Edit
          </Link>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Preview"
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <ExternalLink size={15} />
          </a>
          <button
            onClick={() => onToggle(site.siteId)}
            title={isActive ? 'Take offline' : 'Go live'}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            {isActive ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            onClick={() => onDelete(site.siteId)}
            title="Delete"
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
