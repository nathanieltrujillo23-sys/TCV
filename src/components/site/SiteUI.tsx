import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import type { StringKey } from "../../i18n/en";

/** Text logo with a thin accent rule underneath. */
export function BrandMark() {
  const t = useT();
  return (
    <span className="inline-flex flex-col gap-1">
      <span className="font-display text-lg font-semibold tracking-tight text-ink leading-none">{t("brand.name")}</span>
      <span className="h-0.5 w-8 bg-accent" aria-hidden="true" />
    </span>
  );
}

export function Container({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return <div className={`mx-auto px-5 ${narrow ? "max-w-2xl" : "max-w-5xl"}`}>{children}</div>;
}

export function PageHeader({ eyebrowKey, titleKey, leadKey }: { eyebrowKey?: StringKey; titleKey: StringKey; leadKey?: StringKey }) {
  const t = useT();
  return (
    <header className="pt-14 pb-10 sm:pt-20 sm:pb-12">
      {eyebrowKey && <p className="text-accent text-sm font-medium tracking-wide mb-3">{t(eyebrowKey)}</p>}
      <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink leading-tight">{t(titleKey)}</h1>
      {leadKey && <p className="mt-5 text-lg text-ink-soft leading-relaxed max-w-2xl">{t(leadKey)}</p>}
    </header>
  );
}

export function SectionTitle({ titleKey }: { titleKey: StringKey }) {
  const t = useT();
  return <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink mb-6">{t(titleKey)}</h2>;
}

export function ButtonLink({ to, variant = "primary", children }: { to: string; variant?: "primary" | "secondary"; children: ReactNode }) {
  const base = "inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const style =
    variant === "primary"
      ? "bg-accent text-white hover:bg-accent-dark"
      : "border border-ink/20 text-ink hover:border-ink/50 bg-card";
  return (
    <Link to={to} className={`${base} ${style}`}>
      {children}
    </Link>
  );
}

export function InfoCard({ titleKey, bodyKey, children }: { titleKey: StringKey; bodyKey: StringKey; children?: ReactNode }) {
  const t = useT();
  return (
    <div className="bg-card border border-line p-6 flex flex-col gap-2">
      <h3 className="font-display text-xl font-semibold text-ink">{t(titleKey)}</h3>
      <p className="text-ink-soft leading-relaxed text-[15px]">{t(bodyKey)}</p>
      {children}
    </div>
  );
}
