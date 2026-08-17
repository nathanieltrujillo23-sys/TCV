import { useMemo } from "react";
import { useLedger } from "../state/LedgerContext";
import { isWithinPeriod } from "../utils/period";
import { formatCurrency, transactionTotal } from "../utils/format";
import { trendBuckets } from "../utils/trend";
import { breakdownByCounterparty } from "../utils/breakdown";
import { ComparisonTrendChart } from "./ComparisonTrendChart";
import { NetTrendChart } from "./NetTrendChart";
import { CumulativeChart } from "./CumulativeChart";
import { BreakdownList } from "./BreakdownList";

function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "emerald" | "rose" | "neutral";
}) {
  const color = tone === "emerald" ? "text-emerald-400" : tone === "rose" ? "text-rose-400" : "text-slate-100";
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5">
      <p className="text-slate-500 text-[11px] uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-semibold mt-0.5 ${color}`}>{value}</p>
    </div>
  );
}

export function SummaryView() {
  const { transactions, period } = useLedger();

  const { totalIncome, totalExpense } = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    for (const t of transactions) {
      if (!isWithinPeriod(t.date, period)) continue;
      const total = transactionTotal(t);
      if (t.type === "income") totalIncome += total;
      else totalExpense += total;
    }
    return { totalIncome, totalExpense };
  }, [transactions, period]);

  const net = totalIncome - totalExpense;
  const netMargin = totalIncome > 0 ? (net / totalIncome) * 100 : null;

  const incomeTrend = useMemo(() => trendBuckets(period, transactions, "income"), [transactions, period]);
  const expenseTrend = useMemo(() => trendBuckets(period, transactions, "expense"), [transactions, period]);
  const netTrend = useMemo(
    () => incomeTrend.map((p, i) => ({ label: p.label, value: p.value - (expenseTrend[i]?.value ?? 0) })),
    [incomeTrend, expenseTrend]
  );
  const cumulativeNet = useMemo(() => {
    let running = 0;
    return netTrend.map((p) => {
      running += p.value;
      return { label: p.label, value: running };
    });
  }, [netTrend]);

  const expenseBreakdown = useMemo(
    () => breakdownByCounterparty(transactions, "expense", period),
    [transactions, period]
  );
  const incomeBreakdown = useMemo(
    () => breakdownByCounterparty(transactions, "income", period),
    [transactions, period]
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatTile label="Income" value={formatCurrency(totalIncome)} tone="emerald" />
        <StatTile label="Expenses" value={formatCurrency(totalExpense)} tone="rose" />
        <StatTile label="Net" value={formatCurrency(net)} tone={net >= 0 ? "emerald" : "rose"} />
        <StatTile
          label="Net margin"
          value={netMargin === null ? "—" : `${netMargin.toFixed(0)}%`}
          tone={netMargin === null ? "neutral" : netMargin >= 0 ? "emerald" : "rose"}
        />
      </div>

      <div className="rounded-2xl bg-slate-800 p-4">
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-slate-200 font-semibold text-sm mr-auto">Income vs expenses</h2>
          <span className="flex items-center gap-1 text-slate-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Income
          </span>
          <span className="flex items-center gap-1 text-slate-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Expenses
          </span>
        </div>
        <ComparisonTrendChart income={incomeTrend} expense={expenseTrend} />
      </div>

      <div className="rounded-2xl bg-slate-800 p-4">
        <h2 className="text-slate-200 font-semibold text-sm mb-2">Net per period</h2>
        <NetTrendChart points={netTrend} />
      </div>

      <div className="rounded-2xl bg-slate-800 p-4">
        <h2 className="text-slate-200 font-semibold text-sm mb-2">Cumulative net</h2>
        <CumulativeChart points={cumulativeNet} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-slate-800 p-4">
          <h2 className="text-slate-200 font-semibold text-sm mb-2">Top expense vendors</h2>
          <BreakdownList items={expenseBreakdown} color="rose" />
        </div>
        <div className="rounded-2xl bg-slate-800 p-4">
          <h2 className="text-slate-200 font-semibold text-sm mb-2">Top income sources</h2>
          <BreakdownList items={incomeBreakdown} color="emerald" />
        </div>
      </div>
    </div>
  );
}
