import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// ─── Brevo email helper ────────────────────────────────────────────────────
async function sendBrevoEmail(
  email: string,
  name: string,
  subject: string,
  htmlContent: string
) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) {
    console.log(`[LOCAL DEV] Would send email to ${email}: ${subject}`);
    return;
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: "Nexo Support", email: "noreply@ndntbank.com" },
      to: [{ email, name }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    console.error("[sendBrevoEmail] Brevo API Error:", responseBody);
    throw new Error(responseBody || "Brevo API error");
  }
}

// ─── Build branded notification email HTML (Nexo green theme) ─────────────
function buildNotificationEmailHtml(
  userName: string,
  notifType: string,
  notifTitle: string,
  notifMessage: string
): string {
  const typeColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
    Info: { bg: "#F0FDF4", border: "#BBF7D0", text: "#16A34A", label: "📋 Info" },
    Warning: { bg: "#FFFBEB", border: "#FDE68A", text: "#D97706", label: "⚠️ Warning" },
    Success: { bg: "#F0FDF4", border: "#BBF7D0", text: "#16A34A", label: "✅ Success" },
    Error: { bg: "#FFF1F2", border: "#FECDD3", text: "#DC2626", label: "❌ Important" },
  };
  const colors = typeColors[notifType] ?? typeColors.Info;
  const sentDate = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b 0%,#047857 100%);padding:28px 36px;text-align:center;">
              <p style="margin:0;color:#FFFFFF;font-size:22px;font-weight:bold;letter-spacing:-0.3px;">Nexo</p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Platform Notification</p>
            </td>
          </tr>

          <!-- Type Badge -->
          <tr>
            <td style="padding:28px 36px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${colors.bg};border:1px solid ${colors.border};border-radius:100px;padding:5px 14px;">
                    <span style="color:${colors.text};font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;">${colors.label}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:20px 36px 32px;">
              <p style="margin:0 0 6px;color:#0F172A;font-size:16px;font-weight:bold;">${notifTitle}</p>
              <p style="margin:0 0 20px;color:#64748B;font-size:15px;line-height:1.6;">Hello ${userName},</p>
              <div style="background:#F0FDF4;border-left:4px solid #047857;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0;color:#334155;font-size:14px;line-height:1.7;">${notifMessage}</p>
              </div>
              <p style="margin:0;color:#94A3B8;font-size:12px;">Sent on ${sentDate}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 36px;text-align:center;">
              <p style="margin:0;color:#94A3B8;font-size:12px;">This is an automated message from the Nexo admin team.</p>
              <p style="margin:4px 0 0;color:#94A3B8;font-size:11px;">&copy; Nexo. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: Request) {
  try {
    const { type, title, message, userIds, deliveryMethod } = await request.json();

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "type, title, and message are required" },
        { status: 400 }
      );
    }
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "At least one userId must be provided" },
        { status: 400 }
      );
    }
    if (!["email", "dashboard"].includes(deliveryMethod)) {
      return NextResponse.json(
        { error: "deliveryMethod must be 'email' or 'dashboard'" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // ── Fetch profiles for the selected users ──────────────────────────────
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    if (profErr) throw profErr;

    const profileMap: Record<string, { name: string; email: string }> = {};
    for (const p of profiles ?? []) {
      profileMap[p.id] = { name: p.full_name ?? "User", email: p.email ?? "" };
    }

    const errors: string[] = [];
    let successCount = 0;

    if (deliveryMethod === "email") {
      // ── Send Brevo emails to each selected user ──────────────────────────
      const emailPromises = userIds.map(async (uid: string) => {
        const profile = profileMap[uid];
        if (!profile?.email) {
          errors.push(`No email found for user ${uid}`);
          return;
        }
        try {
          const subject = `${title} — Nexo`;
          const html = buildNotificationEmailHtml(profile.name, type, title, message);
          await sendBrevoEmail(profile.email, profile.name, subject, html);
          successCount++;
        } catch (e: any) {
          errors.push(`Failed to email ${profile.email}: ${e.message}`);
        }
      });

      await Promise.allSettled(emailPromises);

      await supabaseAdmin.from("audit_logs").insert({
        user_id: null,
        admin_id: null,
        action: "NOTIFICATION_EMAIL_SENT",
        details: { title, message, type, deliveryMethod: "email", recipientCount: successCount, userIds },
      });
    } else {
      // ── Insert in-app dashboard notifications for each user ──────────────
      const insertRows = userIds.map((uid: string) => ({
        user_id: uid,
        type,
        title,
        message,
        audience: "Specific",
        is_read: false,
      }));

      const { error: insertErr } = await supabaseAdmin
        .from("notifications")
        .insert(insertRows);

      if (insertErr) throw insertErr;

      successCount = userIds.length;

      await supabaseAdmin.from("audit_logs").insert({
        user_id: null,
        admin_id: null,
        action: "NOTIFICATION_DASHBOARD_SENT",
        details: { title, message, type, deliveryMethod: "dashboard", recipientCount: successCount, userIds },
      });
    }

    return NextResponse.json({
      success: true,
      successCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("POST /api/notifications/send-specific Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
