import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import type { StringKey } from "../../i18n/en";
import { formatMoney } from "../../lib/money";

// Building blocks for the dark owner/workspace area: square, navy, mono figures.

export function Page({ titleKey, leadKey, actions, children }: { titleKey: StringKey; leadKey?: StringKey; actions?: ReactNode; children: ReactNode }) {
  const t = useT();
  return (
    <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{t(titleKey)}</h1>
          {leadKey && <p className="mt-1 text-sm text-slate-400 max-w-2xl">{t(leadKey)}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`bg-slate-900 border border-slate-800 ${className}`}>
      {title && <h2 className="px-4 py-3 border-b border-slate-800 text-xs font-mono uppercase tracking-[0.14em] text-slate-400">{title}</h2>}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Field({ label, help, children, className = "", group = false }: { label: string; help?: string; children: ReactNode; className?: string; group?: boolean }) {
  const classes = `flex flex-col gap-1.5 text-xs font-medium text-slate-300 ${className}`;
  const helpText = help && <span className="text-[11px] font-normal text-slate-500">{help}</span>;
  // A <label> may only name one control, so a row of buttons (Toggle) is a named group instead.
  if (group) {
    return (
      <div role="group" aria-label={label} className={classes}>
        <span aria-hidden="true">{label}</span>
        {children}
        {helpText}
      </div>
    );
  }
  return (
    <label className={classes}>
      {label}
      {children}
      {helpText}
    </label>
  );
}

/** Two or more mutually exclusive options as square buttons. */
export function Toggle<T extends string>({ value, options, onChange }: { value: T | null; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 border px-3 py-2 text-sm font-medium -ml-px first:ml-0 ${
            value === o.value ? "border-accent bg-accent text-white relative" : "border-slate-700 bg-slate-950 text-slate-300 hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A dollar figure in mono, green when positive and red when negative. */
export function Money({ value, className = "" }: { value: number | null; className?: string }) {
  if (value === null) return <span className={`font-mono text-slate-500 ${className}`}>—</span>;
  const color = value > 0 ? "text-emerald-400" : value < 0 ? "text-rose-400" : "text-slate-300";
  return <span className={`font-mono ${color} ${className}`}>{formatMoney(value)}</span>;
}

export function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 px-4 py-3">
      <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <div className="mt-1 text-lg font-semibold text-white">{children}</div>
    </div>
  );
}

const JOURNAL_TABS: { to: string; key: StringKey; end?: boolean }[] = [
  { to: "/app/journal", key: "j.nav.trades", end: true },
  { to: "/app/journal/stats", key: "j.nav.stats" },
  { to: "/app/journal/rules", key: "j.nav.rules" },
  { to: "/app/journal/import", key: "j.nav.import" },
];

export function JournalTabs() {
  const t = useT();
  return (
    <nav className="flex border-b border-slate-800 -mt-2 overflow-x-auto">
      {JOURNAL_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `shrink-0 px-4 py-2.5 text-sm border-b-2 -mb-px ${isActive ? "border-accent text-white" : "border-transparent text-slate-400 hover:text-white"}`
          }
        >
          {t(tab.key)}
        </NavLink>
      ))}
    </nav>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-rose-400" role="alert">
      {children}
    </p>
  );
}
