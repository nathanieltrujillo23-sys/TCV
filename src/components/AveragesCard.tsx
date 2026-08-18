import { useMemo, useState } from "react";
import { useLedger } from "../state/LedgerContext";
import { isWithinRange, periodLabel, periodRange } from "../utils/period";
import { computeAverages, type AverageGranularity } from "../utils/averages";
import { formatCurrency, transactionTotal } from "../utils/format";
import { Segmented } from "./Segmented";

const GRANULARITY_OPTIONS: { value: AverageGranularity; label: string }[] = [
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

export function AveragesCard() {
  const { transactions } = useLedger();
  const [granularity, setGranularity] = useState<AverageGranularity>("month");
  const [browseRef, setBrowseRef] = useState(() => new Date());

  const averages = useMemo(() => computeAverages(transactions, granularity), [transactions, granularity]);

  const browseRange = useMemo(() => periodRange(granularity, browseRef), [granularity, browseRef]);

  const browseTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (!isWithinRange(t.date, browseRange)) continue;
      const total = transactionTotal(t);
      if (t.type === "income") income += total;
      else expense += total;
    }
    return { income, expense };
  }, [transactions, browseRange]);

  function changeGranularity(g: AverageGranularity) {
    setGranularity(g);
    setBrowseRef(new Date());
  }

  function shiftBrowse(direction: 1 | -1) {
    setBrowseRef((prev) => {
      const next = new Date(prev);
      if (granularity === "week") next.setDate(next.getDate() + 7 * direction);
      else next.setMonth(next.getMonth() + direction);
      return next;
    });
  }

  return (
    <div className="rounded-2xl bg-slate-800 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-slate-200 font-semibold text-sm">Averages</h2>
        <Segmented options={GRANULARITY_OPTIONS} value={granularity} onChange={changeGranularity} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5">
          <p className="text-slate-500 text-[11px] uppercase tracking-wide">
            Avg {granularity === "week" ? "weekly" : "monthly"} income
          </p>
          <p className="text-lg font-semibold mt-0.5 text-emerald-400">{formatCurrency(averages.avgIncome)}</p>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5">
          <p className="text-slate-500 text-[11px] uppercase tracking-wide">
            Avg {granularity === "week" ? "weekly" : "monthly"} expenses
          </p>
          <p className="text-lg font-semibold mt-0.5 text-rose-400">{formatCurrency(averages.avgExpense)}</p>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-700 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => shiftBrowse(-1)}
          aria-label={`Previous ${granularity}`}
          className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700 text-sm shrink-0"
        >
          ‹
        </button>
        <div className="text-center min-w-0">
          <p className="text-slate-300 text-xs font-medium truncate">{periodLabel(granularity, browseRef)}</p>
          <p className="text-[11px] text-slate-500">
            <span className="text-emerald-400">{formatCurrency(browseTotals.income)}</span>
            {" · "}
            <span className="text-rose-400">{formatCurrency(browseTotals.expense)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => shiftBrowse(1)}
          aria-label={`Next ${granularity}`}
          className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700 text-sm shrink-0"
        >
          ›
        </button>
      </div>
    </div>
  );
}
