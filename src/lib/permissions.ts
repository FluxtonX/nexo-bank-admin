/**
 * Central RBAC Permission Configuration
 * 
 * Single source of truth for all permission IDs, nav-item mappings,
 * page-route mappings, and API-route mappings.
 */

/* ─── Permission Type ────────────────────────────────────────────── */

export type AdminPermission =
  | "view-users"
  | "edit-users"
  | "delete-users"
  | "review-kyc"
  | "view-docs"
  | "approve-withdrawals"
  | "view-transactions"
  | "manage-wallets"
  | "view-wallets"
  | "edit-settings"
  | "manage-roles"
  | "view-reports"
  | "respond-chat"
  | "manage-tickets";

/** Complete list of every permission in the system */
export const ALL_PERMISSIONS: AdminPermission[] = [
  "view-users",
  "edit-users",
  "delete-users",
  "review-kyc",
  "view-docs",
  "approve-withdrawals",
  "view-transactions",
  "manage-wallets",
  "view-wallets",
  "edit-settings",
  "manage-roles",
  "view-reports",
  "respond-chat",
  "manage-tickets",
];

/* ─── Demo Super Admin ───────────────────────────────────────────── */

export const DEMO_ADMIN_EMAIL = "admin@Nexobank.ca";

/* ─── Sidebar Nav → Permissions ──────────────────────────────────── */

/**
 * Maps each sidebar nav-item `id` to the permissions required to see it.
 * Empty array = always visible (unrestricted).
 * If admin has ANY of the listed permissions, the nav item is shown.
 */
export const NAV_PERMISSION_MAP: Record<string, AdminPermission[]> = {
  dashboard: [],                                        // always visible
  users: ["view-users", "edit-users", "delete-users"],
  kyc: ["review-kyc", "view-docs"],
  withdrawals: ["approve-withdrawals"],
  transactions: ["view-transactions"],
  wallets: ["manage-wallets", "view-wallets"],
  portfolio: ["manage-wallets", "view-wallets"],
  interac: ["approve-withdrawals"],
  notifications: [],                                    // unrestricted
  "live-chat": ["respond-chat", "manage-tickets"],
  reports: ["view-reports"],
  "admin-roles": ["manage-roles"],
  security: [],                                         // unrestricted
  settings: ["edit-settings"],
  "content-management": ["edit-settings"],
};

/* ─── Page Path → Permissions ────────────────────────────────────── */

/**
 * Maps each dashboard page path to the permissions required to access it.
 * Pages not listed here are unrestricted (Dashboard, Notifications, Security).
 * If admin has ANY of the listed permissions, the page is accessible.
 */
export const PAGE_PERMISSION_MAP: Record<string, AdminPermission[]> = {
  "/dashboard/users": ["view-users", "edit-users", "delete-users"],
  "/dashboard/kyc": ["review-kyc", "view-docs"],
  "/dashboard/withdrawals": ["approve-withdrawals"],
  "/dashboard/interac": ["approve-withdrawals"],
  "/dashboard/transactions": ["view-transactions"],
  "/dashboard/wallets": ["manage-wallets", "view-wallets"],
  "/dashboard/portfolio": ["manage-wallets", "view-wallets"],
  "/dashboard/settings": ["edit-settings"],
  "/dashboard/content-management": ["edit-settings"],
  "/dashboard/admin-roles": ["manage-roles"],
  "/dashboard/reports": ["view-reports"],
  "/dashboard/live-chat": ["respond-chat", "manage-tickets"],
};

/* ─── API Route → Permission ─────────────────────────────────────── */

/**
 * Maps each protected API route prefix to its required permission.
 * Routes not listed here are unrestricted (dashboard, send-2fa, security-logs, notifications).
 */
export const API_PERMISSION_MAP: Record<string, AdminPermission> = {
  "/api/users": "view-users",
  "/api/kyc": "review-kyc",
  "/api/withdrawals": "approve-withdrawals",
  "/api/deposits": "view-transactions",
  "/api/platform-wallets": "manage-wallets",
  "/api/portfolio": "view-wallets",
  "/api/settings": "edit-settings",
  "/api/roles": "manage-roles",
  "/api/admin-users": "manage-roles",
  "/api/reports": "view-reports",
  "/api/support": "respond-chat",
};
