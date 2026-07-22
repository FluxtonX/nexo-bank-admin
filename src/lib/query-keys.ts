export const adminQueryKeys = {
  all: ["admin"] as const,
  dashboard: () => [...adminQueryKeys.all, "dashboard"] as const,
  users: () => [...adminQueryKeys.all, "users"] as const,
  user: (id: string) => [...adminQueryKeys.all, "users", id] as const,
  withdrawals: () => [...adminQueryKeys.all, "withdrawals"] as const,
  deposits: () => [...adminQueryKeys.all, "deposits"] as const,
  platformWallets: () => [...adminQueryKeys.all, "platform-wallets"] as const,
};
