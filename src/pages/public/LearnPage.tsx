import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { LESSONS } from "../../content/lessons";
import { ButtonLink, Container, PageHeader } from "../../components/site/SiteUI";

export function LearnPage() {
  const t = useT();
  useDocumentTitle("site.nav.learn");
  const samples = LESSONS.filter((l) => l.publicSample);

  return (
    <Container>
      <PageHeader titleKey="learn.title" leadKey="learn.lead" />
      <div className="grid gap-5 md:grid-cols-2">
        {samples.map((l) => (
          <article key={l.id} className="bg-card border border-line border-t-2 border-t-ink p-6 flex flex-col gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
              {t("learn.sample")} · {t("lesson.module", { number: String(l.number).padStart(2, "0") })}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-ink">{l.title}</h2>
            <p className="text-ink-soft leading-relaxed">{l.summary}</p>
            <Link to={`/learn/${l.id}`} className="mt-auto pt-3 self-start text-accent font-medium underline underline-offset-4 hover:text-accent-dark">
              {t("learn.read")}
            </Link>
          </article>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-3">
        <p className="text-ink-soft">{t("learn.more", { count: LESSONS.length })}</p>
        <div>
          <ButtonLink to="/signup">{t("learn.cta")}</ButtonLink>
        </div>
      </div>
    </Container>
  );
}
