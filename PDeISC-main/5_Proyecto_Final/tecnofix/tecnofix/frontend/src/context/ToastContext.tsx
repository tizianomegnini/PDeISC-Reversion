import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface ToastContextValue {
  ok: (text: string) => void;
  error: (text: string) => void;
}

interface ToastItem {
  id: string;
  tipo: 'ok' | 'error';
  texto: string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Permite lanzar mensajes temporales de éxito o error desde cualquier vista.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider');
  return context;
}

/**
 * Envuelve la app con un contenedor de toasts y gestiona auto-cierre de cada notification.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((tipo: ToastItem['tipo'], texto: string) => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, tipo, texto }]);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 5000);
  }, []);
  const api: ToastContextValue = { ok: (text) => push('ok', text), error: (text) => push('error', text) };
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => <div key={t.id} className={`toast ${t.tipo}`}>{t.texto}</div>)}
      </div>
    </ToastContext.Provider>
  );
}
