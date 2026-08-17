import { useState } from "react";
import { useAuth } from "../state/AuthContext";
import { Modal } from "./Modal";

export function AccountMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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
