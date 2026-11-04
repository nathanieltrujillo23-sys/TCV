import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useT } from "../i18n/LanguageContext";
import { useAuth } from "../state/AuthContext";
import { useProfile } from "../state/ProfileContext";
import { homePathFor } from "../routes/homePath";
import { BrandMark, Container } from "../components/site/SiteUI";

const NAV = [
  { to: "/about", key: "site.nav.about" },
  { to: "/services", key: "site.nav.services" },
  { to: "/learn", key: "site.nav.learn" },
  { to: "/contact", key: "site.nav.contact" },
] as const;

function navClass({ isActive }: { isActive: boolean }) {
  return `text-sm transition-colors ${isActive ? "text-ink font-medium" : "text-ink-soft hover:text-ink"}`;
}

export function PublicLayout() {
  const t = useT();
  const { user } = useAuth();
  const { isStaff, loading } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const account =
    user && !loading
      ? { to: homePathFor(isStaff), label: t(isStaff ? "site.nav.openApp" : "site.nav.openPortal") }
      : { to: "/signin", label: t("common.signIn") };

  return (
    <div className="min-h-screen bg-paper text-ink font-body [color-scheme:light] flex flex-col">
      <header className="border-b border-line bg-paper/95 sticky top-0 z-20 backdrop-blur">
        <Container>
          <div className="h-16 flex items-center gap-8">
            <Link to="/" onClick={close} className="mr-auto">
              <BrandMark />
            </Link>
            <nav aria-label={t("site.nav.label")} className="hidden md:flex items-center gap-7">
              {NAV.map((item) => (
                <NavLink key={item.to} to={item.to} className={navClass}>
                  {t(item.key)}
                </NavLink>
              ))}
            </nav>
            <Link
              to={account.to}
              className="hidden md:inline-flex text-sm font-medium border border-ink/20 px-4 py-2 hover:border-ink/50"
            >
              {account.label}
            </Link>
            <button
              type="button"
              className="md:hidden text-sm font-medium border border-ink/20 px-3 py-1.5"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {t(menuOpen ? "site.nav.closeMenu" : "site.nav.menu")}
            </button>
          </div>
        </Container>
        {menuOpen && (
          <nav id="site-menu" aria-label={t("site.nav.label")} className="md:hidden border-t border-line bg-paper">
            <Container>
              <div className="flex flex-col py-3">
                {NAV.map((item) => (
                  <NavLink key={item.to} to={item.to} onClick={close} className={({ isActive }) => `py-3 text-base ${isActive ? "text-ink font-medium" : "text-ink-soft"}`}>
                    {t(item.key)}
                  </NavLink>
                ))}
                <Link to={account.to} onClick={close} className="mt-2 py-3 text-base font-medium text-accent">
                  {account.label}
                </Link>
              </div>
            </Container>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line mt-20">
        <Container>
          <div className="py-10 flex flex-col gap-6 sm:flex-row sm:justify-between">
            <div className="flex flex-col gap-3 max-w-sm">
              <BrandMark />
              <p className="text-sm text-ink-soft">{t("site.footer.tagline")}</p>
            </div>
            <nav className="flex gap-6 text-sm text-ink-soft sm:items-start">
              <Link to="/disclosures" className="hover:text-ink">{t("site.footer.disclosures")}</Link>
              <Link to="/privacy" className="hover:text-ink">{t("site.footer.privacy")}</Link>
              <Link to="/terms" className="hover:text-ink">{t("site.footer.terms")}</Link>
            </nav>
          </div>
          <div className="border-t border-line py-5 flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-ink-soft">
            <p>{t("site.footer.copyright", { year: new Date().getFullYear() })}</p>
            <p>{t("site.footer.disclaimer")}</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
