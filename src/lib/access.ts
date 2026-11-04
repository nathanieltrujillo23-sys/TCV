export type Role = "owner" | "admin" | "client";
export type AccountType = "person" | "business";
export type Employment = "student" | "employed" | "self_employed" | "trader" | "retired" | "not_working" | "other";

export const EMPLOYMENT_OPTIONS: Employment[] = [
  "student",
  "employed",
  "self_employed",
  "trader",
  "retired",
  "not_working",
  "other",
];

export interface AccessProfile {
  role: Role | null;
  accountType: AccountType | null;
  employment: Employment | null;
  businessTrades: boolean;
}

export interface Access {
  /** Can open /app at all. */
  workspace: boolean;
  ledger: boolean;
  journal: boolean;
  /** Owner or admin: portfolio, AI trade review. */
  staffTools: boolean;
  /** Owner only: contact inbox, client progress. */
  ownerTools: boolean;
}

/**
 * Mirrors public.has_ledger_access() and public.has_journal_access() in
 * supabase/005_account_types.sql. The database rules are what actually
 * protect data; this only decides what the screens show.
 */
export function accessFor(p: AccessProfile): Access {
  const staff = p.role === "owner" || p.role === "admin";
  const ledger = staff || p.accountType === "business";
  const journal =
    staff ||
    (p.accountType === "person" && p.employment === "trader") ||
    (p.accountType === "business" && p.businessTrades);
  return { workspace: ledger || journal, ledger, journal, staffTools: staff, ownerTools: p.role === "owner" };
}

export const NO_ACCESS: Access = { workspace: false, ledger: false, journal: false, staffTools: false, ownerTools: false };
