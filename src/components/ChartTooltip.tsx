import type { ReactNode } from "react";

// Floating label positioned in the same pixel coordinate space as the SVG
// chart it overlays (these charts don't scale their viewBox, so SVG user
// units already equal CSS pixels — x/y can be used directly).
export function ChartTooltip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white whitespace-nowrap shadow-lg"
      style={{ left: x, top: y - 6 }}
    >
      {children}
    </div>
  );
}
