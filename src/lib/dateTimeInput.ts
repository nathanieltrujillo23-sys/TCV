/** Parses a number box; empty or invalid gives null. */
export function parseNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const zonedFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

/** Wall-clock time of an instant in a zone, as milliseconds on a UTC scale. */
function wallMs(ms: number, timeZone: string): number {
  const parts = zonedFormatter(timeZone).formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
}

/** ISO instant -> "yyyy-mm-ddThh:mm:ss" wall time in the given zone (New York by default), for datetime-local inputs. */
export function isoToZonedInput(iso: string, timeZone = "America/New_York"): string {
  const d = new Date(wallMs(new Date(iso).getTime(), timeZone));
  return d.toISOString().slice(0, 19);
}

/**
 * "yyyy-mm-ddThh:mm[:ss]" wall time in the given zone -> ISO instant, independent
 * of the browser's own time zone. Null when empty or invalid.
 */
export function zonedInputToIso(value: string, timeZone = "America/New_York"): string | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const target = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0));
  let guess = target;
  // Two passes settle the zone offset, including across daylight saving changes.
  for (let i = 0; i < 2; i++) guess -= wallMs(guess, timeZone) - target;
  return new Date(guess).toISOString();
}
