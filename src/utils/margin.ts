import type { TrendPoint } from "./trend";

export interface MarginPoint {
  label: string;
  value: number | null; // null when there's no income that period — margin is undefined
}

export function marginTrend(incomeTrend: TrendPoint[], expenseTrend: TrendPoint[]): MarginPoint[] {
  return incomeTrend.map((p, i) => {
    const expense = expenseTrend[i]?.value ?? 0;
    const value = p.value > 0 ? ((p.value - expense) / p.value) * 100 : null;
    return { label: p.label, value };
  });
}
