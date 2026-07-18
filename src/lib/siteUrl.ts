// The public URL of a hosted site is its managed subdomain, <slug>.chasqr.com.
// This is the canonical link shown everywhere (Preview, dashboard cards, SEO
// previews). The older /sites/<slug>/ path still works but is no longer surfaced.
export const APP_DOMAIN = process.env.REACT_APP_APP_DOMAIN || 'chasqr.com';

export const publicSiteUrl = (slug: string) => `https://${slug}.${APP_DOMAIN}`;
