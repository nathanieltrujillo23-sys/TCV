import { useMemo, useRef, useState } from "react";
import { useLedger } from "../state/LedgerContext";
import { Modal } from "./Modal";
import { Segmented } from "./Segmented";
import { parseImportText } from "../utils/importParse";
import { extractTextFromPdf } from "../utils/pdfExtract";
import { formatCurrency } from "../utils/format";
import type { TransactionType } from "../types";

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

export function ImportPanel() {
  const { addTransaction, primaryView } = useLedger();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [defaultType, setDefaultType] = useState<TransactionType>(primaryView);
  const [isDragging, setIsDragging] = useState(false);
  const [imported, setImported] = useState<number | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { rows, skippedLines } = useMemo(() => parseImportText(text, defaultType), [text, defaultType]);

  function openPanel() {
    setDefaultType(primaryView);
    setText("");
    setImported(null);
    setFileError(null);
    setOpen(true);
  }

  function readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  async function readFile(file: File) {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    setFileError(null);

    if (!isPdf) {
      setText(await readTextFile(file));
      return;
    }

    setIsExtracting(true);
    try {
      const extracted = await extractTextFromPdf(file);
      if (!extracted.trim()) {
        setFileError("Couldn't find any text in that PDF — it may be a scanned image without a text layer.");
      } else {
        setText(extracted);
      }
    } catch {
      setFileError("Couldn't read that PDF. Try a different file, or paste the rows as text instead.");
    } finally {
      setIsExtracting(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  }

  function handleImport() {
    // Every row goes through addTransaction, the same path manual entry
    // uses, so imported rows register into managed lists and the audit log
    // exactly as if they'd been typed into the form.
    for (const row of rows) {
      addTransaction({
        type: row.type,
        date: row.date,
        amount: row.amount,
        accounts: row.type === "income" ? row.multiplier : undefined,
        purchases: row.type === "expense" ? row.multiplier : undefined,
        item: row.item,
        vendor: row.vendor,
        accountMethod: row.accountMethod,
      });
    }
    setImported(rows.length);
    setText("");
  }

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className="text-xs px-2.5 py-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
      >
        Import
      </button>

      {open && (
        <Modal title="Import transactions" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3">
            <p className="text-slate-400 text-xs">
              Drop a CSV/text/PDF file or paste rows below. A header row (type, date, amount, item, vendor, card,
              accounts/purchases) is auto-detected in any order — otherwise, for the default type below, rows are
              read as <span className="text-slate-300">Amount, Accounts, Source, Date</span> (income) or{" "}
              <span className="text-slate-300">Price, Purchases, Item, Vendor, Card/Bank, Date</span> (expense). PDFs
              work best when they're a table like this app's own exports — scanned images without selectable text
              can't be read.
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Default type:</span>
              <Segmented options={TYPE_OPTIONS} value={defaultType} onChange={setDefaultType} />
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !isExtracting && fileInputRef.current?.click()}
              className={`rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${
                isExtracting ? "cursor-wait" : "cursor-pointer"
              } ${
                isDragging ? "border-emerald-400 bg-emerald-400/5 text-emerald-300" : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {isExtracting ? "Reading PDF…" : "Drop a file here, or click to choose one"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.pdf,text/csv,text/plain,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) readFile(file);
                  e.target.value = "";
                }}
              />
            </div>

            {fileError && <p className="text-amber-400 text-xs">{fileError}</p>}

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                defaultType === "expense"
                  ? "42.50, 1, Coffee, Blue Bottle, Chase Visa, 2026-08-01\n12.00, 3, Snacks, Vending, Cash"
                  : "150, 3, Apex Prop Firm, 2026-08-01\n75, 1, FTMO"
              }
              rows={6}
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-slate-500"
            />

            {text.trim().length > 0 && (
              <div className="rounded-lg bg-slate-900 border border-slate-700 p-3 text-sm">
                <p className="text-slate-300 mb-2">
                  Detected <span className="font-semibold text-white">{rows.length}</span> transaction
                  {rows.length === 1 ? "" : "s"}
                  {skippedLines.length > 0 && (
                    <span className="text-amber-400">
                      {" "}
                      · {skippedLines.length} skipped (no valid amount)
                    </span>
                  )}
                </p>
                <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {rows.slice(0, 8).map((r, i) => (
                    <li key={i} className="text-xs text-slate-400 flex justify-between gap-2">
                      <span className="truncate">
                        {r.type === "expense" ? r.item || "—" : r.vendor || "—"}
                        {r.type === "expense" && r.vendor ? ` · ${r.vendor}` : ""}
                      </span>
                      <span className={r.type === "income" ? "text-emerald-400" : "text-rose-400"}>
                        {formatCurrency(r.amount * (r.multiplier ?? 1))}
                      </span>
                    </li>
                  ))}
                  {rows.length > 8 && <li className="text-xs text-slate-500">+{rows.length - 8} more</li>}
                </ul>

                {skippedLines.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-amber-400 text-xs mb-1">
                      Couldn't read these lines — nothing was dropped, fix and re-paste to include them:
                    </p>
                    <ul className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                      {skippedLines.map((line, i) => (
                        <li key={i} className="text-xs text-slate-500 font-mono truncate">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {imported !== null && (
              <p className="text-emerald-400 text-sm">Imported {imported} transaction{imported === 1 ? "" : "s"}.</p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm px-3 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rows.length === 0}
                onClick={handleImport}
                className="rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-semibold px-4 py-2 text-sm"
              >
                Import {rows.length > 0 ? rows.length : ""}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
