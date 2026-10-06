import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  ListChecks,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  Inbox,
} from "lucide-react";
import { useAdminThemeStore } from "../../store/useAdminThemeStore";
import { useAuthStore } from "../../store/useAuthStore";
import { signOut } from "../../services/authService";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/responses", label: "Responses", icon: Inbox },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/questions", label: "Questions", icon: ListChecks },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useAdminThemeStore();
  const reset = useAuthStore((s) => s.reset);
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    reset();
    navigate("/admin");
  }

  return (
    <div
      className={theme === "dark" ? "dark" : ""}
      style={{ background: "var(--bg)", color: "var(--text-primary)" }}
    >
      <div className="flex min-h-screen">
        <aside
          className="flex w-20 flex-col items-center justify-between border-r py-6 sm:w-64 sm:items-stretch sm:px-4"
          style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
        >
          <div>
            <div className="mb-8 hidden px-2 sm:block">
              <p className="font-serif text-lg font-semibold">Admin Portal</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                💌 private dashboard
              </p>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors sm:justify-start ${
                      isActive ? "text-white" : ""
                    }`
                  }
                  style={({ isActive }) => ({
                    background: isActive
                      ? "linear-gradient(135deg, var(--accent), var(--gold))"
                      : "transparent",
                    color: isActive ? "white" : "var(--text-secondary)",
                  })}
                >
                  <item.icon size={18} />
                  <span className="hidden sm:inline">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="space-y-1">
            <button
              onClick={toggle}
              className="flex w-full items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-medium sm:justify-start"
              style={{ color: "var(--text-secondary)" }}
            >
              <motion.span whileTap={{ rotate: 180 }}>
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </motion.span>
              <span className="hidden sm:inline">
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-500 sm:justify-start"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
