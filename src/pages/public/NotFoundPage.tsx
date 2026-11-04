import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import { PlaceholderPage } from "../PlaceholderPage";

export function NotFoundPage() {
  const t = useT();
  return (
    <PlaceholderPage titleKey="page.notFound.title" bodyKey="page.notFound.body">
      <Link to="/" className="self-start text-sm text-slate-300 underline hover:text-white">
        {t("common.backHome")}
      </Link>
    </PlaceholderPage>
  );
}
