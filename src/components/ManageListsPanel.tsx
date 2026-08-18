import { useState } from "react";
import { useLedger } from "../state/LedgerContext";
import { Modal } from "./Modal";
import { Segmented } from "./Segmented";
import type { ManagedListCategory } from "../types";

const CATEGORY_OPTIONS: { value: ManagedListCategory; label: string }[] = [
  { value: "item", label: "Items" },
  { value: "vendor", label: "Vendors" },
  { value: "accountMethod", label: "Cards / Banks" },
  { value: "firm", label: "Firms" },
  { value: "category", label: "Categories" },
];

export function ManageListsPanel() {
  const { managedLists, addManagedItem, renameManagedItem, deleteManagedItem } = useLedger();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ManagedListCategory>("vendor");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const items = managedLists.filter((m) => m.category === category).sort((a, b) => a.name.localeCompare(b.name));

  function handleAdd() {
    if (!newName.trim()) return;
    addManagedItem(category, newName);
    setNewName("");
  }

  function startEdit(id: string, name: string) {
    setEditingId(id);
    setEditingName(name);
  }

  function commitEdit() {
    if (editingId) renameManagedItem(editingId, editingName);
    setEditingId(null);
    setEditingName("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs px-2.5 py-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
      >
        Lists
      </button>

      {open && (
        <Modal title="Manage lists" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3">
            <Segmented options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />

            <ul className="flex flex-col divide-y divide-slate-700 max-h-64 overflow-y-auto rounded-lg border border-slate-700">
              {items.length === 0 && <li className="text-slate-500 text-xs px-3 py-3">No entries yet.</li>}
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  {editingId === item.id ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 rounded-md bg-slate-900 border border-slate-600 px-2 py-1 text-sm text-white"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(item.id, item.name)}
                      className="flex-1 text-left text-sm text-slate-200 hover:text-white truncate"
                    >
                      {item.name}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteManagedItem(item.id)}
                    aria-label={`Delete ${item.name}`}
                    className="text-slate-600 hover:text-rose-400 text-xs shrink-0"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Add new…"
                className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500"
              />
              <button
                type="button"
                onClick={handleAdd}
                className="rounded-md bg-slate-100 text-slate-900 text-sm font-medium px-3 py-2 hover:bg-white"
              >
                Add
              </button>
            </div>
            <p className="text-slate-500 text-xs">
              Renaming updates existing entries; deleting only removes it from future suggestions.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
