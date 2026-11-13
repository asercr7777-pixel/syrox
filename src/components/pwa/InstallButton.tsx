import { Download, X, CheckCircle2, Smartphone, Shield, Zap, Layers } from 'lucide-react';
import { useState, useCallback, useEffect, type ReactNode } from 'react';

const DISMISS_KEY = 'pwa-install-dismissed';

interface InstallButtonProps {
  isInstallable: boolean;
  isInstalled: boolean;
  onInstall: () => Promise<boolean>;
  children?: ReactNode;
}

export function InstallButton({ isInstallable, isInstalled, onInstall, children }: InstallButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);

  const handleDismiss = useCallback(() => {
    setShowModal(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      /* storage may be blocked */
    }
  }, []);

  const closeInstructions = useCallback(() => {
    setShowInstructions(false);
  }, []);

  useEffect(() => {
    if (!showModal && !showInstructions) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showModal) handleDismiss();
        if (showInstructions) closeInstructions();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showModal, showInstructions, handleDismiss, closeInstructions]);

  const handleInstall = async () => {
    if (installing || isInstalled) return;
    setShowModal(false);
    setInstalling(true);
    try {
      const success = await Promise.race<boolean>([
        onInstall(),
        new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), 30000)),
      ]);
      if (success) {
        setShowSuccess(true);
        try {
          localStorage.removeItem(DISMISS_KEY);
        } catch {
          /* storage may be blocked */
        }
        window.setTimeout(() => setShowSuccess(false), 4000);
      } else if (!isInstalled) {
        setShowInstructions(true);
      }
    } catch {
      if (!isInstalled) setShowInstructions(true);
    } finally {
      setInstalling(false);
    }
  };

  const openInstallDialog = () => {
    if (isInstalled || installing) return;
    if (isIOS && !isInstallable) {
      setShowInstructions(true);
      return;
    }
    setShowModal(true);
  };

  return (
    <>
      {children && (
        <button
          type="button"
          onClick={openInstallDialog}
          disabled={isInstalled || installing}
          aria-label="Install STRYVEN"
          className="btn-ghost gap-2.5 text-xs uppercase tracking-wider"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-ember-500/35 bg-ember-500/15 text-frost-400">
            <Download size={14} />
          </span>
          <span>{isInstalled ? 'Installed' : installing ? 'Installing…' : children}</span>
        </button>
      )}

      {showModal && !isInstalled && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Install STRYVEN App"
          className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto p-3 sm:p-4"
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={handleDismiss} />
          <div className="relative w-full max-w-sm sv-surface p-5 sm:p-6">
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute right-3 top-3 h-10 w-10 rounded-xl flex items-center justify-center text-ink-400 hover:bg-white/5 hover:text-ink-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="mb-5 pr-6 text-center">
              <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border border-ember-500/35 bg-ember-500/15">
                <Shield size={26} className="text-ember-400" />
              </div>
              <span className="eyebrow-label text-frost-400">PWA INSTALLATION</span>
              <h3 className="mt-1 font-display text-lg font-bold text-ink-100">Install STRYVEN</h3>
              <p className="mt-1 text-xs leading-5 text-ink-400">
                Add STRYVEN to your device for dedicated full-screen access and offline resilience.
              </p>
            </div>
            <div className="mb-5 space-y-2">
              {[
                { icon: Zap, label: 'Instant launch from home screen or desktop' },
                { icon: Layers, label: 'Offline cache support across sessions' },
                { icon: Smartphone, label: 'Dedicated distraction-free window' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2.5"
                  >
                    <Icon size={15} className="shrink-0 text-frost-400" />
                    <span className="text-xs text-ink-200">{item.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2.5">
              <button type="button" onClick={handleDismiss} className="btn-ghost flex-1">
                Not Now
              </button>
              <button
                type="button"
                onClick={() => void handleInstall()}
                disabled={installing}
                className="btn-primary flex-1"
              >
                {installing ? 'Installing…' : isInstallable ? 'Install App' : 'How to Install'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInstructions && !isInstalled && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Manual install instructions"
          className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto p-3 sm:p-4"
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closeInstructions} />
          <div className="relative w-full max-w-sm sv-surface p-5 sm:p-6">
            <button
              type="button"
              onClick={closeInstructions}
              className="absolute right-3 top-3 h-10 w-10 rounded-xl flex items-center justify-center text-ink-400 hover:bg-white/5 hover:text-ink-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="mb-4 flex items-center gap-3 pr-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-frost-500/30 bg-frost-500/10 text-frost-400">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-ink-100">Install STRYVEN</h3>
                <p className="text-xs text-ink-400">Browser home-screen installation</p>
              </div>
            </div>
            <p className="text-xs leading-6 text-ink-300">
              {isIOS
                ? 'Tap the Share icon in Safari, then choose “Add to Home Screen” to install STRYVEN.'
                : 'Your browser did not expose an automatic install prompt in this view. Open the browser menu or address-bar install icon and select “Install STRYVEN” or “Add to Home Screen”.'}
            </p>
            <button type="button" onClick={closeInstructions} className="btn-primary mt-5 w-full">
              Got it
            </button>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed left-1/2 top-4 z-[100001] w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2">
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/40 bg-ink-950/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
            <span className="truncate text-xs font-bold text-emerald-300">STRYVEN installed successfully!</span>
          </div>
        </div>
      )}
    </>
  );
}
