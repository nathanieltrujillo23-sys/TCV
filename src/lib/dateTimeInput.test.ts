import { describe, expect, it } from "vitest";
import { isoToZonedInput, parseNumber, zonedInputToIso } from "./dateTimeInput";

describe("parseNumber", () => {
  it("parses and rejects", () => {
    expect(parseNumber("20010.25")).toBe(20010.25);
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
  });
});


describe("New York wall time conversion (independent of the browser's zone)", () => {
  it("winter, EST (UTC-5)", () => {
    expect(zonedInputToIso("2026-01-15T09:30:00")).toBe("2026-01-15T14:30:00.000Z");
  });
  it("summer, EDT (UTC-4)", () => {
    expect(zonedInputToIso("2026-07-15T09:30")).toBe("2026-07-15T13:30:00.000Z");
  });
  it("the day clocks change", () => {
    expect(zonedInputToIso("2026-03-08T09:30")).toBe("2026-03-08T13:30:00.000Z");
    expect(zonedInputToIso("2026-11-01T09:30")).toBe("2026-11-01T14:30:00.000Z");
  });
  it("round trips back to the same wall time", () => {
    expect(isoToZonedInput("2026-11-04T14:42:00.000Z")).toBe("2026-11-04T09:42:00");
    expect(isoToZonedInput(zonedInputToIso("2026-07-15T10:29:59")!)).toBe("2026-07-15T10:29:59");
  });
  it("rejects bad input", () => {
    expect(zonedInputToIso("")).toBeNull();
    expect(zonedInputToIso("not a date")).toBeNull();
  });
});
