import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";
import { fetchLiveCADRates } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { allowed } = await checkAdminPermission(request, "view-users");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabaseAdmin = createAdminClient();
    const { id: userId } = await context.params;

    console.log("Fetching user details for userId:", userId);

    // 1. Fetch Auth User
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authErr || !user) {
      console.error("Auth user not found for ID:", userId, authErr);
      return NextResponse.json({ error: authErr?.message || "User genuinely does not exist in auth.users" }, { status: 404 });
    }

    console.log("Auth user found:", user.email);

    // Helper to safely fetch from tables that might not exist
    const safeFetch = async (table: string, query: object = {}) => {
      try {
        const { data, error } = await supabaseAdmin.from(table).select("*").match(query);
        if (error) {
          // If relation does not exist or column does not exist, fail silently and return empty
          console.warn(`SafeFetch Warning (${table}):`, error.message);
          return [];
        }
        return data || [];
      } catch (e: any) {
        console.warn(`SafeFetch Exception (${table}):`, e.message);
        return [];
      }
    };

    // 2. Fetch related data concurrently
    const [
      profiles,
      kyc,
      wallets,
      depositRequests,
      withdrawalRequests,
      sessions,
      notes,
      securityLogs,
      tickets,
      threads,
      auditLogs
    ] = await Promise.all([
      safeFetch("profiles", { id: userId }),
      safeFetch("kyc_submissions", { user_id: userId }),
      safeFetch("user_wallets", { user_id: userId }),
      safeFetch("deposit_requests", { user_id: userId }),
      safeFetch("withdrawal_requests", { user_id: userId }),
      safeFetch("user_sessions", { user_id: userId }),
      safeFetch("admin_notes", { user_id: userId }),
      safeFetch("security_logs", { user_id: userId }),
      safeFetch("support_tickets", { user_id: userId }),
      safeFetch("support_threads", { user_id: userId }),
      safeFetch("audit_logs", { user_id: userId }),
    ]);

    console.log(`[DEBUG] API Route /api/users/[id] hit! userId param: "${userId}"`);
    console.log(`[DEBUG] Raw support_threads result:`, JSON.stringify(threads, null, 2));

    const profile = profiles[0] || {};
    const kycSubmission = kyc[0] || {};

    // Combine deposit_requests and withdrawal_requests into transactions
    const combinedTransactions = [
      ...(depositRequests || []).map((d: any) => ({
        id: d.id,
        type: "Deposit",
        amount: d.expected_amount,
        currency: d.asset,
        status: d.status,
        created_at: d.created_at,
        metadata: d.admin_note || "",
      })),
      ...(withdrawalRequests || []).map((w: any) => ({
        id: w.id,
        type: "Withdrawal",
        amount: w.amount,
        currency: w.crypto_currency || w.asset || "CAD",
        status: w.status,
        created_at: w.created_at,
        metadata: "",
      })),
    ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);

    // Calculate total balance dynamically using live CAD rates
    let totalBalance = 0;
    if (wallets && wallets.length > 0) {
      const uniqueCurrencies = new Set<string>();
      wallets.forEach((w: any) => {
        if (w.currency) uniqueCurrencies.add(w.currency.toUpperCase());
      });
      const currencySymbols = Array.from(uniqueCurrencies);
      const liveRates = await fetchLiveCADRates(currencySymbols.length > 0 ? currencySymbols : ["BTC", "ETH", "USDT"]);
      
      totalBalance = wallets.reduce((sum: number, w: any) => {
        const rate = liveRates[w.currency?.toUpperCase()] || liveRates.USDT || 1.36;
        return sum + (Number(w.balance || 0) * rate);
      }, 0);
    }

    // Attach last message preview to threads
    const enrichedThreads = await Promise.all(
      (threads || []).map(async (t: any) => {
        const { data: msgs } = await supabaseAdmin
          .from("support_messages")
          .select("text")
          .eq("thread_id", t.id)
          .order("created_at", { ascending: false })
          .limit(1);
        return { ...t, last_message_preview: msgs && msgs.length > 0 ? msgs[0].text : "No messages" };
      })
    );

    // Combine data into a structured payload
    return NextResponse.json({
      auth: user,
      profile,
      kyc: kycSubmission,
      kycDocuments: kyc, // In case there are multiple or history
      wallets,
      balance: totalBalance,
      transactions: combinedTransactions,
      sessions,
      notes: notes.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      securityLogs: securityLogs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      tickets: tickets.sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()),
      threads: enrichedThreads.sort((a: any, b: any) => new Date(b.last_message_at || b.created_at).getTime() - new Date(a.last_message_at || a.created_at).getTime()),
      auditLogs: auditLogs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    });

  } catch (error: any) {
    console.error("Failed to fetch user details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
