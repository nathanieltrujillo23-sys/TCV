import { supabase } from "../lib/supabaseClient";
import type { Instrument } from "../lib/instruments";
import type { Direction } from "../lib/tradeMath";
import type {
  JournalDay,
  JournalRule,
  JournalSettings,
  RuleCheck,
  ScreenshotKind,
  Trade,
  TradeScreenshot,
  TradingAccount,
} from "../lib/journalTypes";

const BUCKET = "trade-screenshots";

// Same idea as LedgerRepository: one interface, one Supabase implementation.
// Row level security limits every query to the signed in trader's own rows.
export interface JournalRepository {
  getSettings(): Promise<JournalSettings | null>;
  saveSettings(settings: JournalSettings): Promise<void>;

  listRules(): Promise<JournalRule[]>;
  addRule(label: string, position: number): Promise<JournalRule>;
  updateRule(rule: JournalRule): Promise<void>;
  deleteRule(id: string): Promise<void>;

  listAccounts(): Promise<TradingAccount[]>;
  saveAccount(account: TradingAccount): Promise<void>;
  deleteAccount(id: string): Promise<void>;

  listTrades(): Promise<Trade[]>;
  getTrade(id: string): Promise<Trade | null>;
  saveTrade(trade: Trade): Promise<void>;
  deleteTrade(id: string): Promise<void>;

  listScreenshots(tradeId: string): Promise<TradeScreenshot[]>;
  uploadScreenshot(tradeId: string, kind: ScreenshotKind, file: Blob): Promise<void>;
  deleteScreenshot(shot: TradeScreenshot): Promise<void>;
  screenshotUrl(path: string): Promise<string>;

  getDay(day: string): Promise<JournalDay | null>;
  saveDay(day: JournalDay): Promise<void>;
}

type Row = Record<string, unknown>;
const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));
const hhmm = (v: unknown): string | null => (typeof v === "string" ? v.slice(0, 5) : null);

function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

function rows<T>(result: { data: T[] | null; error: { message: string } | null }): T[] {
  if (result.error) throw new Error(result.error.message);
  return result.data ?? [];
}

function one<T>(result: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null || result.data === undefined) throw new Error("No row returned");
  return result.data;
}

function toTrade(r: Row): Trade {
  return {
    id: r.id as string,
    accountId: (r.account_id as string | null) ?? null,
    instrument: r.instrument as Instrument,
    direction: r.direction as Direction,
    entryTime: r.entry_time as string,
    exitTime: (r.exit_time as string | null) ?? null,
    entryPrice: Number(r.entry_price),
    exitPrice: num(r.exit_price),
    stopPrice: num(r.stop_price),
    targetPrice: num(r.target_price),
    contracts: Number(r.contracts),
    fees: Number(r.fees),
    points: num(r.points),
    grossPnl: num(r.gross_pnl),
    netPnl: num(r.net_pnl),
    rMultiple: num(r.r_multiple),
    inWindow: (r.in_window as boolean | null) ?? null,
    standAsideDay: (r.stand_aside_day as boolean | null) ?? null,
    ruleChecks: ((r.rule_checks as { rule_id: string; label: string; followed: boolean }[]) ?? []).map((c) => ({
      ruleId: c.rule_id,
      label: c.label,
      followed: !!c.followed,
    })),
    setupGrade: (r.setup_grade as Trade["setupGrade"]) ?? null,
    emotion: (r.emotion as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
    tags: (r.tags as string[]) ?? [],
    source: (r.source as Trade["source"]) ?? "manual",
  };
}

function fromTrade(t: Trade): Row {
  return {
    id: t.id,
    account_id: t.accountId,
    instrument: t.instrument,
    direction: t.direction,
    entry_time: t.entryTime,
    exit_time: t.exitTime,
    entry_price: t.entryPrice,
    exit_price: t.exitPrice,
    stop_price: t.stopPrice,
    target_price: t.targetPrice,
    contracts: t.contracts,
    fees: t.fees,
    points: t.points,
    gross_pnl: t.grossPnl,
    net_pnl: t.netPnl,
    r_multiple: t.rMultiple,
    in_window: t.inWindow,
    stand_aside_day: t.standAsideDay,
    rule_checks: t.ruleChecks.map((c: RuleCheck) => ({ rule_id: c.ruleId, label: c.label, followed: c.followed })),
    setup_grade: t.setupGrade,
    emotion: t.emotion,
    notes: t.notes,
    tags: t.tags,
    source: t.source,
  };
}

function toAccount(r: Row): TradingAccount {
  return {
    id: r.id as string,
    label: r.label as string,
    firm: (r.firm as string | null) ?? null,
    accountType: (r.account_type as TradingAccount["accountType"]) ?? null,
    platform: (r.platform as string | null) ?? null,
    startingBalance: num(r.starting_balance),
    maxDrawdown: num(r.max_drawdown),
    drawdownType: (r.drawdown_type as TradingAccount["drawdownType"]) ?? null,
    dailyLossLimit: num(r.daily_loss_limit),
    profitTarget: num(r.profit_target),
    consistencyPct: num(r.consistency_pct),
    status: r.status as TradingAccount["status"],
  };
}

export function createSupabaseJournalRepository(userId: string): JournalRepository {
  return {
    async getSettings() {
      const r = check(await supabase.from("journal_settings").select("*").eq("user_id", userId).maybeSingle());
      if (!r) return null;
      return {
        windowStart: hhmm(r.window_start),
        windowEnd: hhmm(r.window_end),
        timezone: r.timezone,
        avoidFridays: r.avoid_fridays,
        avoidNewsDays: r.avoid_news_days,
        avoidHolidays: r.avoid_holidays,
        avoidThanksgivingWeek: r.avoid_thanksgiving_week,
        avoidLateDecember: r.avoid_late_december,
      };
    },
    async saveSettings(s) {
      check(
        await supabase.from("journal_settings").upsert({
          user_id: userId,
          window_start: s.windowStart,
          window_end: s.windowEnd,
          timezone: s.timezone,
          avoid_fridays: s.avoidFridays,
          avoid_news_days: s.avoidNewsDays,
          avoid_holidays: s.avoidHolidays,
          avoid_thanksgiving_week: s.avoidThanksgivingWeek,
          avoid_late_december: s.avoidLateDecember,
          updated_at: new Date().toISOString(),
        })
      );
    },

    async listRules() {
      const list = rows(await supabase.from("journal_rules").select("id, label, position, active").order("position"));
      return list.map((r) => ({ id: r.id, label: r.label, position: r.position, active: r.active }));
    },
    async addRule(label, position) {
      const r = one(await supabase.from("journal_rules").insert({ label, position }).select("id, label, position, active").single());
      return { id: r.id, label: r.label, position: r.position, active: r.active };
    },
    async updateRule(rule) {
      check(await supabase.from("journal_rules").update({ label: rule.label, position: rule.position, active: rule.active }).eq("id", rule.id));
    },
    async deleteRule(id) {
      check(await supabase.from("journal_rules").delete().eq("id", id));
    },

    async listAccounts() {
      const list = rows(await supabase.from("trading_accounts").select("*").order("created_at"));
      return list.map(toAccount);
    },
    async saveAccount(a) {
      check(
        await supabase.from("trading_accounts").upsert({
          id: a.id,
          label: a.label,
          firm: a.firm,
          account_type: a.accountType,
          platform: a.platform,
          starting_balance: a.startingBalance,
          max_drawdown: a.maxDrawdown,
          drawdown_type: a.drawdownType,
          daily_loss_limit: a.dailyLossLimit,
          profit_target: a.profitTarget,
          consistency_pct: a.consistencyPct,
          status: a.status,
        })
      );
    },
    async deleteAccount(id) {
      check(await supabase.from("trading_accounts").delete().eq("id", id));
    },

    async listTrades() {
      const list = rows(await supabase.from("trades").select("*").order("entry_time", { ascending: false }));
      return list.map(toTrade);
    },
    async getTrade(id) {
      const r = check(await supabase.from("trades").select("*").eq("id", id).maybeSingle());
      return r ? toTrade(r) : null;
    },
    async saveTrade(t) {
      check(await supabase.from("trades").upsert(fromTrade(t)));
    },
    async deleteTrade(id) {
      const shots = rows(await supabase.from("trade_screenshots").select("path").eq("trade_id", id));
      if (shots.length) await supabase.storage.from(BUCKET).remove(shots.map((s) => s.path));
      check(await supabase.from("trades").delete().eq("id", id));
    },

    async listScreenshots(tradeId) {
      const list = rows(await supabase.from("trade_screenshots").select("id, trade_id, kind, path").eq("trade_id", tradeId));
      return list.map((r) => ({ id: r.id, tradeId: r.trade_id, kind: r.kind, path: r.path }));
    },
    async uploadScreenshot(tradeId, kind, file) {
      // One screenshot per label: replace any existing one.
      const existing = rows(await supabase.from("trade_screenshots").select("id, path").eq("trade_id", tradeId).eq("kind", kind));
      const path = `${userId}/${tradeId}/${kind}-${crypto.randomUUID()}.jpg`;
      const up = await supabase.storage.from(BUCKET).upload(path, file, { contentType: "image/jpeg" });
      if (up.error) throw new Error(up.error.message);
      check(await supabase.from("trade_screenshots").insert({ trade_id: tradeId, kind, path }));
      if (existing.length) {
        await supabase.storage.from(BUCKET).remove(existing.map((e) => e.path));
        check(await supabase.from("trade_screenshots").delete().in("id", existing.map((e) => e.id)));
      }
    },
    async deleteScreenshot(shot) {
      await supabase.storage.from(BUCKET).remove([shot.path]);
      check(await supabase.from("trade_screenshots").delete().eq("id", shot.id));
    },
    async screenshotUrl(path) {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
      if (error) throw new Error(error.message);
      return data.signedUrl;
    },

    async getDay(day) {
      const r = check(await supabase.from("journal_days").select("*").eq("day", day).maybeSingle());
      if (!r) return null;
      return {
        day: r.day,
        bias: r.bias,
        premarketPlan: r.premarket_plan,
        newsFlags: r.news_flags ?? [],
        postSession: r.post_session,
        followedPlan: r.followed_plan,
      };
    },
    async saveDay(d) {
      check(
        await supabase.from("journal_days").upsert(
          {
            day: d.day,
            bias: d.bias,
            premarket_plan: d.premarketPlan,
            news_flags: d.newsFlags,
            post_session: d.postSession,
            followed_plan: d.followedPlan,
          },
          { onConflict: "user_id,day" }
        )
      );
    },
  };
}
