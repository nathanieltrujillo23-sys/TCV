import type { Transaction, TransactionType } from "../types";
import type { DateRange } from "./period";
import { isWithinRange } from "./period";
import { transactionTotal } from "./format";

export interface BreakdownItem {
  label: string;
  value: number;
  percent: number;
}

function groupAndRank(
  transactions: Transaction[],
  range: DateRange,
  limit: number,
  matches: (t: Transaction) => boolean,
  keyOf: (t: Transaction) => string
): BreakdownItem[] {
  const totals = new Map<string, number>();

  for (const t of transactions) {
    if (!matches(t)) continue;
    if (!isWithinRange(t.date, range)) continue;
    const key = keyOf(t);
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

// Groups a range's transactions of one type by counterparty (vendor for
// expenses, firm for income — both stored in the `vendor` field), collapsing
// anything past `limit` into a single "Other" bucket.
export function breakdownByCounterparty(
  transactions: Transaction[],
  type: TransactionType,
  range: DateRange,
  limit = 5
): BreakdownItem[] {
  return groupAndRank(
    transactions,
    range,
    limit,
    (t) => t.type === type,
    (t) => t.vendor?.trim() || "Unknown"
  );
}

// Groups a range's expenses by tax-reporting category, collapsing anything
// past `limit` into a single "Other" bucket.
export function breakdownByCategory(transactions: Transaction[], range: DateRange, limit = 5): BreakdownItem[] {
  return groupAndRank(
    transactions,
    range,
    limit,
    (t) => t.type === "expense",
    (t) => t.category?.trim() || "Uncategorized"
  );
}
