// lib/email/templates/complaint-received.tsx

interface ComplaintReceivedEmailParams {
  employeeFirstName: string;
  referenceNumber: string;
  category: string;
  title: string;
  isConfidential: boolean;
  loginUrl: string;
}

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function generateComplaintReceivedEmail(
  params: ComplaintReceivedEmailParams,
): EmailContent {
  const {
    employeeFirstName,
    referenceNumber,
    category,
    title,
    isConfidential,
    loginUrl,
  } = params;

  const subject = `Complaint Received — ${referenceNumber}`;

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
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Complaint Received</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>${employeeFirstName}</strong>,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            Your complaint has been successfully submitted and assigned the following reference number:
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:12px;color:#15803d;text-transform:uppercase;letter-spacing:2px;">Reference Number</p>
            <p style="margin:0;font-size:24px;font-weight:700;color:#166534;letter-spacing:1px;">${referenceNumber}</p>
          </div>
          <table width="100%" style="margin-bottom:24px;">
            <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;width:120px;">Category</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">${category}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Subject</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">${title}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Confidential</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">${isConfidential ? "Yes — your identity is protected" : "No"}</td></tr>
          </table>
          ${isConfidential ? '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin-bottom:24px;"><p style="margin:0;font-size:13px;color:#92400e;">🔒 <strong>Confidential:</strong> Your identity is hidden from HR personnel. Only the System Administrator can view your name, and this action is logged.</p></div>' : ""}
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">You will receive email updates whenever the status of your complaint changes. You can also track progress in the HR portal.</p>
          <table cellpadding="0" cellspacing="0"><tr><td style="background:#15803d;border-radius:8px;">
            <a href="${loginUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Track My Complaint →</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">ICRC HR System • Plot 1270, Ayangba Street, Garki, Abuja</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const text = `
Dear ${employeeFirstName},

Your complaint has been received.

Reference Number: ${referenceNumber}
Category: ${category}
Subject: ${title}
Confidential: ${isConfidential ? "Yes" : "No"}

${isConfidential ? "Your identity is protected. Only the System Administrator can view your name." : ""}

Track your complaint: ${loginUrl}

ICRC HR System`.trim();

  return { subject, html, text };
}
