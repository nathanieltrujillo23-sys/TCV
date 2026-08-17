import type { AuditEntry, ManagedListItem, Preset, Transaction } from "../types";

export interface LedgerSnapshot {
  transactions: Transaction[];
  presets: Preset[];
  managedLists: ManagedListItem[];
  auditLog: AuditEntry[];
}

// Data-access contract. Per-row CRUD (rather than bulk load/save-all) so a
// real database backend only ever writes what actually changed.
export interface LedgerRepository {
  loadAll(): Promise<LedgerSnapshot>;

  insertTransaction(t: Transaction): Promise<void>;
  updateTransaction(t: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;

  insertPreset(p: Preset): Promise<void>;
  deletePreset(id: string): Promise<void>;

  insertManagedItem(m: ManagedListItem): Promise<void>;
  updateManagedItem(m: ManagedListItem): Promise<void>;
  deleteManagedItem(id: string): Promise<void>;

  insertAuditEntry(a: AuditEntry): Promise<void>;
}
