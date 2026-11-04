import { round } from "./instruments";
import { zonedParts } from "./tradeMath";
import { followedRules, type SetupGrade, type Trade } from "./journalTypes";

export interface SplitStats {
  count: number;
  netPnl: number;
  winRate: number | null;
}

export interface JournalStats {
  count: number;
  netPnl: number;
  wins: number;
  losses: number;
  winRate: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  profitFactor: number | null;
  expectancy: number | null;
  avgR: number | null;
  maxDrawdown: number;
  equityCurve: { time: string; equity: number }[];
  byWeekday: number[]; // index 0 Sunday .. 6 Saturday
  byGrade: Record<SetupGrade | "ungraded", number>;
  adherenceRate: number | null;
  followed: SplitStats;
  broken: SplitStats;
}

function closeTime(t: Trade): string {
  return t.exitTime ?? t.entryTime;
}

function split(trades: Trade[]): SplitStats {
  const wins = trades.filter((t) => (t.netPnl ?? 0) > 0).length;
  const losses = trades.filter((t) => (t.netPnl ?? 0) < 0).length;
  return {
    count: trades.length,
    netPnl: round(trades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0), 2),
    winRate: wins + losses > 0 ? wins / (wins + losses) : null,
  };
}

/**
 * Spec section 5 stats over closed trades (those with a net P&L). Wins are
 * trades above $0 and losses below; break-even trades count toward totals and
 * expectancy but not toward win rate.
 */
export function journalStats(allTrades: Trade[], timeZone = "America/New_York"): JournalStats {
  const trades = allTrades.filter((t) => t.netPnl !== null).sort((a, b) => closeTime(a).localeCompare(closeTime(b)));
  const nets = trades.map((t) => t.netPnl as number);
  const winNets = nets.filter((n) => n > 0);
  const lossNets = nets.filter((n) => n < 0);
  const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
  const grossWin = sum(winNets);
  const grossLoss = Math.abs(sum(lossNets));
  const rs = trades.map((t) => t.rMultiple).filter((r): r is number => r !== null);

  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  const equityCurve = trades.map((t) => {
    equity = round(equity + (t.netPnl as number), 2);
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, round(peak - equity, 2));
    return { time: closeTime(t), equity };
  });

  const byWeekday = [0, 0, 0, 0, 0, 0, 0];
  const byGrade: JournalStats["byGrade"] = { A: 0, B: 0, C: 0, F: 0, ungraded: 0 };
  for (const t of trades) {
    const wd = zonedParts(t.entryTime, timeZone).weekday;
    byWeekday[wd] = round(byWeekday[wd] + (t.netPnl as number), 2);
    const g = t.setupGrade ?? "ungraded";
    byGrade[g] = round(byGrade[g] + (t.netPnl as number), 2);
  }

  const followedTrades = trades.filter(followedRules);
  const brokenTrades = trades.filter((t) => !followedRules(t));

  return {
    count: trades.length,
    netPnl: round(sum(nets), 2),
    wins: winNets.length,
    losses: lossNets.length,
    winRate: winNets.length + lossNets.length > 0 ? winNets.length / (winNets.length + lossNets.length) : null,
    avgWin: winNets.length ? round(grossWin / winNets.length, 2) : null,
    avgLoss: lossNets.length ? round(-grossLoss / lossNets.length, 2) : null,
    profitFactor: grossLoss > 0 ? round(grossWin / grossLoss, 2) : null,
    expectancy: trades.length ? round(sum(nets) / trades.length, 2) : null,
    avgR: rs.length ? round(sum(rs) / rs.length, 2) : null,
    maxDrawdown,
    equityCurve,
    byWeekday,
    byGrade,
    adherenceRate: trades.length ? followedTrades.length / trades.length : null,
    followed: split(followedTrades),
    broken: split(brokenTrades),
  };
}
