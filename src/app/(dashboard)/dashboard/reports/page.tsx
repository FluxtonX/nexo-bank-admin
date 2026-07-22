"use client";



import { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";

import {

  TrendingUp,

  DollarSign,

  Activity,

  Users,

  Calendar,

  Download,

  ChevronDown,

  ArrowUpRight,

} from "lucide-react";

import { cn } from "@/lib/utils";

import { RequirePermission } from "@/components/layout/RequirePermission";



// Removed static REVENUE_TX_DATA and USER_GROWTH_DATA

const BRAND_GRADIENT = "linear-gradient(135deg, #0A3D91 0%, #1650AB 100%)";



export default function ReportsAnalyticsPage() {

  return (

    <RequirePermission permission="view-reports">

      <ReportsAnalyticsPageContent />

    </RequirePermission>

  );

}



function ReportsAnalyticsPageContent() {

  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState("Last 6 Months");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [exporting, setExporting] = useState(false);



  const [stats, setStats] = useState({

    totalRevenue: 0,

    totalTransactions: 0,

    activeUsers: 0,

    avgTransaction: 0,

    resolutionRate: "100.0",

    conversionRate: "0.0",

    avgSessionDuration: "0m 0s",

    revenueTxData: [] as any[],

    userGrowthData: [] as any[]

  });



  // Toast notifications

  const [toastMessage, setToastMessage] = useState<string | null>(null);



  // Hover states for interactive tooltips

  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);



  useEffect(() => {

    async function loadReports() {

      try {

        setLoading(true);

        const params = new URLSearchParams();
        params.append("dateRange", dateRange);
        const res = await fetch(`/api/reports?${params.toString()}`, { cache: "no-store" });

        if (res.ok) {

          const data = await res.json();

          setStats(data);

        }

      } catch (err) {

        console.error("Failed to load report stats", err);

      } finally {

        setLoading(false);

      }

    }

    loadReports();

  }, [dateRange]);



  const triggerToast = (msg: string) => {

    setToastMessage(msg);

    setTimeout(() => setToastMessage(null), 3000);

  };



  const handleExport = () => {

    if (exporting) return;

    if (stats.revenueTxData.length === 0 && stats.userGrowthData.length === 0) {
      triggerToast("No data to export.");
      return;
    }

    setExporting(true);

    const revenueHeaders = ["Date", "Revenue (CAD)", "Transactions Count"];
    const revenueRows = stats.revenueTxData.map((item: any) =>
      [item.date, item.revenue.toFixed(2), item.transactions].map(val => `"${val}"`).join(",")
    );

    const growthHeaders = ["Date", "New Users", "Active Users"];
    const growthRows = stats.userGrowthData.map((item: any) =>
      [item.date, item.newUsers, item.activeUsers].map(val => `"${val}"`).join(",")
    );

    const csvContent = [
      "REVENUE & TRANSACTIONS DATA",
      revenueHeaders.join(","),
      ...revenueRows,
      "",
      "USER GROWTH DATA",
      growthHeaders.join(","),
      ...growthRows,
      "",
      "SUMMARY METRICS",
      "Total Revenue," + stats.totalRevenue.toFixed(2),
      "Total Transactions," + stats.totalTransactions,
      "Active Users," + stats.activeUsers,
      "Average Transaction," + stats.avgTransaction.toFixed(2),
      "Resolution Rate," + stats.resolutionRate,
      "Conversion Rate," + stats.conversionRate
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "CDNT-analytics-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExporting(false);

    triggerToast("Report successfully downloaded as CDNT-analytics-report.csv!");

  };



  const selectDateRange = (range: string) => {

    setDateRange(range);

    setIsDropdownOpen(false);

    triggerToast(`Analytics filtered by: ${range}`);

  };



  // Dimensions for custom SVG rendering

  const chartWidth = 550;

  const chartHeight = 220; // decreased to hold legend outside SVG

  const paddingLeft = 65; 

  const paddingRight = 25;

  const paddingTop = 20;

  const paddingBottom = 35; // decreased since legend is outside in HTML



  const drawableWidth = chartWidth - paddingLeft - paddingRight;

  const drawableHeight = chartHeight - paddingTop - paddingBottom;



  return (

    <div className="space-y-6">

      {/* Toast Notification */}

      <AnimatePresence>

        {toastMessage && (

          <motion.div

            initial={{ opacity: 0, y: -20 }}

            animate={{ opacity: 1, y: 0 }}

            exit={{ opacity: 0, y: -20 }}

            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-lg text-xs font-semibold text-gray-800"

          >

            <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />

            {toastMessage}

          </motion.div>

        )}

      </AnimatePresence>



      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>

          <h1 className="text-[26px] font-bold text-gray-900 leading-tight">Reports & Analytics</h1>

          <p className="mt-1 text-sm text-gray-600">View platform performance metrics and generate reports</p>

        </div>



        {/* Actions Dropdown & Export */}

        <div className="flex items-center gap-3">

          {/* Date range dropdown */}

          <div className="relative">

            <button

              onClick={() => setIsDropdownOpen(!isDropdownOpen)}

              className="flex items-center gap-2 px-4 h-10 border border-gray-200 rounded-xl bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer select-none"

            >

              <Calendar className="h-4 w-4 text-gray-600" />

              {dateRange}

              <ChevronDown className="h-4 w-4 text-gray-600 transition-transform" style={{ transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0)" }} />

            </button>

            <AnimatePresence>

              {isDropdownOpen && (

                <>

                  <div className="fixed inset-0 z-35" onClick={() => setIsDropdownOpen(false)} />

                  <motion.div

                    initial={{ opacity: 0, y: 10 }}

                    animate={{ opacity: 1, y: 0 }}

                    exit={{ opacity: 0, y: 10 }}

                    className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-40"

                  >

                    {["Last 7 Days", "Last 30 Days", "Last 6 Months", "Year to Date"].map((r) => (

                      <button

                        key={r}

                        onClick={() => selectDateRange(r)}

                        className={cn(

                          "w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors",

                          dateRange === r ? "text-blue-600 bg-blue-50/20" : "text-gray-600"

                        )}

                      >

                        {r}

                      </button>

                    ))}

                  </motion.div>

                </>

              )}

            </AnimatePresence>

          </div>



          {/* Export button */}

          <button

            onClick={handleExport}

            disabled={exporting}

            className="flex items-center gap-2 px-4.5 h-10 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shrink-0"

            style={{ background: BRAND_GRADIENT }}

          >

            {exporting ? (

              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />

            ) : (

              <Download className="h-4 w-4" />

            )}

            Export Report

          </button>

        </div>

      </div>



      {/* Top 4 Metrics Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {loading ? (

          Array.from({ length: 4 }).map((_, i) => (

            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm h-28 animate-pulse" />

          ))

        ) : (

          <>

            {/* Total Revenue */}

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">

              <div className="flex items-center justify-between">

                <span className="text-[11px] font-extrabold text-gray-600 uppercase tracking-wider font-mono">Total Revenue</span>

                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 border border-green-100">

                  <DollarSign className="h-4.5 w-4.5" />

                </div>

              </div>

              <div className="mt-3">

                <p className="text-2xl font-black text-gray-950 leading-none">${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>

                <div className="flex items-center gap-1 mt-1.5 text-[10px] font-extrabold text-green-600">

                  <ArrowUpRight className="h-3.5 w-3.5" />

                  <span>+24.5%</span>

                  <span className="text-gray-600 font-medium ml-1">vs last month</span>

                </div>

              </div>

            </div>



            {/* Total Transactions */}

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">

              <div className="flex items-center justify-between">

                <span className="text-[11px] font-extrabold text-gray-600 uppercase tracking-wider font-mono">Total Transactions</span>

                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">

                  <Activity className="h-4.5 w-4.5" />

                </div>

              </div>

              <div className="mt-3">

                <p className="text-2xl font-black text-gray-900 leading-none">{stats.totalTransactions.toLocaleString()}</p>

                <div className="flex items-center gap-1 mt-1.5 text-[10px] font-extrabold text-green-600">

                  <ArrowUpRight className="h-3.5 w-3.5" />

                  <span>+18.3%</span>

                  <span className="text-gray-600 font-medium ml-1">vs last month</span>

                </div>

              </div>

            </div>



            {/* Active Users */}

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">

              <div className="flex items-center justify-between">

                <span className="text-[11px] font-extrabold text-gray-600 uppercase tracking-wider font-mono">Active Users</span>

                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">

                  <Users className="h-4.5 w-4.5" />

                </div>

              </div>

              <div className="mt-3">

                <p className="text-2xl font-black text-gray-900 leading-none">{stats.activeUsers.toLocaleString()}</p>

                <div className="flex items-center gap-1 mt-1.5 text-[10px] font-extrabold text-green-600">

                  <ArrowUpRight className="h-3.5 w-3.5" />

                  <span>+51.2%</span>

                  <span className="text-gray-600 font-medium ml-1">vs last month</span>

                </div>

              </div>

            </div>



            {/* Avg Transaction */}

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">

              <div className="flex items-center justify-between">

                <span className="text-[11px] font-extrabold text-gray-600 uppercase tracking-wider font-mono">Avg. Transaction</span>

                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">

                  <Calendar className="h-4.5 w-4.5" />

                </div>

              </div>

              <div className="mt-3">

                <p className="text-2xl font-black text-gray-900 leading-none">${stats.avgTransaction.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>

                <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-gray-600 font-mono">

                  <span>Per transaction</span>

                </div>

              </div>

            </div>

          </>

        )}

      </div>



      {/* SVG Charts Row */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Revenue & Transactions double-bar */}

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative">

          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>

              <h3 className="text-sm font-black text-gray-900 tracking-tight">Revenue & Transactions</h3>

              <p className="text-[11px] text-gray-600 font-medium">Monthly volume breakdown</p>

            </div>

            <div className="flex items-center gap-4 text-[11px] font-bold">

              <div className="flex items-center gap-1.5">

                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: BRAND_GRADIENT }} />

                <span className="text-gray-600">Revenue (CAD)</span>

              </div>

              <div className="flex items-center gap-1.5">

                <span className="h-2.5 w-2.5 rounded-sm bg-blue-100 border border-blue-200" />

                <span className="text-gray-600">Transactions</span>

              </div>

            </div>

          </div>

          <div className="flex-1 p-5 relative min-h-[250px]">

            {stats.revenueTxData.length === 0 ? (

              <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">Loading Chart Data...</div>

            ) : (

              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">

                {/* Y Axis Gridlines */}

                {[0, 65000, 130000, 195000, 260000].map((val, idx) => {

                  const y = paddingTop + drawableHeight - (val / 260000) * drawableHeight;

                  return (

                    <g key={idx}>

                      <line

                        x1={paddingLeft}

                        y1={y}

                        x2={chartWidth - paddingRight}

                        y2={y}

                        stroke="#F1F5F9"

                        strokeWidth={1}

                        strokeDasharray={val === 0 ? "none" : "3 3"}

                      />

                      <text

                        x={paddingLeft - 10}

                        y={y + 4}

                        textAnchor="end"

                        className="text-[9px] font-bold text-gray-600 font-mono"

                      >

                        {val.toLocaleString()}

                      </text>

                    </g>

                  );

                })}



                {/* X Axis & Labels */}

                {stats.revenueTxData.map((item, idx) => {

                  const xCenter = paddingLeft + (idx + 0.5) * (drawableWidth / stats.revenueTxData.length);

                  return (

                    <text

                      key={idx}

                      x={xCenter}

                      y={chartHeight - paddingBottom + 16}

                      textAnchor="middle"

                      className="text-[10px] font-bold text-gray-600 font-mono"

                    >

                      {item.month}

                    </text>

                  );

                })}



                {/* Double Bars */}

                {stats.revenueTxData.map((item, idx) => {

                  const maxRev = Math.max(...stats.revenueTxData.map(d => d.revenue));

                  const maxTx = Math.max(...stats.revenueTxData.map(d => d.transactions));

                  const colWidth = drawableWidth / stats.revenueTxData.length;

                  const xCenter = paddingLeft + idx * colWidth + colWidth / 2;



                  const barWidth = 14;

                  const revX = xCenter - barWidth - 1.5;

                  const txX = xCenter + 1.5;



                  const revHeight = (item.revenue / 260000) * drawableHeight;

                  const txHeight = (item.transactions / 260000) * drawableHeight;



                  const revY = paddingTop + drawableHeight - revHeight;

                  const txY = paddingTop + drawableHeight - txHeight;



                  const isHovered = hoveredBarIndex === idx;



                  return (

                    <g

                      key={idx}

                      className="cursor-pointer"

                      onMouseEnter={() => setHoveredBarIndex(idx)}

                      onMouseLeave={() => setHoveredBarIndex(null)}

                    >

                      {/* Hover column background highlight */}

                      <rect

                        x={paddingLeft + idx * colWidth + 4}

                        y={paddingTop}

                        width={colWidth - 8}

                        height={drawableHeight}

                        fill={isHovered ? "rgba(10, 61, 145, 0.03)" : "transparent"}

                        rx="4"

                      />



                      {/* Revenue Bar (Navy) */}

                      <motion.rect

                        initial={{ height: 0, y: paddingTop + drawableHeight }}

                        animate={{ height: revHeight, y: revY }}

                        transition={{ duration: 0.8, ease: "easeOut" }}

                        x={revX}

                        width={barWidth}

                        fill={isHovered ? "#1650AB" : "#0A3D91"}

                        rx="1.5"

                      />



                      {/* Transactions Bar (Yellow) */}

                      <motion.rect

                        initial={{ height: 0, y: paddingTop + drawableHeight }}

                        animate={{ height: txHeight, y: txY }}

                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}

                        x={txX}

                        width={barWidth}

                        fill={isHovered ? "#EAB308" : "#F59E0B"}

                        rx="1.5"

                      />

                    </g>

                  );

                })}

              </svg>

            )}



            {/* Floating responsive interactive tooltip */}

            <AnimatePresence>

              {hoveredBarIndex !== null && stats.revenueTxData[hoveredBarIndex] && (() => {

                const data = stats.revenueTxData[hoveredBarIndex];

                const percentX = ((paddingLeft + hoveredBarIndex * (drawableWidth / stats.revenueTxData.length) + (drawableWidth / stats.revenueTxData.length) / 2) / chartWidth) * 100;

                return (

                  <motion.div

                    initial={{ opacity: 0, scale: 0.95, y: 10 }}

                    animate={{ opacity: 1, scale: 1, y: 0 }}

                    exit={{ opacity: 0, scale: 0.95 }}

                    className="absolute bg-slate-900/95 border border-slate-800 rounded-xl p-3.5 shadow-2xl pointer-events-none z-20 w-40 space-y-1.5 backdrop-blur-sm"

                    style={{

                      left: `${percentX}%`,

                      top: 15,

                      transform: hoveredBarIndex === 0 

                        ? "none" 

                        : hoveredBarIndex === stats.revenueTxData.length - 1 

                          ? "translateX(-100%)" 

                          : "translateX(-50%)"

                    }}

                  >

                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">

                      {data.month} Statistics

                    </p>

                    <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-slate-800">

                      <span className="text-slate-300 flex items-center gap-1.5">

                        <span className="h-1.5 w-1.5 rounded-full bg-[#0A3D91]" />

                        Rev

                      </span>

                      <span className="text-white font-mono font-bold">${data.revenue.toLocaleString()}</span>

                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold">

                      <span className="text-slate-300 flex items-center gap-1.5">

                        <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />

                        Tx

                      </span>

                      <span className="text-white font-mono font-bold">{data.transactions.toLocaleString()}</span>

                    </div>

                  </motion.div>

                );

              })()}

            </AnimatePresence>

          </div>

        </div>



        {/* Chart 2: User Growth double-line */}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden">

          <h3 className="text-sm font-extrabold text-gray-900 mb-6">User Growth</h3>



          {loading ? (

            <div className="h-[260px] flex items-center justify-center bg-gray-50/50 rounded-xl border border-gray-100 border-dashed animate-pulse">

              <span className="text-xs font-semibold text-gray-600">Loading chart data...</span>

            </div>

          ) : (

            <div className="w-full flex flex-col">

              <div className="relative flex justify-center w-full">

                {/* Responsive SVG using viewBox */}

                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">

                  {/* Y Axis Gridlines */}

                  {[0, 3500, 7000, 10500, 14000].map((val, idx) => {

                    const y = paddingTop + drawableHeight - (val / 14000) * drawableHeight;

                    return (

                      <g key={idx}>

                        <line

                          x1={paddingLeft}

                          y1={y}

                          x2={chartWidth - paddingRight}

                          y2={y}

                          stroke="#F1F5F9"

                          strokeWidth={1}

                          strokeDasharray={val === 0 ? "none" : "3 3"}

                        />

                        <text

                          x={paddingLeft - 10}

                          y={y + 4}

                          textAnchor="end"

                          className="text-[9px] font-bold text-gray-600 font-mono"

                        >

                          {val.toLocaleString()}

                        </text>

                      </g>

                    );

                  })}



                  {/* X Axis & Labels */}

                  {stats.userGrowthData.map((item, idx) => {

                    const spacing = drawableWidth / (stats.userGrowthData.length - 1 || 1);

                    const x = paddingLeft + (idx * spacing);

                    return (

                      <text

                        key={idx}

                        x={x}

                        y={chartHeight - paddingBottom + 16}

                        textAnchor="middle"

                        className="text-[10px] font-bold text-gray-600 font-mono"

                      >

                        {item.month}

                      </text>

                    );

                  })}



                  {/* Hover vertical crosshair line */}

                  {hoveredLineIndex !== null && (

                    <line

                      x1={paddingLeft + (hoveredLineIndex / (stats.userGrowthData.length - 1 || 1)) * drawableWidth}

                      y1={paddingTop}

                      x2={paddingLeft + (hoveredLineIndex / (stats.userGrowthData.length - 1 || 1)) * drawableWidth}

                      y2={paddingTop + drawableHeight}

                      stroke="#CBD5E1"

                      strokeWidth={1.5}

                      strokeDasharray="2 2"

                    />

                  )}



                  {/* Custom Splines Paths generator */}

                  {(() => {

                    // Coordinate points mapping

                    const totalUsersPoints = stats.userGrowthData.map((item, idx) => ({

                      x: paddingLeft + (idx / (stats.userGrowthData.length - 1 || 1)) * drawableWidth,

                      y: paddingTop + drawableHeight - (item.totalUsers / 14000) * drawableHeight,

                    }));



                    const verifiedUsersPoints = stats.userGrowthData.map((item, idx) => ({

                      x: paddingLeft + (idx / (stats.userGrowthData.length - 1 || 1)) * drawableWidth,

                      y: paddingTop + drawableHeight - (item.verifiedUsers / 14000) * drawableHeight,

                    }));



                    // Curved Bezier generator helper

                    const getBezierPath = (points: { x: number; y: number }[]) => {

                      return points.reduce((path, point, i) => {

                        if (i === 0) return `M ${point.x} ${point.y}`;

                        const prev = points[i - 1];

                        const dx = point.x - prev.x;

                        const cpX1 = prev.x + dx / 3;

                        const cpY1 = prev.y;

                        const cpX2 = prev.x + (2 * dx) / 3;

                        const cpY2 = point.y;

                        return `${path} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${point.x} ${point.y}`;

                      }, "");

                    };



                    return (

                      <>

                        <motion.path

                          initial={{ pathLength: 0 }}

                          animate={{ pathLength: 1 }}

                          transition={{ duration: 1.2, ease: "easeInOut" }}

                          d={getBezierPath(totalUsersPoints)}

                          fill="transparent"

                          stroke="#0A3D91"

                          strokeWidth={2.5}

                        />



                        <motion.path

                          initial={{ pathLength: 0 }}

                          animate={{ pathLength: 1 }}

                          transition={{ duration: 1.2, ease: "easeInOut", delay: 0.1 }}

                          d={getBezierPath(verifiedUsersPoints)}

                          fill="transparent"

                          stroke="#F59E0B"

                          strokeWidth={2.5}

                        />



                        {stats.userGrowthData.map((item, idx) => {

                          const pt1 = totalUsersPoints[idx];

                          const pt2 = verifiedUsersPoints[idx];

                          const isHovered = hoveredLineIndex === idx;



                          return (

                            <g key={idx}>

                              <rect

                                x={pt1.x - 20}

                                y={paddingTop}

                                width={40}

                                height={drawableHeight}

                                fill="transparent"

                                className="cursor-pointer"

                                onMouseEnter={() => setHoveredLineIndex(idx)}

                                onMouseLeave={() => setHoveredLineIndex(null)}

                              />

                              <circle cx={pt1.x} cy={pt1.y} r={isHovered ? 6 : 4} fill="#0A3D91" stroke="#FFF" strokeWidth={1.5} className="transition-all pointer-events-none" />

                              <circle cx={pt2.x} cy={pt2.y} r={isHovered ? 6 : 4} fill="#F59E0B" stroke="#FFF" strokeWidth={1.5} className="transition-all pointer-events-none" />

                            </g>

                          );

                        })}

                      </>

                    );

                  })()}

                </svg>



                {/* Floating responsive interactive tooltip */}

                <AnimatePresence>

                  {hoveredLineIndex !== null && stats.userGrowthData[hoveredLineIndex] && (() => {

                    const data = stats.userGrowthData[hoveredLineIndex];

                    const percentX = ((paddingLeft + (hoveredLineIndex / (stats.userGrowthData.length - 1 || 1)) * drawableWidth) / chartWidth) * 100;

                    return (

                      <motion.div

                        initial={{ opacity: 0, scale: 0.95, y: 10 }}

                        animate={{ opacity: 1, scale: 1, y: 0 }}

                        exit={{ opacity: 0, scale: 0.95 }}

                        className="absolute bg-slate-900/95 border border-slate-800 rounded-xl p-3.5 shadow-2xl pointer-events-none z-20 w-40 space-y-1.5 backdrop-blur-sm"

                        style={{

                          left: `${percentX}%`,

                          top: 15,

                          transform: hoveredLineIndex === 0 

                            ? "none" 

                            : hoveredLineIndex === stats.userGrowthData.length - 1 

                              ? "translateX(-100%)" 

                              : "translateX(-50%)"

                        }}

                      >

                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">

                          {data.month} Growth

                        </p>

                        <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-slate-800">

                          <span className="text-slate-300 flex items-center gap-1.5">

                            <span className="h-1.5 w-1.5 rounded-full bg-[#0A3D91]" />

                            Total

                          </span>

                          <span className="text-white font-mono font-bold">{data.totalUsers.toLocaleString()}</span>

                        </div>

                        <div className="flex items-center justify-between text-xs font-semibold">

                          <span className="text-slate-300 flex items-center gap-1.5">

                            <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />

                            Verified

                          </span>

                          <span className="text-white font-mono font-bold">{data.verifiedUsers.toLocaleString()}</span>

                        </div>

                      </motion.div>

                    );

                  })()}

                </AnimatePresence>

              </div>



              {/* HTML Legends */}

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 text-xs font-bold text-gray-600 font-mono">

                <div className="flex items-center gap-2">

                  <span className="w-4 h-0.5 bg-[#0A3D91] relative flex items-center justify-center">

                    <span className="h-1.5 w-1.5 rounded-full bg-[#0A3D91] border border-white" />

                  </span>

                  <span>Total Users</span>

                </div>

                <div className="flex items-center gap-2">

                  <span className="w-4 h-0.5 bg-[#F59E0B] relative flex items-center justify-center">

                    <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B] border border-white" />

                  </span>

                  <span>Verified</span>

                </div>

              </div>

            </div>

          )}

        </div>

      </div>



      {/* Bottom Performance Stats row */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {loading ? (

          Array.from({ length: 3 }).map((_, i) => (

            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm h-24 animate-pulse" />

          ))

        ) : (

          <>

            {/* Conversion Rate */}

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">

              <span className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wide font-mono">Conversion Rate</span>

              <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 flex-wrap">

                <span className="text-2xl font-black text-gray-900 leading-none">{stats.conversionRate}%</span>

                <div className="flex items-center gap-1 text-[10px] font-extrabold text-green-700 flex-wrap">

                  <span className="flex items-center gap-0.5 bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-bold">

                    <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />

                    +3.2%

                  </span>

                  <span className="text-gray-600 font-medium whitespace-nowrap">from last month</span>

                </div>

              </div>

            </div>



            {/* Avg Session Duration */}

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">

              <span className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wide font-mono">Avg. Session Duration</span>

              <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 flex-wrap">

                <span className="text-2xl font-black text-gray-900 leading-none">{stats.avgSessionDuration}</span>

                <div className="flex items-center gap-1 text-[10px] font-extrabold text-green-700 flex-wrap">

                  <span className="flex items-center gap-0.5 bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-bold">

                    <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />

                    +12%

                  </span>

                  <span className="text-gray-600 font-medium whitespace-nowrap">from last month</span>

                </div>

              </div>

            </div>



            {/* Support Ticket Resolution */}

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">

              <span className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wide font-mono">Support Ticket Resolution</span>

              <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 flex-wrap">

                <span className="text-2xl font-black text-gray-900 leading-none">{stats.resolutionRate}%</span>

                <div className="flex items-center gap-1 text-[10px] font-extrabold text-green-700 flex-wrap">

                  <span className="flex items-center gap-0.5 bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-bold">

                    <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />

                    +5.1%

                  </span>

                  <span className="text-gray-600 font-medium whitespace-nowrap">from last month</span>

                </div>

              </div>

            </div>

          </>

        )}

      </div>



      <div className="h-2" />

    </div>

  );

}

