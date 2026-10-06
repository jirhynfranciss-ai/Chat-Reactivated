import { supabase } from "../lib/supabase";

export async function getOrCreateConversation(userId: string) {
  const { data: existingParticipant, error: existingError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    throw existingError;
  }

  if (existingParticipant) {
    return existingParticipant.conversation_id as string;
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({})
    .select()
    .single();

  if (conversationError) throw conversationError;

  const { error: participantError } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: conversation.id, user_id: userId });

  if (participantError) throw participantError;

  return conversation.id as string;
}

export async function fetchMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  messageText: string
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message_text: messageText,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markMessagesRead(
  conversationId: string,
  exceptSenderId: string
) {
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", exceptSenderId)
    .is("read_at", null);
  if (error) throw error;
}

export async function fetchAllConversationsForAdmin() {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "*, conversation_participants(user_id, profiles:profiles(display_name)), messages(message_text, created_at, sender_id, read_at)"
    )
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
