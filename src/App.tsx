import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./state/AuthContext";
import { ProfileProvider } from "./state/ProfileContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { RequireAccess, RequireAuth } from "./routes/guards";
import { PublicLayout } from "./layouts/PublicLayout";
import { AppLayout } from "./layouts/AppLayout";
import { PortalLayout } from "./layouts/PortalLayout";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { SignInRoute } from "./pages/public/SignInRoute";
import { NotFoundPage } from "./pages/public/NotFoundPage";
import { PlanningPage } from "./pages/public/PlanningPage";
import { WorkbookPage } from "./pages/portal/WorkbookPage";
import { HomePage } from "./pages/public/HomePage";
import { AboutPage } from "./pages/public/AboutPage";
import { ServicesPage } from "./pages/public/ServicesPage";
import { LearnPage } from "./pages/public/LearnPage";
import { ContactPage } from "./pages/public/ContactPage";
import { LegalPage } from "./pages/public/LegalPage";
import { DISCLOSURE_SECTIONS, PRIVACY_SECTIONS, TERMS_SECTIONS } from "./pages/public/legalSections";
import { MessagesPage } from "./pages/app/MessagesPage";
import { JournalPage } from "./pages/app/JournalPage";
import { TradeFormPage } from "./pages/app/TradeFormPage";
import { JournalStatsPage } from "./pages/app/JournalStatsPage";
import { JournalRulesPage } from "./pages/app/JournalRulesPage";
import { AccountsPage } from "./pages/app/AccountsPage";
import { AppDashboard } from "./pages/app/AppDashboard";
import { LedgerPage } from "./pages/app/LedgerPage";
import { PortalAccount } from "./pages/portal/PortalAccount";
import { PortalHome } from "./pages/portal/PortalHome";
import { PortalLessonPage } from "./pages/portal/PortalLessonPage";
import { ToolsPage } from "./pages/portal/ToolsPage";
import { PublicLessonPage } from "./pages/public/PublicLessonPage";

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
                <Route path="learn/:lessonId" element={<PublicLessonPage />} />
                <Route path="planning" element={<PlanningPage />} />
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
                  <RequireAccess need="workspace">
                    <AppLayout />
                  </RequireAccess>
                }
              >
                <Route index element={<AppDashboard />} />
                <Route path="ledger" element={<RequireAccess need="ledger"><LedgerPage /></RequireAccess>} />
                <Route path="journal" element={<RequireAccess need="journal"><JournalPage /></RequireAccess>} />
                <Route path="journal/new" element={<RequireAccess need="journal"><TradeFormPage /></RequireAccess>} />
                <Route path="journal/rules" element={<RequireAccess need="journal"><JournalRulesPage /></RequireAccess>} />
                <Route path="journal/import" element={<RequireAccess need="journal"><PlaceholderPage titleKey="app.journal.import.title" /></RequireAccess>} />
                <Route path="journal/stats" element={<RequireAccess need="journal"><JournalStatsPage /></RequireAccess>} />
                <Route path="journal/:tradeId" element={<RequireAccess need="journal"><TradeFormPage /></RequireAccess>} />
                <Route path="accounts" element={<RequireAccess need="journal"><AccountsPage /></RequireAccess>} />
                <Route path="portfolio" element={<RequireAccess need="staffTools"><PlaceholderPage titleKey="app.portfolio.title" /></RequireAccess>} />
                <Route
                  path="messages"
                  element={
                    <RequireAccess need="ownerTools">
                      <MessagesPage />
                    </RequireAccess>
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
                <Route index element={<PortalHome />} />
                <Route path="lessons/:lessonId" element={<PortalLessonPage />} />
                <Route path="workbook" element={<WorkbookPage />} />
                <Route path="tools" element={<ToolsPage />} />
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
