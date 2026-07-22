import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * POST /api/auth/verify-admin
 * Body: { email: string }
 * Checks if the given email exists in admin_users with is_active = true.
 * Uses the service-role client to bypass RLS.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ authorized: false }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: adminRow, error } = await supabaseAdmin
      .from("admin_users")
      .select("is_active")
      .eq("email", email)
      .single();

    if (error || !adminRow || !adminRow.is_active) {
      return NextResponse.json({ authorized: false });
    }

    return NextResponse.json({ authorized: true });
  } catch (err) {
    console.error("Error verifying admin:", err);
    return NextResponse.json({ authorized: false }, { status: 500 });
  }
}
