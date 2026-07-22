"use client";

import React, { createContext, useEffect, useState, useCallback } from "react";
import {
  ALL_PERMISSIONS,
  DEMO_ADMIN_EMAIL,
  type AdminPermission,
} from "@/lib/permissions";

/* ─── Context Shape ──────────────────────────────────────────────── */

interface AdminPermissionsContextValue {
  /** The logged-in admin's email (from cookie) */
  adminEmail: string;
  /** Whether this is the demo super admin */
  isSuperAdmin: boolean;
  /** The list of permission IDs the admin has */
  permissions: AdminPermission[];
  /** Whether the initial permission fetch is still in progress */
  loading: boolean;
  /** Check if the admin has a specific permission */
  hasPermission: (permission: AdminPermission) => boolean;
  /** Check if admin has ANY of the given permissions */
  hasAnyPermission: (permissions: AdminPermission[]) => boolean;
}

export const AdminPermissionsContext =
  createContext<AdminPermissionsContextValue | null>(null);

/* ─── Cookie Parser ──────────────────────────────────────────────── */

function getAdminEmailFromCookie(): string {
  if (typeof document === "undefined") return "";
  const cookies = document.cookie.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.split("=");
    if (name === "admin_auth") {
      const value = rest.join("=");
      if (value && value !== "true") {
        return decodeURIComponent(value);
      }
      // Legacy "true" value — treat as demo admin
      if (value === "true") {
        return DEMO_ADMIN_EMAIL;
      }
    }
  }
  return "";
}

/* ─── Provider ───────────────────────────────────────────────────── */

export function AdminPermissionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [adminEmail, setAdminEmail] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = getAdminEmailFromCookie();
    setAdminEmail(email);

    if (!email) {
      setLoading(false);
      return;
    }

    // Demo super admin — grant everything immediately
    if (email === DEMO_ADMIN_EMAIL) {
      setIsSuperAdmin(true);
      setPermissions([...ALL_PERMISSIONS]);
      setLoading(false);
      return;
    }

    // Real admin — fetch their role permissions from the API
    const fetchPermissions = async () => {
      try {
        const res = await fetch(
          `/api/admin-users/permissions?email=${encodeURIComponent(email)}`
        );
        if (res.ok) {
          const data = await res.json();
          setPermissions((data.permissions || []) as AdminPermission[]);
        } else {
          console.warn("[RBAC] Failed to fetch admin permissions");
          setPermissions([]);
        }
      } catch (err) {
        console.error("[RBAC] Error fetching permissions:", err);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasPermission = useCallback(
    (permission: AdminPermission): boolean => {
      if (isSuperAdmin) return true;
      return permissions.includes(permission);
    },
    [isSuperAdmin, permissions]
  );

  const hasAnyPermission = useCallback(
    (perms: AdminPermission[]): boolean => {
      if (isSuperAdmin) return true;
      return perms.some((p) => permissions.includes(p));
    },
    [isSuperAdmin, permissions]
  );

  return (
    <AdminPermissionsContext.Provider
      value={{
        adminEmail,
        isSuperAdmin,
        permissions,
        loading,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AdminPermissionsContext.Provider>
  );
}
