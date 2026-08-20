import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ClaimedReminder = {
  reminder_id: string;
  user_email: string | null;
  user_name: string | null;
  message_text: string;
};

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  };
  return value.replace(/[&<>'"]/g, (character) => entities[character]);
}

function messagePreview(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 280 ? `${normalized.slice(0, 277)}...` : normalized;
}

async function sendReminderEmail(email: string, name: string, message: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const clientUrl = process.env.CLIENT_APP_URL;
  if (!apiKey || !clientUrl) {
    throw new Error("BREVO_API_KEY or CLIENT_APP_URL is not configured");
  }

  const supportUrl = `${clientUrl.replace(/\/$/, "")}/support`;
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      sender: { name: "Nexo Support", email: "noreply@ndntbank.com" },
      to: [{ email, name }],
      subject: "A quick follow-up from Nexo Support",
      textContent: `Hi ${name},\n\nOur support team sent you a message and is ready when you are.\n\n${messagePreview(message)}\n\nReply securely in your Nexo Support inbox: ${supportUrl}`,
      htmlContent: `<div style="margin:0;padding:32px 16px;background:#f5f7f6;font-family:Arial,sans-serif;color:#17221d"><div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e3e8e5;border-radius:16px;overflow:hidden"><div style="background:#064e3b;padding:26px 32px;color:#ffffff"><div style="font-size:20px;font-weight:700">Nexo Support</div><div style="margin-top:6px;font-size:14px;color:#d1fae5">We are here when you need us</div></div><div style="padding:32px"><p style="margin:0 0 16px;font-size:16px;line-height:1.55">Hi ${escapeHtml(name)},</p><p style="margin:0 0 20px;font-size:16px;line-height:1.55">Our support team sent you a message a few minutes ago. There is no rush—when you are ready, reply securely in your Support inbox and we will continue helping.</p><div style="margin:22px 0;padding:18px 20px;background:#f7faf8;border-left:4px solid #059669;border-radius:8px"><div style="margin-bottom:7px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#527064">Latest message</div><div style="font-size:15px;line-height:1.55;color:#24332b">${escapeHtml(messagePreview(message))}</div></div><a href="${escapeHtml(supportUrl)}" style="display:inline-block;padding:13px 20px;background:#047857;border-radius:8px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700">Reply to Support</a><p style="margin:26px 0 0;font-size:13px;line-height:1.5;color:#6b7b72">For your security, please do not send passwords, verification codes, or sensitive financial information by email.</p></div><div style="padding:18px 32px;background:#f7faf8;border-top:1px solid #e3e8e5;font-size:12px;line-height:1.5;color:#718078">This is a one-time reminder about an open support conversation.</div></div></div>`,
    }),
  });

  const body = await response.text();
  if (!response.ok) throw new Error(`Brevo returned HTTP ${response.status}: ${body.slice(0, 500)}`);
  return body;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();
  const { error: enqueueError } = await supabaseAdmin.rpc("enqueue_due_support_chat_reminders");
  if (enqueueError) {
    console.error("Unable to enqueue support chat reminders:", enqueueError);
    return NextResponse.json({ error: "Unable to enqueue reminders" }, { status: 500 });
  }

  const { data, error: claimError } = await supabaseAdmin.rpc("claim_due_support_chat_reminders", { p_limit: 25 });
  if (claimError) {
    console.error("Unable to claim support chat reminders:", claimError);
    return NextResponse.json({ error: "Unable to claim reminders" }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const reminder of (data || []) as ClaimedReminder[]) {
    if (!reminder.user_email) {
      skipped += 1;
      await supabaseAdmin
        .from("support_chat_reminders")
        .update({ status: "failed", last_error: "User has no email address", next_attempt_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() })
        .eq("id", reminder.reminder_id);
      continue;
    }

    try {
      const providerResponse = await sendReminderEmail(reminder.user_email, reminder.user_name || "there", reminder.message_text);
      await supabaseAdmin
        .from("support_chat_reminders")
        .update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: providerResponse, last_error: null, updated_at: new Date().toISOString() })
        .eq("id", reminder.reminder_id);
      sent += 1;
    } catch (error) {
      failed += 1;
      const reason = error instanceof Error ? error.message : "Unknown email delivery failure";
      console.error(`Support reminder failed for ${reminder.reminder_id}:`, reason);
      await supabaseAdmin
        .from("support_chat_reminders")
        .update({ status: "failed", last_error: reason, next_attempt_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() })
        .eq("id", reminder.reminder_id);
    }
  }

  return NextResponse.json({ success: true, claimed: (data || []).length, sent, failed, skipped });
}
