// Shared Brevo Email utility for Nexo Admin

export type EmailDeliveryResult =
  | { status: "sent" }
  | { status: "skipped"; reason: "missing_brevo_key" | "missing_recipient" }
  | { status: "failed"; reason: string };

interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  senderName?: string;
  senderEmail?: string;
}

export async function sendBrevoEmail({
  to,
  subject,
  htmlContent,
  senderName = process.env.BREVO_SENDER_NAME || "Nexo Support",
  senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@nexofinancial.ca",
}: SendEmailParams): Promise<EmailDeliveryResult> {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) {
    console.warn(`[sendBrevoEmail] BREVO_API_KEY is missing; skipped email to ${to}: "${subject}"`);
    return { status: "skipped", reason: "missing_brevo_key" };
  }

  if (!to || !to.trim()) {
    console.warn(`[sendBrevoEmail] Missing recipient email; skipped: "${subject}"`);
    return { status: "skipped", reason: "missing_recipient" };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY.trim(),
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to.trim() }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      console.error("[sendBrevoEmail] Brevo API Error:", response.status, responseBody);
      return { status: "failed", reason: `Brevo returned HTTP ${response.status}` };
    }

    return { status: "sent" };
  } catch (err: any) {
    console.error("[sendBrevoEmail] Exception sending email:", err);
    return { status: "failed", reason: err?.message || "Network exception" };
  }
}
