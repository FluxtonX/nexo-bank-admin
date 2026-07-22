"use client";

import { useMemo, useState, useEffect } from "react";
import { useDeposits, useWithdrawals, useUpdateDeposit, useUpdateWithdrawal } from "@/hooks/useAdminQueries";
import { useRouter } from "next/navigation";
import { RequirePermission } from "@/components/layout/RequirePermission";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Download,
  X,
  FileText,
  Eye,
  ArrowDownToLine,
  ArrowUpFromLine,
  User,
  Mail,
  MapPin,
  ShieldCheck,
  Check,
  AlertCircle,
  Coins,
  Activity,
  ArrowRightLeft,
  ExternalLink,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { cn, fetchLiveCADRates } from "@/lib/utils";
import { USERS_DATA, type AdminUser } from "@/lib/data/users";

type TransactionType = "Deposit" | "Withdrawal";
type TransactionStatus = "Completed" | "Pending" | "Failed";
type TabValue = "all" | TransactionType | TransactionStatus;

type Transaction = {
  txId: string;
  user: AdminUser;
  type: TransactionType;
  amountCad: number;
  cryptoAmount: string;
  cryptoCurrency: string;
  status: TransactionStatus;
  riskScore: "Low Risk" | "Medium Risk" | "High Risk";
  timestamp: string;
  fromAddress?: string;
  toAddress?: string;
  txHash: string;
  network: string;
  feeCad?: number;
};

const BRAND_GRADIENT = "linear-gradient(135deg, #0A3D91 0%, #1650AB 100%)";

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    txId: "TX-10243",
    user: USERS_DATA.find((u) => u.id === "USR-2024-12458") || USERS_DATA[0],
    type: "Deposit",
    amountCad: 5000,
    cryptoAmount: "0.091 BTC",
    cryptoCurrency: "BTC",
    status: "Pending",
    riskScore: "Low Risk",
    timestamp: "2026-06-02 14:30:15",
    toAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    txHash: "0xfd8a9e22db38cf9e8f17b3c2f0f9b6e8d646a782bcfd992d9f1092e038ff1234",
    network: "Bitcoin Mainnet",
  },
  {
    txId: "TX-10242",
    user: USERS_DATA.find((u) => u.id === "USR-2024-12457") || USERS_DATA[1],
    type: "Withdrawal",
    amountCad: 12500,
    cryptoAmount: "5.21 ETH",
    cryptoCurrency: "ETH",
    status: "Pending",
    riskScore: "Medium Risk",
    timestamp: "2026-06-02 14:18:42",
    fromAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    txHash: "0x6a2c94db8e11a28a3f890a82746b1c0a876a345e82b7cd1e86ba20d6f3e1a2b3",
    network: "Ethereum Mainnet",
    feeCad: 25,
  },
  {
    txId: "TX-10241",
    user: USERS_DATA.find((u) => u.id === "USR-2024-12456") || USERS_DATA[2],
    type: "Deposit",
    amountCad: 3000,
    cryptoAmount: "3000 USDT",
    cryptoCurrency: "USDT",
    status: "Completed",
    riskScore: "Low Risk",
    timestamp: "2026-06-02 14:05:23",
    toAddress: "TYG8H8vH4yD3Kx56X1d8pBfE6u7yR9sB1H",
    txHash: "0x3a9b8c7d6e5f4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c",
    network: "TRON (TRC-20)",
  },
  {
    txId: "TX-10240",
    user: USERS_DATA.find((u) => u.id === "USR-2024-12455") || USERS_DATA[3],
    type: "Withdrawal",
    amountCad: 25000,
    cryptoAmount: "0.455 BTC",
    cryptoCurrency: "BTC",
    status: "Pending",
    riskScore: "High Risk",
    timestamp: "2026-06-02 13:55:00",
    fromAddress: "3EktnHQD7Ri8uJc5fZuefLk6LG3t92z12J",
    txHash: "0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d",
    network: "Bitcoin Mainnet",
    feeCad: 45,
  },
  {
    txId: "TX-10239",
    user: USERS_DATA.find((u) => u.id === "USR-2024-12454") || USERS_DATA[4],
    type: "Deposit",
    amountCad: 15000,
    cryptoAmount: "15000 USDC",
    cryptoCurrency: "USDC",
    status: "Completed",
    riskScore: "High Risk",
    timestamp: "2026-06-01 10:20:00",
    toAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    txHash: "0x2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
    network: "Ethereum Mainnet",
  },
  {
    txId: "TX-10238",
    user: USERS_DATA.find((u) => u.id === "USR-2024-12453") || USERS_DATA[5],
    type: "Withdrawal",
    amountCad: 85000,
    cryptoAmount: "1.55 BTC",
    cryptoCurrency: "BTC",
    status: "Completed",
    riskScore: "Medium Risk",
    timestamp: "2026-06-01 09:15:00",
    fromAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    txHash: "0xbc8d9f1092e038ff1234fd8a9e22db38cf9e8f17b3c2f0f9b6e8d646a782bcfd",
    network: "Bitcoin Mainnet",
    feeCad: 60,
  },
  {
    txId: "TX-10237",
    user: USERS_DATA.find((u) => u.id === "USR-2024-12452") || USERS_DATA[6],
    type: "Deposit",
    amountCad: 1250,
    cryptoAmount: "1250 USDT",
    cryptoCurrency: "USDT",
    status: "Failed",
    riskScore: "Low Risk",
    timestamp: "2026-05-28 14:05:00",
    toAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    txHash: "0x7a8d9f1092e038ff1234fd8a9e22db38cf9e8f17b3c2f0f9b6e8d646a782bcfd9",
    network: "Ethereum Mainnet",
  },
  {
    txId: "TX-10236",
    user: USERS_DATA.find((u) => u.id === "USR-2024-12451") || USERS_DATA[7],
    type: "Withdrawal",
    amountCad: 50000,
    cryptoAmount: "20.5 ETH",
    cryptoCurrency: "ETH",
    status: "Failed",
    riskScore: "Medium Risk",
    timestamp: "2026-05-27 11:22:00",
    fromAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    txHash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    network: "Ethereum Mainnet",
    feeCad: 35,
  },
];

const TABS: Array<{ label: string; value: TabValue }> = [
  { label: "All Transactions", value: "all" },
  { label: "Deposits", value: "Deposit" },
  { label: "Withdrawals", value: "Withdrawal" },
  { label: "Pending", value: "Pending" },
  { label: "Completed", value: "Completed" },
  { label: "Failed", value: "Failed" },
];

function StatusBadge({ status }: { status: TransactionStatus }) {
  const map: Record<TransactionStatus, { cls: string; icon: React.ReactNode }> = {
    Pending: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
    Completed: { cls: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="h-3 w-3" /> },
    Failed: { cls: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" /> },
  };
  const style = map[status] || map.Pending;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase font-mono tracking-wider", style.cls)}>
      {style.icon}
      {status}
    </span>
  );
}

function RiskBadge({ level }: { level: Transaction["riskScore"] }) {
  const map: Record<typeof level, string> = {
    "Low Risk": "bg-green-50 text-green-700 border-green-200",
    "Medium Risk": "bg-amber-50 text-amber-700 border-amber-200",
    "High Risk": "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase font-mono tracking-wider", map[level])}>
      {level}
    </span>
  );
}

function TypeBadge({ type }: { type: TransactionType }) {
  const map: Record<TransactionType, string> = {
    Deposit: "bg-green-50 text-green-700 border-green-200",
    Withdrawal: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase font-mono tracking-wider", map[type])}>
      {type === "Deposit" ? "↓ Deposit" : "↑ Withdrawal"}
    </span>
  );
}

export default function TransactionsDashboard() {
  return (
    <RequirePermission permission="view-transactions">
      <TransactionsDashboardContent />
    </RequirePermission>
  );
}

function TransactionsDashboardContent() {
  const router = useRouter();
  const { data: depositsData = [], isLoading: depositsLoading } = useDeposits();
  const { data: withdrawalsData = [], isLoading: withdrawalsLoading } = useWithdrawals();
  const updateDeposit = useUpdateDeposit();
  const updateWithdrawal = useUpdateWithdrawal();
  const loading = depositsLoading || withdrawalsLoading;
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [toast, setToast] = useState<string | null>(null);

  /* Modal state variables */
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<{ show: boolean; targetStatus: TransactionStatus | null }>({
    show: false,
    targetStatus: null,
  });
  const [statusComment, setStatusComment] = useState("");

  const [liveRates, setLiveRates] = useState<Awaited<ReturnType<typeof fetchLiveCADRates>> | null>(null);

  useEffect(() => {
    fetchLiveCADRates().then(setLiveRates);
  }, []);

  const transactions = useMemo(() => {
    if (!liveRates) return [] as Transaction[];

    const list: Transaction[] = [];

    const cadRateForAsset = (asset: string): number => {
      const sym = (asset || "").toUpperCase().trim();
      // fetchLiveCADRates returns uppercase symbol keys: BTC, ETH, USDT, etc.
      return Number(liveRates[sym]) || Number(liveRates["USDT"]) || 1.36;
    };

    (depositsData || []).forEach((d: any) => {
      list.push({
        txId: `DEP-${d.id.slice(0, 8).toUpperCase()}`,
        realId: d.id,
        user: {
          id: d.user_id,
          name: d.user?.name || "Unknown User",
          email: d.user?.email || "N/A",
          avatar: "",
          role: "viewer",
          status: "active",
          joinedAt: "",
          lastActive: "",
          balance: 0,
        },
        type: "Deposit",
        amountCad: (Number(d.expected_amount) || 0) * cadRateForAsset(d.asset),
        cryptoAmount: `${d.expected_amount} ${d.asset}`,
        cryptoCurrency: d.asset,
        status: (d.status === "approved" || d.status === "completed") ? "Completed" : d.status === "rejected" ? "Failed" : "Pending",
        riskScore: "Low Risk",
        timestamp: new Date(d.created_at).toISOString().replace("T", " ").slice(0, 19),
        toAddress: d.company_address,
        txHash: d.tx_hash,
        network: d.network,
      } as any);
    });

    (withdrawalsData || []).forEach((w: any) => {
      list.push({
        txId: `WDR-${w.id.slice(0, 8).toUpperCase()}`,
        realId: w.id,
        user: {
          id: w.user_id,
          name: w.user?.name || "Unknown User",
          email: w.user?.email || "N/A",
          avatar: "",
          role: "viewer",
          status: "active",
          joinedAt: "",
          lastActive: "",
          balance: 0,
        },
        type: "Withdrawal",
        amountCad: (Number(w.amount) || 0) * cadRateForAsset(w.asset),
        cryptoAmount: `${w.amount} ${w.asset || "CAD"}`,
        cryptoCurrency: w.asset || "CAD",
        status: w.status === "completed" ? "Completed" : w.status === "rejected" ? "Failed" : "Pending",
        riskScore: "Medium Risk",
        timestamp: new Date(w.created_at).toISOString().replace("T", " ").slice(0, 19),
        fromAddress: w.interac_email,
        txHash: w.security_question || "N/A",
        network: "Interac e-Transfer",
        feeCad: 2.5,
      } as any);
    });

    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  }, [depositsData, withdrawalsData, liveRates]);

  const counts = useMemo(() => {
    return {
      all: transactions.length,
      Deposit: transactions.filter((t) => t.type === "Deposit").length,
      Withdrawal: transactions.filter((t) => t.type === "Withdrawal").length,
      Pending: transactions.filter((t) => t.status === "Pending").length,
      Completed: transactions.filter((t) => t.status === "Completed").length,
      Failed: transactions.filter((t) => t.status === "Failed").length,
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      let matchesTab = activeTab === "all";
      if (activeTab === "Deposit" || activeTab === "Withdrawal") {
        matchesTab = tx.type === activeTab;
      } else if (activeTab === "Pending" || activeTab === "Completed" || activeTab === "Failed") {
        matchesTab = tx.status === activeTab;
      }

      const matchesSearch =
        !query ||
        tx.txId.toLowerCase().includes(query) ||
        tx.user.id.toLowerCase().includes(query) ||
        tx.user.name.toLowerCase().includes(query) ||
        tx.user.email.toLowerCase().includes(query) ||
        tx.cryptoCurrency.toLowerCase().includes(query) ||
        tx.txHash.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, transactions, search]);

  const stats = useMemo(() => {
    // 24h total volume = sum of Completed in mock data
    const completedTxs = transactions.filter((t) => t.status === "Completed");
    const totalVolume = completedTxs.reduce((acc, t) => acc + t.amountCad, 0);
    const totalDeposits = completedTxs.filter((t) => t.type === "Deposit").reduce((acc, t) => acc + t.amountCad, 0);
    const totalWithdrawals = completedTxs.filter((t) => t.type === "Withdrawal").reduce((acc, t) => acc + t.amountCad, 0);

    return [
      {
        label: "Total Volume (24h)",
        value: `$${totalVolume.toLocaleString()}`,
        tone: "text-gray-900",
        badge: { text: "+12.4%", trend: "up" },
        icon: (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0A3D91]">
            <Activity className="h-6 w-6" />
          </div>
        ),
      },
      {
        label: "Deposits (24h)",
        value: `$${totalDeposits.toLocaleString()}`,
        tone: "text-green-700 font-bold",
        badge: { text: "+8.2%", trend: "up" },
        icon: (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
            <ArrowDownToLine className="h-6 w-6" />
          </div>
        ),
      },
      {
        label: "Withdrawals (24h)",
        value: `$${totalWithdrawals.toLocaleString()}`,
        tone: "text-gray-900",
        badge: { text: "-3.1%", trend: "down" },
        icon: (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <ArrowUpFromLine className="h-6 w-6" />
          </div>
        ),
      },
      {
        label: "Pending Requests",
        value: counts.Pending.toString(),
        tone: "text-amber-600 font-bold",
        badge: { text: `${counts.Pending} awaiting`, trend: "neutral" },
        icon: (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        ),
      },
    ];
  }, [transactions, counts]);

  const handleOpenDetails = (tx: Transaction) => {
    setSelectedTx(tx);
    setStatusComment("");
  };

  const handleCloseDetails = () => {
    setSelectedTx(null);
  };

  const handleTriggerStatusChange = (status: TransactionStatus) => {
    setShowStatusModal({
      show: true,
      targetStatus: status,
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedTx || !showStatusModal.targetStatus) return;
    const currentTxId = selectedTx.txId;
    const targetStatus = showStatusModal.targetStatus;
    const isDeposit = selectedTx.type === "Deposit";
    const realId = (selectedTx as any).realId;

    let backendStatus = "pending";
    if (isDeposit) {
      backendStatus = targetStatus === "Completed" ? "approved" : "rejected";
    } else {
      backendStatus = targetStatus === "Completed" ? "completed" : "rejected";
    }

    try {
      if (isDeposit) {
        await updateDeposit.mutateAsync({
          requestId: realId,
          status: backendStatus,
          adminNote: statusComment,
          rejectionReason: statusComment,
        });
      } else {
        await updateWithdrawal.mutateAsync({
          requestId: realId,
          status: backendStatus,
          adminNote: statusComment,
          rejectionReason: statusComment,
        });
      }

      setToast(`Transaction ${currentTxId} status updated successfully ✓`);
      window.setTimeout(() => setToast(null), 2500);
      setSelectedTx(null);
      setShowStatusModal({ show: false, targetStatus: null });
      setStatusComment("");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update transaction status");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[26px] font-bold leading-tight text-gray-900 sm:text-[30px]">Platform Transactions</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Monitor and manage real-time cryptocurrency deposits and withdrawals</p>
          </div>
          <button
            onClick={() => {
              if (filteredTransactions.length === 0) {
                setToast("No transactions to export.");
                window.setTimeout(() => setToast(null), 2500);
                return;
              }
              const headers = ["Transaction ID", "User Name", "User Email", "Type", "Asset", "Crypto Amount", "CAD Value", "Status", "Risk Score", "Timestamp", "Network", "Transaction Hash", "From Address", "To Address", "Fee (CAD)"];
              const csvContent = [
                headers.join(","),
                ...filteredTransactions.map(tx =>
                  [
                    tx.txId,
                    tx.user.name,
                    tx.user.email,
                    tx.type,
                    tx.cryptoCurrency,
                    tx.cryptoAmount,
                    tx.amountCad.toFixed(2),
                    tx.status,
                    tx.riskScore,
                    tx.timestamp,
                    tx.network,
                    tx.txHash,
                    tx.fromAddress || "",
                    tx.toAddress || "",
                    tx.feeCad ? tx.feeCad.toFixed(2) : ""
                  ].map(val => `"${val}"`).join(",")
                )
              ].join("\n");
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", "transactions-ledger.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setToast("Transactions ledger exported successfully.");
              window.setTimeout(() => setToast(null), 2500);
            }}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export Ledger
          </button>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-gray-800"
            >
              <Check className="h-4 w-4 text-green-400 shrink-0" />
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Counter cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex min-h-[134px] items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className={cn("text-3xl font-bold leading-none", stat.tone)}>{stat.value}</p>
                <div className="flex items-center gap-1 mt-2.5">
                  <span className={cn(
                    "text-[10px] font-extrabold px-1.5 py-0.5 rounded-md",
                    stat.badge.trend === "up" ? "bg-green-50 text-green-600" :
                    stat.badge.trend === "down" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600"
                  )}>
                    {stat.badge.text}
                  </span>
                  <span className="text-[10px] text-gray-600 font-semibold uppercase">vs last week</span>
                </div>
              </div>
              {stat.icon}
            </div>
          ))}
        </div>

        {/* Filter & Table container */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Search bar */}
          <div className="border-b border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by User, Transaction ID, Hash or Cryptocurrency..."
                className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-11 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-500 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 sm:text-base"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tab filter pills */}
          <div className="flex gap-2.5 overflow-x-auto border-b border-gray-200/80 p-4 bg-white no-scrollbar">
            {TABS.map((tab) => {
              const active = activeTab === tab.value;
              const count = tab.value === "all" ? counts.all : counts[tab.value as keyof typeof counts];
              const countLabel = count !== undefined ? ` (${count})` : "";
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-sm shrink-0",
                    active
                      ? "bg-[#0A3D91] text-white"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                  )}
                >
                  {tab.label}
                  {countLabel}
                </button>
              );
            })}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {/* Header row */}
            <div className="grid min-w-[1250px] grid-cols-[1.1fr_1.8fr_1fr_1.2fr_1.2fr_1.1fr_1.1fr_1.6fr_120px] gap-4 bg-gray-50 px-5 py-3 border-b border-gray-200/80">
              {["Transaction", "User", "Type", "Crypto Amount", "CAD Value", "Status", "Risk", "Timestamp", "Actions"].map((heading) => (
                <span key={heading} className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 font-mono">{heading}</span>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                // SKELETON LOADER
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-[1150px] divide-y divide-gray-100 bg-white"
                >
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="grid grid-cols-[1.1fr_1.8fr_1fr_1.2fr_1.2fr_1.1fr_1.1fr_1.6fr_120px] gap-4 items-center px-5 py-4.5">
                      <div className="h-4 bg-gray-100 rounded-lg w-16 animate-pulse" />
                      <div className="space-y-1.5">
                        <div className="h-4 bg-gray-100 rounded-lg w-28 animate-pulse" />
                        <div className="h-3 bg-gray-100 rounded-lg w-36 animate-pulse" />
                      </div>
                      <div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse" />
                      <div className="space-y-1.5">
                        <div className="h-4 bg-gray-100 rounded-lg w-20 animate-pulse" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-4 bg-gray-100 rounded-lg w-20 animate-pulse" />
                      </div>
                      <div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse" />
                      <div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded-lg w-28 animate-pulse" />
                      <div className="h-8 bg-gray-100 rounded-lg w-full animate-pulse" />
                    </div>
                  ))}
                </motion.div>
              ) : filteredTransactions.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="min-w-[1250px] py-16 text-center text-sm font-medium text-gray-600 bg-white"
                  >
                    No transactions found.
                  </motion.div>
              ) : (
                <motion.div key={`${activeTab}-${search}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx.txId}
                      className="grid min-w-[1250px] grid-cols-[1.1fr_1.8fr_1fr_1.2fr_1.2fr_1.1fr_1.1fr_1.6fr_120px] items-center gap-4 border-b border-gray-100 bg-white px-5 py-4 transition-colors hover:bg-blue-50/20"
                    >
                      {/* TRANSACTION ID */}
                      <div>
                        <p className="font-extrabold text-gray-950 font-mono tracking-tight text-xs">{tx.txId}</p>
                        <p className="text-[10px] text-gray-600 font-mono tracking-tight mt-0.5 max-w-[90px] truncate" title={tx.txHash}>
                          {tx.txHash.slice(0, 10)}...
                        </p>
                      </div>

                      {/* USER */}
                      <div className="min-w-0">
                        <p className="truncate font-bold text-gray-900 text-sm">{tx.user.name}</p>
                        <p className="truncate text-xs text-gray-600">{tx.user.email}</p>
                      </div>

                      {/* TYPE */}
                      <div>
                        <TypeBadge type={tx.type} />
                      </div>

                      {/* CRYPTO AMOUNT */}
                      <div>
                        <p className="font-extrabold text-gray-900 text-sm uppercase font-mono tracking-wider">
                          {tx.cryptoAmount}
                        </p>
                      </div>

                      {/* CAD VALUE */}
                      <div>
                        <p className="font-extrabold text-gray-900 text-sm">${tx.amountCad.toLocaleString()}</p>
                      </div>

                      {/* STATUS */}
                      <div>
                        <StatusBadge status={tx.status} />
                      </div>

                      {/* RISK */}
                      <div>
                        <RiskBadge level={tx.riskScore} />
                      </div>

                      {/* TIMESTAMP */}
                      <div className="text-xs font-semibold text-gray-600 font-mono">
                        {tx.timestamp}
                      </div>

                      {/* ACTIONS */}
                      <div className="relative flex justify-end">
                        <button
                          onClick={() => handleOpenDetails(tx)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-800 active:scale-[0.98] shadow-sm cursor-pointer"
                          title="Review Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer stats */}
          <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/60 px-5 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing <strong className="text-gray-700">{filteredTransactions.length}</strong> of <strong className="text-gray-700">{transactions.length}</strong> transactions
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <ShieldCheck className="h-4 w-4 text-[#0A3D91]" />
              CDNT secure real-time transaction queue
            </div>
          </div>
        </section>
      </motion.div>

      {/* MODALS STACK */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={handleCloseDetails}
            />

            {/* TRANSACTION DETAILS MODAL */}
            {!showStatusModal.show && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 border border-gray-100"
              >
                {/* Close Button */}
                <button
                  onClick={handleCloseDetails}
                  className="absolute right-6 top-6 h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Header */}
                <div className="px-8 pt-7 pb-4 border-b border-gray-100">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[22px] font-bold text-gray-900 leading-tight">Transaction Details</h2>
                    <TypeBadge type={selectedTx.type} />
                  </div>
                  <p className="text-xs text-gray-600 font-semibold mt-1">
                    ID: {selectedTx.txId} • Timestamp: {selectedTx.timestamp}
                  </p>
                </div>

                {/* Body */}
                <div className="px-8 py-6 flex-1 overflow-y-auto space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Details Box */}
                    <div className="border border-gray-200 bg-white rounded-2xl p-5 space-y-4 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Sender / Recipient User</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">User ID</span>
                          <p className="text-xs font-mono font-bold text-gray-900 mt-1">{selectedTx.user.id}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Name</span>
                          <p className="text-sm font-bold text-gray-900 mt-1 leading-tight">{selectedTx.user.name}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Email</span>
                          <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{selectedTx.user.email}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider block mb-1">Risk Status</span>
                            <RiskBadge level={selectedTx.riskScore} />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider block mb-1">User Balance</span>
                            <p className="text-sm font-bold text-gray-900">${selectedTx.user.balance.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Data Box */}
                    <div className="border border-gray-200 bg-white rounded-2xl p-5 space-y-4 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Cryptocurrency Data</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Amount (CAD Value)</span>
                          <p className="text-2xl font-black text-gray-950 mt-1 leading-none">${selectedTx.amountCad.toLocaleString()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Crypto Transferred</span>
                            <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedTx.cryptoAmount}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Blockchain Network</span>
                            <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedTx.network}</p>
                          </div>
                        </div>
                        {selectedTx.type === "Withdrawal" && selectedTx.feeCad !== undefined && (
                          <div>
                            <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Processing Fee (CAD)</span>
                            <p className="text-sm font-bold text-gray-900 mt-0.5">${selectedTx.feeCad.toLocaleString()}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono block mb-1 tracking-wider">Transaction Status</span>
                          <StatusBadge status={selectedTx.status} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Details Section */}
                  <div className="border border-gray-200 bg-gray-50/50 rounded-2xl p-5 space-y-4 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                      <Coins className="h-4.5 w-4.5 text-[#0A3D91]" />
                      Blockchain Specifics
                    </h3>
                    <div className="space-y-3.5">
                      {selectedTx.type === "Deposit" ? (
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">To Deposit Address</span>
                          <p className="text-xs font-mono font-bold text-gray-900 break-all mt-1 bg-white border border-gray-100 p-2.5 rounded-lg select-all">
                            {selectedTx.toAddress}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">From Source Address</span>
                          <p className="text-xs font-mono font-bold text-gray-900 break-all mt-1 bg-white border border-gray-100 p-2.5 rounded-lg select-all">
                            {selectedTx.fromAddress}
                          </p>
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Blockchain Transaction Hash</span>
                        <div className="flex gap-2 items-center mt-1">
                          <p className="text-xs font-mono font-bold text-gray-900 break-all flex-1 bg-white border border-gray-100 p-2.5 rounded-lg select-all">
                            {selectedTx.txHash}
                          </p>
                          <a
                            href={`https://etherscan.io/tx/${selectedTx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 w-9 items-center justify-center border border-gray-200 bg-white rounded-lg text-gray-600 hover:text-gray-700 transition-colors shrink-0 shadow-sm"
                            title="Open Explorer Link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decisions Box if Pending */}
                  {selectedTx.status === "Pending" && (
                    <div className="border border-amber-100 bg-amber-50/25 rounded-2xl p-5 space-y-3.5">
                      <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertCircle className="h-4.5 w-4.5 text-amber-600" />
                        Pending Action Required
                      </h3>
                      <p className="text-xs text-amber-700 leading-relaxed font-semibold">
                        This {selectedTx.type.toLowerCase()} request is currently in a pending state. You can approve this transaction to execute it, or reject it to flag it as failed.
                      </p>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest block">
                          Internal Decision Memo (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={statusComment}
                          onChange={(e) => setStatusComment(e.target.value)}
                          placeholder="Provide comments or logs regarding approval/rejection..."
                          className="w-full px-4 py-2.5 border border-amber-200 rounded-xl bg-white text-sm outline-none resize-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50 text-gray-800 placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 flex justify-between items-center gap-3">
                  <div className="text-xs text-gray-600 font-semibold">
                    CDNT Admin Signature Authority Required
                  </div>

                  <div className="flex gap-2.5">
                    {selectedTx.status === "Pending" ? (
                      <>
                        <button
                          onClick={() => handleTriggerStatusChange("Failed")}
                          className="px-5 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-700 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          Reject / Fail
                        </button>
                        <button
                          onClick={() => handleTriggerStatusChange("Completed")}
                          className="px-5 py-2 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5 hover:opacity-90 cursor-pointer"
                          style={{ background: BRAND_GRADIENT }}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          Approve / Complete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleCloseDetails}
                        className="px-5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                      >
                        Close Details
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* CONFIRMATION POPUP */}
            {showStatusModal.show && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 350 }}
                className="relative bg-white w-full max-w-[420px] rounded-2xl shadow-2xl p-6 z-20 border border-gray-100"
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowStatusModal({ show: false, targetStatus: null })}
                  className="absolute right-6 top-6 h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Icon Header */}
                {showStatusModal.targetStatus === "Completed" ? (
                  <div className="h-11 w-11 rounded-full bg-green-50 border border-green-100 text-green-500 flex items-center justify-center mb-4">
                    <Check className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="h-11 w-11 rounded-full bg-red-50 border border-red-100 text-red-500 flex items-center justify-center mb-4">
                    <XCircle className="h-6 w-6" />
                  </div>
                )}

                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                  {showStatusModal.targetStatus === "Completed" ? "Approve Transaction?" : "Reject Transaction?"}
                </h3>

                <p className="text-xs text-gray-600 leading-relaxed mt-3 font-semibold">
                  Are you sure you want to mark this transaction{" "}
                  <strong className="text-gray-900 font-extrabold">{selectedTx.txId}</strong> of{" "}
                  <strong className="text-gray-900 font-extrabold">${selectedTx.amountCad.toLocaleString()} CAD</strong> as{" "}
                  <span className={cn(
                    "font-bold uppercase tracking-wide px-1.5 py-0.5 rounded text-[10px]",
                    showStatusModal.targetStatus === "Completed" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    {showStatusModal.targetStatus}
                  </span>
                  ?
                </p>

                {/* Footer Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowStatusModal({ show: false, targetStatus: null })}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-bold text-gray-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmStatusChange}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm transition-colors cursor-pointer",
                      showStatusModal.targetStatus === "Completed" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                    )}
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
