/** Shared CampusGig email chrome — keep Auth templates visually in sync. */

export const EMAIL_INK = "#18181b";
export const EMAIL_FG = "#09090b";
export const EMAIL_FG3 = "#71717a";
export const EMAIL_GREEN = "#22c55e";
export const EMAIL_GREEN_BG = "#f0fdf4";
export const EMAIL_GREEN_BD = "#bbf7d0";
export const EMAIL_GREEN_D = "#16a34a";
export const EMAIL_BG2 = "#fafafa";
export const EMAIL_BD = "#e4e4e7";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function wrapCampusGigEmail(opts: {
  preheader: string;
  headline: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote: string;
}) {
  const preheader = escapeHtml(opts.preheader);
  const headline = escapeHtml(opts.headline);
  const ctaLabel = escapeHtml(opts.ctaLabel);
  const ctaUrl = escapeHtml(opts.ctaUrl);
  const footerNote = escapeHtml(opts.footerNote);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BG2};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BG2};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;background:#ffffff;border:1px solid ${EMAIL_BD};border-radius:12px;padding:32px 28px;">
          <tr>
            <td align="center" style="padding-bottom:20px;font-size:15px;font-weight:700;letter-spacing:-0.04em;color:${EMAIL_FG};">
              GetCampus<span style="color:${EMAIL_GREEN};">Gig</span>.com
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <div style="width:56px;height:56px;background:${EMAIL_GREEN_BG};border:1px solid ${EMAIL_GREEN_BD};border-radius:50%;line-height:56px;font-size:22px;">&#9993;</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:8px;font-size:20px;font-weight:700;letter-spacing:-0.03em;color:${EMAIL_FG};line-height:1.3;">
              ${headline}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:20px;font-size:14px;line-height:1.6;color:${EMAIL_FG3};">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${ctaUrl}" style="display:inline-block;background:${EMAIL_INK};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">
                ${ctaLabel}
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="font-size:13px;line-height:1.55;color:${EMAIL_FG3};">
              ${footerNote}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
