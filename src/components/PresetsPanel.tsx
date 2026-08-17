import { useState } from "react";
import { useLedger } from "../state/LedgerContext";
import { formatCurrency } from "../utils/format";
import { dateInputToISO, todayInputValue } from "../utils/date";
import { DateInput } from "./DateInput";
import type { Preset } from "../types";

function presetSubtitle(p: Preset): string {
  if (p.type === "expense") {
    const purchases = p.defaultPurchases ?? 1;
    return (
      [p.vendor, p.accountMethod, purchases > 1 ? `${purchases} purchases` : null].filter(Boolean).join(" · ") || "—"
    );
  }
  const accounts = p.defaultAccounts ?? 1;
  return `${accounts} account${accounts === 1 ? "" : "s"}`;
}

function presetAmount(p: Preset): number {
  return p.type === "expense"
    ? (p.defaultPrice ?? 0) * (p.defaultPurchases ?? 1)
    : (p.defaultAmount ?? 0) * (p.defaultAccounts ?? 1);
}

export function PresetsPanel({ type }: { type: "income" | "expense" }) {
  const { presets, logPreset, deletePreset } = useLedger();
  const [date, setDate] = useState(todayInputValue());
  const filtered = presets.filter((p) => p.type === type);

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-800 p-4">
        <h2 className="text-slate-200 font-semibold text-sm mb-1">Quick log</h2>
        <p className="text-slate-500 text-xs">
          No presets yet. Log an entry above and tap "Save as preset" to add one here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-800 p-4">
      <div className="flex items-end justify-between gap-3 mb-2">
        <h2 className="text-slate-200 font-semibold text-sm">Quick log</h2>
        <DateInput value={date} onChange={setDate} compact />
      </div>
      <ul className="flex flex-col divide-y divide-slate-700">
        {filtered.map((p) => (
          <li key={p.id} className="flex items-center justify-between py-2 gap-2">
            <div className="min-w-0">
              <p className="text-slate-100 text-sm font-medium truncate">{p.label}</p>
              <p className="text-slate-500 text-xs truncate">
                {presetSubtitle(p)} · {formatCurrency(presetAmount(p))}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => logPreset(p.id, -1)}
                aria-label={`Remove last ${p.label} entry`}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700 text-sm"
              >
                ˅
              </button>
              <button
                type="button"
                onClick={() => logPreset(p.id, 1, dateInputToISO(date))}
                aria-label={`Log ${p.label}`}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700 text-sm"
              >
                ˄
              </button>
              <button
                type="button"
                onClick={() => deletePreset(p.id)}
                aria-label={`Delete preset ${p.label}`}
                className="w-8 h-8 flex items-center justify-center rounded-md text-slate-600 hover:text-rose-400 text-xs"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
