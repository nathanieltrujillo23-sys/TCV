import { useState } from "react";
import { Modal } from "./Modal";
import type { DateRange } from "../utils/period";

function toInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function DateRangePicker({
  initial,
  onApply,
  onClose,
}: {
  initial?: DateRange | null;
  onApply: (range: DateRange) => void;
  onClose: () => void;
}) {
  const [start, setStart] = useState(
    initial ? toInputValue(initial.start) : toInputValue(new Date(Date.now() - 29 * 86_400_000))
  );
  const [end, setEnd] = useState(
    initial ? toInputValue(new Date(initial.end.getTime() - 1)) : toInputValue(new Date())
  );

  function apply() {
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    endDate.setDate(endDate.getDate() + 1); // exclusive end, inclusive of the selected end day
    if (startDate >= endDate) return;
    onApply({ start: startDate, end: endDate });
  }

  return (
    <Modal title="Custom date range" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Start date</span>
          <input
            type="date"
            value={start}
            max={end}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">End date</span>
          <input
            type="date"
            value={end}
            min={start}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
          />
        </label>
        <button
          type="button"
          onClick={apply}
          className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2 text-sm"
        >
          Apply range
        </button>
      </div>
    </Modal>
  );
}
