/* ─── General ────────────────────────────────────────────────────── */

export type Status =
  | "active"
  | "inactive"
  | "pending"
  | "suspended"
  | "completed"
  | "cancelled"
  | "processing";

export type BadgeVariant =
  | "badge-success"
  | "badge-warning"
  | "badge-danger"
  | "badge-info"
  | "badge-brand";

export type SortDirection = "asc" | "desc";

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortState<T = string> {
  field: T;
  direction: SortDirection;
}

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

/* ─── User ───────────────────────────────────────────────────────── */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "admin" | "manager" | "viewer";
  status: Status;
  joinedAt: string;
  lastActive: string;
}

/* ─── Stats ──────────────────────────────────────────────────────── */

export interface StatCard {
  id: string;
  label: string;
  value: number | string;
  change: number;
  changeLabel?: string;
  icon: string;
  color: "brand" | "success" | "warning" | "danger" | "info";
  prefix?: string;
  suffix?: string;
}

/* ─── Navigation ─────────────────────────────────────────────────── */

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: number | string;
  children?: NavItem[];
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/* ─── Table ──────────────────────────────────────────────────────── */

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (value: unknown, row: T) => React.ReactNode;
}

/* ─── Chart ──────────────────────────────────────────────────────── */

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

/* ─── Notification ───────────────────────────────────────────────── */

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

/* ─── API Response ───────────────────────────────────────────────── */

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  pagination?: PaginationState;
}
