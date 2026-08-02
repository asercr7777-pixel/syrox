import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle2, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';

interface InstallButtonProps {
  isInstallable: boolean;
  isInstalled: boolean;
  onInstall: () => Promise<boolean>;
}

export function InstallButton({ isInstallable, isInstalled, onInstall }: InstallButtonProps) {
  const [showButton, setShowButton] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed || isInstalled) {
      setShowButton(false);
      return;
    }
    if (isInstallable) {
      const timer = setTimeout(() => setShowButton(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, dismissed]);

  const handleInstall = async () => {
    if (installing) return;
    setInstalling(true);
    const success = await onInstall();
    setInstalling(false);
    if (success) {
      setShowSuccess(true);
      setShowButton(false);
      setTimeout(() => setShowSuccess(false), 4000);
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const showIOSInstructions = isIOS && !isInstalled && !isInstallable;

  return (
    <>
      {/* Floating Install Button */}
      <AnimatePresence>
        {showButton && !isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.8 }}
            transition={{ type: 'spring', duration: 0.6, bounce: 0.4 }}
            className="fixed bottom-20 lg:bottom-6 right-4 z-50"
          >
            <div className="relative">
              {/* Pulsing glow */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl"
                style={{ background: 'radial-gradient(circle, rgba(255,122,24,0.4), transparent 70%)' }}
              />
              <div className="relative flex items-center gap-2">
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95 disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #ff7a18, #e85d00)',
                    boxShadow: '0 8px 24px rgba(255,122,24,0.3)',
                  }}
                >
                  {installing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <Download size={18} />
                  )}
                  <span>Install App</span>
                </button>
                <button
                  onClick={() => {
                    setShowButton(false);
                    setDismissed(true);
                  }}
                  className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-slate-200 transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Instructions Modal */}
      <AnimatePresence>
        {(showIOSInstructions || showInstructions) && !isInstalled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowInstructions(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative card-premium p-6 max-w-sm w-full"
            >
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
                  <p>Tap the install button that appears in your browser's address bar, or use the "Install App" button.</p>
                )}
              </div>
              <button
                onClick={() => setShowInstructions(false)}
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

      {/* Manual trigger for iOS — hidden button in settings area */}
      {showIOSInstructions && !showInstructions && !showButton && !dismissed && (
        <button
          onClick={() => setShowInstructions(true)}
          className="fixed bottom-20 lg:bottom-6 right-4 z-40 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 backdrop-blur-xl flex items-center gap-2"
        >
          <Download size={14} /> Install
        </button>
      )}
    </>
  );
}
