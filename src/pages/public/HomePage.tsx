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
      <section className="relative border-b border-line overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 hidden lg:block w-[42%] [background-image:linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_left,black,transparent)]"
        />
        <div aria-hidden="true" className="absolute right-[12%] top-1/2 -translate-y-1/2 hidden lg:block h-40 w-40 border border-ink/80">
          <div className="absolute -right-8 -bottom-8 h-40 w-40 bg-accent/90" />
        </div>
        <Container>
          <div className="relative py-16 sm:py-28 max-w-3xl">
            <p className="text-accent font-mono text-xs uppercase tracking-[0.18em] mb-5">{t("home.eyebrow")}</p>
            <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] text-ink">{t("home.title")}</h1>
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

      <section className="py-16 sm:py-20 bg-surface border-y border-line">
        <Container>
          <SectionTitle titleKey="home.approach.title" />
          <div className="grid gap-8 md:grid-cols-3">
            {APPROACH.map((a) => (
              <div key={a.titleKey} className="border-t-2 border-accent pt-4">
                <h3 className="text-base font-semibold text-ink">{t(a.titleKey)}</h3>
                <p className="mt-2 text-ink-soft leading-relaxed text-[15px]">{t(a.bodyKey)}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container narrow>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">{t("home.founder.title")}</h2>
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
              <h2 className="text-2xl font-semibold tracking-tight">{t("home.contact.title")}</h2>
              <p className="mt-2 text-white/75">{t("home.contact.body")}</p>
            </div>
            <Link to="/contact" className="self-start sm:self-auto bg-white text-ink px-5 py-2.5 text-sm font-medium hover:bg-surface">
              {t("home.contact.button")}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
