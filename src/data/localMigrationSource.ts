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

// The old local system generated ids like "msxv2agt-yexbly" — fine for
// localStorage, but invalid for Postgres `uuid` columns. Every row gets a
// fresh UUID here, with cross-references (transaction -> preset, audit
// entry -> transaction) rewritten to match. Nested before/after snapshots
// on audit entries are jsonb, not real columns, so their old-format ids are
// left as-is — they're just historical record, not real references.
function remapToFreshIds(snapshot: LedgerSnapshot): LedgerSnapshot {
  const presetIdMap = new Map<string, string>();
  const txIdMap = new Map<string, string>();

  const presets = snapshot.presets.map((p) => {
    const newId = crypto.randomUUID();
    presetIdMap.set(p.id, newId);
    return { ...p, id: newId };
  });

  const transactions = snapshot.transactions.map((t) => {
    const newId = crypto.randomUUID();
    txIdMap.set(t.id, newId);
    return {
      ...t,
      id: newId,
      presetId: t.presetId ? presetIdMap.get(t.presetId) : undefined,
    };
  });

  const managedLists = snapshot.managedLists.map((m) => ({ ...m, id: crypto.randomUUID() }));

  const auditLog = snapshot.auditLog.map((a) => ({
    ...a,
    id: crypto.randomUUID(),
    transactionId: txIdMap.get(a.transactionId) ?? crypto.randomUUID(),
  }));

  return { transactions, presets, managedLists, auditLog };
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
      snapshot: remapToFreshIds({ transactions, presets, managedLists, auditLog }),
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
