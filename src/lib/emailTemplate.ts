/**
 * Branded email shell — MIRROR of the backend's src/utils/emailTemplate.ts.
 *
 * Used only for the composer's live preview so what the admin sees matches what
 * the backend actually sends. If you change the template, change it in BOTH
 * files. The backend is the source of truth for real sends.
 */

const TEMPLATE_HEADER = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Chasqr</title>
<style>
  @media only screen and (max-width:620px){
    .wrap{width:100% !important;}
    .px{padding-left:24px !important;padding-right:24px !important;}
  }
  .chasqr-content{font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#39414f;}
  .chasqr-content h1{font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:36px;font-weight:normal;color:#111827;margin:0 0 16px 0;}
  .chasqr-content h2{font-size:22px;line-height:28px;color:#111827;margin:24px 0 12px 0;}
  .chasqr-content h3{font-size:18px;line-height:24px;color:#111827;margin:20px 0 10px 0;}
  .chasqr-content p{margin:0 0 16px 0;}
  .chasqr-content a{color:#2563eb;}
  .chasqr-content ul,.chasqr-content ol{margin:0 0 16px 0;padding-left:22px;}
  .chasqr-content li{margin:0 0 8px 0;}
  .chasqr-content img{max-width:100%;height:auto;border:0;border-radius:8px;}
  .chasqr-content strong{color:#111827;}
  .chasqr-content hr{border:0;border-top:1px solid #e6eaf1;margin:26px 0;}
  .chasqr-content blockquote{margin:0 0 16px 0;padding:12px 18px;background:#f4f6fb;border-left:3px solid #2563eb;color:#39414f;}
  .chasqr-content .btn a,.chasqr-content a.btn{display:inline-block;background:#2563eb;color:#ffffff !important;text-decoration:none;font-weight:bold;padding:14px 30px;border-radius:6px;}
</style>
</head>
<body style="margin:0;padding:0;background-color:#eef1f6;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#eef1f6;">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" class="wrap" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;">
    <tr><td class="px" style="padding:0 40px 18px 40px;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="left" style="font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:20px;font-weight:bold;letter-spacing:2px;color:#2563eb;">CHASQR</td>
          <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#6b7484;">Free hosting, instant deploys</td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="background-color:#ffffff;border:1px solid #dde2ea;border-radius:10px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td height="4" bgcolor="#2563eb" style="height:4px;line-height:4px;font-size:0;border-radius:10px 10px 0 0;">&nbsp;</td></tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td class="px chasqr-content" style="padding:38px 40px 38px 40px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#39414f;">`;

const TEMPLATE_FOOTER = `</td></tr>
      </table>
    </td></tr>
    <tr><td class="px" style="padding:24px 40px 8px 40px;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0 0 10px 0;font-size:13px;line-height:22px;color:#6b7484;">
        <a href="https://www.chasqr.com/docs" style="color:#6b7484;text-decoration:underline;">Docs</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="https://www.chasqr.com/seo-checker" style="color:#6b7484;text-decoration:underline;">SEO Checker</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="https://www.chasqr.com/terms" style="color:#6b7484;text-decoration:underline;">Terms</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="https://www.chasqr.com/privacy" style="color:#6b7484;text-decoration:underline;">Privacy</a>
      </p>
      <p style="margin:0 0 6px 0;font-size:12px;line-height:20px;color:#5b6373;">You're receiving this because you have a Chasqr account. <a href="{{unsubscribe_url}}" style="color:#5b6373;text-decoration:underline;">Unsubscribe</a> from marketing emails.</p>
      <p style="margin:0;font-size:12px;line-height:20px;color:#5b6373;">Chasqr · Deploy fast, iterate faster.<br>© {{year}} Chasqr. All rights reserved.</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

/** A ready-to-edit starter body for the composer (branded mode). */
export const DEFAULT_TEMPLATE_CONTENT = `<h1>Your headline goes here</h1>
<p>Hi {{first_name}}, open with one short paragraph that says what changed and why it matters. Two or three sentences is plenty.</p>
<p><strong>What's new</strong></p>
<ul>
  <li>First point — one sentence a customer can act on.</li>
  <li>Second point — keep each line to a single idea.</li>
</ul>
<p class="btn"><a class="btn" href="https://www.chasqr.com/register">Primary action</a></p>
<p>Thanks for building with Chasqr,<br><strong>The Chasqr team</strong></p>`;

function resolve(html: string): string {
  return html
    .replace(/\{\{\s*first_name\s*\}\}/g, 'there')
    .replace(/\{\{\s*unsubscribe_url\s*\}\}/g, '#')
    .replace(/\{\{\s*preferences_url\s*\}\}/g, '#')
    .replace(/\{\{\s*year\s*\}\}/g, String(new Date().getFullYear()));
}

/** Full preview HTML for branded mode (author content dropped into the shell). */
export function previewBranded(content: string): string {
  return resolve(TEMPLATE_HEADER + content + TEMPLATE_FOOTER);
}

/** Preview HTML for raw mode (author supplied the whole document). */
export function previewRaw(content: string): string {
  return resolve(content);
}
