import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";

export const dynamic = "force-dynamic";

// Helper function to send email via Brevo
async function sendInviteEmail(email: string, fullName: string, inviteLink: string) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  console.log(`[sendInviteEmail] BREVO_API_KEY loaded: ${!!BREVO_API_KEY}`);
  console.log(`[sendInviteEmail] Sending to: ${email}, inviteLink: ${inviteLink}`);

  if (!BREVO_API_KEY) {
    console.log(`[LOCAL DEV] Invite Link for ${email} is: ${inviteLink}`);
    return { success: true, localMode: true };
  }

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
          <p style="color: #475569; font-size: 16px;">Hello ${fullName || ""},</p>
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

  const responseBody = await response.text();
  console.log(`[sendInviteEmail] Brevo response status: ${response.status}`);
  console.log(`[sendInviteEmail] Brevo response body: ${responseBody}`);

  if (!response.ok) {
    console.error("[sendInviteEmail] Brevo API Error:", responseBody);
    throw new Error(responseBody || "Failed to send email via Brevo");
  }

  return { success: true };
}

// GET /api/admin-users
export async function GET(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "manage-roles");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .select("*, roles(name, code)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mappedAdmins = (data || []).map((admin: any) => ({
      id: admin.id,
      email: admin.email,
      fullName: admin.full_name,
      roleId: admin.role_id,
      roleName: admin.roles?.name || "N/A",
      roleCode: admin.roles?.code || "N/A",
      isActive: admin.is_active,
      inviteStatus: admin.invite_status || "pending",
      createdAt: admin.created_at,
    }));

    return NextResponse.json({ admins: mappedAdmins });
  } catch (error: any) {
    console.error("GET /api/admin-users failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin-users
export async function POST(request: Request) {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  console.log(`[POST /api/admin-users] REQUEST START — requestId=${requestId}`);
  try {
    const supabaseAdmin = createAdminClient();
    const { email, fullName, roleId } = await request.json();

    console.log("POST /api/admin-users request parameters:", { email, fullName, roleId });

    if (!email || !roleId) {
      console.error("Validation failed: Missing email or roleId");
      return NextResponse.json(
        { error: "Email and Role ID are required fields" },
        { status: 400 }
      );
    }

    // Generate a temporary password for the auth account
    const tempPassword =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8).toUpperCase() +
      "1!";

    // 1. Create the Auth User
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authErr) {
      console.error("Supabase Auth User creation failed:", authErr);
      if (authErr.message?.toLowerCase().includes("already been registered") || authErr.message?.toLowerCase().includes("already exists")) {
        return NextResponse.json(
          { error: `An account with email "${email}" already exists. Please delete the existing user in Supabase Authentication first, or use a different email.` },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: authErr.message }, { status: 400 });
    }
    const userId = authData.user.id;

    // 2. Generate invite link via Supabase Auth Admin
    const origin = new URL(request.url).origin;
    const redirectTo = `${origin}/admin/set-password`;

    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (linkErr) {
      console.error("Invite Link generation failed:", linkErr);
      // Clean up user
      await supabaseAdmin.auth.admin.deleteUser(userId);
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
      console.error("Token hash could not be retrieved from link properties");
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Failed to generate setup token" }, { status: 500 });
    }

    const inviteLink = `${origin}/admin/set-password?token=${tokenHash}`;

    // 3. Create the DB Admin User record
    const { data: dbData, error: dbErr } = await supabaseAdmin
      .from("admin_users")
      .insert({
        id: userId,
        email,
        full_name: fullName,
        role_id: roleId,
        is_active: true,
        invite_status: "pending",
      })
      .select("*, roles(name, code)")
      .single();

    if (dbErr) {
      console.error("Database profile insertion failed:", dbErr);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: dbErr.message }, { status: 400 });
    }

    // 4. Try sending the invitation email via Brevo
    let emailSent = false;
    let emailWarning: string | undefined = undefined;

    try {
      await sendInviteEmail(email, fullName, inviteLink);
      emailSent = true;
    } catch (err: any) {
      console.error("Failed to send setup email:", err);
      emailWarning = `Admin was created but setup email failed to send: ${err.message}. You can resend it from the admin list.`;
    }

    return NextResponse.json({
      admin: {
        id: dbData.id,
        email: dbData.email,
        fullName: dbData.full_name,
        roleId: dbData.role_id,
        roleName: dbData.roles?.name || "N/A",
        roleCode: dbData.roles?.code || "N/A",
        isActive: dbData.is_active,
        inviteStatus: dbData.invite_status,
        createdAt: dbData.created_at,
      },
      warning: emailWarning,
    });
  } catch (error: any) {
    console.error("POST /api/admin-users catch-block failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin-users
export async function PATCH(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "manage-roles");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabaseAdmin = createAdminClient();
    const { id, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Admin ID is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .update({ is_active: isActive })
      .eq("id", id)
      .select("*, roles(name, code)")
      .single();

    if (error) throw error;

    return NextResponse.json({
      admin: {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        roleId: data.role_id,
        roleName: data.roles?.name || "N/A",
        roleCode: data.roles?.code || "N/A",
        isActive: data.is_active,
        inviteStatus: data.invite_status,
        createdAt: data.created_at,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/admin-users failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin-users
export async function DELETE(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "manage-roles");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabaseAdmin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Admin ID is required" }, { status: 400 });
    }

    // Delete Auth user (cascades to admin_users table)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin-users failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
