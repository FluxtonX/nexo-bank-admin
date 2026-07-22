import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";

export const dynamic = "force-dynamic";

// GET /api/roles
export async function GET(request: Request) {
  try {
    const supabaseAdmin = createAdminClient();

    // Check if any admin users exist (for initial setup scenario)
    const { data: adminUsers, error: countErr } = await supabaseAdmin
      .from("admin_users")
      .select("id", { count: "exact", head: true });

    if (countErr) throw countErr;

    // If no admin users exist, allow unauthenticated access (initial setup)
    const isAdminSetup = !adminUsers || adminUsers.length === 0;

    if (!isAdminSetup) {
      const { allowed } = await checkAdminPermission(request, "manage-roles");
      if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch roles
    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("roles")
      .select("*")
      .order("created_at", { ascending: true });

    if (rolesErr) throw rolesErr;

    // Ensure super_admin role exists and has all permissions
    const allPermissions = [
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

    const superAdminRole = roles?.find((r) => r.code === "super_admin");
    if (!superAdminRole) {
      // Create super_admin role if it doesn't exist
      const { error: insertError } = await supabaseAdmin.from("roles").insert({
        code: "super_admin",
        name: "Super Admin",
        description: "Full access to all features",
        is_active: true,
        permissions: allPermissions,
      });
      if (insertError) console.error("Failed to create super_admin role:", insertError);
      else {
        // Refetch roles after insertion
        const { data: updatedRoles, error: refetchError } = await supabaseAdmin
          .from("roles")
          .select("*")
          .order("created_at", { ascending: true });
        if (!refetchError && updatedRoles) {
          roles.length = 0;
          roles.push(...updatedRoles);
        }
      }
    } else {
      // Update super_admin role permissions if they're incomplete
      const currentPerms = superAdminRole.permissions || [];
      const hasAllPerms = allPermissions.every((p) => currentPerms.includes(p));
      if (!hasAllPerms) {
        const { error: updateError } = await supabaseAdmin
          .from("roles")
          .update({ permissions: allPermissions })
          .eq("code", "super_admin");
        if (updateError) console.error("Failed to update super_admin role permissions:", updateError);
        else {
          // Update the role in the local array
          superAdminRole.permissions = allPermissions;
        }
      }
    }

    // Fetch admin_users to calculate count
    const { data: admins, error: adminsErr } = await supabaseAdmin
      .from("admin_users")
      .select("role_id");

    if (adminsErr) throw adminsErr;

    // Map database structures to frontend expectations
    const mappedRoles = (roles || []).map((role) => {
      const count = (admins || []).filter((admin) => admin.role_id === role.id).length;
      return {
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description || "",
        isActive: role.is_active,
        permissions: role.permissions || [],
        adminCount: count,
      };
    });

    return NextResponse.json({ roles: mappedRoles });
  } catch (error: any) {
    console.error("GET /api/roles failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/roles/reset-super-admin
export async function PUT(request: Request) {
  try {
    const supabaseAdmin = createAdminClient();

    // Check if this is initial setup (no admin users)
    const { data: adminUsers, error: countErr } = await supabaseAdmin
      .from("admin_users")
      .select("id", { count: "exact", head: true });

    if (countErr) throw countErr;

    const isAdminSetup = !adminUsers || adminUsers.length === 0;

    if (!isAdminSetup) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update or create super_admin role with all permissions
    const { data: existingRole } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("code", "super_admin")
      .single();

    const allPermissions = [
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

    let result;
    if (existingRole) {
      // Update existing role
      const { data, error } = await supabaseAdmin
        .from("roles")
        .update({ permissions: allPermissions })
        .eq("code", "super_admin")
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Create new role
      const { data, error } = await supabaseAdmin
        .from("roles")
        .insert({
          code: "super_admin",
          name: "Super Admin",
          description: "Full access to all features",
          is_active: true,
          permissions: allPermissions,
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ role: result });
  } catch (error: any) {
    console.error("PUT /api/roles/reset-super-admin failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/roles
export async function POST(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "manage-roles");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabaseAdmin = createAdminClient();
    const { name, description, isActive, permissions } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    // Generate unique role code
    const { data: existingRoles, error: codeErr } = await supabaseAdmin
      .from("roles")
      .select("code");

    if (codeErr) throw codeErr;

    let nextNum = 1;
    if (existingRoles && existingRoles.length > 0) {
      const nums = existingRoles.map((r) => {
        const match = r.code.match(/ROLE-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });
      nextNum = Math.max(...nums) + 1;
    }
    const code = `ROLE-${String(nextNum).padStart(3, "0")}`;

    const { data, error } = await supabaseAdmin
      .from("roles")
      .insert({
        code,
        name,
        description,
        is_active: isActive ?? true,
        permissions: permissions || [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      role: {
        id: data.id,
        code: data.code,
        name: data.name,
        description: data.description || "",
        isActive: data.is_active,
        permissions: data.permissions || [],
        adminCount: 0,
      },
    });
  } catch (error: any) {
    console.error("POST /api/roles failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/roles
export async function PATCH(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "manage-roles");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabaseAdmin = createAdminClient();
    const { id, name, description, isActive, permissions } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.is_active = isActive;
    if (permissions !== undefined) updates.permissions = permissions;

    const { data, error } = await supabaseAdmin
      .from("roles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      role: {
        id: data.id,
        code: data.code,
        name: data.name,
        description: data.description || "",
        isActive: data.is_active,
        permissions: data.permissions || [],
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/roles failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/roles
export async function DELETE(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "manage-roles");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabaseAdmin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }

    // Check if there are admin users referencing this role
    const { data: admins, error: adminsErr } = await supabaseAdmin
      .from("admin_users")
      .select("id")
      .eq("role_id", id)
      .limit(1);

    if (adminsErr) throw adminsErr;

    if (admins && admins.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete role because it is assigned to one or more admin users." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("roles").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/roles failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
