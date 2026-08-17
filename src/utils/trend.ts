import type { Period, Transaction, TransactionType } from "../types";
import { periodRange } from "./period";
import { transactionTotal } from "./format";

export interface TrendPoint {
  label: string;
  value: number;
}

export function trendBuckets(
  period: Period,
  transactions: Transaction[],
  type: TransactionType,
  reference: Date = new Date()
): TrendPoint[] {
  const { start, end } = periodRange(period, reference);
  const relevant = transactions.filter((t) => t.type === type);

  const sum = (bucketStart: Date, bucketEnd: Date) =>
    relevant.reduce((total, t) => {
      const time = new Date(t.date).getTime();
      return time >= bucketStart.getTime() && time < bucketEnd.getTime() ? total + transactionTotal(t) : total;
    }, 0);

  if (period === "week" || period === "month") {
    const points: TrendPoint[] = [];
    const cursor = new Date(start);
    while (cursor < end) {
      const bucketStart = new Date(cursor);
      const bucketEnd = new Date(cursor);
      bucketEnd.setDate(bucketEnd.getDate() + 1);
      points.push({
        label: bucketStart.toLocaleDateString(undefined, { day: "numeric", month: period === "week" ? "short" : undefined }),
        value: sum(bucketStart, bucketEnd),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return points;
  }

  // quarter / year -> monthly buckets
  const points: TrendPoint[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor < end) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    points.push({
      label: bucketStart.toLocaleDateString(undefined, { month: "short" }),
      value: sum(bucketStart, bucketEnd),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return points;
}
