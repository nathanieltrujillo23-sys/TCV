import { useT } from "../../i18n/LanguageContext";
import type { StringKey } from "../../i18n/en";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { LegalSection } from "./legalSections";
import { Container } from "../../components/site/SiteUI";

/** Disclosures, Privacy, and Terms. Marked as a draft until a professional has reviewed the text. */
export function LegalPage({ titleKey, introKey, sections }: { titleKey: StringKey; introKey?: StringKey; sections: LegalSection[] }) {
  const t = useT();
  useDocumentTitle(titleKey);

  return (
    <Container narrow>
      <div className="pt-12">
        <p className="inline-block bg-amber-100 text-amber-900 text-xs font-medium px-3 py-1.5 border border-amber-300">
          {t("legal.draft")}
        </p>
      </div>
      <header className="pt-6 pb-8">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">{t(titleKey)}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t("legal.updated")}</p>
        {introKey && <p className="mt-5 text-ink-soft leading-relaxed text-[17px]">{t(introKey)}</p>}
      </header>
      <div className="flex flex-col gap-8">
        {sections.map((s) => (
          <section key={s.titleKey}>
            <h2 className="text-xl font-semibold tracking-tight text-ink">{t(s.titleKey)}</h2>
            <p className="mt-2 text-ink-soft leading-relaxed">{t(s.bodyKey)}</p>
          </section>
        ))}
      </div>
    </Container>
  );
}
