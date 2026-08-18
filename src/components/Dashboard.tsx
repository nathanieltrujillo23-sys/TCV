import { useMemo } from "react";
import { useLedger } from "../state/LedgerContext";
import { isWithinPeriod } from "../utils/period";
import { formatCurrency, transactionTotal } from "../utils/format";
import { trendBuckets } from "../utils/trend";
import { TrendChart } from "./TrendChart";

export function Dashboard() {
  const { transactions, period, periodReference, primaryView } = useLedger();

  const { totalIncome, totalExpense } = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    for (const t of transactions) {
      if (!isWithinPeriod(t.date, period, periodReference)) continue;
      const total = transactionTotal(t);
      if (t.type === "income") totalIncome += total;
      else totalExpense += total;
    }
    return { totalIncome, totalExpense };
  }, [transactions, period, periodReference]);

  const trend = useMemo(
    () => trendBuckets(period, transactions, primaryView, periodReference),
    [transactions, period, primaryView, periodReference]
  );

  const net = totalIncome - totalExpense;
  const primaryTotal = primaryView === "income" ? totalIncome : totalExpense;
  const secondaryTotal = primaryView === "income" ? totalExpense : totalIncome;
  const primaryLabel = primaryView === "income" ? "Income" : "Expenses";
  const secondaryLabel = primaryView === "income" ? "Expenses" : "Income";

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <div className="rounded-2xl bg-slate-800 p-5">
        <p className="text-slate-400 text-sm font-medium">{primaryLabel}</p>
        <p
          className={`text-4xl font-bold mt-1 ${
            primaryView === "income" ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {formatCurrency(primaryTotal)}
        </p>

        <div className="mt-4 flex items-center gap-6 text-sm">
          <div>
            <span className="text-slate-400">{secondaryLabel}: </span>
            <span className="text-slate-200 font-medium">{formatCurrency(secondaryTotal)}</span>
          </div>
          <div>
            <span className="text-slate-400">Net: </span>
            <span className={`font-semibold ${net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatCurrency(net)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700">
          <TrendChart points={trend} color={primaryView === "income" ? "emerald" : "rose"} />
        </div>
      </div>
    </div>
  );
}
