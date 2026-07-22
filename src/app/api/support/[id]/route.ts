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

    const { id: threadId } = await context.params;
    const supabaseAdmin = createAdminClient();

    // Fetch the thread
    const { data: thread, error: threadError } = await supabaseAdmin
      .from("support_threads")
      .select("*")
      .eq("id", threadId)
      .single();

    if (threadError) throw threadError;
    if (!thread) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Fetch all messages for this thread
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("support_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    // Reset admin unread count
    await supabaseAdmin
      .from("support_threads")
      .update({ unread_count_admin: 0 })
      .eq("id", threadId);

    return NextResponse.json({ thread, messages: messages || [] });
  } catch (error: any) {
    console.error("Error fetching support ticket:", error);
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

    const { id: threadId } = await context.params;
    const { text } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Verify the thread exists
    const { data: thread, error: threadError } = await supabaseAdmin
      .from("support_threads")
      .select("*")
      .eq("id", threadId)
      .single();

    if (threadError) throw threadError;
    if (!thread) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Insert the admin message
    const { data: newMessage, error: messageError } = await supabaseAdmin
      .from("support_messages")
      .insert({
        thread_id: threadId,
        sender: "Admin",
        text: text.trim(),
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Update thread's updated_at and unread count for user
    await supabaseAdmin
      .from("support_threads")
      .update({
        updated_at: new Date().toISOString(),
        unread_count_user: (thread.unread_count_user || 0) + 1,
      })
      .eq("id", threadId);

    // Send notification to user about new message
    await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: thread.user_id,
        audience: "User",
        type: "Info",
        title: "New Support Message",
        message: "You have received a new message from our support team.",
        is_read: false,
        link: "/support/tickets/" + threadId,
      });

    return NextResponse.json({ message: newMessage });
  } catch (error: any) {
    console.error("Error sending admin message:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { allowed } = await checkAdminPermission(request, "view-users");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: threadId } = await context.params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Update the thread status
    const { data: thread, error } = await supabaseAdmin
      .from("support_threads")
      .update({ status })
      .eq("id", threadId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ thread });
  } catch (error: any) {
    console.error("Error updating ticket status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
