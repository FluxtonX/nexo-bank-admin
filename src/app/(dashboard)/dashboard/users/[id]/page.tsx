"use client";

import { useState, useEffect, useMemo } from "react";
import { useUserDetail, useUpdateUserAccount, useAddUserNote, useUpdateKyc } from "@/hooks/useAdminQueries";
import { useQueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { RequirePermission } from "@/components/layout/RequirePermission";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, FileEdit, Download, Lock, Unlock,
  CheckCircle2, Clock, XCircle, AlertTriangle, Shield,
  User, Mail, Phone, Calendar, MapPin, Activity,
  Smartphone, Globe, Wallet, BarChart3, FileText,
  MessageCircle, History, Monitor, LogOut, RefreshCw,
  Eye, Plus, DollarSign, X, Send, Save, Search, Trash2, Loader2,
  ChevronRight, Pencil,
} from "lucide-react";
import { cn, fetchLiveCADRates, COIN_COLORS } from "@/lib/utils";
import { type KycStatus, type AccountStatus, type RiskLevel } from "@/lib/data/users";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
};

/* ─── Badge helpers ──────────────────────────────────────────────── */
function KycBadge({ status }: { status: KycStatus }) {
  const map: Record<KycStatus, { cls: string; icon: React.ReactNode }> = {
    "Verified":    { cls: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2  className="h-3.5 w-3.5" /> },
    "Pending":     { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock         className="h-3.5 w-3.5" /> },
    "Rejected":    { cls: "bg-red-50   text-red-700   border-red-200",   icon: <XCircle       className="h-3.5 w-3.5" /> },
    "Not Started": { cls: "bg-gray-100 text-gray-600  border-gray-200",  icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  };
  const s = map[status] || map["Not Started"];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border", s.cls)}>
      {s.icon}{status}
    </span>
  );
}

function AccountBadge({ status }: { status: AccountStatus }) {
  const map: Record<AccountStatus, string> = {
    "Active":    "bg-green-50 text-green-700 border-green-200",
    "Suspended": "bg-red-50   text-red-700   border-red-200",
    "Frozen":    "bg-red-50   text-red-700   border-red-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border", map[status] || map["Active"])}>
      {status === "Frozen" && <Lock className="h-3.5 w-3.5" />}
      {status}
    </span>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const map: Record<RiskLevel, string> = {
    "Low Risk":    "bg-green-50 text-green-700 border-green-200",
    "Medium Risk": "bg-amber-50 text-amber-700 border-amber-200",
    "High Risk":   "bg-red-50   text-red-700   border-red-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border", map[level] || map["Low Risk"])}>
      {level === "High Risk" && <AlertTriangle className="h-3.5 w-3.5" />}
      {level}
    </span>
  );
}

/* ─── Info Field ─────────────────────────────────────────────────── */
function InfoField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-gray-600 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-600 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value || "N/A"}</p>
      </div>
    </div>
  );
}

/* ─── Tabs config ────────────────────────────────────────────────── */
const TABS = [
  { id: "overview",     label: "Overview",     icon: User },
  { id: "portfolio",    label: "Portfolio",    icon: BarChart3 },
  { id: "transactions", label: "Transactions", icon: Activity },
  { id: "security",     label: "Security",     icon: Shield },
  { id: "documents",    label: "Documents",    icon: FileText },
  { id: "support",      label: "Support",      icon: MessageCircle },
  { id: "audit-logs",   label: "Audit Logs",   icon: History },
];

/* ─── Freeze Account Modal ───────────────────────────────────────── */
function FreezeModal({ onConfirm, onClose }: { onConfirm: (r: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const hasError = touched && !reason.trim();

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: "spring", damping: 28, stiffness: 340 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Lock className="h-6 w-6 text-amber-500" />
            </div>
            <div className="pt-0.5">
              <h2 className="text-[17px] font-bold text-gray-900">Freeze Account</h2>
              <p className="text-sm text-gray-600 mt-0.5">This action will suspend all account activity</p>
            </div>
          </div>
          <div className="mb-5">
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              Reason for freezing <span className="text-red-500">*</span>
            </label>
            <textarea rows={4} placeholder="Enter the reason for freezing this account..."
              value={reason}
              onChange={(e) => { setReason(e.target.value); setTouched(true); }}
              onBlur={() => setTouched(true)}
              className={cn("w-full px-4 py-3 rounded-xl border text-sm text-gray-800 placeholder:text-gray-500 outline-none resize-none transition-all",
                hasError ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-100"
                         : "border-gray-200 bg-gray-50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50")}
            />
            {hasError && <p className="text-xs text-red-500 mt-1">Please provide a reason for freezing.</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={() => { setTouched(true); if (reason.trim()) onConfirm(reason); }}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
              style={{ background: "#F59E0B" }}>
              Freeze Account
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Add Admin Note Modal ───────────────────────────────────────── */
function NoteModal({ onConfirm, onClose }: { onConfirm: (n: string) => void; onClose: () => void }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const hasError = touched && !note.trim();

  const handleSubmit = async () => {
    setTouched(true);
    if (!note.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    onConfirm(note);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: "spring", damping: 28, stiffness: 340 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <FileEdit className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="pt-0.5">
              <h2 className="text-[17px] font-bold text-gray-900">Add Admin Note</h2>
              <p className="text-sm text-gray-600 mt-0.5">Internal note visible only to admins</p>
            </div>
          </div>
          <div className="mb-5">
            <textarea rows={4} placeholder="Enter your note..."
              value={note}
              onChange={(e) => { setNote(e.target.value); setTouched(true); }}
              className={cn("w-full px-4 py-3 rounded-xl border text-sm text-gray-800 placeholder:text-gray-500 outline-none resize-none transition-all",
                hasError ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-100"
                         : "border-gray-200 bg-emerald-50/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50")}
            />
            {hasError && <p className="text-xs text-red-500 mt-1">Please enter a note before saving.</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-70 transition-all"
              style={{ background: "linear-gradient(135deg,#064e3b,#047857)" }}>
              {loading ? "Saving…" : "Add Note"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const COIN_OPTIONS = ["BTC", "ETH", "USDT", "CAD"] as const;

async function applyWalletDelta(userId: string, currency: string, delta: number) {
  const res = await fetch("/api/users", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, action: "adjust-balance", currency, delta }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to adjust balance");
  }
  return res.json();
}

function AddTransactionModal({
  user,
  onClose,
  onSuccess,
  onError,
}: {
  user: { id: string; name: string; email: string };
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const [coin, setCoin] = useState<string>("BTC");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [txType, setTxType] = useState<"Deposit" | "Withdrawal">("Deposit");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      onError("Enter a valid amount greater than zero.");
      return;
    }

    setLoading(true);
    try {
      const txDate = new Date(date).toISOString();
      const res = await fetch("/api/users/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          txType,
          coin,
          amount: numericAmount,
          txDate,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add transaction");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Failed to add transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-[17px] font-bold text-gray-900">Add Transaction</h2>
            <p className="text-sm text-gray-600 mt-0.5">Record a completed deposit or withdrawal</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">User</label>
            <input readOnly value={`${user.name} (${user.email})`} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-sm text-gray-800" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Coin</label>
              <select value={coin} onChange={(e) => setCoin(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-sm font-semibold text-gray-800">
                {COIN_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Type</label>
              <select value={txType} onChange={(e) => setTxType(e.target.value as "Deposit" | "Withdrawal")} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-sm font-semibold text-gray-800">
                <option value="Deposit">Deposit</option>
                <option value="Withdrawal">Withdrawal</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Amount</label>
              <input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-sm text-gray-800" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-sm text-gray-800" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-70" style={{ background: "linear-gradient(135deg,#064e3b,#047857)" }}>
              {loading ? "Saving…" : "Add Transaction"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ManageBalanceModal({
  user,
  onClose,
  onSuccess,
  onError,
}: {
  user: { id: string; name: string; email: string };
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"adjust" | "deposit" | "withdrawal">("adjust");
  const [currency, setCurrency] = useState<string>("BTC");
  const [amount, setAmount] = useState("");
  const [cadAmount, setCadAmount] = useState("");
  const [action, setAction] = useState<"Add" | "Deduct">("Add");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [rateLoading, setRateLoading] = useState(true);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [cadRate, setCadRate] = useState<number>(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Fetch current balance and CAD rate for selected currency
  useEffect(() => {
    const fetchData = async () => {
      setRateLoading(true);
      try {
        const [userRes, rates] = await Promise.all([
          fetch(`/api/users/${user.id}`),
          fetchLiveCADRates([currency]),
        ]);
        
        if (userRes.ok) {
          const data = await userRes.json();
          const wallet = data.wallets?.find((w: any) => w.currency === currency);
          setCurrentBalance(wallet ? Number(wallet.balance) : 0);
        }
        
        // Only set rate if it's available from the API response
        // Don't fall back to hardcoded rates - let the UI show loading instead
        if (rates[currency]) {
          setCadRate(rates[currency]);
        } else if (rates.USDT && currency.toUpperCase() !== "CAD") {
          setCadRate(rates.USDT);
        } else if (currency.toUpperCase() === "CAD") {
          setCadRate(1);
        }
      } catch (e) {
        console.error("Failed to fetch data:", e);
      } finally {
        setRateLoading(false);
      }
    };
    fetchData();
  }, [user.id, currency]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // CAD calculator handlers - bidirectional conversion
  const handleCryptoChange = (val: string) => {
    setAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && cadRate > 0 && !rateLoading && currency.toUpperCase() !== "CAD") {
      setCadAmount((num * cadRate).toFixed(2));
    } else if (currency.toUpperCase() === "CAD") {
      setCadAmount(val);
    } else {
      setCadAmount("");
    }
  };

  const handleCadChange = (val: string) => {
    setCadAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && cadRate > 0 && !rateLoading && currency.toUpperCase() !== "CAD") {
      setAmount((num / cadRate).toFixed(8));
    } else if (currency.toUpperCase() === "CAD") {
      setAmount(val);
    } else {
      setAmount("");
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    setAmount("");
    setCadAmount("");
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleSubmit = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      onError("Enter a valid amount greater than zero.");
      return;
    }
    if (activeTab === "adjust" && !reason.trim()) {
      onError("Please provide a reason for this adjustment.");
      return;
    }
    if (activeTab === "withdrawal" && numericAmount > currentBalance) {
      onError("Insufficient balance for withdrawal.");
      return;
    }

    setLoading(true);
    try {
      const txDate = new Date(date).toISOString();

      if (activeTab === "adjust") {
        const delta = action === "Add" ? numericAmount : -numericAmount;
        const res = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, action: "adjust-balance", currency, delta }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to adjust balance");
        }
      } else {
        const txType = activeTab === "deposit" ? "Deposit" : "Withdrawal";
        const res = await fetch("/api/users/transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            txType,
            coin: currency,
            amount: numericAmount,
            txDate,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to add transaction");
        }
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-3">
          <div className="cursor-move" onMouseDown={handleMouseDown}>
            <h2 className="text-[16px] font-bold text-gray-900">Manage Balance</h2>
            <p className="text-xs text-gray-600 mt-0.5">{user.name} • {user.email}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            {[
              { id: "adjust", label: "Adjust" },
              { id: "deposit", label: "Deposit" },
              { id: "withdrawal", label: "Withdrawal" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Current Balance Display */}
          <div className="flex flex-col gap-1.5 p-2.5 bg-emerald-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-600">Current {currency} Balance</span>
              <span className="text-xs font-bold text-gray-900">{currentBalance.toFixed(8)} {currency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-600">CAD Value</span>
              <span className="text-xs font-bold text-gray-900">≈ ${(currentBalance * cadRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD</span>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Currency</label>
              <select value={currency} onChange={(e) => handleCurrencyChange(e.target.value)} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-xs font-semibold text-gray-800">
                {COIN_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {activeTab === "adjust" && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Action</label>
                <select value={action} onChange={(e) => setAction(e.target.value as "Add" | "Deduct")} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-xs font-semibold text-gray-800">
                  <option value="Add">Add</option>
                  <option value="Deduct">Deduct</option>
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Amount</label>
              <input type="number" min="0" step="any" value={amount} onChange={(e) => handleCryptoChange(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-xs text-gray-800" />
            </div>

            {/* CAD Calculator Field */}
            {currency.toUpperCase() !== "CAD" && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                  Or enter amount in CAD
                  <span className="rounded-[4px] bg-[#EEF3FF] px-1.5 py-0.5 text-[10px] font-semibold text-[#047857]">
                    at live rate
                  </span>
                  {rateLoading && (
                    <span className="text-[10px] text-amber-600 font-medium">(fetching...)</span>
                  )}
                </label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={cadAmount} 
                  onChange={(e) => handleCadChange(e.target.value)} 
                  placeholder={rateLoading ? "Loading rate..." : "0.00"} 
                  disabled={rateLoading}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg text-xs text-gray-800",
                    rateLoading 
                      ? "border-gray-200 bg-gray-100 cursor-not-allowed" 
                      : "border-gray-200 bg-gray-50"
                  )} 
                />
              </div>
            )}

            {activeTab === "adjust" && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Reason / Note</label>
                <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for adjustment..." className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-xs text-gray-800 resize-none" />
              </div>
            )}

            {(activeTab === "deposit" || activeTab === "withdrawal") && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-xs text-gray-800" />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-70" style={{ background: "linear-gradient(135deg,#064e3b,#047857)" }}>
              {loading ? "Processing…" : activeTab === "adjust" ? "Adjust Balance" : activeTab === "deposit" ? "Add Deposit" : "Add Withdrawal"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Tab Content Components ─────────────────────────────────────── */

function OverviewTab({ user }: { user: any }) {
  return (
    <div className="space-y-7">
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5">
          <InfoField icon={User}     label="Full Name"     value={user.name} />
          <InfoField icon={Calendar} label="Date of Birth" value={user.dateOfBirth} />
          <InfoField icon={Mail}     label="Email Address" value={user.email} />
          <InfoField icon={Phone}    label="Phone Number"  value={user.phone} />
        </div>
      </div>
      <div className="h-px bg-gray-100" />
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4">Address Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5">
          <InfoField icon={MapPin} label="Street Address" value={user.street} />
          <InfoField icon={MapPin} label="City"           value={user.city} />
          <InfoField icon={MapPin} label="Postal Code"    value={user.postalCode} />
          <InfoField icon={Globe}  label="Country"        value={user.country} />
        </div>
      </div>
      <div className="h-px bg-gray-100" />
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5">
          <InfoField icon={Calendar}   label="Member Since"               value={user.joinedDate} />
          <InfoField icon={Activity}   label="Last Login"                 value={user.lastLogin} />
          <InfoField icon={Smartphone} label="Two-Factor Authentication"  value={user.twoFactor ? "Enabled" : "Disabled"} />
          <InfoField icon={Globe}      label="Last IP Address"            value={user.lastIp} />
        </div>
      </div>
    </div>
  );
}

function SecurityTab({ user }: { user: any }) {
  const [sessions, setSessions] = useState(user.sessions || []);
  const [revoking, setRevoking] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<string | null>(null);

  const handleRevoke = async (id: number) => {
    setRevoking(id);
    await new Promise((r) => setTimeout(r, 900));
    setSessions((prev: any) => prev.filter((s: any) => s.id !== id));
    setRevoking(null);
  };

  const handleAction = async (key: string) => {
    setActionLoading(key);
    try {
      const actionMap: Record<string, string> = { "2fa": "reset-2fa", "password": "force-password-reset" };
      await fetch(`/api/users/${user.id}/security`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionMap[key] })
      });
      setActionDone(key);
    } catch(e) {
      console.error(e);
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionDone(null), 3000);
    }
  };

  return (
    <div className="space-y-7">
      {/* Active Sessions */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4">Active Sessions</h3>
        {(!sessions || sessions.length === 0) && (
          <p className="text-sm text-gray-600 mb-4 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">Sessions will appear here once the user_sessions table tracks active logins.</p>
        )}
        <div className="space-y-3">
          {sessions.map((session: any) => {
            const Icon = Monitor; // Default since icons are not saved in db
            return (
              <motion.div
                key={session.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                      <span className="text-sm font-semibold text-gray-900">{session.device || "Unknown Device"}</span>
                      {session.current && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{session.location || "Unknown"} • {session.ip || "Unknown"}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Last active: {formatDate(session.last_active || session.created_at)}</p>
                  </div>
                </div>
                {!session.current && (
                  <button
                    onClick={() => handleRevoke(session.id)}
                    disabled={revoking === session.id}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-white hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-60 shrink-0"
                  >
                    {revoking === session.id ? (
                      <span className="h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" />
                    )}
                    Revoke
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Security Actions */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4">Security Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: "2fa",      icon: RefreshCw, title: "Reset 2FA",           desc: "Disable two-factor authentication" },
            { key: "password", icon: Lock,      title: "Force Password Reset", desc: "Require new password on login" },
          ].map((action) => {
            const Icon = action.icon;
            const isLoading = actionLoading === action.key;
            const isDone    = actionDone    === action.key;
            return (
              <button
                key={action.key}
                onClick={() => handleAction(action.key)}
                disabled={isLoading || isDone}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-left group disabled:opacity-70"
              >
                <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 transition-colors">
                  {isLoading ? (
                    <span className="h-4 w-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin" />
                  ) : isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Icon className="h-4 w-4 text-gray-600 group-hover:text-emerald-600 transition-colors" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {isDone ? "Done!" : action.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{action.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TransactionsTab({
  user,
}: {
  user: any;
}) {
  const [cadRates, setCadRates] = useState<Record<string, number> | null>(null);
  useEffect(() => { fetchLiveCADRates().then(setCadRates); }, []);

  const getCryptoValue = (cadAmount: number, currency: string) => {
    if (!cadRates) return cadAmount / 1.36;
    const sym = (currency || '').toUpperCase().trim();
    return cadAmount / (cadRates[sym] || cadRates.USDT || 1.36);
  };

  const statusStyle: Record<string, string> = {
    completed: "bg-green-50 text-green-600 border-green-200",
    pending:   "bg-amber-50 text-amber-600 border-amber-200",
    failed:    "bg-red-50   text-red-600   border-red-200",
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-bold text-gray-900">Recent Transactions</h3>
      </div>
      <div className="space-y-3">
        {(!user.transactions || user.transactions.length === 0) ? (
          <p className="text-sm text-gray-500 py-4 text-center">No transactions found.</p>
        ) : user.transactions.map((tx: any, i: number) => {
          const cadAmount = Number(tx.amount || 0);
          const cryptoVal = getCryptoValue(cadAmount, tx.currency);
          // format crypto to 6 decimals, remove trailing zeros
          const formattedCrypto = cryptoVal.toFixed(6).replace(/\.?0+$/, '');
          const formattedCad = cadAmount.toLocaleString("en-US", {style:"currency",currency:"CAD"});

          return (
            <motion.div
              key={tx.id || i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-gray-50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-sm font-bold text-gray-900">{tx.type || "Transfer"}</span>
                  <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize", statusStyle[tx.status || "completed"] || statusStyle.completed)}>
                    {tx.status || "completed"}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{tx.id || tx.transaction_id || "TXN"} • {formatDate(tx.created_at)}</p>
                <p className="text-xs text-gray-600 mt-0.5">{tx.metadata || ""}</p>
              </div>
              <div className="text-right shrink-0 ml-6">
                <p className="text-sm font-bold text-gray-900">{formattedCrypto === "" ? "0" : formattedCrypto} {tx.currency} / {formattedCad}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function SupportTab({ user }: { user: any }) {
  const router = useRouter();

  console.log(`[DEBUG] SupportTab rendered for user ID: ${user.id}`);
  console.log(`[DEBUG] SupportTab user.threads prop:`, user.threads);

  const allChats = user.threads || [];

  const statusStyle: Record<string, string> = {
    open: "bg-orange-50 text-orange-600 border-orange-200",
    waiting: "bg-amber-50 text-amber-600 border-amber-200",
    active: "bg-green-50 text-green-600 border-green-200",
    resolved: "bg-gray-100 text-gray-600 border-gray-200",
    closed: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const [deletingThread, setDeletingThread] = useState<string | null>(null);

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation permanently?")) return;
    
    setDeletingThread(threadId);
    try {
      const res = await fetch(`/api/support/tickets/${threadId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete thread");
      
      router.refresh();
    } catch (err) {
      console.error("Error deleting support thread:", err);
      alert("Failed to delete the conversation.");
    } finally {
      setDeletingThread(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4">Live Chats</h3>
        <div className="space-y-3">
          {allChats.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No active chats found.</p>
          ) : allChats.map((chat: any, i: number) => (
            <motion.div
              key={chat.id || i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => router.push(`/dashboard/live-chat?thread=${chat.id}`)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  {chat.is_ticket ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 tracking-wider">TICKET</span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 tracking-wider">LIVE CHAT</span>
                  )}
                  <span className="text-sm font-bold text-gray-900">
                    {chat.is_ticket ? `${chat.ticket_id || "Ticket"} • ${chat.category || "Other"}` : "Support Chat"}
                  </span>
                  <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize", statusStyle[chat.status?.toLowerCase() || "open"] || statusStyle.open)}>
                    {chat.status || (chat.is_ticket ? "open" : "Waiting")}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{chat.last_message_preview || "No messages"}</p>
                <p className="text-xs text-gray-500 mt-1">Last active: {formatDate(chat.last_message_at)}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={(e) => handleDeleteThread(chat.id, e)}
                  disabled={deletingThread === chat.id}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete conversation"
                >
                  {deletingThread === chat.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Edit Wallet Address Modal ─────────────────────────────────────── */
function EditWalletAddressModal({ user, onClose, onSuccess }: { user: any; onClose: () => void; onSuccess: () => void }) {
  const [crypto, setCrypto] = useState("BTC");
  const [network, setNetwork] = useState("Bitcoin Network");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCustomAddress, setIsCustomAddress] = useState(false);

  // Fetch current address when crypto/network changes
  useEffect(() => {
    const fetchCurrentAddress = async () => {
      try {
        // First check user-specific address
        const userRes = await fetch(`/api/users/${user.id}/wallet-addresses`);
        const userData = await userRes.json();
        const userAddress = userData.addresses?.find((a: any) => 
          a.crypto === crypto && a.network === network
        );
        
        if (userAddress) {
          setAddress(userAddress.address);
          setIsCustomAddress(true);
          return;
        }

        // Fall back to platform address
        const platformRes = await fetch(`/api/platform-wallets`);
        if (platformRes.ok) {
          const platformData = await platformRes.json();
          const platformWallet = Array.isArray(platformData) ? platformData.find((w: any) => w.crypto === crypto) : null;
          if (platformWallet && platformWallet.address) {
            setAddress(platformWallet.address);
            setIsCustomAddress(false);
            return;
          }
        }

        // Fall back to hardcoded addresses
        const fallbackAddresses: Record<string, string> = {
          BTC: "bc1q7q50t9edden65k94vjzqef0lx3vfjjv4klz5zy",
          ETH: "0x150B3BB98224598e20821De1A516A9fcC3bB65f9",
          USDT: network === "TRC20 (Tron)" ? "TVphkS3RjtbYV5TQAyNnc27Ae4BKFrV7QK" : "0x150B3BB98224598e20821De1A516A9fcC3bB65f9",
        };
        const fallbackAddress = fallbackAddresses[crypto];
        if (fallbackAddress) {
          setAddress(fallbackAddress);
          setIsCustomAddress(false);
          return;
        }

        // No address found
        setAddress("");
        setIsCustomAddress(false);
      } catch (err) {
        console.error("Failed to fetch current address:", err);
        setAddress("");
        setIsCustomAddress(false);
      }
    };

    fetchCurrentAddress();
  }, [user.id, crypto, network]);

  const handleSave = async () => {
    if (!address.trim()) {
      setError("Address cannot be empty.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${user.id}/wallet-addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crypto, network, address: address.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save address");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomAddress = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${user.id}/wallet-addresses?crypto=${crypto}&network=${network}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete custom address");
      }
      // Refresh to show platform default
      const platformRes = await fetch(`/api/platform-wallets`);
      if (platformRes.ok) {
        const platformData = await platformRes.json();
        const platformWallet = Array.isArray(platformData) ? platformData.find((w: any) => w.crypto === crypto) : null;
        if (platformWallet && platformWallet.address) {
          setAddress(platformWallet.address);
          setIsCustomAddress(false);
        }
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.40)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 16 }}
        transition={{ type: "spring", damping: 28, stiffness: 340 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-[17px] font-bold text-gray-900">Edit Wallet Address</h2>
              <p className="text-sm text-gray-600 mt-0.5">Set custom deposit address for this user</p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cryptocurrency</label>
              <select
                value={crypto}
                onChange={(e) => setCrypto(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Network</label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
              >
                {crypto === "BTC" && (
                  <>
                    <option value="Bitcoin Network">Bitcoin Network</option>
                  </>
                )}
                {crypto === "ETH" && (
                  <>
                    <option value="Ethereum (ERC20)">Ethereum (ERC20)</option>
                  </>
                )}
                {crypto === "USDT" && (
                  <>
                    <option value="TRC20 (Tron)">TRC20 (Tron)</option>
                    <option value="ERC20 (Ethereum)">ERC20 (Ethereum)</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Wallet Address</label>
                {isCustomAddress && (
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Custom address</span>
                )}
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                placeholder="Enter wallet address"
              />
              {error && (
                <p className="text-xs text-red-600 mt-1.5">{error}</p>
              )}
              {!isCustomAddress && address && (
                <p className="text-[10px] text-gray-500 mt-1.5">Using platform default address</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {isCustomAddress && (
              <button
                onClick={handleDeleteCustomAddress}
                disabled={loading}
                className="px-4 py-3 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                {loading ? "Deleting…" : "Reset to Default"}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-all"
              style={{ background: "linear-gradient(135deg, #064e3b, #047857)" }}
            >
              {loading ? "Saving…" : "Save Address"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Portfolio Tab ──────────────────────────────────────────────── */
function PortfolioTab({ user }: { user: any }) {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [editingWalletAddress, setEditingWalletAddress] = useState(false);
  const [userWalletAddresses, setUserWalletAddresses] = useState<any[]>([]);
  
  useEffect(() => {
    const userWallets = user.wallets || [];
    const currencySymbols = userWallets.length > 0
      ? userWallets.map((w: any) => w.currency?.toUpperCase()).filter(Boolean)
      : ["BTC", "ETH", "USDT"];
    fetchLiveCADRates(currencySymbols).then(setRates);
  }, [user.wallets]);

  useEffect(() => {
    // Fetch user-specific wallet addresses
    fetch(`/api/users/${user.id}/wallet-addresses`)
      .then(res => res.json())
      .then(data => setUserWalletAddresses(data.addresses || []))
      .catch(err => console.error("Failed to fetch user wallet addresses:", err));
  }, [user.id]);

  const userWallets = user.wallets || [];
  
  const activeCurrencies = userWallets.length > 0
    ? userWallets.map((w: any) => w.currency)
    : ["BTC", "ETH", "USDT"];

  const rawAssets = activeCurrencies.map((currency: string) => {
    const w = userWallets.find((x: any) => x.currency === currency) || { balance: 0 };
    // If CAD, use balance directly (no conversion needed)
    const isCAD = currency?.toUpperCase() === 'CAD';
    const cadValue = isCAD ? Number(w.balance) : Number(w.balance) * (rates?.[currency?.toUpperCase()] || rates?.USDT || 1.36);
    
    return {
      coin: currency,
      name: currency,
      balance: `${Number(w.balance).toLocaleString(undefined, { maximumFractionDigits: isCAD ? 2 : 8 })} ${currency}`,
      usd: `$${cadValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      rawCad: cadValue,
      color: COIN_COLORS[currency?.toUpperCase()] || "#064e3b",
    };
  });

  const totalCad = rawAssets.reduce((acc: number, a: any) => acc + a.rawCad, 0);

  const assets = rawAssets.map((a: any) => ({
    ...a,
    alloc: totalCad > 0 
      ? `${((a.rawCad / totalCad) * 100).toFixed(1)}%` 
      : `${(100 / rawAssets.length).toFixed(1)}%`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900 mb-4">Asset Allocation</h3>
        <button
          onClick={() => setEditingWalletAddress(true)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm flex items-center gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit Wallet Address
        </button>
      </div>
      <div className="h-4 w-full rounded-full bg-gray-100 flex overflow-hidden mb-5">
        {assets.map((asset: any) => (
          <div
            key={asset.coin}
            style={{ width: asset.alloc, backgroundColor: asset.color }}
            className="h-full first:rounded-l-full last:rounded-r-full"
            title={`${asset.name}: ${asset.alloc}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {assets.map((asset: any) => (
          <div key={asset.coin} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: asset.color }} />
            <span className="text-xs text-gray-600 font-medium">{asset.name} ({asset.alloc})</span>
          </div>
        ))}
      </div>

      <div className="h-px bg-gray-100" />

      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4">Balances</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assets.map((asset: any) => {
            const customAddress = userWalletAddresses.find((a: any) => a.crypto === asset.coin);
            return (
              <div key={asset.coin} className="p-4 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: asset.color }}>
                    {asset.coin.slice(0, 3)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{asset.name}</h4>
                    <p className="text-xs text-gray-600">{asset.coin}</p>
                    {customAddress && (
                      <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Custom address set</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{asset.balance}</p>
                  <p className="text-xs text-gray-600">{asset.usd}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {editingWalletAddress && (
          <EditWalletAddressModal
            user={user}
            onClose={() => setEditingWalletAddress(false)}
            onSuccess={() => {
              fetch(`/api/users/${user.id}/wallet-addresses`)
                .then(res => res.json())
                .then(data => setUserWalletAddresses(data.addresses || []))
                .catch(err => console.error("Failed to fetch user wallet addresses:", err));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Documents Tab ──────────────────────────────────────────────── */
function DocumentsTab({ user }: { user: any }) {
  const [docs, setDocs] = useState(user.documents || []);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const updateKyc = useUpdateKyc();

  const statusStyle: Record<string, string> = {
    approved: "bg-green-50 text-green-600 border-green-200",
    pending:  "bg-amber-50 text-amber-600 border-amber-200",
    rejected: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div className="space-y-6">
      <h3 className="text-base font-bold text-gray-900 mb-4">Uploaded Verification Documents</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(!docs || docs.length === 0) && (
          <p className="text-sm text-gray-500 py-4">No documents uploaded.</p>
        )}
        {docs.map((doc: any, idx: number) => {
          const type = doc.document_type || "Verification Document";
          const name = doc.file_url ? doc.file_url.split("/").pop() : "document.pdf";
          const date = formatDate(doc.created_at);
          const status = doc.status || "pending";
          
          return (
            <div key={doc.id || idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-gray-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{type}</h4>
                  <p className="text-xs text-gray-600">{name} • {date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize", statusStyle[status] || statusStyle.pending)}>
                  {status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending"}
                </span>
                <button
                  onClick={() => setSelectedDoc({ ...doc, _type: type, _name: name, _date: date })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{selectedDoc._type}</h3>
                  <p className="text-xs text-gray-600">{selectedDoc._name}</p>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
              <div className="p-8 bg-gray-50 flex flex-col items-center justify-center min-h-[200px] border-b border-gray-100">
                <FileText className="h-16 w-16 text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-600">Verification Document Scan</p>
                <p className="text-xs text-gray-600 mt-1">Uploaded securely on {selectedDoc._date}</p>
              </div>
              <div className="p-4 bg-gray-50/50 flex justify-end gap-3">
                <button
                  onClick={async () => {
                    await updateKyc.mutateAsync({ userId: user.id, status: "rejected", rejectionReason: "Rejected by admin" });
                    setDocs((prev: any) => prev.map((d: any) => d.id === selectedDoc.id ? { ...d, status: "rejected" } : d));
                    setSelectedDoc(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-red-600 hover:bg-red-50/50 transition-colors"
                >
                  Reject Document
                </button>
                <button
                  onClick={async () => {
                    await updateKyc.mutateAsync({ userId: user.id, status: "approved" });
                    setDocs((prev: any) => prev.map((d: any) => d.id === selectedDoc.id ? { ...d, status: "approved" } : d));
                    setSelectedDoc(null);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Approve Document
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Audit Logs Tab ─────────────────────────────────────────────── */
function AuditLogsTab({ user }: { user: any }) {
  const actionBadgeStyle: Record<string, string> = {
    ACCOUNT_FROZEN: "bg-red-50 text-red-600 border-red-200",
    ACCOUNT_UNFROZEN: "bg-green-50 text-green-600 border-green-200",
    BALANCE_ADJUSTED: "bg-emerald-50 text-emerald-600 border-emerald-200",
    DEPOSIT_ADDED: "bg-green-50 text-green-600 border-green-200",
    WITHDRAWAL_ADDED: "bg-orange-50 text-orange-600 border-orange-200",
    KYC_UPDATED: "bg-purple-50 text-purple-600 border-purple-200",
    NOTIFICATION_SENT: "bg-gray-50 text-gray-600 border-gray-200",
  };

  const formatDetails = (details: any) => {
    if (!details) return "";
    if (typeof details === "string") return details;
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

  return (
    <div>
      <h3 className="text-base font-bold text-gray-900 mb-4">Audit Logs</h3>
      <div className="space-y-3">
        {(!user.audit_logs || user.audit_logs.length === 0) ? (
          <p className="text-sm text-gray-500 py-4 text-center">No audit logs found.</p>
        ) : user.audit_logs.map((log: any, i: number) => (
          <motion.div
            key={log.id || i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize", actionBadgeStyle[log.action] || actionBadgeStyle.NOTIFICATION_SENT)}>
                  {log.action.replace(/_/g, " ").toLowerCase()}
                </span>
              </div>
              <p className="text-xs text-gray-600">{formatDate(log.created_at)}</p>
              <p className="text-xs text-gray-600 mt-0.5">{formatDetails(log.details)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function UserDetailPage() {
  return (
    <RequirePermission permission="view-users">
      <UserDetailPageContent />
    </RequirePermission>
  );
}

function UserDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const queryClient = useQueryClient();
  const { data: rawUserData, isLoading: loading } = useUserDetail(userId);
  const updateUserAccount = useUpdateUserAccount();
  const addUserNote = useAddUserNote();
  const [cadRates, setCadRates] = useState<Awaited<ReturnType<typeof fetchLiveCADRates>> | null>(null);

  useEffect(() => {
    fetchLiveCADRates().then(setCadRates);
  }, []);

  const user = useMemo(() => {
    if (!rawUserData || !cadRates) return null;
    const data = rawUserData as any;
    const formattedUser = {
      id: userId,
      name: data.profile?.full_name || data.auth?.user_metadata?.full_name || "Unknown User",
      email: data.auth?.email,
      phone: data.profile?.phone || data.auth?.phone || "N/A",
      dateOfBirth: data.kyc?.date_of_birth,
      street: data.kyc?.street_address,
      city: data.kyc?.city,
      postalCode: data.kyc?.postal_code,
      country: data.kyc?.country,
      joinedDate: formatDate(data.auth?.created_at || new Date().toISOString()),
      lastLogin: data.auth?.last_sign_in_at ? formatDate(data.auth.last_sign_in_at) : "N/A",
      twoFactor: data.profile?.two_factor_enabled || false,
      lastIp: data.profile?.last_ip || "N/A",
      wallets: data.wallets || [],
      transactions: data.transactions || [],
      sessions: data.sessions || [],
      documents: data.kycDocuments || [],
      tickets: data.tickets || [],
      threads: data.threads || [],
      security_logs: data.securityLogs || [],
      notes: data.notes || [],
      audit_logs: data.auditLogs || [],
      account: data.profile?.is_frozen ? "Frozen" : "Active",
      risk: data.profile?.risk_level || "Low Risk",
      kyc: data.kyc?.status === "approved" ? "Verified" : data.kyc?.status === "rejected" ? "Rejected" : data.kyc?.status === "pending" ? "Pending" : "Not Started",
      balance: data.balance || 0,
    };

    return formattedUser;
  }, [rawUserData, cadRates, userId]);

  const [activeTab, setActiveTab]         = useState("overview");
  const [isFrozen, setIsFrozen]           = useState(false);
  useEffect(() => {
    if (rawUserData) {
      const data = rawUserData as { profile?: { is_frozen?: boolean } };
      setIsFrozen(data.profile?.is_frozen === true);
    }
  }, [rawUserData]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("admin-profile-freeze")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          setIsFrozen(!!(payload.new as { is_frozen?: boolean }).is_frozen);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const [showFreezeModal, setShowFreeze]  = useState(false);
  const [showNoteModal, setShowNote]      = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showManageBalanceModal, setShowManageBalanceModal] = useState(false);
  const [noteSaved, setNoteSaved]         = useState(false);
  const [actionToast, setActionToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const refreshUser = () => {
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(userId) });
  };

  const showToast = (type: "success" | "error", message: string) => {
    setActionToast({ type, message });
    setTimeout(() => setActionToast(null), 3000);
  };

  if (loading || (rawUserData && !cadRates)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <span className="h-8 w-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></span>
        <p className="text-sm text-gray-600">Loading user profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <User className="h-12 w-12 text-gray-300" />
        <h2 className="text-lg font-bold text-gray-700">User not found</h2>
        <p className="text-sm text-gray-600">The user ID &quot;{userId}&quot; does not exist in the database.</p>
        <button onClick={() => router.push("/dashboard/users")}
          className="mt-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#064e3b,#047857)" }}>
          Back to Users
        </button>
      </div>
    );
  }

  const currentAccount: AccountStatus = isFrozen ? "Frozen" : "Active";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-5"
      >
        {/* ── Header */}
        <div className="flex items-start gap-4 flex-wrap">
          <button onClick={() => router.push("/dashboard/users")}
            className="mt-1 h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors shrink-0 shadow-sm">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-bold text-gray-900 truncate">{user.name}</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              User ID: <span className="font-medium text-gray-700">{user.id}</span> • Member since {user.joinedDate}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button onClick={() => setShowNote(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <FileEdit className="h-4 w-4" /> Add Note
            </button>
            <button onClick={() => setShowManageBalanceModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <DollarSign className="h-4 w-4" /> Manage Balance
            </button>
            <button onClick={() => alert("Exporting…")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <Download className="h-4 w-4" /> Export
            </button>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={async () => {
                if (isFrozen) {
                  await updateUserAccount.mutateAsync({ userId: user.id, action: "unfreeze" });
                  setIsFrozen(false);
                  queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(user.id) });
                } else {
                  setShowFreeze(true);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm transition-all"
              style={{ background: isFrozen ? "#22C55E" : "#EF4444" }}>
              {isFrozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {isFrozen ? "Unfreeze Account" : "Freeze Account"}
            </motion.button>
          </div>
        </div>

        {/* ── 4 Info Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Total Balance",  content: <p className="text-xl font-bold text-gray-900">${(user.balance || 0).toLocaleString("en-US",{minimumFractionDigits:2})}</p>, icon: Wallet,        iconBg: "bg-emerald-50",  iconColor: "text-emerald-600" },
            { label: "KYC Status",     content: <KycBadge status={user.kyc as KycStatus} />,          icon: CheckCircle2,  iconBg: "bg-green-50", iconColor: "text-green-500" },
            { label: "Account Status", content: <AccountBadge status={currentAccount} />, icon: Shield,        iconBg: "bg-emerald-50",  iconColor: "text-emerald-500" },
            { label: "Risk Level",     content: <RiskBadge level={user.risk} />,          icon: AlertTriangle, iconBg: "bg-amber-50", iconColor: "text-amber-500" },
          ].map(({ label, content, icon: Icon, iconBg, iconColor }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-2">{label}</p>
                {content}
              </div>
              <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
                <Icon className={cn("h-5 w-5", iconColor)} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs + Content */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center border-b border-gray-100 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn("flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors relative shrink-0",
                    isActive ? "text-emerald-700" : "text-gray-600 hover:text-gray-700 hover:bg-gray-50")}>
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {isActive && (
                    <motion.div layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                {activeTab === "overview"      && (
                  <>
                    <OverviewTab user={user} />
                    {user.notes && user.notes.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-gray-100">
                        <h3 className="text-base font-bold text-gray-900 mb-4">Admin Notes</h3>
                        <div className="space-y-3">
                          {user.notes.map((n:any) => (
                            <div key={n.id} className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                              <p className="text-sm text-gray-800">{n.note}</p>
                              <p className="text-xs text-gray-500 mt-2">Added by {n.created_by} on {formatDate(n.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {activeTab === "portfolio"     && <PortfolioTab user={user} />}
                {activeTab === "transactions"  && <TransactionsTab user={user} />}
                {activeTab === "security"      && <SecurityTab user={user} />}
                {activeTab === "documents"     && <DocumentsTab user={user} />}
                {activeTab === "support"       && <SupportTab user={user} />}
                {activeTab === "audit-logs"    && <AuditLogsTab user={user} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showFreezeModal && <FreezeModal onClose={() => setShowFreeze(false)} onConfirm={async (reason) => {
          await updateUserAccount.mutateAsync({ userId: user.id, action: "freeze", reason });
          setIsFrozen(true);
          setShowFreeze(false);
          queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(user.id) });
        }} />}
      </AnimatePresence>
      <AnimatePresence>
        {showNoteModal && <NoteModal onClose={() => setShowNote(false)} onConfirm={async (note) => {
          await addUserNote.mutateAsync({ userId: user.id, note });
          setShowNote(false); setNoteSaved(true); setTimeout(() => setNoteSaved(false), 3000);
        }} />}
      </AnimatePresence>
      <AnimatePresence>
        {showTransactionModal && (
          <AddTransactionModal
            user={{ id: user.id, name: user.name, email: user.email }}
            onClose={() => setShowTransactionModal(false)}
            onSuccess={() => {
              showToast("success", "Transaction added successfully.");
              refreshUser();
            }}
            onError={(message) => showToast("error", message)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showManageBalanceModal && (
          <ManageBalanceModal
            user={{ id: user.id, name: user.name, email: user.email }}
            onClose={() => setShowManageBalanceModal(false)}
            onSuccess={() => {
              showToast("success", "Balance updated successfully.");
              refreshUser();
            }}
            onError={(message) => showToast("error", message)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {actionToast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={cn(
              "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 text-sm font-medium rounded-xl shadow-xl",
              actionToast.type === "success" ? "bg-gray-900 text-white" : "bg-red-600 text-white"
            )}>
            {actionToast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 text-white" />
            )}
            {actionToast.message}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {noteSaved && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-xl">
            <CheckCircle2 className="h-4 w-4 text-green-400" /> Note saved successfully.
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
