import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";

export type Role = "owner" | "admin" | "client";

export interface Profile {
  id: string;
  role: Role;
  fullName: string | null;
  locale: string;
  disclaimerAcceptedAt: string | null;
}

interface ProfileContextValue {
  profile: Profile | null;
  role: Role | null;
  isOwner: boolean;
  isStaff: boolean;
  loading: boolean;
  error: string | null;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

interface Loaded {
  userId: string;
  profile: Profile | null;
  error: string | null;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("id, role, full_name, locale, disclaimer_accepted_at")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoaded({
          userId,
          error: error?.message ?? null,
          profile: data
            ? {
                id: data.id,
                role: data.role as Role,
                fullName: data.full_name,
                locale: data.locale,
                disclaimerAcceptedAt: data.disclaimer_accepted_at,
              }
            : null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const current = userId && loaded?.userId === userId ? loaded : null;
  const loading = authLoading || (userId !== null && current === null);
  // A signed in account with no profile row is treated as a client (least access).
  const role: Role | null = userId ? (current?.profile?.role ?? "client") : null;

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile: current?.profile ?? null,
      role: loading ? null : role,
      isOwner: !loading && role === "owner",
      isStaff: !loading && (role === "owner" || role === "admin"),
      loading,
      error: current?.error ?? null,
    }),
    [current, role, loading]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
