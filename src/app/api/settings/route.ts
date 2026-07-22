import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";

export async function GET(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "edit-settings");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value");

    if (error) {
      console.error("Error fetching settings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert array of {key, value} to an object map
    const settingsMap = data.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ settings: settingsMap });
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "edit-settings");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabase = createAdminClient();
    const payload = await request.json();

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data: existingSettings, error: fetchError } = await supabase
      .from("app_settings")
      .select("key, value");

    if (fetchError) {
      console.error("Error fetching existing settings:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const existingMap = existingSettings.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);

    const updatePromises = [];
    const logPromises = [];

    const adminName = "System Admin"; // Hardcoded for now, could be fetched from session if auth is implemented

    for (const [key, newValue] of Object.entries(payload)) {
      const valueStr = String(newValue);

      // Only update if the value changed or is new
      if (existingMap[key] !== valueStr) {
        // Upsert setting
        updatePromises.push(
          supabase
            .from("app_settings")
            .upsert(
              { key, value: valueStr, updated_by: adminName, updated_at: new Date().toISOString() },
              { onConflict: "key" }
            )
        );

        // Log to security_logs
        logPromises.push(
          supabase.from("security_logs").insert({
            action: "Settings Updated",
            category: "System",
            severity: "Info",
            user_name: adminName,
            user_id: "SYSTEM",
            ip_address: "127.0.0.1",
            details: `Updated setting '${key}' from '${existingMap[key] || "null"}' to '${valueStr}'`,
            user_agent: "System Admin Panel",
            performed_by_admin: true
          })
        );
      }
    }

    const results = await Promise.all([...updatePromises, ...logPromises]);
    
    // Check for errors in results
    const errors = results.filter((res: any) => res.error);
    if (errors.length > 0) {
      console.error("Error updating settings:", errors);
      return NextResponse.json({ error: "Failed to update some settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (error: any) {
    console.error("PATCH /api/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
