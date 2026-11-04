import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { usePortalProgress } from "../../hooks/usePortalProgress";
import { LESSONS } from "../../content/lessons";
import { Container } from "../../components/site/SiteUI";
import { EducationNote } from "../../components/portal/EducationNote";

export function PortalHome() {
  const t = useT();
  useDocumentTitle("portal.home.title");
  const { progress, error } = usePortalProgress();

  // Until progress arrives, show "Loading" instead of a misleading 0 of 8.
  const loading = progress === null && !error;
  const done = LESSONS.filter((l) => progress?.has(l.id)).length;
  const next = LESSONS.find((l) => !progress?.has(l.id));

  return (
    <Container>
      <div className="py-10 flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">{t("portal.home.title")}</h1>
          <p className="text-ink-soft max-w-2xl">{t("portal.home.body")}</p>
        </header>

        {error && <p className="text-sm text-red-700" role="alert">{t("portal.loadError", { error })}</p>}

        <section className="bg-paper border border-line p-5 flex flex-col gap-3" aria-label={t("portal.progress.title")}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">{t("portal.progress.title")}</h2>
            <p className="font-mono text-xs text-ink-soft">
              {loading ? t("common.loading") : t("portal.progress.count", { done, total: LESSONS.length })}
            </p>
          </div>
          <div className="grid grid-cols-8 gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={LESSONS.length} aria-valuenow={loading ? undefined : done} aria-busy={loading}>
            {LESSONS.map((l) => (
              <span key={l.id} className={`h-2 ${progress?.has(l.id) ? "bg-accent" : "bg-line"}`} />
            ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          <section className="lg:col-span-2 bg-ink text-white p-6 flex flex-col gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/60">{t("portal.next.title")}</p>
            {loading ? (
              <p className="text-white/80">{t("common.loading")}</p>
            ) : next ? (
              <>
                <h2 className="text-2xl font-semibold tracking-tight">
                  <span className="font-mono text-white/60 mr-3">{String(next.number).padStart(2, "0")}</span>
                  {next.title}
                </h2>
                <p className="text-white/75">{next.summary}</p>
                <Link to={`/portal/lessons/${next.id}`} className="self-start mt-2 bg-white text-ink text-sm font-medium px-5 py-2.5 hover:bg-surface">
                  {t(done === 0 ? "portal.next.start" : "portal.next.continue")}
                </Link>
              </>
            ) : (
              <p className="text-white/80">{t("portal.next.done")}</p>
            )}
          </section>
          <section className="bg-paper border border-line border-t-2 border-t-accent p-6 flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-ink">{t("portal.tools.title")}</h2>
            <p className="text-sm text-ink-soft">{t("portal.tools.card")}</p>
            <Link to="/portal/tools" className="self-start mt-auto text-sm font-medium text-accent underline underline-offset-4 hover:text-accent-dark">
              {t("portal.tools.open")}
            </Link>
          </section>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink">{t("portal.modules.title")}</h2>
          <ol className="bg-paper border border-line divide-y divide-line">
            {LESSONS.map((l) => {
              const p = progress?.get(l.id);
              return (
                <li key={l.id}>
                  <Link to={`/portal/lessons/${l.id}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-surface">
                    <span className={`font-mono text-sm w-7 ${p ? "text-accent" : "text-ink-soft"}`}>{String(l.number).padStart(2, "0")}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-ink">{l.title}</span>
                      <span className="block text-xs text-ink-soft font-mono">{t("portal.modules.minutes", { minutes: l.minutes })}</span>
                    </span>
                    {p && (
                      <span className="text-[11px] font-mono uppercase tracking-wider text-accent border border-accent/40 px-2 py-0.5 shrink-0">
                        {p.quizScore !== null ? t("portal.modules.score", { score: p.quizScore }) : t("portal.modules.complete")}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="border border-dashed border-ink/25 p-5 flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-ink">{t("portal.assistant.title")}</h2>
          <p className="text-sm text-ink-soft">{t("portal.assistant.body")}</p>
        </section>

        <EducationNote />
      </div>
    </Container>
  );
}
