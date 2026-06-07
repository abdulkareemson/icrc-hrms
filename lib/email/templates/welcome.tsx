// lib/email/templates/welcome.tsx
import { ICRC } from "@/constants/system"

interface WelcomeEmailProps {
  firstName: string
  lastName: string
  email: string
  staffId: string
  department: string
  jobTitle: string
  temporaryPassword: string
  loginUrl: string
}

export function generateWelcomeEmail(props: WelcomeEmailProps): {
  subject: string
  html: string
  text: string
} {
  const subject = `Welcome to ${ICRC.shortName} — Your HR Account is Ready`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #14532d 0%, #15803d 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ICRC HRMS
              </h1>
              <p style="margin: 8px 0 0; color: #bbf7d0; font-size: 13px;">
                ${ICRC.name}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px; font-weight: 600;">
                Welcome, ${props.firstName}! 🎉
              </h2>
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Your HR account at the Infrastructure Concession Regulatory Commission has been created. Below are your account details.
              </p>

              <!-- Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px; width: 140px;">Full Name</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600;">${props.firstName} ${props.lastName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Staff ID</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600;">${props.staffId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Department</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600;">${props.department}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Job Title</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600;">${props.jobTitle}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Credentials Card -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #fef9c3; border-radius: 8px; margin-bottom: 24px; border: 1px solid #fde047;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px; color: #92400e; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                      Login Credentials
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; color: #92400e; font-size: 13px; width: 140px;">Email</td>
                        <td style="padding: 4px 0; color: #111827; font-size: 13px; font-weight: 600;">${props.email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #92400e; font-size: 13px;">Temporary Password</td>
                        <td style="padding: 4px 0; color: #111827; font-size: 13px; font-weight: 600; font-family: monospace;">${props.temporaryPassword}</td>
                      </tr>
                    </table>
                    <p style="margin: 12px 0 0; color: #b45309; font-size: 11px;">
                      ⚠️ Please change your password after your first login.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${props.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #15803d 0%, #16a34a 100%); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 8px;">
                      Sign In to Your Account
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                If you have any questions, please contact the HR department or IT support.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                ${ICRC.name}<br />
                ${ICRC.address}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `Welcome to ${ICRC.shortName}!

Hi ${props.firstName},

Your HR account has been created. Here are your details:

Full Name: ${props.firstName} ${props.lastName}
Staff ID: ${props.staffId}
Department: ${props.department}
Job Title: ${props.jobTitle}

Login Credentials:
Email: ${props.email}
Temporary Password: ${props.temporaryPassword}

Sign in at: ${props.loginUrl}

Please change your password after your first login.

${ICRC.name}
${ICRC.address}`

  return { subject, html, text }
}