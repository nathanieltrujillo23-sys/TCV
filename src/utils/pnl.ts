import type { Transaction } from "../types";
import { transactionTotal } from "./format";

export interface PnlRow {
  label: string;
  income: number;
  expense: number;
  net: number;
}

function bucketPnl(
  transactions: Transaction[],
  keyOf: (d: Date) => string,
  labelOf: (key: string) => string
): PnlRow[] {
  const rows = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const key = keyOf(new Date(t.date));
    const row = rows.get(key) ?? { income: 0, expense: 0 };
    const total = transactionTotal(t);
    if (t.type === "income") row.income += total;
    else row.expense += total;
    rows.set(key, row);
  }
  return Array.from(rows.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, { income, expense }]) => ({ label: labelOf(key), income, expense, net: income - expense }));
}

export function monthlyPnl(transactions: Transaction[]): PnlRow[] {
  return bucketPnl(
    transactions,
    (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    (key) => {
      const [y, m] = key.split("-").map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    }
  );
}

export function quarterlyPnl(transactions: Transaction[]): PnlRow[] {
  return bucketPnl(
    transactions,
    (d) => `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`,
    (key) => key.replace("-", " ")
  );
}

export function yearlyPnl(transactions: Transaction[]): PnlRow[] {
  return bucketPnl(
    transactions,
    (d) => `${d.getFullYear()}`,
    (key) => key
  );
}
