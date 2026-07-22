import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "review-kyc");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("kyc_submissions")
      .select("*")
      .order("submitted_at", { ascending: false });
    
    if (error) throw error;

    // Generate signed URLs for private bucket images
    const getSignedUrl = async (publicUrl: string | null) => {
      if (!publicUrl) return null;
      const parts = publicUrl.split("kyc-documents/");
      if (parts.length < 2) return publicUrl;
      const path = parts[1];
      const { data } = await supabaseAdmin.storage.from("kyc-documents").createSignedUrl(path, 60 * 60); // 1 hr
      return data?.signedUrl || publicUrl;
    };

    const secureData = await Promise.all((data || []).map(async (item: any) => ({
      ...item,
      id_front_url: await getSignedUrl(item.id_front_url),
      id_back_url: await getSignedUrl(item.id_back_url),
      selfie_url: await getSignedUrl(item.selfie_url)
    })));
    
    return NextResponse.json({ submissions: secureData });
  } catch (error: any) {
    console.error("GET KYC Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "review-kyc");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { userId, status, rejectionReason } = await request.json();
    const supabaseAdmin = createAdminClient();

    const updateData: any = { status };
    if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error } = await supabaseAdmin
      .from("kyc_submissions")
      .update(updateData)
      .eq("user_id", userId);

    if (error) throw error;

    // Fetch profile to get name
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    if (status === 'rejected') {
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        title: "KYC Verification Rejected",
        message: `Your KYC verification was rejected. Reason: ${rejectionReason || 'Please review your documents'}. Please resubmit with correct documents.`,
        type: "warning",
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    const action = status === "approved" ? "KYC Documents Approved" : "KYC Documents Rejected";
    const severity = status === "approved" ? "Info" : "Warning";

    await supabaseAdmin.from("security_logs").insert({
      action,
      category: "Kyc",
      severity,
      user_name: profile?.full_name || "Unknown User",
      user_id: userId,
      ip_address: request.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `KYC submission for user ${userId} has been ${status}.`,
      user_agent: request.headers.get("user-agent") || "Unknown",
      performed_by_admin: "ADM-001"
    });

    // Insert audit log
    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      admin_id: null,
      action: "KYC_UPDATED",
      details: { status },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH KYC Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
