export function DateInput({
  label = "Date",
  value,
  onChange,
  compact = false,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-400">
      {label}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-slate-500 ${
          compact ? "px-2 py-1.5 text-sm" : "px-3 py-2 text-base"
        }`}
      />
    </label>
  );
}
