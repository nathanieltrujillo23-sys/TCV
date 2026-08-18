import { useMemo } from "react";
import { useLedger } from "../state/LedgerContext";
import { isWithinRange, type DateRange } from "../utils/period";
import { formatCurrency, transactionTotal } from "../utils/format";
import { Modal } from "./Modal";
import type { Transaction, TransactionType } from "../types";

export function VendorDetailModal({
  type,
  label,
  range,
  onClose,
}: {
  type: TransactionType;
  label: string;
  range: DateRange;
  onClose: () => void;
}) {
  const { transactions } = useLedger();

  const items = useMemo(
    () =>
      transactions
        .filter((t) => t.type === type && (t.vendor?.trim() || "Unknown") === label && isWithinRange(t.date, range))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, type, label, range]
  );

  const total = items.reduce((sum, t) => sum + transactionTotal(t), 0);

  return (
    <Modal title={label} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-slate-400 text-xs">
          {items.length} {type === "expense" ? "purchase" : "payment"}
          {items.length === 1 ? "" : "s"} · Total{" "}
          <span className={type === "expense" ? "text-rose-400" : "text-emerald-400"}>{formatCurrency(total)}</span>
        </p>
        {items.length === 0 ? (
          <p className="text-slate-500 text-xs">No entries in this period.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-700">
            {items.map((t) => (
              <VendorDetailRow key={t.id} transaction={t} type={type} />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function VendorDetailRow({ transaction: t, type }: { transaction: Transaction; type: TransactionType }) {
  const qty = type === "expense" ? (t.purchases ?? 1) : (t.accounts ?? 1);
  const title = type === "expense" ? t.item || "—" : t.vendor || "—";

  return (
    <li className="flex items-center justify-between py-2 gap-2">
      <div className="min-w-0">
        <p className="text-slate-100 text-sm font-medium truncate">{title}</p>
        <p className="text-slate-500 text-xs truncate">
          {new Date(t.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          {" · "}
          {qty} {type === "expense" ? "purchase" : "account"}
          {qty === 1 ? "" : "s"} · {formatCurrency(t.amount)} ea
        </p>
      </div>
      <span className={`text-sm font-semibold shrink-0 ${type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
        {formatCurrency(transactionTotal(t))}
      </span>
    </li>
  );
}
