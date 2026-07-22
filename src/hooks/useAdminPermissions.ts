"use client";

import { useContext } from "react";
import { AdminPermissionsContext } from "@/context/AdminPermissionsContext";

/**
 * Hook to access admin permissions from the AdminPermissionsContext.
 *
 * Returns:
 * - adminEmail: the logged-in admin's email
 * - isSuperAdmin: true if demo admin (admin@Nexobank.ca)
 * - permissions: array of permission IDs the admin has
 * - loading: true while permissions are being fetched
 * - hasPermission(p): check a single permission
 * - hasAnyPermission(ps): check if admin has any of the given permissions
 */
export function useAdminPermissions() {
  const ctx = useContext(AdminPermissionsContext);
  if (!ctx) {
    throw new Error(
      "useAdminPermissions must be used within an AdminPermissionsProvider"
    );
  }
  return ctx;
}
