import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createAdminClient();
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .update({ invite_status: "accepted" })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, inviteStatus: data.invite_status });
  } catch (error: any) {
    console.error("POST /api/admin-users/accept-invite failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
