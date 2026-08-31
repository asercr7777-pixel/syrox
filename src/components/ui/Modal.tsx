import { type ReactNode, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', handleEsc);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleEsc]);

  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div
        className={`relative w-full ${sizeClass} max-h-[calc(100vh-1.5rem)] sm:max-h-[88vh] overflow-y-auto overflow-x-hidden rounded-2xl bg-ink-950/95 border border-white/10 shadow-2xl p-4 sm:p-5 animate-slide-up`}
      >
        {title ? (
          <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
            <h3 className="font-display text-lg font-bold min-w-0 truncate">{title}</h3>
            <button
              aria-label="Close modal"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 p-2 rounded-lg hover:bg-white/10 transition z-10"
          >
            <X size={18} />
          </button>
        )}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-ink-200 mb-5">{message}</p>
      <div className="flex gap-2 justify-end flex-wrap">
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }} className={danger ? 'btn-danger' : 'btn-primary'}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
