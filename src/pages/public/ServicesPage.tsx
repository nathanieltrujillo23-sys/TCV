import { useT } from "../../i18n/LanguageContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { ButtonLink, Container, InfoCard, PageHeader } from "../../components/site/SiteUI";

const SERVICES = [
  { titleKey: "services.course.title", bodyKey: "services.course.body" },
  { titleKey: "services.frameworks.title", bodyKey: "services.frameworks.body" },
  { titleKey: "services.tools.title", bodyKey: "services.tools.body" },
] as const;

export function ServicesPage() {
  const t = useT();
  useDocumentTitle("site.nav.services");

  return (
    <Container>
      <PageHeader titleKey="services.title" leadKey="services.lead" />
      <div className="grid gap-5 md:grid-cols-3">
        {SERVICES.map((s) => (
          <InfoCard key={s.titleKey} titleKey={s.titleKey} bodyKey={s.bodyKey} />
        ))}
      </div>
      <p className="mt-6 text-sm text-ink-soft">{t("services.note")}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink to="/signup">{t("services.ctaPrimary")}</ButtonLink>
        <ButtonLink to="/contact" variant="secondary">{t("services.ctaSecondary")}</ButtonLink>
      </div>
    </Container>
  );
}
