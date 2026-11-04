import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { en, type StringKey } from "./en";
import { translate } from "./translate";

// English only at launch. To add Spanish: create es.ts typed as
// Record<StringKey, string>, add "es" here, and store the choice per user.
export type Lang = "en";

const DICTIONARIES: Record<Lang, Record<StringKey, string>> = { en };

export type Translate = (key: StringKey, vars?: Record<string, string | number>) => string;

interface LanguageContextValue {
  lang: Lang;
  t: Translate;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang: Lang = "en";
  const t = useCallback<Translate>((key, vars) => translate(DICTIONARIES[lang], key, vars), [lang]);
  const value = useMemo(() => ({ lang, t }), [lang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within a LanguageProvider");
  return ctx;
}

/** Shorthand for components that only need to translate. */
export function useT(): Translate {
  return useLang().t;
}
