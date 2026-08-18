import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  AuditEntry,
  ManagedListCategory,
  ManagedListItem,
  Period,
  Preset,
  Transaction,
  TransactionType,
  ViewMode,
} from "../types";
import type { LedgerRepository, LedgerSnapshot } from "../data/repository";
import { type DateRange, periodLabel, periodRange, rangeLabel } from "../utils/period";

const MAX_AUDIT_ENTRIES = 500;

function uid(): string {
  return crypto.randomUUID();
}

interface LedgerContextValue {
  transactions: Transaction[];
  presets: Preset[];
  managedLists: ManagedListItem[];
  auditLog: AuditEntry[];
  loading: boolean;
  loadError: string | null;
  period: Period;
  setPeriod: (p: Period) => void;
  // Anchor date the selected period is computed relative to. Changing
  // `period` resets this to today; shiftPeriod pages it back/forward by
  // one unit of the current period without changing the period type.
  periodReference: Date;
  shiftPeriod: (direction: 1 | -1) => void;
  // Set to page through weeks/months/quarters/years; cleared whenever a
  // custom range is applied or a preset period is picked.
  customRange: DateRange | null;
  setCustomRange: (range: DateRange | null) => void;
  // The date range actually in effect right now — customRange if set,
  // otherwise the preset period resolved against periodReference. Every
  // consumer should filter against this instead of period/periodReference
  // directly so custom ranges apply everywhere automatically.
  effectiveRange: DateRange;
  effectiveLabel: string;
  primaryView: TransactionType;
  setPrimaryView: (v: TransactionType) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;

  addTransaction: (t: Omit<Transaction, "id" | "date"> & { date?: string }) => Transaction;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addPreset: (p: Omit<Preset, "id">) => Preset;
  deletePreset: (id: string) => void;
  logPreset: (presetId: string, direction: 1 | -1, dateISO?: string) => void;

  listNames: (category: ManagedListCategory) => string[];
  addManagedItem: (category: ManagedListCategory, name: string) => void;
  renameManagedItem: (id: string, newName: string) => void;
  deleteManagedItem: (id: string) => void;

  // Bulk-inserts an entire snapshot (used by the one-time local-data import
  // flow) and refreshes state from the repository afterward.
  importSnapshot: (snapshot: LedgerSnapshot) => Promise<void>;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

export function LedgerProvider({
  children,
  repository,
}: {
  children: ReactNode;
  repository: LedgerRepository;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [managedLists, setManagedLists] = useState<ManagedListItem[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [period, setPeriodState] = useState<Period>("month");
  const [periodReference, setPeriodReference] = useState<Date>(() => new Date());
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [primaryView, setPrimaryView] = useState<TransactionType>("income");
  const [viewMode, setViewMode] = useState<ViewMode>("entry");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    repository
      .loadAll()
      .then((snapshot) => {
        if (cancelled) return;
        setTransactions(snapshot.transactions);
        setPresets(snapshot.presets);
        setManagedLists(snapshot.managedLists);
        setAuditLog(snapshot.auditLog);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const setPeriod: LedgerContextValue["setPeriod"] = (p) => {
    setPeriodState(p);
    setPeriodReference(new Date());
    setCustomRange(null);
  };

  const shiftPeriod: LedgerContextValue["shiftPeriod"] = (direction) => {
    setCustomRange(null);
    setPeriodReference((prev) => {
      const next = new Date(prev);
      if (period === "week") next.setDate(next.getDate() + 7 * direction);
      else if (period === "month") next.setMonth(next.getMonth() + direction);
      else if (period === "quarter") next.setMonth(next.getMonth() + 3 * direction);
      else next.setFullYear(next.getFullYear() + direction);
      return next;
    });
  };

  const effectiveRange = useMemo<DateRange>(
    () => customRange ?? periodRange(period, periodReference),
    [customRange, period, periodReference]
  );
  const effectiveLabel = customRange ? rangeLabel(customRange) : periodLabel(period, periodReference);

  function logAudit(action: AuditEntry["action"], transactionId: string, before?: Transaction, after?: Transaction) {
    const entry: AuditEntry = { id: uid(), transactionId, action, timestamp: new Date().toISOString(), before, after };
    setAuditLog((prev) => [entry, ...prev].slice(0, MAX_AUDIT_ENTRIES));
    repository.insertAuditEntry(entry).catch((err) => console.error("Failed to persist audit entry:", err));
  }

  function ensureManagedItem(category: ManagedListCategory, name?: string) {
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    const exists = managedLists.some((m) => m.category === category && m.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;
    const item: ManagedListItem = { id: uid(), category, name: trimmed };
    setManagedLists((prev) => [...prev, item]);
    repository.insertManagedItem(item).catch((err) => console.error("Failed to persist managed item:", err));
  }

  function registerFieldsFrom(t: { type: TransactionType; vendor?: string; accountMethod?: string; item?: string }) {
    if (t.type === "expense") {
      ensureManagedItem("vendor", t.vendor);
      ensureManagedItem("accountMethod", t.accountMethod);
      ensureManagedItem("item", t.item);
    } else {
      ensureManagedItem("firm", t.vendor);
    }
  }

  const addTransaction: LedgerContextValue["addTransaction"] = (t) => {
    const tx: Transaction = { id: uid(), date: t.date ?? new Date().toISOString(), ...t };
    setTransactions((prev) => [tx, ...prev]);
    registerFieldsFrom(tx);
    logAudit("create", tx.id, undefined, tx);
    repository.insertTransaction(tx).catch((err) => console.error("Failed to persist transaction:", err));
    return tx;
  };

  const updateTransaction: LedgerContextValue["updateTransaction"] = (id, patch) => {
    const before = transactions.find((t) => t.id === id);
    if (!before) return;
    const after: Transaction = { ...before, ...patch };
    setTransactions((prev) => prev.map((t) => (t.id === id ? after : t)));
    registerFieldsFrom(after);
    logAudit("update", id, before, after);
    repository.updateTransaction(after).catch((err) => console.error("Failed to persist transaction update:", err));
  };

  const deleteTransaction: LedgerContextValue["deleteTransaction"] = (id) => {
    const before = transactions.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (before) logAudit("delete", id, before, undefined);
    repository.deleteTransaction(id).catch((err) => console.error("Failed to persist transaction delete:", err));
  };

  const addPreset: LedgerContextValue["addPreset"] = (p) => {
    const preset: Preset = { id: uid(), ...p };
    setPresets((prev) => [preset, ...prev]);
    if (preset.type === "expense") {
      ensureManagedItem("vendor", preset.vendor);
      ensureManagedItem("accountMethod", preset.accountMethod);
      ensureManagedItem("item", preset.item);
    } else {
      ensureManagedItem("firm", preset.firm);
    }
    repository.insertPreset(preset).catch((err) => console.error("Failed to persist preset:", err));
    return preset;
  };

  const deletePreset: LedgerContextValue["deletePreset"] = (id) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    repository.deletePreset(id).catch((err) => console.error("Failed to persist preset delete:", err));
  };

  const logPreset: LedgerContextValue["logPreset"] = (presetId, direction, dateISO) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    if (direction === 1) {
      addTransaction(
        preset.type === "expense"
          ? {
              type: "expense",
              date: dateISO,
              amount: preset.defaultPrice ?? 0,
              purchases: preset.defaultPurchases ?? 1,
              item: preset.item,
              vendor: preset.vendor,
              accountMethod: preset.accountMethod,
              presetId: preset.id,
            }
          : {
              type: "income",
              date: dateISO,
              amount: preset.defaultAmount ?? 0,
              accounts: preset.defaultAccounts ?? 1,
              vendor: preset.firm,
              presetId: preset.id,
            }
      );
    } else {
      const match = transactions.find((t) => t.presetId === preset.id);
      if (match) deleteTransaction(match.id);
    }
  };

  const listNames: LedgerContextValue["listNames"] = (category) =>
    managedLists
      .filter((m) => m.category === category)
      .map((m) => m.name)
      .sort((a, b) => a.localeCompare(b));

  const addManagedItem: LedgerContextValue["addManagedItem"] = (category, name) => {
    ensureManagedItem(category, name);
  };

  const renameManagedItem: LedgerContextValue["renameManagedItem"] = (id, newName) => {
    const item = managedLists.find((m) => m.id === id);
    if (!item) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === item.name) return;

    const renamed = { ...item, name: trimmed };
    setManagedLists((prev) => prev.map((m) => (m.id === id ? renamed : m)));
    repository.updateManagedItem(renamed).catch((err) => console.error("Failed to persist managed item rename:", err));

    const field = item.category === "firm" ? "vendor" : item.category;
    const affectedType: TransactionType = item.category === "firm" ? "income" : "expense";

    transactions
      .filter((t) => t.type === affectedType && t[field] === item.name)
      .forEach((t) => updateTransaction(t.id, { [field]: trimmed } as Partial<Transaction>));

    setPresets((prev) =>
      prev.map((p) => {
        if (item.category === "vendor" && p.type === "expense" && p.vendor === item.name) {
          return { ...p, vendor: trimmed };
        }
        if (item.category === "accountMethod" && p.type === "expense" && p.accountMethod === item.name) {
          return { ...p, accountMethod: trimmed };
        }
        if (item.category === "item" && p.type === "expense" && p.item === item.name) {
          return { ...p, item: trimmed };
        }
        if (item.category === "firm" && p.type === "income" && p.firm === item.name) {
          return { ...p, firm: trimmed };
        }
        return p;
      })
    );
  };

  const deleteManagedItem: LedgerContextValue["deleteManagedItem"] = (id) => {
    setManagedLists((prev) => prev.filter((m) => m.id !== id));
    repository.deleteManagedItem(id).catch((err) => console.error("Failed to persist managed item delete:", err));
  };

  const importSnapshot: LedgerContextValue["importSnapshot"] = async (snapshot) => {
    for (const t of snapshot.transactions) await repository.insertTransaction(t);
    for (const p of snapshot.presets) await repository.insertPreset(p);
    for (const m of snapshot.managedLists) await repository.insertManagedItem(m);
    for (const a of snapshot.auditLog) await repository.insertAuditEntry(a);
    const fresh = await repository.loadAll();
    setTransactions(fresh.transactions);
    setPresets(fresh.presets);
    setManagedLists(fresh.managedLists);
    setAuditLog(fresh.auditLog);
  };

  const value = useMemo<LedgerContextValue>(
    () => ({
      transactions,
      presets,
      managedLists,
      auditLog,
      loading,
      loadError,
      period,
      setPeriod,
      periodReference,
      shiftPeriod,
      customRange,
      setCustomRange,
      effectiveRange,
      effectiveLabel,
      primaryView,
      setPrimaryView,
      viewMode,
      setViewMode,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addPreset,
      deletePreset,
      logPreset,
      listNames,
      addManagedItem,
      renameManagedItem,
      deleteManagedItem,
      importSnapshot,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      transactions,
      presets,
      managedLists,
      auditLog,
      loading,
      loadError,
      period,
      periodReference,
      customRange,
      effectiveRange,
      effectiveLabel,
      primaryView,
      viewMode,
    ]
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger(): LedgerContextValue {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used within a LedgerProvider");
  return ctx;
}
