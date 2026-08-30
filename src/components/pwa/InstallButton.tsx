import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle2, Smartphone, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback, type ReactNode } from 'react';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

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
  const [sessionDismissed, setSessionDismissed] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const shouldShowPrompt = useCallback(() => {
    if (isInstalled || sessionDismissed) return false;
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    return !(dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_COOLDOWN_MS);
  }, [isInstalled, sessionDismissed]);

  useEffect(() => {
    if (!shouldShowPrompt()) return;
    if (isInstallable || (isIOS && !isInstalled)) {
      const timer = window.setTimeout(() => setShowModal(true), 2500);
      return () => window.clearTimeout(timer);
    }
  }, [isInstallable, isIOS, isInstalled, shouldShowPrompt]);

  const handleDismiss = useCallback(() => {
    setShowModal(false);
    setSessionDismissed(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  const handleInstall = async () => {
    if (installing) return;
    setInstalling(true);
    const success = await onInstall();
    setInstalling(false);

    if (success) {
      setShowSuccess(true);
      setShowModal(false);
      localStorage.removeItem(DISMISS_KEY);
      window.setTimeout(() => setShowSuccess(false), 4000);
    } else {
      setShowModal(false);
      setShowInstructions(true);
    }
  };

  const closeInstructions = useCallback(() => {
    setShowInstructions(false);
    setSessionDismissed(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  const showIOSInstructions = isIOS && !isInstalled && !isInstallable;

  return (
    <>
      {children && (
        <button
          type="button"
          onClick={() => void handleInstall()}
          disabled={isInstalled || installing}
          aria-label="Install STRYVEN"
          className="group inline-flex items-center gap-2 rounded-full border border-ember-400/30 bg-ink-950/80 px-4 py-2 text-xs font-bold text-ink-100 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-ember-400/60 hover:bg-ember-500/10 hover:shadow-ember-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ember-500/15 text-ember-400 transition-transform duration-200 group-hover:scale-110">
            <Download size={15} />
          </span>
          <span>{isInstalled ? 'Installed' : installing ? 'Installing…' : children}</span>
        </button>
      )}

      <AnimatePresence>
        {showModal && !isInstalled && shouldShowPrompt() && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDismiss} />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 12 }} className="relative card-premium w-full max-w-sm max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-4 sm:p-6">
              <button onClick={handleDismiss} className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200" aria-label="Close">
                <X size={18} />
              </button>
              <div className="mb-4 pr-5 text-center sm:mb-5">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl sm:mb-4 sm:h-16 sm:w-16" style={{ background: 'linear-gradient(135deg,rgba(255,122,24,.2),rgba(232,93,0,.05))' }}>
                  <Sparkles size={26} className="text-ember-400" />
                </div>
                <h3 className="mb-1 font-display text-lg font-bold">Install STRYVEN</h3>
                <p className="text-sm leading-5 text-slate-400">Add STRYVEN to your device for quick access and offline support.</p>
              </div>
              <div className="mb-4 space-y-2 sm:mb-5">
                {['Instant home-screen access', 'Works offline', 'Full-screen experience'].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                    <span>{['⚡', '📱', '🎮'][index]}</span>
                    <span className="text-xs text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleDismiss} className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-semibold text-slate-300">Not Now</button>
                <button onClick={() => void handleInstall()} disabled={installing} className="flex-1 rounded-xl bg-gradient-to-r from-ember-500 to-orange-600 py-3 text-sm font-semibold text-white disabled:opacity-60">
                  {installing ? 'Installing…' : 'Install'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(showIOSInstructions || showInstructions) && !isInstalled && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeInstructions} />
            <div className="relative card-premium w-full max-w-sm max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-5 sm:p-6">
              <button onClick={closeInstructions} className="absolute right-3 top-3 p-1.5 text-slate-400" aria-label="Close"><X size={18} /></button>
              <div className="mb-4 flex items-center gap-3 pr-5">
                <Smartphone size={20} />
                <div><h3 className="font-display text-sm font-bold">Install STRYVEN</h3><p className="text-xs text-slate-400">Add to your home screen</p></div>
              </div>
              <p className="text-sm leading-5 text-slate-300">
                {isIOS ? 'Tap Share in Safari, then choose “Add to Home Screen”.' : 'Your browser did not expose the automatic install prompt. Use the browser menu or address-bar install icon to add STRYVEN to your device.'}
              </p>
              <button onClick={closeInstructions} className="btn-ghost mt-5 w-full">Got it</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed left-1/2 top-3 z-[100] w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2">
            <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 backdrop-blur-xl">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
              <span className="truncate text-sm font-semibold text-emerald-300">STRYVEN installed successfully!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
