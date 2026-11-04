import { useMemo } from "react";
import { LedgerProvider, useLedger } from "../../state/LedgerContext";
import { useAuth } from "../../state/AuthContext";
import { createSupabaseRepository } from "../../data/supabaseRepository";
import { TopBar } from "../../components/TopBar";
import { Dashboard } from "../../components/Dashboard";
import { ExpenseForm } from "../../components/ExpenseForm";
import { IncomeForm } from "../../components/IncomeForm";
import { PresetsPanel } from "../../components/PresetsPanel";
import { TransactionList } from "../../components/TransactionList";
import { SummaryView } from "../../components/SummaryView";
import { TaxesView } from "../../components/TaxesView";
import { MigrationPrompt } from "../../components/MigrationPrompt";
import { FullScreenMessage } from "../../routes/guards";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

// The original single page ledger, moved here unchanged when routing was added.
function LedgerContent() {
  const { primaryView, viewMode, loading, loadError } = useLedger();

  if (loading) return <FullScreenMessage>Loading your ledger…</FullScreenMessage>;
  if (loadError) return <FullScreenMessage>Couldn't load your data: {loadError}</FullScreenMessage>;

  return (
    <div className="min-h-screen bg-slate-900">
      <TopBar />
      <MigrationPrompt />
      {viewMode === "summary" ? (
        <SummaryView />
      ) : viewMode === "taxes" ? (
        <TaxesView />
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

export function LedgerPage() {
  useDocumentTitle("app.nav.ledger");
  const { user } = useAuth();
  const userId = user!.id;
  const repository = useMemo(() => createSupabaseRepository(userId), [userId]);

  return (
    <LedgerProvider key={userId} repository={repository}>
      <LedgerContent />
    </LedgerProvider>
  );
}
