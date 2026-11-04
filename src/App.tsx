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
                <Route index element={<PlaceholderPage titleKey="page.home.title" bodyKey="page.home.body" />} />
                <Route path="about" element={<PlaceholderPage titleKey="page.about.title" />} />
                <Route path="services" element={<PlaceholderPage titleKey="page.services.title" />} />
                <Route path="learn" element={<PlaceholderPage titleKey="page.learn.title" />} />
                <Route path="contact" element={<PlaceholderPage titleKey="page.contact.title" />} />
                <Route path="disclosures" element={<PlaceholderPage titleKey="page.disclosures.title" />} />
                <Route path="privacy" element={<PlaceholderPage titleKey="page.privacy.title" />} />
                <Route path="terms" element={<PlaceholderPage titleKey="page.terms.title" />} />
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
                      <PlaceholderPage titleKey="app.messages.title" />
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
