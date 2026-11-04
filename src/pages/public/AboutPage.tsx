import { useT } from "../../i18n/LanguageContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Container, PageHeader } from "../../components/site/SiteUI";

const BACKGROUND = ["about.background.uf", "about.background.dailyBread", "about.background.sie"] as const;

const VALUES = [
  { titleKey: "about.value1.title", bodyKey: "about.value1.body" },
  { titleKey: "about.value2.title", bodyKey: "about.value2.body" },
  { titleKey: "about.value3.title", bodyKey: "about.value3.body" },
] as const;

export function AboutPage() {
  const t = useT();
  useDocumentTitle("site.nav.about");

  return (
    <Container narrow>
      <PageHeader titleKey="about.title" leadKey="about.lead" />

      <section className="py-6">
        <h2 className="font-display text-2xl font-semibold text-ink">{t("about.story.title")}</h2>
        <p className="mt-4 text-ink-soft leading-relaxed text-[17px]">{t("about.story.body")}</p>
      </section>

      <section className="py-10 border-t border-line mt-6">
        <h2 className="font-display text-2xl font-semibold text-ink">{t("about.founder.title")}</h2>
        <p className="mt-1 text-accent font-medium">{t("about.founder.name")}</p>
        <p className="mt-4 text-ink-soft leading-relaxed text-[17px]">{t("about.founder.p1")}</p>
        <p className="mt-4 text-ink-soft leading-relaxed text-[17px]">{t("about.founder.p2")}</p>

        <h3 className="mt-8 text-sm font-medium text-ink uppercase tracking-wider">{t("about.background.title")}</h3>
        <ul className="mt-3 flex flex-col gap-2 text-ink-soft text-[15px]">
          {BACKGROUND.map((key) => (
            <li key={key} className="flex gap-3">
              <span className="mt-2.5 h-px w-3 bg-accent shrink-0" aria-hidden="true" />
              {t(key)}
            </li>
          ))}
        </ul>
      </section>

      <section className="py-10 border-t border-line">
        <h2 className="font-display text-2xl font-semibold text-ink">{t("about.values.title")}</h2>
        <div className="mt-6 flex flex-col gap-6">
          {VALUES.map((v) => (
            <div key={v.titleKey}>
              <h3 className="font-display text-lg font-semibold text-ink">{t(v.titleKey)}</h3>
              <p className="mt-1 text-ink-soft leading-relaxed">{t(v.bodyKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
}
