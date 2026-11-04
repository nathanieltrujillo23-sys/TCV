import type { ReactNode } from "react";
import { useT } from "../i18n/LanguageContext";
import type { StringKey } from "../i18n/en";

/** Temporary page for routes whose real content arrives in a later phase. */
export function PlaceholderPage({
  titleKey,
  bodyKey = "common.placeholderBody",
  children,
}: {
  titleKey: StringKey;
  bodyKey?: StringKey;
  children?: ReactNode;
}) {
  const t = useT();
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-3">
      <h1 className="text-2xl font-semibold text-white">{t(titleKey)}</h1>
      <p className="text-slate-400 text-sm">{t(bodyKey)}</p>
      {children}
    </div>
  );
}
