import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Plus, Rocket } from 'lucide-react';
import { getMySitesAPI, deleteSiteAPI, toggleStatusAPI } from '../api/site.api';
import { AuthStore } from '../store/auth';
import SiteCard from '../components/SiteCard';

export default function Dashboard() {
  const { user } = AuthStore.useState();
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-bebas text-5xl text-slate-900">Your Sites</h1>
            <p className="text-slate-500 text-sm mt-1">
              Hey {user?.name} — {sites.length} site{sites.length !== 1 ? 's' : ''} deployed
            </p>
          </div>
          <Link
            to="/upload"
            className="flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            <Plus size={16} /> New Site
          </Link>
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
            <p className="text-slate-400 text-sm mb-6">Upload a zip or your HTML files and go live instantly</p>
            <Link
              to="/upload"
              className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors inline-block"
            >
              Deploy Now
            </Link>
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
    </div>
  );
}
