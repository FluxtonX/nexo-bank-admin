"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TextField, ContentCard, updateContentKey } from "../shared/FieldComponents";

export function DashboardPanel() {
  // Top Header Area
  const [portfolioLabel, setPortfolioLabel] = useState("Total Portfolio Value");
  const [timeframeLabel, setTimeframeLabel] = useState("this month");
  const [cadBalanceLabel, setCadBalanceLabel] = useState("CAD Balance");
  const [depositBtn, setDepositBtn] = useState("Deposit");
  const [withdrawBtn, setWithdrawBtn] = useState("Withdraw");

  // Performance Chart
  const [perfTitle, setPerfTitle] = useState("Portfolio Performance");
  const [dateFrom, setDateFrom] = useState("From date");
  const [dateTo, setDateTo] = useState("To date");
  const [tooltipCad, setTooltipCad] = useState("CAD Value");

  // Asset Allocation
  const [allocTitle, setAllocTitle] = useState("Asset Allocation");
  const [emptyAssetsTitle, setEmptyAssetsTitle] = useState("No assets yet");
  const [emptyAssetsSub, setEmptyAssetsSub] = useState("Deposit to see your allocation");

  // Wallets Grid
  const [emptyWalletsTitle, setEmptyWalletsTitle] = useState("No wallets yet");
  const [emptyWalletsSub, setEmptyWalletsSub] = useState("Make a deposit to get started");

  // Recent Transactions
  const [txTitle, setTxTitle] = useState("Recent Transactions");
  const [txViewAll, setTxViewAll] = useState("View All");
  const [txLoading, setTxLoading] = useState("Loading transactions...");
  const [emptyTx, setEmptyTx] = useState("No recent transactions");
  const [txDetailsBtn, setTxDetailsBtn] = useState("View Details");

  // Transaction Details Modal
  const [modalTitle, setModalTitle] = useState("Transaction Details");
  const [modalAmount, setModalAmount] = useState("Amount");
  const [modalBalBefore, setModalBalBefore] = useState("Total Balance Before");
  const [modalNewBal, setModalNewBal] = useState("Available Balance");
  const [modalStatus, setModalStatus] = useState("Status");
  const [modalReason, setModalReason] = useState("Rejection Reason");

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("key, value")
          .eq("category", "dashboard");
        if (!error && data) {
          data.forEach((row) => {
            switch (row.key) {
              case "dashboard.top_header.portfolio_label":
                setPortfolioLabel(row.value);
                break;
              case "dashboard.top_header.timeframe_label":
                setTimeframeLabel(row.value);
                break;
              case "dashboard.top_header.cad_balance_label":
                setCadBalanceLabel(row.value);
                break;
              case "dashboard.top_header.deposit_btn":
                setDepositBtn(row.value);
                break;
              case "dashboard.top_header.withdraw_btn":
                setWithdrawBtn(row.value);
                break;
              case "dashboard.performance.title":
                setPerfTitle(row.value);
                break;
              case "dashboard.performance.from_placeholder":
                setDateFrom(row.value);
                break;
              case "dashboard.performance.to_placeholder":
                setDateTo(row.value);
                break;
              case "dashboard.performance.tooltip_label":
                setTooltipCad(row.value);
                break;
              case "dashboard.allocation.title":
                setAllocTitle(row.value);
                break;
              case "dashboard.allocation.empty_title":
                setEmptyAssetsTitle(row.value);
                break;
              case "dashboard.allocation.empty_sub":
                setEmptyAssetsSub(row.value);
                break;
              case "dashboard.wallets.empty_title":
                setEmptyWalletsTitle(row.value);
                break;
              case "dashboard.wallets.empty_sub":
                setEmptyWalletsSub(row.value);
                break;
              case "dashboard.transactions.title":
                setTxTitle(row.value);
                break;
              case "dashboard.transactions.view_all":
                setTxViewAll(row.value);
                break;
              case "dashboard.transactions.loading":
                setTxLoading(row.value);
                break;
              case "dashboard.transactions.empty":
                setEmptyTx(row.value);
                break;
              case "dashboard.transactions.details_btn":
                setTxDetailsBtn(row.value);
                break;
              case "dashboard.modal.title":
                setModalTitle(row.value);
                break;
              case "dashboard.modal.amount_label":
                setModalAmount(row.value);
                break;
              case "dashboard.modal.before_label":
                setModalBalBefore(row.value);
                break;
              case "dashboard.modal.new_balance_label":
                setModalNewBal(row.value);
                break;
              case "dashboard.modal.status_label":
                setModalStatus(row.value);
                break;
              case "dashboard.modal.reason_label":
                setModalReason(row.value);
                break;
              default:
                break;
            }
          });
        }
      } catch (err) {
        console.error("Error loading dashboard settings:", err);
      }
    }
    loadData();
  }, []);

  // Save handlers for each section
  const saveTopHeader = async () => {
    await updateContentKey("dashboard.top_header.portfolio_label", portfolioLabel, "text", "dashboard", "Portfolio Label");
    await updateContentKey("dashboard.top_header.timeframe_label", timeframeLabel, "text", "dashboard", "Timeframe Label");
    await updateContentKey("dashboard.top_header.cad_balance_label", cadBalanceLabel, "text", "dashboard", "CAD Balance Label");
    await updateContentKey("dashboard.top_header.deposit_btn", depositBtn, "text", "dashboard", "Deposit Button");
    await updateContentKey("dashboard.top_header.withdraw_btn", withdrawBtn, "text", "dashboard", "Withdraw Button");
  };
  const savePerformance = async () => {
    await updateContentKey("dashboard.performance.title", perfTitle, "text", "dashboard", "Performance Title");
    await updateContentKey("dashboard.performance.from_placeholder", dateFrom, "text", "dashboard", "From Placeholder");
    await updateContentKey("dashboard.performance.to_placeholder", dateTo, "text", "dashboard", "To Placeholder");
    await updateContentKey("dashboard.performance.tooltip_label", tooltipCad, "text", "dashboard", "Tooltip Label");
  };
  const saveAllocation = async () => {
    await updateContentKey("dashboard.allocation.title", allocTitle, "text", "dashboard", "Allocation Title");
    await updateContentKey("dashboard.allocation.empty_title", emptyAssetsTitle, "text", "dashboard", "Empty Title");
    await updateContentKey("dashboard.allocation.empty_sub", emptyAssetsSub, "text", "dashboard", "Empty Sub");
  };
  const saveWallets = async () => {
    await updateContentKey("dashboard.wallets.empty_title", emptyWalletsTitle, "text", "dashboard", "Wallets Empty Title");
    await updateContentKey("dashboard.wallets.empty_sub", emptyWalletsSub, "text", "dashboard", "Wallets Empty Sub");
  };
  const saveTransactions = async () => {
    await updateContentKey("dashboard.transactions.title", txTitle, "text", "dashboard", "Transactions Title");
    await updateContentKey("dashboard.transactions.view_all", txViewAll, "text", "dashboard", "View All Link");
    await updateContentKey("dashboard.transactions.loading", txLoading, "text", "dashboard", "Loading Text");
    await updateContentKey("dashboard.transactions.empty", emptyTx, "text", "dashboard", "Empty Text");
    await updateContentKey("dashboard.transactions.details_btn", txDetailsBtn, "text", "dashboard", "Details Button");
  };
  const saveModal = async () => {
    await updateContentKey("dashboard.modal.title", modalTitle, "text", "dashboard", "Modal Title");
    await updateContentKey("dashboard.modal.amount_label", modalAmount, "text", "dashboard", "Amount Label");
    await updateContentKey("dashboard.modal.before_label", modalBalBefore, "text", "dashboard", "Balance Before Label");
    await updateContentKey("dashboard.modal.new_balance_label", modalNewBal, "text", "dashboard", "New Balance Label");
    await updateContentKey("dashboard.modal.status_label", modalStatus, "text", "dashboard", "Status Label");
    await updateContentKey("dashboard.modal.reason_label", modalReason, "text", "dashboard", "Reason Label");
  };

  return (
    <div className="space-y-6">
      <ContentCard title="Top Header Area" icon={<LayoutDashboard className="h-4 w-4" />} onSave={saveTopHeader}>
        <TextField label="Portfolio Label" value={portfolioLabel} onChange={setPortfolioLabel} updatedAt="Jul 9, 2026 at 10:30 AM" />
        <TextField label="Timeframe Label" value={timeframeLabel} onChange={setTimeframeLabel} updatedAt="Jul 9, 2026 at 10:30 AM" />
        <TextField label="CAD Balance Label" value={cadBalanceLabel} onChange={setCadBalanceLabel} updatedAt="Jul 9, 2026 at 10:30 AM" />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Deposit Button" value={depositBtn} onChange={setDepositBtn} updatedAt="Jul 9, 2026 at 10:30 AM" />
          <TextField label="Withdraw Button" value={withdrawBtn} onChange={setWithdrawBtn} updatedAt="Jul 9, 2026 at 10:30 AM" />
        </div>
      </ContentCard>

      <ContentCard title="Performance Chart" icon={<LayoutDashboard className="h-4 w-4" />} onSave={savePerformance}>
        <TextField label="Section Title" value={perfTitle} onChange={setPerfTitle} updatedAt="Jul 9, 2026 at 10:30 AM" />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="'From date' Placeholder" value={dateFrom} onChange={setDateFrom} updatedAt="Jul 9, 2026 at 10:30 AM" />
          <TextField label="'To date' Placeholder" value={dateTo} onChange={setDateTo} updatedAt="Jul 9, 2026 at 10:30 AM" />
        </div>
        <TextField label="Tooltip Value Label" value={tooltipCad} onChange={setTooltipCad} updatedAt="Jul 9, 2026 at 10:30 AM" />
      </ContentCard>

      <ContentCard title="Asset Allocation" icon={<LayoutDashboard className="h-4 w-4" />} onSave={saveAllocation}>
        <TextField label="Section Title" value={allocTitle} onChange={setAllocTitle} updatedAt="Jul 9, 2026 at 10:30 AM" />
        <TextField label="Empty State Title" value={emptyAssetsTitle} onChange={setEmptyAssetsTitle} updatedAt="Jul 9, 2026 at 10:30 AM" />
        <TextField label="Empty State Sub-text" value={emptyAssetsSub} onChange={setEmptyAssetsSub} updatedAt="Jul 9, 2026 at 10:30 AM" />
      </ContentCard>

      <ContentCard title="Wallets Grid" icon={<LayoutDashboard className="h-4 w-4" />} onSave={saveWallets}>
        <TextField label="Empty State Title" value={emptyWalletsTitle} onChange={setEmptyWalletsTitle} updatedAt="Jul 9, 2026 at 10:30 AM" />
        <TextField label="Empty State Sub-text" value={emptyWalletsSub} onChange={setEmptyWalletsSub} updatedAt="Jul 9, 2026 at 10:30 AM" />
      </ContentCard>

      <ContentCard title="Recent Transactions" icon={<LayoutDashboard className="h-4 w-4" />} onSave={saveTransactions}>
        <TextField label="Section Title" value={txTitle} onChange={setTxTitle} updatedAt="Jul 9, 2026 at 10:30 AM" />
        <TextField label="'View All' Link" value={txViewAll} onChange={setTxViewAll} updatedAt="Jul 9, 2026 at 10:30 AM" />
        <TextField label="Loading State" value={txLoading} onChange={setTxLoading} updatedAt="Jul 9, 2026 at 10:30 AM" />
        <TextField label="Empty State Text" value={emptyTx} onChange={setEmptyTx} updatedAt="Jul 9, 2026 at 10:30 AM" />
        <TextField label="'View Details' Button" value={txDetailsBtn} onChange={setTxDetailsBtn} updatedAt="Jul 9, 2026 at 10:30 AM" />
      </ContentCard>

      <ContentCard title="Transaction Details Modal" icon={<LayoutDashboard className="h-4 w-4" />} onSave={saveModal}>
        <TextField label="Modal Title" value={modalTitle} onChange={setModalTitle} updatedAt="Jul 9, 2026 at 10:30 AM" />
        <TextField label="Amount Label" value={modalAmount} onChange={setModalAmount} updatedAt="Jul 9, 2026 at 10:30 AM" />
        <TextField label="Balance Before Label (Prefix)" value={modalBalBefore} onChange={setModalBalBefore} helper="e.g. 'Total Balance Before [type]'" updatedAt="Jul 9, 2026 at 10:30 AM" />
        <TextField label="New Balance Label" value={modalNewBal} onChange={setModalNewBal} helper="e.g. '[Remaining/New] Available Balance'" updatedAt="Jul 9, 2026 at 10:30 AM" />
        <TextField label="Status Label" value={modalStatus} onChange={setModalStatus} updatedAt="Jul 9, 2026 at 10:30 AM" />
        <TextField label="Rejection Reason Label" value={modalReason} onChange={setModalReason} updatedAt="Jul 9, 2026 at 10:30 AM" />
      </ContentCard>
    </div>
  );
}
