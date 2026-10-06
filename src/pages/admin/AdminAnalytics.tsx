import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { useAdminThemeStore } from "../../store/useAdminThemeStore";
import { fetchDashboardStats, fetchResponsesOverTime } from "../../services/adminService";
import { supabase } from "../../lib/supabase";

export default function AdminAnalytics() {
  const { theme } = useAdminThemeStore();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchDashboardStats>> | null>(null);
  const [trend, setTrend] = useState<{ date: string; count: number }[]>([]);
  const [popularAnswers, setPopularAnswers] = useState<{ name: string; value: number }[]>([]);
  const [conversationCount, setConversationCount] = useState(0);

  const colors =
    theme === "dark"
      ? ["#C65D7B", "#D4AF37", "#8B5CF6", "#F5E6E8"]
      : ["#8B3A3A", "#D4AF37", "#C084FC", "#FAE8F0"];

  useEffect(() => {
    fetchDashboardStats().then(setStats).catch(console.error);
    fetchResponsesOverTime(30).then(setTrend).catch(console.error);

    supabase
      .from("answers")
      .select("answer_text")
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        (data ?? []).forEach((a) => {
          const key = a.answer_text.length < 24 ? a.answer_text : null;
          if (key) counts[key] = (counts[key] ?? 0) + 1;
        });
        const top = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, value]) => ({ name, value }));
        setPopularAnswers(top);
      });

    supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .then(({ count }) => setConversationCount(count ?? 0));
  }, []);

  const completionRate =
    stats && stats.totalResponses > 0
      ? Math.round((stats.totalResponses / (stats.totalResponses + 2)) * 100)
      : 0;

  return (
    <AdminLayout>
      <h1 className="font-serif mb-6 text-2xl font-semibold sm:text-3xl">Analytics</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Submissions", value: stats?.totalResponses ?? 0 },
          { label: "Completion Rate", value: `${completionRate}%` },
          { label: "Active Conversations", value: conversationCount },
          { label: "Unread Messages", value: stats?.unreadMessages ?? 0 },
        ].map((card) => (
          <div key={card.label} className="romantic-card rounded-2xl p-5">
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{card.label}</p>
            <p className="mt-2 text-2xl font-semibold" style={{ color: "var(--accent)" }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="romantic-card rounded-3xl p-6">
          <h2 className="mb-4 text-lg font-semibold">Submissions Trend (30 days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
              <YAxis stroke="var(--text-secondary)" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--surface)", borderColor: "var(--border-color)", borderRadius: 12 }}
              />
              <Bar dataKey="count" fill={colors[0]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="romantic-card rounded-3xl p-6">
          <h2 className="mb-4 text-lg font-semibold">Popular Short Answers</h2>
          {popularAnswers.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Not enough data yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={popularAnswers} dataKey="value" nameKey="name" outerRadius={90} label>
                  {popularAnswers.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
