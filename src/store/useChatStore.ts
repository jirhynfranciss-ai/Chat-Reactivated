import { create } from "zustand";
import type { MessageRecord } from "../types";

interface ChatState {
  conversationId: string | null;
  messages: MessageRecord[];
  unreadCount: number;
  setConversationId: (id: string | null) => void;
  setMessages: (messages: MessageRecord[]) => void;
  addMessage: (message: MessageRecord) => void;
  markAllRead: () => void;
  setUnreadCount: (count: number) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversationId: null,
  messages: [],
  unreadCount: 0,
  setConversationId: (id) => set({ conversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      if (state.messages.some((m) => m.id === message.id)) return state;
      return { messages: [...state.messages, message] };
    }),
  markAllRead: () => set({ unreadCount: 0 }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  reset: () => set({ conversationId: null, messages: [], unreadCount: 0 }),
}));
