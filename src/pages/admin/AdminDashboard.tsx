import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { fetchDashboardStats, fetchResponsesOverTime } from "../../services/adminService";
import { useAdminThemeStore } from "../../store/useAdminThemeStore";

interface Stats {
  totalResponses: number;
  responsesToday: number;
  responsesThisWeek: number;
  totalQuestions: number;
  activeQuestions: number;
  totalUsers: number;
  unreadMessages: number;
}

export default function AdminDashboard() {
  const { theme } = useAdminThemeStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    fetchDashboardStats().then(setStats).catch(console.error);
    fetchResponsesOverTime().then(setChartData).catch(console.error);
  }, []);

  const accent = theme === "dark" ? "#D4AF37" : "#8B3A3A";

  const cards = stats
    ? [
        { label: "Total Responses", value: stats.totalResponses },
        { label: "Responses Today", value: stats.responsesToday },
        { label: "Responses This Week", value: stats.responsesThisWeek },
        { label: "Total Questions", value: stats.totalQuestions },
        { label: "Active Questions", value: stats.activeQuestions },
        { label: "Registered Users", value: stats.totalUsers },
        { label: "Unread Messages", value: stats.unreadMessages },
      ]
    : [];

  return (
    <AdminLayout>
      <h1 className="font-serif mb-6 text-2xl font-semibold sm:text-3xl">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="romantic-card rounded-2xl p-5"
          >
            <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold" style={{ color: "var(--accent)" }}>
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="romantic-card mt-8 rounded-3xl p-6">
        <h2 className="mb-4 text-lg font-semibold">Submissions (last 14 days)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                borderColor: "var(--border-color)",
                borderRadius: 12,
              }}
            />
            <Line type="monotone" dataKey="count" stroke={accent} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AdminLayout>
  );
}
