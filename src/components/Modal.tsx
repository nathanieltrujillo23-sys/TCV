import type { ReactNode } from "react";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-slate-800 border border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-100 font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-sm">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
