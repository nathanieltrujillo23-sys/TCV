import { useRef, useState } from "react";
import { useLedger } from "../state/LedgerContext";
import { useSummaryData } from "../hooks/useSummaryData";
import { exportSummaryPdf } from "../utils/pdfExport";
import { ComparisonTrendChart } from "./ComparisonTrendChart";
import { ForecastChart } from "./ForecastChart";
import { MarginTrendChart } from "./MarginTrendChart";
import { TransactionCountChart } from "./TransactionCountChart";
import { CumulativeChart } from "./CumulativeChart";
import { PieChart } from "./PieChart";

export function ExportPdfButton() {
  const { transactions } = useLedger();
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
    categoryBreakdown,
    incomeCountTrend,
    expenseCountTrend,
    marginTrendData,
    netForecast,
  } = useSummaryData();

  const [exporting, setExporting] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const netRef = useRef<HTMLDivElement>(null);
  const marginRef = useRef<HTMLDivElement>(null);
  const cumulativeRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      // The hidden chart instances below are always mounted, but give them
      // two paint cycles to settle before rasterizing (React commit -> layout
      // -> paint isn't guaranteed to be done after just one rAF).
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      const svgOf = (container: HTMLDivElement | null) => container?.querySelector("svg") ?? null;
      const charts = [
        svgOf(comparisonRef.current) && { title: "Income vs expenses", svg: svgOf(comparisonRef.current)! },
        svgOf(netRef.current) && { title: "Net per period (with forecast)", svg: svgOf(netRef.current)! },
        svgOf(marginRef.current) && { title: "Net margin trend", svg: svgOf(marginRef.current)! },
        svgOf(cumulativeRef.current) && { title: "Cumulative net", svg: svgOf(cumulativeRef.current)! },
        svgOf(countRef.current) && { title: "Transaction count per period", svg: svgOf(countRef.current)! },
        svgOf(pieRef.current) && { title: "Where expenses went", svg: svgOf(pieRef.current)! },
        svgOf(categoryRef.current) && { title: "Expenses by category", svg: svgOf(categoryRef.current)! },
      ].filter((c): c is NonNullable<typeof c> => c !== null);

      await exportSummaryPdf({
        transactions,
        range: effectiveRange,
        totals: { income: totalIncome, expense: totalExpense, expenseTransactionCount, net, netMargin },
        charts,
        expenseBreakdown,
        categoryBreakdown,
      });
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Something went wrong generating the PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        aria-label="Export summary as PDF"
        title="Export summary as PDF"
        className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm disabled:opacity-50"
      >
        {exporting ? (
          <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          "📤"
        )}
      </button>

      {/* Off-screen chart instances captured for the PDF. Always mounted so
          export works regardless of which tab is currently visible. */}
      <div className="fixed -left-[9999px] top-0 w-[640px] flex flex-col gap-4" aria-hidden="true">
        <div ref={comparisonRef} className="bg-slate-800 p-4">
          <ComparisonTrendChart income={incomeTrend} expense={expenseTrend} />
        </div>
        <div ref={netRef} className="bg-slate-800 p-4">
          <ForecastChart actual={netTrend} forecast={netForecast} />
        </div>
        <div ref={marginRef} className="bg-slate-800 p-4">
          <MarginTrendChart points={marginTrendData} />
        </div>
        <div ref={cumulativeRef} className="bg-slate-800 p-4">
          <CumulativeChart points={cumulativeNet} />
        </div>
        <div ref={countRef} className="bg-slate-800 p-4">
          <TransactionCountChart income={incomeCountTrend} expense={expenseCountTrend} />
        </div>
        <div ref={pieRef} className="bg-slate-800 p-4">
          <PieChart items={expenseBreakdown} />
        </div>
        <div ref={categoryRef} className="bg-slate-800 p-4">
          <PieChart items={categoryBreakdown} />
        </div>
      </div>
    </>
  );
}
