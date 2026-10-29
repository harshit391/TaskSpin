"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { clearPersistedQueryCache } from "@/components/QueryProvider";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const bypassId =
    process.env.NODE_ENV !== "production" ? process.env.NEXT_PUBLIC_AUTH_BYPASS_USER_ID : undefined;
  const [user, setUser] = useState<User | null>(
    bypassId ? ({ id: bypassId, email: "dev@local" } as User) : null
  );
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!bypassId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (bypassId) return;

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [bypassId]);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Don't leave the previous user's data on a shared device
    queryClient.clear();
    clearPersistedQueryCache();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
