import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";
import { sendBrevoEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "review-kyc");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("kyc_submissions")
      .select("*")
      .order("submitted_at", { ascending: false });
    
    if (error) throw error;

    // Generate signed URLs for private bucket images
    const getSignedUrl = async (publicUrl: string | null) => {
      if (!publicUrl) return null;
      const parts = publicUrl.split("kyc-documents/");
      if (parts.length < 2) return publicUrl;
      const path = parts[1];
      const { data } = await supabaseAdmin.storage.from("kyc-documents").createSignedUrl(path, 60 * 60); // 1 hr
      return data?.signedUrl || publicUrl;
    };

    const secureData = await Promise.all((data || []).map(async (item: any) => ({
      ...item,
      id_front_url: await getSignedUrl(item.id_front_url),
      id_back_url: await getSignedUrl(item.id_back_url),
      selfie_url: await getSignedUrl(item.selfie_url)
    })));
    
    return NextResponse.json({ submissions: secureData });
  } catch (error: any) {
    console.error("GET KYC Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "review-kyc");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { userId, status, rejectionReason } = await request.json();
    const supabaseAdmin = createAdminClient();

    const updateData: any = { status };
    if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error } = await supabaseAdmin
      .from("kyc_submissions")
      .update(updateData)
      .eq("user_id", userId);

    if (error) throw error;

    // Keep profiles table kyc_verified status in sync
    await supabaseAdmin
      .from("profiles")
      .update({ kyc_verified: status === "approved" })
      .eq("id", userId);

    // Fetch profile to get name and email
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    let userEmail = profile?.email || "";
    let userName = profile?.full_name || "Valued Member";

    // Fallback to Supabase Auth if profile does not have email
    if (!userEmail) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (authUser?.user?.email) {
          userEmail = authUser.user.email;
        }
      } catch (authErr) {
        console.warn("[KYC PATCH] Could not fetch auth email:", authErr);
      }
    }

    if (status === 'approved') {
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        title: "KYC Verification Approved",
        message: "Congratulations! Your identity has been verified successfully. Your Nexo Bank account now has full access and higher transaction limits.",
        type: "success",
        is_read: false,
        created_at: new Date().toISOString()
      });

      // Send verification confirmation email to client
      if (userEmail) {
        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #E2E8F0; border-radius: 16px; background-color: #FFFFFF; color: #0F172A;">
            <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #E2E8F0;">
              <h1 style="color: #047857; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Nexo Bank</h1>
              <p style="color: #64748B; font-size: 13px; margin: 4px 0 0 0; font-weight: 500;">Institutional &amp; Personal Digital Banking</p>
            </div>
            
            <div style="padding: 28px 0;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="display: inline-block; padding: 6px 18px; background-color: #ECFDF5; color: #047857; font-weight: 700; font-size: 13px; border-radius: 9999px; border: 1px solid #A7F3D0;">
                  ✓ Identity Verified
                </span>
              </div>

              <h2 style="color: #0F172A; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; text-align: center;">
                Congratulations, ${userName}!
              </h2>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                Your identity verification has been officially approved by our compliance team. Your Nexo Bank account is now fully verified.
              </p>

              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="color: #0F172A; font-size: 14px; font-weight: 700; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                  Your Unlocked Account Privileges
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #047857;">✓ Elevated Limits:</td>
                    <td style="padding: 6px 0; color: #475569;">Higher daily and monthly withdrawal allowances</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #047857;">✓ Multi-Asset Transfers:</td>
                    <td style="padding: 6px 0; color: #475569;">Full CAD &amp; Crypto deposit and withdrawal processing</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #047857;">✓ Priority Service:</td>
                    <td style="padding: 6px 0; color: #475569;">24/7 dedicated Help &amp; Support desk access</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="https://ndntbank.com/dashboard" style="display: inline-block; background-color: #047857; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(4, 120, 87, 0.2);">
                  Go to Nexo Dashboard
                </a>
              </div>
            </div>

            <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; text-align: center;">
              <p style="color: #94A3B8; font-size: 12px; margin: 0; line-height: 1.5;">
                Nexo Bank &copy; ${new Date().getFullYear()} Nexo. All rights reserved.<br />
                This is an automated notification regarding your account status. For your protection, never share your account credentials or two-factor authentication codes with anyone.
              </p>
            </div>
          </div>
        `;

        await sendBrevoEmail({
          to: userEmail,
          subject: "Your Account Has Been Verified — Nexo Bank",
          htmlContent: emailHtml,
        });
      }
    } else if (status === 'rejected') {
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        title: "KYC Verification Rejected",
        message: `Your KYC verification was rejected. Reason: ${rejectionReason || 'Please review your documents'}. Please resubmit with correct documents.`,
        type: "warning",
        is_read: false,
        created_at: new Date().toISOString()
      });

      if (userEmail) {
        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #E2E8F0; border-radius: 16px; background-color: #FFFFFF; color: #0F172A;">
            <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #E2E8F0;">
              <h1 style="color: #047857; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Nexo Bank</h1>
              <p style="color: #64748B; font-size: 13px; margin: 4px 0 0 0; font-weight: 500;">Compliance &amp; Verification Desk</p>
            </div>
            
            <div style="padding: 28px 0;">
              <h2 style="color: #0F172A; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">
                Action Required: Identity Verification Update
              </h2>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                Hello ${userName},
              </p>

              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                Our compliance team reviewed your submitted KYC documents, but we were unable to approve them at this time.
              </p>

              <div style="background-color: #FFF5F5; border: 1px solid #FED7D7; border-left: 4px solid #E53E3E; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <strong style="color: #9B2C2C; font-size: 14px;">Reason:</strong>
                <p style="color: #742A2A; font-size: 14px; margin: 6px 0 0 0;">
                  ${rejectionReason || "The submitted documents were unclear or could not be validated. Please resubmit valid government-issued ID and a clear selfie."}
                </p>
              </div>

              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                You can easily submit new documents by visiting the verification section in your account settings.
              </p>

              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="https://ndntbank.com/kyc" style="display: inline-block; background-color: #047857; color: #FFFFFF; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 14px;">
                  Resubmit Verification Documents
                </a>
              </div>
            </div>

            <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; text-align: center;">
              <p style="color: #94A3B8; font-size: 12px; margin: 0;">
                Nexo Bank &copy; ${new Date().getFullYear()} Nexo. All rights reserved.
              </p>
            </div>
          </div>
        `;

        await sendBrevoEmail({
          to: userEmail,
          subject: "Update on Your Identity Verification — Nexo Bank",
          htmlContent: emailHtml,
        });
      }
    }

    const action = status === "approved" ? "KYC Documents Approved" : "KYC Documents Rejected";
    const severity = status === "approved" ? "Info" : "Warning";

    await supabaseAdmin.from("security_logs").insert({
      action,
      category: "Kyc",
      severity,
      user_name: profile?.full_name || "Unknown User",
      user_id: userId,
      ip_address: request.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `KYC submission for user ${userId} has been ${status}.`,
      user_agent: request.headers.get("user-agent") || "Unknown",
      performed_by_admin: "ADM-001"
    });

    // Insert audit log
    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      admin_id: null,
      action: "KYC_UPDATED",
      details: { status },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH KYC Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
