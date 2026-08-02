import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

interface UpdateNotificationProps {
  updateAvailable: boolean;
  onApplyUpdate: () => void;
}

export function UpdateNotification({ updateAvailable, onApplyUpdate }: UpdateNotificationProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleApply = () => {
    onApplyUpdate();
  };

  return (
    <AnimatePresence>
      {updateAvailable && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] w-full max-w-sm px-4"
        >
          <div className="card-premium p-4 flex items-center gap-3" style={{ borderColor: 'rgba(255,122,24,0.3)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,122,24,0.15)' }}>
              <RefreshCw size={18} className="text-ember-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-100">Update Available</p>
              <p className="text-xs text-slate-400">A new version of Discipline is ready</p>
            </div>
            <button
              onClick={handleApply}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition active:scale-95"
              style={{ background: 'linear-gradient(135deg, #ff7a18, #e85d00)' }}
            >
              Update
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
