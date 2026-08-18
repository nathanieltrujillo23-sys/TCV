import { useState } from "react";
import type { TrendPoint } from "../utils/trend";
import { formatCurrency } from "../utils/format";
import { ChartTooltip } from "./ChartTooltip";

export function CumulativeChart({ points }: { points: TrendPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) return null;

  const values = points.map((p) => p.value);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);
  const chartHeight = 100;
  const width = Math.max(points.length * 20, 280);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  const toY = (v: number) => chartHeight - ((v - min) / range) * (chartHeight - 8) - 4;
  const zeroY = toY(0);

  const linePoints = points.map((p, i) => `${i * stepX},${toY(p.value)}`).join(" ");
  const areaPoints = `0,${zeroY} ${linePoints} ${width},${zeroY}`;

  const endsPositive = values[values.length - 1] >= 0;
  const color = endsPositive ? "#34d399" : "#fb7185";

  return (
    <div className="relative overflow-x-auto -mx-1 px-1">
      <svg width={width} height={chartHeight + 4} role="img" aria-label="Cumulative net">
        <line x1={0} y1={zeroY} x2={width} y2={zeroY} stroke="#334155" strokeWidth={1} strokeDasharray="3,3" />
        <polygon points={areaPoints} fill={color} opacity={0.12} />
        <polyline points={linePoints} fill="none" stroke={color} strokeWidth={2} />
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="cursor-default">
            <circle cx={i * stepX} cy={toY(p.value)} r={8} fill="transparent" />
            <circle cx={i * stepX} cy={toY(p.value)} r={hover === i ? 4 : 2} fill={color} />
          </g>
        ))}
      </svg>
      {hover !== null && (
        <ChartTooltip x={hover * stepX} y={toY(points[hover].value)}>
          {points[hover].label}: {formatCurrency(points[hover].value)}
        </ChartTooltip>
      )}
    </div>
  );
}
