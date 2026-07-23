import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Rocket, Plus, UploadCloud, Paintbrush, X, ArrowRight } from 'lucide-react';
import { getMySitesAPI, deleteSiteAPI, toggleStatusAPI } from '../api/site.api';
import { AuthStore } from '../store/auth';
import SiteCard from '../components/SiteCard';

// Two-option chooser shown when starting a new site: deploy existing code, or
// build a fresh page in the visual layout tool.
function NewSiteModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const options = [
    {
      to: '/upload',
      icon: UploadCloud,
      title: 'Deploy existing code',
      desc: 'Upload a ZIP or your HTML/CSS/JS files (or a built React/Vue/Angular app) and go live instantly.',
    },
    {
      to: '/build',
      icon: Paintbrush,
      title: 'Build from scratch',
      desc: 'Start with a blank white page and design it visually — sections, columns, navbar & footer. No code.',
      badge: 'New',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={18} />
        </button>
        <h2 className="font-bebas text-3xl text-slate-900 mb-1">Start a New Site</h2>
        <p className="text-slate-500 text-sm mb-6">How do you want to build it?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.to}
                onClick={() => navigate(opt.to)}
                className="group text-left border border-slate-200 rounded-xl p-5 hover:border-primary hover:bg-primary-light/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="w-11 h-11 flex items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Icon size={20} />
                  </span>
                  {opt.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-primary text-white px-2 py-0.5 rounded-full">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-1.5">
                  {opt.title}
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = AuthStore.useState();
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSiteOpen, setNewSiteOpen] = useState(false);

  useEffect(() => {
    getMySitesAPI()
      .then((res) => setSites(res.data.data.sites))
      .catch(() => toast.error('Failed to load sites'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (siteId: string) => {
    if (!window.confirm('Delete this site? This cannot be undone.')) return;
    try {
      await deleteSiteAPI(siteId);
      setSites((prev) => prev.filter((s) => s.siteId !== siteId));
      toast.success('Site deleted');
    } catch {
      toast.error('Failed to delete site');
    }
  };

  const handleRename = (siteId: string, newName: string) => {
    setSites((prev) => prev.map((s) => (s.siteId === siteId ? { ...s, name: newName } : s)));
  };

  const handleToggle = async (siteId: string) => {
    try {
      const res = await toggleStatusAPI(siteId);
      const updated = res.data.data.site;
      setSites((prev) => prev.map((s) => (s.siteId === siteId ? updated : s)));
      toast.success(res.data.message);
    } catch {
      toast.error('Failed to update site status');
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-6">
      <div className="max-w-[1300px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-bebas text-5xl text-slate-900">Your Sites</h1>
            <p className="text-slate-500 text-sm mt-1">
              Hey {user?.name} — {sites.length} site{sites.length !== 1 ? 's' : ''} deployed
            </p>
          </div>
          {!loading && sites.length > 0 && (
            <button
              onClick={() => setNewSiteOpen(true)}
              className="flex items-center gap-2 bg-primary text-white font-semibold px-5 py-3 rounded-xl hover:bg-primary-dark transition-colors shrink-0"
            >
              <Plus size={16} /> New Site
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-56 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : sites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 border-2 border-dashed border-slate-200 rounded-2xl"
          >
            <Rocket size={48} className="text-slate-300 mx-auto mb-4" />
            <h2 className="font-bebas text-3xl text-slate-800 mb-2">Deploy Your First Site</h2>
            <p className="text-slate-400 text-sm mb-6">Upload existing code or build a fresh page visually — go live instantly</p>
            <button
              onClick={() => setNewSiteOpen(true)}
              className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors inline-block"
            >
              Create Your First Site
            </button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sites.map((site) => (
                <SiteCard
                  key={site.siteId}
                  site={site}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  onRename={handleRename}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {newSiteOpen && <NewSiteModal onClose={() => setNewSiteOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
