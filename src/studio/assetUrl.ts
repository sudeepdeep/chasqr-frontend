const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

/** Where a site's own files are served from, which is not where the editor lives. */
export const siteBaseUrl = (slug?: string) =>
  slug ? `${BASE_URL}/sites/${slug}/` : "";

/**
 * Resolves an image reference for display inside the editor.
 *
 * Uploads are stored as site-relative paths like `assets/12-logo.png`, which is
 * exactly right for the published page — but inside the editor the browser
 * resolves them against the editor's own URL and gets a 404. That is why an
 * uploaded image appeared as a broken icon: the file was fine, the address was
 * being read relative to the wrong site.
 *
 * Absolute URLs and data URIs are left alone.
 */
export function resolveAsset(src?: string, base?: string): string {
  const s = (src || "").trim();
  if (!s) return "";
  if (/^(https?:)?\/\//i.test(s) || /^data:/i.test(s) || /^blob:/i.test(s)) return s;
  if (!base) return s;
  return base.replace(/\/+$/, "/") + s.replace(/^\/+/, "");
}
