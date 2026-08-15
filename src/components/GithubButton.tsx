import { GithubIcon } from "../assets/Icons";
import { githubConfigured, startGithubAuth } from "../lib/github";

interface Props {
  label: string;
  /** Where to land after a successful sign-in. */
  returnTo?: string;
}

/** Social sign-in button, sized to sit under the Google one on Login/Register. */
export default function GithubButton({ label, returnTo }: Props) {
  if (!githubConfigured()) return null;

  return (
    <button
      type="button"
      onClick={() => startGithubAuth(returnTo)}
      className="w-full flex items-center justify-center gap-2.5 bg-slate-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
    >
      <GithubIcon size={17} />
      {label}
    </button>
  );
}
