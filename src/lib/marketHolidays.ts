// US stock market (NYSE) full-day holidays, computed from the standard rules.

function iso(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function weekdayOf(year: number, monthIndex: number, day: number): number {
  return new Date(Date.UTC(year, monthIndex, day)).getUTCDay();
}

/** nth (1-based) given weekday of a month, or the last one when n is -1. */
function nthWeekday(year: number, monthIndex: number, weekday: number, n: number): number {
  if (n === -1) {
    const last = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const offset = (weekdayOf(year, monthIndex, last) - weekday + 7) % 7;
    return last - offset;
  }
  const first = (weekday - weekdayOf(year, monthIndex, 1) + 7) % 7 + 1;
  return first + (n - 1) * 7;
}

/** Saturday moves to Friday, Sunday to Monday. */
function observed(year: number, monthIndex: number, day: number): string {
  const wd = weekdayOf(year, monthIndex, day);
  const d = new Date(Date.UTC(year, monthIndex, day + (wd === 6 ? -1 : wd === 0 ? 1 : 0)));
  return iso(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Easter Sunday (Anonymous Gregorian algorithm). */
export function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

export function thanksgivingDay(year: number): number {
  return nthWeekday(year, 10, 4, 4);
}

export function usMarketHolidays(year: number): Set<string> {
  const days = new Set<string>();
  // New Year's Day: a Saturday holiday is not moved to Friday Dec 31.
  if (weekdayOf(year, 0, 1) !== 6) days.add(observed(year, 0, 1));
  days.add(iso(year, 0, nthWeekday(year, 0, 1, 3))); // Martin Luther King Jr. Day
  days.add(iso(year, 1, nthWeekday(year, 1, 1, 3))); // Washington's Birthday
  const easter = easterSunday(year);
  const goodFriday = new Date(Date.UTC(year, easter.month - 1, easter.day - 2));
  days.add(iso(year, goodFriday.getUTCMonth(), goodFriday.getUTCDate()));
  days.add(iso(year, 4, nthWeekday(year, 4, 1, -1))); // Memorial Day
  days.add(observed(year, 5, 19)); // Juneteenth
  days.add(observed(year, 6, 4)); // Independence Day
  days.add(iso(year, 8, nthWeekday(year, 8, 1, 1))); // Labor Day
  days.add(iso(year, 10, thanksgivingDay(year))); // Thanksgiving
  days.add(observed(year, 11, 25)); // Christmas
  return days;
}
