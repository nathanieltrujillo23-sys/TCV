import { useState, type FormEvent } from "react";
import { useLedger } from "../state/LedgerContext";
import { formatCurrency } from "../utils/format";
import { dateInputToISO, todayInputValue } from "../utils/date";
import { DateInput } from "./DateInput";

export function IncomeForm() {
  const { addTransaction, addPreset, attachReceipt, listNames } = useLedger();
  const [amount, setAmount] = useState("");
  const [firm, setFirm] = useState("");
  const [accounts, setAccounts] = useState("1");
  const [date, setDate] = useState(todayInputValue());
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [justLogged, setJustLogged] = useState<{ amount: number; firm: string; accounts: number } | null>(null);

  const firms = listNames("firm");

  function reset() {
    setAmount("");
    setFirm("");
    setAccounts("1");
    setDate(todayInputValue());
    setReceiptFile(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    const acc = parseInt(accounts, 10) || 1;
    if (!Number.isFinite(amt) || !firm.trim()) return;

    const tx = addTransaction({
      type: "income",
      date: dateInputToISO(date),
      amount: amt,
      accounts: acc,
      vendor: firm.trim(),
    });

    if (receiptFile) {
      attachReceipt(tx.id, receiptFile).catch((err) => console.error("Failed to attach receipt:", err));
    }

    setJustLogged({ amount: amt, firm: firm.trim(), accounts: acc });
    reset();
  }

  function saveAsPreset() {
    if (!justLogged) return;
    addPreset({
      type: "income",
      label: justLogged.firm,
      firm: justLogged.firm,
      defaultAmount: justLogged.amount,
      defaultAccounts: justLogged.accounts,
    });
    setJustLogged(null);
  }

  const total = (parseFloat(amount) || 0) * (parseInt(accounts, 10) || 1);

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-800 p-4 flex flex-col gap-3">
      <h2 className="text-slate-200 font-semibold text-sm">Log income</h2>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Amount (per account)
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-base focus:outline-none focus:border-slate-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Firm
          <input
            type="text"
            list="firm-list"
            required
            value={firm}
            onChange={(e) => setFirm(e.target.value)}
            placeholder="Source of income"
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-base focus:outline-none focus:border-slate-500"
          />
          <datalist id="firm-list">
            {firms.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Number of accounts
          <input
            type="number"
            inputMode="numeric"
            min={1}
            step="1"
            value={accounts}
            onChange={(e) => setAccounts(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-base focus:outline-none focus:border-slate-500"
          />
        </label>
        <DateInput value={date} onChange={setDate} />
        <label className="flex flex-col gap-1 text-xs text-slate-400 col-span-2">
          Receipt / invoice (optional)
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-300 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:text-slate-200 file:px-3 file:py-1.5 file:text-xs file:font-medium"
          />
          {receiptFile && <span className="text-slate-500 truncate">{receiptFile.name}</span>}
        </label>
      </div>

      <div className="text-xs text-slate-400">
        Total: <span className="text-slate-200 font-medium">{formatCurrency(total)}</span>
      </div>

      <button
        type="submit"
        className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 transition-colors"
      >
        Log income
      </button>

      {justLogged && (
        <div className="flex items-center justify-between rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm">
          <span className="text-slate-300">
            Logged {formatCurrency(justLogged.amount * justLogged.accounts)} · {justLogged.firm}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={saveAsPreset}
              className="text-emerald-400 font-medium hover:text-emerald-300"
            >
              Save as preset
            </button>
            <button
              type="button"
              onClick={() => setJustLogged(null)}
              className="text-slate-500 hover:text-slate-300"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
