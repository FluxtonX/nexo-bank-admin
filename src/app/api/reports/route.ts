import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "view-reports");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("dateRange") || "Last 6 Months";

    // Calculate date filter based on range
    const now = new Date();
    let startDate: Date;
    switch (dateRange) {
      case "Today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "Last 7 Days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "Last 30 Days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "Last 6 Months":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
    }

    // 1. Fetch deposit_requests and withdrawal_requests for transaction data
    const { data: deposits, error: depositsError } = await supabase
      .from("deposit_requests")
      .select("*")
      .gte("created_at", startDate.toISOString());
    if (depositsError) throw depositsError;

    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .gte("created_at", startDate.toISOString());
    if (withdrawalsError) throw withdrawalsError;

    // Calculate totals
    const totalDeposits = deposits?.length || 0;
    const totalWithdrawals = withdrawals?.length || 0;
    const totalTransactions = totalDeposits + totalWithdrawals;

    let totalVolume = 0;
    deposits?.forEach((d: any) => {
      totalVolume += Number(d.expected_amount || 0);
    });
    withdrawals?.forEach((w: any) => {
      totalVolume += Number(w.amount || 0);
    });

    // Revenue as 1% of total transaction volume
    const totalRevenue = totalVolume * 0.01;
    const avgTransaction = totalTransactions > 0 ? (totalVolume / totalTransactions) : 0;

    // 2. Fetch profiles to calculate active users
    const { count: usersCount, error: usersError } = await supabase
      .from("profiles")
      .select("*", { count: 'exact', head: true });
    if (usersError) throw usersError;

    // 3. Fetch support_threads for resolution rate
    const { data: threads, error: threadsError } = await supabase
      .from("support_threads")
      .select("*");
    if (threadsError) throw threadsError;

    const totalTickets = threads?.length || 0;
    const resolvedTickets = threads?.filter((t: any) => t.status === "resolved").length || 0;
    const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 100.0;

    // 4. Generate month labels for charts based on date range
    const months: string[] = [];
    const numMonths = dateRange === "Today" ? 1 : dateRange === "Last 7 Days" ? 1 : dateRange === "Last 30 Days" ? 1 : 6;
    
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleString('default', { month: 'short' }));
    }
    
    // Group transactions by month for revenue/transactions chart
    const monthlyTxData: Record<string, { revenue: number; transactions: number }> = {};
    months.forEach(m => {
      monthlyTxData[m] = { revenue: 0, transactions: 0 };
    });

    // Process deposits
    deposits?.forEach((d: any) => {
      if (d.created_at) {
        const txDate = new Date(d.created_at);
        const monthName = txDate.toLocaleString('default', { month: 'short' });
        if (monthlyTxData[monthName]) {
          monthlyTxData[monthName].transactions += 1;
          monthlyTxData[monthName].revenue += Number(d.expected_amount || 0) * 0.01;
        }
      }
    });

    // Process withdrawals
    withdrawals?.forEach((w: any) => {
      if (w.created_at) {
        const txDate = new Date(w.created_at);
        const monthName = txDate.toLocaleString('default', { month: 'short' });
        if (monthlyTxData[monthName]) {
          monthlyTxData[monthName].transactions += 1;
          monthlyTxData[monthName].revenue += Number(w.amount || 0) * 0.01;
        }
      }
    });

    const revenueTxData = months.map(month => ({
      date: month,
      revenue: monthlyTxData[month].revenue,
      transactions: monthlyTxData[month].transactions
    }));

    // Group user registrations by month for user growth chart
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", startDate.toISOString());
    if (profilesError) throw profilesError;

    const monthlyUserData: Record<string, { newUsers: number; activeUsers: number }> = {};
    months.forEach(m => {
      monthlyUserData[m] = { newUsers: 0, activeUsers: 0 };
    });

    profiles?.forEach((profile: any) => {
      if (profile.created_at) {
        const createdDate = new Date(profile.created_at);
        const monthName = createdDate.toLocaleString('default', { month: 'short' });
        if (monthlyUserData[monthName]) {
          monthlyUserData[monthName].newUsers += 1;
          monthlyUserData[monthName].activeUsers += 1;
        }
      }
    });

    // Calculate cumulative totals for user growth
    let cumulativeNew = 0;
    let cumulativeActive = 0;
    const userGrowthData = months.map(month => {
      cumulativeNew += monthlyUserData[month].newUsers;
      cumulativeActive += monthlyUserData[month].activeUsers;
      return {
        date: month,
        newUsers: monthlyUserData[month].newUsers,
        activeUsers: cumulativeActive || usersCount || 0
      };
    });

    const stats = {
      totalRevenue,
      totalTransactions,
      activeUsers: usersCount || 0,
      avgTransaction,
      resolutionRate: resolutionRate.toFixed(1),
      conversionRate: (usersCount || 0) > 0 && totalTransactions > 0 ? ((totalTransactions / (usersCount || 1)) * 100).toFixed(1) : "0.0",
      avgSessionDuration: "0m 0s", // This would require session tracking data - placeholder for now
      revenueTxData,
      userGrowthData
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error fetching report data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
