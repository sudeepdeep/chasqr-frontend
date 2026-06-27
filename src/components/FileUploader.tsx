import { useState, useRef, DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, FileText, FolderOpen } from 'lucide-react';

interface Props {
  onZipSelect: (file: File) => void;
  onFilesSelect: (files: File[], paths: string[]) => void;
}

export default function FileUploader({ onZipSelect, onFilesSelect }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<'zip' | 'files'>('zip');
  const zipRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const items = Array.from(e.dataTransfer.files);
    if (!items.length) return;

    if (items.length === 1 && items[0].name.endsWith('.zip')) {
      onZipSelect(items[0]);
      setMode('zip');
    } else {
      const paths = items.map((f) => f.name);
      onFilesSelect(items, paths);
      setMode('files');
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onZipSelect(file);
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const paths = files.map((f) => (f as File & { webkitRelativePath: string }).webkitRelativePath || f.name);
    if (files.length) onFilesSelect(files, paths);
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex bg-slate-100 rounded-xl p-1 w-fit mx-auto">
        {(['zip', 'files'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {m === 'zip' ? <Archive size={14} /> : <FileText size={14} />}
            {m === 'zip' ? 'Upload ZIP' : 'Upload Files'}
          </button>
        ))}
      </div>

      {/* Drop Zone */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? '#2563EB' : '#e2e8f0',
          backgroundColor: isDragging ? '#EFF6FF' : '#f8fafc',
        }}
        className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors"
        onClick={() => mode === 'zip' ? zipRef.current?.click() : filesRef.current?.click()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isDragging ? 'drag' : mode}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center"
          >
            <div className={`mb-4 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`}>
              {isDragging
                ? <FolderOpen size={48} />
                : mode === 'zip'
                  ? <Archive size={48} />
                  : <FileText size={48} />
              }
            </div>
            <p className="font-bebas text-2xl text-slate-700 mb-1">
              {isDragging ? 'DROP IT HERE' : mode === 'zip' ? 'DROP YOUR ZIP FILE' : 'DROP YOUR FILES'}
            </p>
            <p className="text-sm text-slate-400">
              {mode === 'zip'
                ? 'Zip your project folder and drop it here, or click to browse'
                : 'Select all your HTML, CSS, JS and image files'}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <input ref={zipRef} type="file" accept=".zip" className="hidden" onChange={handleZipChange} />
      <input
        ref={filesRef}
        type="file"
        multiple
        // @ts-ignore
        webkitdirectory=""
        className="hidden"
        onChange={handleFilesChange}
      />
    </div>
  );
}
