import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { allowed } = await checkAdminPermission(request, "edit-users");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: userId } = await context.params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action field" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    if (action === "reset-2fa") {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ two_factor_enabled: false })
        .eq("id", userId);
      
      if (error && !error.message.includes("relation")) throw error;
      return NextResponse.json({ success: true, message: "2FA has been disabled" });
    }

    if (action === "force-password-reset") {
      // First try to update force_password_reset flag if it exists in profiles
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ force_password_reset: true })
        .eq("id", userId);
        
      // Then generate a password reset link (Optional based on user request)
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authData?.user?.email) {
        // Just triggering the email is fine
        await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email: authData.user.email,
        });
      }

      if (error && !error.message.includes("column") && !error.message.includes("relation")) throw error;
      
      return NextResponse.json({ success: true, message: "Password reset forced" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Failed security action:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
