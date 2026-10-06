import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { PageShell } from "../components/ui/PageShell";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { accountSchema, type AccountFormValues, getPasswordStrength } from "../lib/validation";
import { signUpWithProfile } from "../services/authService";
import { linkResponseToUser } from "../services/responsesService";
import { getOrCreateConversation } from "../services/chatService";
import { useQuestionnaireStore } from "../store/useQuestionnaireStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { isSupabaseConfigured } from "../lib/supabase";

export default function CreateAccountPage() {
  const navigate = useNavigate();
  const { responseId } = useQuestionnaireStore();
  const setSession = useAuthStore((s) => s.setSession);
  const setConversationId = useChatStore((s) => s.setConversationId);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AccountFormValues>({ resolver: zodResolver(accountSchema) });

  const password = watch("password") || "";
  const strength = getPasswordStrength(password);

  async function onSubmit(values: AccountFormValues) {
    if (!isSupabaseConfigured) {
      toast.error("Chat isn't connected yet. Please try again later. 🤍");
      return;
    }
    setLoading(true);
    const toastId = toast.loading("Creating your account... 💗");
    try {
      const { session, user } = await signUpWithProfile(
        values.email,
        values.password,
        values.displayName
      );

      if (user && responseId) {
        await linkResponseToUser(responseId, user.id).catch(() => null);
      }

      if (session) {
        setSession(session);
      }

      if (user) {
        const conversationId = await getOrCreateConversation(user.id);
        setConversationId(conversationId);
      }

      toast.success("Account created! Welcome. 💗", { id: toastId });
      navigate("/chat");
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again. 🤍";
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          <Card>
            <h1 className="font-serif text-center text-2xl font-semibold sm:text-3xl">
              Let's make it official 💗
            </h1>
            <p
              className="mt-2 text-center text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Just a simple account so our conversation can stay between us.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Display Name</label>
                <input
                  type="text"
                  {...register("displayName")}
                  className="w-full rounded-2xl border px-4 py-3 outline-none transition-shadow focus:shadow-[0_0_0_3px_var(--shadow-color)]"
                  style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
                  placeholder="What should I call you?"
                />
                {errors.displayName && (
                  <p className="mt-1 text-xs text-red-500">{errors.displayName.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full rounded-2xl border px-4 py-3 outline-none transition-shadow focus:shadow-[0_0_0_3px_var(--shadow-color)]"
                  style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
                  placeholder="you@example.com"
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
                  style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
                  placeholder="At least 8 characters"
                />
                {password && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(strength.score / 5) * 100}%`,
                          background: strength.color,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs" style={{ color: strength.color }}>
                      {strength.label} password
                    </p>
                  </div>
                )}
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Confirm Password</label>
                <input
                  type="password"
                  {...register("confirmPassword")}
                  className="w-full rounded-2xl border px-4 py-3 outline-none transition-shadow focus:shadow-[0_0_0_3px_var(--shadow-color)]"
                  style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
                  placeholder="Type it again"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" isLoading={loading} className="w-full">
                Create My Account 💗
              </Button>
            </form>

            <button
              onClick={() => navigate("/")}
              className="mx-auto mt-4 block text-sm underline"
              style={{ color: "var(--text-secondary)" }}
            >
              Maybe later
            </button>
          </Card>
        </motion.div>
      </div>
    </PageShell>
  );
}
