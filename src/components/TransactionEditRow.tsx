import { useState, type FormEvent } from "react";
import { useLedger } from "../state/LedgerContext";
import type { Transaction } from "../types";
import { dateInputToISO, isoToDateInput } from "../utils/date";
import { DateInput } from "./DateInput";
import { Modal } from "./Modal";

export function TransactionEditRow({ transaction, onDone }: { transaction: Transaction; onDone: () => void }) {
  const { transactions, updateTransaction, attachReceipt, removeReceipt, getReceiptUrl, listNames } = useLedger();
  const t = transaction;

  const [bulkCategoryPrompt, setBulkCategoryPrompt] = useState<{
    vendor: string;
    category: string;
    ids: string[];
  } | null>(null);

  const [amount, setAmount] = useState(String(t.amount));
  const [accounts, setAccounts] = useState(String(t.accounts ?? 1));
  const [purchases, setPurchases] = useState(String(t.purchases ?? 1));
  const [item, setItem] = useState(t.item ?? "");
  const [vendor, setVendor] = useState(t.vendor ?? "");
  const [accountMethod, setAccountMethod] = useState(t.accountMethod ?? "");
  const [category, setCategory] = useState(t.category ?? "");
  const [recurring, setRecurring] = useState(t.recurring ?? false);
  const [recurringFrequency, setRecurringFrequency] = useState<Transaction["recurringFrequency"]>(
    t.recurringFrequency ?? "monthly"
  );
  const [date, setDate] = useState(isoToDateInput(t.date));
  const [receiptBusy, setReceiptBusy] = useState(false);

  const vendorOptions = listNames(t.type === "expense" ? "vendor" : "firm");
  const cardOptions = listNames("accountMethod");
  const itemOptions = listNames("item");
  const categoryOptions = listNames("category");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt)) return;
    const isoDate = dateInputToISO(date, t.date);

    if (t.type === "expense") {
      const trimmedVendor = vendor.trim() || undefined;
      const trimmedCategory = category.trim() || undefined;
      updateTransaction(t.id, {
        date: isoDate,
        amount: amt,
        purchases: parseInt(purchases, 10) || 1,
        item: item.trim(),
        vendor: trimmedVendor,
        accountMethod: accountMethod.trim() || undefined,
        category: trimmedCategory,
        recurring,
        recurringFrequency: recurring ? recurringFrequency : undefined,
      });

      if (trimmedCategory && trimmedVendor && trimmedCategory !== (t.category ?? undefined)) {
        const others = transactions.filter(
          (o) =>
            o.type === "expense" &&
            o.id !== t.id &&
            (o.vendor ?? "").trim().toLowerCase() === trimmedVendor.toLowerCase() &&
            (o.category ?? "") !== trimmedCategory
        );
        if (others.length > 0) {
          setBulkCategoryPrompt({ vendor: trimmedVendor, category: trimmedCategory, ids: others.map((o) => o.id) });
          return;
        }
      }
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

  function applyBulkCategory() {
    if (!bulkCategoryPrompt) return;
    for (const id of bulkCategoryPrompt.ids) updateTransaction(id, { category: bulkCategoryPrompt.category });
    setBulkCategoryPrompt(null);
    onDone();
  }

  function dismissBulkCategory() {
    setBulkCategoryPrompt(null);
    onDone();
  }

  async function handleReceiptChange(file: File | null) {
    if (!file) return;
    setReceiptBusy(true);
    try {
      await attachReceipt(t.id, file);
    } catch (err) {
      console.error("Failed to attach receipt:", err);
    } finally {
      setReceiptBusy(false);
    }
  }

  async function handleViewReceipt() {
    if (!t.receiptPath) return;
    try {
      const url = await getReceiptUrl(t.receiptPath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open receipt:", err);
    }
  }

  async function handleRemoveReceipt() {
    setReceiptBusy(true);
    try {
      await removeReceipt(t.id);
    } catch (err) {
      console.error("Failed to remove receipt:", err);
    } finally {
      setReceiptBusy(false);
    }
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
              <input
                type="text"
                list="edit-category-list"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category (for taxes)"
                className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-white text-sm"
              />
              <datalist id="edit-category-list">
                {categoryOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <div className="inline-flex rounded-md bg-slate-900 border border-slate-700 p-1 gap-1 w-fit">
                <button
                  type="button"
                  onClick={() => setRecurring(true)}
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    recurring ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Recurring
                </button>
                <button
                  type="button"
                  onClick={() => setRecurring(false)}
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    !recurring ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-white"
                  }`}
                >
                  One-time
                </button>
              </div>
              {recurring && (
                <div className="inline-flex rounded-md bg-slate-900 border border-slate-700 p-1 gap-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setRecurringFrequency("weekly")}
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      recurringFrequency === "weekly" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurringFrequency("monthly")}
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      recurringFrequency === "monthly" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              )}
            </>
          )}
          <DateInput value={date} onChange={setDate} compact />
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {t.receiptPath ? (
              <>
                <button type="button" onClick={handleViewReceipt} className="text-slate-300 hover:text-white shrink-0">
                  📎 View receipt
                </button>
                <button
                  type="button"
                  onClick={handleRemoveReceipt}
                  disabled={receiptBusy}
                  className="text-slate-500 hover:text-rose-400 shrink-0 disabled:opacity-50"
                >
                  Remove
                </button>
              </>
            ) : (
              <label className="text-slate-500 hover:text-slate-300 cursor-pointer shrink-0">
                {receiptBusy ? "Uploading…" : "+ Attach receipt"}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  disabled={receiptBusy}
                  onChange={(e) => handleReceiptChange(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>
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

      {bulkCategoryPrompt && (
        <Modal title="Apply to other transactions?" onClose={dismissBulkCategory}>
          <div className="flex flex-col gap-3">
            <p className="text-slate-300 text-sm">
              Set category to <span className="font-medium text-white">{bulkCategoryPrompt.category}</span> for{" "}
              {bulkCategoryPrompt.ids.length} other {bulkCategoryPrompt.vendor} expense
              {bulkCategoryPrompt.ids.length === 1 ? "" : "s"} too?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={dismissBulkCategory}
                className="flex-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-sm font-medium py-2 hover:text-white"
              >
                Just this one
              </button>
              <button
                type="button"
                onClick={applyBulkCategory}
                className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-medium py-2"
              >
                Apply to all
              </button>
            </div>
          </div>
        </Modal>
      )}
    </li>
  );
}
