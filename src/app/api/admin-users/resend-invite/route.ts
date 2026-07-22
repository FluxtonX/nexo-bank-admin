import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";

export async function POST(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "manage-roles");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabaseAdmin = createAdminClient();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if the admin exists
    const { data: admin, error: fetchErr } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .single();

    if (fetchErr || !admin) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    // Generate link
    const origin = new URL(request.url).origin;
    const redirectTo = `${origin}/admin/set-password`;

    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (linkErr) {
      return NextResponse.json({ error: linkErr.message }, { status: 400 });
    }

    let tokenHash = linkData.properties?.hashed_token;
    if (!tokenHash && linkData.properties?.action_link) {
      try {
        const urlObj = new URL(linkData.properties.action_link);
        tokenHash = urlObj.searchParams.get("token") || "";
      } catch (e) {
        console.error("Failed to parse action_link:", e);
      }
    }

    if (!tokenHash) {
      return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
    }

    const inviteLink = `${origin}/admin/set-password?token=${tokenHash}`;

    // Send email via Brevo
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (!BREVO_API_KEY) {
      console.log(`[LOCAL DEV] [RESEND] Invite Link for ${email} is: ${inviteLink}`);
    } else {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: "CDNTB Security", email: "noreply@cdntbank.com" },
          to: [{ email }],
          subject: "Set up your CDNT Admin account",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
              <h2 style="color: #0F172A;">Admin Account Setup</h2>
              <p style="color: #475569; font-size: 16px;">Hello ${admin.full_name || ""},</p>
              <p style="color: #475569; font-size: 16px;">An administrator account has been created for you on the CDNTB Admin Panel. Please click the button below to set up your password and activate your account:</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${inviteLink}" style="background-color: #0A3D91; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">Set Up Password</a>
              </div>
              <p style="color: #475569; font-size: 14px;">If the button above does not work, copy and paste this URL into your browser:</p>
              <p style="color: #0A3D91; font-size: 13px; word-break: break-all;">${inviteLink}</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="color: #94A3B8; font-size: 12px; text-align: center;">Secure Admin Portal &copy; Canadian National Trust Bank</p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Brevo API Error:", errText);
        throw new Error(errText || "Failed to send email via Brevo");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/admin-users/resend-invite failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
