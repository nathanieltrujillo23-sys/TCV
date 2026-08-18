import type { Period } from "../types";

export interface DateRange {
  start: Date;
  end: Date; // exclusive
}

export function periodRange(period: Period, reference: Date = new Date()): DateRange {
  const start = new Date(reference);
  const end = new Date(reference);

  switch (period) {
    case "week": {
      const day = start.getDay(); // 0 = Sunday
      const diffToMonday = (day + 6) % 7;
      start.setDate(start.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 7);
      break;
    }
    case "month": {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(start.getFullYear(), start.getMonth() + 1, 1);
      end.setHours(0, 0, 0, 0);
      break;
    }
    case "quarter": {
      const quarterStartMonth = Math.floor(start.getMonth() / 3) * 3;
      start.setMonth(quarterStartMonth, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(start.getFullYear(), quarterStartMonth + 3, 1);
      end.setHours(0, 0, 0, 0);
      break;
    }
    case "year": {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(start.getFullYear() + 1, 0, 1);
      end.setHours(0, 0, 0, 0);
      break;
    }
  }

  return { start, end };
}

export function isWithinRange(dateISO: string, range: DateRange): boolean {
  const t = new Date(dateISO).getTime();
  return t >= range.start.getTime() && t < range.end.getTime();
}

export function isWithinPeriod(dateISO: string, period: Period, reference: Date = new Date()): boolean {
  return isWithinRange(dateISO, periodRange(period, reference));
}

export function periodLabel(period: Period, reference: Date = new Date()): string {
  const { start, end } = periodRange(period, reference);
  const endInclusive = new Date(end.getTime() - 1);

  switch (period) {
    case "week":
      return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${endInclusive.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    case "month":
      return start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    case "quarter":
      return `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
    case "year":
      return `${start.getFullYear()}`;
  }
}

export function rangeLabel(range: DateRange): string {
  const endInclusive = new Date(range.end.getTime() - 1);
  const sameYear = range.start.getFullYear() === endInclusive.getFullYear();
  const startStr = range.start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const endStr = endInclusive.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${startStr} – ${endStr}`;
}
