import { useState } from "react";
import type { MarginPoint } from "../utils/margin";
import { ChartTooltip } from "./ChartTooltip";

export function MarginTrendChart({ points }: { points: MarginPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) return null;

  const values = points.map((p) => p.value).filter((v): v is number => v !== null);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);
  const chartHeight = 100;
  const width = Math.max(points.length * 20, 280);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  const toY = (v: number) => chartHeight - ((v - min) / range) * (chartHeight - 8) - 4;
  const zeroY = toY(0);

  const linePoints = points
    .map((p, i) => (p.value === null ? null : `${i * stepX},${toY(p.value)}`))
    .filter((s): s is string => s !== null)
    .join(" ");

  return (
    <div className="relative overflow-x-auto -mx-1 px-1">
      <svg width={width} height={chartHeight + 4} role="img" aria-label="Net margin trend">
        <line x1={0} y1={zeroY} x2={width} y2={zeroY} stroke="#334155" strokeWidth={1} strokeDasharray="3,3" />
        <polyline points={linePoints} fill="none" stroke="#34d399" strokeWidth={2} />
        {points.map(
          (p, i) =>
            p.value !== null && (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="cursor-default">
                <circle cx={i * stepX} cy={toY(p.value)} r={8} fill="transparent" />
                <circle cx={i * stepX} cy={toY(p.value)} r={hover === i ? 4 : 2} fill="#34d399" />
              </g>
            )
        )}
      </svg>
      {hover !== null && points[hover].value !== null && (
        <ChartTooltip x={hover * stepX} y={chartHeight / 2}>
          {points[hover].label}: {points[hover].value!.toFixed(0)}%
        </ChartTooltip>
      )}
    </div>
  );
}
