export function todayInputValue(): string {
  return isoToDateInput(new Date().toISOString());
}

// yyyy-mm-dd in the browser's local timezone, for <input type="date">.
export function isoToDateInput(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Combines a yyyy-mm-dd date with a time-of-day (defaults to now, or an
// existing ISO timestamp's time when editing so ordering stays sensible).
export function dateInputToISO(value: string, preserveTimeFrom?: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const time = preserveTimeFrom ? new Date(preserveTimeFrom) : new Date();
  const result = new Date(year, month - 1, day, time.getHours(), time.getMinutes(), time.getSeconds());
  return result.toISOString();
}

function dateToInputValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Every occurrence date (yyyy-mm-dd, inclusive of both ends) between a
// recurring charge's start and end date. Weekly steps every 7 days; monthly
// keeps the same day-of-month, clamped to the shortest month in the run
// (e.g. Jan 31 -> Feb 28) so it doesn't drift onto a different billing day.
// Capped at 260 occurrences (5 years weekly / far more monthly) as a
// backstop against a mistyped end date decades out.
const MAX_RECURRING_OCCURRENCES = 260;

export function generateRecurringDates(
  startDateInput: string,
  endDateInput: string,
  frequency: "weekly" | "monthly"
): string[] {
  const [sy, sm, sd] = startDateInput.split("-").map(Number);
  const [ey, em, ed] = endDateInput.split("-").map(Number);
  const end = new Date(ey, em - 1, ed);
  const dates: string[] = [];

  for (let occurrence = 0; occurrence < MAX_RECURRING_OCCURRENCES; occurrence++) {
    let current: Date;
    if (frequency === "weekly") {
      current = new Date(sy, sm - 1, sd + occurrence * 7);
    } else {
      const monthIndex = sm - 1 + occurrence;
      const year = sy + Math.floor(monthIndex / 12);
      const month = ((monthIndex % 12) + 12) % 12;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      current = new Date(year, month, Math.min(sd, daysInMonth));
    }
    if (current.getTime() > end.getTime()) break;
    dates.push(dateToInputValue(current));
  }

  return dates;
}
