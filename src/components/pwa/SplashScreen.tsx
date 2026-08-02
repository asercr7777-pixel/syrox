import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setExiting(true);
          setTimeout(onComplete, 600);
          return 100;
        }
        return p + 4;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: 'linear-gradient(180deg, #0a0c14 0%, #14141f 50%, #0a0c14 100%)' }}
        >
          {/* Ambient glow */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(255,122,24,0.12), transparent 60%)' }}
          />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-8"
          >
            {/* Glow ring */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-8 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(255,122,24,0.3), transparent 70%)' }}
            />
            {/* Flame icon */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #1a1e2e, #0a0c14)',
                border: '1px solid rgba(255,122,24,0.2)',
                boxShadow: '0 0 40px rgba(255,122,24,0.15)',
              }}
            >
              <svg width="48" height="48" viewBox="0 0 512 512" fill="none">
                <defs>
                  <linearGradient id="splashFlame" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#ffd9b3" />
                    <stop offset="40%" stopColor="#ff7a18" />
                    <stop offset="100%" stopColor="#c44600" />
                  </linearGradient>
                </defs>
                <g transform="translate(256 280)" filter="url(#splashGlow)">
                  <path d="M0 -120 C-35 -80 -55 -40 -55 0 C-55 50 -30 90 0 110 C30 90 55 50 55 0 C55 -40 35 -80 0 -120 Z" fill="url(#splashFlame)" />
                  <path d="M0 -80 C-20 -50 -32 -20 -32 10 C-32 45 -15 75 0 90 C15 75 32 45 32 10 C32 -20 20 -50 0 -80 Z" fill="#ff9a3c" opacity="0.7" />
                  <path d="M0 -40 C-10 -20 -16 -5 -16 12 C-16 35 -8 55 0 65 C8 55 16 35 16 12 C16 -5 10 -20 0 -40 Z" fill="#ffd9b3" opacity="0.5" />
                </g>
                <filter id="splashGlow">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </svg>
            </motion.div>
          </motion.div>

          {/* App name */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="font-display text-2xl font-bold tracking-[0.15em] mb-2"
            style={{ color: '#e6eaf5', textShadow: '0 0 20px rgba(255,122,24,0.3)' }}
          >
            DISCIPLINE
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-xs text-slate-500 tracking-widest uppercase mb-10"
          >
            Rise
          </motion.p>

          {/* Progress bar */}
          <div className="w-44 h-0.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #ff9a3c, #ff7a18)', boxShadow: '0 0 8px rgba(255,122,24,0.5)' }}
            />
          </div>

          {/* Loading text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-[10px] text-slate-600 mt-4 tracking-wide"
          >
            Loading your journey...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
