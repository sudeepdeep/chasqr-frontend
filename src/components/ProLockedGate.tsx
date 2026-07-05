import { Crown, Lock } from "lucide-react";

interface Props {
  title: string;
  description: string;
  onUpgradeClick: () => void;
  upgrading?: boolean;
}

export default function ProLockedGate({ title, description, onUpgradeClick, upgrading }: Props) {
  return (
    <div className="text-center py-14 px-6 border-2 border-dashed border-amber-200 bg-amber-50/40 rounded-2xl">
      <div className="w-12 h-12 mx-auto mb-4 bg-white border border-amber-200 rounded-xl flex items-center justify-center text-amber-500">
        <Lock size={20} />
      </div>
      <h2 className="font-bebas text-2xl text-slate-900 mb-1.5">{title}</h2>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">{description}</p>
      <button
        onClick={onUpgradeClick}
        disabled={upgrading}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-colors disabled:opacity-60 text-sm"
      >
        {upgrading ? (
          <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full inline-block" />
        ) : (
          <Crown size={14} className="fill-white" />
        )}
        Upgrade to PRO
      </button>
    </div>
  );
}
