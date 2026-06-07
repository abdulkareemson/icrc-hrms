// lib/email/sender.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "ICRC HR System <noreply@icrc.gov.ng>";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email via Resend
 * Fails silently in development if no API key is set
 */
export async function sendEmail(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey === "re_xxxxxxxxxxxxxxxxxxxx") {
    console.log("📧 Email skipped (no API key):", {
      to: params.to,
      subject: params.subject,
    });
    return { success: true, messageId: "dev-skipped" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (error) {
      console.error("❌ Email send error:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Email sent:", data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email error";
    console.error("❌ Email exception:", message);
    return { success: false, error: message };
  }
}
