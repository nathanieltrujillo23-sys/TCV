import { describe, expect, it } from "vitest";
import { computeTrade, inWindow, zonedParts } from "./tradeMath";
import { tickValue } from "./instruments";

const base = { stopPrice: null, fees: 0 } as const;

describe("computeTrade: NQ and MNQ (checked by hand)", () => {
  it("NQ long winner with fees and a stop", () => {
    // 10.25 pts x $20 x 2 = $410.00; minus $4.20 fees = $405.80; risk 10 pts -> 1.025R -> 1.03
    expect(computeTrade({ instrument: "NQ", direction: "long", entryPrice: 20000, exitPrice: 20010.25, stopPrice: 19990, contracts: 2, fees: 4.2 }))
      .toEqual({ points: 10.25, grossPnl: 410, netPnl: 405.8, rMultiple: 1.03 });
  });

  it("NQ short loser", () => {
    // short from 20000 to 20005.50 = -5.5 pts x $20 = -$110.00, minus $2.10 = -$112.10; risk 10 -> -0.55R
    expect(computeTrade({ instrument: "NQ", direction: "short", entryPrice: 20000, exitPrice: 20005.5, stopPrice: 20010, contracts: 1, fees: 2.1 }))
      .toEqual({ points: -5.5, grossPnl: -110, netPnl: -112.1, rMultiple: -0.55 });
  });

  it("MNQ long loser without a stop has no R", () => {
    // -9.5 pts x $2 x 3 = -$57.00, minus $1.86 = -$58.86
    expect(computeTrade({ ...base, instrument: "MNQ", direction: "long", entryPrice: 18000.25, exitPrice: 17990.75, contracts: 3, fees: 1.86 }))
      .toEqual({ points: -9.5, grossPnl: -57, netPnl: -58.86, rMultiple: null });
  });

  it("MNQ short winner", () => {
    // 19.75 pts x $2 = $39.50, minus $0.62 = $38.88
    expect(computeTrade({ ...base, instrument: "MNQ", direction: "short", entryPrice: 18500, exitPrice: 18480.25, contracts: 1, fees: 0.62 }))
      .toEqual({ points: 19.75, grossPnl: 39.5, netPnl: 38.88, rMultiple: null });
  });

  it("an open trade has no results yet", () => {
    expect(computeTrade({ ...base, instrument: "NQ", direction: "long", entryPrice: 20000, exitPrice: null, contracts: 1 }))
      .toEqual({ points: null, grossPnl: null, netPnl: null, rMultiple: null });
  });

  it("a stop at the entry price gives no R instead of dividing by zero", () => {
    expect(computeTrade({ instrument: "NQ", direction: "long", entryPrice: 20000, exitPrice: 20004, stopPrice: 20000, contracts: 1, fees: 0 }).rMultiple).toBeNull();
  });
});

describe("computeTrade: other contracts", () => {
  it("6E euro: 0.00150 x $125,000 = $187.50", () => {
    expect(computeTrade({ ...base, instrument: "6E", direction: "long", entryPrice: 1.085, exitPrice: 1.0865, contracts: 1, fees: 4.5 }))
      .toMatchObject({ points: 0.0015, grossPnl: 187.5, netPnl: 183 });
  });
  it("6B pound: 0.0020 x $62,500 = $125.00", () => {
    expect(computeTrade({ ...base, instrument: "6B", direction: "short", entryPrice: 1.272, exitPrice: 1.27, contracts: 1 }).grossPnl).toBe(125);
  });
  it("GC gold: 9.5 x $100 = $950", () => {
    expect(computeTrade({ ...base, instrument: "GC", direction: "short", entryPrice: 2400, exitPrice: 2390.5, contracts: 1 }).grossPnl).toBe(950);
  });
  it("SI silver: 0.125 x $5,000 = $625", () => {
    expect(computeTrade({ ...base, instrument: "SI", direction: "long", entryPrice: 30, exitPrice: 30.125, contracts: 1 }).grossPnl).toBe(625);
  });
  it("CL oil: 0.65 x $1,000 x 2 = $1,300", () => {
    expect(computeTrade({ ...base, instrument: "CL", direction: "long", entryPrice: 75.2, exitPrice: 75.85, contracts: 2 }).grossPnl).toBe(1300);
  });
  it("ES: 4 pts x $50 = $200", () => {
    expect(computeTrade({ ...base, instrument: "ES", direction: "long", entryPrice: 5800, exitPrice: 5804, contracts: 1 }).grossPnl).toBe(200);
  });
  it("tick values match the exchange specs", () => {
    expect([tickValue("NQ"), tickValue("MNQ"), tickValue("ES"), tickValue("MES"), tickValue("GC"), tickValue("SI"), tickValue("CL"), tickValue("6E"), tickValue("6B")])
      .toEqual([5, 0.5, 12.5, 1.25, 10, 25, 10, 6.25, 6.25]);
  });
});

describe("inWindow (09:30 to 10:30 New York)", () => {
  const w = (iso: string) => inWindow(iso, "09:30", "10:30");

  it("summer (EDT, UTC-4)", () => {
    expect(w("2026-07-15T13:29:59Z")).toBe(false); // 09:29:59
    expect(w("2026-07-15T13:30:00Z")).toBe(true); // 09:30:00
    expect(w("2026-07-15T14:29:59Z")).toBe(true); // 10:29:59
    expect(w("2026-07-15T14:30:00Z")).toBe(false); // 10:30:00
  });

  it("winter (EST, UTC-5)", () => {
    expect(w("2026-01-15T14:29:59Z")).toBe(false);
    expect(w("2026-01-15T14:30:00Z")).toBe(true);
    expect(w("2026-01-15T15:29:59Z")).toBe(true);
    expect(w("2026-01-15T15:30:00Z")).toBe(false);
  });

  it("the Monday after clocks change", () => {
    expect(w("2026-03-09T13:30:00Z")).toBe(true); // EDT began Mar 8, so 13:30Z is 09:30
    expect(w("2026-11-02T14:30:00Z")).toBe(true); // EST began Nov 1, so 14:30Z is 09:30
  });

  it("no window means no answer", () => {
    expect(inWindow("2026-07-15T13:30:00Z", null, null)).toBeNull();
  });

  it("uses the New York calendar date, not UTC", () => {
    expect(zonedParts("2026-11-07T02:00:00Z").date).toBe("2026-11-06"); // 9 PM Friday in New York
  });
});
