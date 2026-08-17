import { useState, type FormEvent } from "react";
import { useLedger } from "../state/LedgerContext";
import type { Transaction } from "../types";
import { dateInputToISO, isoToDateInput } from "../utils/date";
import { DateInput } from "./DateInput";

export function TransactionEditRow({ transaction, onDone }: { transaction: Transaction; onDone: () => void }) {
  const { updateTransaction, listNames } = useLedger();
  const t = transaction;

  const [amount, setAmount] = useState(String(t.amount));
  const [accounts, setAccounts] = useState(String(t.accounts ?? 1));
  const [purchases, setPurchases] = useState(String(t.purchases ?? 1));
  const [item, setItem] = useState(t.item ?? "");
  const [vendor, setVendor] = useState(t.vendor ?? "");
  const [accountMethod, setAccountMethod] = useState(t.accountMethod ?? "");
  const [date, setDate] = useState(isoToDateInput(t.date));

  const vendorOptions = listNames(t.type === "expense" ? "vendor" : "firm");
  const cardOptions = listNames("accountMethod");
  const itemOptions = listNames("item");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt)) return;
    const isoDate = dateInputToISO(date, t.date);

    if (t.type === "expense") {
      updateTransaction(t.id, {
        date: isoDate,
        amount: amt,
        purchases: parseInt(purchases, 10) || 1,
        item: item.trim(),
        vendor: vendor.trim() || undefined,
        accountMethod: accountMethod.trim() || undefined,
      });
    } else {
      updateTransaction(t.id, {
        date: isoDate,
        amount: amt,
        accounts: parseInt(accounts, 10) || 1,
        vendor: vendor.trim(),
      });
    }
    onDone();
  }

  return (
    <li className="py-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-white text-sm"
          />
          {t.type === "expense" ? (
            <>
              <input
                type="text"
                list="edit-item-list"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="Item"
                className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-white text-sm"
              />
              <datalist id="edit-item-list">
                {itemOptions.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </>
          ) : (
            <input
              type="number"
              step="1"
              min={1}
              value={accounts}
              onChange={(e) => setAccounts(e.target.value)}
              placeholder="Accounts"
              className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-white text-sm"
            />
          )}
          <input
            type="text"
            list="edit-vendor-list"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder={t.type === "expense" ? "Vendor" : "Firm"}
            className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-white text-sm"
          />
          <datalist id="edit-vendor-list">
            {vendorOptions.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
          {t.type === "expense" && (
            <>
              <input
                type="text"
                list="edit-card-list"
                value={accountMethod}
                onChange={(e) => setAccountMethod(e.target.value)}
                placeholder="Card / bank"
                className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-white text-sm"
              />
              <datalist id="edit-card-list">
                {cardOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <input
                type="number"
                step="1"
                min={1}
                value={purchases}
                onChange={(e) => setPurchases(e.target.value)}
                placeholder="Purchases"
                className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-white text-sm"
              />
            </>
          )}
          <DateInput value={date} onChange={setDate} compact />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button type="button" onClick={onDone} className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1">
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-slate-100 text-slate-900 text-xs font-medium px-3 py-1.5 hover:bg-white"
          >
            Save
          </button>
        </div>
      </form>
    </li>
  );
}
