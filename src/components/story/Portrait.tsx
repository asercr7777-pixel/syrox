import { motion } from 'framer-motion';
import type { Emotion } from '../../data/story/types';

const EMOTION_EMOJIS: Record<Emotion, string> = {
  neutral: '🙂',
  happy: '😊',
  serious: '😤',
  excited: '🔥',
  mysterious: '👁️',
  angry: '😠',
  sad: '😢',
  fear: '😨',
};

const SPEAKER_AVATARS: Record<string, string> = {
  Narrator: '📜',
  Shadow: '🌑',
  Kael: '💰',
  Lyra: '⚔️',
  Oren: '🧍',
  Malakai: '💀',
  Guardian: '🏛️',
  Boss: '👹',
  Player: '🧙',
};

interface PortraitProps {
  speaker: string;
  emotion?: Emotion;
  isActive: boolean;
  side: 'left' | 'right';
}

export function Portrait({ speaker, emotion = 'neutral', isActive, side }: PortraitProps) {
  const avatar = SPEAKER_AVATARS[speaker] ?? '🎭';
  const emotionEmoji = EMOTION_EMOJIS[emotion];
  const isBoss = speaker === 'Boss';

  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -50 : 50, scale: 0.8 }}
      animate={{
        opacity: isActive ? 1 : 0.4,
        x: 0,
        scale: isActive ? 1 : 0.95,
      }}
      transition={{ type: 'spring', duration: 0.5 }}
      className={`relative flex-shrink-0 ${isBoss ? 'scale-110' : ''}`}
    >
      {/* Glow ring */}
      <div
        className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-500 ${
          isActive ? 'opacity-60' : 'opacity-20'
        }`}
        style={{
          background: isBoss
            ? 'radial-gradient(circle, #dc2626, transparent 70%)'
            : 'radial-gradient(circle, #a78bfa, transparent 70%)',
        }}
      />
      {/* Portrait circle */}
      <div
        className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-4xl md:text-5xl border-2 transition-all duration-300 ${
          isActive ? 'border-white/40' : 'border-white/10'
        }`}
        style={{
          background: isBoss
            ? 'radial-gradient(circle at 30% 30%, #4a0a0a, #1a0a0a)'
            : 'radial-gradient(circle at 30% 30%, #2a2a4a, #0a0a1a)',
          boxShadow: isActive
            ? isBoss
              ? '0 0 30px rgba(220,38,38,0.5)'
              : '0 0 25px rgba(167,139,250,0.4)'
            : 'none',
        }}
      >
        {avatar}
        {/* Emotion indicator */}
        {emotion !== 'neutral' && (
          <div className="absolute -bottom-1 -right-1 text-lg bg-ink-900 rounded-full w-7 h-7 flex items-center justify-center border border-white/20">
            {emotionEmoji}
          </div>
        )}
      </div>
      {/* Name label */}
      <div
        className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap transition-colors ${
          isActive ? 'text-white' : 'text-ink-400'
        }`}
      >
        {speaker}
      </div>
    </motion.div>
  );
}
