import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  FolderGit2,
  GitBranch,
  Lock,
  RefreshCw,
  Rocket,
  Search,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  GithubRepoSummary,
  githubBranchesAPI,
  githubDetectAPI,
  githubReposAPI,
  githubStatusAPI,
  importGithubSiteAPI,
} from "../api/github.api";
import { GithubIcon } from "../assets/Icons";
import PaymentModal from "../components/PaymentModal";
import SlugInput from "../components/SlugInput";
import { startGithubInstall } from "../lib/github";

type Step = "repo" | "configure";

export default function ImportGithub() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [connected, setConnected] = useState(false);
  const [repos, setRepos] = useState<GithubRepoSummary[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [query, setQuery] = useState("");

  const [step, setStep] = useState<Step>("repo");
  const [repo, setRepo] = useState<GithubRepoSummary | null>(null);

  const [branches, setBranches] = useState<string[]>([]);
  const [branch, setBranch] = useState("");
  const [dirs, setDirs] = useState<string[]>([]);
  const [dir, setDir] = useState("");
  const [detecting, setDetecting] = useState(false);

  const [siteName, setSiteName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [keepInteractive, setKeepInteractive] = useState(false);
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);

  const loadRepos = useCallback(() => {
    setLoadingRepos(true);
    githubReposAPI()
      .then((res) => setRepos(res.data.data.repos))
      .catch((err) =>
        toast.error(err.response?.data?.message || "Couldn't load your repositories"),
      )
      .finally(() => setLoadingRepos(false));
  }, []);

  useEffect(() => {
    githubStatusAPI()
      .then((res) => {
        setConnected(res.data.data.connected);
        if (res.data.data.connected) loadRepos();
      })
      .catch(() => setConnected(false))
      .finally(() => setChecking(false));
  }, [loadRepos]);

  const pickRepo = async (r: GithubRepoSummary) => {
    setRepo(r);
    setSiteName(r.name);
    setSlug(r.name.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 50));
    setStep("configure");
    setBranches([]);
    setBranch(r.defaultBranch);
    setDirs([]);
    setDir("");

    try {
      const res = await githubBranchesAPI(r.installationId, r.owner, r.name);
      setBranches(res.data.data.branches);
      await detect(r, r.defaultBranch);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Couldn't read that repository");
    }
  };

  // Look for index.html so we can preselect the folder holding the built site.
  const detect = async (r: GithubRepoSummary, ref: string) => {
    setDetecting(true);
    try {
      const res = await githubDetectAPI(r.installationId, r.owner, r.name, ref);
      setDirs(res.data.data.dirs);
      setDir(res.data.data.suggested ?? "");
    } catch {
      setDirs([]);
    } finally {
      setDetecting(false);
    }
  };

  const handleBranchChange = async (next: string) => {
    setBranch(next);
    if (repo) await detect(repo, next);
  };

  const handleDeploy = async () => {
    if (!repo) return;
    if (!siteName.trim()) {
      toast.error("Please enter a site name");
      return;
    }
    if (slugError) {
      toast.error(slugError);
      return;
    }

    setDeploying(true);
    try {
      const res = await importGithubSiteAPI({
        installationId: repo.installationId,
        owner: repo.owner,
        repo: repo.name,
        branch,
        dir,
        name: siteName.trim(),
        slug: slug || undefined,
        keepInteractive,
        autoDeploy,
      });
      toast.success("Site deployed from GitHub!");
      navigate(`/sites/${res.data.data.site.siteId}`);
    } catch (err: any) {
      // The repo size isn't known until the server has it, so an over-limit
      // import surfaces here as a 402 rather than being caught up front.
      if (err.response?.status === 402) {
        setPayModalOpen(true);
      } else {
        toast.error(err.response?.data?.message || "Import failed");
      }
    } finally {
      setDeploying(false);
    }
  };

  const filtered = repos.filter((r) =>
    r.fullName.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-bebas text-5xl text-slate-900 mb-2">
            Import From GitHub
          </h1>
          <p className="text-slate-500 text-sm mb-10">
            Deploy the built output committed in a repository, and optionally
            redeploy it automatically on every push. Chasqr serves static files
            and doesn't run a build — commit your{" "}
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">dist</code>{" "}
            /{" "}
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">build</code>{" "}
            folder, or plain HTML at the root.
          </p>

          {checking ? (
            <div className="flex justify-center py-16">
              <span className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !connected ? (
            <div className="text-center py-14 border-2 border-dashed border-slate-200 rounded-2xl">
              <span className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-xl bg-slate-900 text-white">
                <GithubIcon size={22} />
              </span>
              <h2 className="font-bebas text-2xl text-slate-800 mb-2">
                Connect Your GitHub
              </h2>
              <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                You choose exactly which repositories Chasqr can see, and it only
                ever gets read access.
              </p>
              <button
                onClick={() => startGithubInstall()}
                className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors text-sm"
              >
                <GithubIcon size={17} /> Connect GitHub
              </button>
            </div>
          ) : step === "repo" ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                  <span className="pl-3 text-slate-400">
                    <Search size={15} />
                  </span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search repositories"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <button
                  onClick={loadRepos}
                  title="Refresh"
                  className="shrink-0 border border-slate-200 text-slate-500 hover:text-primary p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw size={15} />
                </button>
              </div>

              {loadingRepos ? (
                <div className="flex justify-center py-16">
                  <span className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-14 border-2 border-dashed border-slate-200 rounded-2xl">
                  <p className="text-slate-500 text-sm">
                    {repos.length === 0
                      ? "Chasqr can't see any repositories yet."
                      : "No repositories match that search."}
                  </p>
                  <button
                    onClick={() => startGithubInstall()}
                    className="text-primary text-sm hover:underline mt-2"
                  >
                    Choose repositories on GitHub
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {filtered.map((r) => (
                    <button
                      key={`${r.installationId}-${r.id}`}
                      onClick={() => pickRepo(r)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-primary-light/30 transition-colors"
                    >
                      <FolderGit2 size={16} className="text-slate-400 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-800 truncate">
                          {r.fullName}
                        </span>
                        <span className="block text-xs text-slate-400">
                          Updated {new Date(r.updatedAt).toLocaleDateString()}
                        </span>
                      </span>
                      {r.private && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                          <Lock size={9} /> Private
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-400 text-center mt-4">
                Missing a repository?{" "}
                <button
                  onClick={() => startGithubInstall()}
                  className="text-primary hover:underline"
                >
                  Adjust which ones Chasqr can access
                </button>
                .
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep("repo")}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-5"
              >
                <ArrowLeft size={15} /> Pick a different repository
              </button>

              <div className="flex items-center gap-2 mb-6 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <GithubIcon size={16} />
                <span className="text-sm font-medium text-slate-800">
                  {repo?.fullName}
                </span>
              </div>

              {/* Branch */}
              <div className="mb-5">
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Branch
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                  <span className="pl-3 text-slate-400">
                    <GitBranch size={15} />
                  </span>
                  <select
                    value={branch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="flex-1 px-3 py-3 text-sm focus:outline-none bg-white"
                  >
                    {(branches.length ? branches : [branch]).map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Output folder */}
              <div className="mb-5">
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Output folder
                </label>
                {detecting ? (
                  <p className="text-xs text-slate-400 py-3">
                    Looking for your index.html…
                  </p>
                ) : dirs.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {dirs.map((d) => (
                        <button
                          key={d || "root"}
                          onClick={() => setDir(d)}
                          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${
                            dir === d
                              ? "border-primary bg-primary-light text-primary"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {dir === d && <Check size={13} />}
                          {d || "Repository root"}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                      These are the folders containing an{" "}
                      <span className="font-mono">index.html</span>.
                    </p>
                  </>
                ) : (
                  <>
                    <input
                      value={dir}
                      onChange={(e) => setDir(e.target.value)}
                      placeholder="dist"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                    />
                    <p className="text-xs text-amber-600 mt-1.5">
                      We couldn't find an index.html on this branch. Build your
                      project and commit the output folder, then enter its name
                      here.
                    </p>
                  </>
                )}
              </div>

              {/* Site name */}
              <div className="mb-5">
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Site Name
                </label>
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
                onChange={(v, err) => {
                  setSlug(v);
                  setSlugError(err);
                }}
              />

              {/* Auto-deploy */}
              <label className="mb-4 flex items-start gap-3 border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors">
                <input
                  type="checkbox"
                  checked={autoDeploy}
                  onChange={(e) => setAutoDeploy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary shrink-0"
                />
                <span className="text-sm">
                  <span className="font-medium text-slate-800 flex items-center gap-1.5">
                    <Rocket size={14} className="text-primary" /> Redeploy
                    automatically on every push
                  </span>
                  <span className="text-slate-500 text-xs leading-relaxed block mt-1">
                    Whenever you push to <strong>{branch}</strong>, Chasqr pulls
                    the new build and updates your live site. You can turn this
                    off later from the site's Git settings.
                  </span>
                </span>
              </label>

              {/* Interactive */}
              <label className="mb-8 flex items-start gap-3 border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors">
                <input
                  type="checkbox"
                  checked={keepInteractive}
                  onChange={(e) => setKeepInteractive(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary shrink-0"
                />
                <span className="text-sm">
                  <span className="font-medium text-slate-800 flex items-center gap-1.5">
                    <Zap size={14} className="text-primary" /> This is an
                    interactive app — keep it live
                  </span>
                  <span className="text-slate-500 text-xs leading-relaxed block mt-1">
                    For React/Vue/Angular apps that need working buttons, state,
                    or routing. Leave unchecked for regular sites so you can edit
                    text &amp; images in the panel.
                  </span>
                </span>
              </label>

              <button
                onClick={handleDeploy}
                disabled={deploying || !siteName.trim() || !!slugError}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {deploying ? (
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full inline-block" />
                ) : (
                  <Rocket size={18} />
                )}
                {deploying ? "Deploying..." : "Deploy From GitHub"}
              </button>

              <p className="text-xs text-slate-400 text-center mt-4">
                Prefer to upload files yourself?{" "}
                <Link to="/upload" className="text-primary hover:underline">
                  Deploy a ZIP instead
                </Link>
                .
              </p>
            </>
          )}
        </motion.div>
      </div>

      <PaymentModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        onPaidConfirm={() => {
          setPayModalOpen(false);
          handleDeploy();
        }}
      />
    </div>
  );
}
