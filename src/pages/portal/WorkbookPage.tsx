import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import type { StringKey } from "../../i18n/en";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useWorkbook } from "../../hooks/useWorkbook";
import { formatMoney } from "../../lib/money";
import {
  goalPlan,
  MAX_GOALS,
  MAX_LINES,
  newDebt,
  newGoal,
  newLine,
  professionalQuestions,
  snapshot,
  totalMonthlyForGoals,
  workbookProgress,
  type Answer,
  type DebtLine,
  type Line,
  type PayType,
  type Stage,
  type WorkbookData,
} from "../../lib/workbook";
import { checkKey, checklistFor, questionKey } from "../../content/workbook";
import { lessonById } from "../../content/lessons";
import { Container } from "../../components/site/SiteUI";
import { EducationNote } from "../../components/portal/EducationNote";

const inputClass =
  "w-full min-w-0 bg-paper border border-line px-3 py-2 text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent";
const moneyClass = `${inputClass} font-mono text-right`;

type LineListKey = "income" | "fixed" | "variable" | "occasional" | "cash" | "otherAssets";

const STAGES: Stage[] = ["student", "first_job", "early_career"];
const PAY_TYPES: PayType[] = ["hourly", "salary", "aid", "mix"];
const ANSWERS: Answer[] = ["yes", "not_yet", "not_sure"];

function parseAmount(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function Section({ id, title, help, children }: { id: string; title: string; help?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="bg-paper border border-line border-t-2 border-t-ink p-5 sm:p-6 flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
        {help && <p className="text-sm text-ink-soft">{help}</p>}
      </div>
      {children}
    </section>
  );
}

/** A row of mutually exclusive choices, built on real radio buttons. */
function Choice<T extends string>({ name, legend, value, options, onChange }: { name: string; legend: string; value: T | null; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-xs font-medium text-ink mb-1.5">{legend}</legend>
      <div className="flex flex-wrap">
        {options.map((o) => (
          <label
            key={o.value}
            className={`cursor-pointer border px-3 py-1.5 text-sm -ml-px first:ml-0 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
              value === o.value ? "bg-ink text-white border-ink relative" : "bg-paper text-ink-soft border-line hover:text-ink"
            }`}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function LineList({ title, help, lines, onChange }: { title: string; help?: string; lines: Line[]; onChange: (lines: Line[]) => void }) {
  const t = useT();
  const set = (id: string, patch: Partial<Line>) => onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {help && <p className="text-xs text-ink-soft -mt-1">{help}</p>}
      {lines.map((l) => {
        const name = l.label || t("wb.line.unnamed");
        return (
          <div key={l.id} className="flex items-center gap-2">
            <input value={l.label} onChange={(e) => set(l.id, { label: e.target.value })} placeholder={t("wb.line.namePlaceholder")} aria-label={t("wb.line.labelFor")} maxLength={80} className={`${inputClass} flex-1 text-sm`} />
            <input type="number" inputMode="decimal" min={0} step="any" value={l.amount ?? ""} onChange={(e) => set(l.id, { amount: parseAmount(e.target.value) })} aria-label={t("wb.line.amountFor", { label: name })} className={`${moneyClass} w-28 shrink-0 text-sm`} />
            <button type="button" onClick={() => onChange(lines.filter((x) => x.id !== l.id))} aria-label={t("wb.line.remove", { label: name })} className="shrink-0 w-8 h-9 text-ink-soft hover:text-ink border border-transparent hover:border-line">
              ✕
            </button>
          </div>
        );
      })}
      {lines.length < MAX_LINES && (
        <button type="button" onClick={() => onChange([...lines, newLine()])} className="self-start text-sm text-accent hover:text-accent-dark underline underline-offset-4">
          + {t("wb.line.add")}
        </button>
      )}
    </div>
  );
}

function DebtList({ lines, onChange }: { lines: DebtLine[]; onChange: (lines: DebtLine[]) => void }) {
  const t = useT();
  const set = (id: string, patch: Partial<DebtLine>) => onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-ink">{t("wb.debts.title")}</h3>
      {lines.map((l) => {
        const name = l.label || t("wb.line.unnamed");
        return (
          <div key={l.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <input value={l.label} onChange={(e) => set(l.id, { label: e.target.value })} placeholder={t("wb.line.namePlaceholder")} aria-label={t("wb.line.labelFor")} maxLength={80} className={`${inputClass} basis-full sm:basis-auto sm:flex-1 text-sm`} />
            <input type="number" inputMode="decimal" min={0} step="any" value={l.amount ?? ""} onChange={(e) => set(l.id, { amount: parseAmount(e.target.value) })} aria-label={t("wb.line.amountFor", { label: name })} className={`${moneyClass} flex-1 sm:flex-none sm:w-28 text-sm`} />
            <input type="number" inputMode="decimal" min={0} max={100} step="any" value={l.rate ?? ""} onChange={(e) => set(l.id, { rate: parseAmount(e.target.value) })} placeholder={t("wb.debts.rate")} aria-label={t("wb.debts.rateFor", { label: name })} className={`${moneyClass} w-28 text-sm`} />
            <button type="button" onClick={() => onChange(lines.filter((x) => x.id !== l.id))} aria-label={t("wb.line.remove", { label: name })} className="shrink-0 w-8 h-9 text-ink-soft hover:text-ink border border-transparent hover:border-line">
              ✕
            </button>
          </div>
        );
      })}
      {lines.length < MAX_LINES && (
        <button type="button" onClick={() => onChange([...lines, newDebt()])} className="self-start text-sm text-accent hover:text-accent-dark underline underline-offset-4">
          + {t("wb.line.add")}
        </button>
      )}
    </div>
  );
}

function Figure({ label, value, tone = "plain", help, lessonId }: { label: string; value: string; tone?: "plain" | "good" | "bad"; help?: string; lessonId?: string }) {
  const t = useT();
  const lesson = lessonId ? lessonById(lessonId) : undefined;
  const color = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-red-700" : "text-ink";
  return (
    <div className="bg-surface border border-line p-4 flex flex-col gap-1">
      <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-ink-soft">{label}</p>
      <p className={`font-mono text-xl font-semibold ${color}`}>{value}</p>
      {help && <p className="text-xs text-ink-soft leading-relaxed">{help}</p>}
      {lesson && (
        <Link to={`/portal/lessons/${lesson.id}`} className="text-xs text-accent underline underline-offset-2 hover:text-accent-dark self-start">
          {t("wb.learnMore", { number: String(lesson.number).padStart(2, "0"), title: lesson.title })}
        </Link>
      )}
    </div>
  );
}

function SaveStatus({ state, error, onRetry }: { state: string; error: string | null; onRetry: () => void }) {
  const t = useT();
  if (state === "error") {
    return (
      <p role="alert" className="text-xs text-red-700">
        {t("wb.save.error", { error: error ?? "" })}{" "}
        <button type="button" onClick={onRetry} className="underline underline-offset-2">{t("lesson.retry")}</button>
      </p>
    );
  }
  if (state === "idle") return null;
  return <p aria-live="polite" className="text-xs font-mono text-ink-soft">{t(state === "saving" ? "wb.save.saving" : "wb.save.saved")}</p>;
}

export function WorkbookPage() {
  const t = useT();
  useDocumentTitle("wb.title");
  const { data, loadError, saveState, saveError, update, retrySave } = useWorkbook();
  const today = useMemo(() => new Date(), []);

  return (
    <Container>
      <div className="py-10 flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <Link to="/portal" className="text-sm text-accent hover:text-accent-dark self-start">← {t("portal.nav.home")}</Link>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">{t("wb.title")}</h1>
          <p className="text-ink-soft max-w-2xl">{t("wb.lead")}</p>
          <p className="text-sm text-ink border-l-2 border-accent pl-3 max-w-2xl">{t("wb.privacy")}</p>
        </header>
        {loadError ? (
          <p role="alert" className="text-sm text-red-700">{t("wb.loadError", { error: loadError })}</p>
        ) : !data ? (
          <p className="text-sm text-ink-soft">{t("common.loading")}</p>
        ) : (
          <WorkbookBody data={data} update={update} today={today} saveStatus={<SaveStatus state={saveState} error={saveError} onRetry={() => void retrySave()} />} />
        )}
        <EducationNote />
      </div>
    </Container>
  );
}

function WorkbookBody({ data, update, today, saveStatus }: { data: WorkbookData; update: (change: (w: WorkbookData) => WorkbookData) => void; today: Date; saveStatus: ReactNode }) {
  const t = useT();
  const visible = checklistFor(data.stage);
  const visibleIds = visible.map((c) => c.id);
  const s = snapshot(data);
  const progress = workbookProgress(data, visibleIds, today);
  const questions = professionalQuestions(data, visibleIds, today);
  const goalsMonthly = totalMonthlyForGoals(data.goals, today);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const setList = (key: LineListKey) => (lines: Line[]) => update((w) => ({ ...w, [key]: lines }));

  async function downloadPdf() {
    setPdfBusy(true);
    setPdfError(null);
    try {
      const { exportWorkbookPdf } = await import("../../lib/workbookPdf");
      await exportWorkbookPdf(data, t, today);
    } catch (err) {
      setPdfError((err as Error).message);
    } finally {
      setPdfBusy(false);
    }
  }

  const parts: { key: StringKey; done: boolean; href: string }[] = [
    { key: "wb.part.snapshot", done: progress.snapshot, href: "#wb-snapshot" },
    { key: "wb.part.goals", done: progress.goals, href: "#wb-goals" },
    { key: "wb.part.checklist", done: progress.checklist, href: "#wb-checklist" },
  ];

  return (
    <>
      <div className="sticky top-0 z-10 -mx-5 px-5 py-3 bg-surface/95 backdrop-blur border-b border-line flex flex-wrap items-center gap-x-5 gap-y-2">
        <p className="font-mono text-xs text-ink">{t("wb.progress", { done: progress.done, total: progress.total })}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1" aria-label={t("wb.title")}>
          {parts.map((p) => (
            <a key={p.key} href={p.href} className="text-sm text-ink-soft hover:text-ink">
              <span className={`inline-block w-2 h-2 mr-1.5 align-middle ${p.done ? "bg-accent" : "bg-line"}`} aria-hidden="true" />
              {t(p.key)}
            </a>
          ))}
        </nav>
        <div className="ml-auto">{saveStatus}</div>
      </div>

      {progress.done === progress.total && (
        <p role="status" className="bg-paper border border-line border-l-4 border-l-accent px-4 py-3 text-sm text-ink">{t("wb.finished")}</p>
      )}

      <Section id="wb-about" title={t("wb.about.title")} help={t("wb.about.help")}>
        <div className="flex flex-col gap-4">
          <Choice name="stage" legend={t("wb.stage.label")} value={data.stage} options={STAGES.map((v) => ({ value: v, label: t(`wb.stage.${v}` as StringKey) }))} onChange={(stage) => update((w) => ({ ...w, stage }))} />
          <Choice name="pay" legend={t("wb.pay.label")} value={data.payType} options={PAY_TYPES.map((v) => ({ value: v, label: t(`wb.pay.${v}` as StringKey) }))} onChange={(payType) => update((w) => ({ ...w, payType }))} />
        </div>
      </Section>

      <Section id="wb-snapshot" title={t("wb.snapshot.title")}>
        <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-accent">{t("wb.cashflow.title")}</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <LineList title={t("wb.income.title")} lines={data.income} onChange={setList("income")} />
          <LineList title={t("wb.fixed.title")} lines={data.fixed} onChange={setList("fixed")} />
          <LineList title={t("wb.variable.title")} lines={data.variable} onChange={setList("variable")} />
          <LineList title={t("wb.occasional.title")} help={t("wb.occasional.help")} lines={data.occasional} onChange={setList("occasional")} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Figure label={t("wb.fig.monthlyIncome")} value={formatMoney(s.monthlyIncome)} />
          <Figure label={t("wb.fig.monthlyExpenses")} value={formatMoney(s.monthlyExpenses)} />
          <Figure label={t("wb.fig.cashFlow")} value={formatMoney(s.cashFlow)} tone={s.cashFlow > 0 ? "good" : s.cashFlow < 0 ? "bad" : "plain"} help={t("wb.fig.cashFlowHelp")} lessonId="budgeting-cash-flow" />
        </div>

        <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-accent pt-2">{t("wb.networth.title")}</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <LineList title={t("wb.cash.title")} lines={data.cash} onChange={setList("cash")} />
            <LineList title={t("wb.otherAssets.title")} lines={data.otherAssets} onChange={setList("otherAssets")} />
          </div>
          <DebtList lines={data.debts} onChange={(debts) => update((w) => ({ ...w, debts }))} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Figure label={t("wb.fig.netWorth")} value={formatMoney(s.netWorth)} tone={s.netWorth < 0 ? "bad" : "plain"} help={t("wb.fig.netWorthHelp")} />
          <Figure
            label={t("wb.fig.monthsCovered")}
            value={s.monthsCovered === null ? "—" : t("wb.fig.months", { months: s.monthsCovered })}
            help={s.monthsCovered === null ? t("wb.fig.needsExpenses") : t("wb.fig.monthsCoveredHelp")}
            lessonId="emergency-funds"
          />
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
            <Figure label={t("wb.fig.totalAssets")} value={formatMoney(s.totalAssets)} />
            <Figure label={t("wb.fig.totalDebts")} value={formatMoney(s.totalDebts)} />
          </div>
        </div>
      </Section>

      <Section id="wb-goals" title={t("wb.goals.title")} help={t("wb.goals.help")}>
        <div className="flex flex-col gap-4">
          {data.goals.map((g, i) => {
            const plan = goalPlan(g, today);
            const set = (patch: Partial<typeof g>) => update((w) => ({ ...w, goals: w.goals.map((x) => (x.id === g.id ? { ...x, ...patch } : x)) }));
            return (
              <div key={g.id} className="border border-line p-4 flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr]">
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-ink">
                    {t("wb.goal.name")} {i + 1}
                    <input value={g.name} onChange={(e) => set({ name: e.target.value })} placeholder={t("wb.goal.namePlaceholder")} maxLength={80} className={`${inputClass} text-sm`} />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-ink">
                    {t("wb.goal.target")}
                    <input type="number" inputMode="decimal" min={0} step="any" value={g.target ?? ""} onChange={(e) => set({ target: parseAmount(e.target.value) })} className={`${moneyClass} text-sm`} />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-ink">
                    {t("wb.goal.saved")}
                    <input type="number" inputMode="decimal" min={0} step="any" value={g.saved ?? ""} onChange={(e) => set({ saved: parseAmount(e.target.value) })} className={`${moneyClass} text-sm`} />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-ink">
                    {t("wb.goal.date")}
                    <input type="month" value={g.date} onChange={(e) => set({ date: e.target.value })} className={`${inputClass} text-sm font-mono`} />
                  </label>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={`text-sm ${plan.status === "pastDate" ? "text-red-700" : plan.status === "onTrack" ? "text-ink font-mono" : "text-ink-soft"}`}>
                    {plan.status === "onTrack"
                      ? t("wb.goal.monthly", { amount: formatMoney(plan.monthlyNeeded ?? 0), months: plan.months ?? 0 })
                      : plan.status === "reached"
                        ? t("wb.goal.reached")
                        : plan.status === "pastDate"
                          ? t("wb.goal.pastDate")
                          : t("wb.goal.incomplete")}
                  </p>
                  {data.goals.length > 1 && (
                    <button type="button" onClick={() => update((w) => ({ ...w, goals: w.goals.filter((x) => x.id !== g.id) }))} className="text-xs text-ink-soft hover:text-ink underline underline-offset-2">
                      {t("wb.goal.remove")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {data.goals.length < MAX_GOALS && (
            <button type="button" onClick={() => update((w) => ({ ...w, goals: [...w.goals, newGoal()] }))} className="self-start text-sm text-accent hover:text-accent-dark underline underline-offset-4">
              + {t("wb.goal.add")}
            </button>
          )}
          {goalsMonthly > 0 && (
            <div className="bg-surface border border-line px-4 py-3 text-sm text-ink flex flex-col gap-1">
              <p className="font-mono">{t("wb.goals.total", { amount: formatMoney(goalsMonthly) })}</p>
              {s.monthlyExpenses > 0 && <p className="text-ink-soft">{t("wb.goals.cashFlow", { amount: formatMoney(s.cashFlow) })}</p>}
            </div>
          )}
        </div>
      </Section>

      <Section id="wb-checklist" title={t("wb.checklist.title")} help={t("wb.checklist.help")}>
        <div className="flex flex-col divide-y divide-line">
          {visible.map((item) => {
            const lesson = item.lessonId ? lessonById(item.lessonId) : undefined;
            return (
              <div key={item.id} className="py-4 first:pt-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="flex flex-col gap-1">
                  <Choice
                    name={`check-${item.id}`}
                    legend={t(checkKey(item.id))}
                    value={data.checklist[item.id] ?? null}
                    options={ANSWERS.map((a) => ({ value: a, label: t(`wb.answer.${a}` as StringKey) }))}
                    onChange={(answer) => update((w) => ({ ...w, checklist: { ...w.checklist, [item.id]: answer } }))}
                  />
                  {lesson && (
                    <Link to={`/portal/lessons/${lesson.id}`} className="text-xs text-accent underline underline-offset-2 hover:text-accent-dark self-start">
                      {t("wb.learnMore", { number: String(lesson.number).padStart(2, "0"), title: lesson.title })}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section id="wb-questions" title={t("wb.questions.title")} help={t("wb.questions.help")}>
        {questions.length === 0 ? (
          <p className="text-sm text-ink-soft">{t("wb.questions.empty")}</p>
        ) : (
          <ol className="flex flex-col gap-2 list-none">
            {questions.map((id, i) => (
              <li key={id} className="flex gap-3 text-[15px] text-ink">
                <span className="font-mono text-xs text-accent pt-1 w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                {t(questionKey(id))}
              </li>
            ))}
          </ol>
        )}
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <button type="button" onClick={() => void downloadPdf()} disabled={pdfBusy} className="self-start bg-accent hover:bg-accent-dark disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5">
            {t(pdfBusy ? "wb.pdf.working" : "wb.pdf.button")}
          </button>
          {pdfError && <p role="alert" className="text-sm text-red-700">{t("wb.pdf.error", { error: pdfError })}</p>}
        </div>
      </Section>
    </>
  );
}
