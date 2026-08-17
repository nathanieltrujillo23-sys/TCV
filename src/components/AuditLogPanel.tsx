import { useState } from "react";
import { useLedger } from "../state/LedgerContext";
import { Modal } from "./Modal";
import { formatCurrency, transactionTotal } from "../utils/format";
import type { AuditEntry, Transaction } from "../types";

function describe(t: Transaction): string {
  if (t.type === "expense") {
    return `${t.item || "Expense"} · ${formatCurrency(transactionTotal(t))}${t.vendor ? ` · ${t.vendor}` : ""}`;
  }
  return `${t.vendor || "Income"} · ${formatCurrency(transactionTotal(t))}`;
}

function entryLine(entry: AuditEntry): string {
  switch (entry.action) {
    case "create":
      return `Logged ${describe(entry.after!)}`;
    case "delete":
      return `Deleted ${describe(entry.before!)}`;
    case "update":
      return `Edited ${describe(entry.before!)} → ${describe(entry.after!)}`;
  }
}

const ACTION_COLOR: Record<AuditEntry["action"], string> = {
  create: "text-emerald-400",
  update: "text-amber-400",
  delete: "text-rose-400",
};

export function AuditLogPanel() {
  const { auditLog } = useLedger();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs px-2.5 py-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
      >
        Activity
      </button>

      {open && (
        <Modal title="Activity log" onClose={() => setOpen(false)}>
          {auditLog.length === 0 ? (
            <p className="text-slate-500 text-sm">No activity yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-700 max-h-96 overflow-y-auto">
              {auditLog.map((entry) => (
                <li key={entry.id} className="py-2 text-sm">
                  <span className={`font-medium ${ACTION_COLOR[entry.action]}`}>{entryLine(entry)}</span>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {new Date(entry.timestamp).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </>
  );
}
