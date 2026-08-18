import { useLedger } from "../state/LedgerContext";
import { periodLabel } from "../utils/period";
import { Segmented } from "./Segmented";
import { ImportPanel } from "./ImportPanel";
import { ManageListsPanel } from "./ManageListsPanel";
import { AuditLogPanel } from "./AuditLogPanel";
import { AccountMenu } from "./AccountMenu";
import type { Period } from "../types";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
];

function ViewModeToggle() {
  const { primaryView, setPrimaryView, viewMode, setViewMode } = useLedger();

  const tab = (active: boolean) =>
    `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
      active ? "bg-slate-100 text-slate-900" : "text-slate-300 hover:text-white hover:bg-slate-700"
    }`;

  return (
    <div className="inline-flex rounded-lg bg-slate-800 p-1 gap-1">
      <button
        type="button"
        onClick={() => {
          setPrimaryView("income");
          setViewMode("entry");
        }}
        className={tab(viewMode === "entry" && primaryView === "income")}
      >
        Income
      </button>
      <button
        type="button"
        onClick={() => {
          setPrimaryView("expense");
          setViewMode("entry");
        }}
        className={tab(viewMode === "entry" && primaryView === "expense")}
      >
        Expense
      </button>
      <button
        type="button"
        onClick={() => setViewMode("summary")}
        className={tab(viewMode === "summary")}
      >
        Summary
      </button>
    </div>
  );
}

export function TopBar() {
  const { period, setPeriod, periodReference, shiftPeriod } = useLedger();

  return (
    <header className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
      <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-white font-semibold text-lg leading-tight">TRUCAPITALVENTURES</h1>
            <p className="text-slate-400 text-xs">{periodLabel(period, periodReference)}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftPeriod(-1)}
                aria-label={`Previous ${period}`}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm"
              >
                ‹
              </button>
              <Segmented options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
              <button
                type="button"
                onClick={() => shiftPeriod(1)}
                aria-label={`Next ${period}`}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm"
              >
                ›
              </button>
            </div>
            <ViewModeToggle />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ImportPanel />
          <ManageListsPanel />
          <AuditLogPanel />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
