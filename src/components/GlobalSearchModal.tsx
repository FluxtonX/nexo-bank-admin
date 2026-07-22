"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, User, ArrowDownToLine, ArrowLeftRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type SearchResult = {
  users: Array<{ id: string; full_name: string; email: string }>;
  deposits: Array<{ id: string; asset: string; expected_amount: number; status: string }>;
  withdrawals: Array<{ id: string; amount: number; status: string; interac_email: string }>;
};

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ users: [], deposits: [], withdrawals: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults({ users: [], deposits: [], withdrawals: [] });
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const handleUserClick = (userId: string) => {
    onClose();
    router.push(`/dashboard/users/${userId}`);
  };

  const handleDepositClick = () => {
    onClose();
    router.push("/dashboard/transactions");
  };

  const handleWithdrawalClick = () => {
    onClose();
    router.push("/dashboard/withdrawals");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const hasResults = results.users.length > 0 || results.deposits.length > 0 || results.withdrawals.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 border border-gray-200 overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <Search className="h-5 w-5 text-gray-600" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users, transactions, withdrawals..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-500"
              />
              {loading && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-700 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {query.length < 2 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  Type at least 2 characters to search
                </div>
              ) : loading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                </div>
              ) : !hasResults ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Users Section */}
                  {results.users.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        Users
                      </h3>
                      <div className="space-y-2">
                        {results.users.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleUserClick(user.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-left"
                          >
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {getInitials(user.full_name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {highlightMatch(user.full_name, query)}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {highlightMatch(user.email, query)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deposits Section */}
                  {results.deposits.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Deposits
                      </h3>
                      <div className="space-y-2">
                        {results.deposits.map((deposit) => (
                          <button
                            key={deposit.id}
                            onClick={handleDepositClick}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-left"
                          >
                            <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                              <ArrowLeftRight className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {highlightMatch(deposit.id, query)}
                              </p>
                              <p className="text-xs text-gray-600">
                                {deposit.asset} · ${deposit.expected_amount.toLocaleString()}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                                deposit.status === "approved"
                                  ? "bg-green-50 text-green-700"
                                  : deposit.status === "pending"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-gray-100 text-gray-600"
                              )}
                            >
                              {deposit.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Withdrawals Section */}
                  {results.withdrawals.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                        Withdrawals
                      </h3>
                      <div className="space-y-2">
                        {results.withdrawals.map((withdrawal) => (
                          <button
                            key={withdrawal.id}
                            onClick={handleWithdrawalClick}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-left"
                          >
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                              <ArrowDownToLine className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {highlightMatch(withdrawal.id, query)}
                              </p>
                              <p className="text-xs text-gray-600">
                                ${withdrawal.amount.toLocaleString()} · {withdrawal.interac_email}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                                withdrawal.status === "approved" || withdrawal.status === "completed"
                                  ? "bg-green-50 text-green-700"
                                  : withdrawal.status === "pending"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-gray-100 text-gray-600"
                              )}
                            >
                              {withdrawal.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 font-mono text-[10px]">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 font-mono text-[10px]">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 font-mono text-[10px]">Esc</kbd>
                  Close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
