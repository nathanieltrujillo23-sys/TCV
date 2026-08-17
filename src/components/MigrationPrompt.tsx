import { useState } from "react";
import { useLedger } from "../state/LedgerContext";
import { clearLocalAccountData, findLocalMigrationCandidates, type LocalMigrationCandidate } from "../data/localMigrationSource";
import { Modal } from "./Modal";

const DISMISS_KEY = "tcv-ledger:migration-dismissed";

export function MigrationPrompt() {
  const { importSnapshot } = useLedger();
  const [candidates] = useState<LocalMigrationCandidate[]>(() => {
    if (localStorage.getItem(DISMISS_KEY)) return [];
    return findLocalMigrationCandidates();
  });
  const [visible, setVisible] = useState(candidates.length > 0);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  if (!visible || candidates.length === 0) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function handleImport(candidate: LocalMigrationCandidate) {
    setImportingId(candidate.accountId);
    try {
      await importSnapshot(candidate.snapshot);
      clearLocalAccountData(candidate.accountId);
      setDoneIds((prev) => new Set(prev).add(candidate.accountId));
    } catch (err) {
      console.error("Migration import failed:", err);
      alert("Something went wrong importing that data. Your local copy is untouched — try again in a moment.");
    } finally {
      setImportingId(null);
    }
  }

  const allDone = candidates.every((c) => doneIds.has(c.accountId));

  return (
    <Modal title="Import existing data" onClose={dismiss}>
      <div className="flex flex-col gap-3">
        <p className="text-slate-300 text-sm">
          This browser has ledger data saved locally from before cloud sync. Import it into your signed-in account?
        </p>
        <ul className="flex flex-col gap-2">
          {candidates.map((c) => {
            const done = doneIds.has(c.accountId);
            return (
              <li
                key={c.accountId}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-slate-100 text-sm font-medium truncate">{c.accountName}</p>
                  <p className="text-slate-500 text-xs">{c.transactionCount} transactions</p>
                </div>
                {done ? (
                  <span className="text-emerald-400 text-xs shrink-0">Imported</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleImport(c)}
                    disabled={importingId === c.accountId}
                    className="shrink-0 rounded-md bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-medium px-3 py-1.5"
                  >
                    {importingId === c.accountId ? "Importing…" : "Import"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={dismiss}
          className="text-slate-500 hover:text-slate-300 text-xs"
        >
          {allDone ? "Close" : "Skip — don't ask again"}
        </button>
      </div>
    </Modal>
  );
}
