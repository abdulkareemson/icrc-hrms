// lib/email/templates/payslip-ready.tsx

interface PayslipReadyEmailParams {
  employeeName: string;
  staffId: string;
  payMonth: string;
  payYear: number;
  grossPay: string;
  totalDeductions: string;
  netPay: string;
  payslipUrl: string;
}

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function generatePayslipReadyEmail(
  params: PayslipReadyEmailParams,
): EmailContent {
  const {
    employeeName,
    staffId,
    payMonth,
    payYear,
    grossPay,
    totalDeductions,
    netPay,
    payslipUrl,
  } = params;

  const subject = `Payslip Ready — ${payMonth} ${payYear}`;

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
          <p style="margin:0;font-size:13px;color:#bbf7d0;letter-spacing:2px;text-transform:uppercase;">Infrastructure Concession Regulatory Commission</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Your Payslip is Ready</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>${employeeName}</strong>,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            Your payslip for <strong>${payMonth} ${payYear}</strong> has been processed and is now available for download.
          </p>

          <!-- Pay Period Badge -->
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:12px;color:#15803d;text-transform:uppercase;letter-spacing:2px;">Pay Period</p>
            <p style="margin:0;font-size:20px;font-weight:700;color:#166534;">${payMonth} ${payYear}</p>
          </div>

          <!-- Summary Table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr style="background:#f9fafb;">
              <td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;">Staff ID</td>
              <td style="padding:12px 16px;font-size:14px;color:#111827;text-align:right;font-weight:600;">${staffId}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">Gross Pay</td>
              <td style="padding:12px 16px;font-size:14px;color:#111827;text-align:right;font-weight:600;border-top:1px solid #e5e7eb;">${grossPay}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">Total Deductions</td>
              <td style="padding:12px 16px;font-size:14px;color:#dc2626;text-align:right;font-weight:600;border-top:1px solid #e5e7eb;">−${totalDeductions}</td>
            </tr>
            <tr style="background:#f0fdf4;">
              <td style="padding:14px 16px;font-size:14px;color:#15803d;font-weight:700;border-top:2px solid #15803d;">Net Pay</td>
              <td style="padding:14px 16px;font-size:18px;color:#15803d;text-align:right;font-weight:700;border-top:2px solid #15803d;">${netPay}</td>
            </tr>
          </table>

          <!-- CTA Button -->
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${payslipUrl}" style="display:inline-block;background:#15803d;color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
              View &amp; Download Payslip
            </a>
          </div>

          <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
            If you have any questions about your payslip, please contact the HR department.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">ICRC Nigeria • Plot 1270, Ayangba Street, Garki, Abuja<br/>This is an automated message — please do not reply.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const text = `
Dear ${employeeName},

Your payslip for ${payMonth} ${payYear} has been processed.

Staff ID: ${staffId}
Gross Pay: ${grossPay}
Total Deductions: ${totalDeductions}
Net Pay: ${netPay}

View your payslip: ${payslipUrl}

If you have questions, please contact HR.

ICRC Nigeria`.trim();

  return { subject, html, text };
}
