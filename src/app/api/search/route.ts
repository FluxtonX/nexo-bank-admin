import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "view-users");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [], deposits: [], withdrawals: [] });
    }

    const supabaseAdmin = createAdminClient();
    const searchPattern = `%${query}%`;

    // Search profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .or(`full_name.ilike.${searchPattern},email.ilike.${searchPattern}`)
      .limit(5);

    // Search deposit_requests
    const { data: deposits, error: depositsError } = await supabaseAdmin
      .from("deposit_requests")
      .select("id, asset, expected_amount, status")
      .or(`id.ilike.${searchPattern},asset.ilike.${searchPattern}`)
      .limit(5);

    // Search withdrawal_requests
    const { data: withdrawals, error: withdrawalsError } = await supabaseAdmin
      .from("withdrawal_requests")
      .select("id, amount, status, interac_email")
      .or(`id.ilike.${searchPattern},asset.ilike.${searchPattern},interac_email.ilike.${searchPattern}`)
      .limit(5);

    return NextResponse.json({
      users: profiles || [],
      deposits: deposits || [],
      withdrawals: withdrawals || [],
    });
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
