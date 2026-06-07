// lib/email/templates/complaint-status-update.tsx

interface ComplaintStatusUpdateEmailParams {
  employeeFirstName: string;
  referenceNumber: string;
  title: string;
  oldStatus: string;
  newStatus: string;
  resolutionNote?: string | null;
  loginUrl: string;
}

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function generateComplaintStatusUpdateEmail(
  params: ComplaintStatusUpdateEmailParams,
): EmailContent {
  const {
    employeeFirstName,
    referenceNumber,
    title,
    oldStatus,
    newStatus,
    resolutionNote,
    loginUrl,
  } = params;

  const statusLabels: Record<string, string> = {
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under Review",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    DISMISSED: "Dismissed",
  };

  const newStatusLabel = statusLabels[newStatus] ?? newStatus;
  const oldStatusLabel = statusLabels[oldStatus] ?? oldStatus;

  const isResolved = newStatus === "RESOLVED";
  const isDismissed = newStatus === "DISMISSED";

  const subject = `Complaint ${referenceNumber} — ${newStatusLabel}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,${isResolved ? "#15803d,#166534" : isDismissed ? "#6b7280,#4b5563" : "#2563eb,#1d4ed8"});padding:32px;text-align:center;">
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;">Complaint Update</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">${referenceNumber}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>${employeeFirstName}</strong>,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            The status of your complaint has been updated.
          </p>
          <table width="100%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:16px 20px;">
              <table width="100%">
                <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;width:120px;">Reference</td><td style="font-size:14px;font-weight:600;color:#111827;">${referenceNumber}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Subject</td><td style="font-size:14px;font-weight:600;color:#111827;">${title}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Previous Status</td><td style="font-size:14px;color:#6b7280;">${oldStatusLabel}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">New Status</td><td style="font-size:14px;font-weight:700;color:${isResolved ? "#15803d" : isDismissed ? "#6b7280" : "#2563eb"};">${newStatusLabel}</td></tr>
              </table>
            </td></tr>
          </table>
          ${resolutionNote ? `<div style="background:${isResolved ? "#f0fdf4" : "#f9fafb"};border:1px solid ${isResolved ? "#bbf7d0" : "#e5e7eb"};border-radius:8px;padding:16px 20px;margin-bottom:24px;"><p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:1px;">Resolution Note</p><p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${resolutionNote}</p></div>` : ""}
          <table cellpadding="0" cellspacing="0"><tr><td style="background:#15803d;border-radius:8px;">
            <a href="${loginUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">View Complaint Details →</a>
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

Your complaint status has been updated.

Reference: ${referenceNumber}
Subject: ${title}
Previous Status: ${oldStatusLabel}
New Status: ${newStatusLabel}

${resolutionNote ? `Resolution Note: ${resolutionNote}` : ""}

View details: ${loginUrl}

ICRC HR System`.trim();

  return { subject, html, text };
}
