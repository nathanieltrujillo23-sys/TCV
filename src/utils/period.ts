import type { Period } from "../types";

export function periodRange(period: Period, reference: Date = new Date()): { start: Date; end: Date } {
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

export function isWithinPeriod(dateISO: string, period: Period, reference: Date = new Date()): boolean {
  const { start, end } = periodRange(period, reference);
  const t = new Date(dateISO).getTime();
  return t >= start.getTime() && t < end.getTime();
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
