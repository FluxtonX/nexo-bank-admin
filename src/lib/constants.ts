/**
 * Application-wide constants
 */

export const APP_NAME = "CDNTB Admin";
export const APP_VERSION = "1.0.0";

export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_COLLAPSED_WIDTH = 72;

export const ROUTES = {
  root: "/",
  login: "/login",
  dashboard: "/dashboard",
  analytics: "/dashboard/analytics",
  users: "/dashboard/users",
  products: "/dashboard/products",
  orders: "/dashboard/orders",
  settings: "/dashboard/settings",
  profile: "/dashboard/profile",
  notifications: "/dashboard/notifications",
  kyc: "/dashboard/kyc",
} as const;

export const STATUS_LABELS = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  suspended: "Suspended",
  completed: "Completed",
  cancelled: "Cancelled",
  processing: "Processing",
} as const;

export const STATUS_VARIANTS = {
  active: "badge-success",
  inactive: "badge-warning",
  pending: "badge-info",
  suspended: "badge-danger",
  completed: "badge-success",
  cancelled: "badge-danger",
  processing: "badge-brand",
} as const;

export const PAGINATION_SIZES = [10, 20, 50, 100] as const;

export const DATE_RANGES = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 3 months", value: "3m" },
  { label: "Last 12 months", value: "12m" },
  { label: "All time", value: "all" },
] as const;
