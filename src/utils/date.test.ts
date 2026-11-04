import { describe, expect, it } from "vitest";
import { generateRecurringDates } from "./date";

describe("generateRecurringDates", () => {
  it("steps weekly every 7 days, inclusive of the end date", () => {
    expect(generateRecurringDates("2026-08-18", "2026-09-08", "weekly")).toEqual([
      "2026-08-18",
      "2026-08-25",
      "2026-09-01",
      "2026-09-08",
    ]);
  });

  it("keeps the same day of month, clamped in short months", () => {
    expect(generateRecurringDates("2027-01-31", "2027-04-30", "monthly")).toEqual([
      "2027-01-31",
      "2027-02-28",
      "2027-03-31",
      "2027-04-30",
    ]);
  });
});
