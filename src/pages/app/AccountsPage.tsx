import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useT } from "../../i18n/LanguageContext";
import type { StringKey } from "../../i18n/en";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useJournalRepository } from "../../hooks/useJournalRepository";
import { accountHealth } from "../../lib/accountHealth";
import { parseNumber } from "../../lib/dateTimeInput";
import type { DrawdownType, Trade, TradingAccount, TradingAccountStatus, TradingAccountType } from "../../lib/journalTypes";
import { ErrorText, Field, Money, Page, Panel } from "../../components/app/AppUI";
import { buttonDanger, buttonPrimary, buttonSecondary, inputClass } from "../../components/app/styles";
import { formatMoney } from "../../lib/money";

const TYPES: TradingAccountType[] = ["evaluation", "funded", "personal"];
const DRAWDOWNS: DrawdownType[] = ["eod_trailing", "intraday_trailing", "static"];
const STATUSES: TradingAccountStatus[] = ["active", "passed", "failed", "closed"];

interface Draft {
  id: string;
  label: string;
  firm: string;
  accountType: TradingAccountType | "";
  platform: string;
  startingBalance: string;
  maxDrawdown: string;
  drawdownType: DrawdownType | "";
  dailyLossLimit: string;
  profitTarget: string;
  consistencyPct: string;
  status: TradingAccountStatus;
}

const str = (n: number | null) => (n === null ? "" : String(n));

function toDraft(a?: TradingAccount): Draft {
  return {
    id: a?.id ?? crypto.randomUUID(),
    label: a?.label ?? "",
    firm: a?.firm ?? "",
    accountType: a?.accountType ?? "evaluation",
    platform: a?.platform ?? "Tradesea / Rithmic",
    startingBalance: str(a?.startingBalance ?? null),
    maxDrawdown: str(a?.maxDrawdown ?? null),
    drawdownType: a?.drawdownType ?? "eod_trailing",
    dailyLossLimit: str(a?.dailyLossLimit ?? null),
    profitTarget: str(a?.profitTarget ?? null),
    consistencyPct: str(a?.consistencyPct ?? null),
    status: a?.status ?? "active",
  };
}

function fromDraft(d: Draft): TradingAccount {
  return {
    id: d.id,
    label: d.label.trim(),
    firm: d.firm.trim() || null,
    accountType: d.accountType || null,
    platform: d.platform.trim() || null,
    startingBalance: parseNumber(d.startingBalance),
    maxDrawdown: parseNumber(d.maxDrawdown),
    drawdownType: d.drawdownType || null,
    dailyLossLimit: parseNumber(d.dailyLossLimit),
    profitTarget: parseNumber(d.profitTarget),
    consistencyPct: parseNumber(d.consistencyPct),
    status: d.status,
  };
}

const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n * 100)}%`);

function HealthCard({ account, trades, onEdit }: { account: TradingAccount; trades: Trade[]; onEdit: () => void }) {
  const t = useT();
  const h = useMemo(() => accountHealth(account, trades), [account, trades]);
  const rows: { key: StringKey; value: React.ReactNode }[] = [
    { key: "acct.health.balance", value: h.balance === null ? "—" : <span className="font-mono">{formatMoney(h.balance)}</span> },
    { key: "acct.health.profit", value: <Money value={h.profit} /> },
    { key: "acct.health.floor", value: h.drawdownFloor === null ? "—" : <span className="font-mono">{formatMoney(h.drawdownFloor)}</span> },
    { key: "acct.health.distance", value: <Money value={h.distanceToFloor} /> },
    { key: "acct.health.today", value: <Money value={h.todayPnl} /> },
    { key: "acct.health.dailyRemaining", value: h.dailyLimitRemaining === null ? "—" : <span className="font-mono">{formatMoney(h.dailyLimitRemaining)}</span> },
    { key: "acct.health.bestDay", value: <span className="font-mono">{pct(h.bestDayShare)}</span> },
    { key: "acct.health.target", value: <span className="font-mono">{pct(h.targetProgress)}</span> },
  ];
  return (
    <div className="bg-slate-900 border border-slate-800 border-t-2 border-t-accent flex flex-col">
      <div className="px-4 py-3 border-b border-slate-800 flex items-start gap-3">
        <div className="mr-auto">
          <p className="text-white font-semibold">{account.label}</p>
          <p className="text-xs text-slate-400">
            {[account.firm, account.accountType && t(`acct.type.${account.accountType}` as StringKey), t(`acct.status.${account.status}` as StringKey)].filter(Boolean).join(" · ")}
          </p>
        </div>
        <button type="button" onClick={onEdit} className="text-xs text-slate-400 hover:text-white border border-slate-700 px-2 py-1">
          {t("j.edit")}
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-slate-800">
        {rows.map((row) => (
          <div key={row.key} className="bg-slate-900 px-4 py-2.5">
            <dt className="text-[11px] font-mono uppercase tracking-[0.1em] text-slate-500">{t(row.key)}</dt>
            <dd className="text-sm text-white mt-0.5">{row.value}</dd>
          </div>
        ))}
      </dl>
      {h.warnings.length > 0 && (
        <ul className="px-4 py-3 flex flex-col gap-1 border-t border-slate-800">
          {h.warnings.map((w) => (
            <li key={w} className="text-xs text-amber-300 flex gap-2">
              <span aria-hidden="true">▲</span>
              {t(`acct.warn.${w}` as StringKey)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AccountsPage() {
  const t = useT();
  useDocumentTitle("acct.title");
  const repo = useJournalRepository();

  const [accounts, setAccounts] = useState<TradingAccount[] | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([repo.listAccounts(), repo.listTrades()])
      .then(([a, tr]) => {
        if (cancelled) return;
        setAccounts(a);
        setTrades(tr);
      })
      .catch((err: Error) => !cancelled && setError(t("j.loadError", { error: err.message })));
    return () => {
      cancelled = true;
    };
  }, [repo, t]);

  function startNew() {
    setDraft(toDraft());
    setIsNew(true);
    setError(null);
  }

  function startEdit(a: TradingAccount) {
    setDraft(toDraft(a));
    setIsNew(false);
    setError(null);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    if (!draft.label.trim()) return setError(t("acct.error.label"));
    const account = fromDraft(draft);
    setBusy(true);
    setError(null);
    try {
      await repo.saveAccount(account);
      setAccounts((prev) => (isNew ? [...(prev ?? []), account] : (prev ?? []).map((a) => (a.id === account.id ? account : a))));
      setDraft(null);
    } catch (err) {
      setError(t("j.error", { error: (err as Error).message }));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!draft || !window.confirm(t("acct.deleteConfirm"))) return;
    if (trades.some((tr) => tr.accountId === draft.id)) return setError(t("acct.error.inUse"));
    setBusy(true);
    try {
      await repo.deleteAccount(draft.id);
      setAccounts((prev) => (prev ?? []).filter((a) => a.id !== draft.id));
      setDraft(null);
    } catch (err) {
      setError(t("j.error", { error: (err as Error).message }));
    } finally {
      setBusy(false);
    }
  }

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  return (
    <Page
      titleKey="acct.title"
      leadKey="acct.lead"
      actions={
        <button type="button" onClick={startNew} className={buttonPrimary}>
          {t("acct.new")}
        </button>
      }
    >
      {error && <ErrorText>{error}</ErrorText>}

      {draft && (
        <Panel title={t(isNew ? "acct.new" : "j.edit")}>
          <form onSubmit={save} className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label={t("acct.label")} className="sm:col-span-2">
                <input value={draft.label} onChange={(e) => set({ label: e.target.value })} placeholder={t("acct.labelPlaceholder")} maxLength={120} className={inputClass} />
              </Field>
              <Field label={t("acct.firm")}>
                <input value={draft.firm} onChange={(e) => set({ firm: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t("acct.platform")}>
                <input value={draft.platform} onChange={(e) => set({ platform: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t("acct.type")}>
                <select value={draft.accountType} onChange={(e) => set({ accountType: e.target.value as TradingAccountType })} className={inputClass}>
                  {TYPES.map((x) => <option key={x} value={x}>{t(`acct.type.${x}` as StringKey)}</option>)}
                </select>
              </Field>
              <Field label={t("acct.status")}>
                <select value={draft.status} onChange={(e) => set({ status: e.target.value as TradingAccountStatus })} className={inputClass}>
                  {STATUSES.map((x) => <option key={x} value={x}>{t(`acct.status.${x}` as StringKey)}</option>)}
                </select>
              </Field>
              <Field label={t("acct.startingBalance")}>
                <input type="number" inputMode="decimal" step="0.01" value={draft.startingBalance} onChange={(e) => set({ startingBalance: e.target.value })} className={`${inputClass} font-mono`} />
              </Field>
              <Field label={t("acct.profitTarget")}>
                <input type="number" inputMode="decimal" step="0.01" value={draft.profitTarget} onChange={(e) => set({ profitTarget: e.target.value })} className={`${inputClass} font-mono`} />
              </Field>
              <Field label={t("acct.maxDrawdown")}>
                <input type="number" inputMode="decimal" step="0.01" value={draft.maxDrawdown} onChange={(e) => set({ maxDrawdown: e.target.value })} className={`${inputClass} font-mono`} />
              </Field>
              <Field label={t("acct.drawdownType")}>
                <select value={draft.drawdownType} onChange={(e) => set({ drawdownType: e.target.value as DrawdownType })} className={inputClass}>
                  {DRAWDOWNS.map((x) => <option key={x} value={x}>{t(`acct.dd.${x}` as StringKey)}</option>)}
                </select>
              </Field>
              <Field label={t("acct.dailyLossLimit")}>
                <input type="number" inputMode="decimal" step="0.01" value={draft.dailyLossLimit} onChange={(e) => set({ dailyLossLimit: e.target.value })} className={`${inputClass} font-mono`} />
              </Field>
              <Field label={t("acct.consistency")} help={t("acct.consistencyHelp")}>
                <input type="number" inputMode="decimal" step="0.01" min={0} max={100} value={draft.consistencyPct} onChange={(e) => set({ consistencyPct: e.target.value })} className={`${inputClass} font-mono`} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={busy} className={buttonPrimary}>{t(busy ? "j.saving" : "j.save")}</button>
              <button type="button" onClick={() => setDraft(null)} className={buttonSecondary}>{t("j.cancel")}</button>
              {!isNew && <button type="button" onClick={remove} disabled={busy} className={`${buttonDanger} sm:ml-auto`}>{t("j.delete")}</button>}
            </div>
          </form>
        </Panel>
      )}

      {accounts === null ? (
        !error && <p className="text-sm text-slate-400">{t("common.loading")}</p>
      ) : accounts.length === 0 ? (
        !draft && <p className="text-sm text-slate-400 border border-dashed border-slate-700 p-6 text-center">{t("acct.empty")}</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {accounts.map((a) => (
              <HealthCard key={a.id} account={a} trades={trades} onEdit={() => startEdit(a)} />
            ))}
          </div>
          <p className="text-xs text-slate-500">{t("acct.health.estimate")}</p>
        </>
      )}
    </Page>
  );
}
