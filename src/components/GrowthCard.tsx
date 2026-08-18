import { useMemo } from "react";
import { useLedger } from "../state/LedgerContext";
import { monthlyPnl } from "../utils/pnl";

function growthPct(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null; // null = "new" (no prior baseline to compare against)
  return ((curr - prev) / Math.abs(prev)) * 100;
}

function GrowthTile({ label, value, invert = false }: { label: string; value: number | null; invert?: boolean }) {
  const positive = value !== null && value >= 0;
  const good = invert ? !positive : positive;
  const color = value === null ? "text-slate-400" : good ? "text-emerald-400" : "text-rose-400";
  const arrow = value === null ? "" : positive ? "▲ " : "▼ ";

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5">
      <p className="text-slate-500 text-[11px] uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-semibold mt-0.5 ${color}`}>{value === null ? "New" : `${arrow}${Math.abs(value).toFixed(0)}%`}</p>
    </div>
  );
}

export function GrowthCard() {
  const { transactions } = useLedger();
  const rows = useMemo(() => monthlyPnl(transactions), [transactions]);

  if (rows.length < 2) {
    return (
      <div className="rounded-2xl bg-slate-800 p-4">
        <h2 className="text-slate-200 font-semibold text-sm mb-2">Month-over-month growth</h2>
        <p className="text-slate-500 text-xs">Need at least two months of activity to compare.</p>
      </div>
    );
  }

  const curr = rows[rows.length - 1];
  const prev = rows[rows.length - 2];

  return (
    <div className="rounded-2xl bg-slate-800 p-4">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h2 className="text-slate-200 font-semibold text-sm">Month-over-month growth</h2>
        <span className="text-slate-500 text-xs truncate">
          {prev.label} → {curr.label}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <GrowthTile label="Income" value={growthPct(curr.income, prev.income)} />
        <GrowthTile label="Expenses" value={growthPct(curr.expense, prev.expense)} invert />
        <GrowthTile label="Net" value={growthPct(curr.net, prev.net)} />
      </div>
    </div>
  );
}
