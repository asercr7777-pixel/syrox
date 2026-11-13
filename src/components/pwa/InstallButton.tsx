import { Download, X, CheckCircle2, Smartphone, Shield, Zap, Layers } from 'lucide-react';
import { useState, useCallback, type ReactNode } from 'react';

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

  const closeInstructions = useCallback(() => {
    setShowInstructions(false);
  }, []);

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
          className="group inline-flex items-center gap-2.5 rounded-xl border border-[#a78bfa]/35 bg-[#0b0e18]/90 px-4 py-2.5 text-xs font-bold tracking-wider uppercase text-[#eef2ff] shadow-lg shadow-black/30 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5cecff]/60 hover:bg-[#121725] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#a78bfa]/30 bg-[#a78bfa]/15 text-[#5cecff] transition-transform duration-200 group-hover:scale-105">
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
          className="pwa-install-overlay fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto p-3 sm:p-4"
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={handleDismiss} />
          <div className="relative w-full max-w-sm rounded-2xl border border-[#a78bfa]/35 bg-gradient-to-b from-[#121725] to-[#0b0e18] p-5 sm:p-6 shadow-2xl">
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="mb-5 pr-5 text-center">
              <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#a78bfa]/35 bg-[#a78bfa]/15">
                <Shield size={26} className="text-[#a78bfa]" />
              </div>
              <span className="block font-mono text-[10px] font-bold tracking-widest text-[#5cecff] uppercase">
                PWA INSTALLATION
              </span>
              <h3 className="mt-1 font-display text-lg font-bold text-white">Install STRYVEN</h3>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Add STRYVEN to your device for dedicated full-screen access and offline resilience.
              </p>
            </div>
            <div className="mb-5 space-y-2">
              {[
                { icon: Zap, label: 'Instant launch from home screen or desktop' },
                { icon: Layers, label: 'Works cleanly with cached offline shell' },
                { icon: Smartphone, label: 'Dedicated distraction-free window' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#070a12]/70 px-3 py-2.5"
                  >
                    <Icon size={15} className="shrink-0 text-[#5cecff]" />
                    <span className="text-xs text-slate-200">{item.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleDismiss}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Not Now
              </button>
              <button
                type="button"
                onClick={() => void handleInstall()}
                disabled={installing}
                className="flex-1 rounded-xl border border-[#a78bfa]/50 bg-gradient-to-r from-[#7544d8] to-[#3b5bdb] py-2.5 text-xs font-bold text-white shadow-lg shadow-[#7544d8]/25 hover:brightness-110 disabled:opacity-60"
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
          className="pwa-install-overlay fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto p-3 sm:p-4"
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closeInstructions} />
          <div className="relative w-full max-w-sm rounded-2xl border border-[#5cecff]/30 bg-gradient-to-b from-[#121725] to-[#0b0e18] p-5 sm:p-6 shadow-2xl">
            <button
              type="button"
              onClick={closeInstructions}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="mb-4 flex items-center gap-3 pr-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#5cecff]/30 bg-[#5cecff]/10 text-[#5cecff]">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white">Install STRYVEN</h3>
                <p className="text-xs text-slate-400">Browser home-screen installation</p>
              </div>
            </div>
            <p className="text-xs leading-6 text-slate-300">
              {isIOS
                ? 'Tap the Share icon in Safari, then choose “Add to Home Screen” to install STRYVEN.'
                : 'Your browser did not expose an automatic install prompt in this view. Open the browser menu (⋮ or address-bar install icon) and select “Install STRYVEN” or “Add to Home Screen”.'}
            </p>
            <button
              type="button"
              onClick={closeInstructions}
              className="mt-5 w-full rounded-xl border border-[#a78bfa]/40 bg-[#a78bfa]/15 py-2.5 text-xs font-bold text-[#eef2ff] hover:bg-[#a78bfa]/25"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="pwa-success fixed left-1/2 top-4 z-[100001] w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2">
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/40 bg-[#0b0e18]/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
            <span className="truncate text-xs font-bold text-emerald-300">STRYVEN installed successfully!</span>
          </div>
        </div>
      )}
    </>
  );
}
