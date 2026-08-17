import type { TrendPoint } from "../utils/trend";
import { formatCurrency } from "../utils/format";

export function ComparisonTrendChart({ income, expense }: { income: TrendPoint[]; expense: TrendPoint[] }) {
  if (income.length === 0) return null;

  const max = Math.max(1, ...income.map((p) => p.value), ...expense.map((p) => p.value));
  const chartHeight = 100;
  const slot = Math.max(24, Math.min(48, 560 / income.length));
  const width = Math.max(income.length * slot, 280);
  const groupWidth = Math.min(slot - 6, 28);
  const barWidth = groupWidth / 2 - 1;
  const labelEvery = income.length > 10 ? Math.ceil(income.length / 8) : 1;

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <svg width={width} height={chartHeight + 18} role="img" aria-label="Income vs expense trend">
        {income.map((p, i) => {
          const ev = expense[i]?.value ?? 0;
          const incH = (p.value / max) * (chartHeight - 4);
          const expH = (ev / max) * (chartHeight - 4);
          const gx = i * slot + (slot - groupWidth) / 2;
          return (
            <g key={i}>
              <title>
                {p.label}: +{formatCurrency(p.value)} / -{formatCurrency(ev)}
              </title>
              <rect
                x={gx}
                y={chartHeight - incH}
                width={barWidth}
                height={Math.max(incH, p.value > 0 ? 2 : 0)}
                rx={2}
                fill="#34d399"
                opacity={p.value === 0 ? 0.15 : 1}
              />
              <rect
                x={gx + barWidth + 2}
                y={chartHeight - expH}
                width={barWidth}
                height={Math.max(expH, ev > 0 ? 2 : 0)}
                rx={2}
                fill="#fb7185"
                opacity={ev === 0 ? 0.15 : 1}
              />
              {i % labelEvery === 0 && (
                <text x={gx + groupWidth / 2} y={chartHeight + 14} fontSize={9} textAnchor="middle" fill="#64748b">
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
