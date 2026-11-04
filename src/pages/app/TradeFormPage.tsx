import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import type { StringKey } from "../../i18n/en";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useJournalRepository } from "../../hooks/useJournalRepository";
import { CONTRACTS, INSTRUMENTS, tickValue, type Instrument } from "../../lib/instruments";
import { computeTrade, inWindow, zonedParts, type Direction } from "../../lib/tradeMath";
import { standAside } from "../../lib/standAside";
import { isoToZonedInput, parseNumber, zonedInputToIso } from "../../lib/dateTimeInput";
import { resizeImage } from "../../lib/resizeImage";
import type { JournalRule, JournalSettings, RuleCheck, ScreenshotKind, SetupGrade, Trade, TradeScreenshot, TradingAccount } from "../../lib/journalTypes";
import { ErrorText, Field, Money, Page, Panel, Toggle } from "../../components/app/AppUI";
import { buttonDanger, buttonPrimary, buttonSecondary, inputClass } from "../../components/app/styles";
import { formatMoney } from "../../lib/money";

const SHOT_KINDS: ScreenshotKind[] = ["htf", "entry", "exit"];
const GRADES: SetupGrade[] = ["A", "B", "C", "F"];

interface Form {
  accountId: string;
  instrument: Instrument;
  direction: Direction;
  entryTime: string;
  exitTime: string;
  entryPrice: string;
  exitPrice: string;
  stopPrice: string;
  targetPrice: string;
  contracts: string;
  fees: string;
  setupGrade: SetupGrade | null;
  emotion: string;
  notes: string;
  tags: string;
}

const s = (n: number | null) => (n === null ? "" : String(n));

function blankForm(accounts: TradingAccount[]): Form {
  const active = accounts.find((a) => a.status === "active");
  return {
    accountId: active?.id ?? "",
    instrument: "NQ",
    direction: "long",
    entryTime: isoToZonedInput(new Date().toISOString()).slice(0, 16),
    exitTime: "",
    entryPrice: "",
    exitPrice: "",
    stopPrice: "",
    targetPrice: "",
    contracts: "1",
    fees: "",
    setupGrade: null,
    emotion: "",
    notes: "",
    tags: "",
  };
}

function formFromTrade(tr: Trade): Form {
  return {
    accountId: tr.accountId ?? "",
    instrument: tr.instrument,
    direction: tr.direction,
    entryTime: isoToZonedInput(tr.entryTime),
    exitTime: tr.exitTime ? isoToZonedInput(tr.exitTime) : "",
    entryPrice: s(tr.entryPrice),
    exitPrice: s(tr.exitPrice),
    stopPrice: s(tr.stopPrice),
    targetPrice: s(tr.targetPrice),
    contracts: s(tr.contracts),
    fees: tr.fees ? s(tr.fees) : "",
    setupGrade: tr.setupGrade,
    emotion: tr.emotion ?? "",
    notes: tr.notes ?? "",
    tags: tr.tags.join(", "),
  };
}

interface Loaded {
  settings: JournalSettings | null;
  rules: JournalRule[];
  accounts: TradingAccount[];
  trade: Trade | null;
  shots: TradeScreenshot[];
}

/** Remounts per trade so form state never leaks from one trade to the next. */
export function TradeFormPage() {
  const { tradeId } = useParams();
  return <TradeForm key={tradeId ?? "new"} tradeId={tradeId} />;
}

function TradeForm({ tradeId }: { tradeId: string | undefined }) {
  const isNew = !tradeId;
  const t = useT();
  useDocumentTitle(isNew ? "j.form.newTitle" : "j.form.editTitle");
  const repo = useJournalRepository();
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [checks, setChecks] = useState<RuleCheck[]>([]);
  // null = follow the automatic value; true/false = the trader changed it.
  const [windowOverride, setWindowOverride] = useState<boolean | null>(null);
  const [standAsideOverride, setStandAsideOverride] = useState<boolean | null>(null);
  const [pending, setPending] = useState<Partial<Record<ScreenshotKind, File>>>({});
  const [removed, setRemoved] = useState<TradeScreenshot[]>([]);
  const [shotUrls, setShotUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      repo.getSettings(),
      repo.listRules(),
      repo.listAccounts(),
      tradeId ? repo.getTrade(tradeId) : Promise.resolve(null),
      tradeId ? repo.listScreenshots(tradeId) : Promise.resolve([]),
    ])
      .then(([settings, rules, accounts, trade, shots]) => {
        if (cancelled) return;
        if (tradeId && !trade) return setNotFound(true);
        setLoaded({ settings, rules, accounts, trade, shots });
        const activeRules = rules.filter((r) => r.active);
        if (trade) {
          setForm(formFromTrade(trade));
          setChecks(trade.ruleChecks.length ? trade.ruleChecks : activeRules.map((r) => ({ ruleId: r.id, label: r.label, followed: false })));
          // Keep anything the trader set by hand last time.
          const autoW = inWindow(trade.entryTime, settings?.windowStart ?? null, settings?.windowEnd ?? null, settings?.timezone);
          if (trade.inWindow !== autoW) setWindowOverride(trade.inWindow);
          if (settings) {
            const autoS = standAside(zonedParts(trade.entryTime, settings.timezone).date, settings).standAside;
            if (trade.standAsideDay !== autoS) setStandAsideOverride(trade.standAsideDay);
          }
        } else {
          setForm(blankForm(accounts));
          setChecks(activeRules.map((r) => ({ ruleId: r.id, label: r.label, followed: false })));
        }
      })
      .catch((err: Error) => !cancelled && setError(t("j.loadError", { error: err.message })));
    return () => {
      cancelled = true;
    };
  }, [repo, tradeId, t]);

  useEffect(() => {
    let cancelled = false;
    for (const shot of loaded?.shots ?? []) {
      repo
        .screenshotUrl(shot.path)
        .then((url) => !cancelled && setShotUrls((prev) => ({ ...prev, [shot.id]: url })))
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [loaded, repo]);

  const settings = loaded?.settings ?? null;
  const entryIso = form ? zonedInputToIso(form.entryTime) : null;

  const auto = useMemo(() => {
    if (!entryIso) return { inWindow: null, standAside: null as boolean | null, reasons: [] as string[] };
    const tz = settings?.timezone ?? "America/New_York";
    const w = inWindow(entryIso, settings?.windowStart ?? null, settings?.windowEnd ?? null, tz);
    const sa = settings ? standAside(zonedParts(entryIso, tz).date, settings) : { standAside: false, reasons: [] };
    return { inWindow: w, standAside: sa.standAside, reasons: sa.reasons as string[] };
  }, [entryIso, settings]);

  const inWindowValue = windowOverride ?? auto.inWindow;
  const standAsideValue = standAsideOverride ?? auto.standAside;

  const preview = useMemo(() => {
    if (!form) return null;
    const entryPrice = parseNumber(form.entryPrice);
    if (entryPrice === null) return null;
    return computeTrade({
      instrument: form.instrument,
      direction: form.direction,
      entryPrice,
      exitPrice: parseNumber(form.exitPrice),
      stopPrice: parseNumber(form.stopPrice),
      contracts: Math.max(1, Math.floor(parseNumber(form.contracts) ?? 1)),
      fees: parseNumber(form.fees) ?? 0,
    });
  }, [form]);

  if (notFound) {
    return (
      <Page titleKey="j.form.editTitle">
        <ErrorText>{t("j.form.notFound")}</ErrorText>
        <Link to="/app/journal" className={`${buttonSecondary} self-start`}>{t("j.nav.trades")}</Link>
      </Page>
    );
  }

  if (!form || !loaded) {
    return (
      <Page titleKey={isNew ? "j.form.newTitle" : "j.form.editTitle"}>
        {error ? <ErrorText>{error}</ErrorText> : <p className="text-sm text-slate-400">{t("common.loading")}</p>}
      </Page>
    );
  }

  const set = (patch: Partial<Form>) => setForm({ ...form, ...patch });
  const spec = CONTRACTS[form.instrument];
  const priceStep = String(spec.tick);
  const currentShots = loaded.shots.filter((sh) => !removed.some((r) => r.id === sh.id));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form || !loaded) return;
    setError(null);
    const entryTime = zonedInputToIso(form.entryTime);
    const entryPrice = parseNumber(form.entryPrice);
    if (!entryTime || entryPrice === null) return setError(t("j.form.error.entry"));
    const contracts = Number(form.contracts);
    if (!Number.isInteger(contracts) || contracts < 1) return setError(t("j.form.error.contracts"));
    const exitTime = zonedInputToIso(form.exitTime);
    if (exitTime && exitTime < entryTime) return setError(t("j.form.error.exitBeforeEntry"));

    const fees = parseNumber(form.fees) ?? 0;
    const exitPrice = parseNumber(form.exitPrice);
    const stopPrice = parseNumber(form.stopPrice);
    const results = computeTrade({ instrument: form.instrument, direction: form.direction, entryPrice, exitPrice, stopPrice, contracts, fees });
    const id = loaded.trade?.id ?? crypto.randomUUID();
    const trade: Trade = {
      id,
      accountId: form.accountId || null,
      instrument: form.instrument,
      direction: form.direction,
      entryTime,
      exitTime,
      entryPrice,
      exitPrice,
      stopPrice,
      targetPrice: parseNumber(form.targetPrice),
      contracts,
      fees,
      ...results,
      inWindow: inWindowValue,
      standAsideDay: standAsideValue,
      ruleChecks: checks,
      setupGrade: form.setupGrade,
      emotion: form.emotion.trim() || null,
      notes: form.notes.trim() || null,
      tags: form.tags.split(",").map((x) => x.trim()).filter(Boolean),
      source: loaded.trade?.source ?? "manual",
    };

    setBusy(true);
    try {
      await repo.saveTrade(trade);
      for (const shot of removed) await repo.deleteScreenshot(shot);
      for (const kind of SHOT_KINDS) {
        const file = pending[kind];
        if (file) await repo.uploadScreenshot(id, kind, await resizeImage(file));
      }
      navigate("/app/journal");
    } catch (err) {
      setError(t("j.error", { error: (err as Error).message }));
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!loaded?.trade || !window.confirm(t("j.form.deleteConfirm"))) return;
    setBusy(true);
    try {
      await repo.deleteTrade(loaded.trade.id);
      navigate("/app/journal");
    } catch (err) {
      setError(t("j.error", { error: (err as Error).message }));
      setBusy(false);
    }
  }

  const windowLabel =
    settings?.windowStart && settings?.windowEnd ? `${settings.windowStart} to ${settings.windowEnd} ET` : null;
  const priceInput = `${inputClass} font-mono`;

  return (
    <Page
      titleKey={isNew ? "j.form.newTitle" : "j.form.editTitle"}
      actions={<Link to="/app/journal" className={buttonSecondary}>{t("j.nav.trades")}</Link>}
    >
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6 min-w-0">
          <Panel>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={t("j.form.account")}>
                <select value={form.accountId} onChange={(e) => set({ accountId: e.target.value })} className={inputClass}>
                  <option value="">{t("j.form.noAccount")}</option>
                  {loaded.accounts.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </Field>
              <Field label={t("j.form.instrument")}>
                <select value={form.instrument} onChange={(e) => set({ instrument: e.target.value as Instrument })} className={inputClass}>
                  {INSTRUMENTS.map((i) => <option key={i} value={i}>{t(`instrument.${i}` as StringKey)}</option>)}
                </select>
              </Field>
              <Field label={t("j.form.direction")}>
                <Toggle value={form.direction} onChange={(v) => set({ direction: v })} options={[{ value: "long", label: t("j.long") }, { value: "short", label: t("j.short") }]} />
              </Field>
              <Field label={t("j.form.entryTime")}>
                <input type="datetime-local" step="1" value={form.entryTime} onChange={(e) => set({ entryTime: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t("j.form.exitTime")}>
                <input type="datetime-local" step="1" value={form.exitTime} onChange={(e) => set({ exitTime: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t("j.form.contracts")}>
                <input type="number" inputMode="numeric" min={1} step={1} value={form.contracts} onChange={(e) => set({ contracts: e.target.value })} className={priceInput} />
              </Field>
              <Field label={t("j.form.entryPrice")}>
                <input type="number" inputMode="decimal" step={priceStep} value={form.entryPrice} onChange={(e) => set({ entryPrice: e.target.value })} className={priceInput} />
              </Field>
              <Field label={t("j.form.exitPrice")}>
                <input type="number" inputMode="decimal" step={priceStep} value={form.exitPrice} onChange={(e) => set({ exitPrice: e.target.value })} className={priceInput} />
              </Field>
              <Field label={t("j.form.stopPrice")}>
                <input type="number" inputMode="decimal" step={priceStep} value={form.stopPrice} onChange={(e) => set({ stopPrice: e.target.value })} className={priceInput} />
              </Field>
              <Field label={t("j.form.targetPrice")}>
                <input type="number" inputMode="decimal" step={priceStep} value={form.targetPrice} onChange={(e) => set({ targetPrice: e.target.value })} className={priceInput} />
              </Field>
              <Field label={t("j.form.fees")}>
                <input type="number" inputMode="decimal" min={0} step="0.01" value={form.fees} onChange={(e) => set({ fees: e.target.value })} className={priceInput} />
              </Field>
            </div>
            <p className="mt-3 text-xs text-slate-500 font-mono">
              {t("j.form.tick", { instrument: form.instrument, tickValue: formatMoney(tickValue(form.instrument)), pointValue: formatMoney(spec.pointValue) })}
            </p>
          </Panel>

          <Panel title={t("j.form.rulesTitle")}>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 border-b border-slate-800 pb-3">
                <label className="flex items-center gap-3 text-sm text-slate-200">
                  <input type="checkbox" disabled={auto.inWindow === null} checked={inWindowValue === true} onChange={(e) => setWindowOverride(e.target.checked)} className="h-4 w-4 accent-[#1f4fd8]" />
                  {windowLabel ? t("j.form.inWindow", { window: windowLabel }) : t("j.form.noWindow")}
                </label>
                <label className="flex items-start gap-3 text-sm text-slate-200">
                  <input type="checkbox" checked={standAsideValue === true} onChange={(e) => setStandAsideOverride(e.target.checked)} className="h-4 w-4 mt-0.5 accent-[#1f4fd8]" />
                  <span>
                    {t("j.form.standAside")}
                    {auto.reasons.length > 0 && (
                      <span className="text-amber-300"> · {auto.reasons.map((r) => t(`reason.${r}` as StringKey)).join(", ")}</span>
                    )}
                  </span>
                </label>
                <p className="text-[11px] text-slate-500">{t("j.form.auto")}</p>
              </div>
              {checks.length === 0 ? (
                <p className="text-sm text-slate-400">
                  {t("j.form.noRules")}{" "}
                  <Link to="/app/journal/rules" className="text-accent underline underline-offset-2">{t("j.form.setRules")}</Link>
                </p>
              ) : (
                checks.map((c) => (
                  <label key={c.ruleId} className="flex items-start gap-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={c.followed}
                      onChange={(e) => setChecks((prev) => prev.map((x) => (x.ruleId === c.ruleId ? { ...x, followed: e.target.checked } : x)))}
                      className="h-4 w-4 mt-0.5 accent-[#1f4fd8]"
                    />
                    {c.label}
                  </label>
                ))
              )}
            </div>
          </Panel>

          <Panel>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("j.form.grade")}>
                <Toggle value={form.setupGrade} onChange={(v) => set({ setupGrade: form.setupGrade === v ? null : v })} options={GRADES.map((g) => ({ value: g, label: g }))} />
              </Field>
              <Field label={t("j.form.emotion")}>
                <input value={form.emotion} onChange={(e) => set({ emotion: e.target.value })} placeholder={t("j.form.emotionPlaceholder")} maxLength={200} className={inputClass} />
              </Field>
              <Field label={t("j.form.notes")} className="sm:col-span-2">
                <textarea value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={4} maxLength={10000} className={inputClass} />
              </Field>
              <Field label={t("j.form.tags")} help={t("j.form.tagsHelp")} className="sm:col-span-2">
                <input value={form.tags} onChange={(e) => set({ tags: e.target.value })} className={inputClass} />
              </Field>
            </div>
          </Panel>

          <Panel title={t("j.form.screenshots")}>
            <p className="text-xs text-slate-500 mb-3">{t("j.form.screenshotsHelp")}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {SHOT_KINDS.map((kind) => {
                const existing = currentShots.find((sh) => sh.kind === kind);
                const file = pending[kind];
                return (
                  <div key={kind} className="border border-slate-800 bg-slate-950 p-3 flex flex-col gap-2">
                    <p className="text-xs font-mono uppercase tracking-[0.12em] text-slate-400">{t(`j.form.shot.${kind}` as StringKey)}</p>
                    {file ? (
                      <p className="text-xs text-slate-300 break-all">{file.name}<span className="block text-slate-500">{t("j.form.shot.pending")}</span></p>
                    ) : existing && shotUrls[existing.id] ? (
                      <a href={shotUrls[existing.id]} target="_blank" rel="noreferrer" className="block">
                        <img src={shotUrls[existing.id]} alt={t(`j.form.shot.${kind}` as StringKey)} className="w-full h-24 object-cover border border-slate-800" />
                      </a>
                    ) : null}
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <label className="text-xs text-slate-200 border border-slate-600 px-2 py-1 cursor-pointer hover:border-slate-400">
                        {t(file || existing ? "j.form.shot.replace" : "j.form.shot.choose")}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setPending((prev) => ({ ...prev, [kind]: f }));
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {(file || existing) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (file) setPending((prev) => ({ ...prev, [kind]: undefined }));
                            else if (existing) setRemoved((prev) => [...prev, existing]);
                          }}
                          className="text-xs text-slate-400 hover:text-rose-400 px-1"
                        >
                          {t("j.form.shot.remove")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 self-start w-full">
          <Panel title={t("j.form.preview")}>
            {preview && preview.netPnl !== null ? (
              <dl className="grid grid-cols-2 gap-y-3">
                <dt className="text-xs text-slate-400">{t("j.form.points")}</dt>
                <dd className="text-right font-mono text-white">{preview.points}</dd>
                <dt className="text-xs text-slate-400">{t("j.form.gross")}</dt>
                <dd className="text-right"><Money value={preview.grossPnl} /></dd>
                <dt className="text-xs text-slate-400">{t("j.form.net")}</dt>
                <dd className="text-right text-xl"><Money value={preview.netPnl} /></dd>
                <dt className="text-xs text-slate-400">{t("j.form.r")}</dt>
                <dd className="text-right font-mono text-white">{preview.rMultiple === null ? "—" : `${preview.rMultiple}R`}</dd>
              </dl>
            ) : (
              <p className="text-sm text-slate-400">{t("j.form.openTrade")}</p>
            )}
          </Panel>
          {error && <ErrorText>{error}</ErrorText>}
          <button type="submit" disabled={busy} className={buttonPrimary}>{t(busy ? "j.saving" : "j.form.save")}</button>
          {!isNew && (
            <button type="button" onClick={handleDelete} disabled={busy} className={buttonDanger}>{t("j.delete")}</button>
          )}
        </aside>
      </form>
    </Page>
  );
}
