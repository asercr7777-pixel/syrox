import { useEffect, useState, useRef } from 'react';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'info' | 'reward';
  icon?: string;
}

let listeners: ((t: ToastItem) => void)[] = [];

export function toast(t: Omit<ToastItem, 'id'>) {
  const item: ToastItem = { ...t, id: Math.random().toString(36).slice(2) };
  listeners.forEach((l) => l(item));
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const listener = (t: ToastItem) => {
      setItems((prev) => [...prev, t]);
      const timeoutId = setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== t.id));
        timeoutsRef.current.delete(timeoutId);
      }, 4000);
      timeoutsRef.current.add(timeoutId);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current.clear();
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={`card p-3.5 flex items-start gap-3 animate-slide-up pointer-events-auto ${
            t.type === 'reward' ? 'border-gold-500/40' : t.type === 'error' ? 'border-danger-500/40' : 'border-ember-500/30'
          }`}
        >
          {t.icon && <span className="text-2xl">{t.icon}</span>}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{t.title}</p>
            {t.message && <p className="text-xs text-ink-300 mt-0.5">{t.message}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
