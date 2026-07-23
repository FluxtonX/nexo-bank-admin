"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Users, ShieldCheck, ArrowDownToLine,
  ArrowLeftRight, Wallet, PieChart, Banknote, Bell,
  MessageCircle, BarChart3, ShieldAlert, Settings,
  FileEdit,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { NAV_PERMISSION_MAP } from "@/lib/permissions";
import NexoBankLogoDarkGreen from "@/components/ui/NexoBankLogoDarkGreen";

const NAV_ITEMS = [
  { id: "dashboard",     label: "Dashboard",           href: "/dashboard",              icon: LayoutDashboard },
  { id: "users",         label: "Users",                href: "/dashboard/users",         icon: Users },
  { id: "kyc",           label: "KYC Verification",    href: "/dashboard/kyc",           icon: ShieldCheck },
  { id: "withdrawals",   label: "Withdrawal Requests", href: "/dashboard/withdrawals",   icon: ArrowDownToLine },
  { id: "transactions",  label: "Transactions",         href: "/dashboard/transactions",  icon: ArrowLeftRight },
  { id: "wallets",       label: "Wallets",              href: "/dashboard/wallets",       icon: Wallet },
  { id: "portfolio",     label: "Portfolio Management", href: "/dashboard/portfolio",     icon: PieChart },
  { id: "interac",       label: "Interac Payouts",      href: "/dashboard/interac",       icon: Banknote },
  { id: "notifications", label: "Notifications",        href: "/dashboard/notifications", icon: Bell },
  { id: "live-chat",     label: "Live Chat",            href: "/dashboard/live-chat",     icon: MessageCircle },
  { id: "reports",       label: "Reports & Analytics",  href: "/dashboard/reports",       icon: BarChart3 },
  { id: "security",      label: "Security Logs",        href: "/dashboard/security",      icon: ShieldAlert },
  { id: "settings",           label: "Settings",             href: "/dashboard/settings",            icon: Settings },
  { id: "content-management", label: "Content Management",   href: "/dashboard/content-management",  icon: FileEdit },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { hasAnyPermission, loading } = useAdminPermissions();

  // Filter nav items based on admin permissions
  const visibleNavItems = useMemo(() => {
    if (loading) return NAV_ITEMS; // Show all while loading to avoid flash
    return NAV_ITEMS.filter((item) => {
      const requiredPerms = NAV_PERMISSION_MAP[item.id];
      // If no permissions required (empty array or not mapped), always show
      if (!requiredPerms || requiredPerms.length === 0) return true;
      // Otherwise, show only if admin has any of the required permissions
      return hasAnyPermission(requiredPerms);
    });
  }, [loading, hasAnyPermission]);

  // Automatically close mobile drawer when route changes
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
  }, [pathname]);

  const renderNavContent = () => (
    <>
      {/* Brand */}
      <div className="flex flex-col px-4 py-5 border-b border-gray-100 gap-1.5 justify-center shrink-0">
        <NexoBankLogoDarkGreen className="h-9 w-auto self-start" />
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider pl-0.5">Admin Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 no-scrollbar">
        {visibleNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group",
                isActive
                  ? "text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              style={
                isActive
                  ? { background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)" }
                  : {}
              }
            >
              <Icon
                className={cn("h-[15px] w-[15px] shrink-0", isActive ? "text-white" : "text-gray-600 group-hover:text-gray-600")}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 h-screen sticky top-0 bg-white border-r border-gray-200 overflow-hidden z-30">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 w-[240px] bg-white border-r border-gray-200 z-50 md:hidden flex flex-col overflow-hidden shadow-xl"
            >
              {/* Top close bar */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-700 transition-colors cursor-pointer"
                  aria-label="Close Menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {renderNavContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
