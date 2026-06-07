// lib/email/templates/leave-rejected.tsx

interface LeaveRejectedEmailParams {
  employeeFirstName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  rejectedByName: string;
  rejectionReason: string;
  loginUrl: string;
}

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function generateLeaveRejectedEmail(
  params: LeaveRejectedEmailParams,
): EmailContent {
  const {
    employeeFirstName,
    leaveType,
    startDate,
    endDate,
    totalDays,
    rejectedByName,
    rejectionReason,
    loginUrl,
  } = params;

  const subject = `Leave Request Not Approved — ${leaveType} (${startDate} to ${endDate})`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#fecaca;letter-spacing:2px;text-transform:uppercase;">Infrastructure Concession Regulatory Commission</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Leave Request Not Approved</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>${employeeFirstName}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                We regret to inform you that your leave request has <strong style="color:#dc2626;">not been approved</strong> at this time.
              </p>

              <!-- Leave Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#6b7280;width:140px;">Leave Type</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">${leaveType}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#6b7280;">Start Date</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">${startDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#6b7280;">End Date</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">${endDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#6b7280;">Total Days</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">${totalDays} working day${totalDays !== 1 ? "s" : ""}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#6b7280;">Reviewed By</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">${rejectedByName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Reason Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#92400e;text-transform:uppercase;letter-spacing:1px;">Reason for Decision</p>
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${rejectionReason}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                If you have questions or would like to discuss this decision, please contact your line manager or the HR department directly.
              </p>

              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#15803d;border-radius:8px;">
                    <a href="${loginUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
                      View My Leave Requests →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                ICRC HR System • Plot 1270, Ayangba Street, Garki, Abuja<br/>
                This is an automated message — please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Dear ${employeeFirstName},

Your leave request has NOT been approved.

Leave Type: ${leaveType}
Start Date: ${startDate}
End Date: ${endDate}
Total Days: ${totalDays} working day${totalDays !== 1 ? "s" : ""}
Reviewed By: ${rejectedByName}

Reason: ${rejectionReason}

If you have questions, contact your line manager or HR.
${loginUrl}

ICRC HR System
  `.trim();

  return { subject, html, text };
}
