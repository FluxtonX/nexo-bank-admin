import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.from("withdrawal_requests").select("*").limit(1);
  return NextResponse.json({ data, error });
}
