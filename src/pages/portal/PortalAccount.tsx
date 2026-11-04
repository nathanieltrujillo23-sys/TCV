import { useT } from "../../i18n/LanguageContext";
import { useAuth } from "../../state/AuthContext";
import { PlaceholderPage } from "../PlaceholderPage";

export function PortalAccount() {
  const t = useT();
  const { user } = useAuth();
  return (
    <PlaceholderPage titleKey="portal.account.title">
      <p className="text-slate-300 text-sm">{t("portal.account.email", { email: user?.email ?? "" })}</p>
    </PlaceholderPage>
  );
}
