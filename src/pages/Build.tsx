import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Paintbrush, LayoutTemplate } from 'lucide-react';
import { createBlankSiteAPI } from '../api/site.api';
import SlugInput from '../components/SlugInput';

export default function Build() {
  const navigate = useNavigate();
  const [siteName, setSiteName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!siteName.trim()) { toast.error('Please enter a site name'); return; }
    if (slugError) { toast.error(slugError); return; }
    setCreating(true);
    try {
      const res = await createBlankSiteAPI(siteName.trim(), slug || undefined);
      const { site } = res.data.data;
      toast.success('Blank site created — start designing!');
      // Drop straight into the full-screen visual builder for the new site.
      navigate(`/sites/${site.siteId}/builder`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create site');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-bebas text-5xl text-slate-900 mb-2">Build A Site</h1>
          <p className="text-slate-500 text-sm mb-10">
            Start from a blank white page and design it visually — drag in headings, text,
            images, buttons, and a navbar &amp; footer. No code, no upload. You can add a custom
            domain anytime from the site dashboard.
          </p>

          {/* Site Name */}
          <div className="mb-5">
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Site Name</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="My Awesome Site"
              maxLength={60}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <SlugInput
            value={slug}
            error={slugError}
            onChange={(v, err) => { setSlug(v); setSlugError(err); }}
          />

          <div className="mb-8 flex items-start gap-3 border border-slate-200 rounded-xl p-4 bg-slate-50">
            <LayoutTemplate size={18} className="text-primary shrink-0 mt-0.5" />
            <span className="text-sm text-slate-600 leading-relaxed">
              We'll create an empty white page and open the visual builder. Add sections,
              columns, and a navbar / footer, then hit <strong>Save &amp; Deploy</strong> to go live.
            </span>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !siteName.trim() || !!slugError}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {creating
              ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full inline-block" />
              : <Paintbrush size={18} />}
            {creating ? 'Creating...' : 'Create & Start Building'}
          </button>

          <p className="text-xs text-slate-400 text-center mt-4">
            Prefer to deploy code you already have?{' '}
            <Link to="/upload" className="text-primary hover:underline">Upload files instead</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
