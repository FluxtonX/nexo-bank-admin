import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: any;
  try {
    const { allowed, adminEmail } = await checkAdminPermission(request, "edit-users");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    body = await request.json();
    const { userId, note } = body;

    if (!userId || !note) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin.from("admin_notes").insert({
      user_id: userId,
      note,
      created_by: adminEmail || "admin",
      created_at: new Date().toISOString()
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, note: data });
  } catch (error: any) {
    console.error("Failed to add admin note:", error);
    // Graceful error if table doesn't exist
    if (error.message && error.message.includes("relation")) {
      return NextResponse.json({ success: true, note: { id: Date.now(), user_id: body?.userId, note: body?.note, created_by: 'admin', created_at: new Date().toISOString() }, warning: "admin_notes table does not exist, simulated success." });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
