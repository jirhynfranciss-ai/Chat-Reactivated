import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { Button } from "../../components/ui/Button";
import { fetchSettings, updateSettings } from "../../services/adminService";
import { useAdminThemeStore } from "../../store/useAdminThemeStore";
import type { AdminSettings } from "../../types";

export default function AdminSettingsPage() {
  const { theme, setTheme } = useAdminThemeStore();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm<AdminSettings>();

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        setSettings(data);
        if (data) reset(data);
      })
      .finally(() => setLoading(false));
  }, [reset]);

  async function onSubmit(values: AdminSettings) {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSettings(settings.id, values);
      toast.success("Settings saved 💗");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <h1 className="font-serif mb-6 text-2xl font-semibold sm:text-3xl">Settings</h1>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading settings...</p>
      ) : !settings ? (
        <p style={{ color: "var(--text-secondary)" }}>
          No settings row found yet. Run the SQL seed script to create default settings.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="romantic-card max-w-2xl space-y-5 rounded-3xl p-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Website Title</label>
            <input
              {...register("site_title")}
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Welcome Message</label>
            <textarea
              {...register("welcome_message")}
              rows={2}
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Final / Thank You Message</label>
            <textarea
              {...register("final_message")}
              rows={2}
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Theme Appearance Preview</label>
            <div className="flex gap-3">
              {(["light", "dark"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTheme(t)}
                  className="rounded-xl border px-4 py-2 text-sm capitalize"
                  style={{
                    borderColor: theme === t ? "var(--accent)" : "var(--border-color)",
                    background: theme === t ? "var(--surface-alt)" : "transparent",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("questionnaire_enabled")} />
              Questionnaire Enabled
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("allow_multiple_submissions")} />
              Allow Multiple Submissions
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("account_creation_enabled")} />
              Account Creation Enabled
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("chat_enabled")} />
              Chat Enabled
            </label>
          </div>

          <Button type="submit" isLoading={saving}>
            Save Settings
          </Button>
        </form>
      )}
    </AdminLayout>
  );
}
