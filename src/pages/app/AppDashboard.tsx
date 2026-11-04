import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useAuth } from "../../state/AuthContext";
import { useProfile } from "../../state/ProfileContext";
import { createSupabaseRepository } from "../../data/supabaseRepository";
import { createSupabaseJournalRepository } from "../../data/journalRepository";
import { transactionTotal } from "../../utils/format";
import { zonedParts } from "../../lib/tradeMath";
import { round } from "../../lib/instruments";
import { ErrorText, Money, Page, Stat } from "../../components/app/AppUI";
import { ClientProgressTable } from "../../components/app/ClientProgressTable";
import { buttonSecondary } from "../../components/app/styles";

interface MonthFigures {
  journalNet: number | null;
  closedTrades: number;
  ledgerIncome: number | null;
  ledgerExpenses: number | null;
}

const NY = "America/New_York";

/** Reads only — the dashboard never changes ledger or journal data. */
export function AppDashboard() {
  const t = useT();
  useDocumentTitle("app.dashboard.title");
  const { user } = useAuth();
  const { access } = useProfile();
  const [figures, setFigures] = useState<MonthFigures | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = user!.id;

  useEffect(() => {
    let cancelled = false;
    const month = zonedParts(new Date().toISOString(), NY).date.slice(0, 7);
    const localMonth = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };

    Promise.all([
      access.journal ? createSupabaseJournalRepository(userId).listTrades() : Promise.resolve(null),
      access.ledger ? createSupabaseRepository(userId).loadAll() : Promise.resolve(null),
    ])
      .then(([trades, ledger]) => {
        if (cancelled) return;
        const closed = (trades ?? []).filter((tr) => tr.netPnl !== null && zonedParts(tr.exitTime ?? tr.entryTime, NY).date.startsWith(month));
        const monthTx = (ledger?.transactions ?? []).filter((tx) => localMonth(tx.date) === month);
        setFigures({
          journalNet: trades ? round(closed.reduce((s, tr) => s + (tr.netPnl as number), 0), 2) : null,
          closedTrades: closed.length,
          ledgerIncome: ledger ? round(monthTx.filter((tx) => tx.type === "income").reduce((s, tx) => s + transactionTotal(tx), 0), 2) : null,
          ledgerExpenses: ledger ? round(monthTx.filter((tx) => tx.type === "expense").reduce((s, tx) => s + transactionTotal(tx), 0), 2) : null,
        });
      })
      .catch((err: Error) => !cancelled && setError(t("j.loadError", { error: err.message })));
    return () => {
      cancelled = true;
    };
  }, [userId, access.journal, access.ledger, t]);

  return (
    <Page titleKey="app.dashboard.title" leadKey="app.dashboard.body">
      {error && <ErrorText>{error}</ErrorText>}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-mono uppercase tracking-[0.14em] text-slate-400">{t("dash.month")}</h2>
        {!figures && !error ? (
          <p className="text-sm text-slate-400">{t("common.loading")}</p>
        ) : figures ? (
          <div className="grid gap-px bg-slate-800 border border-slate-800 grid-cols-1 sm:grid-cols-3">
            {figures.journalNet !== null && (
              <Stat label={t("dash.journalNet")}>
                <Money value={figures.journalNet} />
                <span className="block text-xs font-normal text-slate-500 mt-1">{t("dash.trades", { count: figures.closedTrades })}</span>
              </Stat>
            )}
            {figures.ledgerIncome !== null && (
              <Stat label={t("dash.ledgerIncome")}>
                <Money value={figures.ledgerIncome} />
              </Stat>
            )}
            {figures.ledgerExpenses !== null && (
              <Stat label={t("dash.ledgerExpenses")}>
                <Money value={figures.ledgerExpenses === 0 ? 0 : -figures.ledgerExpenses} />
              </Stat>
            )}
          </div>
        ) : null}
      </section>
      <div className="flex flex-wrap gap-2">
        {access.ledger && <Link to="/app/ledger" className={buttonSecondary}>{t("app.dashboard.openLedger")}</Link>}
        {access.journal && <Link to="/app/journal" className={buttonSecondary}>{t("app.dashboard.openJournal")}</Link>}
      </div>
      {access.ownerTools && <ClientProgressTable />}
    </Page>
  );
}
