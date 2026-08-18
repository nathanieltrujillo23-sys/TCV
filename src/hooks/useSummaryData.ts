import { useMemo } from "react";
import { useLedger } from "../state/LedgerContext";
import { isWithinRange } from "../utils/period";
import { transactionTotal } from "../utils/format";
import { countBuckets, forecastTrend, trendBuckets } from "../utils/trend";
import { breakdownByCategory, breakdownByCounterparty } from "../utils/breakdown";
import { marginTrend } from "../utils/margin";

const FORECAST_PERIODS = 3;

// Shared by SummaryView (for on-screen rendering) and the PDF export button
// (for its own hidden, off-screen chart instances) so both stay in sync.
export function useSummaryData() {
  const { transactions, effectiveRange } = useLedger();

  const { totalIncome, totalExpense } = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    for (const t of transactions) {
      if (!isWithinRange(t.date, effectiveRange)) continue;
      const total = transactionTotal(t);
      if (t.type === "income") totalIncome += total;
      else totalExpense += total;
    }
    return { totalIncome, totalExpense };
  }, [transactions, effectiveRange]);

  const net = totalIncome - totalExpense;
  const netMargin = totalIncome > 0 ? (net / totalIncome) * 100 : null;

  const incomeTrend = useMemo(
    () => trendBuckets(effectiveRange, transactions, "income"),
    [transactions, effectiveRange]
  );
  const expenseTrend = useMemo(
    () => trendBuckets(effectiveRange, transactions, "expense"),
    [transactions, effectiveRange]
  );
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
    () => breakdownByCounterparty(transactions, "expense", effectiveRange, 5),
    [transactions, effectiveRange]
  );
  const incomeBreakdown = useMemo(
    () => breakdownByCounterparty(transactions, "income", effectiveRange, 5),
    [transactions, effectiveRange]
  );
  const categoryBreakdown = useMemo(
    () => breakdownByCategory(transactions, effectiveRange, 5),
    [transactions, effectiveRange]
  );

  const incomeCountTrend = useMemo(
    () => countBuckets(effectiveRange, transactions, "income"),
    [transactions, effectiveRange]
  );
  const expenseCountTrend = useMemo(
    () => countBuckets(effectiveRange, transactions, "expense"),
    [transactions, effectiveRange]
  );

  const marginTrendData = useMemo(() => marginTrend(incomeTrend, expenseTrend), [incomeTrend, expenseTrend]);

  const netForecast = useMemo(
    () => forecastTrend(effectiveRange, netTrend, FORECAST_PERIODS),
    [effectiveRange, netTrend]
  );

  return {
    effectiveRange,
    totalIncome,
    totalExpense,
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
  };
}
