import type { TrendPoint } from "../utils/trend";
import { formatCurrency } from "../utils/format";

export function NetTrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) return null;

  const maxAbs = Math.max(1, ...points.map((p) => Math.abs(p.value)));
  const halfHeight = 50;
  const chartHeight = halfHeight * 2;
  const slot = Math.max(18, Math.min(40, 480 / points.length));
  const width = Math.max(points.length * slot, 260);
  const barWidth = Math.min(slot - 6, 24);
  const labelEvery = points.length > 12 ? Math.ceil(points.length / 8) : 1;

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <svg width={width} height={chartHeight + 18} role="img" aria-label="Net per period">
        <line x1={0} y1={halfHeight} x2={width} y2={halfHeight} stroke="#334155" strokeWidth={1} />
        {points.map((p, i) => {
          const h = (Math.abs(p.value) / maxAbs) * (halfHeight - 4);
          const x = i * slot + (slot - barWidth) / 2;
          const positive = p.value >= 0;
          const y = positive ? halfHeight - h : halfHeight;
          return (
            <g key={i}>
              <title>
                {p.label}: {p.value >= 0 ? "+" : "-"}
                {formatCurrency(Math.abs(p.value))}
              </title>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(h, p.value !== 0 ? 2 : 0)}
                rx={2}
                fill={positive ? "#34d399" : "#fb7185"}
                opacity={p.value === 0 ? 0.15 : 1}
              />
              {i % labelEvery === 0 && (
                <text x={x + barWidth / 2} y={chartHeight + 14} fontSize={9} textAnchor="middle" fill="#64748b">
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
