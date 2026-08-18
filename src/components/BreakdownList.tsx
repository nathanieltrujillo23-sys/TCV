import type { BreakdownItem } from "../utils/breakdown";
import { formatCurrency } from "../utils/format";

export function BreakdownList({
  items,
  color,
  onSelect,
}: {
  items: BreakdownItem[];
  color: "emerald" | "rose";
  onSelect?: (label: string) => void;
}) {
  if (items.length === 0) {
    return <p className="text-slate-500 text-xs">No data for this period.</p>;
  }

  const barColor = color === "emerald" ? "bg-emerald-500" : "bg-rose-500";
  const max = Math.max(...items.map((i) => i.value));

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        // "Other" is an aggregate of everything past the top N — not a real
        // single vendor, so there's nothing meaningful to drill into.
        const clickable = onSelect && item.label !== "Other";
        const content = (
          <>
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-slate-300 truncate">{item.label}</span>
              <span className="text-slate-400 shrink-0">
                {formatCurrency(item.value)} · {item.percent.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor}`}
                style={{ width: `${max === 0 ? 0 : (item.value / max) * 100}%` }}
              />
            </div>
          </>
        );

        return (
          <li key={item.label}>
            {clickable ? (
              <button
                type="button"
                onClick={() => onSelect(item.label)}
                className="flex flex-col gap-1 w-full text-left rounded-md -mx-1 px-1 py-0.5 hover:bg-slate-700/50 transition-colors"
              >
                {content}
              </button>
            ) : (
              <div className="flex flex-col gap-1">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
