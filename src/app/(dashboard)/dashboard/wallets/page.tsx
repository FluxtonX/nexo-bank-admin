"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import { usePlatformWallets } from "@/hooks/useAdminQueries";
import { useQueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/query-keys";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Download,
  X,
  ShieldCheck,
  Check,
  Copy,
  Coins,
  Pencil,
  Plus,
} from "lucide-react";
import { COIN_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { RequirePermission } from "@/components/layout/RequirePermission";

type WalletStatus = "Active" | "Paused" | "Suspended";

type Wallet = {
  wallet_id: string;
  crypto: string;
  network: string;
  address: string;
  balance_crypto: string;
  balance_cad: number;
  status: WalletStatus;
  last_activity: string;
};

const BRAND_GRADIENT = "linear-gradient(135deg, #0A3D91 0%, #1650AB 100%)";

function StatusBadge({ status }: { status: WalletStatus }) {
  const map: Record<WalletStatus, string> = {
    Active: "bg-green-50 text-green-700 border-green-200",
    Paused: "bg-amber-50 text-amber-700 border-amber-200",
    Suspended: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase font-mono tracking-wider", map[status])}>
      {status}
    </span>
  );
}

/* ─── Edit Address Modal ─────────────────────────────────────── */
function EditAddressModal({
  wallet,
  onClose,
  onSaved,
}: {
  wallet: Wallet;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [address, setAddress] = useState(wallet.address);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!address.trim()) {
      setError("Address cannot be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/platform-wallets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_id: wallet.wallet_id, address: address.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save address");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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
              <p className="text-sm text-gray-600 mt-0.5">
                {wallet.crypto} · {wallet.network}
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Wallet Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              placeholder="Enter wallet address"
            />
            {error && (
              <p className="text-xs text-red-600 mt-1.5">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-all"
              style={{ background: BRAND_GRADIENT }}
            >
              {saving ? "Saving…" : "Save Address"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Create Wallet Modal ─────────────────────────────────────── */
function CreateWalletModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [crypto, setCrypto] = useState("");
  const [network, setNetwork] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<WalletStatus>("Active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!crypto.trim() || !network.trim() || !address.trim()) {
      setError("Crypto, network, and address are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/platform-wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crypto: crypto.trim().toUpperCase(),
          network: network.trim(),
          address: address.trim(),
          status,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create wallet");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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
              <h2 className="text-[17px] font-bold text-gray-900">Create New Wallet</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Add a new platform deposit wallet
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Crypto Symbol
              </label>
              <input
                type="text"
                value={crypto}
                onChange={(e) => setCrypto(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                placeholder="e.g. SOL, USDC"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Network Name
              </label>
              <input
                type="text"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                placeholder="e.g. Solana, ERC20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Wallet Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                placeholder="Enter wallet address"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as WalletStatus)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              >
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-all"
              style={{ background: BRAND_GRADIENT }}
            >
              {saving ? "Creating…" : "Create Wallet"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function WalletManagementPage() {
  return (
    <RequirePermission permission={["manage-wallets", "view-wallets"]}>
      <WalletManagementPageContent />
    </RequirePermission>
  );
}

function WalletManagementPageContent() {
  const queryClient = useQueryClient();
  const { data: walletData = [], isLoading: loading } = usePlatformWallets();
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [creatingWallet, setCreatingWallet] = useState(false);

  const wallets = useMemo(() => {
    const mappedWallets: Wallet[] = (walletData as any[]).map((w: any) => ({
      wallet_id: w.wallet_id,
      crypto: w.crypto,
      network: w.network,
      address: w.address,
      balance_crypto: w.balance_crypto,
      balance_cad: Number(w.balance_cad),
      status: w.status as WalletStatus,
      last_activity: w.last_activity,
    }));
    return mappedWallets;
  }, [walletData]);

  const stats = useMemo(() => {
    const totalSum = wallets.reduce((acc, w) => acc + w.balance_cad, 0);

    return [
      {
        label: "Platform Wallets",
        value: `$${totalSum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        note: `${wallets.length} ${wallets.length === 1 ? "wallet" : "wallets"}`,
        noteTone: "text-gray-600",
        icon: (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
            <Coins className="h-5.5 w-5.5" />
          </div>
        ),
      },
    ];
  }, [wallets]);

  const filteredWallets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return wallets.filter((w) => {
      return (
        !query ||
        w.crypto.toLowerCase().includes(query) ||
        w.network.toLowerCase().includes(query) ||
        w.address.toLowerCase().includes(query)
      );
    });
  }, [wallets, search]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleAddressSaved = () => {
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.platformWallets() });
    setToast("Wallet address updated successfully.");
    window.setTimeout(() => setToast(null), 2500);
  };

  const handleWalletCreated = () => {
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.platformWallets() });
    setToast("Wallet created successfully.");
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
            <h1 className="text-[26px] font-bold leading-tight text-gray-900 sm:text-[30px]">Platform Wallets</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Monitor and manage platform deposit addresses</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setToast("Wallet report export prepared.");
                window.setTimeout(() => setToast(null), 2500);
              }}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Export Report
            </button>
            <button
              onClick={() => setCreatingWallet(true)}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Wallet
            </button>
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
              <Check className="h-4 w-4 text-green-400 shrink-0" />
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Counter cards */}
        <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-1">
          {stats.map((stat) => (
            <div key={stat.label} className="flex min-h-[120px] items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold leading-none text-gray-900">{stat.value}</p>
                <p className={cn("text-xs text-gray-600 font-semibold mt-1", stat.noteTone)}>{stat.note}</p>
              </div>
              {stat.icon}
            </div>
          ))}
        </div>

        {/* Table & search container */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by crypto, network, or address..."
                className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-11 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-500 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 sm:text-base"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <div className="grid min-w-[1200px] grid-cols-[1fr_1.5fr_3fr_1.5fr_1.5fr_1fr_1.5fr_1.2fr] gap-4 bg-gray-50 px-5 py-3 border-b border-gray-200/80">
              {["Crypto", "Network", "Address", "Balance Crypto", "Balance CAD", "Status", "Last Activity", "Actions"].map((heading) => (
                <span key={heading} className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 font-mono">{heading}</span>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-[1200px] divide-y divide-gray-100 bg-white"
                >
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_1.5fr_3fr_1.5fr_1.5fr_1fr_1.5fr_1.2fr] gap-4 items-center px-5 py-4.5">
                      <div className="h-4 bg-gray-100 rounded-lg w-10 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded-lg w-20 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded-lg w-48 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded-lg w-16 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded-lg w-16 animate-pulse" />
                      <div className="h-6 bg-gray-100 rounded-full w-14 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded-lg w-20 animate-pulse" />
                      <div className="h-8 bg-gray-100 rounded-lg w-24 animate-pulse" />
                    </div>
                  ))}
                </motion.div>
              ) : wallets.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-w-[1200px] py-16 text-center text-sm font-medium text-gray-600 bg-white"
                >
                  No wallets configured yet.
                </motion.div>
              ) : filteredWallets.length === 0 ? (
                <motion.div
                  key="empty-search"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-w-[1200px] py-16 text-center text-sm font-medium text-gray-600 bg-white"
                >
                  No wallets found matching your search.
                </motion.div>
              ) : (
                <motion.div key={search} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {filteredWallets.map((wallet, idx) => (
                    <div
                      key={wallet.wallet_id || idx}
                      className="grid min-w-[1200px] grid-cols-[1fr_1.5fr_3fr_1.5fr_1.5fr_1fr_1.5fr_1.2fr] items-center gap-4 border-b border-gray-100 bg-white px-5 py-4 transition-colors hover:bg-blue-50/20"
                    >
                      {/* Crypto */}
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: COIN_COLORS[wallet.crypto as keyof typeof COIN_COLORS] || '#6B7280' }}>
                          {wallet.crypto.slice(0, 2)}
                        </div>
                        <span className="font-bold text-gray-900 text-sm">{wallet.crypto}</span>
                      </div>

                      {/* Network */}
                      <div className="text-xs font-semibold text-gray-600">{wallet.network}</div>

                      {/* Address */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-600 tracking-tight truncate max-w-[200px]" title={wallet.address}>
                          {wallet.address
                            ? `${wallet.address.slice(0, 12)}...${wallet.address.slice(-8)}`
                            : "No address set"}
                        </span>
                        {wallet.address && (
                          <button
                            onClick={() => handleCopyAddress(wallet.address)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                            title="Copy address"
                          >
                            {copiedAddress === wallet.address ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>

                      {/* Balance Crypto */}
                      <div className="font-extrabold text-gray-900 text-xs font-mono">{wallet.balance_crypto ?? "—"}</div>

                      {/* Balance CAD */}
                      <div className="font-extrabold text-gray-900 text-xs font-mono">
                        {wallet.balance_cad != null ? `$${wallet.balance_cad.toLocaleString()}` : "—"}
                      </div>

                      {/* Status */}
                      <div><StatusBadge status={wallet.status} /></div>

                      {/* Last Activity */}
                      <div className="text-xs font-semibold text-gray-600 font-mono">{wallet.last_activity ?? "—"}</div>

                      {/* Actions */}
                      <div>
                        <button
                          onClick={() => setEditingWallet(wallet)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit Address
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/60 px-5 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing <strong className="text-gray-700">{filteredWallets.length}</strong> of <strong className="text-gray-700">{wallets.length}</strong> wallets
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <ShieldCheck className="h-4 w-4 text-[#0A3D91]" />
              Secure cryptographic vault interface
            </div>
          </div>
        </section>
      </motion.div>

      {/* Edit Address Modal */}
      <AnimatePresence>
        {editingWallet && (
          <EditAddressModal
            wallet={editingWallet}
            onClose={() => setEditingWallet(null)}
            onSaved={handleAddressSaved}
          />
        )}
      </AnimatePresence>

      {/* Create Wallet Modal */}
      <AnimatePresence>
        {creatingWallet && (
          <CreateWalletModal
            onClose={() => setCreatingWallet(false)}
            onSaved={handleWalletCreated}
          />
        )}
      </AnimatePresence>
    </>
  );
}
