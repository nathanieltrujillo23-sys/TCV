import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";
import { accessFor, NO_ACCESS, type Access, type AccountType, type Employment, type Role } from "../lib/access";

export interface Profile {
  id: string;
  role: Role;
  fullName: string | null;
  locale: string;
  disclaimerAcceptedAt: string | null;
  accountType: AccountType | null;
  employment: Employment | null;
  businessTrades: boolean;
}

export interface ProfileAnswers {
  accountType: AccountType;
  employment: Employment | null;
  businessTrades: boolean;
}

interface ProfileContextValue {
  profile: Profile | null;
  role: Role | null;
  access: Access;
  isOwner: boolean;
  isStaff: boolean;
  loading: boolean;
  error: string | null;
  updateAnswers: (answers: ProfileAnswers) => Promise<{ error: string | null }>;
  acceptDisclaimer: () => Promise<{ error: string | null }>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

interface Loaded {
  userId: string;
  profile: Profile | null;
  error: string | null;
}

const COLUMNS = "id, role, full_name, locale, disclaimer_accepted_at, account_type, employment, business_trades";

function toProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    role: row.role as Role,
    fullName: (row.full_name as string | null) ?? null,
    locale: row.locale as string,
    disclaimerAcceptedAt: (row.disclaimer_accepted_at as string | null) ?? null,
    accountType: (row.account_type as AccountType | null) ?? null,
    employment: (row.employment as Employment | null) ?? null,
    businessTrades: !!row.business_trades,
  };
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
      .select(COLUMNS)
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoaded({ userId, error: error?.message ?? null, profile: data ? toProfile(data) : null });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const updateAnswers = useCallback<ProfileContextValue["updateAnswers"]>(
    async (answers) => {
      if (!userId) return { error: "Not signed in" };
      const isPerson = answers.accountType === "person";
      const { data, error } = await supabase
        .from("profiles")
        .update({
          account_type: answers.accountType,
          employment: isPerson ? answers.employment : null,
          business_trades: !isPerson && answers.businessTrades,
        })
        .eq("id", userId)
        .select(COLUMNS)
        .single();
      if (error) return { error: error.message };
      setLoaded({ userId, error: null, profile: toProfile(data) });
      return { error: null };
    },
    [userId]
  );

  const acceptDisclaimer = useCallback<ProfileContextValue["acceptDisclaimer"]>(async () => {
    if (!userId) return { error: "Not signed in" };
    const { data, error } = await supabase
      .from("profiles")
      .update({ disclaimer_accepted_at: new Date().toISOString() })
      .eq("id", userId)
      .select(COLUMNS)
      .single();
    if (error) return { error: error.message };
    setLoaded({ userId, error: null, profile: toProfile(data) });
    return { error: null };
  }, [userId]);

  const current = userId && loaded?.userId === userId ? loaded : null;
  const loading = authLoading || (userId !== null && current === null);
  const profile = current?.profile ?? null;
  // A signed in account with no profile row is treated as a client (least access).
  const role: Role | null = userId && !loading ? (profile?.role ?? "client") : null;

  const value = useMemo<ProfileContextValue>(() => {
    const access = role
      ? accessFor({
          role,
          accountType: profile?.accountType ?? null,
          employment: profile?.employment ?? null,
          businessTrades: profile?.businessTrades ?? false,
        })
      : NO_ACCESS;
    return {
      profile,
      role,
      access,
      isOwner: access.ownerTools,
      isStaff: access.staffTools,
      loading,
      error: current?.error ?? null,
      updateAnswers,
      acceptDisclaimer,
    };
  }, [profile, role, loading, current, updateAnswers, acceptDisclaimer]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
