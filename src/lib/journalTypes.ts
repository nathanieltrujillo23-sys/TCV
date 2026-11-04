import type { Instrument } from "./instruments";
import type { Direction } from "./tradeMath";

export type SetupGrade = "A" | "B" | "C" | "F";
export type TradingAccountType = "evaluation" | "funded" | "personal";
export type DrawdownType = "eod_trailing" | "intraday_trailing" | "static";
export type TradingAccountStatus = "active" | "passed" | "failed" | "closed";
export type ScreenshotKind = "htf" | "entry" | "exit" | "other";

export interface RuleCheck {
  ruleId: string;
  label: string;
  followed: boolean;
}

export interface Trade {
  id: string;
  accountId: string | null;
  instrument: Instrument;
  direction: Direction;
  entryTime: string;
  exitTime: string | null;
  entryPrice: number;
  exitPrice: number | null;
  stopPrice: number | null;
  targetPrice: number | null;
  contracts: number;
  fees: number;
  points: number | null;
  grossPnl: number | null;
  netPnl: number | null;
  rMultiple: number | null;
  inWindow: boolean | null;
  standAsideDay: boolean | null;
  ruleChecks: RuleCheck[];
  setupGrade: SetupGrade | null;
  emotion: string | null;
  notes: string | null;
  tags: string[];
  source: "manual" | "import";
}

export interface TradingAccount {
  id: string;
  label: string;
  firm: string | null;
  accountType: TradingAccountType | null;
  platform: string | null;
  startingBalance: number | null;
  maxDrawdown: number | null;
  drawdownType: DrawdownType | null;
  dailyLossLimit: number | null;
  profitTarget: number | null;
  consistencyPct: number | null;
  status: TradingAccountStatus;
}

export interface JournalRule {
  id: string;
  label: string;
  position: number;
  active: boolean;
}

export interface JournalSettings {
  windowStart: string | null; // "HH:MM"
  windowEnd: string | null;
  timezone: string;
  avoidFridays: boolean;
  avoidNewsDays: boolean;
  avoidHolidays: boolean;
  avoidThanksgivingWeek: boolean;
  avoidLateDecember: boolean;
}

export interface JournalDay {
  day: string; // yyyy-mm-dd
  bias: string | null;
  premarketPlan: string | null;
  newsFlags: string[];
  postSession: string | null;
  followedPlan: boolean | null;
}

export interface TradeScreenshot {
  id: string;
  tradeId: string;
  kind: ScreenshotKind;
  path: string;
}

/** A trade followed the trader's rules when every checklist item was followed, it was inside the window, and it was not a stand-aside day. */
export function followedRules(t: Pick<Trade, "ruleChecks" | "inWindow" | "standAsideDay">): boolean {
  return t.ruleChecks.every((c) => c.followed) && t.inWindow !== false && t.standAsideDay !== true;
}
