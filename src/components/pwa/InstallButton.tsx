import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle2, Smartphone, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

interface InstallButtonProps {
  isInstallable: boolean;
  isInstalled: boolean;
  onInstall: () => Promise<boolean>;
}

export function InstallButton({ isInstallable, isInstalled, onInstall }: InstallButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sessionDismissed, setSessionDismissed] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const shouldShowPrompt = useCallback(() => {
    if (isInstalled || sessionDismissed) return false;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return false;
    }
    return true;
  }, [isInstalled, sessionDismissed]);

  useEffect(() => {
    if (!shouldShowPrompt()) return;
    if (isInstallable || (isIOS && !isInstalled)) {
      const timer = setTimeout(() => setShowModal(true), 2500);
      return () => clearTimeout(timer);
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
      setTimeout(() => setShowSuccess(false), 4000);
    } else {
      setShowModal(false);
      setShowInstructions(true);
    }
  };

  const handleInstallClick = useCallback(() => {
    void handleInstall();
  }, []);

  const closeInstructions = useCallback(() => {
    setShowInstructions(false);
    setSessionDismissed(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  const showIOSInstructions = isIOS && !isInstalled && !isInstallable;

  return (
    <>
      {/* Centered Install Modal */}
      <AnimatePresence>
        {showModal && !isInstalled && shouldShowPrompt() && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDismiss} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
              className="relative card-premium p-6 max-w-sm w-full"
            >
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>

              <div className="text-center mb-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(255,122,24,0.2), rgba(232,93,0,0.05))' }}
                >
                  <Sparkles size={28} className="text-ember-400" />
                </div>
                <h3 className="font-display font-bold text-lg mb-1">Install Discipline</h3>
                <p className="text-sm text-slate-400">
                  Add the app to your device for quick access, offline support, and a native experience.
                </p>
              </div>

              <div className="space-y-2 mb-5">
                {[
                  { icon: '⚡', text: 'Instant access from your home screen' },
                  { icon: '📱', text: 'Works offline — no internet needed' },
                  { icon: '🎮', text: 'Full-screen immersive experience' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
                    <span className="text-lg">{feature.icon}</span>
                    <span className="text-xs text-slate-300">{feature.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition"
                >
                  Not Now
                </button>
                <button
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #ff7a18, #e85d00)',
                    boxShadow: '0 4px 16px rgba(255,122,24,0.3)',
                  }}
                >
                  {installing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <Download size={16} />
                  )}
                  Install
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS / Manual Install Instructions Modal */}
      <AnimatePresence>
        {(showIOSInstructions || showInstructions) && !isInstalled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeInstructions} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative card-premium p-6 max-w-sm w-full"
            >
              <button
                onClick={closeInstructions}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,122,24,0.15)' }}>
                  <Smartphone size={20} className="text-ember-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm">Install Discipline</h3>
                  <p className="text-xs text-slate-400">Add to your home screen</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                {isIOS ? (
                  <>
                    <div className="flex items-start gap-2.5">
                      <span className="text-ember-400 font-bold text-lg leading-none">1.</span>
                      <p>Tap the <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono">Share</span> button in Safari</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-ember-400 font-bold text-lg leading-none">2.</span>
                      <p>Select <span className="font-semibold text-ember-400">"Add to Home Screen"</span></p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-ember-400 font-bold text-lg leading-none">3.</span>
                      <p>Tap <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono">Add</span> to install</p>
                    </div>
                  </>
                ) : (
                  <p>Tap the install button that appears in your browser's address bar, or use the menu option "Install app".</p>
                )}
              </div>
              <button
                onClick={closeInstructions}
                className="btn-ghost w-full mt-5 text-sm"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-300">App installed successfully!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
