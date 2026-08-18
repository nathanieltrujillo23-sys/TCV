import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Floating label anchored to the left of a chart bar/point at (x, y) in the
// same pixel coordinate space as the SVG it overlays (these charts don't
// scale their viewBox, so SVG user units already equal CSS pixels). Anchored
// left-of-bar rather than above it so it never clips against the chart's
// top edge regardless of how tall or short the hovered bar is. Flips to the
// right when there isn't enough room on the left (e.g. the first bar).
export function ChartTooltip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<"left" | "right">("left");

  useLayoutEffect(() => {
    const width = ref.current?.offsetWidth ?? 0;
    setSide(x - width - 8 < 0 ? "right" : "left");
  }, [x, y]);

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute z-10 -translate-y-1/2 rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white whitespace-nowrap shadow-lg ${
        side === "left" ? "-translate-x-full" : ""
      }`}
      style={{ left: side === "left" ? x - 8 : x + 8, top: y }}
    >
      {children}
    </div>
  );
}
