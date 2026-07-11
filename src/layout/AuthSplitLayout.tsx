import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Globe, Pencil, BarChart2 } from 'lucide-react';

const features = [
  { icon: <Zap size={16} />, label: 'Instant deploys from a ZIP or folder' },
  { icon: <Globe size={16} />, label: 'Custom domains with free SSL' },
  { icon: <Pencil size={16} />, label: 'Live content editor, no code' },
  { icon: <BarChart2 size={16} />, label: 'Built-in visit analytics' },
];

interface AuthSplitLayoutProps {
  headline: ReactNode;
  subheadline: string;
  topPrompt: string;
  topLinkLabel: string;
  topLinkTo: string;
  children: ReactNode;
}

export default function AuthSplitLayout({
  headline,
  subheadline,
  topPrompt,
  topLinkLabel,
  topLinkTo,
  children,
}: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left brand panel */}
      <div className="relative hidden md:flex md:w-[42%] bg-slate-900 overflow-hidden flex-col justify-between p-10 lg:p-14">
        <div className="absolute -top-24 -left-24 w-[26rem] h-[26rem] bg-primary/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-24 w-[22rem] h-[22rem] bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

        <Link to="/" className="relative inline-flex items-center gap-2 font-bebas text-2xl text-white tracking-widest w-fit">
          <img src="/logo.svg" alt="Chasqr" className="w-7 h-7" />
          CHASQR
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <h1 className="font-bebas text-5xl lg:text-6xl text-white leading-none mb-4">
            {headline}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-sm">
            {subheadline}
          </p>

          <ul className="space-y-3.5">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="p-1.5 bg-white/10 text-primary-light rounded-lg shrink-0">
                  {f.icon}
                </span>
                {f.label}
              </li>
            ))}
          </ul>
        </motion.div>

        <span className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} Chasqr — Deploy fast, iterate faster.
        </span>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex justify-between items-center px-6 py-5 md:justify-end">
          <Link to="/" className="md:hidden inline-flex items-center gap-2 font-bebas text-xl text-primary tracking-widest">
            <img src="/logo.svg" alt="Chasqr" className="w-6 h-6" />
            CHASQR
          </Link>
          <p className="text-sm text-slate-500">
            {topPrompt}{' '}
            <Link to={topLinkTo} className="text-primary font-medium hover:underline">
              {topLinkLabel}
            </Link>
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
