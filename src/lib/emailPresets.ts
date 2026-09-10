/**
 * Ready-made email presets for the admin composer (branded template).
 *
 * A preset produces the *inner* content HTML that drops into the Chasqr shell,
 * built from a handful of editable fields so the admin fills in the dynamic
 * bits (a URL, a CTA, a sign-off) instead of hand-writing HTML. `{{first_name}}`
 * is left untouched — the backend swaps it per recipient at send time.
 *
 * Fields the admin does NOT set (like the recipient's name) stay as
 * placeholders. Fields that vary per user and can't be resolved server-side
 * (e.g. each user's own site URL) are exposed as editable fields with a note.
 */

export interface PresetField {
  key: string;
  label: string;
  default: string;
  type?: 'text' | 'url';
  hint?: string;
}

export interface EmailPreset {
  key: string;
  label: string;
  /** Subject line prefilled when the preset is chosen (still editable). */
  defaultSubject: string;
  fields: PresetField[];
  /** Build the branded-template inner HTML from the field values. */
  build: (v: Record<string, string>) => string;
}

const val = (v: Record<string, string>, f: PresetField) =>
  (v[f.key] ?? f.default);

export const EMAIL_PRESETS: EmailPreset[] = [
  {
    key: 'welcome-bonus',
    label: 'Welcome + first bonus',
    defaultSubject: 'Your first site is live 🎉 — and two upgrades on us',
    fields: [
      { key: 'siteUrl', label: 'Site URL', default: 'https://chasqr.com/', type: 'url', hint: 'Per-recipient site URLs aren’t supported — use a generic link for bulk sends, or the real one for a single recipient.' },
      { key: 'ctaText', label: 'Button text', default: 'Read the custom domain guide' },
      { key: 'ctaUrl', label: 'Button link', default: 'https://www.chasqr.com/docs', type: 'url' },
      { key: 'signName', label: 'Signed by', default: 'Deep' },
    ],
    build: (v) => {
      const g = (k: string) => val(v, EMAIL_PRESETS[0].fields.find((f) => f.key === k)!);
      const siteUrl = g('siteUrl');
      return `<h1>Your first site is live 🎉</h1>
<p>Hi {{first_name}},</p>
<p>Congratulations — your first site is deployed on Chasqr:<br>
<a href="${siteUrl}">${siteUrl}</a></p>
<p>As a token of appreciation for shipping with us, we've made two changes on your account, effective now:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid #2563eb;margin:0 0 20px 0;">
  <tr><td style="padding:0 0 14px 16px;font-size:15px;line-height:1.6;color:#111827;"><strong>Chasqr branding removed</strong><br><span style="color:#57534e;">The badge is gone. The site is completely yours — nothing on the page points back to us.</span></td></tr>
  <tr><td style="padding:0 0 0 16px;font-size:15px;line-height:1.6;color:#111827;"><strong>Custom domains enabled</strong><br><span style="color:#57534e;">Point your own domain at your site instead of using the default Chasqr subdomain.</span></td></tr>
</table>
<p>Already own a domain? Connect it from your dashboard under <strong>Settings → Domains</strong>. It takes about two minutes, and we issue the SSL certificate automatically.</p>
<p>Don't have one yet? Our guide walks through buying a domain and pointing it here.</p>
<p class="btn"><a class="btn" href="${g('ctaUrl')}">${g('ctaText')}</a></p>
<p>Thanks for being an early user. If anything breaks or feels rough, just reply to this email — it comes straight to us.</p>
<p>— ${g('signName')}<br><span style="color:#78716c;">Chasqr</span></p>`;
    },
  },
  {
    key: 'product-update',
    label: 'Product update',
    defaultSubject: "What's new at Chasqr",
    fields: [
      { key: 'headline', label: 'Headline', default: 'A quick update from Chasqr' },
      { key: 'intro', label: 'Opening line', default: 'We shipped a few things this week that make deploying faster.' },
      { key: 'point1', label: 'Point 1', default: 'First improvement — one sentence a customer can act on.' },
      { key: 'point2', label: 'Point 2', default: 'Second improvement — keep each line to a single idea.' },
      { key: 'ctaText', label: 'Button text', default: 'See what changed' },
      { key: 'ctaUrl', label: 'Button link', default: 'https://www.chasqr.com/', type: 'url' },
    ],
    build: (v) => {
      const g = (k: string) => val(v, EMAIL_PRESETS[1].fields.find((f) => f.key === k)!);
      return `<h1>${g('headline')}</h1>
<p>Hi {{first_name}}, ${g('intro')}</p>
<p><strong>What's new</strong></p>
<ul>
  <li>${g('point1')}</li>
  <li>${g('point2')}</li>
</ul>
<p class="btn"><a class="btn" href="${g('ctaUrl')}">${g('ctaText')}</a></p>
<p>Thanks for building with Chasqr,<br><strong>The Chasqr team</strong></p>`;
    },
  },
];

export function getPreset(key: string): EmailPreset | undefined {
  return EMAIL_PRESETS.find((p) => p.key === key);
}
