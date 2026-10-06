import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { SEED_QUESTIONS } from "../data/seedQuestions";
import type { Question } from "../types";

export async function fetchActiveQuestions(): Promise<Question[]> {
  if (!isSupabaseConfigured) return SEED_QUESTIONS;

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.error("Failed to load questions:", error.message);
    return SEED_QUESTIONS;
  }

  return data as Question[];
}

export async function fetchAllQuestions(): Promise<Question[]> {
  if (!isSupabaseConfigured) return SEED_QUESTIONS;

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Failed to load questions:", error.message);
    return [];
  }

  return data as Question[];
}

export async function createQuestion(
  question: Omit<Question, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("questions")
    .insert(question)
    .select()
    .single();
  if (error) throw error;
  return data as Question;
}

export async function updateQuestion(
  id: string,
  updates: Partial<Question>
) {
  const { data, error } = await supabase
    .from("questions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Question;
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderQuestions(
  orderedIds: { id: string; display_order: number }[]
) {
  await Promise.all(
    orderedIds.map(({ id, display_order }) =>
      supabase.from("questions").update({ display_order }).eq("id", id)
    )
  );
}
