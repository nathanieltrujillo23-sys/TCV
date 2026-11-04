import { round } from "./instruments";
import { zonedParts } from "./tradeMath";
import type { Trade, TradingAccount } from "./journalTypes";

export type HealthWarning = "nearDrawdown" | "drawdownBreached" | "nearDailyLimit" | "dailyLimitHit" | "consistency";

export interface AccountHealth {
  balance: number | null;
  profit: number;
  drawdownFloor: number | null;
  distanceToFloor: number | null;
  todayPnl: number;
  dailyLimitRemaining: number | null;
  bestDayShare: number | null;
  targetProgress: number | null;
  warnings: HealthWarning[];
}

/**
 * Spec section 5 account health. Trailing drawdown is an estimate: EOD uses
 * end-of-day balances, and intraday uses the balance after each trade because
 * the journal has no tick-by-tick account highs. Warnings only; never blocks.
 */
export function accountHealth(account: TradingAccount, allTrades: Trade[], now: Date = new Date(), timeZone = "America/New_York"): AccountHealth {
  const trades = allTrades
    .filter((t) => t.accountId === account.id && t.netPnl !== null)
    .sort((a, b) => (a.exitTime ?? a.entryTime).localeCompare(b.exitTime ?? b.entryTime));
  const dayOf = (t: Trade) => zonedParts(t.exitTime ?? t.entryTime, timeZone).date;

  const profit = round(trades.reduce((s, t) => s + (t.netPnl as number), 0), 2);
  const start = account.startingBalance;
  const balance = start === null ? null : round(start + profit, 2);

  const daily = new Map<string, number>();
  for (const t of trades) daily.set(dayOf(t), round((daily.get(dayOf(t)) ?? 0) + (t.netPnl as number), 2));

  let drawdownFloor: number | null = null;
  if (start !== null && account.maxDrawdown !== null) {
    let peak = start;
    if (account.drawdownType === "eod_trailing") {
      let running = start;
      for (const pnl of daily.values()) {
        running = round(running + pnl, 2);
        peak = Math.max(peak, running);
      }
    } else if (account.drawdownType === "intraday_trailing") {
      let running = start;
      for (const t of trades) {
        running = round(running + (t.netPnl as number), 2);
        peak = Math.max(peak, running);
      }
    }
    drawdownFloor = round(peak - account.maxDrawdown, 2);
  }
  const distanceToFloor = balance !== null && drawdownFloor !== null ? round(balance - drawdownFloor, 2) : null;

  const todayPnl = daily.get(zonedParts(now.toISOString(), timeZone).date) ?? 0;
  const dailyLimitRemaining = account.dailyLossLimit !== null ? round(account.dailyLossLimit + Math.min(todayPnl, 0), 2) : null;

  const bestDay = Math.max(0, ...daily.values());
  const bestDayShare = profit > 0 ? bestDay / profit : null;
  const targetProgress = account.profitTarget ? profit / account.profitTarget : null;

  const warnings: HealthWarning[] = [];
  if (distanceToFloor !== null && account.maxDrawdown) {
    if (distanceToFloor <= 0) warnings.push("drawdownBreached");
    else if (distanceToFloor <= account.maxDrawdown * 0.25) warnings.push("nearDrawdown");
  }
  if (dailyLimitRemaining !== null && account.dailyLossLimit) {
    if (dailyLimitRemaining <= 0) warnings.push("dailyLimitHit");
    else if (dailyLimitRemaining <= account.dailyLossLimit * 0.25) warnings.push("nearDailyLimit");
  }
  if (bestDayShare !== null && account.consistencyPct !== null && bestDayShare > account.consistencyPct / 100) {
    warnings.push("consistency");
  }

  return { balance, profit, drawdownFloor, distanceToFloor, todayPnl, dailyLimitRemaining, bestDayShare, targetProgress, warnings };
}
