import { useEffect, useRef } from "react";
import { FiAlertTriangle } from "react-icons/fi";

export default function ConfirmDialog({ open, title = "Confirm", message = "Are you sure?", confirmLabel = "Delete", onConfirm, onCancel, destructive = true }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    confirmRef.current?.focus();
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm cursor-pointer" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-admin-200 max-h-[85vh] overflow-y-auto" role="dialog" aria-modal="true">
        <div className="w-10 h-10 rounded-full bg-destructive-50 flex items-center justify-center mb-4">
          <FiAlertTriangle className="w-5 h-5 text-destructive-500" />
        </div>
        <h3 className="text-base font-semibold text-black mb-1">{title}</h3>
        <p className="text-sm text-neutral-500 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-admin-700 hover:bg-admin-100 transition-all">
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-all shadow-sm ${destructive ? "bg-destructive-500 hover:bg-destructive-700" : "bg-admin-600 hover:bg-admin-700"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
