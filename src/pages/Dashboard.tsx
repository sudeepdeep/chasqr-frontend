import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Rocket, Plus, Search, UploadCloud, Paintbrush, FolderGit2, X, ArrowRight } from 'lucide-react';
import { AuthStore } from '../store/auth';
import SiteGridCard, { DashSite } from '../components/SiteGridCard';
import { useSites, useSiteMutations } from '../queries/sites';

// Two-option chooser shown when starting a new site: deploy existing code, or
// build a fresh page in the visual layout tool.
function NewSiteModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const options = [
    {
      to: '/import/github',
      icon: FolderGit2,
      title: 'Import from GitHub',
      desc: 'Connect a repository and deploy its built output — with automatic redeploys on every push.',
      badge: 'New',
    },
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={18} />
        </button>
        <h2 className="font-bebas text-3xl text-slate-900 mb-1">Start a New Site</h2>
        <p className="text-slate-500 text-sm mb-6">How do you want to build it?</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
  const [newSiteOpen, setNewSiteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Live' | 'Paused'>('All');
  const [sort, setSort] = useState<'deployed' | 'visits' | 'name'>('deployed');

  // Served from the shared cache. Coming back to this page inside the stale
  // window paints immediately with no request and no loading state.
  const { data, isPending, isError } = useSites();
  const sites = (data ?? []) as DashSite[];
  const loading = isPending;

  const { rename, toggle, remove } = useSiteMutations();

  useEffect(() => {
    if (isError) toast.error('Failed to load sites');
  }, [isError]);

  const handleDelete = (site: DashSite) => {
    if (
      !window.confirm(
        `Delete "${site.name}"? Its files, form submissions and analytics go with it, and the URL is freed for anyone to claim. This cannot be undone.`,
      )
    ) return;
    remove.mutate(site.siteId, {
      onSuccess: () => toast.success('Site deleted'),
      onError: () => toast.error('Failed to delete site'),
    });
  };

  const handleRename = (site: DashSite) => {
    const next = window.prompt('Rename site', site.name);
    if (next === null) return;
    const name = next.trim();
    if (!name || name === site.name) return;
    rename.mutate(
      { siteId: site.siteId, name },
      {
        onSuccess: () => toast.success('Site renamed'),
        onError: () => toast.error('Failed to rename site'),
      },
    );
  };

  const handleToggle = (site: DashSite) => {
    toggle.mutate(site.siteId, {
      onSuccess: (res) => toast.success(res.data.message),
      onError: () => toast.error('Failed to update site status'),
    });
  };

  const liveCount = sites.filter((s) => s.status === 'active').length;

  // Search, filter and sort all run client-side. /api/sites already returns the
  // whole list in one call, so round-tripping for these would be slower than
  // filtering an array we are holding anyway.
  const visible = sites
    .filter((s) =>
      filter === 'All' ? true : filter === 'Live' ? s.status === 'active' : s.status !== 'active',
    )
    .filter((s) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.slug || '').toLowerCase().includes(q) ||
        (s.customDomain || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sort === 'visits') return (b.visits || 0) - (a.visits || 0);
      if (sort === 'name') return a.name.localeCompare(b.name);
      return (
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime()
      );
    });

  const FILTERS: Array<'All' | 'Live' | 'Paused'> = ['All', 'Live', 'Paused'];

  return (
    <div className="min-h-screen bg-white px-6 pb-20 pt-24 sm:px-10">
      <div className="mx-auto max-w-[1300px]">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-bebas text-[52px] leading-none tracking-[0.01em] text-slate-900">
              Your Sites
            </h1>
            <p className="mt-2 text-[13.5px] text-slate-500">
              Hey {user?.name}
              {!loading && sites.length > 0 && (
                <>
                  {' '}— {sites.length} site{sites.length === 1 ? '' : 's'} deployed · {liveCount} live
                </>
              )}
            </p>
          </div>
          {!loading && sites.length > 0 && (
            <button
              onClick={() => setNewSiteOpen(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              <Plus size={16} /> New Site
            </button>
          )}
        </div>

        {/* Toolbar — only worth showing once there is something to sift through. */}
        {!loading && sites.length > 0 && (
          <div className="mb-7 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-5">
            <div className="relative flex-[0_1_320px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sites or domains"
                className="w-full rounded-[10px] border border-slate-200 bg-slate-50 py-[9px] pl-8 pr-3 text-[13px] text-slate-900 outline-none transition-colors focus:border-primary focus:bg-white"
              />
            </div>

            <div className="flex gap-0.5 rounded-[10px] bg-slate-100 p-[3px]">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg border-0 px-[13px] py-1.5 text-[12.5px] transition-colors ${
                    filter === f
                      ? 'bg-white font-semibold text-slate-900 shadow-sm'
                      : 'bg-transparent font-medium text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <label className="flex items-center gap-2">
              <span className="sr-only">Sort sites by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as 'deployed' | 'visits' | 'name')}
                className="cursor-pointer rounded-[10px] border border-slate-200 bg-white px-3 py-[9px] text-[13px] font-medium text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-primary"
              >
                <option value="deployed">Last deployed</option>
                <option value="visits">Most visits</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </label>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[300px] animate-pulse rounded-[14px] border border-slate-200 bg-slate-50"
              />
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
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 px-6 py-16 text-center">
            <p className="text-sm text-slate-500">
              No sites match {query.trim() ? `“${query.trim()}”` : `the ${filter} filter`}.
            </p>
            <button
              onClick={() => {
                setQuery('');
                setFilter('All');
              }}
              className="mt-3 text-sm font-medium text-primary hover:text-primary-dark"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((site) => (
              <SiteGridCard
                key={site.siteId}
                site={site}
                onToggle={handleToggle}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {newSiteOpen && <NewSiteModal onClose={() => setNewSiteOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
