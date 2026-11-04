import { describe, expect, it } from "vitest";
import { journalStats } from "./journalStats";
import { accountHealth } from "./accountHealth";
import type { Trade, TradingAccount } from "./journalTypes";

function trade(over: Partial<Trade>): Trade {
  return {
    id: crypto.randomUUID(), accountId: "acct", instrument: "NQ", direction: "long",
    entryTime: "2026-11-02T14:35:00Z", exitTime: null, entryPrice: 20000, exitPrice: 20001,
    stopPrice: null, targetPrice: null, contracts: 1, fees: 0, points: 1, grossPnl: 0, netPnl: 0,
    rMultiple: null, inWindow: true, standAsideDay: false, ruleChecks: [], setupGrade: null,
    emotion: null, notes: null, tags: [], source: "manual", ...over,
  };
}

describe("journalStats (checked by hand)", () => {
  const trades = [
    trade({ entryTime: "2026-11-02T14:35:00Z", netPnl: 405.8, rMultiple: 1.03, setupGrade: "A" }), // Monday, followed
    trade({ entryTime: "2026-11-03T14:35:00Z", netPnl: -112.1, rMultiple: -0.55, setupGrade: "B", inWindow: false }), // Tuesday, broken
    trade({ entryTime: "2026-11-04T14:35:00Z", netPnl: 38.88 }), // Wednesday, followed
    trade({ entryTime: "2026-11-05T14:35:00Z", netPnl: -58.86, setupGrade: "C", ruleChecks: [{ ruleId: "r", label: "Bias", followed: false }] }), // Thursday, broken
    trade({ entryTime: "2026-11-05T15:00:00Z", netPnl: null }), // still open, ignored
  ];
  const s = journalStats(trades);

  it("totals", () => {
    expect(s.count).toBe(4);
    expect(s.netPnl).toBe(273.72);
    expect([s.wins, s.losses, s.winRate]).toEqual([2, 2, 0.5]);
  });

  it("averages, profit factor, expectancy, R", () => {
    expect(s.avgWin).toBe(222.34); // (405.80 + 38.88) / 2
    expect(s.avgLoss).toBe(-85.48); // -(112.10 + 58.86) / 2
    expect(s.profitFactor).toBe(2.6); // 444.68 / 170.96 = 2.601
    expect(s.expectancy).toBe(68.43); // 273.72 / 4
    expect(s.avgR).toBe(0.24); // (1.03 - 0.55) / 2
  });

  it("equity curve and max drawdown", () => {
    expect(s.equityCurve.map((p) => p.equity)).toEqual([405.8, 293.7, 332.58, 273.72]);
    expect(s.maxDrawdown).toBe(132.08); // peak 405.80 to 273.72
  });

  it("by weekday and grade", () => {
    expect(s.byWeekday).toEqual([0, 405.8, -112.1, 38.88, -58.86, 0, 0]);
    expect(s.byGrade).toEqual({ A: 405.8, B: -112.1, C: -58.86, F: 0, ungraded: 38.88 });
  });

  it("rules followed vs broken", () => {
    expect(s.adherenceRate).toBe(0.5);
    expect(s.followed).toEqual({ count: 2, netPnl: 444.68, winRate: 1 });
    expect(s.broken).toEqual({ count: 2, netPnl: -170.96, winRate: 0 });
  });

  it("no trades", () => {
    const empty = journalStats([]);
    expect([empty.count, empty.winRate, empty.profitFactor, empty.maxDrawdown]).toEqual([0, null, null, 0]);
  });
});

describe("accountHealth (checked by hand)", () => {
  const account: TradingAccount = {
    id: "acct", label: "Lucid 50K", firm: "Lucid Trading", accountType: "evaluation", platform: null,
    startingBalance: 50000, maxDrawdown: 2000, drawdownType: "eod_trailing", dailyLossLimit: 1000,
    profitTarget: 3000, consistencyPct: 40, status: "active",
  };
  const trades = [
    trade({ exitTime: "2026-11-02T15:00:00Z", netPnl: 1200 }),
    trade({ exitTime: "2026-11-03T15:00:00Z", netPnl: 300 }),
    trade({ exitTime: "2026-11-04T15:00:00Z", netPnl: -500 }),
    trade({ exitTime: "2026-11-04T15:30:00Z", netPnl: -300 }),
    trade({ accountId: "other", exitTime: "2026-11-04T15:30:00Z", netPnl: -9999 }),
  ];
  const now = new Date("2026-11-04T20:00:00Z");

  it("EOD trailing", () => {
    const h = accountHealth(account, trades, now);
    expect(h.profit).toBe(700);
    expect(h.balance).toBe(50700);
    expect(h.drawdownFloor).toBe(49500); // best end of day 51,500 - 2,000
    expect(h.distanceToFloor).toBe(1200);
    expect(h.todayPnl).toBe(-800);
    expect(h.dailyLimitRemaining).toBe(200);
    expect(h.bestDayShare).toBeCloseTo(1200 / 700);
    expect(h.targetProgress).toBeCloseTo(700 / 3000);
    expect(h.warnings).toEqual(["nearDailyLimit", "consistency"]);
  });

  it("static drawdown", () => {
    expect(accountHealth({ ...account, drawdownType: "static" }, trades, now).drawdownFloor).toBe(48000);
  });

  it("intraday trailing uses the best balance after any trade", () => {
    expect(accountHealth({ ...account, drawdownType: "intraday_trailing" }, trades, now).drawdownFloor).toBe(49500);
  });

  it("warns when the drawdown floor is breached", () => {
    // Lost $1,200 against a $1,000 static drawdown: balance 48,800 is below the 49,000 floor.
    const losing = [trade({ exitTime: "2026-11-02T15:00:00Z", netPnl: -1200 })];
    const h = accountHealth({ ...account, drawdownType: "static", maxDrawdown: 1000 }, losing, now);
    expect([h.balance, h.drawdownFloor, h.distanceToFloor]).toEqual([48800, 49000, -200]);
    expect(h.warnings).toContain("drawdownBreached");
  });
});
