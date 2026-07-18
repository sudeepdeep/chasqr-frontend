import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Rocket, Package, FileText, Lock, Zap } from 'lucide-react';
import { uploadZipAPI, uploadFilesAPI } from '../api/site.api';
import { getPaymentInfoAPI } from '../api/payment.api';
import FileUploader from '../components/FileUploader';
import PaymentModal from '../components/PaymentModal';
import { APP_DOMAIN } from '../lib/siteUrl';

const FREE_UPLOAD_LIMIT = 5 * 1024 * 1024; // 5 MB

export default function Upload() {
  const navigate = useNavigate();
  const [siteName, setSiteName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [selectedZip, setSelectedZip] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  // For built React/Vue/Angular apps: keep them live (JS runs, not editable)
  // instead of the default — prerendering to an editable static snapshot.
  const [keepInteractive, setKeepInteractive] = useState(false);

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

  // Payment gate for uploads > 5MB
  const [payModalOpen, setPayModalOpen] = useState(false);

  const totalSize = selectedZip
    ? selectedZip.size
    : selectedFiles.reduce((acc, f) => acc + f.size, 0);
  const isLargeUpload = totalSize > FREE_UPLOAD_LIMIT;

  const handleDeploy = async () => {
    if (!siteName.trim()) { toast.error('Please enter a site name'); return; }
    if (!hasSelection) { toast.error('Please select a file or folder to upload'); return; }
    if (slugError) { toast.error(slugError); return; }

    // Large uploads need a credit — check before wasting bandwidth
    if (isLargeUpload) {
      try {
        const info = await getPaymentInfoAPI();
        if ((info.data.data.credits || 0) < 1) {
          setPayModalOpen(true);
          return;
        }
      } catch {
        // fall through — backend will still enforce with a 402
      }
    }

    await performDeploy();
  };

  // Called from the payment modal once Razorpay checkout is verified
  const handlePaidAndDeploy = async () => {
    setPayModalOpen(false);
    await performDeploy();
  };

  const performDeploy = async () => {
    setUploading(true);
    try {
      let res;
      if (selectedZip) {
        const fd = new FormData();
        fd.append('file', selectedZip);
        fd.append('name', siteName.trim());
        if (slug) fd.append('slug', slug);
        fd.append('keepInteractive', String(keepInteractive));
        res = await uploadZipAPI(fd);
      } else {
        const fd = new FormData();
        selectedFiles.forEach((f) => fd.append('files', f));
        fd.append('paths', JSON.stringify(selectedPaths));
        fd.append('name', siteName.trim());
        if (slug) fd.append('slug', slug);
        fd.append('keepInteractive', String(keepInteractive));
        res = await uploadFilesAPI(fd);
      }
      const { site } = res.data.data;
      toast.success('Site deployed!');
      navigate(`/sites/${site.siteId}`);
    } catch (err: any) {
      if (err.response?.status === 402) {
        setPayModalOpen(true);
      } else {
        toast.error(err.response?.data?.message || 'Upload failed');
      }
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
            Upload a ZIP of your project or select individual files — plain HTML/CSS/JS or a built React/Angular/Vue/Svelte app (your <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">build</code> / <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">dist</code> folder). Goes live instantly, custom domain anytime. See the <Link to="/docs" className="text-primary hover:underline">docs</Link> for framework-specific steps.
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
                https://
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-project"
                maxLength={50}
                className="flex-1 px-3 py-3 text-sm focus:outline-none bg-white min-w-0"
              />
              <span className="bg-slate-50 text-slate-400 text-sm px-4 py-3 border-l border-slate-200 whitespace-nowrap shrink-0">
                .{APP_DOMAIN}
              </span>
            </div>
            {slugError ? (
              <p className="text-xs text-red-500 mt-1.5">{slugError}</p>
            ) : (
              <p className="text-xs text-slate-400 mt-1.5">
                Your site will be at{' '}
                <span className="font-mono text-primary">https://{previewSlug}.{APP_DOMAIN}</span>
                {' '}— lowercase letters, numbers, and hyphens only
              </p>
            )}
          </div>

          {/* File uploader */}
          <div className="mb-6">
            <FileUploader onZipSelect={handleZipSelect} onFilesSelect={handleFilesSelect} />
          </div>

          {/* Interactive-app option (for built React/Vue/Angular apps) */}
          <label className="mb-8 flex items-start gap-3 border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors">
            <input
              type="checkbox"
              checked={keepInteractive}
              onChange={(e) => setKeepInteractive(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-primary shrink-0"
            />
            <span className="text-sm">
              <span className="font-medium text-slate-800 flex items-center gap-1.5">
                <Zap size={14} className="text-primary" /> This is an interactive app — keep it live
              </span>
              <span className="text-slate-500 text-xs leading-relaxed block mt-1">
                For React/Vue/Angular apps that need working buttons, state, or routing.
                Leave unchecked for regular sites so you can edit text &amp; images in the panel —
                checking this keeps the app fully interactive but turns off in-panel content editing.
              </span>
            </span>
          </label>

          {hasSelection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 bg-primary-light border border-primary/20 rounded-xl p-4 text-sm text-primary flex items-center gap-2 flex-wrap"
            >
              {selectedZip
                ? <><Package size={16} /><strong>{selectedZip.name}</strong> — {(selectedZip.size / 1024).toFixed(1)} KB</>
                : <><FileText size={16} /><strong>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}</strong> selected — {(totalSize / 1024).toFixed(1)} KB</>
              }
              {isLargeUpload && (
                <span className="flex items-center gap-1 ml-auto text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                  <Lock size={11} /> Over 5 MB — paid upload
                </span>
              )}
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
            Your site must contain an <code className="bg-slate-100 px-1 rounded">index.html</code> at the root level. Uploads up to 5 MB are free.
          </p>
        </motion.div>
      </div>

      <PaymentModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        totalSize={totalSize}
        onPaidConfirm={handlePaidAndDeploy}
      />
    </div>
  );
}
