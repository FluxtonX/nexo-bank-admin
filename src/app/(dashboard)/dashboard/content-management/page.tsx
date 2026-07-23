"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  BarChart3,
  FileCheck,
  Settings,
  HeadphonesIcon,
  ChevronRight,
  Globe,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RequirePermission } from "@/components/layout/RequirePermission";
import { CategoryId } from "@/components/content-management/shared/FieldComponents";

// Panel imports
import { GlobalPanel } from "@/components/content-management/panels/GlobalPanel";
import { DashboardPanel } from "@/components/content-management/panels/DashboardPanel";
import { DepositPanel } from "@/components/content-management/panels/DepositPanel";
import { WithdrawPanel } from "@/components/content-management/panels/WithdrawPanel";
import { WalletsPanel } from "@/components/content-management/panels/WalletsPanel";
import { BuySellPanel } from "@/components/content-management/panels/BuySellPanel";
import { KycPanel } from "@/components/content-management/panels/KycPanel";
import { SettingsPanel } from "@/components/content-management/panels/SettingsPanel";
import { SupportPanel } from "@/components/content-management/panels/SupportPanel";
import { LandingPanel } from "@/components/content-management/panels/LandingPanel";
import { AboutPanel } from "@/components/content-management/panels/AboutPanel";
import { PricingPanel } from "@/components/content-management/panels/PricingPanel";
import { SecurityPanel } from "@/components/content-management/panels/SecurityPanel";
import { HelpPanel } from "@/components/content-management/panels/HelpPanel";

const BRAND_GRADIENT = "linear-gradient(135deg, #064e3b 0%, #047857 100%)";

/* ─── Category Definitions ──────────────────────────────────────── */

const CATEGORIES: { id: CategoryId; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "global",    label: "Global / Announcement", icon: Megaphone,       badge: "Banner" },
  { id: "dashboard", label: "Dashboard",              icon: LayoutDashboard },
  { id: "deposit",   label: "Deposit",                icon: ArrowDownToLine },
  { id: "withdraw",  label: "Withdraw",               icon: ArrowUpFromLine },
  { id: "wallets",   label: "Wallets",                icon: Wallet },
  { id: "buysell",   label: "Buy / Sell",             icon: BarChart3 },
  { id: "kyc",       label: "KYC",                    icon: FileCheck },
  { id: "settings",  label: "Settings",               icon: Settings },
  { id: "support",   label: "Support",                icon: HeadphonesIcon },
  { id: "landing",   label: "Landing Page",           icon: Globe },
  { id: "about",     label: "About Page",             icon: Globe },
  { id: "pricing",   label: "Pricing Page",           icon: Globe },
  { id: "security",  label: "Security Page",          icon: Globe },
  { id: "help",      label: "Help Page",              icon: Globe },
];

/* ─── Panel Router ───────────────────────────────────────────────── */

function PanelForCategory({ id }: { id: CategoryId }) {
  switch (id) {
    case "global":    return <GlobalPanel />;
    case "dashboard": return <DashboardPanel />;
    case "deposit":   return <DepositPanel />;
    case "withdraw":  return <WithdrawPanel />;
    case "wallets":   return <WalletsPanel />;
    case "buysell":   return <BuySellPanel />;
    case "kyc":       return <KycPanel />;
    case "settings":  return <SettingsPanel />;
    case "support":   return <SupportPanel />;
    case "landing":   return <LandingPanel />;
    case "about":     return <AboutPanel />;
    case "pricing":   return <PricingPanel />;
    case "security":  return <SecurityPanel />;
    case "help":      return <HelpPanel />;
    default:          return null;
  }
}

/* ─── Main Page ──────────────────────────────────────────────────── */

export default function ContentManagementPage() {
  return (
    <RequirePermission permission="edit-settings">
      <ContentManagementPageContent />
    </RequirePermission>
  );
}

function ContentManagementPageContent() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("global");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeLabel = CATEGORIES.find((c) => c.id === activeCategory)?.label ?? "";

  const handleCategorySelect = (id: CategoryId) => {
    setActiveCategory(id);
    setSidebarOpen(false); // Auto-close sidebar on mobile after selection
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-[26px] font-bold leading-tight text-gray-900 sm:text-[28px]">
            Content Management
          </h1>
          {/* Mobile toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <p className="text-sm text-gray-500">
          Edit website text, labels, messages, and announcements shown to clients — no code required.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start relative">
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/40"
            />
          )}
        </AnimatePresence>

        {/* Inner Sidebar */}
        <aside
          className={cn(
            "w-[210px] shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden",
            "md:sticky md:top-[88px]",
            "fixed md:relative z-50 transition-transform duration-300 ease-in-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            "top-0 left-0 h-full md:h-auto"
          )}
        >
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Content Categories</p>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="py-2">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-all text-left group cursor-pointer",
                    isActive
                      ? "text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  style={isActive ? { background: BRAND_GRADIENT } : {}}
                >
                  <Icon
                    className={cn("h-[14px] w-[14px] shrink-0", isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700")}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <span className="flex-1 truncate">{cat.label}</span>
                  {cat.badge && !isActive && (
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full shrink-0">
                      {cat.badge}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="h-3.5 w-3.5 text-white/70 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[12px] font-semibold text-gray-400">Content Management</span>
            <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
            <span className="text-[12px] font-bold text-gray-700">{activeLabel}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              <PanelForCategory id={activeCategory} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
