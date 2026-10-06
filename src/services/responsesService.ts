import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface SubmitPayload {
  sessionId: string;
  userId?: string | null;
  answers: { questionId: string; answerText: string }[];
}

export async function hasExistingSubmission(sessionId: string) {
  if (!isSupabaseConfigured) return false;
  const { data, error } = await supabase
    .from("responses")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

export async function submitResponse({
  sessionId,
  userId,
  answers,
}: SubmitPayload) {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }

  const { data: response, error: responseError } = await supabase
    .from("responses")
    .insert({
      session_id: sessionId,
      user_id: userId ?? null,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (responseError) throw responseError;

  // Only real (non-seed) question ids can be stored as foreign keys.
  const validAnswers = answers.filter(
    (a) => a.answerText.trim().length > 0 && !a.questionId.startsWith("seed-")
  );

  if (validAnswers.length > 0) {
    const { error: answersError } = await supabase.from("answers").insert(
      validAnswers.map((a) => ({
        response_id: response.id,
        question_id: a.questionId,
        answer_text: a.answerText,
      }))
    );
    if (answersError) throw answersError;
  }

  return response.id as string;
}

export async function linkResponseToUser(responseId: string, userId: string) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from("responses")
    .update({ user_id: userId })
    .eq("id", responseId);
  if (error) throw error;
}

export async function fetchResponsesWithAnswers() {
  const { data: responses, error } = await supabase
    .from("responses")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const { data: answers, error: answersError } = await supabase
    .from("answers")
    .select("*, questions(question_text)");
  if (answersError) throw answersError;

  return { responses: responses ?? [], answers: answers ?? [] };
}

export async function deleteResponse(id: string) {
  const { error } = await supabase.from("responses").delete().eq("id", id);
  if (error) throw error;
}
