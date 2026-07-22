"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Check,
  Clock,
  CheckSquare,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
};

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    Info: { cls: "bg-blue-50 text-blue-750 border-blue-200", icon: <Info className="h-3 w-3" /> },
    Warning: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <AlertTriangle className="h-3 w-3" /> },
    Success: { cls: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="h-3 w-3" /> },
    Error: { cls: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" /> },
  };
  const style = map[type] || map.Info;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase font-mono tracking-wider", style.cls)}>
      {style.icon}
      {type}
    </span>
  );
}

export default function AdminNotificationsListPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery<{ notifications: AdminNotification[] }>({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/admin-notifications");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const notifications = data?.notifications || [];

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/admin-notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      setSelectedIds(new Set());
      showToast("Selected notifications deleted ✓");
    },
    onError: () => {
      showToast("Error: Failed to delete notifications");
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id?: string) => {
      const res = await fetch("/api/admin-notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  }

  function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    deleteMutation.mutate(Array.from(selectedIds));
  }

  function handleNotificationClick(notif: AdminNotification) {
    if (!notif.is_read) {
      markAsRead.mutate(notif.id);
    }
    if (notif.link) {
      router.push(notif.link);
    } else {
      const title = notif.title.toLowerCase();
      if (title.includes("withdraw")) {
        router.push("/dashboard/withdrawals");
      } else if (title.includes("deposit")) {
        router.push("/dashboard/transactions");
      }
    }
  }

  const allSelected = notifications.length > 0 && selectedIds.size === notifications.length;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[26px] font-bold leading-tight text-gray-900 sm:text-[30px]">
              Admin Notifications
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              All notifications received by the admin panel
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                  {unreadCount} unread
                </span>
              )}
            </p>
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

        {/* Action bar */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4 text-gray-400" />
              )}
              {allSelected ? "Deselect All" : "Select All"}
            </button>

            {selectedIds.size > 0 && (
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {selectedIds.size} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead.mutate(undefined)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark All Read
              </button>
            )}

            <button
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0 || deleteMutation.isPending}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border",
                selectedIds.size > 0
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleteMutation.isPending ? "Deleting..." : "Delete Selected"}
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-20 bg-gray-50 animate-pulse border-b border-gray-100" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-500">No admin notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Notifications will appear here when users submit deposits or withdrawals
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => {
                const isSelected = selectedIds.has(notif.id);
                return (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex items-start gap-4 px-5 py-4 transition-colors",
                      !notif.is_read ? "bg-blue-50/30" : "bg-white",
                      isSelected && "bg-blue-50/60"
                    )}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(notif.id)}
                      className="mt-1 shrink-0 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </button>

                    {/* Content — clickable */}
                    <div
                      onClick={() => handleNotificationClick(notif)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <TypeBadge type={notif.type} />
                          {!notif.is_read && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-2 space-y-0.5">
                        <h4 className={cn(
                          "text-sm leading-snug",
                          !notif.is_read ? "font-extrabold text-gray-900" : "font-bold text-gray-700"
                        )}>
                          {notif.title}
                        </h4>
                        <p className="text-xs font-medium text-gray-500 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
