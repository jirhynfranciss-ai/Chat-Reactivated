import { useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { checkIsAdmin } from "../services/authService";

export function useAuthBootstrap() {
  const { setSession, setIsAdmin, setInitialized } = useAuthStore();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setInitialized(true);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        const admin = await checkIsAdmin(data.session.user.id);
        if (active) setIsAdmin(admin);
      }
      setInitialized(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          const admin = await checkIsAdmin(session.user.id);
          setIsAdmin(admin);
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [setSession, setIsAdmin, setInitialized]);
}
