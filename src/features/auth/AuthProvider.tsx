import * as React from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const DEMO_EMAIL = "demo@daikin.com";
export const DEMO_PASSWORD = "DaikinDemo2026!";

export interface AppUser {
  email: string;
  name: string;
  role: string;
  initials: string;
}

interface AuthContextValue {
  user: AppUser | null;
  ready: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const SESSION_KEY = "dcmi.v1.session";

function profileFor(email: string): AppUser {
  const local = email.split("@")[0] ?? "user";
  const parts = local.split(/[._-]/).filter(Boolean);
  const name =
    email === DEMO_EMAIL
      ? "Demo Analyst"
      : parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  const initials = name
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
  return { email, name, role: "Competitive Marketing", initials };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AppUser | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        const email = data.session?.user?.email;
        if (!cancelled && email) {
          setUser(profileFor(email));
          setReady(true);
          return;
        }
      }
      try {
        const stored =
          window.localStorage.getItem(SESSION_KEY) ?? window.sessionStorage.getItem(SESSION_KEY);
        if (!cancelled && stored) setUser(JSON.parse(stored) as AppUser);
      } catch {
        /* corrupt session payload -- start signed out */
      }
      if (!cancelled) setReady(true);
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = React.useCallback(
    async (email: string, password: string, remember: boolean) => {
      const normalized = email.trim().toLowerCase();

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalized,
          password,
        });
        if (!error && data.user?.email) {
          const profile = profileFor(data.user.email);
          setUser(profile);
          return { error: null };
        }
        // Fall through to the built-in demo credential so the app is usable
        // before the Supabase project has any users provisioned.
      }

      if (normalized !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
        return { error: "That email and password combination was not recognised." };
      }

      const profile = profileFor(normalized);
      setUser(profile);
      const store = remember ? window.localStorage : window.sessionStorage;
      try {
        store.setItem(SESSION_KEY, JSON.stringify(profile));
        (remember ? window.sessionStorage : window.localStorage).removeItem(SESSION_KEY);
      } catch {
        /* storage unavailable -- session lives for this tab only */
      }
      return { error: null };
    },
    [],
  );

  const signOut = React.useCallback(async () => {
    if (isSupabaseConfigured && supabase) await supabase.auth.signOut();
    try {
      window.localStorage.removeItem(SESSION_KEY);
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* nothing to clear */
    }
    setUser(null);
  }, []);

  const value = React.useMemo(() => ({ user, ready, signIn, signOut }), [user, ready, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
