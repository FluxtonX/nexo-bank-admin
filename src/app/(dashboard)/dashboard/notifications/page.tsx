"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Send,
  Check,
  Plus,
  Clock,
  SendHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType = "Info" | "Warning" | "Success" | "Error";
type TargetAudience = "All" | "Verified" | "Unverified" | "High Value";

type UserOption = { id: string; name: string; email: string };

type PlatformNotification = {
  id: string;
  realId?: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  audienceCount: number;
  audienceLabel: string;
};

const BRAND_GRADIENT = "linear-gradient(135deg, #0A3D91 0%, #1650AB 100%)";

const AUDIENCE_COUNTS: Record<TargetAudience, number> = {
  All: 12458,
  Verified: 10234,
  Unverified: 2224,
  "High Value": 543,
};

const INITIAL_NOTIFICATIONS: PlatformNotification[] = [
  {
    id: "NOT-1002",
    type: "Warning",
    title: "Platform Maintenance",
    message: "Scheduled maintenance on June 5th from 2-4 AM EST. Some trading features may be temporarily offline.",
    timestamp: "2026-06-01, 10:00:00 a.m.",
    audienceCount: 12458,
    audienceLabel: "Sent to 12,458 users",
  },
  {
    id: "NOT-1001",
    type: "Success",
    title: "New Feature: Buy/Sell",
    message: "You can now buy and sell crypto directly from your dashboard using linked bank accounts and Interac e-Transfers.",
    timestamp: "2026-05-30, 2:30:00 p.m.",
    audienceCount: 10234,
    audienceLabel: "Sent to 10,234 users",
  },
];

function normalizeNotificationType(type: string): NotificationType {
  const normalized = type.trim().toLowerCase();
  if (normalized === "warning") return "Warning";
  if (normalized === "success") return "Success";
  if (normalized === "error") return "Error";
  return "Info";
}

function TypeBadge({ type }: { type: NotificationType }) {
  const map: Record<NotificationType, { cls: string; icon: React.ReactNode }> = {
    Info: { cls: "bg-blue-50 text-blue-750 border-blue-200", icon: <Info className="h-3 w-3" /> },
    Warning: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <AlertTriangle className="h-3 w-3" /> },
    Success: { cls: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="h-3 w-3" /> },
    Error: { cls: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" /> },
  };
  const style = map[type] ?? map.Info;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase font-mono tracking-wider", style.cls)}>
      {style.icon}
      {type}
    </span>
  );
}

export default function NotificationCenterPage() {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  /* Form state */
  const [type, setType] = useState<NotificationType>("Info");
  const [audience, setAudience] = useState<TargetAudience>("All");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [totalUsers, setTotalUsers] = useState(0);
  const [verifiedUsers, setVerifiedUsers] = useState(0);
  const [unverifiedUsers, setUnverifiedUsers] = useState(0);
  const [highValueUsers, setHighValueUsers] = useState(0);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const audienceCounts: Record<TargetAudience, number> = useMemo(() => ({
    All: totalUsers,
    Verified: verifiedUsers,
    Unverified: unverifiedUsers,
    "High Value": highValueUsers,
  }), [totalUsers, verifiedUsers, unverifiedUsers, highValueUsers]);

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

        const list: PlatformNotification[] = (data.notifications || []).map((n: any) => {
          const audienceType = n.audience as TargetAudience;
          let count = data.stats?.totalUsers || 0;
          if (audienceType === "Verified") count = data.stats?.verifiedUsers || 0;
          else if (audienceType === "Unverified") count = data.stats?.unverifiedUsers || 0;
          else if (audienceType === "High Value") count = data.stats?.highValueUsers || 0;

          return {
            id: `NOT-${n.id.slice(0, 5).toUpperCase()}`,
            realId: n.id,
            type: normalizeNotificationType(n.type ?? "Info"),
            title: n.title,
            message: n.message,
            timestamp: new Date(n.created_at).toLocaleString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            }).replace(",", ""),
            audienceCount: count,
            audienceLabel: `Sent to ${audienceType || "All"} Users (${count.toLocaleString()})`,
          };
        });
        
        setNotifications(list);
      }

      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUserOptions(
          (usersData.users || []).map((u: { id: string; name: string; email: string }) => ({
            id: u.id,
            name: u.name,
            email: u.email,
          }))
        );
      }
    } catch (e) {
      console.error("Error loading announcements:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = [
    {
      label: "Total Users",
      value: totalUsers.toLocaleString(),
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0A3D91]">
          <Users className="h-5.5 w-5.5" />
        </div>
      ),
    },
    {
      label: "Verified",
      value: verifiedUsers.toLocaleString(),
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
          <CheckCircle2 className="h-5.5 w-5.5" />
        </div>
      ),
    },
    {
      label: "Unverified",
      value: unverifiedUsers.toLocaleString(),
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertTriangle className="h-5.5 w-5.5" />
        </div>
      ),
    },
    {
      label: "High Value",
      value: highValueUsers.toLocaleString(),
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Bell className="h-5.5 w-5.5" />
        </div>
      ),
    },
  ];

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setToast("Error: Title and Message cannot be empty");
      window.setTimeout(() => setToast(null), 2500);
      return;
    }

    try {
      const payload: {
        type: NotificationType;
        title: string;
        message: string;
        audience: TargetAudience;
        userId?: string;
      } = {
        type,
        title,
        message,
        audience,
      };

      if (selectedUserId) {
        payload.userId = selectedUserId;
        payload.audience = "All";
      }

      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to send notification");
      }

      setToast(`Notification successfully dispatched to ${selectedUserId ? "selected user" : `${audience} Users`} ✓`);
      window.setTimeout(() => setToast(null), 2500);
      
      setTitle("");
      setMessage("");
      setType("Info");
      setAudience("All");
      setSelectedUserId("");
      
      loadData();
    } catch (err: any) {
      console.error(err);
      setToast(`Error: ${err.message || "Failed to send notification"}`);
      window.setTimeout(() => setToast(null), 2500);
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
            <h1 className="text-[26px] font-bold leading-tight text-gray-900 sm:text-[30px]">Notifications Center</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Send platform-wide notifications to users</p>
          </div>
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
              {toast.startsWith("Error") ? (
                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
              ) : (
                <Check className="h-4 w-4 text-green-400 shrink-0" />
              )}
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Counter cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex min-h-[110px] items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold leading-none text-gray-900">{stat.value}</p>
              </div>
              {stat.icon}
            </div>
          ))}
        </div>

        {/* Main section Split */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Send New Notification Form */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">Send New Notification</h3>
                <p className="text-xs text-gray-600 mt-1">Configure and broadcast system announcements</p>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-4">
                {/* Notification Type pills */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block">Notification Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["Info", "Warning", "Success", "Error"] as NotificationType[]).map((t) => {
                      const active = type === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={cn(
                            "flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm",
                            active
                              ? "bg-blue-50 text-[#0A3D91] border-blue-300"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          )}
                        >
                          <span className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            t === "Info" ? "bg-blue-500" :
                            t === "Warning" ? "bg-amber-500" :
                            t === "Success" ? "bg-green-500" : "bg-red-500"
                          )} />
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Audience dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block">Target Audience</label>
                  <select
                    value={selectedUserId ? `user:${selectedUserId}` : audience}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.startsWith("user:")) {
                        setSelectedUserId(value.replace("user:", ""));
                        setAudience("All");
                      } else {
                        setSelectedUserId("");
                        setAudience(value as TargetAudience);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 text-gray-800 transition-all cursor-pointer"
                  >
                    <option value="All">All Users ({audienceCounts.All.toLocaleString()})</option>
                    {userOptions.map((user) => (
                      <option key={user.id} value={`user:${user.id}`}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                    <option value="Verified">Verified Users ({audienceCounts.Verified.toLocaleString()})</option>
                    <option value="Unverified">Unverified Users ({audienceCounts.Unverified.toLocaleString()})</option>
                    <option value="High Value">High Value Users ({audienceCounts["High Value"].toLocaleString()})</option>
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block">Notification Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter announcement headline..."
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 text-gray-800 transition-all placeholder:text-gray-500"
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
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-sm font-medium outline-none resize-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 text-gray-800 transition-all placeholder:text-gray-500"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] cursor-pointer"
                  style={{ background: BRAND_GRADIENT }}
                >
                  <SendHorizontal className="h-4.5 w-4.5" />
                  Send to {selectedUserId ? "1 User" : `${audienceCounts[audience].toLocaleString()} Users`}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Recent Notifications List */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[460px]">
            <div className="space-y-5 flex-1 flex flex-col">
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">Recent Announcements</h3>
                <p className="text-xs text-gray-600 mt-1">Audit log of announcements sent during this session</p>
              </div>

              {loading ? (
                <div className="flex-1 space-y-4 py-6">
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <div key={idx} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
                  ))}
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
                        <p className="text-xs font-semibold text-gray-600 leading-relaxed">{notif.message}</p>
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
        </div>
      </motion.div>
    </>
  );
}
