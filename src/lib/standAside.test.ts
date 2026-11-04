import { describe, expect, it } from "vitest";
import { standAside, type StandAsideSettings } from "./standAside";
import { easterSunday, usMarketHolidays } from "./marketHolidays";
import { EVENT_DAYS } from "../content/eventDays";

const all: StandAsideSettings = { avoidFridays: true, avoidNewsDays: true, avoidHolidays: true, avoidThanksgivingWeek: true, avoidLateDecember: true };
const none: StandAsideSettings = { avoidFridays: false, avoidNewsDays: false, avoidHolidays: false, avoidThanksgivingWeek: false, avoidLateDecember: false };

describe("standAside", () => {
  it("a Friday", () => {
    expect(standAside("2026-11-13", all)).toEqual({ standAside: true, reasons: ["friday"] });
  });

  it("a CPI day from eventDays.ts", () => {
    const cpi = EVENT_DAYS.find((e) => e.kind === "cpi" && e.date === "2026-11-10");
    expect(cpi).toBeDefined();
    expect(standAside("2026-11-10", all)).toEqual({ standAside: true, reasons: ["cpi"] });
  });

  it("a jobs report Friday lists both reasons", () => {
    expect(standAside("2026-11-06", all).reasons).toEqual(["friday", "nfp"]);
  });

  it("an FOMC decision day", () => {
    expect(standAside("2026-12-09", all).reasons).toEqual(["fomc"]);
  });

  it("December 16 to 31", () => {
    expect(standAside("2026-12-15", all).standAside).toBe(false);
    expect(standAside("2026-12-17", all).reasons).toEqual(["lateDecember"]);
    expect(standAside("2026-12-31", all).reasons).toContain("lateDecember");
  });

  it("Thanksgiving week", () => {
    expect(standAside("2026-11-26", all).reasons).toEqual(["holiday", "thanksgivingWeek"]);
    expect(standAside("2026-11-23", all).reasons).toEqual(["thanksgivingWeek"]);
    expect(standAside("2026-11-30", all).standAside).toBe(false);
  });

  it("a normal day", () => {
    expect(standAside("2026-11-11", all)).toEqual({ standAside: false, reasons: [] });
  });

  it("respects the trader's own settings", () => {
    expect(standAside("2026-11-06", none).standAside).toBe(false);
    expect(standAside("2026-11-06", { ...none, avoidNewsDays: true }).reasons).toEqual(["nfp"]);
  });
});

describe("US market holidays", () => {
  it("2026", () => {
    expect([...usMarketHolidays(2026)].sort()).toEqual([
      "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03", "2026-05-25", "2026-06-19",
      "2026-07-03", "2026-09-07", "2026-11-26", "2026-12-25",
    ]);
  });

  it("2027 moves weekend holidays", () => {
    expect([...usMarketHolidays(2027)].sort()).toEqual([
      "2027-01-01", "2027-01-18", "2027-02-15", "2027-03-26", "2027-05-31", "2027-06-18",
      "2027-07-05", "2027-09-06", "2027-11-25", "2027-12-24",
    ]);
  });

  it("New Year's Day on a Saturday is not moved to the Friday before", () => {
    const h2022 = usMarketHolidays(2022);
    expect(h2022.has("2021-12-31")).toBe(false);
    expect(h2022.has("2022-01-01")).toBe(false);
  });

  it("Easter dates", () => {
    expect(easterSunday(2024)).toEqual({ month: 3, day: 31 });
    expect(easterSunday(2026)).toEqual({ month: 4, day: 5 });
    expect(easterSunday(2027)).toEqual({ month: 3, day: 28 });
  });

  it("event days are all valid dates", () => {
    for (const e of EVENT_DAYS) expect(Number.isNaN(Date.parse(e.date)), e.date).toBe(false);
  });
});
