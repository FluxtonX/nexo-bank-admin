import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const category = searchParams.get("category") || "All";
    const severity = searchParams.get("severity") || "All";

    // Build the query
    let query = supabase
      .from("security_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    // Category filter
    if (category !== "All") {
      query = query.eq("category", category);
    }

    // Severity filter
    if (severity !== "All") {
      query = query.eq("severity", severity);
    }

    const { data: dbLogs, error } = await query;

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    // Format logs and apply search filter (search is done in JS for easier cross-column text matching)
    let logs = (dbLogs || []).map(log => ({
      id: log.id,
      timestamp: new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }),
      action: log.action,
      category: log.category,
      severity: log.severity,
      user: log.user_name,
      userId: log.user_id,
      ipAddress: log.ip_address,
      details: log.details,
      userAgent: log.user_agent,
      performedByAdmin: log.performed_by_admin
    }));

    if (search) {
      logs = logs.filter(log => 
        log.action.toLowerCase().includes(search) ||
        log.user.toLowerCase().includes(search) ||
        log.details.toLowerCase().includes(search) ||
        log.ipAddress.toLowerCase().includes(search)
      );
    }

    // Calculate dynamic stats based on filtered logs
    const stats = {
      totalEvents: logs.length,
      failedLogins: logs.filter(l => l.action.includes("Failed Login")).length,
      activeThreats: logs.filter(l => l.severity === "Critical").length,
      highRiskEvents: logs.filter(l => l.severity === "Warning" || l.severity === "Critical").length
    };

    return NextResponse.json({ logs, stats });
  } catch (error: any) {
    console.error("Error fetching security logs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { action, category, severity, userName, userId, ipAddress, details, userAgent, performedByAdmin } = body;

    const { data, error } = await supabase
      .from("security_logs")
      .insert({
        action,
        category,
        severity,
        user_name: userName,
        user_id: userId,
        ip_address: ipAddress || request.headers.get("x-forwarded-for") || "127.0.0.1",
        details,
        user_agent: userAgent || request.headers.get("user-agent") || "Unknown",
        performed_by_admin: performedByAdmin
      })
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, log: data[0] });
  } catch (error: any) {
    console.error("POST Security Log Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

