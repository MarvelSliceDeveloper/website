import { useState, useEffect, useCallback } from "react";
import { FiCheck, FiAlertCircle, FiX } from "react-icons/fi";

let toastId = 0;
let addToastFn = null;

export function toast({ type = "success", message, duration = 3000 }) {
  if (addToastFn) addToastFn({ id: ++toastId, type, message, duration });
}

const icons = { success: FiCheck, error: FiAlertCircle };
const styles = {
  success: "bg-success-50 border-success-500 text-success-700",
  error: "bg-destructive-50 border-destructive-500 text-destructive-700",
};

function ToastItem({ t, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, t.duration);
    return () => clearTimeout(timer);
  }, [t, onDone]);

  const Icon = icons[t.type];
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border-l-4 shadow-lg text-sm font-medium animate-in slide-in-from-top ${styles[t.type]}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{t.message}</span>
      <button onClick={onDone} className="p-0.5 opacity-60 hover:opacity-100 transition-opacity">
        <FiX className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [items, setItems] = useState([]);

  const add = useCallback((t) => {
    setItems((prev) => [...prev, t]);
  }, []);

  useEffect(() => {
    addToastFn = add;
    return () => { addToastFn = null; };
  }, [add]);

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {items.map((t) => (
        <ToastItem key={t.id} t={t} onDone={() => remove(t.id)} />
      ))}
    </div>
  );
}
