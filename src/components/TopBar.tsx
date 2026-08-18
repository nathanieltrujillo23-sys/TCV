import { useState } from "react";
import { useLedger } from "../state/LedgerContext";
import { Segmented } from "./Segmented";
import { ImportPanel } from "./ImportPanel";
import { ManageListsPanel } from "./ManageListsPanel";
import { AuditLogPanel } from "./AuditLogPanel";
import { AccountMenu } from "./AccountMenu";
import { DateRangePicker } from "./DateRangePicker";
import { ExportPdfButton } from "./ExportPdfButton";
import { SearchPanel } from "./SearchPanel";
import { rangeLabel } from "../utils/period";
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
        onClick={() => setViewMode("taxes")}
        className={tab(viewMode === "taxes")}
      >
        Taxes
      </button>
      <button
        type="button"
        onClick={() => setViewMode("summary")}
        className={tab(viewMode === "summary")}
      >
        Summary
      </button>
      <ExportPdfButton />
    </div>
  );
}

function PeriodControls() {
  const { period, setPeriod, shiftPeriod, customRange, setCustomRange } = useLedger();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (customRange) {
    return (
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="px-3 py-1.5 text-sm font-medium rounded-md bg-slate-100 text-slate-900"
        >
          {rangeLabel(customRange)}
        </button>
        <button
          type="button"
          onClick={() => setCustomRange(null)}
          aria-label="Clear custom range"
          className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm"
        >
          ✕
        </button>
        {pickerOpen && (
          <DateRangePicker
            initial={customRange}
            onApply={(range) => {
              setCustomRange(range);
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
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
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        aria-label="Custom date range"
        title="Custom date range"
        className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm"
      >
        📅
      </button>
      {pickerOpen && (
        <DateRangePicker
          onApply={(range) => {
            setCustomRange(range);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

export function TopBar() {
  const { effectiveLabel } = useLedger();

  return (
    <header className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
      <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col items-center gap-3 text-center">
        <div>
          <h1 className="text-white font-semibold text-lg leading-tight">TRUCAPITALVENTURES</h1>
          <p className="text-slate-400 text-xs">{effectiveLabel}</p>
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <PeriodControls />
          <ViewModeToggle />
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <SearchPanel />
          <ImportPanel />
          <ManageListsPanel />
          <AuditLogPanel />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
