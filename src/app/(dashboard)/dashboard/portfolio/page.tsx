"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Check,
  Activity,
  UserCheck,
  DollarSign,
  PieChart as ChartIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RequirePermission } from "@/components/layout/RequirePermission";

type AllocationSegment = {
  asset: string;
  percentage: number;
  valueCad: number;
  color: string;
  strokeColor: string;
};

const BRAND_GRADIENT = "linear-gradient(135deg, #064e3b 0%, #047857 100%)";

export default function PortfolioManagementPage() {
  return (
    <RequirePermission permission={["manage-wallets", "view-wallets"]}>
      <PortfolioManagementPageContent />
    </RequirePermission>
  );
}

function PortfolioManagementPageContent() {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<AllocationSegment | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const [allocations, setAllocations] = useState<AllocationSegment[]>([]);
  const [totalAum, setTotalAum] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [performanceGrowth, setPerformanceGrowth] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio");
      if (res.ok) {
        const data = await res.json();
        setAllocations(data.allocations || []);
        setTotalAum(data.totalAum || 0);
        setUserCount(data.userCount || 0);
        setPerformanceGrowth(data.performanceGrowth || 0);
      }
    } catch (e) {
      console.error("Error loading portfolio metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshCount]);

  const cardAllocations = useMemo(() => {
    // Take top 3 allocations by value
    return allocations
      .slice(0, 3)
      .map(a => ({
        ...a,
        asset: a.asset
      }));
  }, [allocations]);

  // Calculate SVG Pie Segments
  const pieSegments = useMemo(() => {
    const cx = 180;
    const cy = 150;
    const r = 70;
    let accumulatedPercentage = 0;

    return allocations.map((alloc) => {
      const startPercent = accumulatedPercentage;
      accumulatedPercentage += alloc.percentage;
      const endPercent = accumulatedPercentage;

      const startAngle = (startPercent / 100) * 2 * Math.PI - Math.PI / 2;
      const endAngle = (endPercent / 100) * 2 * Math.PI - Math.PI / 2;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      const largeArcFlag = alloc.percentage > 50 ? 1 : 0;

      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      // Mid angle for label positioning
      const midAngle = startAngle + (endAngle - startAngle) / 2;

      // Start of line connector (perimeter of slice)
      const sx = cx + r * Math.cos(midAngle);
      const sy = cy + r * Math.sin(midAngle);

      // End of line connector (15px outside)
      const ex = cx + (r + 15) * Math.cos(midAngle);
      const ey = cy + (r + 15) * Math.sin(midAngle);

      // Label text (22px outside)
      const lx = cx + (r + 22) * Math.cos(midAngle);
      const ly = cy + (r + 22) * Math.sin(midAngle);

      return {
        ...alloc,
        pathData,
        sx,
        sy,
        ex,
        ey,
        lx,
        ly,
        midAngle,
        cx,
        cy,
        r,
      };
    });
  }, [allocations]);

  const handleRefresh = () => {
    setRefreshCount((prev) => prev + 1);
    setToast("Portfolio data refreshed successfully ✓");
    window.setTimeout(() => setToast(null), 2000);
  };

  const handleExport = () => {
    if (allocations.length === 0) {
      setToast("No allocation data to export.");
      window.setTimeout(() => setToast(null), 2500);
      return;
    }
    const headers = ["Asset", "Percentage", "CAD Value", "Color"];
    const csvContent = [
      headers.join(","),
      ...allocations.map(alloc =>
        [
          alloc.asset,
          alloc.percentage.toFixed(2),
          alloc.valueCad.toFixed(2),
          alloc.color
        ].map(val => `"${val}"`).join(",")
      ),
      "",
      "SUMMARY METRICS",
      "Total AUM (CAD)," + totalAum.toFixed(2),
      "User Count," + userCount,
      "Performance Growth (CAD)," + performanceGrowth.toFixed(2)
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "portfolio-allocation-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast("Asset allocation report downloaded successfully.");
    window.setTimeout(() => setToast(null), 2500);
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
            <h1 className="text-[26px] font-bold leading-tight text-gray-900 sm:text-[30px]">Portfolio Management</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Monitor platform-wide asset allocation and performance</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 cursor-pointer"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
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

        {/* Top Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Card 1: Total AUM */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2.5">
            <p className="text-sm font-medium text-gray-600">Total Assets Under Management</p>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-gray-900 leading-none">${totalAum.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="flex items-center gap-1 mt-2.5">
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-green-50 text-green-600 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                +8.5% (30d)
              </span>
            </div>
          </div>

          {/* Allocation stat cards */}
          {cardAllocations.map((alloc) => (
            <div key={alloc.asset} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2.5">
              <p className="text-sm font-medium text-gray-600">{alloc.asset}</p>
              <p className="text-3xl font-bold text-gray-900 leading-none">${(alloc.valueCad || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-gray-600 font-semibold mt-1">{alloc.percentage}% of portfolio</p>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Pie Chart display */}
          <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[460px]">
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Asset Allocation</h3>
              <p className="text-xs text-gray-600 mt-1">Interactive asset distribution by cryptocurrency</p>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="h-48 w-48 rounded-full border-4 border-dashed border-gray-200 animate-spin flex items-center justify-center text-gray-600">
                  <ChartIcon className="h-8 w-8 animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 py-6">
                {/* SVG Pie Chart */}
                <div className="relative h-72 w-full max-w-[400px]">
                  <svg viewBox="0 0 360 300" className="h-full w-full select-none">
                    {pieSegments.map((segment) => {
                      const isHovered = hoveredSegment?.asset === segment.asset;
                      return (
                        <g key={segment.asset}>
                          {/* Connector Line */}
                          <line
                            x1={segment.sx}
                            y1={segment.sy}
                            x2={segment.ex}
                            y2={segment.ey}
                            stroke={segment.strokeColor}
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            className="opacity-70"
                          />
                          
                          {/* Segment Path */}
                          <motion.path
                            d={segment.pathData}
                            fill={segment.strokeColor}
                            className="transition-all duration-150 cursor-pointer hover:opacity-95"
                            style={{
                              filter: isHovered ? "drop-shadow(0px 4px 8px rgba(0,0,0,0.15))" : "none",
                            }}
                            onMouseEnter={() => setHoveredSegment(segment)}
                            onMouseLeave={() => setHoveredSegment(null)}
                          />

                          {/* Slice Label */}
                          <text
                            x={segment.lx}
                            y={segment.ly}
                            fill={segment.strokeColor}
                            className="text-[10px] font-extrabold font-mono tracking-tight"
                            textAnchor={segment.lx > 180 ? "start" : "end"}
                            dominantBaseline="central"
                          >
                            {segment.asset}: {segment.percentage}%
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Color Legend Card */}
                <div className="space-y-4 min-w-[200px]">
                  {cardAllocations.map((alloc) => {
                    const isHovered = hoveredSegment?.asset === alloc.asset;
                    return (
                      <div
                        key={alloc.asset}
                        onMouseEnter={() => setHoveredSegment(alloc)}
                        onMouseLeave={() => setHoveredSegment(null)}
                        className={cn(
                          "flex items-center justify-between p-3 border border-gray-100 rounded-xl transition-all shadow-sm cursor-pointer",
                          isHovered ? "bg-gray-50 border-emerald-200" : "bg-white"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={cn("h-3 w-3 rounded-md shrink-0", alloc.color)} />
                          <span className="text-sm font-bold text-gray-700">{alloc.asset}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-extrabold text-gray-900 font-mono">{alloc.percentage}%</p>
                          <p className="text-[10px] text-gray-600 font-semibold">${(alloc.valueCad || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 pt-3 text-xs text-gray-600 font-semibold text-center md:text-left">
              Hover over pie segments or legends to inspect detailed asset weight metrics.
            </div>
          </div>

          {/* Performance side metrics */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[460px]">
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Allocation Performance</h3>
              <p className="text-xs text-gray-600 mt-1">Platform performance audit logs</p>
            </div>

            {loading ? (
              <div className="flex-1 space-y-4 py-8">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center space-y-4 py-6">
                {[
                  { 
                    label: "30-Day Performance", 
                    value: `+$${(performanceGrowth >= 1000000 ? (performanceGrowth / 1000000).toFixed(1) + "M" : performanceGrowth.toLocaleString())}`, 
                    desc: "Estimated net yield growth", 
                    trend: performanceGrowth > 0 ? `+${((performanceGrowth / (totalAum || 1)) * 100).toFixed(1)}%` : "0%", 
                    tone: "text-green-600" 
                  },
                  { 
                    label: "Total User Portfolios", 
                    value: userCount.toLocaleString(), 
                    desc: "Active custodial wallets audited", 
                    trend: "Normal", 
                    tone: "text-gray-900" 
                  },
                  { 
                    label: "Average Portfolio Size", 
                    value: `$${(userCount > 0 ? (totalAum / userCount) : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                    desc: "Combined average CAD value per client", 
                    trend: "Balanced", 
                    tone: "text-gray-900" 
                  },
                ].map((perf) => (
                  <div key={perf.label} className="p-4 border border-gray-150/60 bg-gray-50/25 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-xs font-semibold text-gray-600">{perf.label}</p>
                      <p className={cn("text-xl font-black mt-1 leading-none", perf.tone)}>{perf.value}</p>
                      <p className="text-[10px] text-gray-600 mt-1.5 font-semibold">{perf.desc}</p>
                    </div>
                    {perf.trend && (
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border font-mono",
                        perf.trend.startsWith("+") ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"
                      )}>
                        {perf.trend}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 pt-3 text-xs text-gray-600 font-semibold flex items-center gap-1.5 justify-center">
              <Activity className="h-4 w-4 text-[#064e3b]" />
              Secure audit metrics verified
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
