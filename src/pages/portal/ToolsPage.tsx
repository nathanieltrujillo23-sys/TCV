import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import type { StringKey } from "../../i18n/en";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { compoundGrowth, debtPayoff, retirementProjection, savingsGoal } from "../../lib/calculators";
import { formatMoney } from "../../lib/money";
import { Container } from "../../components/site/SiteUI";
import { EducationNote } from "../../components/portal/EducationNote";

const inputClass =
  "w-full bg-paper border border-line px-3 py-2 font-mono text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent";

function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function NumberField({ labelKey, value, onChange, step = "any" }: { labelKey: StringKey; value: string; onChange: (v: string) => void; step?: string }) {
  const t = useT();
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-ink">
      {t(labelKey)}
      <input type="number" inputMode="decimal" min={0} step={step} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </label>
  );
}

function Result({ labelKey, children, emphasis = false }: { labelKey: StringKey; children: ReactNode; emphasis?: boolean }) {
  const t = useT();
  return (
    <div className="bg-paper px-4 py-3">
      <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-ink-soft">{t(labelKey)}</p>
      <p className={`mt-1 font-mono ${emphasis ? "text-2xl text-ink font-semibold" : "text-lg text-ink"}`}>{children}</p>
    </div>
  );
}

function ToolSection({ id, titleKey, howKey, inputs, results }: { id: string; titleKey: StringKey; howKey: StringKey; inputs: ReactNode; results: ReactNode }) {
  const t = useT();
  return (
    <section id={id} className="scroll-mt-6 bg-paper border border-line border-t-2 border-t-ink">
      <div className="p-5 flex flex-col gap-1 border-b border-line">
        <h2 className="text-xl font-semibold tracking-tight text-ink">{t(titleKey)}</h2>
        <p className="text-sm text-ink-soft leading-relaxed max-w-3xl">{t(howKey)}</p>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="p-5 grid grid-cols-2 gap-3 content-start border-b lg:border-b-0 lg:border-r border-line">{inputs}</div>
        <div className="p-5 flex flex-col gap-4 bg-surface min-w-0">{results}</div>
      </div>
    </section>
  );
}

/** Stacked yearly bars: deposits (navy) and growth (cobalt). */
function GrowthBars({ rows }: { rows: { year: number; deposited: number; balance: number }[] }) {
  const t = useT();
  if (rows.length === 0) return null;
  const width = 600;
  const height = 160;
  const max = Math.max(...rows.map((r) => r.balance), 1);
  const slot = width / rows.length;
  const bar = Math.max(1, slot * 0.7);
  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40" role="img" aria-label={t("tools.chart.caption")} preserveAspectRatio="none">
        {rows.map((r, i) => {
          const total = (r.balance / max) * height;
          const deposited = (Math.min(r.deposited, r.balance) / max) * height;
          const x = i * slot + (slot - bar) / 2;
          return (
            <g key={r.year}>
              <rect x={x} y={height - total} width={bar} height={total - deposited} fill="#1f4fd8" />
              <rect x={x} y={height - deposited} width={bar} height={deposited} fill="#0a1a33" />
            </g>
          );
        })}
      </svg>
      <figcaption className="flex gap-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-ink" aria-hidden="true" />{t("tools.chart.deposited")}</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-accent" aria-hidden="true" />{t("tools.chart.growth")}</span>
      </figcaption>
    </figure>
  );
}

function CompoundTool() {
  const [initial, setInitial] = useState("1000");
  const [monthly, setMonthly] = useState("200");
  const [rate, setRate] = useState("6");
  const [years, setYears] = useState("20");
  const r = useMemo(() => compoundGrowth(num(initial), num(monthly), num(rate), Math.min(60, Math.floor(num(years)))), [initial, monthly, rate, years]);
  return (
    <ToolSection
      id="compound"
      titleKey="tools.compound"
      howKey="tools.compound.how"
      inputs={
        <>
          <NumberField labelKey="tools.initial" value={initial} onChange={setInitial} />
          <NumberField labelKey="tools.monthly" value={monthly} onChange={setMonthly} />
          <NumberField labelKey="tools.rate" value={rate} onChange={setRate} />
          <NumberField labelKey="tools.years" value={years} onChange={setYears} step="1" />
        </>
      }
      results={
        <>
          <div className="grid gap-px bg-line border border-line sm:grid-cols-3">
            <Result labelKey="tools.result.final" emphasis>{formatMoney(r.finalBalance)}</Result>
            <Result labelKey="tools.result.contributed">{formatMoney(r.totalContributed)}</Result>
            <Result labelKey="tools.result.growth">{formatMoney(r.totalGrowth)}</Result>
          </div>
          <GrowthBars rows={r.years.map((y) => ({ year: y.year, deposited: y.contributed, balance: y.balance }))} />
        </>
      }
    />
  );
}

function SavingsTool() {
  const t = useT();
  const [goal, setGoal] = useState("10000");
  const [current, setCurrent] = useState("1000");
  const [months, setMonths] = useState("24");
  const [rate, setRate] = useState("4");
  const r = useMemo(() => savingsGoal(num(goal), num(current), Math.floor(num(months)), num(rate)), [goal, current, months, rate]);
  return (
    <ToolSection
      id="savings"
      titleKey="tools.savings"
      howKey="tools.savings.how"
      inputs={
        <>
          <NumberField labelKey="tools.goal" value={goal} onChange={setGoal} />
          <NumberField labelKey="tools.current" value={current} onChange={setCurrent} />
          <NumberField labelKey="tools.months" value={months} onChange={setMonths} step="1" />
          <NumberField labelKey="tools.rate" value={rate} onChange={setRate} />
        </>
      }
      results={
        <>
          <div className="grid gap-px bg-line border border-line sm:grid-cols-2">
            <Result labelKey="tools.result.monthlyNeeded" emphasis>{formatMoney(r.monthlyNeeded)}</Result>
            <Result labelKey="tools.result.currentGrows">{formatMoney(r.currentGrowsTo)}</Result>
          </div>
          {r.monthlyNeeded === 0 && <p className="text-sm text-ink-soft">{t("tools.result.alreadyThere")}</p>}
        </>
      }
    />
  );
}

function DebtTool() {
  const t = useT();
  const [balance, setBalance] = useState("5000");
  const [apr, setApr] = useState("18");
  const [payment, setPayment] = useState("200");
  const r = useMemo(() => debtPayoff(num(balance), num(apr), num(payment)), [balance, apr, payment]);
  return (
    <ToolSection
      id="debt"
      titleKey="tools.debt"
      howKey="tools.debt.how"
      inputs={
        <>
          <NumberField labelKey="tools.balance" value={balance} onChange={setBalance} />
          <NumberField labelKey="tools.apr" value={apr} onChange={setApr} />
          <NumberField labelKey="tools.payment" value={payment} onChange={setPayment} />
        </>
      }
      results={
        r.months === null ? (
          <p className="text-sm text-red-700" role="alert">{t("tools.result.never", { interest: formatMoney(r.firstMonthInterest) })}</p>
        ) : (
          <div className="grid gap-px bg-line border border-line sm:grid-cols-3">
            <Result labelKey="tools.result.months" emphasis>{r.months}</Result>
            <Result labelKey="tools.result.interest">{formatMoney(r.totalInterest ?? 0)}</Result>
            <Result labelKey="tools.result.totalPaid">{formatMoney(r.totalPaid ?? 0)}</Result>
          </div>
        )
      }
    />
  );
}

function RetirementTool() {
  const [salary, setSalary] = useState("50000");
  const [contribution, setContribution] = useState("6");
  const [matchRate, setMatchRate] = useState("50");
  const [matchCap, setMatchCap] = useState("6");
  const [currentBalance, setCurrentBalance] = useState("0");
  const [years, setYears] = useState("30");
  const [rate, setRate] = useState("6");
  const [raise, setRaise] = useState("2");
  const r = useMemo(
    () =>
      retirementProjection({
        salary: num(salary),
        contributionPct: num(contribution),
        matchRatePct: num(matchRate),
        matchCapPct: num(matchCap),
        currentBalance: num(currentBalance),
        years: Math.min(60, Math.floor(num(years))),
        annualReturnPct: num(rate),
        salaryGrowthPct: num(raise),
      }),
    [salary, contribution, matchRate, matchCap, currentBalance, years, rate, raise]
  );
  let deposited = num(currentBalance);
  const rows = r.years.map((y) => {
    deposited += y.yourContribution + y.employerMatch;
    return { year: y.year, deposited, balance: y.balance };
  });
  return (
    <ToolSection
      id="retirement"
      titleKey="tools.retirement"
      howKey="tools.retirement.how"
      inputs={
        <>
          <NumberField labelKey="tools.salary" value={salary} onChange={setSalary} />
          <NumberField labelKey="tools.contribution" value={contribution} onChange={setContribution} />
          <NumberField labelKey="tools.matchRate" value={matchRate} onChange={setMatchRate} />
          <NumberField labelKey="tools.matchCap" value={matchCap} onChange={setMatchCap} />
          <NumberField labelKey="tools.currentBalance" value={currentBalance} onChange={setCurrentBalance} />
          <NumberField labelKey="tools.years" value={years} onChange={setYears} step="1" />
          <NumberField labelKey="tools.rate" value={rate} onChange={setRate} />
          <NumberField labelKey="tools.salaryGrowth" value={raise} onChange={setRaise} />
        </>
      }
      results={
        <>
          <div className="grid gap-px bg-line border border-line sm:grid-cols-2 xl:grid-cols-4">
            <Result labelKey="tools.result.final" emphasis>{formatMoney(r.finalBalance)}</Result>
            <Result labelKey="tools.result.yours">{formatMoney(r.totalYours)}</Result>
            <Result labelKey="tools.result.match">{formatMoney(r.totalMatch)}</Result>
            <Result labelKey="tools.result.growth">{formatMoney(r.totalGrowth)}</Result>
          </div>
          <GrowthBars rows={rows} />
        </>
      }
    />
  );
}

export function ToolsPage() {
  const t = useT();
  useDocumentTitle("portal.tools.title");
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [hash]);

  return (
    <Container>
      <div className="py-10 flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">{t("portal.tools.title")}</h1>
          <p className="text-ink-soft max-w-2xl">{t("tools.lead")}</p>
          <EducationNote />
        </header>
        <CompoundTool />
        <SavingsTool />
        <DebtTool />
        <RetirementTool />
      </div>
    </Container>
  );
}
