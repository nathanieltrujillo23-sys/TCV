import { useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import type { StringKey } from "../../i18n/en";
import type { Lesson } from "../../content/lessons";
import { scoreQuiz, type QuizResult } from "../../lib/quiz";
import { EducationNote } from "./EducationNote";

const TOOL_KEYS: Record<NonNullable<Lesson["tool"]>, StringKey> = {
  compound: "tools.compound",
  savings: "tools.savings",
  debt: "tools.debt",
  retirement: "tools.retirement",
};

/**
 * A full module: objectives, body, case study, key terms, and quiz.
 * mode "portal" saves a passed quiz; mode "public" is the free sample on /learn.
 */
export function LessonView({
  lesson,
  mode,
  nextLesson,
  bestScore,
  onPassed,
}: {
  lesson: Lesson;
  mode: "portal" | "public";
  nextLesson?: Lesson;
  bestScore?: number | null;
  onPassed?: (score: number) => Promise<void>;
}) {
  const t = useT();
  const [answers, setAnswers] = useState<(number | null)[]>(lesson.quiz.map(() => null));
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Portal mode only: "Your progress is saved" waits until the save really finished.
  const [save, setSave] = useState<"saving" | "saved" | "failed" | null>(null);
  const base = mode === "portal" ? "/portal/lessons" : "/learn";

  async function check() {
    if (answers.some((a) => a === null)) return setError(t("lesson.answerAll"));
    setError(null);
    const r = scoreQuiz(answers, lesson.quiz.map((q) => q.answer));
    setResult(r);
    if (r.passed) await saveResult(r.score);
  }

  async function saveResult(score: number) {
    if (!onPassed) return;
    setSave("saving");
    setError(null);
    try {
      await onPassed(score);
      setSave("saved");
    } catch (err) {
      setSave("failed");
      setError(t("lesson.saveError", { error: (err as Error).message }));
    }
  }

  function retry() {
    setAnswers(lesson.quiz.map(() => null));
    setResult(null);
    setError(null);
    setSave(null);
  }

  return (
    <article className="max-w-3xl mx-auto px-5 py-10 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <Link to={mode === "portal" ? "/portal" : "/learn"} className="text-sm text-accent hover:text-accent-dark self-start">
          ← {t("lesson.back")}
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
          {t("lesson.module", { number: String(lesson.number).padStart(2, "0") })} · {t("portal.modules.minutes", { minutes: lesson.minutes })}
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">{lesson.title}</h1>
        <p className="text-lg text-ink-soft leading-relaxed">{lesson.summary}</p>
        {bestScore !== undefined && bestScore !== null && (
          <p className="text-xs font-mono text-ink-soft">{t("portal.modules.complete")} · {t("portal.modules.score", { score: bestScore })}</p>
        )}
        <EducationNote />
      </header>

      <section className="bg-paper border border-line p-5">
        <h2 className="text-sm font-semibold text-ink">{t("lesson.objectives")}</h2>
        <ol className="mt-3 flex flex-col gap-2">
          {lesson.objectives.map((o, i) => (
            <li key={o} className="flex gap-3 text-[15px] text-ink-soft">
              <span className="font-mono text-xs text-accent mt-1">{String(i + 1).padStart(2, "0")}</span>
              {o}
            </li>
          ))}
        </ol>
      </section>

      {lesson.sections.map((s) => (
        <section key={s.heading} className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-ink">{s.heading}</h2>
          {s.paragraphs.map((p) => (
            <p key={p} className="text-[17px] leading-relaxed text-ink-soft">{p}</p>
          ))}
          {s.bullets && (
            <ul className="flex flex-col gap-2 mt-1">
              {s.bullets.map((b) => (
                <li key={b} className="flex gap-3 text-[16px] leading-relaxed text-ink-soft">
                  <span className="mt-2.5 h-1.5 w-1.5 bg-accent shrink-0" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section className="bg-ink text-white p-6 flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/60">{t("lesson.case")}</p>
        <h2 className="text-xl font-semibold tracking-tight">{lesson.caseStudy.title}</h2>
        {lesson.caseStudy.paragraphs.map((p) => (
          <p key={p} className="text-white/80 leading-relaxed">{p}</p>
        ))}
        {lesson.tool && (
          <Link to={mode === "portal" ? `/portal/tools#${lesson.tool}` : "/signup"} className="self-start mt-2 bg-white text-ink text-sm font-medium px-4 py-2 hover:bg-surface">
            {t("lesson.tryTool")}: {t(TOOL_KEYS[lesson.tool])}
          </Link>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-ink">{t("lesson.keyTerms")}</h2>
        <dl className="mt-4 grid gap-px bg-line border border-line sm:grid-cols-2">
          {lesson.keyTerms.map((k) => (
            <div key={k.term} className="bg-paper p-4">
              <dt className="font-semibold text-ink">{k.term}</dt>
              <dd className="mt-1 text-sm text-ink-soft leading-relaxed">{k.definition}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-paper border border-line border-t-2 border-t-accent p-5 sm:p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">{t("lesson.quiz")}</h2>
          <p className="mt-1 text-sm text-ink-soft">{t("lesson.quizHelp")}</p>
        </div>
        {lesson.quiz.map((q, qi) => {
          const answered = result !== null;
          const isRight = answers[qi] === q.answer;
          return (
            <fieldset key={q.question} className="flex flex-col gap-2">
              <legend className="font-medium text-ink mb-2">
                <span className="font-mono text-xs text-accent mr-2">Q{qi + 1}</span>
                {q.question}
              </legend>
              {q.options.map((opt, oi) => {
                const chosen = answers[qi] === oi;
                const style = answered
                  ? oi === q.answer
                    ? "border-emerald-600 bg-emerald-50"
                    : chosen
                      ? "border-red-600 bg-red-50"
                      : "border-line"
                  : chosen
                    ? "border-accent bg-accent/5"
                    : "border-line hover:border-ink/40";
                return (
                  <label key={opt} className={`flex items-center gap-3 border px-3 py-2.5 text-[15px] text-ink cursor-pointer ${style}`}>
                    <input
                      type="radio"
                      name={`q${qi}`}
                      checked={chosen}
                      disabled={answered}
                      onChange={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                      className="accent-[#1f4fd8]"
                    />
                    {opt}
                  </label>
                );
              })}
              {answered && (
                <p className={`text-sm ${isRight ? "text-emerald-700" : "text-red-700"}`}>
                  {t(isRight ? "lesson.correct" : "lesson.incorrect")} {q.explanation}
                </p>
              )}
            </fieldset>
          );
        })}
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        {result ? (
          <div className="flex flex-col gap-3 border-t border-line pt-4" role="status">
            <p className="font-mono text-sm text-ink">{t("lesson.result", { correct: result.correct })}</p>
            {!(result.passed && save === "failed") && (
              <p className="text-sm text-ink-soft">
                {!result.passed
                  ? t("lesson.notPassed")
                  : mode === "public"
                    ? t("lesson.passedPublic")
                    : t(save === "saved" ? "lesson.passed" : "lesson.saving")}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {!result.passed && (
                <button type="button" onClick={retry} className="bg-accent hover:bg-accent-dark text-white text-sm font-medium px-5 py-2.5">{t("lesson.retry")}</button>
              )}
              {result.passed && save === "failed" && (
                <button type="button" onClick={() => saveResult(result.score)} className="bg-accent hover:bg-accent-dark text-white text-sm font-medium px-5 py-2.5">{t("lesson.saveRetry")}</button>
              )}
              {result.passed && mode === "portal" && save === "saved" && nextLesson && (
                <Link to={`${base}/${nextLesson.id}`} className="bg-accent hover:bg-accent-dark text-white text-sm font-medium px-5 py-2.5">{t("lesson.next")}</Link>
              )}
              {mode === "public" && (
                <Link to="/signup" className="bg-accent hover:bg-accent-dark text-white text-sm font-medium px-5 py-2.5">{t("lesson.signupCta")}</Link>
              )}
            </div>
          </div>
        ) : (
          <button type="button" onClick={check} className="self-start bg-accent hover:bg-accent-dark text-white text-sm font-medium px-5 py-2.5">{t("lesson.check")}</button>
        )}
      </section>
    </article>
  );
}
