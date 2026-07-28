"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Check,
  Clock,
  SendHorizontal,
  Search,
  Mail,
  LayoutDashboard,
  X,
  UserCheck,
  ChevronDown,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type NotificationType = "Info" | "Warning" | "Success" | "Error";

type UserOption = {
  id: string;
  name: string;
  email: string;
  kyc: "Verified" | "Unverified";
};

type PlatformNotification = {
  id: string;
  realId?: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  audienceLabel: string;
};

// Nexo brand gradient (emerald/green)
const BRAND_GRADIENT = "linear-gradient(135deg, #064e3b 0%, #047857 100%)";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function normalizeNotificationType(type: string): NotificationType {
  const n = type.trim().toLowerCase();
  if (n === "warning") return "Warning";
  if (n === "success") return "Success";
  if (n === "error") return "Error";
  return "Info";
}

function TypeBadge({ type }: { type: NotificationType }) {
  const map: Record<NotificationType, { cls: string; icon: React.ReactNode }> = {
    Info: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <Info className="h-3 w-3" /> },
    Warning: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <AlertTriangle className="h-3 w-3" /> },
    Success: { cls: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="h-3 w-3" /> },
    Error: { cls: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" /> },
  };
  const s = map[type] ?? map.Info;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase font-mono tracking-wider", s.cls)}>
      {s.icon}{type}
    </span>
  );
}

/* ─── User Picker Modal ──────────────────────────────────────────────────── */
type FilterTab = "All" | "Verified" | "Unverified";

interface UserPickerModalProps {
  open: boolean;
  userOptions: UserOption[];
  usersLoading: boolean;
  initialSelected: Set<string>;
  onConfirm: (selected: Set<string>) => void;
  onClose: () => void;
}

function UserPickerModal({
  open,
  userOptions,
  usersLoading,
  initialSelected,
  onConfirm,
  onClose,
}: UserPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelected));
  const searchRef = useRef<HTMLInputElement>(null);

  /* Sync initialSelected when modal reopens */
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setFilterTab("All");
      setSelectedIds(new Set(initialSelected));
      setTimeout(() => searchRef.current?.focus(), 120);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Filter by tab, then search */
  const tabFiltered = useMemo(() => {
    if (filterTab === "All") return userOptions;
    return userOptions.filter((u) => u.kyc === filterTab);
  }, [userOptions, filterTab]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return tabFiltered;
    return tabFiltered.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [tabFiltered, searchQuery]);

  const allFilteredSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.has(u.id));

  const toggleUser = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredUsers.forEach((u) => next.delete(u.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredUsers.forEach((u) => next.add(u.id));
        return next;
      });
    }
  };

  const handleClear = () => setSelectedIds(new Set());
  const selectedCount = selectedIds.size;

  const tabCounts: Record<FilterTab, number> = useMemo(() => ({
    All: userOptions.length,
    Verified: userOptions.filter((u) => u.kyc === "Verified").length,
    Unverified: userOptions.filter((u) => u.kyc === "Unverified").length,
  }), [userOptions]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="modal-panel"
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Select Recipients</h2>
                <p className="text-xs text-gray-500 mt-0.5">Choose which users to notify</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── Filter Tabs ── */}
          <div className="px-6 pt-4 pb-0">
            <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
              {(["All", "Verified", "Unverified"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    filterTab === tab
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {tab === "Verified" && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                  {tab === "Unverified" && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
                  {tab === "All" && <Users className="h-3 w-3 shrink-0" />}
                  {tab}
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-black tabular-nums",
                    filterTab === tab ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"
                  )}>
                    {tabCounts[tab]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Search ── */}
          <div className="px-6 pt-3">
            <label className="flex items-center gap-2.5 h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-50 transition-all">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>
          </div>

          {/* ── Controls row ── */}
          <div className="flex items-center justify-between px-6 pt-2.5 pb-1">
            <span className="text-xs font-semibold text-gray-500">
              {usersLoading ? "Loading…" : `${filteredUsers.length} user${filteredUsers.length !== 1 ? "s" : ""} shown`}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                disabled={filteredUsers.length === 0}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {allFilteredSelected ? "Deselect All" : "Select All"}
              </button>
              <span className="text-gray-300 text-xs">|</span>
              <button
                onClick={handleClear}
                disabled={selectedCount === 0}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* ── User List ── */}
          <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-1.5 min-h-[160px]">
            {usersLoading ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-10 text-center">
                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-400">No users found</p>
                <p className="text-xs text-gray-400 mt-0.5">Try a different search term or tab</p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const checked = selectedIds.has(user.id);
                return (
                  <label
                    key={user.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-2.5 cursor-pointer transition-all select-none",
                      checked
                        ? "border-emerald-300 bg-emerald-50/60"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUser(user.id)}
                      className="h-4 w-4 rounded border-gray-300 accent-emerald-700 shrink-0 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-semibold truncate", checked ? "text-emerald-700" : "text-gray-900")}>
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <span className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide",
                      user.kyc === "Verified"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    )}>
                      {user.kyc}
                    </span>
                    {checked && <Check className="h-3.5 w-3.5 text-emerald-700 shrink-0" />}
                  </label>
                );
              })
            )}
          </div>

          {/* ── Footer: count + Confirm ── */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-[11px] font-black transition-all",
                selectedCount > 0 ? "bg-emerald-700 text-white" : "bg-gray-200 text-gray-500"
              )}>
                {selectedCount}
              </div>
              <span className="text-xs font-semibold text-gray-600">
                {selectedCount === 0 ? "No users selected" : `user${selectedCount !== 1 ? "s" : ""} selected`}
              </span>
            </div>
            <button
              onClick={() => onConfirm(selectedIds)}
              disabled={selectedCount === 0}
              className={cn(
                "flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer",
                selectedCount > 0
                  ? "shadow-md hover:opacity-90 active:scale-[0.98]"
                  : "opacity-40 cursor-not-allowed"
              )}
              style={{ background: BRAND_GRADIENT }}
            >
              <Check className="h-4 w-4" />
              Confirm Selection
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function NotificationCenterPage() {
  /* ── Notification list state ── */
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  /* ── Form state ── */
  const [type, setType] = useState<NotificationType>("Info");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  /* ── Stats ── */
  const [totalUsers, setTotalUsers] = useState(0);
  const [verifiedUsers, setVerifiedUsers] = useState(0);
  const [unverifiedUsers, setUnverifiedUsers] = useState(0);
  const [highValueUsers, setHighValueUsers] = useState(0);

  /* ── Specific-user picker state ── */
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  /* ── Sending state ── */
  const [sending, setSending] = useState<"email" | "dashboard" | "both" | null>(null);

  /* ── Toast helper ── */
  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  /* ── Load notifications + stats ── */
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setTotalUsers(data.stats.totalUsers);
          setVerifiedUsers(data.stats.verifiedUsers);
          setUnverifiedUsers(data.stats.unverifiedUsers);
          setHighValueUsers(data.stats.highValueUsers);
        }
        const list: PlatformNotification[] = (data.notifications || []).map((n: any) => ({
          id: `NOT-${n.id.slice(0, 5).toUpperCase()}`,
          realId: n.id,
          type: normalizeNotificationType(n.type ?? "Info"),
          title: n.title,
          message: n.message,
          timestamp: new Date(n.created_at).toLocaleString("en-US", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
          }).replace(",", ""),
          audienceLabel: n.user_id
            ? "Sent to specific users"
            : `Sent to ${n.audience || "All"} Users`,
        }));
        setNotifications(list);
      }
    } catch (e) {
      console.error("Error loading notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  /* ── Load all users for picker (dedicated lightweight endpoint) ── */
  const loadPickerUsers = async () => {
    if (userOptions.length > 0) return; // already loaded
    setUsersLoading(true);
    try {
      const res = await fetch("/api/notifications/users");
      if (res.ok) {
        const data = await res.json();
        setUserOptions(data.users ?? []);
      }
    } catch (e) {
      console.error("Error loading users for picker:", e);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  /* ── Open picker ── */
  const openPicker = () => {
    loadPickerUsers();
    setPickerOpen(true);
  };

  /* ── Confirm selection from modal ── */
  const handleConfirm = (ids: Set<string>) => {
    setConfirmedIds(ids);
    setPickerOpen(false);
  };

  const confirmedCount = confirmedIds.size;

  /* ── Selected user name preview labels ── */
  const selectedLabels = useMemo(() => {
    if (confirmedCount === 0) return null;
    const preview = Array.from(confirmedIds)
      .slice(0, 3)
      .map((id) => userOptions.find((u) => u.id === id)?.name ?? id)
      .join(", ");
    return confirmedCount > 3 ? `${preview} +${confirmedCount - 3} more` : preview;
  }, [confirmedIds, userOptions, confirmedCount]);

  /* ── Validate before send ── */
  const validate = () => {
    if (!title.trim()) { showToast("Error: Notification Title cannot be empty."); return false; }
    if (!message.trim()) { showToast("Error: Announcement Message cannot be empty."); return false; }
    if (confirmedCount === 0) { showToast("Error: Please select at least one user first."); return false; }
    return true;
  };

  /* ── Send specific ── */
  const doSend = async (method: "email" | "dashboard" | "both") => {
    if (!validate()) return;
    setSending(method);

    const send = async (deliveryMethod: "email" | "dashboard") => {
      const res = await fetch("/api/notifications/send-specific", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, title, message,
          userIds: Array.from(confirmedIds),
          deliveryMethod,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to send via ${deliveryMethod}`);
      }
      return res.json();
    };

    try {
      if (method === "both") {
        await Promise.all([send("email"), send("dashboard")]);
        showToast(`Email + Dashboard notification sent to ${confirmedCount} user${confirmedCount !== 1 ? "s" : ""} ✓`);
      } else {
        await send(method);
        const label = method === "email" ? "Email" : "Dashboard";
        showToast(`${label} notification sent to ${confirmedCount} user${confirmedCount !== 1 ? "s" : ""} ✓`);
      }
      /* Reset form */
      setTitle(""); setMessage(""); setType("Info"); setConfirmedIds(new Set());
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSending(null);
    }
  };

  /* ── Stats cards ── */
  const stats = [
    { label: "Total Users", value: totalUsers.toLocaleString(), icon: <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Users className="h-5 w-5" /></div> },
    { label: "Verified", value: verifiedUsers.toLocaleString(), icon: <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600"><CheckCircle2 className="h-5 w-5" /></div> },
    { label: "Unverified", value: unverifiedUsers.toLocaleString(), icon: <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><AlertTriangle className="h-5 w-5" /></div> },
    { label: "High Value", value: highValueUsers.toLocaleString(), icon: <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><Bell className="h-5 w-5" /></div> },
  ];

  const spinnerCls = "h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin";

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
            <h1 className="text-[26px] font-bold leading-tight text-gray-900 sm:text-[30px]">Notifications Center</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Send targeted notifications to specific users</p>
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-gray-800"
            >
              {toast.startsWith("Error") ? <XCircle className="h-4 w-4 text-red-400 shrink-0" /> : <Check className="h-4 w-4 text-green-400 shrink-0" />}
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex min-h-[110px] items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">{s.label}</p>
                <p className="text-2xl font-bold leading-none text-gray-900">{s.value}</p>
              </div>
              {s.icon}
            </div>
          ))}
        </div>

        {/* Main 2-col grid */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* ── LEFT: Compose Form ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">Send New Notification</h3>
              <p className="text-xs text-gray-600 mt-1">Configure and send to specific recipients</p>
            </div>

            {/* Notification Type pills */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block">Notification Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["Info", "Warning", "Success", "Error"] as NotificationType[]).map((t) => {
                  const active = type === t;
                  return (
                    <button
                      key={t} type="button" onClick={() => setType(t)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm",
                        active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        t === "Info" ? "bg-emerald-500" :
                        t === "Warning" ? "bg-amber-500" :
                        t === "Success" ? "bg-green-500" : "bg-red-500"
                      )} />
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Audience — button that opens picker */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block">Target Audience</label>

              <button
                type="button"
                onClick={openPicker}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer",
                  confirmedCount > 0
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-emerald-400 hover:bg-emerald-50/40 hover:text-emerald-700"
                )}
              >
                <span className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 shrink-0" />
                  {confirmedCount > 0 ? `${confirmedCount} user${confirmedCount !== 1 ? "s" : ""} selected` : "Select Specific Users"}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
              </button>

              {/* Selected user name pills preview */}
              {selectedLabels && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-gray-500 font-medium px-1 truncate"
                >
                  {selectedLabels}
                </motion.p>
              )}

              {/* Clear selection */}
              {confirmedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmedIds(new Set())}
                  className="text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                >
                  ✕ Clear selection
                </button>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block">Notification Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement headline..."
                className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-50 text-gray-800 transition-all placeholder:text-gray-500"
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block">Announcement Message</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter broadcast message body..."
                className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-sm font-medium outline-none resize-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-50 text-gray-800 transition-all placeholder:text-gray-500"
              />
            </div>

            {/* ── Three send buttons ── */}
            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block">Send Notification</label>
              <div className="grid grid-cols-3 gap-2">
                {/* Send Email */}
                <button
                  type="button"
                  onClick={() => doSend("email")}
                  disabled={sending !== null || confirmedCount === 0}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer",
                    confirmedCount > 0 && !sending
                      ? "border-emerald-600 text-emerald-700 bg-white hover:bg-emerald-50 active:scale-[0.98]"
                      : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
                  )}
                >
                  {sending === "email"
                    ? <span className={spinnerCls} />
                    : <Mail className="h-4 w-4" />}
                  {sending === "email" ? "Sending…" : "Send Email"}
                </button>

                {/* Send to Dashboard */}
                <button
                  type="button"
                  onClick={() => doSend("dashboard")}
                  disabled={sending !== null || confirmedCount === 0}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer",
                    confirmedCount > 0 && !sending
                      ? "shadow-md hover:opacity-90 active:scale-[0.98]"
                      : "opacity-40 cursor-not-allowed"
                  )}
                  style={{ background: BRAND_GRADIENT }}
                >
                  {sending === "dashboard"
                    ? <span className={cn(spinnerCls, "border-white")} />
                    : <LayoutDashboard className="h-4 w-4" />}
                  {sending === "dashboard" ? "Sending…" : "Dashboard"}
                </button>

                {/* Send to Both */}
                <button
                  type="button"
                  onClick={() => doSend("both")}
                  disabled={sending !== null || confirmedCount === 0}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer",
                    confirmedCount > 0 && !sending
                      ? "border-teal-400 text-teal-700 bg-teal-50 hover:bg-teal-100 active:scale-[0.98]"
                      : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
                  )}
                >
                  {sending === "both"
                    ? <span className={cn(spinnerCls, "border-teal-500")} />
                    : <Layers className="h-4 w-4" />}
                  {sending === "both" ? "Sending…" : "Send Both"}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center pt-0.5">
                <strong>Email</strong> → Brevo · <strong>Dashboard</strong> → In-app · <strong>Both</strong> → Email + In-app
              </p>
            </div>
          </div>

          {/* ── RIGHT: Recent Notifications ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col min-h-[460px]">
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-900">Recent Announcements</h3>
              <p className="text-xs text-gray-600 mt-1">Audit log of announcements sent during this session</p>
            </div>

            {loading ? (
              <div className="flex-1 space-y-4 py-6">
                {Array.from({ length: 2 }).map((_, idx) => (
                  <div key={idx} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <Bell className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm font-semibold text-gray-400">No notifications sent yet</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[440px] pr-1 no-scrollbar">
                {notifications.map((notif) => (
                  <div key={notif.id} className="border border-gray-150 bg-white rounded-2xl p-4.5 space-y-3 shadow-sm hover:border-gray-300 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <TypeBadge type={notif.type} />
                        <span className="font-extrabold text-gray-950 font-mono text-xs">{notif.id}</span>
                      </div>
                      <span className="text-[10px] text-gray-600 font-semibold flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" />
                        {notif.timestamp}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-gray-900 leading-snug">{notif.title}</h4>
                      <p className="text-xs font-semibold text-gray-600 leading-relaxed line-clamp-2">{notif.message}</p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                      {notif.audienceLabel}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* User Picker Modal */}
      <UserPickerModal
        open={pickerOpen}
        userOptions={userOptions}
        usersLoading={usersLoading}
        initialSelected={confirmedIds}
        onConfirm={handleConfirm}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
