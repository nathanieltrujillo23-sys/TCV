import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import type { StringKey } from "../../i18n/en";

/** Square "TCV" monogram beside the wordmark. `tone="dark"` is for the navy owner area. */
/**
 * The TCV mark: geometric initials over a cobalt rule. Same drawing as
 * public/favicon.svg. On the dark owner area the square turns cobalt and the
 * rule white, so it still stands out against navy.
 */
export function LogoMark({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={`shrink-0 ${className}`}>
      <rect width="32" height="32" fill={tone === "dark" ? "#1f4fd8" : "#0a1a33"} />
      <g fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="butt" strokeLinejoin="miter">
        <path d="M3.5 9.6h7.4M7.2 9.6v11.4" />
        <path d="M19 9.6h-5.6v10.3h5.6" />
        <path d="M21.2 8.8l3.6 12.2l3.6-12.2" />
      </g>
      <rect x="3.5" y="24" width="25" height="1.8" fill={tone === "dark" ? "#fff" : "#1f4fd8"} />
    </svg>
  );
}

export function BrandMark({ tone = "light", size = "md" }: { tone?: "light" | "dark"; size?: "md" | "lg" }) {
  const t = useT();
  const large = size === "lg";
  return (
    <span className={`inline-flex items-center ${large ? "gap-3.5" : "gap-2.5"}`}>
      <LogoMark tone={tone} className={large ? "h-12 w-12 sm:h-14 sm:w-14" : "h-7 w-7"} />
      <span
        className={`font-semibold tracking-tight leading-none ${large ? "text-2xl sm:text-[28px]" : "text-[15px]"} ${
          tone === "dark" ? "text-white" : "text-ink"
        }`}
      >
        {t("brand.name")}
      </span>
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
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-ink leading-tight">{t(titleKey)}</h1>
      {leadKey && <p className="mt-5 text-lg text-ink-soft leading-relaxed max-w-2xl">{t(leadKey)}</p>}
    </header>
  );
}

export function SectionTitle({ titleKey }: { titleKey: StringKey }) {
  const t = useT();
  return <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink mb-6">{t(titleKey)}</h2>;
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
    <div className="bg-card border border-line border-t-2 border-t-ink p-6 flex flex-col gap-2">
      <h3 className="text-lg font-semibold tracking-tight text-ink">{t(titleKey)}</h3>
      <p className="text-ink-soft leading-relaxed text-[15px]">{t(bodyKey)}</p>
      {children}
    </div>
  );
}
