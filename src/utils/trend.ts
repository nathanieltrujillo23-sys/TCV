import type { Transaction, TransactionType } from "../types";
import type { DateRange } from "./period";
import { transactionTotal } from "./format";

export interface TrendPoint {
  label: string;
  value: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

interface BucketPlan {
  short: boolean;
  count: number;
  start: Date;
  spanDays: number;
  crossesYear: boolean;
}

function planBuckets(range: DateRange): BucketPlan {
  const spanDays = (range.end.getTime() - range.start.getTime()) / DAY_MS;
  if (spanDays <= 62) {
    return { short: true, count: Math.round(spanDays), start: new Date(range.start), spanDays, crossesYear: false };
  }
  const start = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
  let count = 0;
  const cursor = new Date(start);
  while (cursor < range.end) {
    count++;
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return { short: false, count, start, spanDays, crossesYear: range.start.getFullYear() !== range.end.getFullYear() };
}

// index may run past plan.count — used by forecastTrend to continue the
// same daily/monthly cadence beyond the selected range.
function bucketAt(plan: BucketPlan, index: number): { start: Date; end: Date; label: string } {
  if (plan.short) {
    const start = new Date(plan.start);
    start.setDate(start.getDate() + index);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const label = start.toLocaleDateString(undefined, {
      day: "numeric",
      month: plan.spanDays <= 9 ? "short" : undefined,
    });
    return { start, end, label };
  }
  const start = new Date(plan.start.getFullYear(), plan.start.getMonth() + index, 1);
  const end = new Date(plan.start.getFullYear(), plan.start.getMonth() + index + 1, 1);
  const label = start.toLocaleDateString(undefined, { month: "short", year: plan.crossesYear ? "2-digit" : undefined });
  return { start, end, label };
}

function aggregate(range: DateRange, reducer: (bucketStart: Date, bucketEnd: Date) => number): TrendPoint[] {
  const plan = planBuckets(range);
  const points: TrendPoint[] = [];
  for (let i = 0; i < plan.count; i++) {
    const { start, end, label } = bucketAt(plan, i);
    points.push({ label, value: reducer(start, end) });
  }
  return points;
}

// Buckets a date range into daily points (short ranges) or monthly points
// (longer ranges) so both preset periods and arbitrary custom ranges get
// sensibly-sized trend charts.
export function trendBuckets(range: DateRange, transactions: Transaction[], type: TransactionType): TrendPoint[] {
  const relevant = transactions.filter((t) => t.type === type);
  return aggregate(range, (bucketStart, bucketEnd) =>
    relevant.reduce((total, t) => {
      const time = new Date(t.date).getTime();
      return time >= bucketStart.getTime() && time < bucketEnd.getTime() ? total + transactionTotal(t) : total;
    }, 0)
  );
}

// Same bucketing as trendBuckets, but counts entries instead of summing them.
export function countBuckets(range: DateRange, transactions: Transaction[], type: TransactionType): TrendPoint[] {
  const relevant = transactions.filter((t) => t.type === type);
  return aggregate(range, (bucketStart, bucketEnd) =>
    relevant.reduce((total, t) => {
      const time = new Date(t.date).getTime();
      return time >= bucketStart.getTime() && time < bucketEnd.getTime() ? total + 1 : total;
    }, 0)
  );
}

// Projects `periodsAhead` additional points beyond `range` via simple linear
// regression over the historical points, continuing the same daily/monthly
// cadence so forecast labels read naturally alongside the actual ones.
export function forecastTrend(range: DateRange, points: TrendPoint[], periodsAhead = 3): TrendPoint[] {
  if (points.length < 2) return [];

  const n = points.length;
  const meanX = (n - 1) / 2;
  const meanY = points.reduce((sum, p) => sum + p.value, 0) / n;
  const num = points.reduce((sum, p, i) => sum + (i - meanX) * (p.value - meanY), 0);
  const den = points.reduce((sum, _p, i) => sum + (i - meanX) ** 2, 0);
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  const plan = planBuckets(range);
  const forecast: TrendPoint[] = [];
  for (let i = 0; i < periodsAhead; i++) {
    const index = plan.count + i;
    const { label } = bucketAt(plan, index);
    forecast.push({ label, value: slope * index + intercept });
  }
  return forecast;
}
