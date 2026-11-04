import { CONTRACTS, round, type Instrument } from "./instruments";

export type Direction = "long" | "short";

export interface TradeInput {
  instrument: Instrument;
  direction: Direction;
  entryPrice: number;
  exitPrice: number | null;
  stopPrice: number | null;
  contracts: number;
  fees: number;
}

export interface TradeResult {
  points: number | null;
  grossPnl: number | null;
  netPnl: number | null;
  rMultiple: number | null;
}

/** Spec section 5: points, gross and net P&L, and R multiple. An open trade (no exit) has no results yet. */
export function computeTrade(t: TradeInput): TradeResult {
  if (t.exitPrice === null) return { points: null, grossPnl: null, netPnl: null, rMultiple: null };
  const spec = CONTRACTS[t.instrument];
  const points = round(t.direction === "long" ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice, 5);
  const grossPnl = round(points * spec.pointValue * t.contracts, 2);
  const netPnl = round(grossPnl - t.fees, 2);
  const risk = t.stopPrice === null ? 0 : Math.abs(t.entryPrice - t.stopPrice);
  const rMultiple = risk > 0 ? round(points / risk, 2) : null;
  return { points, grossPnl, netPnl, rMultiple };
}

interface ZonedParts {
  date: string; // yyyy-mm-dd
  weekday: number; // 0 Sunday .. 6 Saturday
  seconds: number; // seconds since local midnight
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Calendar date, weekday, and time of day of an instant in a given time zone (handles daylight saving). */
export function zonedParts(iso: string, timeZone = "America/New_York"): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: WEEKDAYS[get("weekday")],
    seconds: Number(get("hour")) * 3600 + Number(get("minute")) * 60 + Number(get("second")),
  };
}

function timeToSeconds(hhmm: string): number {
  const [h, m, s = "0"] = hhmm.split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

/** True when the entry is inside [start, end) in the trader's time zone. Null when the trader has no window. */
export function inWindow(entryIso: string, windowStart: string | null, windowEnd: string | null, timeZone = "America/New_York"): boolean | null {
  if (!windowStart || !windowEnd) return null;
  const { seconds } = zonedParts(entryIso, timeZone);
  return seconds >= timeToSeconds(windowStart) && seconds < timeToSeconds(windowEnd);
}
