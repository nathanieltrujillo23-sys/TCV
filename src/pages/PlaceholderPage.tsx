import type { ReactNode } from "react";
import { useT } from "../i18n/LanguageContext";
import type { StringKey } from "../i18n/en";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

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
  useDocumentTitle(titleKey);
  return (
    <div className="max-w-5xl mx-auto px-5 py-10 flex flex-col gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">{t(titleKey)}</h1>
      <p className="text-sm opacity-70">{t(bodyKey)}</p>
      {children}
    </div>
  );
}
