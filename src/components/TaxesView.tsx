import { useMemo, useState } from "react";
import { useLedger } from "../state/LedgerContext";
import { formatCurrency } from "../utils/format";
import { estimateTax, llcNetProfitForYear, TAX_YEAR } from "../utils/taxEstimate";

function NumberField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-400">
      {label}
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-base focus:outline-none focus:border-slate-500"
      />
      {hint && <span className="text-slate-500">{hint}</span>}
    </label>
  );
}

function ResultRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "emerald" | "rose" | "neutral";
}) {
  const color = tone === "emerald" ? "text-emerald-400" : tone === "rose" ? "text-rose-400" : "text-slate-200";
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}

export function TaxesView() {
  const { transactions } = useLedger();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const autoProfit = useMemo(() => llcNetProfitForYear(transactions, year), [transactions, year]);

  const [llcProfitOverride, setLlcProfitOverride] = useState<string | null>(null);
  const [workIncome, setWorkIncome] = useState("");
  const [federalWithheld, setFederalWithheld] = useState("");
  const [tips, setTips] = useState("");
  const [scholarship, setScholarship] = useState("");

  const llcProfit = llcProfitOverride !== null ? parseFloat(llcProfitOverride) || 0 : autoProfit.net;

  const result = useMemo(
    () =>
      estimateTax({
        llcNetProfit: llcProfit,
        workIncome: parseFloat(workIncome) || 0,
        federalWithheld: parseFloat(federalWithheld) || 0,
        tips: parseFloat(tips) || 0,
        scholarshipRefund: parseFloat(scholarship) || 0,
      }),
    [llcProfit, workIncome, federalWithheld, tips, scholarship]
  );

  const withheldAmount = parseFloat(federalWithheld) || 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 flex flex-col gap-4">
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4">
        <p className="text-amber-200 text-sm font-medium">Planning estimate only — not tax advice</p>
        <p className="text-amber-200/80 text-xs mt-1">
          Assumes a single filer with a single-member LLC taxed as a sole proprietorship (Schedule C), using {TAX_YEAR}{" "}
          federal figures. Doesn't account for state taxes, tax credits, itemized deductions, retirement contributions,
          or every QBI/tip-deduction edge case (e.g. specified-service businesses, W-2 wage limits). Talk to a CPA
          before you file.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-800 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-slate-200 font-semibold text-sm">LLC business profit</h2>
          <label className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
            Tax year
            <input
              type="number"
              value={year}
              onChange={(e) => {
                setYear(parseInt(e.target.value, 10) || year);
                setLlcProfitOverride(null);
              }}
              className="w-20 rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-white text-sm"
            />
          </label>
        </div>
        <p className="text-slate-500 text-xs">
          Auto-calculated from your ledger for {year}: {formatCurrency(autoProfit.income)} income −{" "}
          {formatCurrency(autoProfit.expense)} expenses = {formatCurrency(autoProfit.net)} net profit. Override below
          if your ledger doesn't capture everything.
        </p>
        <NumberField
          label="Net profit (Schedule C)"
          value={llcProfitOverride ?? String(autoProfit.net)}
          onChange={setLlcProfitOverride}
        />
      </div>

      <div className="rounded-2xl bg-slate-800 p-4 flex flex-col gap-3">
        <h2 className="text-slate-200 font-semibold text-sm">Other work income</h2>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="W-2 wages (gross)" value={workIncome} onChange={setWorkIncome} />
          <NumberField
            label="Federal tax already withheld"
            value={federalWithheld}
            onChange={setFederalWithheld}
            hint="Optional — for the owed/refund line"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-slate-800 p-4 flex flex-col gap-3">
        <h2 className="text-slate-200 font-semibold text-sm">Non-taxable income</h2>
        <p className="text-slate-500 text-xs">
          Tips are deductible up to $25,000 under the One Big Beautiful Bill's "no tax on tips" provision (2025–2028,
          phasing out above $150,000 MAGI). Scholarship refunds are treated as fully excluded, assuming they were used
          for qualified tuition/fees.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Tips received" value={tips} onChange={setTips} />
          <NumberField label="Scholarship refund" value={scholarship} onChange={setScholarship} />
        </div>
      </div>

      <div className="rounded-2xl bg-slate-800 p-4">
        <h2 className="text-slate-200 font-semibold text-sm mb-2">Estimate</h2>
        <div className="divide-y divide-slate-700">
          <ResultRow label="Total income" value={formatCurrency(result.totalIncome)} />
          <ResultRow label="Standard deduction" value={`− ${formatCurrency(result.standardDeduction)}`} />
          <ResultRow label="Half of SE tax deduction" value={`− ${formatCurrency(result.halfSeTaxDeduction)}`} />
          <ResultRow label="Tips deduction" value={`− ${formatCurrency(result.tipsDeduction)}`} />
          <ResultRow label="QBI deduction (20%)" value={`− ${formatCurrency(result.qbiDeduction)}`} />
          <ResultRow label="Taxable income" value={formatCurrency(result.taxableIncome)} />
        </div>
        <div className="border-t border-slate-700 mt-2 pt-2 divide-y divide-slate-700">
          <ResultRow label="Federal income tax" value={formatCurrency(result.federalIncomeTax)} tone="rose" />
          <ResultRow label="Self-employment tax" value={formatCurrency(result.seTax)} tone="rose" />
          <ResultRow label="Total estimated tax liability" value={formatCurrency(result.totalTaxLiability)} tone="rose" />
          <ResultRow label="Effective rate" value={`${(result.effectiveRate * 100).toFixed(1)}%`} />
          {withheldAmount > 0 && (
            <ResultRow
              label={result.balanceDue >= 0 ? "Estimated amount owed" : "Estimated refund"}
              value={formatCurrency(Math.abs(result.balanceDue))}
              tone={result.balanceDue >= 0 ? "rose" : "emerald"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
