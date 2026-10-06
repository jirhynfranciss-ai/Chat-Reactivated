import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock } from "lucide-react";
import { loginSchema, type LoginFormValues } from "../../lib/validation";
import { signInWithPassword, checkIsAdmin } from "../../services/authService";
import { useAuthStore } from "../../store/useAuthStore";
import { useAdminThemeStore } from "../../store/useAdminThemeStore";
import { Button } from "../../components/ui/Button";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { theme } = useAdminThemeStore();
  const setSession = useAuthStore((s) => s.setSession);
  const setIsAdmin = useAuthStore((s) => s.setIsAdmin);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setLoading(true);
    const toastId = toast.loading("Signing in...");
    try {
      const { session, user } = await signInWithPassword(
        values.email,
        values.password
      );
      if (!user) throw new Error("Sign in failed.");

      const admin = await checkIsAdmin(user.id);
      if (!admin) {
        toast.error("This account doesn't have admin access.", { id: toastId });
        setLoading(false);
        return;
      }

      setSession(session);
      setIsAdmin(true);
      toast.success("Welcome back 💗", { id: toastId });
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Invalid email or password.", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={theme === "dark" ? "dark" : ""}
      style={{ background: "var(--bg)", color: "var(--text-primary)" }}
    >
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="romantic-card w-full max-w-sm rounded-3xl p-8"
        >
          <div className="mb-6 text-center">
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "var(--surface-alt)", color: "var(--accent)" }}
            >
              <Lock size={20} />
            </div>
            <h1 className="font-serif text-2xl font-semibold">Admin Portal</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              This area is private. Authorized access only.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                {...register("email")}
                className="w-full rounded-2xl border px-4 py-3 outline-none transition-shadow focus:shadow-[0_0_0_3px_var(--shadow-color)]"
                style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input
                type="password"
                {...register("password")}
                className="w-full rounded-2xl border px-4 py-3 outline-none transition-shadow focus:shadow-[0_0_0_3px_var(--shadow-color)]"
                style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" isLoading={loading} className="w-full">
              Sign In
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
