"use client";

import { useMemo, useState, useEffect } from "react";
import { useWithdrawals, useUpdateWithdrawal } from "@/hooks/useAdminQueries";
import { fetchLiveCADRates } from "@/lib/utils";
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
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Check,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type WithdrawalStatus = "Pending" | "Approved" | "Rejected" | "Completed" | "Failed";
type TabValue = "all" | WithdrawalStatus;

type WithdrawalRequest = {
  requestId: string;
  realId?: string;
  user: any;
  amount: number;
  cryptoAmount: string;
  cryptoCurrency: string;
  riskScore: "low risk" | "medium risk" | "high risk";
  kycStatus: "verified" | "pending" | "rejected" | "not started";
  requestDate: string;
  status: WithdrawalStatus;
  interacRecipient: string;
  previousWithdrawals: number;
  currentBalance: number;
};

const BRAND_GRADIENT = "linear-gradient(135deg, #064e3b 0%, #047857 100%)";

// Removed INITIAL_REQUESTS to enforce purely live data from Supabase

const TABS: Array<{ label: string; value: TabValue }> = [
  { label: "All Requests", value: "all" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
  { label: "Completed", value: "Completed" },
  { label: "Failed", value: "Failed" },
];

function StatusBadge({ status }: { status: WithdrawalStatus }) {
  const map: Record<WithdrawalStatus, { cls: string; icon: React.ReactNode }> = {
    Pending: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
    Approved: { cls: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="h-3 w-3" /> },
    Rejected: { cls: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" /> },
    Completed: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
    Failed: { cls: "bg-gray-100 text-gray-700 border-gray-200", icon: <AlertCircle className="h-3 w-3" /> },
  };
  const style = map[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase font-mono tracking-wider", style.cls)}>
      {style.icon}
      {status}
    </span>
  );
}

function RiskBadge({ level }: { level: "low risk" | "medium risk" | "high risk" }) {
  const map: Record<typeof level, string> = {
    "low risk": "bg-green-50 text-green-700 border-green-200",
    "medium risk": "bg-amber-50 text-amber-700 border-amber-200",
    "high risk": "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase font-mono tracking-wider", map[level])}>
      {level}
    </span>
  );
}

function KycStatusBadge({ status }: { status: WithdrawalRequest["kycStatus"] }) {
  const map: Record<typeof status, string> = {
    verified: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    "not started": "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase font-mono tracking-wider", map[status])}>
      {status}
    </span>
  );
}

export default function WithdrawalRequestsPage() {
  return (
    <RequirePermission permission="approve-withdrawals">
      <WithdrawalRequestsPageContent />
    </RequirePermission>
  );
}

function WithdrawalRequestsPageContent() {
  const router = useRouter();
  const { data: withdrawalsData = [], isLoading: loading } = useWithdrawals();
  const updateWithdrawal = useUpdateWithdrawal();

  // Live CAD rates — same source as the Transactions page
  const [liveRates, setLiveRates] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    fetchLiveCADRates().then(setLiveRates);
  }, []);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("Pending");
  const [toast, setToast] = useState<string | null>(null);

  /* ─── Modal state variables ─────────────────────────────────────── */
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [currentNote, setCurrentNote] = useState("");

  const requests = useMemo(() => {
    // Use the same live rates as the Transactions page
    const cadRateForAsset = (asset: string): number => {
      const sym = (asset || "USDT").toUpperCase();
      if (sym === "CAD") return 1;
      return Number(liveRates?.[sym]) || Number(liveRates?.["USDT"]) || 1.36;
    };

    const list: WithdrawalRequest[] = (withdrawalsData || []).map((w: any) => {
      const asset = w.asset || (w.method === "interac" ? "CAD" : "USD");
      const rate = cadRateForAsset(asset);

      return {
        requestId: `WD-${w.id.slice(0, 8).toUpperCase()}`,
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
        amount: Number(w.amount) * rate,
        cryptoAmount: `${w.amount} ${asset}`,
        cryptoCurrency: asset,
        riskScore: "medium risk" as const,
        kycStatus: w.kycStatus || "not started",
        requestDate: new Date(w.created_at).toISOString().replace("T", " ").slice(0, 19),
        status: w.status === "completed" ? "Completed" : w.status === "approved" ? "Approved" : w.status === "rejected" ? "Rejected" : w.status === "failed" ? "Failed" : "Pending",
        interacRecipient: w.interac_email,
        previousWithdrawals: 0,
        currentBalance: Number(w.amount),
      };
    });

    list.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    return list;
  }, [withdrawalsData, liveRates]);

  const counts = useMemo(() => {
    return {
      all: requests.length,
      Pending: requests.filter((r) => r.status === "Pending").length,
      Approved: requests.filter((r) => r.status === "Approved").length,
      Rejected: requests.filter((r) => r.status === "Rejected").length,
      Completed: requests.filter((r) => r.status === "Completed").length,
      Failed: requests.filter((r) => r.status === "Failed").length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesTab = activeTab === "all" || request.status === activeTab;
      const matchesSearch =
        !query ||
        request.requestId.toLowerCase().includes(query) ||
        request.user.id.toLowerCase().includes(query) ||
        request.user.name.toLowerCase().includes(query) ||
        request.user.email.toLowerCase().includes(query) ||
        request.cryptoCurrency.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, requests, search]);

  const stats = useMemo(() => {
    return [
      {
        label: "Pending Requests",
        value: counts.Pending,
        tone: "text-gray-900",
        icon: (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        ),
      },
      {
        label: "Rejected Today",
        value: requests.filter(r => r.status === "Rejected").length,
        tone: "text-red-600 font-bold",
        icon: (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <XCircle className="h-6 w-6" />
          </div>
        ),
      },
      {
        label: "Total Amount Pending",
        value: `$${requests.filter(r => r.status === "Pending").reduce((acc, r) => acc + r.amount, 0).toLocaleString()}`,
        tone: "text-gray-900",
        icon: (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <FileText className="h-6 w-6" />
          </div>
        ),
      },
      {
        label: "Approved Today",
        value: requests.filter(r => r.status === "Approved" || r.status === "Completed").length,
        tone: "text-green-600 font-bold",
        icon: (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        ),
      },
    ];
  }, [requests, counts]);

  /* ─── Modal actions ─────────────────────────────────────────────── */
  const handleStartReview = (req: WithdrawalRequest) => {
    setSelectedRequest(req);
    setShowApproveModal(false);
    setShowRejectModal(false);
    setRejectionReason("");
    setCurrentNote(adminNotes[req.requestId] || "");
  };

  const handleCloseReviewModal = () => {
    setSelectedRequest(null);
  };

  const handleConfirmApprove = async () => {
    if (!selectedRequest) return;
    const reqId = selectedRequest.requestId;
    const realId = selectedRequest.realId;

    try {
      if (!realId) throw new Error("Invalid request ID - missing database reference");

      await updateWithdrawal.mutateAsync({
        requestId: realId,
        status: "completed",
        adminNote: currentNote,
      });

      setToast(`Withdrawal request ${reqId} completed ✓`);

      if (currentNote.trim()) {
        setAdminNotes((prev) => ({ ...prev, [reqId]: currentNote }));
      }
      setSelectedRequest(null);
      setShowApproveModal(false);
      window.setTimeout(() => setToast(null), 2500);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to approve withdrawal");
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    const reqId = selectedRequest.requestId;
    const realId = selectedRequest.realId;

    try {
      if (!realId) throw new Error("Invalid request ID - missing database reference");

      await updateWithdrawal.mutateAsync({
        requestId: realId,
        status: "rejected",
        rejectionReason: currentNote,
        adminNote: currentNote,
      });

      setToast(`Withdrawal request ${reqId} rejected`);

      if (currentNote.trim()) {
        setAdminNotes((prev) => ({ ...prev, [reqId]: currentNote }));
      }
      setSelectedRequest(null);
      setShowRejectModal(false);
      window.setTimeout(() => setToast(null), 2500);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to reject withdrawal");
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[26px] font-bold leading-tight text-gray-900 sm:text-[30px]">Withdrawal Requests</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Review and approve withdrawal requests from users</p>
          </div>
          <button
            onClick={() => {
              setToast("Withdrawals report export prepared.");
              window.setTimeout(() => setToast(null), 2500);
            }}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>

        {/* Counter cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex min-h-[134px] items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className={cn("mt-2 text-3xl font-bold leading-none", stat.tone)}>{stat.value}</p>
              </div>
              {stat.icon}
            </div>
          ))}
        </div>

        {/* Filter & Table container */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search..."
                className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-11 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-500 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-50 sm:text-base"
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
          <div className="flex gap-2.5 overflow-x-auto border-b border-gray-250/60 p-4 bg-white no-scrollbar">
            {TABS.map((tab) => {
              const active = activeTab === tab.value;
              const count = tab.value === "all" ? counts.all : counts[tab.value as keyof typeof counts];
              const countLabel = count !== undefined ? ` (${count})` : "";
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-155 cursor-pointer shadow-sm",
                    active
                      ? "bg-[#064e3b] text-white"
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
            <div className="grid min-w-[1150px] grid-cols-[1.1fr_1.8fr_1.3fr_1.1fr_1.1fr_1.1fr_1.6fr_120px] gap-4 bg-gray-50 px-5 py-3 border-b border-gray-200/80">
              {["Request ID", "User", "Amount", "Crypto", "Risk", "KYC", "Request Date", "Actions"].map((heading) => (
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
                    <div key={idx} className="grid grid-cols-[1.1fr_1.8fr_1.3fr_1.1fr_1.1fr_1.1fr_1.6fr_120px] gap-4 items-center px-5 py-4.5">
                      <div className="h-4 bg-gray-100 rounded-lg w-16 animate-pulse" />
                      <div className="space-y-1.5">
                        <div className="h-4 bg-gray-100 rounded-lg w-28 animate-pulse" />
                        <div className="h-3 bg-gray-100 rounded-lg w-36 animate-pulse" />
                      </div>
                      <div className="h-4 bg-gray-100 rounded-lg w-20 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded-lg w-16 animate-pulse" />
                      <div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse" />
                      <div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded-lg w-28 animate-pulse" />
                      <div className="h-8 bg-gray-100 rounded-lg w-full animate-pulse" />
                    </div>
                  ))}
                </motion.div>
              ) : filteredRequests.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-w-[1150px] py-16 text-center text-sm font-medium text-gray-600 bg-white"
                >
                  No withdrawal requests found.
                </motion.div>
              ) : (
                <motion.div key={`${activeTab}-${search}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {filteredRequests.map((request) => (
                    <div
                      key={request.requestId}
                      className="grid min-w-[1150px] grid-cols-[1.1fr_1.8fr_1.3fr_1.1fr_1.1fr_1.1fr_1.6fr_120px] items-center gap-4 border-b border-gray-100 bg-white px-5 py-4 transition-colors hover:bg-emerald-50/20"
                    >
                      <div>
                        <p className="font-extrabold text-gray-950 font-mono tracking-tight text-xs">{request.requestId}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-gray-900 text-sm">{request.user.name}</p>
                        <p className="truncate text-xs text-gray-600">{request.user.email}</p>
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900 text-sm">${request.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-600 font-extrabold uppercase font-mono tracking-wider">CAD</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-600">{request.cryptoAmount}</p>
                      </div>
                      <div>
                        <RiskBadge level={request.riskScore} />
                      </div>
                      <div>
                        <KycStatusBadge status={request.kycStatus} />
                      </div>
                      <div className="text-xs font-semibold text-gray-600 font-mono">
                        {request.requestDate}
                      </div>
                      <div className="relative flex justify-end">
                        <button
                          onClick={() => handleStartReview(request)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-800 active:scale-[0.98] shadow-sm cursor-pointer"
                          title="Review Request"
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

          <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/60 px-5 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing <strong className="text-gray-700">{filteredRequests.length}</strong> of <strong className="text-gray-700">{requests.length}</strong> requests
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <ShieldCheck className="h-4 w-4 text-[#064e3b]" />
              CDNT secure withdrawal ledger
            </div>
          </div>
        </section>
      </motion.div>

      {/* ─── MODALS STACK ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={handleCloseReviewModal}
            />

            {/* SCREEN 3: Centered Withdrawal Details Modal */}
            {(!showApproveModal && !showRejectModal) && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 border border-gray-100"
              >
                {/* Close Button */}
                <button
                  onClick={handleCloseReviewModal}
                  className="absolute right-6 top-6 h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="px-8 pt-7 pb-4">
                  <h2 className="text-[22px] font-bold text-gray-900 leading-tight">Withdrawal Request Details</h2>
                  <p className="text-xs text-gray-600 font-semibold mt-1">
                    {selectedRequest.requestId}
                  </p>
                </div>

                {/* Modal Body */}
                <div className="px-8 pb-8 flex-1 overflow-y-auto space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Information details */}
                    <div className="border border-gray-150 bg-white rounded-2xl p-5 space-y-4">
                      <h3 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">User Information</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Name</span>
                          <p className="text-base font-bold text-gray-900 mt-1 leading-tight">{selectedRequest.user.name}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Email</span>
                          <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{selectedRequest.user.email}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider block mb-1">KYC Status</span>
                          <KycStatusBadge status={selectedRequest.kycStatus} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Current Balance</span>
                            <p className="text-sm font-bold text-gray-900 mt-1">${selectedRequest.currentBalance.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Previous Withdrawals</span>
                            <p className="text-sm font-bold text-gray-900 mt-1">{selectedRequest.previousWithdrawals}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Withdrawal Details card */}
                    <div className="border border-gray-150 bg-white rounded-2xl p-5 space-y-4">
                      <h3 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">Withdrawal Details</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Amount (CAD)</span>
                          <p className="text-2xl font-black text-gray-950 mt-1 leading-none">${selectedRequest.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Cryptocurrency</span>
                          <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedRequest.cryptoAmount}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Interac Recipient</span>
                          <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{selectedRequest.interacRecipient}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono leading-none tracking-wider">Request Date</span>
                          <p className="text-xs font-bold text-gray-800 mt-0.5 font-mono">{selectedRequest.requestDate}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-600 font-bold uppercase font-mono block mb-1 tracking-wider">Risk Score</span>
                          <RiskBadge level={selectedRequest.riskScore} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Note Card */}
                  <div className="border border-gray-150 bg-gray-50/40 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-gray-900">Admin Decision</h3>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block">
                        Internal Admin Note (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={currentNote}
                        onChange={(e) => setCurrentNote(e.target.value)}
                        placeholder="Write admin review note or override memo here..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm outline-none resize-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-gray-800 placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Footer buttons (Approve / Reject) */}
                  <div className="flex gap-3 justify-end pt-5 border-t border-gray-100">
                    <button
                      onClick={() => {
                        if (selectedRequest.status === "Rejected") {
                          alert("This withdrawal is already rejected");
                          return;
                        }
                        setShowRejectModal(true);
                      }}
                      className="px-6 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-700 text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Reject Request
                    </button>
                    <button
                      onClick={() => setShowApproveModal(true)}
                      className="px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5 hover:opacity-90 cursor-pointer"
                      style={{ background: BRAND_GRADIENT }}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Approve Request
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SCREEN 4: Centered Approve Confirmation Modal */}
            {showApproveModal && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 350 }}
                className="relative bg-white w-full max-w-[420px] rounded-2xl shadow-2xl p-6 z-20 border border-gray-100"
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="absolute right-6 top-6 h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Check Icon Header */}
                <div className="h-11 w-11 rounded-full bg-green-50 border border-green-100 text-green-500 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 leading-tight">Approve Withdrawal?</h3>

                {/* Confirmation Body */}
                <p className="text-xs text-gray-600 leading-relaxed mt-4 font-semibold">
                  Are you sure you want to approve this withdrawal request for{" "}
                  <strong className="text-gray-900 font-extrabold">${selectedRequest.amount.toLocaleString()}</strong>?
                </p>

                {/* Footer Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowApproveModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-bold text-gray-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmApprove}
                    className="flex-1 py-2.5 rounded-xl text-white bg-green-600 hover:bg-green-700 text-sm font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Confirm Approval
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 5: Centered Reject Confirmation Modal */}
            {showRejectModal && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 350 }}
                className="relative bg-white w-full max-w-[420px] rounded-2xl shadow-2xl p-6 z-20 border border-gray-100"
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="absolute right-6 top-6 h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Warning Icon Header */}
                <div className="h-11 w-11 rounded-full bg-red-50 border border-red-100 text-red-500 flex items-center justify-center mb-4">
                  <XCircle className="h-6 w-6" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 leading-tight">Reject Withdrawal?</h3>
                <p className="text-xs text-gray-600 mt-2 font-semibold">
                  Are you sure you want to reject this withdrawal request?
                </p>

                {/* Footer Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-bold text-gray-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReject}
                    className="flex-1 py-2.5 rounded-xl text-white bg-red-600 hover:bg-red-700 text-sm font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-xl border border-slate-800"
          >
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            <span className="truncate">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
