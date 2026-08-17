import { supabase } from "../lib/supabaseClient";
import type { AuditEntry, ManagedListItem, Preset, Transaction } from "../types";
import type { LedgerRepository, LedgerSnapshot } from "./repository";

function toTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    type: row.type as Transaction["type"],
    date: row.date as string,
    amount: Number(row.amount),
    accounts: row.accounts == null ? undefined : Number(row.accounts),
    purchases: row.purchases == null ? undefined : Number(row.purchases),
    item: (row.item as string) ?? undefined,
    vendor: (row.vendor as string) ?? undefined,
    accountMethod: (row.account_method as string) ?? undefined,
    presetId: (row.preset_id as string) ?? undefined,
  };
}

function fromTransaction(t: Transaction, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    type: t.type,
    date: t.date,
    amount: t.amount,
    accounts: t.accounts ?? null,
    purchases: t.purchases ?? null,
    item: t.item ?? null,
    vendor: t.vendor ?? null,
    account_method: t.accountMethod ?? null,
    preset_id: t.presetId ?? null,
  };
}

function toPreset(row: Record<string, unknown>): Preset {
  return {
    id: row.id as string,
    type: row.type as Preset["type"],
    label: row.label as string,
    item: (row.item as string) ?? undefined,
    vendor: (row.vendor as string) ?? undefined,
    accountMethod: (row.account_method as string) ?? undefined,
    defaultPrice: row.default_price == null ? undefined : Number(row.default_price),
    defaultPurchases: row.default_purchases == null ? undefined : Number(row.default_purchases),
    firm: (row.firm as string) ?? undefined,
    defaultAccounts: row.default_accounts == null ? undefined : Number(row.default_accounts),
    defaultAmount: row.default_amount == null ? undefined : Number(row.default_amount),
  };
}

function fromPreset(p: Preset, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    type: p.type,
    label: p.label,
    item: p.item ?? null,
    vendor: p.vendor ?? null,
    account_method: p.accountMethod ?? null,
    default_price: p.defaultPrice ?? null,
    default_purchases: p.defaultPurchases ?? null,
    firm: p.firm ?? null,
    default_accounts: p.defaultAccounts ?? null,
    default_amount: p.defaultAmount ?? null,
  };
}

function toManagedItem(row: Record<string, unknown>): ManagedListItem {
  return {
    id: row.id as string,
    category: row.category as ManagedListItem["category"],
    name: row.name as string,
  };
}

function fromManagedItem(m: ManagedListItem, userId: string) {
  return { id: m.id, user_id: userId, category: m.category, name: m.name };
}

function toAuditEntry(row: Record<string, unknown>): AuditEntry {
  return {
    id: row.id as string,
    transactionId: row.transaction_id as string,
    action: row.action as AuditEntry["action"],
    timestamp: row.timestamp as string,
    before: (row.before as Transaction) ?? undefined,
    after: (row.after as Transaction) ?? undefined,
  };
}

function fromAuditEntry(a: AuditEntry, userId: string) {
  return {
    id: a.id,
    user_id: userId,
    transaction_id: a.transactionId,
    action: a.action,
    timestamp: a.timestamp,
    before: a.before ?? null,
    after: a.after ?? null,
  };
}

function assertOk(error: { message: string } | null, context: string) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

export function createSupabaseRepository(userId: string): LedgerRepository {
  return {
    async loadAll(): Promise<LedgerSnapshot> {
      const [txRes, presetRes, listRes, auditRes] = await Promise.all([
        supabase.from("transactions").select("*").order("date", { ascending: false }),
        supabase.from("presets").select("*"),
        supabase.from("managed_list_items").select("*"),
        supabase.from("audit_log").select("*").order("timestamp", { ascending: false }).limit(500),
      ]);
      assertOk(txRes.error, "loadAll transactions");
      assertOk(presetRes.error, "loadAll presets");
      assertOk(listRes.error, "loadAll managed lists");
      assertOk(auditRes.error, "loadAll audit log");

      return {
        transactions: (txRes.data ?? []).map(toTransaction),
        presets: (presetRes.data ?? []).map(toPreset),
        managedLists: (listRes.data ?? []).map(toManagedItem),
        auditLog: (auditRes.data ?? []).map(toAuditEntry),
      };
    },

    async insertTransaction(t) {
      const { error } = await supabase.from("transactions").insert(fromTransaction(t, userId));
      assertOk(error, "insertTransaction");
    },
    async updateTransaction(t) {
      const { error } = await supabase.from("transactions").update(fromTransaction(t, userId)).eq("id", t.id);
      assertOk(error, "updateTransaction");
    },
    async deleteTransaction(id) {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      assertOk(error, "deleteTransaction");
    },

    async insertPreset(p) {
      const { error } = await supabase.from("presets").insert(fromPreset(p, userId));
      assertOk(error, "insertPreset");
    },
    async deletePreset(id) {
      const { error } = await supabase.from("presets").delete().eq("id", id);
      assertOk(error, "deletePreset");
    },

    async insertManagedItem(m) {
      const { error } = await supabase.from("managed_list_items").insert(fromManagedItem(m, userId));
      assertOk(error, "insertManagedItem");
    },
    async updateManagedItem(m) {
      const { error } = await supabase
        .from("managed_list_items")
        .update(fromManagedItem(m, userId))
        .eq("id", m.id);
      assertOk(error, "updateManagedItem");
    },
    async deleteManagedItem(id) {
      const { error } = await supabase.from("managed_list_items").delete().eq("id", id);
      assertOk(error, "deleteManagedItem");
    },

    async insertAuditEntry(a) {
      const { error } = await supabase.from("audit_log").insert(fromAuditEntry(a, userId));
      assertOk(error, "insertAuditEntry");
    },
  };
}
