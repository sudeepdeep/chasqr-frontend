import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Globe, Eye, Share2, Save } from 'lucide-react';
import { updateSEOAPI } from '../api/site.api';

interface Page {
  filename: string;
  title: string;
  metaDescription?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
}

interface Props {
  siteId: string;
  pages: Page[];
}

export default function SEOEditor({ siteId, pages }: Props) {
  const [selectedPage, setSelectedPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const currentPage = pages[selectedPage];

  const [formData, setFormData] = useState({
    title: '',
    metaDescription: '',
    ogImage: '',
    ogTitle: '',
    ogDescription: '',
  });

  useEffect(() => {
    if (currentPage) {
      setFormData({
        title: currentPage.title || '',
        metaDescription: currentPage.metaDescription || '',
        ogImage: currentPage.ogImage || '',
        ogTitle: currentPage.ogTitle || '',
        ogDescription: currentPage.ogDescription || '',
      });
      setDirty(false);
    }
  }, [currentPage]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!currentPage) return;
    setSaving(true);
    try {
      await updateSEOAPI(siteId, {
        page: currentPage.filename,
        ...formData,
      });
      setDirty(false);
      toast.success('SEO updated and deployed!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update SEO');
    } finally {
      setSaving(false);
    }
  };

  if (!currentPage) {
    return <div className="text-center py-8 text-slate-500">No pages found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Selector */}
      {pages.length > 1 && (
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
          {pages.map((page, idx) => (
            <button
              key={page.filename}
              onClick={() => setSelectedPage(idx)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                selectedPage === idx
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {page.filename}
            </button>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Edit Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          key={currentPage.filename}
          className="space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Page Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => handleChange('title', e.target.value)}
              maxLength={60}
              placeholder="Your page title (60 chars max)"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">{formData.title.length}/60</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={formData.metaDescription}
              onChange={e => handleChange('metaDescription', e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Brief description shown in search results (160 chars max)"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{formData.metaDescription.length}/160</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              OG Image URL
            </label>
            <input
              type="url"
              value={formData.ogImage}
              onChange={e => handleChange('ogImage', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">Image shown when sharing on social media</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              OG Title (for sharing)
            </label>
            <input
              type="text"
              value={formData.ogTitle}
              onChange={e => handleChange('ogTitle', e.target.value)}
              maxLength={60}
              placeholder="Title for social sharing"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">{formData.ogTitle.length}/60</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              OG Description (for sharing)
            </label>
            <textarea
              value={formData.ogDescription}
              onChange={e => handleChange('ogDescription', e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Description for social sharing (160 chars max)"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{formData.ogDescription.length}/160</p>
          </div>

          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save SEO Changes'}
          </button>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-5"
        >
          <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
              <Eye size={12} /> Google Search Preview
            </p>
            <div className="space-y-1.5">
              <p className="text-blue-600 text-sm font-medium truncate">
                {formData.title || '(No title)'}
              </p>
              <p className="text-green-700 text-xs truncate">
                chasqr.com/sites/{currentPage.filename}
              </p>
              <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                {formData.metaDescription || '(No meta description)'}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
              <Share2 size={12} /> Social Media Preview
            </p>
            <div className="space-y-2">
              {formData.ogImage && (
                <div className="w-full h-32 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center text-slate-500 text-xs">
                  <img
                    src={formData.ogImage}
                    alt="OG preview"
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-900 line-clamp-2">
                  {formData.ogTitle || formData.title || '(No title)'}
                </p>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {formData.ogDescription || formData.metaDescription || '(No description)'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
              <Globe size={12} /> Tips
            </p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Keep title under 60 characters</li>
              <li>• Meta description under 160 characters</li>
              <li>• Use OG tags for better social sharing</li>
              <li>• OG image should be at least 1200x630px</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
