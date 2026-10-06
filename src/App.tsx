import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useAdminShortcut } from "./hooks/useAdminShortcut";
import { useAuthBootstrap } from "./hooks/useAuthBootstrap";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";

// Note: @supabase/auth-helpers-react is installed per project requirements,
// but the package has been deprecated/repurposed upstream and no longer
// ships the classic SessionContextProvider/useUser hooks. Supabase's current
// guidance for SPAs is to use @supabase/supabase-js directly, which is what
// useAuthBootstrap + useAuthStore (Zustand) do throughout this app via
// supabase.auth.getSession() / onAuthStateChange().

import LandingPage from "./pages/LandingPage";
import QuestionnairePage from "./pages/QuestionnairePage";
import ReviewPage from "./pages/ReviewPage";
import CompletePage from "./pages/CompletePage";
import CreateAccountPage from "./pages/CreateAccountPage";
import ChatPage from "./pages/ChatPage";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminResponses from "./pages/admin/AdminResponses";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettingsPage from "./pages/admin/AdminSettings";

function AppRoutes() {
  useAdminShortcut();
  useAuthBootstrap();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/questionnaire" element={<QuestionnairePage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/complete" element={<CompletePage />} />
      <Route path="/create-account" element={<CreateAccountPage />} />
      <Route path="/chat" element={<ChatPage />} />

      <Route path="/admin" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/responses"
        element={
          <ProtectedRoute>
            <AdminResponses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/messages"
        element={
          <ProtectedRoute>
            <AdminMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/questions"
        element={
          <ProtectedRoute>
            <AdminQuestions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute>
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <AdminSettingsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3500,
              style: {
                background: "var(--surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
                borderRadius: "16px",
                boxShadow: "0 10px 30px var(--shadow-color)",
              },
            }}
          />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
