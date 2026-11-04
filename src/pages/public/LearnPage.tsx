import { useT } from "../../i18n/LanguageContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { ButtonLink, Container, PageHeader } from "../../components/site/SiteUI";

const LESSONS = [
  { titleKey: "learn.lesson1.title", bodyKey: "learn.lesson1.body" },
  { titleKey: "learn.lesson2.title", bodyKey: "learn.lesson2.body" },
] as const;

export function LearnPage() {
  const t = useT();
  useDocumentTitle("site.nav.learn");

  return (
    <Container>
      <PageHeader titleKey="learn.title" leadKey="learn.lead" />
      <div className="grid gap-5 md:grid-cols-2">
        {LESSONS.map((l) => (
          <article key={l.titleKey} className="bg-card border border-line p-6 flex flex-col gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">{t("learn.sample")}</p>
            <h2 className="text-2xl font-semibold tracking-tight text-ink">{t(l.titleKey)}</h2>
            <p className="text-ink-soft leading-relaxed">{t(l.bodyKey)}</p>
            <p className="mt-auto pt-3 text-sm text-ink-soft border-t border-line">{t("learn.comingSoon")}</p>
          </article>
        ))}
      </div>
      <div className="mt-10">
        <ButtonLink to="/signup">{t("learn.cta")}</ButtonLink>
      </div>
    </Container>
  );
}
