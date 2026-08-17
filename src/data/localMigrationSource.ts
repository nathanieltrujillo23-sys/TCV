import type { AuditEntry, ManagedListItem, Preset, Transaction } from "../types";
import type { LedgerSnapshot } from "./repository";

// Read-only access to data left behind by the old local "pick a profile"
// system (pre-Supabase), keyed by the account ids it used to assign. Used
// once, right after a real sign-in, to offer importing that data into the
// new cloud account — see MigrationPrompt.
interface LocalAccount {
  id: string;
  name: string;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export interface LocalMigrationCandidate {
  accountId: string;
  accountName: string;
  snapshot: LedgerSnapshot;
  transactionCount: number;
}

export function findLocalMigrationCandidates(): LocalMigrationCandidate[] {
  const accounts = readJSON<LocalAccount[]>("tcv-ledger:accounts", []);
  const candidates: LocalMigrationCandidate[] = [];

  for (const account of accounts) {
    const prefix = `tcv-ledger:${account.id}:`;
    const transactions = readJSON<Transaction[]>(`${prefix}transactions`, []);
    const presets = readJSON<Preset[]>(`${prefix}presets`, []);
    const managedLists = readJSON<ManagedListItem[]>(`${prefix}managed-lists`, []);
    const auditLog = readJSON<AuditEntry[]>(`${prefix}audit-log`, []);

    if (transactions.length === 0 && presets.length === 0) continue;

    candidates.push({
      accountId: account.id,
      accountName: account.name,
      snapshot: { transactions, presets, managedLists, auditLog },
      transactionCount: transactions.length,
    });
  }

  return candidates.sort((a, b) => b.transactionCount - a.transactionCount);
}

export function clearLocalAccountData(accountId: string): void {
  const prefix = `tcv-ledger:${accountId}:`;
  localStorage.removeItem(`${prefix}transactions`);
  localStorage.removeItem(`${prefix}presets`);
  localStorage.removeItem(`${prefix}managed-lists`);
  localStorage.removeItem(`${prefix}audit-log`);
}
