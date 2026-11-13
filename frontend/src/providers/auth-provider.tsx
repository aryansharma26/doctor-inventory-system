import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiClientError, api } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export type Identity = {
  user: {
    id: string;
    email: string;
    fullName: string;
    isPlatformAdmin: boolean;
  };
  assuranceLevel: "aal1" | "aal2";
  selectedClinicId: string | null;
  selectedRole: string | null;
  permissions: string[];
  clinics: Array<{ id: string; name: string; code: string; role: string }>;
  impersonationId: string | null;
};

type AuthContextValue = {
  session: Session | null;
  identity: Identity | null;
  loading: boolean;
  selectClinic: (clinicId: string) => Promise<void>;
  refreshIdentity: () => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const loadIdentity = useCallback(async () => {
    try {
      const next = await api<Identity>("/auth/me");
      setIdentity(next);
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.code === "TENANT_ACCESS_DENIED"
      ) {
        localStorage.removeItem("clinora.clinicId");
        setIdentity(await api<Identity>("/auth/me"));
        return;
      }
      throw error;
    }
  }, []);
  useEffect(() => {
    void supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data.session);
        if (data.session) {
          await loadIdentity();
          await api<void>("/auth/session", { method: "POST" });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) setIdentity(null);
    });
    return () => data.subscription.unsubscribe();
  }, [loadIdentity]);
  const value = useMemo(
    () => ({
      session,
      identity,
      loading,
      refreshIdentity: loadIdentity,
      selectClinic: async (clinicId: string) => {
        localStorage.setItem("clinora.clinicId", clinicId);
        await loadIdentity();
        await queryClient.invalidateQueries();
      },
      signOut: async () => {
        localStorage.removeItem("clinora.clinicId");
        await supabase.auth.signOut();
      },
    }),
    [session, identity, loading, queryClient, loadIdentity],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
};
