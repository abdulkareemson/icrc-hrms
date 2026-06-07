// lib/email/templates/leave-approved.tsx

interface LeaveApprovedEmailParams {
  employeeFirstName: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  approvedByName: string
  loginUrl: string
}

interface EmailContent {
  subject: string
  html: string
  text: string
}

export function generateLeaveApprovedEmail(
  params: LeaveApprovedEmailParams
): EmailContent {
  const {
    employeeFirstName,
    leaveType,
    startDate,
    endDate,
    totalDays,
    approvedByName,
    loginUrl,
  } = params

  const subject = `Leave Request Approved — ${leaveType} (${startDate} to ${endDate})`

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
            <td style="background:linear-gradient(135deg,#15803d,#166534);padding:32px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#bbf7d0;letter-spacing:2px;text-transform:uppercase;">Infrastructure Concession Regulatory Commission</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Leave Approved ✓</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>${employeeFirstName}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                Your leave request has been <strong style="color:#15803d;">approved</strong>. Here are the details:
              </p>

              <!-- Leave Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:24px;">
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
                        <td style="padding:6px 0;font-size:13px;color:#6b7280;">Approved By</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">${approvedByName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                Your leave balance has been updated accordingly. You can view your updated balances by logging into the HR portal.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#15803d;border-radius:8px;">
                    <a href="${loginUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
                      View My Leave Balances →
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
  `.trim()

  const text = `
Dear ${employeeFirstName},

Your leave request has been APPROVED.

Leave Type: ${leaveType}
Start Date: ${startDate}
End Date: ${endDate}
Total Days: ${totalDays} working day${totalDays !== 1 ? "s" : ""}
Approved By: ${approvedByName}

Your leave balance has been updated. Log in to view your balances:
${loginUrl}

ICRC HR System
  `.trim()

  return { subject, html, text }
}