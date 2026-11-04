import { Link, NavLink, Outlet } from "react-router-dom";
import { useT } from "../i18n/LanguageContext";
import { useAuth } from "../state/AuthContext";
import { useProfile } from "../state/ProfileContext";

const NAV = [
  { to: "/portal", key: "portal.nav.home", end: true },
  { to: "/portal/tools", key: "portal.nav.tools", end: false },
  { to: "/portal/account", key: "portal.nav.account", end: false },
] as const;

function navClass({ isActive }: { isActive: boolean }) {
  return `text-sm transition-colors ${isActive ? "text-white" : "text-slate-400 hover:text-white"}`;
}

export function PortalLayout() {
  const t = useT();
  const { signOut } = useAuth();
  const { isStaff } = useProfile();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link to="/" className="text-white font-semibold tracking-tight mr-auto">
            {t("brand.name")}
          </Link>
          <nav className="flex items-center gap-4">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {t(item.key)}
              </NavLink>
            ))}
            {isStaff && (
              <NavLink to="/app" className={navClass}>
                {t("site.nav.openApp")}
              </NavLink>
            )}
          </nav>
          <button type="button" onClick={signOut} className="text-sm text-slate-400 hover:text-white">
            {t("common.signOut")}
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
