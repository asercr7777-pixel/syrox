import { motion, AnimatePresence } from 'framer-motion';

interface FadeTransitionProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
}

export function FadeTransition({ show, children, duration = 0.8 }: FadeTransitionProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ChapterTransitionProps {
  show: boolean;
  chapterNumber: number;
  title: string;
  subtitle: string;
  emoji: string;
}

export function ChapterTransition({ show, chapterNumber, title, subtitle, emoji }: ChapterTransitionProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="text-center"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-6xl md:text-7xl mb-4"
              style={{ filter: 'drop-shadow(0 0 30px rgba(167,139,250,0.5))' }}
            >
              {emoji}
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs uppercase tracking-[0.4em] text-ember-400 mb-2"
            >
              Chapter {chapterNumber}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="font-display text-3xl md:text-5xl font-bold text-white mb-3"
              style={{ textShadow: '0 0 30px rgba(255,122,24,0.4)' }}
            >
              {title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-sm md:text-base text-ink-300 italic max-w-md mx-auto px-4"
            >
              {subtitle}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
