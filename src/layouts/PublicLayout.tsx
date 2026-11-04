import { Link, NavLink, Outlet } from "react-router-dom";
import { useT } from "../i18n/LanguageContext";
import { useAuth } from "../state/AuthContext";
import { useProfile } from "../state/ProfileContext";
import { homePathFor } from "../routes/homePath";

const NAV = [
  { to: "/about", key: "site.nav.about" },
  { to: "/services", key: "site.nav.services" },
  { to: "/learn", key: "site.nav.learn" },
  { to: "/contact", key: "site.nav.contact" },
] as const;

function navClass({ isActive }: { isActive: boolean }) {
  return `text-sm transition-colors ${isActive ? "text-white" : "text-slate-400 hover:text-white"}`;
}

export function PublicLayout() {
  const t = useT();
  const { user } = useAuth();
  const { isStaff, loading } = useProfile();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link to="/" className="text-white font-semibold tracking-tight mr-auto">
            {t("brand.name")}
          </Link>
          <nav className="flex flex-wrap items-center gap-4" aria-label={t("site.nav.menu")}>
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                {t(item.key)}
              </NavLink>
            ))}
          </nav>
          {user && !loading ? (
            <Link
              to={homePathFor(isStaff)}
              className="text-sm font-medium rounded-md bg-slate-100 text-slate-900 px-3 py-1.5 hover:bg-white"
            >
              {t(isStaff ? "site.nav.openApp" : "site.nav.openPortal")}
            </Link>
          ) : (
            <Link
              to="/signin"
              className="text-sm font-medium rounded-md bg-slate-100 text-slate-900 px-3 py-1.5 hover:bg-white"
            >
              {t("common.signIn")}
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-slate-500">
          <p className="sm:mr-auto">{t("site.footer.copyright", { year: new Date().getFullYear() })}</p>
          <nav className="flex gap-4">
            <Link to="/disclosures" className="hover:text-slate-300">{t("site.footer.disclosures")}</Link>
            <Link to="/privacy" className="hover:text-slate-300">{t("site.footer.privacy")}</Link>
            <Link to="/terms" className="hover:text-slate-300">{t("site.footer.terms")}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
