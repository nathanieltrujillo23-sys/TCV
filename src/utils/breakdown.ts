import type { Period, Transaction, TransactionType } from "../types";
import { isWithinPeriod } from "./period";
import { transactionTotal } from "./format";

export interface BreakdownItem {
  label: string;
  value: number;
  percent: number;
}

// Groups a period's transactions of one type by counterparty (vendor for
// expenses, firm for income — both stored in the `vendor` field), collapsing
// anything past `limit` into a single "Other" bucket.
export function breakdownByCounterparty(
  transactions: Transaction[],
  type: TransactionType,
  period: Period,
  limit = 5
): BreakdownItem[] {
  const totals = new Map<string, number>();

  for (const t of transactions) {
    if (t.type !== type) continue;
    if (!isWithinPeriod(t.date, period)) continue;
    const key = t.vendor?.trim() || "Unknown";
    totals.set(key, (totals.get(key) ?? 0) + transactionTotal(t));
  }

  const sorted = Array.from(totals.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const total = sorted.reduce((sum, i) => sum + i.value, 0);
  if (total === 0) return [];

  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  const restTotal = rest.reduce((sum, i) => sum + i.value, 0);

  const items: BreakdownItem[] = top.map((i) => ({ ...i, percent: (i.value / total) * 100 }));
  if (restTotal > 0) {
    items.push({ label: "Other", value: restTotal, percent: (restTotal / total) * 100 });
  }
  return items;
}
