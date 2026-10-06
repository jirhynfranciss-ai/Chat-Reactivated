import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, Send } from "lucide-react";
import toast from "react-hot-toast";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import {
  fetchMessages,
  markMessagesRead,
  sendMessage,
} from "../../services/chatService";
import { MessageBubble } from "../../components/chat/MessageBubble";
import type { MessageRecord } from "../../types";

interface ConversationSummary {
  id: string;
  display_name: string;
  user_id: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function AdminMessages() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadConversations() {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        "id, conversation_participants(user_id, profiles(display_name)), messages(message_text, created_at, sender_id, read_at)"
      )
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const summaries: ConversationSummary[] = (data ?? []).map((c: any) => {
      const participant = c.conversation_participants?.[0];
      const msgs = c.messages ?? [];
      const last = [...msgs].sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      const unread = msgs.filter(
        (m: any) => !m.read_at && m.sender_id !== user?.id
      ).length;
      return {
        id: c.id,
        display_name: participant?.profiles?.display_name || "Anonymous",
        user_id: participant?.user_id,
        last_message: last?.message_text || "No messages yet",
        last_message_time: last?.created_at || "",
        unread_count: unread,
      };
    });

    setConversations(summaries);
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!activeId || !user) return;
    fetchMessages(activeId).then((msgs) => setMessages(msgs as MessageRecord[]));
    markMessagesRead(activeId, user.id).catch(() => null);

    const channel = supabase
      .channel(`admin-messages-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as MessageRecord]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !activeId || !user) return;
    const text = input.trim();
    setInput("");
    try {
      await sendMessage(activeId, user.id, text);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't send message.");
    }
  }

  const filtered = conversations.filter((c) =>
    c.display_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <h1 className="font-serif mb-6 text-2xl font-semibold sm:text-3xl">Messages</h1>

      <div className="romantic-card grid grid-cols-1 overflow-hidden rounded-3xl md:grid-cols-[280px_1fr]" style={{ minHeight: "65vh" }}>
        <div className="border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex items-center gap-2 border-b p-3" style={{ borderColor: "var(--border-color)" }}>
            <Search size={14} style={{ color: "var(--text-secondary)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-[55vh] overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className="flex w-full flex-col items-start gap-0.5 border-b px-4 py-3 text-left"
                style={{
                  borderColor: "var(--border-color)",
                  background: activeId === c.id ? "var(--surface-alt)" : "transparent",
                }}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium">{c.display_name}</span>
                  {c.unread_count > 0 && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] text-white"
                      style={{ background: "var(--accent)" }}
                    >
                      {c.unread_count}
                    </span>
                  )}
                </div>
                <span className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                  {c.last_message}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                No conversations yet.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          {activeId ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: "50vh" }}>
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} isOwn={m.sender_id === user?.id} />
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="flex items-center gap-2 border-t p-3" style={{ borderColor: "var(--border-color)" }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a reply..."
                  className="flex-1 rounded-2xl border px-4 py-2.5 text-sm outline-none"
                  style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
                />
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleSend}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--gold))" }}
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-sm" style={{ color: "var(--text-secondary)" }}>
              Select a conversation to start chatting.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
