import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import type { AccountType, Employment } from "../lib/access";

export interface SignUpDetails {
  accountType: AccountType;
  employment?: Employment;
  businessTrades?: boolean;
  businessName?: string;
}

interface AuthContextValue {
  user: User | null;
  businessName: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    details: SignUpDetails
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  updateBusinessName: (name: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthContextValue["signUp"] = async (email, password, details) => {
    const trimmedName = details.businessName?.trim();
    const isBusiness = details.accountType === "business";
    // Copied into the profile by the signup trigger, which validates every value.
    const data: Record<string, string | boolean> = {
      account_type: details.accountType,
      business_trades: isBusiness && !!details.businessTrades,
    };
    if (!isBusiness && details.employment) data.employment = details.employment;
    if (isBusiness && trimmedName) data.business_name = trimmedName;
    const { data: result, error } = await supabase.auth.signUp({ email, password, options: { data } });
    if (error) return { error: error.message, needsConfirmation: false };
    // If email confirmation is required, Supabase returns a user but no
    // session — the caller should tell the person to check their inbox.
    return { error: null, needsConfirmation: !result.session };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateBusinessName: AuthContextValue["updateBusinessName"] = async (name) => {
    const { error } = await supabase.auth.updateUser({ data: { business_name: name.trim() } });
    return { error: error?.message ?? null };
  };

  const businessName = (user?.user_metadata?.business_name as string | undefined)?.trim() || null;

  const value = useMemo<AuthContextValue>(
    () => ({ user, businessName, loading, signIn, signUp, signOut, updateBusinessName }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, businessName, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
