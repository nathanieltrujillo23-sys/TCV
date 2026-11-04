import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import { createSupabaseWorkbookRepository } from "../../data/workbookRepository";
import { workbookProgress } from "../../lib/workbook";
import { checklistFor } from "../../content/workbook";

/** Portal home card: starts the workbook, or shows how far along it is. */
export function WorkbookCard() {
  const t = useT();
  const repo = useMemo(() => createSupabaseWorkbookRepository(), []);
  // undefined while loading, null when never started (or when loading failed: the link still works).
  const [done, setDone] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    repo
      .load()
      .then((saved) => {
        if (cancelled) return;
        if (!saved) return setDone(null);
        const visible = checklistFor(saved.data.stage).map((c) => c.id);
        setDone(workbookProgress(saved.data, visible, new Date()).done);
      })
      .catch(() => !cancelled && setDone(null));
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const label = done === undefined ? t("common.loading") : done === null ? t("wb.card.start") : done >= 3 ? t("wb.card.done") : t("wb.card.continue", { done });

  return (
    <section className="bg-paper border border-line border-t-2 border-t-ink p-6 flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight text-ink">{t("wb.card.title")}</h2>
      <p className="text-sm text-ink-soft">{t("wb.card.body")}</p>
      <Link to="/portal/workbook" className="self-start mt-auto bg-ink hover:bg-ink/90 text-white text-sm font-medium px-4 py-2">
        {label}
      </Link>
    </section>
  );
}
