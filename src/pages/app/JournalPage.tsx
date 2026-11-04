import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import type { StringKey } from "../../i18n/en";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useJournalRepository } from "../../hooks/useJournalRepository";
import { zonedParts } from "../../lib/tradeMath";
import { standAside } from "../../lib/standAside";
import { EVENT_DAYS } from "../../content/eventDays";
import { followedRules, type JournalDay, type JournalSettings, type SetupGrade, type Trade, type TradingAccount } from "../../lib/journalTypes";
import { ErrorText, Field, JournalTabs, Money, Page, Panel, Toggle } from "../../components/app/AppUI";
import { buttonPrimary, buttonSecondary, inputClass } from "../../components/app/styles";
import { formatMoney } from "../../lib/money";

const NY = "America/New_York";
const dateFmt = new Intl.DateTimeFormat("en-US", { timeZone: NY, month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

type RulesFilter = "all" | "followed" | "broken";

function DailyPanel({ settings }: { settings: JournalSettings | null }) {
  const t = useT();
  const repo = useJournalRepository();
  const [date, setDate] = useState(() => zonedParts(new Date().toISOString(), NY).date);
  const [day, setDay] = useState<JournalDay | null>(null);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    repo
      .getDay(date)
      .then((d) => !cancelled && setDay(d ?? { day: date, bias: null, premarketPlan: null, newsFlags: [], postSession: null, followedPlan: null }))
      .catch((err: Error) => !cancelled && setStatus({ tone: "error", text: t("j.error", { error: err.message }) }));
    return () => {
      cancelled = true;
    };
  }, [repo, date, t]);

  const news = EVENT_DAYS.filter((e) => e.date === date).map((e) => e.kind);
  const sa = settings ? standAside(date, settings) : null;

  async function save() {
    if (!day) return;
    setBusy(true);
    setStatus(null);
    try {
      await repo.saveDay({ ...day, day: date, newsFlags: news });
      setStatus({ tone: "ok", text: t("j.saved") });
    } catch (err) {
      setStatus({ tone: "error", text: t("j.error", { error: (err as Error).message }) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title={t("j.day.title")}>
      <div className="flex flex-col gap-3">
        <Field label={t("j.day.date")}>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className={inputClass} />
        </Field>
        <p className="text-xs text-slate-400">
          {news.length ? t("j.day.news", { list: news.map((k) => t(`reason.${k}` as StringKey)).join(", ") }) : t("j.day.noNews")}
        </p>
        {sa?.standAside && (
          <p className="text-xs text-amber-300">{t("j.day.standAside", { list: sa.reasons.map((r) => t(`reason.${r}` as StringKey)).join(", ") })}</p>
        )}
        {day && (
          <>
            <Field label={t("j.day.bias")}>
              <input value={day.bias ?? ""} onChange={(e) => setDay({ ...day, bias: e.target.value || null })} maxLength={200} className={inputClass} />
            </Field>
            <Field label={t("j.day.premarket")}>
              <textarea value={day.premarketPlan ?? ""} onChange={(e) => setDay({ ...day, premarketPlan: e.target.value || null })} rows={3} className={inputClass} />
            </Field>
            <Field label={t("j.day.post")}>
              <textarea value={day.postSession ?? ""} onChange={(e) => setDay({ ...day, postSession: e.target.value || null })} rows={3} className={inputClass} />
            </Field>
            <Field label={t("j.day.followedPlan")} group>
              <Toggle
                value={day.followedPlan === null ? null : day.followedPlan ? "yes" : "no"}
                onChange={(v) => setDay({ ...day, followedPlan: v === "yes" })}
                options={[{ value: "yes", label: t("j.yes") }, { value: "no", label: t("j.no") }]}
              />
            </Field>
            <button type="button" onClick={save} disabled={busy} className={`${buttonPrimary} self-start`}>{t(busy ? "j.saving" : "j.save")}</button>
          </>
        )}
        {status && <p className={`text-sm ${status.tone === "ok" ? "text-emerald-400" : "text-rose-400"}`} role={status.tone === "ok" ? "status" : "alert"}>{status.text}</p>}
      </div>
    </Panel>
  );
}

export function JournalPage() {
  const t = useT();
  useDocumentTitle("app.journal.title");
  const repo = useJournalRepository();

  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [settings, setSettings] = useState<JournalSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [grade, setGrade] = useState<SetupGrade | "">("");
  const [rules, setRules] = useState<RulesFilter>("all");

  useEffect(() => {
    let cancelled = false;
    Promise.all([repo.listTrades(), repo.listAccounts(), repo.getSettings()])
      .then(([tr, a, s]) => {
        if (cancelled) return;
        setTrades(tr);
        setAccounts(a);
        setSettings(s);
      })
      .catch((err: Error) => !cancelled && setError(t("j.loadError", { error: err.message })));
    return () => {
      cancelled = true;
    };
  }, [repo, t]);

  const visible = useMemo(
    () =>
      (trades ?? []).filter((tr) => {
        const day = zonedParts(tr.entryTime, NY).date;
        if (accountFilter && tr.accountId !== accountFilter) return false;
        if (from && day < from) return false;
        if (to && day > to) return false;
        if (grade && tr.setupGrade !== grade) return false;
        if (rules !== "all" && followedRules(tr) !== (rules === "followed")) return false;
        return true;
      }),
    [trades, accountFilter, from, to, grade, rules]
  );
  const net = visible.reduce((sum, tr) => sum + (tr.netPnl ?? 0), 0);
  const accountName = (id: string | null) => accounts.find((a) => a.id === id)?.label;

  return (
    <Page
      titleKey="app.journal.title"
      leadKey="j.list.lead"
      actions={<Link to="/app/journal/new" className={buttonPrimary}>{t("j.nav.new")}</Link>}
    >
      <JournalTabs />
      {error && <ErrorText>{error}</ErrorText>}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4 min-w-0">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
            <Field label={t("j.filter.account")}>
              <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className={inputClass}>
                <option value="">{t("j.all")}</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </Field>
            <Field label={t("j.filter.from")}>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
            </Field>
            <Field label={t("j.filter.to")}>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
            </Field>
            <Field label={t("j.filter.grade")}>
              <select value={grade} onChange={(e) => setGrade(e.target.value as SetupGrade | "")} className={inputClass}>
                <option value="">{t("j.all")}</option>
                {(["A", "B", "C", "F"] as const).map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label={t("j.filter.rules")}>
              <select value={rules} onChange={(e) => setRules(e.target.value as RulesFilter)} className={inputClass}>
                <option value="all">{t("j.all")}</option>
                <option value="followed">{t("j.filter.rules.followed")}</option>
                <option value="broken">{t("j.filter.rules.broken")}</option>
              </select>
            </Field>
          </div>

          {trades === null ? (
            !error && <p className="text-sm text-slate-400">{t("common.loading")}</p>
          ) : visible.length === 0 ? (
            <div className="border border-dashed border-slate-700 p-8 text-center flex flex-col items-center gap-3">
              <p className="text-sm text-slate-400">{t("j.list.empty")}</p>
              {trades.length === 0 && <Link to="/app/journal/new" className={buttonSecondary}>{t("j.list.emptyCta")}</Link>}
            </div>
          ) : (
            <>
              <p className="text-xs font-mono text-slate-400">{t("j.summary", { count: visible.length, net: formatMoney(net) })}</p>
              <div className="overflow-x-auto border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900 text-[11px] font-mono uppercase tracking-[0.1em] text-slate-500">
                    <tr>
                      {(["j.col.date", "j.col.instrument", "j.col.side", "j.col.size", "j.col.net", "j.col.r", "j.col.grade", "j.col.rules"] as const).map((k) => (
                        <th key={k} className={`px-3 py-2 font-medium ${k === "j.col.net" || k === "j.col.r" || k === "j.col.size" ? "text-right" : "text-left"}`}>{t(k)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {visible.map((tr) => {
                      const ok = followedRules(tr);
                      return (
                        <tr key={tr.id} className="hover:bg-slate-900/60">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Link to={`/app/journal/${tr.id}`} className="text-white hover:text-accent">
                              {dateFmt.format(new Date(tr.entryTime))}
                            </Link>
                            {accountName(tr.accountId) && <span className="block text-[11px] text-slate-500">{accountName(tr.accountId)}</span>}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-200">{tr.instrument}</td>
                          <td className="px-3 py-2 text-slate-300">{t(tr.direction === "long" ? "j.long" : "j.short")}</td>
                          <td className="px-3 py-2 text-right font-mono text-slate-300">{tr.contracts}</td>
                          <td className="px-3 py-2 text-right">{tr.netPnl === null ? <span className="text-xs text-slate-400">{t("j.badge.open")}</span> : <Money value={tr.netPnl} />}</td>
                          <td className="px-3 py-2 text-right font-mono text-slate-300">{tr.rMultiple === null ? "—" : tr.rMultiple}</td>
                          <td className="px-3 py-2 font-mono text-slate-200">{tr.setupGrade ?? "—"}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[11px] font-mono uppercase tracking-wider px-1.5 py-0.5 border ${ok ? "border-emerald-800 text-emerald-300" : "border-rose-800 text-rose-300"}`}>
                              {t(ok ? "j.badge.followed" : "j.badge.broken")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <DailyPanel settings={settings} />
      </div>
    </Page>
  );
}
