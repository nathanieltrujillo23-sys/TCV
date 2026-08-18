import { useMemo, useState } from "react";
import { useLedger } from "../state/LedgerContext";
import { isWithinRange } from "../utils/period";
import { formatCurrency, transactionTotal } from "../utils/format";
import type { Transaction } from "../types";
import { TransactionEditRow } from "./TransactionEditRow";

export function TransactionList({ type }: { type: "income" | "expense" }) {
  const { transactions, effectiveRange, effectiveLabel, deleteTransaction } = useLedger();
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      transactions
        .filter((t) => t.type === type && isWithinRange(t.date, effectiveRange))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, type, effectiveRange]
  );

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-800 p-4">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h2 className="text-slate-200 font-semibold text-sm">Entries</h2>
          <span className="text-slate-500 text-xs">{effectiveLabel}</span>
        </div>
        <p className="text-slate-500 text-xs">No {type} entries in this period.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-800 p-4">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h2 className="text-slate-200 font-semibold text-sm">Entries ({filtered.length})</h2>
        <span className="text-slate-500 text-xs">{effectiveLabel}</span>
      </div>
      <ul className="flex flex-col divide-y divide-slate-700">
        {filtered.map((t) =>
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
    </div>
  );
}

function TransactionRow({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = transaction;
  const title = t.type === "expense" ? t.item : t.vendor;
  const purchases = t.purchases ?? 1;
  const subtitle =
    t.type === "expense"
      ? [
          t.vendor,
          t.accountMethod,
          purchases > 1 ? `${purchases} purchases · ${formatCurrency(t.amount)} ea` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : `${t.accounts ?? 1} account${(t.accounts ?? 1) === 1 ? "" : "s"} · ${formatCurrency(t.amount)} ea`;

  return (
    <li className="flex items-center justify-between py-2 gap-2">
      <div className="min-w-0">
        <p className="text-slate-100 text-sm font-medium truncate">{title || "—"}</p>
        <p className="text-slate-500 text-xs truncate">
          {new Date(t.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          {subtitle ? ` · ${subtitle}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
          {formatCurrency(transactionTotal(t))}
        </span>
        <button type="button" onClick={onEdit} className="text-slate-500 hover:text-slate-200 text-xs">
          Edit
        </button>
        <button type="button" onClick={onDelete} className="text-slate-600 hover:text-rose-400 text-xs">
          Delete
        </button>
      </div>
    </li>
  );
}
