// Small line icons with square corners, drawn in the current text color.
// They replace emoji so the ledger matches the rest of the app's sharp style.

const base = {
  width: 14,
  height: 14,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
  "aria-hidden": true,
};

export function CalendarIcon() {
  return (
    <svg {...base}>
      <path d="M2.5 3.5h11v10h-11z M2.5 6.5h11 M5.5 1.5v3 M10.5 1.5v3" />
    </svg>
  );
}

export function ExportIcon() {
  return (
    <svg {...base}>
      <path d="M8 10V2 M5 5l3-3 3 3 M3 9v5h10V9" />
    </svg>
  );
}

export function AttachmentIcon() {
  return (
    <svg {...base}>
      <path d="M10.5 4.5v6a2.5 2.5 0 0 1-5 0v-7a1.5 1.5 0 0 1 3 0v6.5" />
    </svg>
  );
}
