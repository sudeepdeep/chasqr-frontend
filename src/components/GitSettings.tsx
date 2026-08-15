import {
  AlertTriangle,
  Check,
  CheckCircle2,
  GitBranch,
  RefreshCw,
  Unlink,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { redeployFromGitAPI, updateGitSettingsAPI } from "../api/github.api";
import { GithubIcon } from "../assets/Icons";

interface Props {
  siteId: string;
  site: any;
  onChange: (site: any) => void;
}

const STATUS_STYLES: Record<string, { box: string; icon: any; label: string }> = {
  success: {
    box: "border-green-200 bg-green-50/60 text-green-700",
    icon: CheckCircle2,
    label: "Last deploy succeeded",
  },
  skipped: {
    box: "border-amber-200 bg-amber-50/60 text-amber-700",
    icon: AlertTriangle,
    label: "Last deploy was skipped",
  },
  failed: {
    box: "border-red-200 bg-red-50/60 text-red-700",
    icon: AlertTriangle,
    label: "Last deploy failed",
  },
};

export default function GitSettings({ siteId, site, onChange }: Props) {
  const [saving, setSaving] = useState(false);
  const [redeploying, setRedeploying] = useState(false);
  const git = site.gitRepo;

  const patch = async (
    data: Parameters<typeof updateGitSettingsAPI>[1],
    message: string,
  ) => {
    setSaving(true);
    try {
      const res = await updateGitSettingsAPI(siteId, data);
      onChange(res.data.data.site);
      toast.success(message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Couldn't update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRedeploy = async () => {
    setRedeploying(true);
    try {
      const res = await redeployFromGitAPI(siteId);
      onChange(res.data.data.site);
      toast.success("Redeployed from GitHub");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Redeploy failed");
    } finally {
      setRedeploying(false);
    }
  };

  if (!git) {
    return (
      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
        <h2 className="font-bebas text-2xl text-slate-900 mb-1">GitHub</h2>
        <p className="text-xs text-slate-500 mb-4">
          This site isn't connected to a repository.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Sites imported from GitHub can redeploy themselves whenever you push.
          To use it here, create a new site with{" "}
          <Link to="/import/github" className="text-primary hover:underline">
            Import from GitHub
          </Link>
          .
        </p>
      </div>
    );
  }

  const sync = site.gitLastSync;
  const status = sync ? STATUS_STYLES[sync.status] : null;
  const StatusIcon = status?.icon;

  return (
    <div className="space-y-5">
      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
        <h2 className="font-bebas text-2xl text-slate-900 mb-1">GitHub</h2>
        <p className="text-xs text-slate-500 mb-4">
          Where this site's files come from.
        </p>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <a
            href={`https://github.com/${git.owner}/${git.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-primary transition-colors"
          >
            <GithubIcon size={16} />
            {git.owner}/{git.repo}
          </a>
          <span className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <GitBranch size={12} /> {git.branch}
            </span>
            <span className="font-mono">
              {git.dir ? `/${git.dir}` : "repository root"}
            </span>
          </span>
        </div>
      </div>

      {/* Auto-deploy */}
      <label className="flex items-start gap-3 border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors">
        <input
          type="checkbox"
          checked={Boolean(site.gitAutoDeploy)}
          disabled={saving}
          onChange={(e) =>
            patch(
              { autoDeploy: e.target.checked },
              e.target.checked ? "Auto-deploy on" : "Auto-deploy off",
            )
          }
          className="mt-0.5 w-4 h-4 accent-primary shrink-0"
        />
        <span className="text-sm">
          <span className="font-medium text-slate-800">
            Redeploy automatically on every push
          </span>
          <span className="text-slate-500 text-xs leading-relaxed block mt-1">
            Pushing to <strong>{git.branch}</strong> updates this site within a
            minute. Turn it off to deploy only when you press the button below.
          </span>
        </span>
      </label>

      {/* Last sync */}
      {status && StatusIcon && (
        <div className={`flex gap-3 rounded-xl border p-4 ${status.box}`}>
          <StatusIcon size={15} className="shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            <span className="font-semibold block">
              {status.label}
              {sync.at && (
                <span className="font-normal opacity-80">
                  {" "}
                  · {new Date(sync.at).toLocaleString()}
                </span>
              )}
            </span>
            {sync.message && <span className="block mt-0.5">{sync.message}</span>}
            {sync.sha && (
              <span className="block mt-0.5 font-mono text-xs opacity-70">
                {sync.sha.slice(0, 7)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleRedeploy}
          disabled={redeploying}
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {redeploying ? (
            <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full inline-block" />
          ) : (
            <RefreshCw size={14} />
          )}
          {redeploying ? "Deploying..." : "Redeploy latest commit"}
        </button>

        <button
          onClick={() => {
            if (!window.confirm("Disconnect this repository? Your live site stays exactly as it is.")) return;
            patch({ disconnect: true }, "Repository disconnected");
          }}
          disabled={saving}
          className="flex items-center gap-1.5 border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          <Unlink size={14} /> Disconnect
        </button>

        {saving && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Check size={12} /> Saving…
          </span>
        )}
      </div>
    </div>
  );
}
