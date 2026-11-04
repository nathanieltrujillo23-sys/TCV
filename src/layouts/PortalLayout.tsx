import { Link, NavLink, Outlet } from "react-router-dom";
import { useT } from "../i18n/LanguageContext";
import { useAuth } from "../state/AuthContext";
import { useProfile } from "../state/ProfileContext";
import { BrandMark, Container } from "../components/site/SiteUI";
import { DisclaimerGate } from "../components/portal/DisclaimerGate";

const NAV = [
  { to: "/portal", key: "portal.nav.home", end: true },
  { to: "/portal/workbook", key: "portal.nav.workbook", end: false },
  { to: "/portal/tools", key: "portal.nav.tools", end: false },
  { to: "/portal/account", key: "portal.nav.account", end: false },
] as const;

function navClass({ isActive }: { isActive: boolean }) {
  return `text-sm py-1 border-b-2 transition-colors ${
    isActive ? "text-ink border-accent font-medium" : "text-ink-soft border-transparent hover:text-ink"
  }`;
}

/** Client area: same light identity as the public site. */
export function PortalLayout() {
  const t = useT();
  const { signOut } = useAuth();
  const { access } = useProfile();

  return (
    <div className="min-h-screen bg-surface text-ink font-sans [color-scheme:light]">
      <header className="border-b border-line bg-paper">
        <Container>
          <div className="min-h-16 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link to="/" className="mr-auto">
              <BrandMark />
            </Link>
            <nav className="flex items-center gap-5">
              {NAV.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                  {t(item.key)}
                </NavLink>
              ))}
              {access.workspace && (
                <NavLink to="/app" className={navClass}>
                  {t("site.nav.openApp")}
                </NavLink>
              )}
            </nav>
            <button type="button" onClick={signOut} className="text-sm text-ink-soft hover:text-ink border border-line px-3 py-1.5">
              {t("common.signOut")}
            </button>
          </div>
        </Container>
      </header>
      <main>
        <DisclaimerGate>
          <Outlet />
        </DisclaimerGate>
      </main>
    </div>
  );
}
