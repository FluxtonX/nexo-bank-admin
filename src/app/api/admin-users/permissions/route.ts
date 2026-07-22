import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { DEMO_ADMIN_EMAIL, ALL_PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin-users/permissions?email=<admin-email>
 * 
 * Returns the permissions array for a given admin user.
 * Used by the client-side AdminPermissionsContext to fetch
 * the current admin's permissions on login.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email query parameter is required" },
        { status: 400 }
      );
    }

    // Demo super admin gets all permissions
    if (email === DEMO_ADMIN_EMAIL) {
      return NextResponse.json({ permissions: ALL_PERMISSIONS });
    }

    const supabaseAdmin = createAdminClient();

    const { data: adminUser, error } = await supabaseAdmin
      .from("admin_users")
      .select("is_active, roles(permissions)")
      .eq("email", email)
      .single();

    if (error || !adminUser) {
      return NextResponse.json({ permissions: [] });
    }

    if (!adminUser.is_active) {
      return NextResponse.json({ permissions: [] });
    }

    const roleData = adminUser.roles as any;
    const permissions: string[] = roleData?.permissions || [];

    return NextResponse.json({ permissions });
  } catch (error: any) {
    console.error("GET /api/admin-users/permissions failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
