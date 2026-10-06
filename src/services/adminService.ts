import { supabase } from "../lib/supabase";
import type { AdminSettings } from "../types";

export async function fetchDashboardStats() {
  const [
    { count: totalResponses },
    { count: totalQuestions },
    { count: activeQuestions },
    { count: totalUsers },
    { count: unreadMessages },
  ] = await Promise.all([
    supabase.from("responses").select("*", { count: "exact", head: true }),
    supabase.from("questions").select("*", { count: "exact", head: true }),
    supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .is("read_at", null),
  ]);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const { count: responsesToday } = await supabase
    .from("responses")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfDay.toISOString());

  const { count: responsesThisWeek } = await supabase
    .from("responses")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfWeek.toISOString());

  return {
    totalResponses: totalResponses ?? 0,
    responsesToday: responsesToday ?? 0,
    responsesThisWeek: responsesThisWeek ?? 0,
    totalQuestions: totalQuestions ?? 0,
    activeQuestions: activeQuestions ?? 0,
    totalUsers: totalUsers ?? 0,
    unreadMessages: unreadMessages ?? 0,
  };
}

export async function fetchResponsesOverTime(days = 14) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from("responses")
    .select("created_at")
    .gte("created_at", since.toISOString());
  if (error) throw error;

  const counts: Record<string, number> = {};
  (data ?? []).forEach((row) => {
    const day = new Date(row.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    counts[day] = (counts[day] ?? 0) + 1;
  });

  return Object.entries(counts).map(([date, count]) => ({ date, count }));
}

export async function fetchSettings(): Promise<AdminSettings | null> {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error(error.message);
    return null;
  }
  return data as AdminSettings | null;
}

export async function updateSettings(
  id: string,
  updates: Partial<AdminSettings>
) {
  const { error } = await supabase
    .from("admin_settings")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}
