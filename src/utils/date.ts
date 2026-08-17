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
