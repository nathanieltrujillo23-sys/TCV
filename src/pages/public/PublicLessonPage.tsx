import { Navigate, useParams } from "react-router-dom";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { lessonById } from "../../content/lessons";
import { LessonView } from "../../components/portal/LessonView";

/** Free sample modules on the public site. Other modules require an account. */
export function PublicLessonPage() {
  const { lessonId } = useParams();
  const lesson = lessonById(lessonId);
  useDocumentTitle(lesson ? { text: lesson.title } : undefined);
  if (!lesson || !lesson.publicSample) return <Navigate to="/learn" replace />;
  return <LessonView key={lesson.id} lesson={lesson} mode="public" />;
}
