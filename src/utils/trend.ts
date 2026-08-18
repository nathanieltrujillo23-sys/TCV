import type { Transaction, TransactionType } from "../types";
import type { DateRange } from "./period";
import { transactionTotal } from "./format";

export interface TrendPoint {
  label: string;
  value: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Buckets a date range into daily points (short ranges) or monthly points
// (longer ranges) so both preset periods and arbitrary custom ranges get
// sensibly-sized trend charts.
export function trendBuckets(range: DateRange, transactions: Transaction[], type: TransactionType): TrendPoint[] {
  const relevant = transactions.filter((t) => t.type === type);

  const sum = (bucketStart: Date, bucketEnd: Date) =>
    relevant.reduce((total, t) => {
      const time = new Date(t.date).getTime();
      return time >= bucketStart.getTime() && time < bucketEnd.getTime() ? total + transactionTotal(t) : total;
    }, 0);

  const spanDays = (range.end.getTime() - range.start.getTime()) / DAY_MS;

  if (spanDays <= 62) {
    const points: TrendPoint[] = [];
    const cursor = new Date(range.start);
    while (cursor < range.end) {
      const bucketStart = new Date(cursor);
      const bucketEnd = new Date(cursor);
      bucketEnd.setDate(bucketEnd.getDate() + 1);
      points.push({
        label: bucketStart.toLocaleDateString(undefined, { day: "numeric", month: spanDays <= 9 ? "short" : undefined }),
        value: sum(bucketStart, bucketEnd),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return points;
  }

  const points: TrendPoint[] = [];
  const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
  const crossesYear = range.start.getFullYear() !== range.end.getFullYear();
  while (cursor < range.end) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    points.push({
      label: bucketStart.toLocaleDateString(undefined, { month: "short", year: crossesYear ? "2-digit" : undefined }),
      value: sum(bucketStart, bucketEnd),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return points;
}
