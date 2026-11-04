import { Link, NavLink, Outlet } from "react-router-dom";
import { useT } from "../i18n/LanguageContext";
import type { StringKey } from "../i18n/en";
import { useAuth } from "../state/AuthContext";
import { useProfile } from "../state/ProfileContext";

interface NavItem {
  to: string;
  key: StringKey;
  end?: boolean;
  ownerOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: "/app", key: "app.nav.dashboard", end: true },
  { to: "/app/ledger", key: "app.nav.ledger" },
  { to: "/app/journal", key: "app.nav.journal" },
  { to: "/app/accounts", key: "app.nav.accounts" },
  { to: "/app/portfolio", key: "app.nav.portfolio" },
  { to: "/app/messages", key: "app.nav.messages", ownerOnly: true },
];

function navClass({ isActive }: { isActive: boolean }) {
  return `shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-slate-100 text-slate-900" : "text-slate-300 hover:text-white hover:bg-slate-800"
  }`;
}

/** Owner and admin area: sidebar on wide screens, a scrollable strip on phones. */
export function AppLayout() {
  const t = useT();
  const { signOut } = useAuth();
  const { isOwner } = useProfile();
  const items = NAV.filter((item) => !item.ownerOnly || isOwner);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 md:flex">
      <aside className="md:w-52 md:shrink-0 md:min-h-screen border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950">
        <div className="px-4 py-3 flex md:flex-col md:items-stretch items-center gap-3">
          <Link to="/" className="text-white font-semibold tracking-tight shrink-0">
            {t("brand.name")}
          </Link>
          <nav
            aria-label={t("app.nav.label")}
            className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible -mx-1 px-1"
          >
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {t(item.key)}
              </NavLink>
            ))}
            <Link to="/portal" className="md:hidden shrink-0 rounded-md px-3 py-2 text-sm text-slate-400 hover:text-white">
              {t("app.nav.portal")}
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="md:hidden shrink-0 rounded-md px-3 py-2 text-sm text-slate-400 hover:text-white"
            >
              {t("common.signOut")}
            </button>
          </nav>
          <div className="hidden md:flex md:flex-col gap-1 mt-4 pt-4 border-t border-slate-800">
            <Link to="/portal" className="rounded-md px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800">
              {t("app.nav.portal")}
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="text-left rounded-md px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {t("common.signOut")}
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
