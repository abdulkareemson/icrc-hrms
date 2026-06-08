// lib/email/templates/application-received.tsx

interface ApplicationReceivedEmailParams {
  applicantName: string;
  applicationRef: string;
  vacancyTitle: string;
  department: string;
}

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function generateApplicationReceivedEmail(
  params: ApplicationReceivedEmailParams,
): EmailContent {
  const { applicantName, applicationRef, vacancyTitle, department } = params;

  const subject = `Application Received — ${applicationRef}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#15803d,#166534);padding:32px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#bbf7d0;letter-spacing:2px;text-transform:uppercase;">Infrastructure Concession Regulatory Commission</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Application Received ✓</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>${applicantName}</strong>,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            Thank you for your interest in joining ICRC Nigeria. Your application has been successfully received.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:12px;color:#15803d;text-transform:uppercase;letter-spacing:2px;">Reference Number</p>
            <p style="margin:0;font-size:24px;font-weight:700;color:#166534;letter-spacing:1px;">${applicationRef}</p>
          </div>
          <table width="100%" style="margin-bottom:24px;">
            <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;width:120px;">Position</td><td style="font-size:14px;font-weight:600;color:#111827;">${vacancyTitle}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Department</td><td style="font-size:14px;font-weight:600;color:#111827;">${department}</td></tr>
          </table>
          <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
            Our HR team will review your application and contact you if you are shortlisted. Please keep your reference number for future correspondence.
          </p>
          <p style="margin:0;font-size:14px;color:#6b7280;">
            We wish you the best of luck.
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">ICRC Nigeria • Plot 1270, Ayangba Street, Garki, Abuja<br/>This is an automated message — please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const text = `
Dear ${applicantName},

Thank you for applying to ICRC Nigeria.

Reference Number: ${applicationRef}
Position: ${vacancyTitle}
Department: ${department}

Our HR team will review your application and contact you if shortlisted.

ICRC Nigeria`.trim();

  return { subject, html, text };
}
