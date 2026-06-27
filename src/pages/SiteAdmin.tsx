import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  ExternalLink, ChevronRight, Eye, Rocket, X, FileCode,
  Link2, Check, Pencil, UploadCloud, Archive, FileText, ChevronDown, BarChart3,
} from 'lucide-react';
import {
  getSiteAPI, updateContentAPI, updateSlugAPI,
  redeployZipAPI, redeployFilesAPI,
} from '../api/site.api';
import ContentEditor from '../components/ContentEditor';
import AnalyticsChart from '../components/AnalyticsChart';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface ContentItem { key: string; label: string; value: string; type: 'text' | 'image' | 'link'; }
interface Page { filename: string; title: string; contentMap: ContentItem[]; }

export default function SiteAdmin() {
  const { siteId } = useParams<{ siteId: string }>();
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [pendingEdits, setPendingEdits] = useState<Record<string, string>>({});

  // Slug editing
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugValue, setSlugValue] = useState('');
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugError, setSlugError] = useState('');

  // Redeploy
  const [redeployOpen, setRedeployOpen] = useState(false);
  const [redeployMode, setRedeployMode] = useState<'zip' | 'files'>('zip');
  const [redeploying, setRedeploying] = useState(false);
  const [redeployFile, setRedeployFile] = useState<File | null>(null);
  const [redeployFiles, setRedeployFilesState] = useState<File[]>([]);
  const [redeployPaths, setRedeployPaths] = useState<string[]>([]);
  const zipRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);

  // Main tabs
  const [mainTab, setMainTab] = useState<'editor' | 'analytics'>('editor');

  const hasChanges = Object.keys(pendingEdits).length > 0;
  const previewUrl = site ? `${BASE_URL}/sites/${site.slug}/` : '';

  useEffect(() => {
    if (!siteId) return;
    getSiteAPI(siteId)
      .then((res) => { setSite(res.data.data.site); setSlugValue(res.data.data.site.slug); })
      .catch(() => toast.error('Failed to load site'))
      .finally(() => setLoading(false));
  }, [siteId]);

  const handleSave = async (updates: Record<string, string>) => {
    if (!siteId || !site) return;
    const page = site.pages[activePage];
    if (!page) return;
    setSaving(true);
    try {
      const res = await updateContentAPI(siteId, page.filename, updates);
      setSite(res.data.data.site);
      setPendingEdits({});
      toast.success('Content deployed!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSlugChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlugValue(cleaned);
    if (cleaned.length < 3) setSlugError('At least 3 characters');
    else if (cleaned.length > 50) setSlugError('50 characters max');
    else setSlugError('');
  };

  const handleSlugSave = async () => {
    if (!siteId || slugError || !slugValue) return;
    setSlugSaving(true);
    try {
      const res = await updateSlugAPI(siteId, slugValue);
      setSite(res.data.data.site);
      setEditingSlug(false);
      toast.success('URL updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update URL');
    } finally {
      setSlugSaving(false);
    }
  };

  const handleRedeploy = async () => {
    if (!siteId) return;
    const hasSelection = redeployFile || redeployFiles.length > 0;
    if (!hasSelection) { toast.error('Please select a file first'); return; }

    setRedeploying(true);
    try {
      let res;
      if (redeployFile) {
        const fd = new FormData();
        fd.append('file', redeployFile);
        res = await redeployZipAPI(siteId, fd);
      } else {
        const fd = new FormData();
        redeployFiles.forEach(f => fd.append('files', f));
        fd.append('paths', JSON.stringify(redeployPaths));
        res = await redeployFilesAPI(siteId, fd);
      }
      setSite(res.data.data.site);
      setActivePage(0);
      setRedeployOpen(false);
      setRedeployFile(null);
      setRedeployFilesState([]);
      toast.success('Site redeployed successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Redeploy failed');
    } finally {
      setRedeploying(false);
    }
  };

  const handlePageSwitch = (idx: number) => {
    if (hasChanges && !window.confirm('You have unsaved changes. Switch page anyway?')) return;
    setActivePage(idx);
    setPendingEdits({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-white pt-24 text-center">
        <p className="text-slate-500">Site not found.</p>
        <Link to="/dashboard" className="text-primary text-sm mt-2 inline-block hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  const pages: Page[] = site.pages || [];
  const currentPage = pages[activePage];

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-6">
      {/* Sticky save bar */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-16 left-0 right-0 z-40 bg-primary shadow-lg"
          >
            <div className="max-w-3xl mx-auto px-6 h-12 flex items-center justify-between">
              <span className="text-white text-sm font-medium">
                {Object.keys(pendingEdits).length} unsaved change{Object.keys(pendingEdits).length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => setPendingEdits({})} className="flex items-center gap-1 text-white/70 hover:text-white text-sm transition-colors">
                  <X size={14} /> Discard
                </button>
                <button
                  onClick={() => handleSave(pendingEdits)}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-white text-primary text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-primary-light transition-colors disabled:opacity-60"
                >
                  {saving ? <span className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full inline-block" /> : <Rocket size={13} />}
                  {saving ? 'Deploying...' : 'Save & Deploy'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-6">
            <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <ChevronRight size={14} />
            <span className="text-slate-700 font-medium">{site.name}</span>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="font-bebas text-5xl text-slate-900">{site.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  site.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {site.status}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Eye size={11} /> {site.visits} visits
                </span>
              </div>
            </div>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <ExternalLink size={14} /> Preview Site
            </a>
          </div>

          {/* URL editor */}
          <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
              <Link2 size={12} /> Site URL
            </p>
            {editingSlug ? (
              <div className="space-y-2">
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary">
                  <span className="bg-slate-50 text-slate-400 text-sm px-3 py-2 border-r border-slate-200 whitespace-nowrap shrink-0">
                    {BASE_URL}/sites/
                  </span>
                  <input
                    autoFocus
                    value={slugValue}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSlugSave();
                      if (e.key === 'Escape') { setEditingSlug(false); setSlugValue(site.slug); setSlugError(''); }
                    }}
                    className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white font-mono"
                    maxLength={50}
                  />
                  <button onClick={handleSlugSave} disabled={!!slugError || slugSaving} className="px-3 py-2 text-green-600 hover:text-green-700 disabled:opacity-40 border-l border-slate-200">
                    <Check size={15} />
                  </button>
                  <button onClick={() => { setEditingSlug(false); setSlugValue(site.slug); setSlugError(''); }} className="px-3 py-2 text-slate-400 hover:text-slate-600 border-l border-slate-200">
                    <X size={15} />
                  </button>
                </div>
                {slugError && <p className="text-xs text-red-500">{slugError}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-mono text-primary truncate">{BASE_URL}/sites/{site.slug}/</span>
                <button
                  onClick={() => setEditingSlug(true)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-white transition-colors shrink-0"
                >
                  <Pencil size={11} /> Edit URL
                </button>
              </div>
            )}
          </div>

          {/* Update Files Section */}
          <div className="mb-8 border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setRedeployOpen(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm"
            >
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <UploadCloud size={15} className="text-primary" />
                Update Site Files
              </span>
              <ChevronDown size={15} className={`text-slate-400 transition-transform ${redeployOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {redeployOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-4">
                    <p className="text-xs text-slate-500">
                      Upload a new version of your site. All existing files will be replaced. Your URL and settings stay the same.
                    </p>

                    {/* Mode toggle */}
                    <div className="flex bg-slate-100 rounded-lg p-1 w-fit">
                      {(['zip', 'files'] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => { setRedeployMode(m); setRedeployFile(null); setRedeployFilesState([]); }}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            redeployMode === m ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {m === 'zip' ? <Archive size={13} /> : <FileText size={13} />}
                          {m === 'zip' ? 'ZIP File' : 'Files'}
                        </button>
                      ))}
                    </div>

                    {/* File picker */}
                    <div
                      onClick={() => redeployMode === 'zip' ? zipRef.current?.click() : filesRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary-light/30 transition-colors"
                    >
                      {redeployMode === 'zip' ? (
                        redeployFile ? (
                          <p className="text-sm text-primary font-medium">📦 {redeployFile.name} — {(redeployFile.size / 1024).toFixed(1)} KB</p>
                        ) : (
                          <p className="text-sm text-slate-400">Click to select a ZIP file</p>
                        )
                      ) : (
                        redeployFiles.length > 0 ? (
                          <p className="text-sm text-primary font-medium">📄 {redeployFiles.length} file{redeployFiles.length !== 1 ? 's' : ''} selected</p>
                        ) : (
                          <p className="text-sm text-slate-400">Click to select files or a folder</p>
                        )
                      )}
                    </div>

                    <input
                      ref={zipRef}
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) setRedeployFile(f); }}
                    />
                    <input
                      ref={filesRef}
                      type="file"
                      multiple
                      // @ts-ignore
                      webkitdirectory=""
                      className="hidden"
                      onChange={e => {
                        const files = Array.from(e.target.files || []);
                        const paths = files.map(f => (f as any).webkitRelativePath || f.name);
                        setRedeployFilesState(files);
                        setRedeployPaths(paths);
                      }}
                    />

                    <button
                      onClick={handleRedeploy}
                      disabled={redeploying || (!redeployFile && redeployFiles.length === 0)}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {redeploying
                        ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Redeploying...</>
                        : <><Rocket size={14} /> Redeploy Site</>
                      }
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Main Tabs */}
          <div className="flex gap-4 mb-8 border-b border-slate-200">
            <button
              onClick={() => setMainTab('editor')}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 -mb-px transition-colors ${
                mainTab === 'editor'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileCode size={14} /> Editor
            </button>
            <button
              onClick={() => setMainTab('analytics')}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 -mb-px transition-colors ${
                mainTab === 'analytics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <BarChart3 size={14} /> Analytics
            </button>
          </div>

          {/* Editor Tab */}
          {mainTab === 'editor' && (
            <>
              {/* Page Tabs */}
              {pages.length > 1 && (
            <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
              {pages.map((page, idx) => (
                <button
                  key={page.filename}
                  onClick={() => handlePageSwitch(idx)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    activePage === idx ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileCode size={13} />
                  {page.filename}
                  <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full ml-1">
                    {page.contentMap.length}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Editor */}
          {!currentPage || currentPage.contentMap.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
              <FileCode size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No editable content found</p>
              <p className="text-slate-400 text-sm mt-1">Your HTML file may use only div containers with no direct text leaves.</p>
            </div>
          ) : (
            <ContentEditor
              contentMap={currentPage.contentMap}
              onSave={handleSave}
              isSaving={saving}
              externalEdits={pendingEdits}
              onEditsChange={setPendingEdits}
            />
          )}
            </>
          )}

          {/* Analytics Tab */}
          {mainTab === 'analytics' && siteId && (
            <div className="py-6">
              <AnalyticsChart siteId={siteId} />
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
