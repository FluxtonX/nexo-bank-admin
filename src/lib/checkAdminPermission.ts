/**
 * Server-side RBAC guard for API routes.
 *
 * Reads the admin identity from the `admin_auth` cookie,
 * checks if they have the required permission, and returns the result.
 *
 * Usage at the top of any protected API handler:
 *   const { allowed, adminEmail } = await checkAdminPermission(request, "view-users");
 *   if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 */

import { createAdminClient } from "@/lib/supabase-admin";
import { DEMO_ADMIN_EMAIL, type AdminPermission } from "@/lib/permissions";

interface PermissionResult {
  allowed: boolean;
  adminEmail: string;
}

/**
 * Parse the `admin_auth` cookie value from a Request's Cookie header.
 */
function getAdminEmailFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.split("=");
    if (name === "admin_auth") {
      const value = rest.join("="); // handle values that might contain '='
      if (value && value !== "true") {
        return decodeURIComponent(value);
      }
      // Legacy "true" value — treat as demo admin for backward compat
      if (value === "true") {
        return DEMO_ADMIN_EMAIL;
      }
    }
  }
  return null;
}

export async function checkAdminPermission(
  request: Request,
  requiredPermission: AdminPermission
): Promise<PermissionResult> {
  const adminEmail = getAdminEmailFromRequest(request);

  if (!adminEmail) {
    return { allowed: false, adminEmail: "" };
  }

  // Demo super admin bypasses all permission checks
  if (adminEmail === DEMO_ADMIN_EMAIL) {
    return { allowed: true, adminEmail };
  }

  // Real admin — look up their role permissions from Supabase
  try {
    const supabaseAdmin = createAdminClient();

    const { data: adminUser, error } = await supabaseAdmin
      .from("admin_users")
      .select("role_id, is_active, roles(permissions)")
      .eq("email", adminEmail)
      .single();

    if (error || !adminUser) {
      console.warn(`[RBAC] Admin not found for email: ${adminEmail}`);
      return { allowed: false, adminEmail };
    }

    // Inactive admins are denied
    if (!adminUser.is_active) {
      return { allowed: false, adminEmail };
    }

    // Extract permissions from the joined role
    const roleData = adminUser.roles as any;
    const permissions: string[] = roleData?.permissions || [];

    const allowed = permissions.includes(requiredPermission);
    return { allowed, adminEmail };
  } catch (err) {
    console.error("[RBAC] Permission check failed:", err);
    return { allowed: false, adminEmail };
  }
}
