import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./state/AuthContext";
import { ProfileProvider } from "./state/ProfileContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { RequireAuth, RequireOwner, RequireStaff } from "./routes/guards";
import { PublicLayout } from "./layouts/PublicLayout";
import { AppLayout } from "./layouts/AppLayout";
import { PortalLayout } from "./layouts/PortalLayout";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { SignInRoute } from "./pages/public/SignInRoute";
import { NotFoundPage } from "./pages/public/NotFoundPage";
import { HomePage } from "./pages/public/HomePage";
import { AboutPage } from "./pages/public/AboutPage";
import { ServicesPage } from "./pages/public/ServicesPage";
import { LearnPage } from "./pages/public/LearnPage";
import { ContactPage } from "./pages/public/ContactPage";
import { LegalPage } from "./pages/public/LegalPage";
import { DISCLOSURE_SECTIONS, PRIVACY_SECTIONS, TERMS_SECTIONS } from "./pages/public/legalSections";
import { MessagesPage } from "./pages/app/MessagesPage";
import { AppDashboard } from "./pages/app/AppDashboard";
import { LedgerPage } from "./pages/app/LedgerPage";
import { PortalAccount } from "./pages/portal/PortalAccount";

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ProfileProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="learn" element={<LearnPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="disclosures" element={<LegalPage titleKey="disclosures.title" sections={DISCLOSURE_SECTIONS} />} />
                <Route path="privacy" element={<LegalPage titleKey="privacy.title" introKey="privacy.intro" sections={PRIVACY_SECTIONS} />} />
                <Route path="terms" element={<LegalPage titleKey="terms.title" introKey="terms.intro" sections={TERMS_SECTIONS} />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              <Route path="signin" element={<SignInRoute mode="signin" />} />
              <Route path="signup" element={<SignInRoute mode="signup" />} />

              <Route
                path="app"
                element={
                  <RequireStaff>
                    <AppLayout />
                  </RequireStaff>
                }
              >
                <Route index element={<AppDashboard />} />
                <Route path="ledger" element={<LedgerPage />} />
                <Route path="journal" element={<PlaceholderPage titleKey="app.journal.title" />} />
                <Route path="journal/new" element={<PlaceholderPage titleKey="app.journal.new.title" />} />
                <Route path="journal/import" element={<PlaceholderPage titleKey="app.journal.import.title" />} />
                <Route path="journal/stats" element={<PlaceholderPage titleKey="app.journal.stats.title" />} />
                <Route path="journal/:tradeId" element={<PlaceholderPage titleKey="app.journal.trade.title" />} />
                <Route path="accounts" element={<PlaceholderPage titleKey="app.accounts.title" />} />
                <Route path="portfolio" element={<PlaceholderPage titleKey="app.portfolio.title" />} />
                <Route
                  path="messages"
                  element={
                    <RequireOwner>
                      <MessagesPage />
                    </RequireOwner>
                  }
                />
              </Route>

              <Route
                path="portal"
                element={
                  <RequireAuth>
                    <PortalLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<PlaceholderPage titleKey="portal.home.title" bodyKey="portal.home.body" />} />
                <Route path="lessons/:lessonId" element={<PlaceholderPage titleKey="portal.lesson.title" />} />
                <Route path="tools" element={<PlaceholderPage titleKey="portal.tools.title" />} />
                <Route path="account" element={<PortalAccount />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ProfileProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
