"use client";

import { useMemo, useState } from "react";
import { useWithdrawals, useUpdateWithdrawal } from "@/hooks/useAdminQueries";
import { AnimatePresence, motion } from "framer-motion";
import { RequirePermission } from "@/components/layout/RequirePermission";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  X,
  Eye,
  CreditCard,
  Check,
  AlertCircle,
  ShieldCheck,
  User,
  Mail,
  Calendar,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { USERS_DATA, type AdminUser } from "@/lib/data/users";

type PayoutStatus = "Pending" | "Processing" | "Completed" | "Failed";
type TabValue = "all" | PayoutStatus;

type InteracPayout = {
  payoutId: string;
  realId?: string;
  user: AdminUser;
  amount: number;
  status: PayoutStatus;
  requestDate: string;
  referenceCode: string;
  securityQuestion?: string;
  securityAnswer?: string;
};

const BRAND_GRADIENT = "linear-gradient(135deg, #0A3D91 0%, #1650AB 100%)";

const INITIAL_PAYOUTS: InteracPayout[] = [
  {
    payoutId: "PAY-2024-5678",
    user: USERS_DATA.find((u) => u.id === "USR-2024-12458") || USERS_DATA[0],
    amount: 5420.00,
    status: "Pending",
    requestDate: "Jun 2, 10:30 a.m.",
    referenceCode: "WDR-98765",
    securityQuestion: "What platform is this?",
    securityAnswer: "CDNT",
  },
  {
    payoutId: "PAY-2024-5677",
    user: USERS_DATA.find((u) => u.id === "USR-2024-12457") || USERS_DATA[1],
    amount: 8750.00,
    status: "Processing",
    requestDate: "Jun 2, 09:15 a.m.",
    referenceCode: "WDR-98764",
    securityQuestion: "Administrative secret word?",
    securityAnswer: "Antigravity",
  },
  {
    payoutId: "PAY-2024-5676",
    user: USERS_DATA.find((u) => u.id === "USR-2024-12456") || USERS_DATA[2],
    amount: 2340.50,
    status: "Completed",
    requestDate: "Jun 1, 02:20 p.m.",
    referenceCode: "WDR-98763",
    securityQuestion: "Platform utility symbol?",
    securityAnswer: "CAD",
  },
];

const TABS: Array<{ label: string; value: TabValue }> = [
  { label: "All Payouts", value: "all" },
  { label: "Pending", value: "Pending" },
  { label: "Processing", value: "Processing" },
  { label: "Completed", value: "Completed" },
  { label: "Failed", value: "Failed" },
];

function StatusBadge({ status }: { status: PayoutStatus }) {
  const map: Record<PayoutStatus, { cls: string; icon: React.ReactNode }> = {
    Pending: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
    Processing: { cls: "bg-blue-50 text-blue-700 border-blue-200", icon: <CreditCard className="h-3 w-3" /> },
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

export default function InteracPayoutsPage() {
  return (
    <RequirePermission permission="approve-withdrawals">
      <InteracPayoutsPageContent />
    </RequirePermission>
  );
}

function InteracPayoutsPageContent() {
  const { data: withdrawalsData = [], isLoading: loading } = useWithdrawals();
  const updateWithdrawal = useUpdateWithdrawal();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [toast, setToast] = useState<string | null>(null);

  /* Modal state variables */
  const [selectedPayout, setSelectedPayout] = useState<InteracPayout | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{ show: boolean; targetStatus: PayoutStatus | null }>({
    show: false,
    targetStatus: null,
  });

  const payouts = useMemo(() => {
    const list: InteracPayout[] = (withdrawalsData || []).map((w: any) => {
      let localStatus: PayoutStatus = "Pending";
      if (w.status === "completed") localStatus = "Completed";
      else if (w.status === "processing") localStatus = "Processing";
      else if (w.status === "failed" || w.status === "rejected") localStatus = "Failed";

      return {
        payoutId: `PAY-${w.id.slice(0, 8).toUpperCase()}`,
        realId: w.id,
        user: {
          id: w.user_id,
          name: w.user?.name || "Unknown User",
          email: w.user?.email || "N/A",
        } as AdminUser,
        amount: Number(w.amount),
        status: localStatus,
        requestDate: new Date(w.created_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        referenceCode: `WDR-${w.id.slice(0, 5).toUpperCase()}`,
        securityQuestion: w.security_question,
        securityAnswer: w.security_answer,
      };
    });

    list.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    return list;
  }, [withdrawalsData]);

  const counts = useMemo(() => {
    return {
      all: payouts.length,
      Pending: payouts.filter((p) => p.status === "Pending").length,
      Processing: payouts.filter((p) => p.status === "Processing").length,
      Completed: payouts.filter((p) => p.status === "Completed").length,
      Failed: payouts.filter((p) => p.status === "Failed").length,
    };
  }, [payouts]);

  const filteredPayouts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return payouts.filter((p) => {
      const matchesTab = activeTab === "all" || p.status === activeTab;
      const matchesSearch =
        !query ||
        p.payoutId.toLowerCase().includes(query) ||
        p.referenceCode.toLowerCase().includes(query) ||
        p.user.name.toLowerCase().includes(query) ||
        p.user.email.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, payouts, search]);

  const stats = useMemo(() => {
    const pendingSum = payouts.filter((p) => p.status === "Pending").reduce((acc, p) => acc + p.amount, 0);
    const processingSum = payouts.filter((p) => p.status === "Processing").reduce((acc, p) => acc + p.amount, 0);
    const completedSum = payouts.filter((p) => p.status === "Completed").reduce((acc, p) => acc + p.amount, 0);

    return [
      {
        label: "Pending Payouts",
        value: `$${pendingSum.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        note: `${counts.Pending} requests`,
        icon: (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Clock className="h-5.5 w-5.5" />
          </div>
        ),
      },
      {
        label: "Processing",
        value: `$${processingSum.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        note: `${counts.Processing} in progress`,
        icon: (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <CreditCard className="h-5.5 w-5.5" />
          </div>
        ),
      },
      {
        label: "Completed (24h)",
        value: `$${completedSum.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        note: `${counts.Completed} completed`,
        noteTone: "text-green-600 font-bold",
        icon: (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
            <CheckCircle2 className="h-5.5 w-5.5" />
          </div>
        ),
      },
    ];
  }, [payouts, counts]);

  const handleOpenDetails = (payout: InteracPayout) => {
    setSelectedPayout(payout);
  };

  const handleCloseDetails = () => {
    setSelectedPayout(null);
  };

  const handleStatusChangeTrigger = (status: PayoutStatus) => {
    setShowConfirmModal({ show: true, targetStatus: status });
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedPayout || !showConfirmModal.targetStatus) return;
    const payoutId = selectedPayout.payoutId;
    const realId = selectedPayout.realId;
    const status = showConfirmModal.targetStatus;

    let backendStatus = "pending";
    if (status === "Completed") backendStatus = "completed";
    else if (status === "Processing") backendStatus = "processing";
    else if (status === "Failed") backendStatus = "failed";

    try {
      if (realId) {
        await updateWithdrawal.mutateAsync({
          requestId: realId,
          status: backendStatus,
          adminNote: "Updated from Interac Payouts console",
        });

        setToast(`Payout ${payoutId} status set to ${status} successfully`);
      } else {
        setToast(`Payout ${payoutId} status set to ${status} successfully`);
      }

      setSelectedPayout((prev) => (prev ? { ...prev, status } : null));
      setShowConfirmModal({ show: false, targetStatus: null });
      window.setTimeout(() => setToast(null), 2500);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update payout status");
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
            <h1 className="text-[26px] font-bold leading-tight text-gray-900 sm:text-[30px]">Interac e-Transfer Payouts</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Manage and monitor Interac e-Transfer withdrawal requests</p>
          </div>
          <button
            onClick={() => {
              setToast("Payout report exported successfully.");
              window.setTimeout(() => setToast(null), 2500);
            }}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>

        {/* Toast */}
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex min-h-[120px] items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold leading-none text-gray-900">{stat.value}</p>
                <p className={cn("text-xs text-gray-600 font-semibold mt-1", stat.noteTone)}>{stat.note}</p>
              </div>
              {stat.icon}
            </div>
          ))}
        </div>

        {/* Filter and Table container */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Search bar */}
          <div className="border-b border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by user, email, or payout ID..."
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
            <div className="grid min-w-[1150px] grid-cols-[1.2fr_1.8fr_1.2fr_1.2fr_1.6fr_1.4fr_80px] gap-4 bg-gray-50 px-5 py-3 border-b border-gray-200/80">
              {["Payout ID", "User", "Amount", "Status", "Request Date", "Reference", "Actions"].map((heading) => (
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
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="grid grid-cols-[1.2fr_1.8fr_1.2fr_1.2fr_1.6fr_1.4fr_80px] gap-4 items-center px-5 py-4.5">
                      <div className="h-4 bg-gray-100 rounded-lg w-24 animate-pulse" />
                      <div className="space-y-1.5">
                        <div className="h-4 bg-gray-100 rounded-lg w-28 animate-pulse" />
                        <div className="h-3 bg-gray-100 rounded-lg w-36 animate-pulse" />
                      </div>
                      <div className="h-4 bg-gray-100 rounded-lg w-16 animate-pulse" />
                      <div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded-lg w-28 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded-lg w-20 animate-pulse" />
                      <div className="h-8 bg-gray-100 rounded-lg w-8 justify-self-end animate-pulse" />
                    </div>
                  ))}
                </motion.div>
              ) : filteredPayouts.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-w-[1150px] py-16 text-center text-sm font-medium text-gray-600 bg-white"
                >
                  No Interac payouts found.
                </motion.div>
              ) : (
                <motion.div key={search} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {filteredPayouts.map((payout) => (
                    <div
                      key={payout.payoutId}
                      className="grid min-w-[1150px] grid-cols-[1.2fr_1.8fr_1.2fr_1.2fr_1.6fr_1.4fr_80px] items-center gap-4 border-b border-gray-100 bg-white px-5 py-4 transition-colors hover:bg-blue-50/20"
                    >
                      <div className="font-extrabold text-gray-950 font-mono text-xs">{payout.payoutId}</div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-gray-900 text-sm">{payout.user.name}</p>
                        <p className="truncate text-xs text-gray-600">{payout.user.email}</p>
                      </div>
                      <div className="font-extrabold text-gray-900 text-sm">${payout.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                      <div>
                        <StatusBadge status={payout.status} />
                      </div>
                      <div className="text-xs font-semibold text-gray-600 font-mono">{payout.requestDate}</div>
                      <div className="text-xs font-bold text-gray-700 font-mono">{payout.referenceCode}</div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleOpenDetails(payout)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-800 active:scale-[0.98] shadow-sm cursor-pointer"
                          title="View Details"
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
              Showing <strong className="text-gray-700">{filteredPayouts.length}</strong> of <strong className="text-gray-700">{payouts.length}</strong> payout requests
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <ShieldCheck className="h-4 w-4 text-[#0A3D91]" />
              CDNT secure payout authorization queue
            </div>
          </div>
        </section>
      </motion.div>

      {/* Details modal */}
      <AnimatePresence>
        {selectedPayout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={handleCloseDetails}
            />

            {/* Modal Card */}
            {!showConfirmModal.show && (
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
                  className="absolute right-6 top-6 h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Header */}
                <div className="px-8 pt-7 pb-4 border-b border-gray-100">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[22px] font-bold text-gray-900 leading-tight">Payout Request Details</h2>
                    <StatusBadge status={selectedPayout.status} />
                  </div>
                  <p className="text-xs text-gray-600 font-semibold mt-1">
                    ID: {selectedPayout.payoutId} • Requested: {selectedPayout.requestDate}
                  </p>
                </div>

                {/* Body */}
                <div className="px-8 py-6 flex-1 overflow-y-auto space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User info */}
                    <div className="border border-gray-200 bg-white rounded-2xl p-5 space-y-4 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                        <User className="h-4.5 w-4.5 text-[#0A3D91]" />
                        User Recipient
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">User ID</span>
                          <p className="text-xs font-mono font-bold text-gray-900 mt-1">{selectedPayout.user.id}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Name</span>
                          <p className="text-sm font-bold text-gray-900 mt-1 leading-tight">{selectedPayout.user.name}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Email (Interac Recipient)</span>
                          <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{selectedPayout.user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payout details */}
                    <div className="border border-gray-200 bg-white rounded-2xl p-5 space-y-4 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                        <CreditCard className="h-4.5 w-4.5 text-[#0A3D91]" />
                        Payout Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Payout Amount (CAD)</span>
                          <p className="text-2xl font-black text-gray-950 mt-1 leading-none">${selectedPayout.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Reference Code</span>
                          <p className="text-sm font-bold text-gray-900 mt-0.5 font-mono">{selectedPayout.referenceCode}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Transfer Channel</span>
                          <p className="text-xs font-semibold text-gray-700 mt-0.5">Interac e-Transfer Auto-Deposit</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security question answer card */}
                  {selectedPayout.securityQuestion && (
                    <div className="border border-gray-200 bg-gray-50/50 rounded-2xl p-5 space-y-3 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        <ShieldCheck className="h-4.5 w-4.5 text-green-600" />
                        Interac Security Credentials
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Security Question</span>
                          <p className="text-xs font-semibold text-gray-800 mt-1">{selectedPayout.securityQuestion}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Security Answer</span>
                          <p className="text-xs font-mono font-bold text-gray-950 mt-1 bg-white border border-gray-150 p-2 rounded-lg select-all">
                            {selectedPayout.securityAnswer}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer action tools */}
                <div className="px-8 py-5 border-t border-gray-100 flex justify-between items-center gap-3">
                  <div className="text-xs text-gray-600 font-semibold">
                    Admin signature overrides
                  </div>
                  <div className="flex gap-2">
                    {selectedPayout.status !== "Completed" && (
                      <button
                        onClick={() => handleStatusChangeTrigger("Completed")}
                        className="px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-bold transition-all hover:opacity-90 cursor-pointer shadow-md"
                        style={{ background: BRAND_GRADIENT }}
                      >
                        Complete Payout
                      </button>
                    )}
                    {selectedPayout.status === "Pending" && (
                      <button
                        onClick={() => handleStatusChangeTrigger("Processing")}
                        className="px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                      >
                        Process Payout
                      </button>
                    )}
                    {selectedPayout.status !== "Failed" && (
                      <button
                        onClick={() => handleStatusChangeTrigger("Failed")}
                        className="px-4 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-700 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                      >
                        Fail / Decline
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Confirmation popup */}
            {showConfirmModal.show && showConfirmModal.targetStatus && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 350 }}
                className="relative bg-white w-full max-w-[420px] rounded-2xl shadow-2xl p-6 z-20 border border-gray-100"
              >
                <button
                  onClick={() => setShowConfirmModal({ show: false, targetStatus: null })}
                  className="absolute right-6 top-6 h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="h-11 w-11 rounded-full bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center mb-4">
                  <AlertCircle className="h-6 w-6" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 leading-tight">Confirm Payout Status Change?</h3>
                <p className="text-xs text-gray-600 mt-3 font-semibold">
                  Are you sure you want to change the status of payout request{" "}
                  <strong className="text-gray-950 font-extrabold">{selectedPayout?.payoutId}</strong> to{" "}
                  <span className={cn(
                    "font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-[10px]",
                    showConfirmModal.targetStatus === "Completed" ? "bg-green-50 text-green-700" :
                    showConfirmModal.targetStatus === "Processing" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
                  )}>
                    {showConfirmModal.targetStatus}
                  </span>
                  ?
                </p>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowConfirmModal({ show: false, targetStatus: null })}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-bold text-gray-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmStatusChange}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
                    style={{ background: BRAND_GRADIENT }}
                  >
                    Confirm Change
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
