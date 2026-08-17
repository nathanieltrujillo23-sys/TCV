export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string; // ISO 8601
  amount: number; // expense: per-purchase price; income: per-account amount
  accounts?: number; // income only, default 1; total = amount * accounts
  purchases?: number; // expense only, default 1; total = amount * purchases
  item?: string; // expense only
  vendor?: string; // expense: "where bought"; income: "firm"
  accountMethod?: string; // expense only: card/bank used
  presetId?: string;
}

export interface Preset {
  id: string;
  type: TransactionType;
  label: string;
  // expense fields
  item?: string;
  vendor?: string;
  accountMethod?: string;
  defaultPrice?: number;
  defaultPurchases?: number;
  // income fields
  firm?: string;
  defaultAccounts?: number;
  defaultAmount?: number;
}

export type Period = "week" | "month" | "quarter" | "year";

export type ViewMode = "entry" | "summary";

export type ManagedListCategory = "vendor" | "accountMethod" | "firm" | "item";

export interface ManagedListItem {
  id: string;
  category: ManagedListCategory;
  name: string;
}

export type AuditAction = "create" | "update" | "delete";

export interface AuditEntry {
  id: string;
  transactionId: string;
  action: AuditAction;
  timestamp: string; // ISO 8601
  before?: Transaction;
  after?: Transaction;
}
