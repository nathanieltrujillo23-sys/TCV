import { useState } from "react";
import { formatCurrency } from "../utils/format";
import { useSummaryData } from "../hooks/useSummaryData";
import { ComparisonTrendChart } from "./ComparisonTrendChart";
import { ForecastChart } from "./ForecastChart";
import { MarginTrendChart } from "./MarginTrendChart";
import { TransactionCountChart } from "./TransactionCountChart";
import { CumulativeChart } from "./CumulativeChart";
import { BreakdownList } from "./BreakdownList";
import { PieChart } from "./PieChart";
import { AveragesCard } from "./AveragesCard";
import { GrowthCard } from "./GrowthCard";
import { VendorDetailModal } from "./VendorDetailModal";
import type { TransactionType } from "../types";

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
  const {
    effectiveRange,
    totalIncome,
    totalExpense,
    expenseTransactionCount,
    net,
    netMargin,
    incomeTrend,
    expenseTrend,
    netTrend,
    cumulativeNet,
    expenseBreakdown,
    incomeBreakdown,
    categoryBreakdown,
    incomeCountTrend,
    expenseCountTrend,
    marginTrendData,
    netForecast,
  } = useSummaryData();

  const [selected, setSelected] = useState<{ type: TransactionType; label: string } | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <StatTile label="Income" value={formatCurrency(totalIncome)} tone="emerald" />
        <StatTile label="Expenses" value={formatCurrency(totalExpense)} tone="rose" />
        <StatTile label="Net" value={formatCurrency(net)} tone={net >= 0 ? "emerald" : "rose"} />
        <StatTile
          label="Net margin"
          value={netMargin === null ? "—" : `${netMargin.toFixed(0)}%`}
          tone={netMargin === null ? "neutral" : netMargin >= 0 ? "emerald" : "rose"}
        />
        <StatTile label="Expense transactions" value={String(expenseTransactionCount)} tone="rose" />
      </div>

      <AveragesCard />

      <GrowthCard />

      <div id="summary-chart-comparison" className="rounded-2xl bg-slate-800 p-4">
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

      <div id="summary-chart-net" className="rounded-2xl bg-slate-800 p-4">
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-slate-200 font-semibold text-sm mr-auto">Net per period</h2>
          {netForecast.length > 0 && (
            <span className="flex items-center gap-1 text-slate-400 text-xs">
              <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-slate-400" /> Forecast
            </span>
          )}
        </div>
        <ForecastChart actual={netTrend} forecast={netForecast} />
      </div>

      <div id="summary-chart-margin" className="rounded-2xl bg-slate-800 p-4">
        <h2 className="text-slate-200 font-semibold text-sm mb-2">Net margin trend</h2>
        <MarginTrendChart points={marginTrendData} />
      </div>

      <div id="summary-chart-cumulative" className="rounded-2xl bg-slate-800 p-4">
        <h2 className="text-slate-200 font-semibold text-sm mb-2">Cumulative net</h2>
        <CumulativeChart points={cumulativeNet} />
      </div>

      <div id="summary-chart-count" className="rounded-2xl bg-slate-800 p-4">
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-slate-200 font-semibold text-sm mr-auto">Transaction count</h2>
          <span className="flex items-center gap-1 text-slate-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Income
          </span>
          <span className="flex items-center gap-1 text-slate-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Expenses
          </span>
        </div>
        <TransactionCountChart income={incomeCountTrend} expense={expenseCountTrend} />
      </div>

      <div id="summary-chart-pie" className="rounded-2xl bg-slate-800 p-4">
        <h2 className="text-slate-200 font-semibold text-sm mb-3">Where expenses went</h2>
        <PieChart items={expenseBreakdown} />
      </div>

      <div id="summary-chart-category" className="rounded-2xl bg-slate-800 p-4">
        <h2 className="text-slate-200 font-semibold text-sm mb-3">Expenses by category</h2>
        <PieChart items={categoryBreakdown} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-slate-800 p-4">
          <h2 className="text-slate-200 font-semibold text-sm mb-2">Top expense vendors</h2>
          <BreakdownList
            items={expenseBreakdown}
            color="rose"
            onSelect={(label) => setSelected({ type: "expense", label })}
          />
        </div>
        <div className="rounded-2xl bg-slate-800 p-4">
          <h2 className="text-slate-200 font-semibold text-sm mb-2">Top income sources</h2>
          <BreakdownList
            items={incomeBreakdown}
            color="emerald"
            onSelect={(label) => setSelected({ type: "income", label })}
          />
        </div>
      </div>

      {selected && (
        <VendorDetailModal
          type={selected.type}
          label={selected.label}
          range={effectiveRange}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
