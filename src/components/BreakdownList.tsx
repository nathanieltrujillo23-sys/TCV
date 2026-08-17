import type { BreakdownItem } from "../utils/breakdown";
import { formatCurrency } from "../utils/format";

export function BreakdownList({ items, color }: { items: BreakdownItem[]; color: "emerald" | "rose" }) {
  if (items.length === 0) {
    return <p className="text-slate-500 text-xs">No data for this period.</p>;
  }

  const barColor = color === "emerald" ? "bg-emerald-500" : "bg-rose-500";
  const max = Math.max(...items.map((i) => i.value));

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.label} className="flex flex-col gap-1">
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
        </li>
      ))}
    </ul>
  );
}
