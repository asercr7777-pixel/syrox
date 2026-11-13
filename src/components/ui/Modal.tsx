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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 animate-fade-in"
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${sizeClass} max-h-[calc(100dvh-1.5rem)] sm:max-h-[88dvh] overflow-y-auto overflow-x-hidden sv-surface p-4 sm:p-6 animate-slide-up`}
      >
        {title ? (
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-display text-lg font-bold text-ink-100 min-w-0 truncate">{title}</h3>
            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              className="h-11 w-11 rounded-xl flex items-center justify-center text-ink-300 hover:bg-white/10 hover:text-ink-100 transition shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 h-11 w-11 rounded-xl flex items-center justify-center text-ink-300 hover:bg-white/10 hover:text-ink-100 transition z-10"
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
  closeOnConfirm?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger,
  closeOnConfirm = true,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-ink-300 leading-relaxed mb-5">{message}</p>
      <div className="flex gap-2.5 justify-end flex-wrap">
        <button type="button" onClick={onClose} className="btn-ghost">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            if (closeOnConfirm) onClose();
          }}
          className={danger ? 'btn-danger' : 'btn-primary'}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
