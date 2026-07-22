import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { allowed } = await checkAdminPermission(request, "manage-tickets");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabaseAdmin = createAdminClient();
    const { id: threadId } = await context.params;

    // Delete messages first
    const { error: deleteMessagesError } = await supabaseAdmin
      .from("support_messages")
      .delete()
      .eq("thread_id", threadId);
    
    if (deleteMessagesError) throw deleteMessagesError;

    // Delete the thread
    const { error: deleteThreadError } = await supabaseAdmin
      .from("support_threads")
      .delete()
      .eq("id", threadId);

    if (deleteThreadError) throw deleteThreadError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting support ticket:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
