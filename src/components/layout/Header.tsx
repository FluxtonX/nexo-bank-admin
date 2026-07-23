"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, ChevronDown, Menu, LogOut, Info, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import { supabase } from "@/lib/supabase";

// Types for our notification data
type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
};

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [adminName, setAdminName] = useState<string>("Admin User");
  const [adminRole, setAdminRole] = useState<string>("Super Admin");
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch admin user info
  useEffect(() => {
    async function fetchAdminInfo() {
      try {
        const cookies = document.cookie.split('; ').reduce((acc: any, cookie) => {
          const [key, value] = cookie.split('=');
          acc[key] = decodeURIComponent(value);
          return acc;
        }, {});

        const adminEmail = cookies.admin_auth;
        if (!adminEmail) return;

        const { data, error } = await supabase
          .from("admin_users")
          .select("full_name, roles(name)")
          .eq("email", adminEmail)
          .single();

        if (data && !error) {
          setAdminName(data.full_name || "Admin User");
          setAdminRole(data.roles?.[0]?.name || "Admin");
        }
      } catch (err) {
        console.error("Failed to fetch admin info:", err);
      }
    }
    fetchAdminInfo();
  }, []);

  // Ctrl+K shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch admin notifications
  const { data: notificationsData } = useQuery<{ notifications: Notification[] }>({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/admin-notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 30000, // Poll every 30s
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

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

  const handleLogout = () => {
    document.cookie = "admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    router.push("/login");
  };

  const handleNotificationClick = (notif: Notification) => {
    // Mark as read immediately if it's unread
    if (!notif.is_read) {
      markAsRead.mutate(notif.id);
    }
    
    setNotificationsOpen(false);

    // If schema is extended to include a direct link
    if (notif.link) {
      router.push(notif.link);
      return;
    }

    // Fallback logic for basic routing
    const title = notif.title.toLowerCase();
    if (title.includes("withdraw")) {
      router.push("/dashboard/withdrawals");
    } else if (title.includes("deposit")) {
      router.push("/dashboard/transactions"); // Deposits are shown on transactions page in some setups or dashboard/deposits if it exists
    }
  };

  return (
    <>
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <header className="sticky top-0 z-20 flex items-center gap-4 px-5 py-3 bg-white border-b border-gray-200 shrink-0">
      {/* Menu toggle for mobile screens */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-700 transition-colors cursor-pointer"
        aria-label="Toggle Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
          <input
            type="text"
            placeholder="Search users, transactions, requests..."
            readOnly
            onClick={() => setSearchOpen(true)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-500 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 text-[10px] font-mono font-semibold">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setDropdownOpen(false);
            }}
            aria-label="Notifications"
            className="relative h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2.5 w-80 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 py-1 z-40 border border-gray-100">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 rounded-t-xl">
                  <span className="text-sm font-bold text-gray-900">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAsRead.mutate(undefined)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-[320px] overflow-y-auto no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs font-medium text-gray-500">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const Icon =
                        n.type === "Info" ? Info :
                        n.type === "Warning" ? AlertCircle :
                        n.type === "Success" ? CheckCircle2 : XCircle;

                      return (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-4 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0 ${!n.is_read ? "bg-emerald-50/20" : ""}`}
                        >
                          <div
                            className={`grid h-8 w-8 place-items-center rounded-lg shrink-0 ${
                              n.type === "Info" ? "bg-emerald-50 text-emerald-600" :
                              n.type === "Warning" ? "bg-amber-50 text-amber-600" :
                              n.type === "Success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs leading-snug line-clamp-1 ${!n.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-gray-400 font-medium mt-1.5 block">
                              {new Date(n.created_at).toLocaleString()}
                            </span>
                          </div>
                          {!n.is_read && (
                            <div className="flex items-center">
                              <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                
                <div className="border-t border-gray-100 bg-gray-50 rounded-b-xl">
                  <button 
                    onClick={() => {
                      setNotificationsOpen(false);
                      router.push('/dashboard/admin-notifications');
                    }}
                    className="w-full text-center py-2.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User info & Dropdown */}
        <div className="relative">
          <div
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors select-none"
          >
            <div className="h-8 w-8 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 leading-none">{adminName}</p>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-none">{adminRole}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-600 hidden sm:block transition-transform duration-205" style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)" }} />
          </div>

          {dropdownOpen && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2.5 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-40">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50/50 hover:text-red-750 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
    </>
  );
}
