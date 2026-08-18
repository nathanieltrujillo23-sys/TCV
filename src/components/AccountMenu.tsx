import { useState, type FormEvent } from "react";
import { useAuth } from "../state/AuthContext";
import { Modal } from "./Modal";

export function AccountMenu() {
  const { user, businessName, updateBusinessName, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openMenu() {
    setEditing(false);
    setError("");
    setOpen(true);
  }

  function startEdit() {
    setName(businessName ?? "");
    setError("");
    setEditing(true);
  }

  async function saveName(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await updateBusinessName(name);
    setBusy(false);
    if (error) setError(error);
    else setEditing(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        className="text-xs px-2.5 py-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 truncate max-w-[160px]"
      >
        {user?.email ?? "Account"}
      </button>

      {open && (
        <Modal title="Account" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3">
            <p className="text-slate-300 text-sm">
              Signed in as <span className="font-medium text-white">{user?.email}</span>
            </p>

            {!editing && (
              <p className="text-slate-400 text-xs">
                Business name:{" "}
                <span className="text-slate-200">{businessName || "Not set"}</span>
              </p>
            )}

            {editing ? (
              <form onSubmit={saveName} className="flex flex-col gap-2">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Business name"
                  className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-slate-500"
                />
                {error && <p className="text-rose-400 text-xs">{error}</p>}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-sm font-medium py-2 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-sm font-medium py-2"
                  >
                    {busy ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={startEdit}
                className="rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-sm font-medium py-2.5 hover:text-white hover:bg-slate-700"
              >
                Edit business name
              </button>
            )}

            <button
              type="button"
              onClick={signOut}
              className="rounded-lg bg-slate-100 text-slate-900 text-sm font-medium py-2.5 hover:bg-white"
            >
              Sign out
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
