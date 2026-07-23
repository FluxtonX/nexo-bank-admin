import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { fetchLiveCADRates } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Fetch data concurrently
    const [
      { data: profiles },
      { data: kycData },
      { data: userWallets },
      { data: platformWallets },
      { data: depositReqs },
      { data: withdrawalReqs }
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, created_at"),
      supabaseAdmin.from("kyc_submissions").select("status"),
      supabaseAdmin.from("user_wallets").select("currency, balance"),
      supabaseAdmin.from("platform_wallets").select("*"),
      supabaseAdmin.from("deposit_requests").select("*"),
      supabaseAdmin.from("withdrawal_requests").select("*")
    ]);

    // Extract unique currencies from user_wallets and deposit_requests
    const uniqueCurrencies = new Set<string>();
    (userWallets || []).forEach(w => {
      if (w.currency) uniqueCurrencies.add(w.currency.toUpperCase());
    });
    (depositReqs || []).forEach(d => {
      if (d.asset) uniqueCurrencies.add(d.asset.toUpperCase());
    });
    
    const currencySymbols = Array.from(uniqueCurrencies);
    const liveRates = await fetchLiveCADRates(currencySymbols);

    // Top Stats
    const totalUsers = (profiles || []).length;
    const verifiedUsers = (kycData || []).filter(k => k.status === "approved").length;
    const pendingKyc = (kycData || []).filter(k => k.status === "pending").length;

    let platformAssets = 0;
    (userWallets || []).forEach(w => {
      const rate = liveRates[w.currency?.toUpperCase()] || liveRates.USDT || 1.36;
      platformAssets += Number(w.balance || 0) * rate;
    });

    const pendingWithdrawals = (withdrawalReqs || []).filter(w => w.status === "pending").length;

    let totalDepositsAmt = 0;
    (depositReqs || []).forEach(d => {
      // expected_amount is already stored in CAD
      totalDepositsAmt += Number(d.expected_amount || 0);
    });

    const flaggedTransactions = 0; // Schema missing

    // User Growth
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const userGrowthMap: Record<string, number> = {};
    (profiles || []).forEach(p => {
      if (p.created_at) {
        const d = new Date(p.created_at);
        const m = `${months[d.getMonth()]} ${d.getFullYear()}`;
        userGrowthMap[m] = (userGrowthMap[m] || 0) + 1;
      }
    });

    const userGrowthData = Object.entries(userGrowthMap).map(([month, users]) => ({ month, users }));
    userGrowthData.sort((a, b) => {
      const [mA, yA] = a.month.split(" ");
      const [mB, yB] = b.month.split(" ");
      return new Date(`${mA} 1, ${yA}`).getTime() - new Date(`${mB} 1, ${yB}`).getTime();
    });

    // Asset Distribution - Dynamic for all currencies
    const currencyBalances: Record<string, number> = {};
    if (platformWallets && platformWallets.length > 0) {
      platformWallets.forEach(w => {
        const coin = w.crypto?.toUpperCase();
        const amt = Number(w.balance_crypto || 0);
        currencyBalances[coin] = (currencyBalances[coin] || 0) + amt;
      });
    } else {
      // Fallback to user_wallets
      (userWallets || []).forEach(w => {
        const coin = w.currency?.toUpperCase();
        const amt = Number(w.balance || 0);
        currencyBalances[coin] = (currencyBalances[coin] || 0) + amt;
      });
    }

    const totalAssetVal = Object.entries(currencyBalances).reduce((sum, [coin, bal]) => {
      const rate = liveRates[coin] || 1;
      return sum + (bal * rate);
    }, 0);

    const assetData = Object.entries(currencyBalances)
      .filter(([_, bal]) => bal > 0)
      .map(([coin, bal]) => {
        const rate = liveRates[coin] || 1;
        const cadValue = bal * rate;
        return {
          name: coin,
          value: totalAssetVal ? Number(cadValue.toFixed(2)) : 0,
          color: "#047857" // Will be overridden with dynamic colors in UI
        };
      })
      .sort((a, b) => b.value - a.value);

    // Deposits vs Withdrawals Monthly
    const depWithMap: Record<string, { deposits: number, withdrawals: number }> = {};
    (depositReqs || []).forEach(d => {
      if (d.created_at) {
        const date = new Date(d.created_at);
        const m = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (!depWithMap[m]) depWithMap[m] = { deposits: 0, withdrawals: 0 };
        // expected_amount is already stored in CAD
        depWithMap[m].deposits += Number(d.expected_amount || 0);
      }
    });

    (withdrawalReqs || []).forEach(w => {
      if (w.created_at) {
        const date = new Date(w.created_at);
        const m = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (!depWithMap[m]) depWithMap[m] = { deposits: 0, withdrawals: 0 };
        depWithMap[m].withdrawals += Number(w.amount || 0);
      }
    });

    const depositsData = Object.entries(depWithMap).map(([month, data]) => ({
      month,
      deposits: data.deposits,
      withdrawals: data.withdrawals
    })).sort((a, b) => {
      const [mA, yA] = a.month.split(" ");
      const [mB, yB] = b.month.split(" ");
      return new Date(`${mA} 1, ${yA}`).getTime() - new Date(`${mB} 1, ${yB}`).getTime();
    });

    // Withdrawal Queue
    const formatTimeAgo = (dateStr: string) => {
      const diffMs = new Date().getTime() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return diffMins <= 1 ? "Just now" : `${diffMins} mins ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
      return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? 's' : ''} ago`;
    };

    const withdrawalQueue = (withdrawalReqs || [])
      .filter(w => w.status === "pending")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(w => {
        const user = (profiles || []).find(p => p.id === w.user_id);
        return {
          id: `WD-${w.id.slice(0, 5).toUpperCase()}`,
          name: user?.full_name || "Unknown User",
          time: formatTimeAgo(w.created_at),
          risk: "N/A", // Schema missing
          amount: `$${Number(w.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        };
      });

    // Recent Transactions
    const combinedTxs = [
      ...(depositReqs || []).map(d => ({ ...d, txType: "Deposit", created: new Date(d.created_at) })),
      ...(withdrawalReqs || []).map(w => ({ ...w, txType: "Withdraw", created: new Date(w.created_at) }))
    ].sort((a, b) => b.created.getTime() - a.created.getTime()).slice(0, 5);

    const recentTransactions = combinedTxs.map(tx => {
      const user = (profiles || []).find(p => p.id === tx.user_id);
      const isDeposit = tx.txType === "Deposit";
      const coin = isDeposit ? (tx.asset?.toUpperCase() || "CAD") : "CAD";
      const amtNum = isDeposit ? tx.expected_amount : tx.amount;
      const amountCad = isDeposit ? (Number(amtNum) * (liveRates[coin] || liveRates.USDT || 1.36)) : Number(amtNum);

      return {
        name: user?.full_name || "Unknown User",
        type: tx.txType,
        txId: `TX-${tx.id.slice(0, 5).toUpperCase()}`,
        amount: `$${amountCad.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        crypto: isDeposit ? `+${amtNum} ${coin}` : `-$${amtNum} CAD`,
        coin: coin === "CAD" ? "CAD" : coin,
        positive: isDeposit
      };
    });

    // Hot/Cold Wallets
    const hotWallets = (platformWallets || []).filter(w => w.type === "Hot").map(w => ({
      coin: w.crypto,
      amount: w.balance_crypto,
      usd: `$${Number(w.balance_cad || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    }));

    const coldWallets = (platformWallets || []).filter(w => w.type === "Cold").map(w => ({
      coin: w.crypto,
      amount: w.balance_crypto,
      usd: `$${Number(w.balance_cad || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    }));

    return NextResponse.json({
      totalUsers,
      verifiedUsers,
      pendingKyc,
      platformAssets,
      pendingWithdrawals,
      totalDepositsAmt,
      flaggedTransactions,
      userGrowthData,
      assetData,
      depositsData,
      withdrawalQueue,
      recentTransactions,
      hotWallets,
      coldWallets
    });

  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
