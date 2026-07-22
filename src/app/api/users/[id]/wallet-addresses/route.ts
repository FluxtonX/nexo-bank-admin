import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { allowed } = await checkAdminPermission(request, "view-users");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: userId } = await context.params;
    const supabaseAdmin = createAdminClient();

    const { data: addresses, error } = await supabaseAdmin
      .from("user_wallet_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("crypto", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ addresses: addresses || [] });
  } catch (error: any) {
    console.error("Error fetching user wallet addresses:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { allowed } = await checkAdminPermission(request, "view-users");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: userId } = await context.params;
    const { crypto, network, address } = await request.json();

    if (!crypto || !network || !address) {
      return NextResponse.json({ error: "crypto, network, and address are required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Verify user exists before setting address
    const { data: user } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert the address (insert or update if exists)
    const { data, error } = await supabaseAdmin
      .from("user_wallet_addresses")
      .upsert({
        user_id: userId,
        crypto: crypto.toUpperCase(),
        network,
        address: address.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ address: data });
  } catch (error: any) {
    console.error("Error setting user wallet address:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { allowed } = await checkAdminPermission(request, "view-users");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: userId } = await context.params;
    const { searchParams } = new URL(request.url);
    const crypto = searchParams.get("crypto");
    const network = searchParams.get("network");

    if (!crypto || !network) {
      return NextResponse.json({ error: "crypto and network query parameters are required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
      .from("user_wallet_addresses")
      .delete()
      .eq("user_id", userId)
      .eq("crypto", crypto.toUpperCase())
      .eq("network", network);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user wallet address:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
