"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/query-keys";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Request failed: ${url}`);
  }
  return res.json();
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: adminQueryKeys.dashboard(),
    queryFn: () => fetchJson<Record<string, unknown>>("/api/dashboard"),
    staleTime: 30_000,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: adminQueryKeys.users(),
    queryFn: async () => {
      const data = await fetchJson<{ users: unknown[] }>("/api/users");
      return data.users || [];
    },
  });
}

export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: adminQueryKeys.user(userId),
    queryFn: () => fetchJson<Record<string, unknown>>(`/api/users/${userId}`),
    enabled: Boolean(userId),
  });
}

export function useWithdrawals() {
  return useQuery({
    queryKey: adminQueryKeys.withdrawals(),
    queryFn: async () => {
      const data = await fetchJson<{ withdrawals: unknown[] }>("/api/withdrawals");
      return data.withdrawals || [];
    },
    staleTime: 0,
  });
}

export function useDeposits() {
  return useQuery({
    queryKey: adminQueryKeys.deposits(),
    queryFn: async () => {
      const data = await fetchJson<{ deposits: unknown[] }>("/api/deposits");
      return data.deposits || [];
    },
  });
}

export function usePlatformWallets() {
  return useQuery({
    queryKey: adminQueryKeys.platformWallets(),
    queryFn: () => fetchJson<unknown[]>("/api/platform-wallets"),
  });
}

type WithdrawalPatchInput = {
  requestId: string;
  status: string;
  adminNote?: string;
  rejectionReason?: string;
};

export function useUpdateWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: WithdrawalPatchInput) => {
      const res = await fetch("/api/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Withdrawal update failed:", {
          requestId: input.requestId,
          status: input.status,
          error: errData.error,
          details: errData.details,
        });
        throw new Error(errData.error || "Failed to update withdrawal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.withdrawals() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.deposits() });
    },
  });
}

type DepositPatchInput = {
  requestId: string;
  status: string;
  adminNote?: string;
  rejectionReason?: string;
};

export function useUpdateDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DepositPatchInput) => {
      const res = await fetch("/api/deposits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update deposit");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.deposits() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.withdrawals() });
    },
  });
}

type UserAccountPatchInput = {
  userId: string;
  action: "freeze" | "unfreeze";
  reason?: string;
};

export function useUpdateUserAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UserAccountPatchInput) => {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update user account");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(variables.userId) });
    },
  });
}

type UserNoteInput = {
  userId: string;
  note: string;
};

export function useAddUserNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UserNoteInput) => {
      const res = await fetch("/api/users/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to add note");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(variables.userId) });
    },
  });
}

type KycPatchInput = {
  userId: string;
  status: string;
  rejectionReason?: string;
};

export function useUpdateKyc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: KycPatchInput) => {
      const res = await fetch("/api/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update KYC status");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(variables.userId) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
    },
  });
}
