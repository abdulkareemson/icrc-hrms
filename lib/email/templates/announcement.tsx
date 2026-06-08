// lib/email/templates/announcement.tsx

interface AnnouncementEmailParams {
  recipientName: string;
  title: string;
  content: string;
  isUrgent: boolean;
  target: string;
  announcementUrl: string;
  publishedAt: string;
}

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function generateAnnouncementEmail(
  params: AnnouncementEmailParams,
): EmailContent {
  const {
    recipientName,
    title,
    content,
    isUrgent,
    announcementUrl,
    publishedAt,
  } = params;

  const subject = isUrgent
    ? `🚨 URGENT: ${title} — ICRC`
    : `📢 Announcement: ${title} — ICRC`;

  const urgentBannerHtml = isUrgent
    ? `<tr><td style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
        <p style="margin:0;font-size:13px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:1px;">⚠ Urgent Announcement</p>
        <p style="margin:4px 0 0;font-size:12px;color:#b91c1c;">This announcement requires your immediate attention.</p>
       </td></tr>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#15803d,#166534);padding:32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#bbf7d0;letter-spacing:2px;text-transform:uppercase;">Infrastructure Concession Regulatory Commission</p>
          <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#ffffff;">
            ${isUrgent ? "⚠ URGENT — " : ""}Announcement
          </h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          ${urgentBannerHtml}

          <p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>${recipientName}</strong>,</p>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
            You have a new announcement from ICRC HR dated <strong>${publishedAt}</strong>.
          </p>

          <!-- Title Card -->
          <div style="background:#f0fdf4;border-left:4px solid #15803d;border-radius:4px;padding:16px;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:12px;color:#15803d;text-transform:uppercase;letter-spacing:1px;font-weight:700;">
              ${isUrgent ? "URGENT " : ""}Announcement
            </p>
            <p style="margin:0;font-size:16px;font-weight:700;color:#111827;">${title}</p>
          </div>

          <!-- Content -->
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px;">
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${content.slice(0, 500)}${content.length > 500 ? "..." : ""}</p>
          </div>

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${announcementUrl}" style="display:inline-block;background:#15803d;color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
              Read Full Announcement
            </a>
          </div>

          <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
            You received this email because this announcement was directed to you or your department.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            ICRC Nigeria • Plot 1270, Ayangba Street, Garki, Abuja<br/>
            This is an automated message — please do not reply.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const text = `
Dear ${recipientName},

${isUrgent ? "URGENT ANNOUNCEMENT\n" : ""}${title}

${content.slice(0, 500)}${content.length > 500 ? "..." : ""}

Read the full announcement: ${announcementUrl}

Published: ${publishedAt}

ICRC Nigeria
Plot 1270, Ayangba Street, Garki, Abuja`.trim();

  return { subject, html, text };
}
