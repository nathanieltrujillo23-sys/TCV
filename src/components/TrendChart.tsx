import { useState } from "react";
import type { TrendPoint } from "../utils/trend";
import { formatCurrency } from "../utils/format";
import { ChartTooltip } from "./ChartTooltip";

export function TrendChart({ points, color }: { points: TrendPoint[]; color: "emerald" | "rose" }) {
  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) return null;

  const max = Math.max(1, ...points.map((p) => p.value));
  const barColor = color === "emerald" ? "#34d399" : "#fb7185";
  const chartHeight = 90;
  const slot = Math.max(18, Math.min(40, 480 / points.length));
  const width = Math.max(points.length * slot, 260);
  const barWidth = Math.min(slot - 6, 24);
  const labelEvery = points.length > 12 ? Math.ceil(points.length / 8) : 1;

  return (
    <div className="relative overflow-x-auto -mx-1 px-1">
      <svg width={width} height={chartHeight + 18} role="img" aria-label="Trend chart">
        {points.map((p, i) => {
          const barHeight = max === 0 ? 0 : (p.value / max) * (chartHeight - 4);
          const x = i * slot + (slot - barWidth) / 2;
          const y = chartHeight - barHeight;
          return (
            <g
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="cursor-default"
            >
              <rect x={x} y={0} width={barWidth} height={chartHeight} fill="transparent" />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, p.value > 0 ? 2 : 0)}
                rx={2}
                fill={barColor}
                opacity={p.value === 0 ? 0.15 : hover === null || hover === i ? 1 : 0.5}
              />
              {p.value === 0 && <rect x={x} y={chartHeight - 2} width={barWidth} height={2} rx={1} fill={barColor} opacity={0.15} />}
              {i % labelEvery === 0 && (
                <text x={x + barWidth / 2} y={chartHeight + 14} fontSize={9} textAnchor="middle" fill="#64748b">
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <ChartTooltip
          x={hover * slot + slot / 2}
          y={chartHeight - (max === 0 ? 0 : (points[hover].value / max) * (chartHeight - 4))}
        >
          {points[hover].label}: {formatCurrency(points[hover].value)}
        </ChartTooltip>
      )}
    </div>
  );
}
