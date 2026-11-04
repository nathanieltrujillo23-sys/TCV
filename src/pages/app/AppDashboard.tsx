import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import { PlaceholderPage } from "../PlaceholderPage";

export function AppDashboard() {
  const t = useT();
  return (
    <PlaceholderPage titleKey="app.dashboard.title" bodyKey="app.dashboard.body">
      <Link
        to="/app/ledger"
        className="self-start rounded-md bg-slate-100 text-slate-900 text-sm font-medium px-3 py-2 hover:bg-white"
      >
        {t("app.dashboard.openLedger")}
      </Link>
    </PlaceholderPage>
  );
}
