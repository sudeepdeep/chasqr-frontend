// GitHub App redirect helpers.
//
// Sign-in uses the authorization-code flow: we bounce the browser to GitHub,
// GitHub bounces it back to /auth/github/callback with a single-use code that
// only our server can redeem. The `state` value guards against CSRF — it is
// generated here, stashed in sessionStorage, and must come back untouched
// before the callback page will exchange anything.

const CLIENT_ID = process.env.REACT_APP_GITHUB_CLIENT_ID || "";
const APP_SLUG = process.env.REACT_APP_GITHUB_APP_SLUG || "";

const STATE_KEY = "chasqr_github_state";
const RETURN_KEY = "chasqr_github_return";

/** False when the deployment has no GitHub App configured — hide the UI. */
export const githubConfigured = (): boolean => Boolean(CLIENT_ID);

const newState = (): string => {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

export const githubCallbackUrl = (): string =>
  `${window.location.origin}/auth/github/callback`;

/** Send the browser to GitHub to authorize the app. */
export const startGithubAuth = (returnTo = "/dashboard"): void => {
  const state = newState();
  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(RETURN_KEY, returnTo);

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", githubCallbackUrl());
  url.searchParams.set("state", state);
  window.location.href = url.toString();
};

/**
 * Send the browser to GitHub to pick which repositories Chasqr can read.
 *
 * The app has "Request user authorization during installation" enabled, so
 * GitHub returns to the same callback with both a `code` and an
 * `installation_id` — one round trip covers identity and repo access.
 */
export const startGithubInstall = (returnTo = "/import/github"): void => {
  const state = newState();
  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(RETURN_KEY, returnTo);
  window.location.href = `https://github.com/apps/${APP_SLUG}/installations/new?state=${state}`;
};

/**
 * One-shot check of the returned state. Clears the stored value either way, so
 * a code can never be replayed against a stale state.
 */
export const consumeGithubState = (received: string | null): boolean => {
  const expected = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  return Boolean(expected && received && expected === received);
};

export const consumeGithubReturnTo = (fallback = "/dashboard"): string => {
  const to = sessionStorage.getItem(RETURN_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  return to || fallback;
};
