import { useState, type FormEvent } from "react";
import { useLedger } from "../state/LedgerContext";
import { formatCurrency } from "../utils/format";
import { dateInputToISO, todayInputValue } from "../utils/date";
import { DateInput } from "./DateInput";

export function ExpenseForm() {
  const { addTransaction, addPreset, listNames } = useLedger();
  const [price, setPrice] = useState("");
  const [item, setItem] = useState("");
  const [vendor, setVendor] = useState("");
  const [accountMethod, setAccountMethod] = useState("");
  const [purchases, setPurchases] = useState("1");
  const [date, setDate] = useState(todayInputValue());
  const [justLogged, setJustLogged] = useState<{
    price: number;
    item: string;
    vendor: string;
    accountMethod: string;
    purchases: number;
  } | null>(null);

  const items = listNames("item");
  const vendors = listNames("vendor");
  const cards = listNames("accountMethod");

  function reset() {
    setPrice("");
    setItem("");
    setVendor("");
    setAccountMethod("");
    setPurchases("1");
    setDate(todayInputValue());
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = parseFloat(price);
    const count = parseInt(purchases, 10) || 1;
    if (!Number.isFinite(amount) || !item.trim()) return;

    addTransaction({
      type: "expense",
      date: dateInputToISO(date),
      amount,
      purchases: count,
      item: item.trim(),
      vendor: vendor.trim() || undefined,
      accountMethod: accountMethod.trim() || undefined,
    });

    setJustLogged({
      price: amount,
      item: item.trim(),
      vendor: vendor.trim(),
      accountMethod: accountMethod.trim(),
      purchases: count,
    });
    reset();
  }

  function saveAsPreset() {
    if (!justLogged) return;
    addPreset({
      type: "expense",
      label: justLogged.item,
      item: justLogged.item,
      vendor: justLogged.vendor || undefined,
      accountMethod: justLogged.accountMethod || undefined,
      defaultPrice: justLogged.price,
      defaultPurchases: justLogged.purchases,
    });
    setJustLogged(null);
  }

  const total = (parseFloat(price) || 0) * (parseInt(purchases, 10) || 1);

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-800 p-4 flex flex-col gap-3">
      <h2 className="text-slate-200 font-semibold text-sm">Log expense</h2>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Price
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-base focus:outline-none focus:border-slate-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Number of purchases
          <input
            type="number"
            inputMode="numeric"
            min={1}
            step="1"
            value={purchases}
            onChange={(e) => setPurchases(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-base focus:outline-none focus:border-slate-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Item
          <input
            type="text"
            list="item-list"
            required
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="e.g. Coffee"
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-base focus:outline-none focus:border-slate-500"
          />
          <datalist id="item-list">
            {items.map((i) => (
              <option key={i} value={i} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Where bought
          <input
            type="text"
            list="vendor-list"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Vendor"
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-base focus:outline-none focus:border-slate-500"
          />
          <datalist id="vendor-list">
            {vendors.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Card / bank
          <input
            type="text"
            list="card-list"
            value={accountMethod}
            onChange={(e) => setAccountMethod(e.target.value)}
            placeholder="e.g. Chase Visa"
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-base focus:outline-none focus:border-slate-500"
          />
          <datalist id="card-list">
            {cards.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <DateInput value={date} onChange={setDate} />
      </div>

      <div className="text-xs text-slate-400">
        Total: <span className="text-slate-200 font-medium">{formatCurrency(total)}</span>
      </div>

      <button
        type="submit"
        className="rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-semibold py-2.5 transition-colors"
      >
        Log expense
      </button>

      {justLogged && (
        <div className="flex items-center justify-between rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm">
          <span className="text-slate-300">
            Logged {formatCurrency(justLogged.price * justLogged.purchases)} · {justLogged.item}
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
