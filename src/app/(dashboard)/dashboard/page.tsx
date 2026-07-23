"use client";

import { useDashboardMetrics } from "@/hooks/useAdminQueries";
import Link from "next/link";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  Legend,
} from "recharts";
import {
  Users, CheckCircle2, Clock, DollarSign, AlertTriangle,
  Wallet, TrendingUp, ArrowUpRight,
} from "lucide-react";
import { cn, COIN_COLORS } from "@/lib/utils";

/* ─── Sub-components ─────────────────────────────────────────────── */

function StatCard1({
  label, value, change, icon: Icon, iconBg,
}: {
  label: string; value: string; change: string;
  icon: React.ElementType; iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          <Icon className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
          <ArrowUpRight className="h-3 w-3" />
          {change}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-600 mt-1.5">{label}</p>
      </div>
    </div>
  );
}

function StatCard2({
  label, value, badge, icon: Icon, iconBg, badgeType, link,
}: {
  label: string; value: string; badge: string;
  icon: React.ElementType; iconBg: string;
  badgeType: "urgent" | "positive" | "danger" | "neutral";
  link?: string;
}) {
  const badgeStyles = {
    urgent:   "bg-orange-100 text-orange-600",
    positive: "bg-green-100 text-green-600",
    danger:   "bg-red-100 text-red-600",
    neutral:  "bg-gray-100 text-gray-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", badgeStyles[badgeType])}>
          {badge}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          <Icon className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      {link && (
        <Link href={link} className="text-xs text-emerald-600 font-medium hover:underline text-left">
          {link}
        </Link>
      )}
    </div>
  );
}

const riskStyles = {
  low:    "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high:   "bg-red-100 text-red-700",
  "N/A":  "bg-gray-100 text-gray-700",
};

const formatCAD = (v: number) =>
  `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ─── Page ───────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { data, isLoading } = useDashboardMetrics();

  const stats = {
    totalUsers: Number(data?.totalUsers ?? 0),
    verifiedUsers: Number(data?.verifiedUsers ?? 0),
    pendingKyc: Number(data?.pendingKyc ?? 0),
    platformAssets: Number(data?.platformAssets ?? 0),
    pendingWithdrawals: Number(data?.pendingWithdrawals ?? 0),
    totalDepositsAmt: Number(data?.totalDepositsAmt ?? 0),
    flaggedTransactions: Number(data?.flaggedTransactions ?? 0),
    userGrowthData: (data?.userGrowthData as any[]) ?? [],
    assetData: (data?.assetData as any[]) ?? [],
    depositsData: (data?.depositsData as any[]) ?? [],
    withdrawalQueue: (data?.withdrawalQueue as any[]) ?? [],
    recentTransactions: (data?.recentTransactions as any[]) ?? [],
    loading: isLoading,
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Admin Dashboard</h1>
        <p className="text-sm text-gray-600 mt-0.5">Overview of platform operations and key metrics</p>
      </div>

      {/* ── Stats Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard1 label="Total Users"     value={stats.loading ? "..." : stats.totalUsers.toString()}    change="Live" icon={Users}          iconBg="#06B6D4" />
        <StatCard1 label="Verified Users"  value={stats.loading ? "..." : stats.verifiedUsers.toString()} change="Live"  icon={CheckCircle2}   iconBg="#22C55E" />
        <StatCard1 label="Pending KYC"     value={stats.loading ? "..." : stats.pendingKyc.toString()}  change="Live"   icon={Clock}          iconBg="#F97316" />
        <StatCard1 label="Platform Assets" value={stats.loading ? "..." : `$${stats.platformAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}  change="Live" icon={DollarSign}     iconBg="#F59E0B" />
      </div>


      {/* ── Stats Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard2
          label="Pending Withdrawals" value={stats.loading ? "..." : stats.pendingWithdrawals.toString()}
          badge="Urgent" badgeType={stats.pendingWithdrawals > 0 ? "urgent" : "neutral"}
          icon={Clock} iconBg="#F97316"
          link="/dashboard/withdrawals"
        />
        <StatCard2
          label="Total Deposits" value={stats.loading ? "..." : `$${stats.totalDepositsAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          badge="+0.0%" badgeType="positive"
          icon={DollarSign} iconBg="#22C55E"
        />
        <StatCard2
          label="Flagged Transactions" value={stats.loading ? "..." : stats.flaggedTransactions.toString()}
          badge="N/A" badgeType="neutral"
          icon={AlertTriangle} iconBg="#EF4444"
        />
      </div>

      {/* ── Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Growth Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">User Growth</h3>
            </div>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.loading ? [] : stats.userGrowthData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v).toFixed(0)}`} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: 12 }}
                formatter={(v: any) => [Number(v).toLocaleString(), "Users"]}
              />
              <Line
                type="monotone" dataKey="users"
                stroke="#047857" strokeWidth={2.5}
                dot={{ r: 4, fill: "#047857", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#047857" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Distribution Donut */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Asset Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={stats.loading ? [] : stats.assetData} cx="50%" cy="50%"
                innerRadius={50} outerRadius={75}
                paddingAngle={3} dataKey="value"
              >
                {stats.assetData.map((entry, i) => (
                  <Cell key={i} fill={COIN_COLORS[entry.name] || entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: 12 }}
                formatter={(v: any) => [`$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {stats.assetData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COIN_COLORS[item.name] || item.color }} />
                  <span className="text-gray-600 text-xs">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900 text-xs">${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Deposits vs Withdrawals Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Deposits vs Withdrawals</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.loading ? [] : stats.depositsData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
              tickFormatter={formatCAD} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: 12 }}
              formatter={(v: any) => [formatCAD(Number(v)), ""]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(val) => <span className="text-gray-600 capitalize">{val}</span>}
            />
            <Bar dataKey="deposits"    fill="#047857" radius={[4, 4, 0, 0]} name="Deposits" />
            <Bar dataKey="withdrawals" fill="#22C55E" radius={[4, 4, 0, 0]} name="Withdrawals" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Withdrawal Queue + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Withdrawal Approval Queue */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Withdrawal Approval Queue</h3>
            <Link href="/dashboard/withdrawals" className="text-xs text-emerald-600 font-medium hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {stats.loading ? (
              <div className="text-xs text-gray-600">Loading...</div>
            ) : stats.withdrawalQueue.length === 0 ? (
              <div className="text-xs text-gray-600">No pending withdrawals.</div>
            ) : stats.withdrawalQueue.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                {/* Avatar */}
                <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                  {item.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-600">{item.id} • {item.time}</p>
                </div>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0", riskStyles[item.risk as keyof typeof riskStyles])}>
                  {item.risk} risk
                </span>
                <span className="text-sm font-bold text-gray-900 shrink-0">{item.amount}</span>
                <button
                  className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg shrink-0 transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #064e3b, #047857)" }}
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Recent Transactions</h3>
            <Link href="/dashboard/transactions" className="text-xs text-emerald-600 font-medium hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {stats.loading ? (
              <div className="text-xs text-gray-600">Loading...</div>
            ) : stats.recentTransactions.length === 0 ? (
              <div className="text-xs text-gray-600">No recent transactions.</div>
            ) : stats.recentTransactions.map((tx, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                {/* Coin icon */}
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                  style={{ background: COIN_COLORS[tx.coin] || "#ccc" }}
                >
                  {tx.coin}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tx.name}</p>
                  <p className="text-xs text-gray-600">{tx.type} • {tx.txId}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">{tx.amount}</p>
                  <p className={cn("text-xs font-medium", tx.positive ? "text-green-600" : "text-red-500")}>
                    {tx.crypto}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-4" />
    </div>
  );
}
