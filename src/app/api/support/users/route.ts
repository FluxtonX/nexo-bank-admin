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
    const supabaseAdmin = createAdminClient();

    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;

    // Fetch KYC submissions with selfie_url and status
    const { data: kycData } = await supabaseAdmin
      .from("kyc_submissions")
      .select("user_id, full_name, selfie_url, status");
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name");

    // Generate signed URLs for KYC selfies
    const kycDataWithSignedUrls = await Promise.all(
      (kycData || []).map(async (kyc) => {
        if (kyc.selfie_url && kyc.status === "approved") {
          try {
            // Extract the file path from the public URL
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

    const mapped = users.map((u) => {
      const kyc = kycDataWithSignedUrls?.find((k) => k.user_id === u.id);
      const profile = profiles?.find((p) => p.id === u.id);
      
      // Debug: log user_metadata for all users to see avatar_url
      console.log(`[support/users API] User ${u.email} (${u.id}) user_metadata:`, {
        avatar_url: u.user_metadata?.avatar_url,
        full_metadata: u.user_metadata,
      });
      
      // Priority 1: KYC selfie (only if approved) - use signed URL
      const kycSelfieUrl = kyc?.status === "approved" ? kyc.signed_selfie_url : null;
      
      // Priority 2: Google avatar from auth metadata
      const googleAvatarUrl = u.user_metadata?.avatar_url || null;
      
      return {
        id: u.id,
        email: u.email || "",
        full_name: kyc?.full_name || profile?.full_name || u.email || null,
        kyc_selfie_url: kycSelfieUrl,
        google_avatar_url: googleAvatarUrl,
      };
    });

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Error fetching support users:", err);
    return NextResponse.json([], { status: 500 });
  }
}
