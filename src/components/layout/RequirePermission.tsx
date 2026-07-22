"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import type { AdminPermission } from "@/lib/permissions";

interface RequirePermissionProps {
  /** One or more permissions — access is granted if admin has ANY of them */
  permission: AdminPermission | AdminPermission[];
  children: React.ReactNode;
}

/**
 * Wrapper component for page-level RBAC.
 *
 * On mount, checks if the admin has the required permission(s).
 * If not allowed, redirects to /dashboard with a toast message.
 * Super admins always pass.
 *
 * Usage:
 *   <RequirePermission permission="view-users">
 *     <UsersPage />
 *   </RequirePermission>
 *
 *   <RequirePermission permission={["manage-wallets", "view-wallets"]}>
 *     <WalletsPage />
 *   </RequirePermission>
 */
export function RequirePermission({
  permission,
  children,
}: RequirePermissionProps) {
  const { hasAnyPermission, isSuperAdmin, loading } = useAdminPermissions();
  const router = useRouter();
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (isSuperAdmin) return;

    const perms = Array.isArray(permission) ? permission : [permission];
    const allowed = hasAnyPermission(perms);

    if (!allowed) {
      setDenied(true);
      router.replace("/dashboard");
    }
  }, [loading, isSuperAdmin, permission, hasAnyPermission, router]);

  // While loading permissions, show skeleton
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-lg w-64" />
        <div className="h-4 bg-gray-100 rounded-lg w-96" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-24"
            />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-64 mt-4" />
      </div>
    );
  }

  // If denied, show brief access denied message while redirect processes
  if (denied) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
          <svg
            className="h-6 w-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-700">Access Denied</p>
        <p className="text-xs text-gray-600">
          You don&apos;t have permission to view this page. Redirecting…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
