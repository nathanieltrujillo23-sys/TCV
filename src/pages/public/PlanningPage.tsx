import { useT } from "../../i18n/LanguageContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { ButtonLink, Container, PageHeader } from "../../components/site/SiteUI";
import { EducationNote } from "../../components/portal/EducationNote";

const PARTS = [
  { titleKey: "wbp.part1.title", bodyKey: "wbp.part1.body" },
  { titleKey: "wbp.part2.title", bodyKey: "wbp.part2.body" },
  { titleKey: "wbp.part3.title", bodyKey: "wbp.part3.body" },
  { titleKey: "wbp.part4.title", bodyKey: "wbp.part4.body" },
  { titleKey: "wbp.part5.title", bodyKey: "wbp.part5.body" },
] as const;

/** Public preview of the planning workbook; the workbook itself needs an account. */
export function PlanningPage() {
  const t = useT();
  useDocumentTitle("wbp.eyebrow");

  return (
    <Container>
      <PageHeader eyebrowKey="wbp.eyebrow" titleKey="wbp.title" leadKey="wbp.lead" />
      <ol className="bg-paper border border-line divide-y divide-line">
        {PARTS.map((p, i) => (
          <li key={p.titleKey} className="flex gap-4 px-5 py-4">
            <span className="font-mono text-sm text-accent w-7 shrink-0 pt-0.5">{String(i + 1).padStart(2, "0")}</span>
            <span className="flex flex-col gap-1">
              <span className="font-semibold text-ink">{t(p.titleKey)}</span>
              <span className="text-sm text-ink-soft">{t(p.bodyKey)}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-sm text-ink border-l-2 border-accent pl-3">{t("wbp.privacy")}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to="/signup">{t("wbp.cta")}</ButtonLink>
        <ButtonLink to="/signin" variant="secondary">{t("wbp.signIn")}</ButtonLink>
      </div>
      <div className="mt-10 mb-4">
        <EducationNote />
      </div>
    </Container>
  );
}
