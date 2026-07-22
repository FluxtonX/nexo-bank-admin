import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";
import { fetchLiveCADRates } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "view-wallets");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabaseAdmin = createAdminClient();

    // 1. Fetch profiles count
    const { count: profilesCount, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const totalUsers = profilesCount || 0;

    // 2. Fetch all user wallets directly
    const { data: userWallets, error: walletsErr } = await supabaseAdmin
      .from("user_wallets")
      .select("*");

    // Extract unique currencies from user_wallets
    const uniqueCurrencies = new Set<string>();
    if (!walletsErr && userWallets) {
      userWallets.forEach(w => {
        if (w.currency) uniqueCurrencies.add(w.currency.toUpperCase());
      });
    }

    const currencySymbols = Array.from(uniqueCurrencies);
    const liveRates = await fetchLiveCADRates(currencySymbols);

    // Aggregate balances by currency dynamically
    const currencyBalances: Record<string, number> = {};
    if (!walletsErr && userWallets) {
      userWallets.forEach((w: any) => {
        const coin = w.currency?.toUpperCase();
        const amount = Number(w.balance) || 0;
        if (coin && amount > 0) {
          currencyBalances[coin] = (currencyBalances[coin] || 0) + amount;
        }
      });
    }

    // Calculate total AUM in CAD (CAD doesn't need conversion)
    const totalAum = Object.entries(currencyBalances).reduce((sum, [coin, bal]) => {
      // If CAD, use balance directly (no conversion needed)
      if (coin === 'CAD') return sum + bal;
      const rate = liveRates[coin] || 1;
      return sum + (bal * rate);
    }, 0);

    // Create allocations dynamically for all currencies
    const colorMap: Record<string, { color: string; strokeColor: string }> = {
      BTC: { color: "bg-amber-500", strokeColor: "#f59e0b" },
      ETH: { color: "bg-blue-600", strokeColor: "#2563eb" },
      USDT: { color: "bg-emerald-500", strokeColor: "#10b981" },
      USDC: { color: "bg-emerald-500", strokeColor: "#10b981" },
      CAD: { color: "bg-red-500", strokeColor: "#ef4444" },
      LTC: { color: "bg-gray-500", strokeColor: "#6b7280" },
      DOGE: { color: "bg-yellow-500", strokeColor: "#eab308" },
      SOL: { color: "bg-purple-500", strokeColor: "#a855f7" },
      ADA: { color: "bg-blue-400", strokeColor: "#60a5fa" },
      XRP: { color: "bg-gray-800", strokeColor: "#111827" },
    };

    const allocations = Object.entries(currencyBalances)
      .filter(([_, bal]) => bal > 0)
      .map(([coin, bal]) => {
        // If CAD, use balance directly (no conversion needed)
        const isCAD = coin === 'CAD';
        const cadValue = isCAD ? bal : bal * (liveRates[coin] || 1);
        const colors = colorMap[coin] || { color: "bg-gray-400", strokeColor: "#9ca3af" };
        return {
          asset: coin,
          percentage: totalAum > 0 ? Number(((cadValue / totalAum) * 100).toFixed(1)) : 0,
          valueCad: cadValue || 0,
          color: colors.color,
          strokeColor: colors.strokeColor
        };
      })
      .sort((a, b) => b.valueCad - a.valueCad);

    // 30d growth = sum of deposits in wallet_ledger in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: ledger, error: ledgerErr } = await supabaseAdmin
      .from("wallet_ledger")
      .select("amount, currency, created_at")
      .eq("type", "DEPOSIT")
      .gte("created_at", thirtyDaysAgo.toISOString());

    let performanceGrowth = 0;
    if (!ledgerErr && ledger) {
      performanceGrowth = ledger.reduce((acc: number, item: any) => {
        const currency = item.currency?.toUpperCase();
        // If CAD, use amount directly (no conversion needed)
        if (currency === 'CAD') return acc + Number(item.amount);
        const rate = liveRates[currency] || 1;
        return acc + (Number(item.amount) * rate);
      }, 0);
    }

    return NextResponse.json({
      allocations,
      totalAum: totalAum || 0,
      userCount: totalUsers,
      performanceGrowth: performanceGrowth || 0
    });
  } catch (error: any) {
    console.error("GET Portfolio Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
