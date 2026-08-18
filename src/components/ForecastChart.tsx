import { useState } from "react";
import type { TrendPoint } from "../utils/trend";
import { formatCurrency } from "../utils/format";
import { ChartTooltip } from "./ChartTooltip";

export function ForecastChart({ actual, forecast }: { actual: TrendPoint[]; forecast: TrendPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  if (actual.length === 0) return null;

  const all = [...actual, ...forecast];
  const forecastStart = actual.length;
  const maxAbs = Math.max(1, ...all.map((p) => Math.abs(p.value)));
  const halfHeight = 50;
  const chartHeight = halfHeight * 2;
  const slot = Math.max(18, Math.min(40, 480 / all.length));
  const width = Math.max(all.length * slot, 260);
  const barWidth = Math.min(slot - 6, 24);
  const labelEvery = all.length > 12 ? Math.ceil(all.length / 8) : 1;

  return (
    <div className="relative overflow-x-auto -mx-1 px-1">
      <svg width={width} height={chartHeight + 18} role="img" aria-label="Net per period with forecast">
        <line x1={0} y1={halfHeight} x2={width} y2={halfHeight} stroke="#334155" strokeWidth={1} />
        {forecast.length > 0 && (
          <line
            x1={forecastStart * slot}
            y1={0}
            x2={forecastStart * slot}
            y2={chartHeight}
            stroke="#475569"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        )}
        {all.map((p, i) => {
          const isForecast = i >= forecastStart;
          const h = (Math.abs(p.value) / maxAbs) * (halfHeight - 4);
          const x = i * slot + (slot - barWidth) / 2;
          const positive = p.value >= 0;
          const y = positive ? halfHeight - h : halfHeight;
          const color = positive ? "#34d399" : "#fb7185";
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
                height={Math.max(h, p.value !== 0 ? 2 : 0)}
                rx={2}
                fill={color}
                opacity={p.value === 0 ? 0.15 : isForecast ? 0.35 : hover === null || hover === i ? 1 : 0.5}
                stroke={isForecast ? color : "none"}
                strokeWidth={isForecast ? 1.5 : 0}
                strokeDasharray={isForecast ? "3,2" : undefined}
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
      {hover !== null && (
        <ChartTooltip x={hover * slot + (slot - barWidth) / 2} y={halfHeight}>
          {all[hover].label}
          {hover >= forecastStart ? " (forecast)" : ""}: {all[hover].value >= 0 ? "+" : "-"}
          {formatCurrency(Math.abs(all[hover].value))}
        </ChartTooltip>
      )}
    </div>
  );
}
