import { useMemo, useState } from "react";
import { useLedger } from "../state/LedgerContext";
import { Modal } from "./Modal";
import { TransactionRow } from "./TransactionList";
import { TransactionEditRow } from "./TransactionEditRow";
import { formatCurrency, transactionTotal } from "../utils/format";

const MAX_RESULTS = 50;

export function SearchPanel() {
  const { transactions, deleteTransaction } = useLedger();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return transactions
      .filter((t) => {
        const haystack = [
          t.item,
          t.vendor,
          t.accountMethod,
          t.category,
          formatCurrency(transactionTotal(t)),
          String(t.amount),
          new Date(t.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, query]);

  const shown = results.slice(0, MAX_RESULTS);

  function openPanel() {
    setQuery("");
    setEditingId(null);
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className="text-xs px-2.5 py-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
      >
        Search
      </button>

      {open && (
        <Modal title="Search transactions" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by item, vendor, category, amount, date…"
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-slate-500"
            />

            {query.trim() === "" ? (
              <p className="text-slate-500 text-xs">Start typing to search across every transaction you've ever logged — not just the current period.</p>
            ) : results.length === 0 ? (
              <p className="text-slate-500 text-xs">No matches.</p>
            ) : (
              <>
                <ul className="flex flex-col divide-y divide-slate-700 max-h-[60vh] overflow-y-auto">
                  {shown.map((t) =>
                    editingId === t.id ? (
                      <TransactionEditRow key={t.id} transaction={t} onDone={() => setEditingId(null)} />
                    ) : (
                      <TransactionRow
                        key={t.id}
                        transaction={t}
                        onEdit={() => setEditingId(t.id)}
                        onDelete={() => deleteTransaction(t.id)}
                      />
                    )
                  )}
                </ul>
                {results.length > MAX_RESULTS && (
                  <p className="text-slate-500 text-xs">
                    Showing the {MAX_RESULTS} most recent of {results.length} matches — narrow your search to see more.
                  </p>
                )}
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
