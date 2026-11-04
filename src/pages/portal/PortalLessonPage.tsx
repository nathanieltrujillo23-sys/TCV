import { Link, useParams } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { usePortalProgress } from "../../hooks/usePortalProgress";
import { LESSONS, lessonById } from "../../content/lessons";
import { LessonView } from "../../components/portal/LessonView";

export function PortalLessonPage() {
  const { lessonId } = useParams();
  const t = useT();
  const lesson = lessonById(lessonId);
  useDocumentTitle(lesson ? { text: lesson.title } : "lesson.notFound");
  const { progress, record } = usePortalProgress();

  if (!lesson) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-10 flex flex-col gap-3">
        <p className="text-ink">{t("lesson.notFound")}</p>
        <Link to="/portal" className="text-accent underline underline-offset-4">{t("lesson.back")}</Link>
      </div>
    );
  }
  const next = LESSONS.find((l) => l.number === lesson.number + 1);

  return (
    <LessonView
      key={lesson.id}
      lesson={lesson}
      mode="portal"
      nextLesson={next}
      bestScore={progress?.get(lesson.id)?.quizScore ?? null}
      onPassed={(score) => record(lesson.id, score)}
    />
  );
}
