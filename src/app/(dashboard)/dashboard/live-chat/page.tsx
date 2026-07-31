"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Send,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  ShieldCheck,
  Loader2,
  Edit2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type AdminUser } from "@/lib/data/users";
import { supabase } from "@/lib/supabase";
import { RequirePermission } from "@/components/layout/RequirePermission";

type ChatStatus = "Active" | "Waiting" | "Resolved" | "Closed";

type Message = {
  id: string;
  sender: "Client" | "Admin";
  text: string;
  timestamp: string;
  is_edited?: boolean;
  deleted_for_admin?: boolean;
};

type ChatThread = {
  threadId: string;
  user: AdminUser;
  status: ChatStatus;
  unreadCount: number;
  unreadCountUser: number;
  lastMessageTime: string;
  messages: Message[];
  lastMessageAtISO: string;
  is_ticket?: boolean;
  category?: string;
  ticket_id?: string;
};

const BRAND_GRADIENT = "linear-gradient(135deg, #064e3b 0%, #047857 100%)";

/* ─── User Avatar Component with 3-tier Fallback ─────────────────────────────────────── */
function UserAvatar({
  user,
  size = "md",
}: {
  user: AdminUser;
  size?: "sm" | "md";
}) {
  const [imageError, setImageError] = useState(false);
  const [currentSource, setCurrentSource] = useState<"kyc" | "google" | "initials">("kyc");

  const sizeClasses = size === "sm" ? "h-7 w-7 rounded-lg text-xs" : "h-9 w-9 rounded-xl text-sm";

  // Determine which image source to use
  const getImageUrl = () => {
    if (currentSource === "kyc" && user.kyc_selfie_url) {
      return user.kyc_selfie_url;
    }
    if (currentSource === "google" && user.google_avatar_url) {
      return user.google_avatar_url;
    }
    return null;
  };

  const imageUrl = getImageUrl();

  const handleImageError = () => {
    console.log(`[UserAvatar] Image load error for ${user.name}, source: ${currentSource}, url: ${imageUrl}`);
    if (currentSource === "kyc" && user.google_avatar_url) {
      setCurrentSource("google");
    } else {
      setCurrentSource("initials");
      setImageError(true);
    }
  };

  // Reset to KYC when user changes
  useEffect(() => {
    console.log(`[UserAvatar] User changed to ${user.name}, KYC URL: ${user.kyc_selfie_url}, Google URL: ${user.google_avatar_url}`);
    setCurrentSource("kyc");
    setImageError(false);
  }, [user.id, user.kyc_selfie_url, user.google_avatar_url]);

  if (currentSource === "initials" || !imageUrl) {
    return (
      <div className={`${sizeClasses} bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 font-bold font-mono shrink-0`}>
        {user.name[0] || "U"}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={user.name}
      onError={handleImageError}
      className={`${sizeClasses} object-cover shrink-0`}
    />
  );
}

function StatusIndicator({ status }: { status: ChatStatus }) {
  const map: Record<ChatStatus, string> = {
    Active: "bg-green-500",
    Waiting: "bg-amber-500",
    Resolved: "bg-gray-400",
    Closed: "bg-gray-700",
  };
  return <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", map[status])} />;
}

export default function LiveChatSupportPage() {
  return (
    <RequirePermission permission={["respond-chat", "manage-tickets"]}>
      <Suspense fallback={<div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-500" /></div>}>
        <LiveChatSupportPageContent />
      </Suspense>
    </RequirePermission>
  );
}

function LiveChatSupportPageContent() {
  const searchParams = useSearchParams();
  const initialThreadId = searchParams.get("thread");
  
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [deletingThread, setDeletingThread] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch threads from Supabase
  useEffect(() => {
    async function fetchThreads() {
      setLoading(true);
      try {
        // Fetch threads
        const { data, error } = await supabase
          .from("support_threads")
          .select("id, status, unread_count_admin, unread_count_user, last_message_at, user_id, is_ticket, category, ticket_id")
          .order("last_message_at", { ascending: false });

        // Fetch auth users (with resolved full names from kyc/profiles/email)
        let authUsersMap: Record<string, { email: string; fullName: string; kycSelfieUrl: string | null; googleAvatarUrl: string | null }> = {};
        try {
          const res = await fetch("/api/support/users");
          if (res.ok) {
            const usersData = await res.json();
            authUsersMap = usersData.reduce(
              (acc: Record<string, { email: string; fullName: string; kycSelfieUrl: string | null; googleAvatarUrl: string | null }>, u: { id: string; email: string; full_name: string | null; kyc_selfie_url: string | null; google_avatar_url: string | null }) => {
                acc[u.id] = {
                  email: u.email,
                  fullName: u.full_name || u.email?.split("@")[0] || "Unknown User",
                  kycSelfieUrl: u.kyc_selfie_url || null,
                  googleAvatarUrl: u.google_avatar_url || null,
                };
                return acc;
              },
              {}
            );
          }
        } catch { /* silently fallback */ }

        if (error) throw error;

        if (data) {
          const mappedThreads: ChatThread[] = data.map((t: any) => {
            const authEntry = authUsersMap[t.user_id];
            const adminUser: AdminUser = {
              id: t.user_id,
              name: authEntry?.fullName || "Unknown User",
              email: authEntry?.email || "N/A",
              phone: "N/A",
              kyc: "Not Started",
              account: "Active",
              balance: 0,
              joinedDate: "",
              risk: "Low Risk",
              dateOfBirth: "",
              street: "",
              city: "",
              postalCode: "",
              country: "",
              lastLogin: "",
              twoFactor: false,
              lastIp: "",
              kyc_selfie_url: authEntry?.kycSelfieUrl || null,
              google_avatar_url: authEntry?.googleAvatarUrl || null,
            };

            return {
              threadId: t.id,
              user: adminUser,
              status: t.status as ChatStatus,
              unreadCount: t.unread_count_admin,
              unreadCountUser: t.unread_count_user,
              lastMessageTime: new Date(t.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              messages: [],
              lastMessageAtISO: t.last_message_at,
              is_ticket: t.is_ticket,
              category: t.category,
              ticket_id: t.ticket_id,
            };
          });

          setThreads(mappedThreads);

          if (mappedThreads.length > 0) {
            if (initialThreadId && mappedThreads.some((th: any) => th.threadId === initialThreadId)) {
              setActiveThreadId(initialThreadId);
            } else {
              setActiveThreadId(mappedThreads[0].threadId);
            }
          }
        }
      } catch (err) {
        console.error("Error loading chat threads:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchThreads();
  }, []);

  // Fetch messages dynamically when selected thread changes
  useEffect(() => {
    if (!activeThreadId) return;

    async function fetchMessages() {
      try {
        const { data, error } = await supabase
          .from("support_messages")
          .select("*")
          .eq("thread_id", activeThreadId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data) {
          const mappedMsgs: Message[] = data
            .filter((m: any) => !m.deleted_for_admin)
            .map((m: any) => ({
              id: m.id,
              sender: m.sender as "Client" | "Admin",
              text: m.text,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              is_edited: m.is_edited,
            }));

          setThreads((current) =>
            current.map((t) => (t.threadId === activeThreadId ? { ...t, messages: mappedMsgs } : t))
          );
        }

        // Reset admin unread count
        const thread = threads.find((t) => t.threadId === activeThreadId);
        if (thread && thread.unreadCount > 0) {
          await supabase
            .from("support_threads")
            .update({ unread_count_admin: 0 })
            .eq("id", activeThreadId);

          setThreads((current) =>
            current.map((t) => (t.threadId === activeThreadId ? { ...t, unreadCount: 0 } : t))
          );
        }
      } catch (err) {
        console.error("Error fetching messages for thread:", activeThreadId, err);
      }
    }

    fetchMessages();
  }, [activeThreadId]);

  // Real-Time Subscriptions
  useEffect(() => {
    // 1. Listen for new, edited, and deleted messages
    const messagesChannel = supabase
      .channel("support_messages_admin")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
        },
        (payload) => {
          const eventType = payload.eventType;

          if (eventType === "DELETE") {
            const deletedId = payload.old.id;
            setThreads((current) =>
              current.map((t) => ({
                ...t,
                messages: t.messages.filter((m) => m.id !== deletedId),
              }))
            );
            return;
          }

          const newMsg = payload.new as any;
          const msgThreadId = newMsg.thread_id;

          if (newMsg.deleted_for_admin) {
            setThreads((current) =>
              current.map((t) => {
                if (t.threadId === msgThreadId) {
                  return {
                    ...t,
                    messages: t.messages.filter((m) => m.id !== newMsg.id),
                  };
                }
                return t;
              })
            );
            return;
          }

          const formattedMsg: Message = {
            id: newMsg.id,
            sender: newMsg.sender as "Client" | "Admin",
            text: newMsg.text,
            timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            is_edited: newMsg.is_edited,
          };

          setThreads((current) =>
            current.map((t) => {
              if (t.threadId === msgThreadId) {
                const index = t.messages.findIndex((m) => m.id === newMsg.id);
                if (index !== -1) {
                  const updatedMsgs = [...t.messages];
                  updatedMsgs[index] = formattedMsg;
                  return { ...t, messages: updatedMsgs };
                } else {
                  return {
                    ...t,
                    messages: [...t.messages, formattedMsg],
                  };
                }
              }
              return t;
            })
          );

          // If the message is in the active thread and from Client, clear unread count
          if (newMsg.sender === "Client" && msgThreadId === activeThreadId && eventType === "INSERT") {
            supabase
              .from("support_threads")
              .update({ unread_count_admin: 0 })
              .eq("id", activeThreadId)
              .then();
          }
        }
      )
      .subscribe();

    // 2. Listen for support_threads changes (e.g. status changes, new threads, last message time updates)
    const threadsChannel = supabase
      .channel("support_threads_admin")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_threads",
        },
        async (payload) => {
          const updatedRow = payload.new as any;
          const eventType = payload.eventType;

          if (eventType === "DELETE") {
            setThreads((current) => current.filter((t) => t.threadId !== payload.old.id));
            if (activeThreadId === payload.old.id) {
              setActiveThreadId("");
            }
            return;
          }

          // For INSERT or UPDATE: preserve existing user name from current thread state
          // to avoid reverting to "User" when no kyc lookup is done in the subscription.
          setThreads((current) => {
            const index = current.findIndex((t) => t.threadId === updatedRow.id);
            const existingThread = index !== -1 ? current[index] : null;

            // Re-use the user object from the existing thread if available,
            // so the resolved name (kyc/profile) is never lost on update.
            const preservedUser: AdminUser = existingThread?.user ?? {
              id: updatedRow.user_id,
              name: "Unknown User",
              email: "N/A",
              phone: "N/A",
              kyc: "Not Started",
              account: "Active",
              balance: 0,
              joinedDate: "",
              risk: "Low Risk",
              dateOfBirth: "",
              street: "",
              city: "",
              postalCode: "",
              country: "",
              lastLogin: "",
              twoFactor: false,
              lastIp: "",
            };

            const mappedThread: ChatThread = {
              threadId: updatedRow.id,
              user: preservedUser,
              status: updatedRow.status as ChatStatus,
              unreadCount: updatedRow.id === activeThreadId ? 0 : updatedRow.unread_count_admin,
              unreadCountUser: updatedRow.unread_count_user,
              lastMessageTime: new Date(updatedRow.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              messages: existingThread?.messages ?? [],
              lastMessageAtISO: updatedRow.last_message_at,
              is_ticket: updatedRow.is_ticket,
              category: updatedRow.category,
              ticket_id: updatedRow.ticket_id,
            };

            const nextList = index !== -1 ? [...current] : [mappedThread, ...current];
            if (index !== -1) nextList[index] = mappedThread;

            return nextList.sort((a, b) =>
              new Date(b.lastMessageAtISO).getTime() - new Date(a.lastMessageAtISO).getTime()
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(threadsChannel);
    };
  }, [activeThreadId]);

  /* Get Active Thread */
  const activeThread = useMemo(() => {
    return threads.find((t) => t.threadId === activeThreadId) || null;
  }, [threads, activeThreadId]);

  /* Scroll to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages, typingUser]);

  /* Filter threads */
  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return threads.filter((t) => {
      return (
        !query ||
        t.user.name.toLowerCase().includes(query) ||
        t.user.id.toLowerCase().includes(query) ||
        t.messages.some((m) => m.text.toLowerCase().includes(query))
      );
    });
  }, [threads, search]);

  /* Send Admin Message */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread) return;

    const messageText = inputText.trim();
    setInputText("");

    try {
      const { data: newMsg, error } = await supabase
        .from("support_messages")
        .insert({
          thread_id: activeThread.threadId,
          sender: "Admin",
          text: messageText,
        })
        .select()
        .single();

      if (error) throw error;

      const formattedMsg: Message = {
        id: newMsg.id,
        sender: "Admin",
        text: newMsg.text,
        timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setThreads((current) =>
        current.map((t) => {
          if (t.threadId === activeThread.threadId) {
            const alreadyHas = t.messages.some((m) => m.id === newMsg.id);
            if (alreadyHas) return t;
            return {
              ...t,
              messages: [...t.messages, formattedMsg],
            };
          }
          return t;
        })
      );
    } catch (err) {
      console.error("Error sending support response:", err);
    }
  };

  /* Edit Message */
  const handleEditMessage = async (messageId: string, newText: string) => {
    try {
      const { error } = await supabase
        .from("support_messages")
        .update({ text: newText, is_edited: true })
        .eq("id", messageId);
      if (error) throw error;

      // Update state immediately for visual responsiveness
      setThreads((current) =>
        current.map((t) => {
          if (t.threadId === activeThreadId) {
            return {
              ...t,
              messages: t.messages.map((m) =>
                m.id === messageId ? { ...m, text: newText, is_edited: true } : m
              ),
            };
          }
          return t;
        })
      );
    } catch (err) {
      console.error("Error editing message:", err);
    }
  };

  /* Delete Message for Everyone */
  const handleDeleteMessageEveryone = async (messageId: string) => {
    // Optimistic Update
    setThreads((current) =>
      current.map((t) => {
        if (t.threadId === activeThreadId) {
          return {
            ...t,
            messages: t.messages.filter((m) => m.id !== messageId),
          };
        }
        return t;
      })
    );

    try {
      const { error } = await supabase
        .from("support_messages")
        .delete()
        .eq("id", messageId);
      if (error) throw error;
    } catch (err) {
      console.error("Error deleting message for everyone:", err);
    }
  };

  /* Delete Message for Me Only */
  const handleDeleteMessageMe = async (messageId: string) => {
    // Optimistic Update
    setThreads((current) =>
      current.map((t) => {
        if (t.threadId === activeThreadId) {
          return {
            ...t,
            messages: t.messages.filter((m) => m.id !== messageId),
          };
        }
        return t;
      })
    );

    try {
      const { error } = await supabase
        .from("support_messages")
        .update({ deleted_for_admin: true })
        .eq("id", messageId);
      if (error) throw error;
    } catch (err) {
      console.error("Error deleting message for me:", err);
    }
  };

  /* Delete Chat Thread */
  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent setting as active thread
    if (!confirm("Are you sure you want to delete this conversation permanently?")) return;
    
    setDeletingThread(threadId);
    try {
      const res = await fetch(`/api/support/tickets/${threadId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete thread");
      
      setThreads((current) => current.filter((t) => t.threadId !== threadId));
      if (activeThreadId === threadId) {
        setActiveThreadId("");
      }
    } catch (err) {
      console.error("Error deleting support thread:", err);
      alert("Failed to delete the conversation.");
    } finally {
      setDeletingThread(null);
    }
  };

  /* Toggle Chat Status override */
  const handleSetStatus = async (status: ChatStatus) => {
    if (!activeThread) return;
    try {
      const { error } = await supabase
        .from("support_threads")
        .update({ status })
        .eq("id", activeThread.threadId);

      if (error) throw error;

      setThreads((current) =>
        current.map((t) => (t.threadId === activeThread.threadId ? { ...t, status } : t))
      );
    } catch (err) {
      console.error("Error setting support thread status:", err);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6 flex flex-col h-[calc(100vh-130px)] max-h-[850px]"
      >
        {/* Header */}
        <div>
          <h1 className="text-[26px] font-bold leading-tight text-gray-900 sm:text-[30px]">Live Chat Support</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">Manage customer support conversations in real-time</p>
        </div>

        {/* Chat Interface Container */}
        <div className="flex-1 flex overflow-hidden border border-gray-200 rounded-2xl bg-white shadow-sm min-h-[400px]">
          {/* Sidebar - Threads list */}
          <div className={cn("w-full md:w-[320px] shrink-0 border-r border-gray-200 flex flex-col bg-gray-50/20", activeThreadId ? "hidden md:flex" : "flex")}>
            {/* Search */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-xs text-gray-800 outline-none transition-all placeholder:text-gray-500 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-50"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-16 bg-white rounded-xl animate-pulse border border-gray-100" />
                ))
              ) : filteredThreads.length === 0 ? (
                <div className="p-4 text-center text-xs font-semibold text-gray-600">
                  No conversations found.
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isActive = thread.threadId === activeThreadId;
                  const lastMsg = thread.messages[thread.messages.length - 1];

                  return (
                    <div
                      key={thread.threadId}
                      onClick={() => setActiveThreadId(thread.threadId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') setActiveThreadId(thread.threadId); }}
                      className={cn(
                        "w-full text-left p-3.5 border rounded-2xl transition-all flex items-start gap-3.5 cursor-pointer",
                        isActive
                          ? "bg-white border-emerald-200 shadow-md ring-2 ring-emerald-50"
                          : "bg-transparent border-transparent hover:bg-gray-100/60"
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <UserAvatar user={thread.user} size="md" />
                        <span className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-white">
                          <StatusIndicator status={thread.status} />
                        </span>
                      </div>

                      {/* Snippet info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-gray-900 text-xs truncate max-w-[120px]">{thread.user.name}</span>
                          <span className="text-[9px] text-gray-600 font-bold font-mono shrink-0">{thread.lastMessageTime}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 font-medium truncate pr-1">
                          {lastMsg ? lastMsg.text : "No messages yet"}
                        </p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[9px] text-gray-600 font-mono uppercase tracking-tight">{thread.user.id.substring(0, 8)}</span>
                          {thread.is_ticket && (
                            <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight">
                              Ticket: {thread.category || "Other"}
                            </span>
                          )}
                          {thread.status === "Waiting" && (
                            <span className="text-[8px] bg-amber-50 text-amber-700 font-bold uppercase px-1 rounded">waiting</span>
                          )}
                        </div>
                      </div>

                      {/* Delete & Unread badges */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <button
                          onClick={(e) => handleDeleteThread(thread.threadId, e)}
                          disabled={deletingThread === thread.threadId}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete conversation"
                        >
                          {deletingThread === thread.threadId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                        {thread.unreadCount > 0 && (
                          <span className="h-5 w-5 rounded-full bg-red-600 text-white font-mono font-black text-[9px] flex items-center justify-center shadow-sm animate-pulse">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane - Chat window */}
          <div className={cn("flex-1 flex flex-col bg-gray-50/30", activeThreadId ? "flex" : "hidden md:flex")}>
            {activeThread ? (
              <>
                {/* Chat Pane Header */}
                <div className="px-4 py-3 sm:px-6 sm:py-4.5 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setActiveThreadId("")}
                      className="md:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-600 mr-1 shrink-0 cursor-pointer"
                      aria-label="Back to threads"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <UserAvatar user={activeThread.user} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-gray-900 text-sm leading-none">{activeThread.user.name}</h4>
                        <span className="flex items-center gap-1 bg-gray-100 text-gray-600 font-bold uppercase px-2 py-0.5 rounded-full text-[9px] tracking-wide border border-gray-150 font-mono">
                          <StatusIndicator status={activeThread.status} />
                          {activeThread.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-600 font-mono mt-1 block">{activeThread.user.id.substring(0, 8)} • {activeThread.user.email}</span>
                    </div>
                  </div>

                  {/* Header Action Status Set */}
                  <div className="flex items-center gap-1.5 border border-gray-200 bg-gray-50 p-1 rounded-xl">
                    {(["Active", "Waiting", "Resolved", "Closed"] as ChatStatus[]).map((st) => {
                      const active = activeThread.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => handleSetStatus(st)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                            active
                              ? "bg-white text-gray-800 shadow-sm"
                              : "text-gray-600 hover:text-gray-700"
                          )}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Messages log list */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                  {activeThread.messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-xs text-gray-600 font-semibold">
                      No message history in this thread.
                    </div>
                  )}
                  {activeThread.messages.map((msg) => {
                    const isAdmin = msg.sender === "Admin";
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex items-end gap-2.5 max-w-[80%] group",
                          isAdmin ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                      >
                        {/* Avatar */}
                        {isAdmin ? (
                          <div className="h-7 w-7 rounded-lg bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 font-bold font-mono text-xs shrink-0 select-none">
                            A
                          </div>
                        ) : (
                          <UserAvatar user={activeThread.user} size="sm" />
                        )}

                        {/* Bubble */}
                        <div className="space-y-1 max-w-[70%]">
                          <div
                            className={cn(
                              "p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm relative",
                              isAdmin
                                ? "text-white rounded-br-none"
                                : "bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200"
                            )}
                            style={isAdmin ? { background: BRAND_GRADIENT } : {}}
                          >
                            {editingMessageId === msg.id ? (
                              <div className="flex flex-col gap-2 min-w-[180px]">
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="w-full p-2 text-xs text-gray-800 rounded border border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => {
                                      setEditingMessageId(null);
                                      setEditingText("");
                                    }}
                                    className="px-2 py-1 text-[10px] bg-emerald-800 hover:bg-emerald-950 text-white rounded font-bold transition-all"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (editingText.trim()) {
                                        await handleEditMessage(msg.id, editingText.trim());
                                        setEditingMessageId(null);
                                        setEditingText("");
                                      }
                                    }}
                                    className="px-2 py-1 text-[10px] bg-white text-emerald-800 hover:bg-gray-100 rounded font-bold transition-all"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>{msg.text}</div>
                                {msg.is_edited && (
                                  <span className={cn(
                                    "text-[9px] block mt-1 font-normal italic",
                                    isAdmin ? "text-emerald-100/70" : "text-gray-400"
                                  )}>Edited</span>
                                )}
                              </>
                            )}
                          </div>
                          <div className={cn(
                            "text-[8px] text-gray-600 font-bold font-mono flex items-center gap-1.5 mt-0.5",
                            isAdmin ? "justify-end" : "justify-start"
                          )}>
                            <span>{msg.timestamp}</span>
                            {isAdmin && (
                              <CheckCheck className={cn(
                                "h-3.5 w-3.5 shrink-0",
                                activeThread.unreadCountUser === 0
                                  ? "text-sky-400 font-bold"
                                  : "text-white/40"
                              )} />
                            )}
                          </div>
                        </div>

                        {/* Action buttons on Hover */}
                        {editingMessageId !== msg.id && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 self-center bg-white border border-gray-200 p-1.5 rounded-xl shadow-md">
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setEditingText(msg.text);
                                }}
                                className="p-1 rounded text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Edit Message"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteMessageEveryone(msg.id)}
                              className="p-1 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete for Everyone"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMessageMe(msg.id)}
                              className="p-1 rounded text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Delete for Me Only"
                            >
                              <User className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>

                {/* Footer Message Compose Area */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex items-center gap-3">
                  <button
                    type="button"
                    className="h-10 w-10 flex items-center justify-center border border-gray-200 rounded-xl text-gray-600 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
                    title="Attach Files"
                  >
                    <Paperclip className="h-4.5 w-4.5 stroke-[1.8]" />
                  </button>

                  <input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your message..."
                    className="h-10 flex-1 px-4 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-gray-800 placeholder:text-gray-500 bg-gray-50/20"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="h-10 px-4.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    style={{ background: BRAND_GRADIENT }}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-600 font-semibold text-xs">
                Select a conversation thread to start chatting.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

