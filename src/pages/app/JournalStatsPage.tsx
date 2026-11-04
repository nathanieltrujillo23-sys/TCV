import { useEffect, useMemo, useState } from "react";
import { useT } from "../../i18n/LanguageContext";
import type { StringKey } from "../../i18n/en";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useJournalRepository } from "../../hooks/useJournalRepository";
import { journalStats, type SplitStats } from "../../lib/journalStats";
import type { Trade, TradingAccount } from "../../lib/journalTypes";
import { ErrorText, Field, JournalTabs, Money, Page, Panel, Stat } from "../../components/app/AppUI";
import { inputClass } from "../../components/app/styles";
import { formatMoney } from "../../lib/money";

const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n * 100)}%`);

function SplitCard({ titleKey, stats, tone }: { titleKey: StringKey; stats: SplitStats; tone: "good" | "bad" }) {
  const t = useT();
  return (
    <div className={`bg-slate-900 border border-slate-800 border-l-4 ${tone === "good" ? "border-l-emerald-500" : "border-l-rose-500"} p-5`}>
      <p className="text-xs font-mono uppercase tracking-[0.12em] text-slate-400">{t(titleKey)}</p>
      <p className="mt-2 text-3xl font-semibold"><Money value={stats.netPnl} /></p>
      <p className="mt-2 text-sm text-slate-400 font-mono">
        {t("stats.split.trades", { count: stats.count })} · {t("stats.split.winRate", { rate: pct(stats.winRate) })}
      </p>
    </div>
  );
}

function EquityChart({ points }: { points: { equity: number }[] }) {
  const width = 640;
  const height = 200;
  const pad = 8;
  const values = [0, ...points.map((p) => p.equity)];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => pad + (i / Math.max(values.length - 1, 1)) * (width - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const path = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = values[values.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-52" role="img" preserveAspectRatio="none">
      <line x1={pad} x2={width - pad} y1={y(0)} y2={y(0)} stroke="#26334c" strokeDasharray="4 4" />
      <path d={path} fill="none" stroke={last >= 0 ? "#34d399" : "#fb7185"} strokeWidth={2} strokeLinejoin="miter" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Bars({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.value)));
  return (
    <div className="flex flex-col gap-2">
      {items.map((i) => (
        <div key={i.label} className="grid grid-cols-[48px_1fr_96px] items-center gap-3 text-sm">
          <span className="text-slate-400 font-mono text-xs">{i.label}</span>
          <div className="h-3 bg-slate-950 relative">
            <div className={`absolute inset-y-0 left-0 ${i.value >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${(Math.abs(i.value) / max) * 100}%` }} />
          </div>
          <span className="text-right"><Money value={i.value} /></span>
        </div>
      ))}
    </div>
  );
}

export function JournalStatsPage() {
  const t = useT();
  useDocumentTitle("stats.title");
  const repo = useJournalRepository();
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [accountFilter, setAccountFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([repo.listTrades(), repo.listAccounts()])
      .then(([tr, a]) => {
        if (cancelled) return;
        setTrades(tr);
        setAccounts(a);
      })
      .catch((err: Error) => !cancelled && setError(t("j.loadError", { error: err.message })));
    return () => {
      cancelled = true;
    };
  }, [repo, t]);

  const s = useMemo(() => journalStats((trades ?? []).filter((tr) => !accountFilter || tr.accountId === accountFilter)), [trades, accountFilter]);

  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];

  return (
    <Page titleKey="stats.title">
      <JournalTabs />
      {error && <ErrorText>{error}</ErrorText>}
      {accounts.length > 0 && (
        <Field label={t("j.filter.account")} className="max-w-xs">
          <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className={inputClass}>
            <option value="">{t("j.all")}</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </Field>
      )}
      {trades === null ? (
        !error && <p className="text-sm text-slate-400">{t("common.loading")}</p>
      ) : s.count === 0 ? (
        <p className="text-sm text-slate-400 border border-dashed border-slate-700 p-8 text-center">{t("stats.empty")}</p>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-mono uppercase tracking-[0.14em] text-slate-400">{t("stats.split.title")}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <SplitCard titleKey="stats.split.followed" stats={s.followed} tone="good" />
              <SplitCard titleKey="stats.split.broken" stats={s.broken} tone="bad" />
            </div>
          </section>

          <div className="grid gap-px bg-slate-800 border border-slate-800 grid-cols-2 md:grid-cols-5">
            <Stat label={t("stats.netPnl")}><Money value={s.netPnl} /></Stat>
            <Stat label={t("stats.trades")}><span className="font-mono">{s.count}</span></Stat>
            <Stat label={t("stats.winRate")}><span className="font-mono">{pct(s.winRate)}</span></Stat>
            <Stat label={t("stats.avgWin")}><Money value={s.avgWin} /></Stat>
            <Stat label={t("stats.avgLoss")}><Money value={s.avgLoss} /></Stat>
            <Stat label={t("stats.profitFactor")}><span className="font-mono">{s.profitFactor ?? "—"}</span></Stat>
            <Stat label={t("stats.expectancy")}><Money value={s.expectancy} /></Stat>
            <Stat label={t("stats.avgR")}><span className="font-mono">{s.avgR === null ? "—" : `${s.avgR}R`}</span></Stat>
            <Stat label={t("stats.maxDrawdown")}><span className="font-mono text-rose-400">{formatMoney(-s.maxDrawdown)}</span></Stat>
            <Stat label={t("stats.adherence")}><span className="font-mono">{pct(s.adherenceRate)}</span></Stat>
          </div>

          <Panel title={t("stats.equity")}>
            <EquityChart points={s.equityCurve} />
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel title={t("stats.byWeekday")}>
              <Bars items={weekdayOrder.map((d) => ({ label: t(`stats.weekday.${d}` as StringKey), value: s.byWeekday[d] }))} />
            </Panel>
            <Panel title={t("stats.byGrade")}>
              <Bars items={(["A", "B", "C", "F", "ungraded"] as const).map((g) => ({ label: g === "ungraded" ? t("stats.ungraded") : g, value: s.byGrade[g] }))} />
            </Panel>
          </div>
        </>
      )}
    </Page>
  );
}
