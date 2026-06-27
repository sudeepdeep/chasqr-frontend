import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Rocket, Package, FileText } from 'lucide-react';
import { uploadZipAPI, uploadFilesAPI } from '../api/site.api';
import FileUploader from '../components/FileUploader';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const SLUG_REGEX = /^[a-z0-9-]*$/;

export default function Upload() {
  const navigate = useNavigate();
  const [siteName, setSiteName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [selectedZip, setSelectedZip] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleZipSelect = (file: File) => {
    setSelectedZip(file);
    setSelectedFiles([]);
    setSelectedPaths([]);
    if (!siteName) setSiteName(file.name.replace('.zip', ''));
    if (!slug) setSlug(file.name.replace('.zip', '').toLowerCase().replace(/[^a-z0-9]/g, '-'));
  };

  const handleFilesSelect = (files: File[], paths: string[]) => {
    setSelectedFiles(files);
    setSelectedPaths(paths);
    setSelectedZip(null);
  };

  const handleSlugChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(cleaned);
    if (cleaned && cleaned.length < 3) setSlugError('At least 3 characters');
    else if (cleaned.length > 50) setSlugError('50 characters max');
    else setSlugError('');
  };

  const hasSelection = selectedZip !== null || selectedFiles.length > 0;

  const handleDeploy = async () => {
    if (!siteName.trim()) { toast.error('Please enter a site name'); return; }
    if (!hasSelection) { toast.error('Please select a file or folder to upload'); return; }
    if (slugError) { toast.error(slugError); return; }

    setUploading(true);
    try {
      let res;
      if (selectedZip) {
        const fd = new FormData();
        fd.append('file', selectedZip);
        fd.append('name', siteName.trim());
        if (slug) fd.append('slug', slug);
        res = await uploadZipAPI(fd);
      } else {
        const fd = new FormData();
        selectedFiles.forEach((f) => fd.append('files', f));
        fd.append('paths', JSON.stringify(selectedPaths));
        fd.append('name', siteName.trim());
        if (slug) fd.append('slug', slug);
        res = await uploadFilesAPI(fd);
      }
      const { site } = res.data.data;
      toast.success('Site deployed!');
      navigate(`/sites/${site.siteId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const previewSlug = slug || '(auto-generated)';

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-bebas text-5xl text-slate-900 mb-2">Deploy A Site</h1>
          <p className="text-slate-500 text-sm mb-10">
            Upload a ZIP of your project or select individual files. Your site goes live instantly.
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

          {/* Custom URL Slug */}
          <div className="mb-8">
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Custom URL <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
              <span className="bg-slate-50 text-slate-400 text-sm px-4 py-3 border-r border-slate-200 whitespace-nowrap shrink-0">
                /sites/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-project"
                maxLength={50}
                className="flex-1 px-3 py-3 text-sm focus:outline-none bg-white"
              />
            </div>
            {slugError ? (
              <p className="text-xs text-red-500 mt-1.5">{slugError}</p>
            ) : (
              <p className="text-xs text-slate-400 mt-1.5">
                Your site will be at{' '}
                <span className="font-mono text-primary">{BASE_URL}/sites/{previewSlug}/</span>
                {' '}— lowercase letters, numbers, and hyphens only
              </p>
            )}
          </div>

          {/* File uploader */}
          <div className="mb-8">
            <FileUploader onZipSelect={handleZipSelect} onFilesSelect={handleFilesSelect} />
          </div>

          {hasSelection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 bg-primary-light border border-primary/20 rounded-xl p-4 text-sm text-primary flex items-center gap-2"
            >
              {selectedZip
                ? <><Package size={16} /><strong>{selectedZip.name}</strong> — {(selectedZip.size / 1024).toFixed(1)} KB</>
                : <><FileText size={16} /><strong>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}</strong> selected</>
              }
            </motion.div>
          )}

          <button
            onClick={handleDeploy}
            disabled={uploading || !hasSelection || !!slugError}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {uploading
              ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full inline-block" />
              : <Rocket size={18} />}
            {uploading ? 'Deploying...' : 'Deploy Site'}
          </button>

          <p className="text-xs text-slate-400 text-center mt-4">
            Your site must contain an <code className="bg-slate-100 px-1 rounded">index.html</code> at the root level.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
