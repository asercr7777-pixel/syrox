import { motion } from 'framer-motion';
import type { Emotion } from '../../data/story/types';
import { getShadowImage, type ShadowState } from '../../lib/story/shadowReactions';

const EMOTION_EMOJIS: Record<Emotion, string> = {
  neutral: '🙂', happy: '😊', serious: '😤', excited: '🔥', mysterious: '👁️', angry: '😠', sad: '😢', fear: '😨',
};

const SPEAKER_AVATARS: Record<string, string> = {
  Narrator: '📜', Shadow: '🌑', Kael: '💰', Lyra: '⚔️', Oren: '🧍', Malakai: '💀', Guardian: '🏛️', Boss: '👹', Player: '🧙',
};

function shadowStateForEmotion(emotion: Emotion): ShadowState {
  if (emotion === 'angry') return 'threat';
  if (emotion === 'excited' || emotion === 'happy') return 'power';
  if (emotion === 'sad') return 'memory';
  if (emotion === 'fear') return 'warning';
  if (emotion === 'serious') return 'command';
  if (emotion === 'mysterious') return 'observing';
  return 'idle';
}

interface PortraitProps {
  speaker: string;
  emotion?: Emotion;
  isActive: boolean;
  side: 'left' | 'right';
}

export function Portrait({ speaker, emotion = 'neutral', isActive, side }: PortraitProps) {
  const isShadow = speaker.toLowerCase() === 'shadow';
  const isBoss = speaker === 'Boss';
  const avatar = SPEAKER_AVATARS[speaker] ?? '🎭';
  const emotionEmoji = EMOTION_EMOJIS[emotion];
  const shadowImage = isShadow ? getShadowImage(shadowStateForEmotion(emotion)) : '';

  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -50 : 50, scale: 0.8 }}
      animate={{ opacity: isActive ? 1 : 0.4, x: 0, scale: isActive ? 1 : 0.95 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className={`relative flex-shrink-0 ${isBoss ? 'scale-110' : ''}`}
    >
      <div className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-500 ${isActive ? 'opacity-60' : 'opacity-20'}`} style={{ background: isBoss ? 'radial-gradient(circle, #dc2626, transparent 70%)' : 'radial-gradient(circle, #a78bfa, transparent 70%)' }} />
      <div className={`relative h-20 w-20 overflow-hidden rounded-full border-2 transition-all duration-300 md:h-24 md:w-24 ${isActive ? 'border-white/40' : 'border-white/10'}`} style={{ background: isBoss ? 'radial-gradient(circle at 30% 30%, #4a0a0a, #1a0a0a)' : 'radial-gradient(circle at 30% 30%, #2a2a4a, #0a0a1a)', boxShadow: isActive ? (isBoss ? '0 0 30px rgba(220,38,38,0.5)' : '0 0 25px rgba(167,139,250,0.4)') : 'none' }}>
        {isShadow ? <img src={shadowImage} alt={`Shadow, ${shadowStateForEmotion(emotion)} state`} className="h-full w-full object-cover object-center" loading="eager" onError={(event) => { if (event.currentTarget.src.endsWith('/shadow_standing.png.jpg')) return; event.currentTarget.src = getShadowImage('standing'); }} /> : <div className="flex h-full w-full items-center justify-center text-4xl md:text-5xl">{avatar}</div>}
        {emotion !== 'neutral' && <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-ink-900 text-lg">{emotionEmoji}</div>}
      </div>
      <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold transition-colors ${isActive ? 'text-white' : 'text-ink-400'}`}>{speaker}</div>
    </motion.div>
  );
}