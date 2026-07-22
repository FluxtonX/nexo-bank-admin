import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";
import { fetchLiveCADRates } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "view-users");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabaseAdmin = createAdminClient();

    // Fetch all users securely using service_role
    const { data: { users }, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    if (authErr) throw authErr;

    // Fetch profiles to get their full names and freeze status
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, is_frozen");
    if (profErr) throw profErr;

    // Fetch KYC submissions to get real verification statuses and selfie URLs
    const { data: kycData, error: kycErr } = await supabaseAdmin.from("kyc_submissions").select("user_id, full_name, selfie_url, status");
    if (kycErr) throw kycErr;

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
            console.error(`[users API] Error generating signed URL for ${kyc.user_id}:`, err);
          }
        }
        return { ...kyc, signed_selfie_url: null };
      })
    );

    // Fetch all user wallets
    const { data: userWallets, error: walletsErr } = await supabaseAdmin.from("user_wallets").select("*");
    if (walletsErr) throw walletsErr;

    // Extract unique currencies from user_wallets for dynamic rate fetching
    const uniqueCurrencies = new Set<string>();
    (userWallets || []).forEach(w => {
      if (w.currency) uniqueCurrencies.add(w.currency.toUpperCase());
    });
    const currencySymbols = Array.from(uniqueCurrencies);
    const liveRates = await fetchLiveCADRates(currencySymbols);

    const userBalanceMap = (userWallets || []).reduce((acc: Record<string, number>, w: any) => {
      const rate = liveRates[w.currency?.toUpperCase()] || liveRates.USDT || 1.36;
      const val = Number(w.balance) * rate;
      acc[w.user_id] = (acc[w.user_id] || 0) + val;
      return acc;
    }, {});

    // Map and merge data together
    const mappedUsers = users.map((user) => {
      // Find matching profile and KYC
      const profile = profiles.find((p: any) => p.id === user.id);
      const kyc = kycDataWithSignedUrls.find((k: any) => k.user_id === user.id);

      // Determine KYC Status
      let kycStatus = "Not Started";
      if (kyc) {
        if (kyc.status === "approved") kycStatus = "Verified";
        else if (kyc.status === "pending") kycStatus = "Pending";
        else if (kyc.status === "rejected") kycStatus = "Rejected";
      }

      const walletsForUser = (userWallets || [])
        .filter((w: any) => w.user_id === user.id)
        .map((w: any) => ({
          currency: w.currency,
          balance: Number(w.balance),
        }));

      const accountStatus = profile?.is_frozen ? "Frozen" : "Active";
      const riskLevel = "Low Risk";

      // Parse metadata
      const rawName = profile?.full_name || user.user_metadata?.full_name || "Unknown User";

      // Debug: log user_metadata for all users to see avatar_url
      console.log(`[users API] User ${rawName} (${user.id}) user_metadata:`, {
        avatar_url: user.user_metadata?.avatar_url,
        full_metadata: user.user_metadata,
      });

      // Avatar URLs
      const kycSelfieUrl = kyc?.status === "approved" ? kyc.signed_selfie_url : null;
      const googleAvatarUrl = user.user_metadata?.avatar_url || null;

      // Debug: log avatar data for users with Google avatars
      if (googleAvatarUrl) {
        console.log(`[users API] User ${rawName} (${user.id}) has Google avatar:`, {
          googleAvatarUrl,
          kycStatus: kycStatus,
        });
      }

      return {
        id: user.id, // For routing and unique keys
        shortId: user.id.slice(0, 8).toUpperCase(), // For UI display
        name: rawName,
        email: user.email,
        phone: user.phone || "N/A",
        joinedDate: new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        kyc: kycStatus,
        account: accountStatus,
        balance: userBalanceMap[user.id] || 0,
        wallets: walletsForUser,
        risk: riskLevel,
        kyc_selfie_url: kycSelfieUrl,
        google_avatar_url: googleAvatarUrl,
      };
    });

    return NextResponse.json({ users: mappedUsers });
  } catch (error: any) {
    console.error("Failed to fetch users API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "edit-users");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    if (action === "freeze" || action === "unfreeze") {
      const isFrozen = action === "freeze";

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ is_frozen: isFrozen })
        .eq("id", userId);

      if (error) {
        if (error.message.includes("relation")) {
           return NextResponse.json({ success: true, warning: "profiles table does not exist" });
        }
        throw error;
      }

      if (isFrozen) {
        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          title: "Account Frozen",
          message: "Your account has been temporarily frozen. Please contact support for assistance.",
          type: "error",
          is_read: false,
        });
      } else {
        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          title: "Account Activated",
          message: "Your account has been reactivated successfully.",
          type: "success",
          is_read: false,
        });
      }

      // Insert audit log
      await supabaseAdmin.from("audit_logs").insert({
        user_id: userId,
        admin_id: null,
        action: isFrozen ? "ACCOUNT_FROZEN" : "ACCOUNT_UNFROZEN",
        details: { reason: "admin action" },
      });

      return NextResponse.json({ success: true, status: isFrozen ? "Frozen" : "Active" });
    }

    if (action === "adjust-balance") {
      const { currency, delta } = body;
      if (!currency || delta === undefined) {
        return NextResponse.json({ error: "Missing currency or delta for balance adjustment" }, { status: 400 });
      }

      const { data: wallet, error: fetchErr } = await supabaseAdmin
        .from("user_wallets")
        .select("balance")
        .eq("user_id", userId)
        .eq("currency", currency)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      const currentBalance = wallet ? Number(wallet.balance) : 0;
      const newBalance = currentBalance + delta;

      if (newBalance < 0) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }

      if (wallet) {
        const { error } = await supabaseAdmin
          .from("user_wallets")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("currency", currency);
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin
          .from("user_wallets")
          .insert({ user_id: userId, currency, balance: newBalance });
        if (error) throw error;
      }

      // Insert wallet_ledger entry using admin client to bypass RLS
      const { error: ledgerError } = await supabaseAdmin
        .from("wallet_ledger")
        .insert({
          user_id: userId,
          type: "ADMIN_ADJUSTMENT",
          provider: "ADMIN",
          currency: currency,
          amount: delta,
          status: "COMPLETED",
        });
      if (ledgerError) throw ledgerError;

      // Insert audit log
      await supabaseAdmin.from("audit_logs").insert({
        user_id: userId,
        admin_id: null,
        action: "BALANCE_ADJUSTED",
        details: { currency, amount: delta, type: delta > 0 ? "add" : "deduct" },
      });

      return NextResponse.json({ success: true, newBalance });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Failed to update user status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

