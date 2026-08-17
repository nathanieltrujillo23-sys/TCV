import { useMemo } from "react";
import { LedgerProvider, useLedger } from "./state/LedgerContext";
import { AuthProvider, useAuth } from "./state/AuthContext";
import { createSupabaseRepository } from "./data/supabaseRepository";
import { TopBar } from "./components/TopBar";
import { Dashboard } from "./components/Dashboard";
import { ExpenseForm } from "./components/ExpenseForm";
import { IncomeForm } from "./components/IncomeForm";
import { PresetsPanel } from "./components/PresetsPanel";
import { TransactionList } from "./components/TransactionList";
import { SummaryView } from "./components/SummaryView";
import { SignInPage } from "./components/SignInPage";
import { MigrationPrompt } from "./components/MigrationPrompt";

function FullScreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <p className="text-slate-400 text-sm text-center">{children}</p>
    </div>
  );
}

function AppContent() {
  const { primaryView, viewMode, loading, loadError } = useLedger();

  if (loading) return <FullScreenMessage>Loading your ledger…</FullScreenMessage>;
  if (loadError) return <FullScreenMessage>Couldn't load your data: {loadError}</FullScreenMessage>;

  return (
    <div className="min-h-screen bg-slate-900">
      <TopBar />
      <MigrationPrompt />
      {viewMode === "summary" ? (
        <SummaryView />
      ) : (
        <>
          <Dashboard />
          <main className="max-w-3xl mx-auto px-4 pb-16 flex flex-col gap-4">
            {primaryView === "expense" ? <ExpenseForm /> : <IncomeForm />}
            <PresetsPanel type={primaryView} />
            <TransactionList type={primaryView} />
          </main>
        </>
      )}
    </div>
  );
}

function AuthedApp() {
  const { user, loading } = useAuth();
  const repository = useMemo(() => (user ? createSupabaseRepository(user.id) : null), [user]);

  if (loading) return <FullScreenMessage>Loading…</FullScreenMessage>;
  if (!user || !repository) return <SignInPage />;

  return (
    <LedgerProvider key={user.id} repository={repository}>
      <AppContent />
    </LedgerProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthedApp />
    </AuthProvider>
  );
}

export default App;
