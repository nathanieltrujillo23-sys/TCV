import { useState } from "react";
import type { BreakdownItem } from "../utils/breakdown";
import { formatCurrency } from "../utils/format";

export const SLICE_COLORS = ["#34d399", "#fb7185", "#38bdf8", "#fbbf24", "#a78bfa", "#f472b6", "#2dd4bf", "#f97316"];

export function PieChart({ items }: { items: BreakdownItem[] }) {
  const [hover, setHover] = useState<number | null>(null);

  if (items.length === 0) {
    return <p className="text-slate-500 text-xs">No data for this period.</p>;
  }

  const size = 160;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;
  const segments = items.map((item) => {
    const dash = (item.percent / 100) * circumference;
    const seg = { dasharray: `${dash} ${circumference - dash}`, dashoffset: -cumulative };
    cumulative += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Expense distribution">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={SLICE_COLORS[i % SLICE_COLORS.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={seg.dasharray}
              strokeDashoffset={seg.dashoffset}
              opacity={hover === null || hover === i ? 1 : 0.4}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="cursor-default"
            />
          ))}
        </g>
        <text
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          fontSize={13}
          fontWeight={600}
          fill="#e2e8f0"
        >
          {hover === null ? "" : `${items[hover].percent.toFixed(0)}%`}
        </text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fontSize={9} fill="#64748b">
          {hover === null ? "" : formatCurrency(items[hover].value)}
        </text>
      </svg>
      <ul className="flex flex-col gap-1.5 text-xs min-w-0 flex-1">
        {items.map((item, i) => (
          <li
            key={item.label}
            className="flex items-center gap-2 min-w-0 cursor-default"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ opacity: hover === null || hover === i ? 1 : 0.5 }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
            />
            <span className="text-slate-300 truncate">{item.label}</span>
            <span className="text-slate-500 ml-auto shrink-0">
              {formatCurrency(item.value)} · {item.percent.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
