import { useEffect } from "react";
import { useT } from "../i18n/LanguageContext";
import type { StringKey } from "../i18n/en";

/**
 * Sets the browser tab title to "Page | TruCapitalVentures". Pass a string key,
 * or `{ text }` for titles that come from content (such as a lesson title).
 */
export function useDocumentTitle(page?: StringKey | { text: string }) {
  const t = useT();
  const name = page === undefined ? null : typeof page === "string" ? t(page) : page.text;
  const title = name ? t("common.pageTitle", { page: name }) : t("brand.name");
  useEffect(() => {
    document.title = title;
  }, [title]);
}
