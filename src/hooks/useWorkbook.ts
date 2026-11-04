import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseWorkbookRepository } from "../data/workbookRepository";
import { createWorkbook, workbookProgress, type WorkbookData } from "../lib/workbook";
import { checklistFor } from "../content/workbook";
import { useT } from "../i18n/LanguageContext";

export type SaveState = "idle" | "saving" | "saved" | "error";

const SAVE_DELAY_MS = 700;

/**
 * Loads the signed in account's workbook (or a fresh one) and saves changes a
 * moment after the last edit. A pending save is flushed when the page closes.
 */
export function useWorkbook() {
  const t = useT();
  const repo = useMemo(() => createSupabaseWorkbookRepository(), []);
  const [data, setData] = useState<WorkbookData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const completedAt = useRef<string | null>(null);
  const pending = useRef<WorkbookData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    repo
      .load()
      .then((saved) => {
        if (cancelled) return;
        completedAt.current = saved?.completedAt ?? null;
        setData(saved?.data ?? createWorkbook((key) => t(key)));
      })
      .catch((err: Error) => !cancelled && setLoadError(err.message));
    return () => {
      cancelled = true;
    };
  }, [repo, t]);

  // Saves run one after another, so an older version can never land after a newer one.
  const chain = useRef<Promise<void>>(Promise.resolve());

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const next = pending.current;
    if (!next) return chain.current;
    pending.current = null;
    chain.current = chain.current.then(async () => {
      const progress = workbookProgress(next, checklistFor(next.stage).map((c) => c.id), new Date());
      const finished = progress.done === progress.total;
      const stamp = finished ? (completedAt.current ?? new Date().toISOString()) : null;
      setSaveState("saving");
      try {
        await repo.save(next, stamp);
        completedAt.current = stamp;
        setSaveError(null);
        setSaveState(pending.current ? "saving" : "saved");
      } catch (err) {
        // Keep the unsaved version so "Try again" sends it.
        if (!pending.current) pending.current = next;
        setSaveError((err as Error).message);
        setSaveState("error");
      }
    });
    return chain.current;
  }, [repo]);

  const update = useCallback(
    (change: (draft: WorkbookData) => WorkbookData) => {
      setData((prev) => {
        if (!prev) return prev;
        const next = change(prev);
        pending.current = next;
        return next;
      });
      setSaveState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
    },
    [flush]
  );

  // Save anything still waiting when the visitor leaves the page.
  useEffect(() => () => void flush(), [flush]);

  return { data, loadError, saveState, saveError, update, retrySave: flush };
}
