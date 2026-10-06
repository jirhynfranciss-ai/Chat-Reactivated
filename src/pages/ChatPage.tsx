import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Send } from "lucide-react";
import { PageShell } from "../components/ui/PageShell";
import { MessageBubble } from "../components/chat/MessageBubble";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import {
  fetchMessages,
  getOrCreateConversation,
  markMessagesRead,
  sendMessage,
} from "../services/chatService";
import type { MessageRecord } from "../types";

export default function ChatPage() {
  const navigate = useNavigate();
  const { user, initialized } = useAuthStore();
  const { conversationId, messages, setConversationId, setMessages, addMessage } =
    useChatStore();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate("/create-account");
    }
  }, [initialized, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function load() {
      try {
        const convoId = conversationId || (await getOrCreateConversation(user!.id));
        if (!active) return;
        setConversationId(convoId);
        const msgs = await fetchMessages(convoId);
        if (!active) return;
        setMessages(msgs as MessageRecord[]);
        await markMessagesRead(convoId, user!.id);
      } catch (err) {
        console.error(err);
        toast.error("Couldn't load your conversation. 🤍");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          addMessage(payload.new as MessageRecord);
          if (user && (payload.new as MessageRecord).sender_id !== user.id) {
            markMessagesRead(conversationId, user.id).catch(() => null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, addMessage, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !conversationId || !user) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      const message = await sendMessage(conversationId, user.id, text);
      addMessage(message as MessageRecord);
    } catch (err) {
      console.error(err);
      toast.error("Message didn't send. Please try again. 🤍");
    } finally {
      setSending(false);
    }
  }

  return (
    <PageShell showHearts={false}>
      <div className="flex flex-1 flex-col px-3 py-4 sm:px-6 sm:py-8">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-xl font-semibold sm:text-2xl">
                Our little private corner. 💗
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Just between us.
              </p>
            </div>
            <ThemeToggle />
          </div>

          <div
            className="romantic-card flex flex-1 flex-col overflow-hidden rounded-3xl"
            style={{ minHeight: "60vh" }}
          >
            <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
              {loading && (
                <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                  Loading your conversation... 💌
                </p>
              )}
              {!loading && messages.length === 0 && (
                <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                  Say hi! This is the start of your private conversation. 🤍
                </p>
              )}
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === user?.id}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            <div
              className="flex items-end gap-2 border-t p-3 sm:p-4"
              style={{ borderColor: "var(--border-color)" }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Type something..."
                className="max-h-28 flex-1 resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_var(--shadow-color)]"
                style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
              />
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-md disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--gold))" }}
              >
                <Send size={18} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
