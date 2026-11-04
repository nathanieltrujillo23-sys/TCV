import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabasePortalRepository, type LessonProgress } from "../data/portalRepository";

/** The signed in account's completed modules, keyed by lesson id. */
export function usePortalProgress() {
  const repo = useMemo(() => createSupabasePortalRepository(), []);
  const [progress, setProgress] = useState<Map<string, LessonProgress> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    repo
      .listProgress()
      .then((rows) => !cancelled && setProgress(new Map(rows.map((r) => [r.lessonId, r]))))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const record = useCallback(
    async (lessonId: string, score: number) => {
      const previous = progress?.get(lessonId)?.quizScore ?? null;
      await repo.recordCompletion(lessonId, score, previous);
      setProgress((prev) => {
        const next = new Map(prev ?? []);
        const best = Math.max(score, previous ?? 0);
        next.set(lessonId, { lessonId, quizScore: best, completedAt: new Date().toISOString() });
        return next;
      });
    },
    [repo, progress]
  );

  return { progress, error, record };
}
