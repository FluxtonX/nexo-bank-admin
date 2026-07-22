import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";

/**
 * POST /api/admin/content
 * Body: { key: string, value: any, type: string, category: string, label: string }
 * Updates site_content table with admin privileges.
 * Verifies the requester is an authenticated admin via admin_auth cookie.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value, type, category, label } = body;

    if (!key || value === undefined || !type || !category || !label) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify admin permission using admin_auth cookie
    const { allowed, adminEmail } = await checkAdminPermission(request, "edit-settings");
    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Perform the upsert using admin client
    const supabaseAdmin = createAdminClient();
    const { error: upsertError } = await supabaseAdmin
      .from("site_content")
      .upsert({
        key,
        value,
        type,
        category,
        label,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error("Error upserting content:", upsertError);
      return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in content update API:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
