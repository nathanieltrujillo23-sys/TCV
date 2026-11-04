import { useEffect } from "react";
import { useT } from "../i18n/LanguageContext";
import type { StringKey } from "../i18n/en";

/** Sets the browser tab title to "Page | TruCapitalVentures", or just the brand when no page is given. */
export function useDocumentTitle(pageKey?: StringKey) {
  const t = useT();
  const title = pageKey ? t("common.pageTitle", { page: t(pageKey) }) : t("brand.name");
  useEffect(() => {
    document.title = title;
  }, [title]);
}
