import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((tipo, texto) => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, tipo, texto }]);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 5000);
  }, []);
  const api = { ok: (t) => push('ok', t), error: (t) => push('error', t) };
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => <div key={t.id} className={`toast ${t.tipo}`}>{t.texto}</div>)}
      </div>
    </ToastContext.Provider>
  );
}
