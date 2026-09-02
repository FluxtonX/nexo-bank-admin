import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";

export const dynamic = "force-dynamic";

/**
 * GET /api/support/users
 * Returns a minimal list of { id, email, full_name } for all auth users.
 * Used by the live-chat page to display user emails alongside their profile names.
 */
export async function GET(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "respond-chat");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    const userIds = idsParam ? idsParam.split(",").filter(Boolean) : [];
    const searchQuery = searchParams.get("q");

    const supabaseAdmin = createAdminClient();

    // Query profiles and KYC submissions (filtering by requested IDs or search query)
    let profilesQuery = supabaseAdmin.from("profiles").select("id, full_name, email");
    let kycQuery = supabaseAdmin.from("kyc_submissions").select("user_id, full_name, selfie_url, status");

    if (userIds.length > 0) {
      profilesQuery = profilesQuery.in("id", userIds);
      kycQuery = kycQuery.in("user_id", userIds);
    } else if (searchQuery) {
      profilesQuery = profilesQuery.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    const [profilesResult, kycResult] = await Promise.all([profilesQuery, kycQuery]);
    
    if (profilesResult.error) throw profilesResult.error;

    const profiles = profilesResult.data || [];
    const kycData = kycResult.data || [];

    // For any userIds requested that aren't in profiles, or have no full_name/email, fetch from auth.admin
    const missingUserIds = userIds.filter(id => !profiles.some(p => p.id === id && (p.full_name || p.email)));
    const authFallbacks: Record<string, { email: string; full_name: string }> = {};

    if (missingUserIds.length > 0) {
      await Promise.all(
        missingUserIds.map(async (uid) => {
          try {
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(uid);
            if (authUser?.user) {
              const u = authUser.user;
              const name = (u.user_metadata?.full_name as string) || (u.user_metadata?.name as string) || u.email?.split("@")[0] || "User";
              authFallbacks[uid] = {
                email: u.email || "",
                full_name: name,
              };

              // Self-heal profiles table
              await supabaseAdmin.from("profiles").upsert(
                {
                  id: uid,
                  email: u.email,
                  full_name: name,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "id" }
              );
            }
          } catch (e) {
            console.error(`Error fetching auth user ${uid}:`, e);
          }
        })
      );
    }

    // Generate signed URLs for KYC selfies *only* for the fetched users
    const kycDataWithSignedUrls = await Promise.all(
      kycData.map(async (kyc) => {
        if (kyc.selfie_url && kyc.status === "approved") {
          try {
            const url = new URL(kyc.selfie_url);
            const pathParts = url.pathname.split('/kyc-documents/');
            if (pathParts.length > 1) {
              const filePath = pathParts[1];
              const { data: signedUrlData } = await supabaseAdmin
                .storage
                .from('kyc-documents')
                .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
              
              return {
                ...kyc,
                signed_selfie_url: signedUrlData?.signedUrl || null,
              };
            }
          } catch (err) {
            console.error(`[support/users] Error generating signed URL for ${kyc.user_id}:`, err);
          }
        }
        return { ...kyc, signed_selfie_url: null };
      })
    );

    // Build the mapped result including any authFallbacks
    const allUserIds = userIds.length > 0 ? userIds : profiles.map(p => p.id);
    const mapped = allUserIds.map((uid) => {
      const p = profiles.find((prof) => prof.id === uid);
      const kyc = kycDataWithSignedUrls.find((k) => k.user_id === uid);
      const fallback = authFallbacks[uid];

      const email = p?.email || fallback?.email || "";
      const fullName = kyc?.full_name || p?.full_name || fallback?.full_name || (email ? email.split("@")[0] : "User");

      return {
        id: uid,
        email,
        full_name: fullName,
        kyc_selfie_url: kyc?.status === "approved" ? kyc.signed_selfie_url : null,
        google_avatar_url: null,
      };
    });

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Error fetching support users:", err);
    return NextResponse.json([], { status: 500 });
  }
}
