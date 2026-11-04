import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { ButtonLink, Container, InfoCard, SectionTitle } from "../../components/site/SiteUI";

const OFFERS = [
  { titleKey: "home.offer1.title", bodyKey: "home.offer1.body" },
  { titleKey: "home.offer2.title", bodyKey: "home.offer2.body" },
  { titleKey: "home.offer3.title", bodyKey: "home.offer3.body" },
] as const;

const APPROACH = [
  { titleKey: "home.approach1.title", bodyKey: "home.approach1.body" },
  { titleKey: "home.approach2.title", bodyKey: "home.approach2.body" },
  { titleKey: "home.approach3.title", bodyKey: "home.approach3.body" },
] as const;

export function HomePage() {
  const t = useT();
  useDocumentTitle();

  return (
    <>
      <section className="border-b border-line">
        <Container>
          <div className="py-16 sm:py-28 max-w-3xl">
            <p className="text-accent text-sm font-medium tracking-wide mb-4">{t("home.eyebrow")}</p>
            <h1 className="font-display text-4xl sm:text-6xl font-semibold leading-[1.08] text-ink">{t("home.title")}</h1>
            <p className="mt-6 text-lg sm:text-xl text-ink-soft leading-relaxed max-w-2xl">{t("home.lead")}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to="/signup">{t("home.ctaPrimary")}</ButtonLink>
              <ButtonLink to="/services" variant="secondary">{t("home.ctaSecondary")}</ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionTitle titleKey="home.offer.title" />
          <div className="grid gap-5 md:grid-cols-3">
            {OFFERS.map((o) => (
              <InfoCard key={o.titleKey} titleKey={o.titleKey} bodyKey={o.bodyKey} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20 bg-card border-y border-line">
        <Container>
          <SectionTitle titleKey="home.approach.title" />
          <div className="grid gap-8 md:grid-cols-3">
            {APPROACH.map((a) => (
              <div key={a.titleKey} className="border-t-2 border-accent pt-4">
                <h3 className="font-display text-lg font-semibold text-ink">{t(a.titleKey)}</h3>
                <p className="mt-2 text-ink-soft leading-relaxed text-[15px]">{t(a.bodyKey)}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container narrow>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">{t("home.founder.title")}</h2>
          <p className="mt-4 text-ink-soft leading-relaxed text-lg">{t("home.founder.body")}</p>
          <Link to="/about" className="mt-5 inline-block text-accent font-medium hover:text-accent-dark underline underline-offset-4">
            {t("home.founder.link")}
          </Link>
        </Container>
      </section>

      <section>
        <Container>
          <div className="bg-ink text-white p-8 sm:p-12 flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1">
              <h2 className="font-display text-2xl font-semibold">{t("home.contact.title")}</h2>
              <p className="mt-2 text-white/75">{t("home.contact.body")}</p>
            </div>
            <Link to="/contact" className="self-start sm:self-auto bg-white text-ink px-5 py-2.5 text-sm font-medium hover:bg-paper">
              {t("home.contact.button")}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
