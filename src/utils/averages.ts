import type { Transaction } from "../types";
import { transactionTotal } from "./format";

export type AverageGranularity = "week" | "month";

export interface AverageStats {
  avgIncome: number;
  avgExpense: number;
  bucketCount: number;
}

function bucketKey(date: Date, granularity: AverageGranularity): string {
  if (granularity === "month") return `${date.getFullYear()}-${date.getMonth()}`;
  const start = new Date(date);
  const diffToMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);
  return start.toISOString().slice(0, 10);
}

// Averages income/expenses per calendar week or month, counting only
// buckets that actually contain at least one transaction — so a brand-new
// account isn't dragged toward zero by months with no activity yet.
export function computeAverages(transactions: Transaction[], granularity: AverageGranularity): AverageStats {
  const incomeBuckets = new Map<string, number>();
  const expenseBuckets = new Map<string, number>();

  for (const t of transactions) {
    const key = bucketKey(new Date(t.date), granularity);
    const buckets = t.type === "income" ? incomeBuckets : expenseBuckets;
    buckets.set(key, (buckets.get(key) ?? 0) + transactionTotal(t));
  }

  const bucketCount = new Set([...incomeBuckets.keys(), ...expenseBuckets.keys()]).size;
  if (bucketCount === 0) return { avgIncome: 0, avgExpense: 0, bucketCount: 0 };

  const totalIncome = [...incomeBuckets.values()].reduce((a, b) => a + b, 0);
  const totalExpense = [...expenseBuckets.values()].reduce((a, b) => a + b, 0);

  return {
    avgIncome: totalIncome / bucketCount,
    avgExpense: totalExpense / bucketCount,
    bucketCount,
  };
}
