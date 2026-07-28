import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * Lightweight endpoint that returns ONLY the data needed for the
 * notification user-picker: id, name, email, kyc status.
 *
 * Uses pagination to fetch ALL users from Supabase Auth (default cap = 50).
 */
export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();

    // ── Paginate through ALL auth users ────────────────────────────────────
    let allAuthUsers: any[] = [];
    let page = 1;
    const perPage = 1000; // max allowed by Supabase
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) throw error;
      allAuthUsers = allAuthUsers.concat(data.users);
      if (data.users.length < perPage) break; // last page
      page++;
    }

    // ── Fetch profiles (name) ──────────────────────────────────────────────
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name");
    if (profErr) throw profErr;

    const profileMap: Record<string, string> = {};
    for (const p of profiles ?? []) {
      profileMap[p.id] = p.full_name ?? "";
    }

    // ── Fetch KYC status ───────────────────────────────────────────────────
    const { data: kycRows, error: kycErr } = await supabaseAdmin
      .from("kyc_submissions")
      .select("user_id, status");
    if (kycErr) throw kycErr;

    const kycMap: Record<string, string> = {};
    for (const k of kycRows ?? []) {
      kycMap[k.user_id] = k.status; // "approved" | "pending" | "rejected"
    }

    // ── Map users ──────────────────────────────────────────────────────────
    const users = allAuthUsers.map((u) => {
      const kycStatus = kycMap[u.id];
      let kycLabel: "Verified" | "Unverified" = "Unverified";
      if (kycStatus === "approved") kycLabel = "Verified";

      return {
        id: u.id,
        name: profileMap[u.id] || u.user_metadata?.full_name || u.email?.split("@")[0] || "Unknown",
        email: u.email ?? "",
        kyc: kycLabel,
      };
    });

    return NextResponse.json({ users, total: users.length });
  } catch (error: any) {
    console.error("[notifications/users GET] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
