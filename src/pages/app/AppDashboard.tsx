import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import { useProfile } from "../../state/ProfileContext";
import { PlaceholderPage } from "../PlaceholderPage";

const linkClass = "bg-slate-100 text-slate-900 text-sm font-medium px-3 py-2 hover:bg-white";

export function AppDashboard() {
  const t = useT();
  const { access } = useProfile();
  return (
    <PlaceholderPage titleKey="app.dashboard.title" bodyKey="app.dashboard.body">
      <div className="flex flex-wrap gap-2">
        {access.ledger && (
          <Link to="/app/ledger" className={linkClass}>
            {t("app.dashboard.openLedger")}
          </Link>
        )}
        {access.journal && (
          <Link to="/app/journal" className={linkClass}>
            {t("app.dashboard.openJournal")}
          </Link>
        )}
      </div>
    </PlaceholderPage>
  );
}
