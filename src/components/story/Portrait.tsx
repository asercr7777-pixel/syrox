import { motion } from 'framer-motion';
import type { Emotion } from '../../data/story/types';
import { getShadowImage, type ShadowState } from '../../lib/story/shadowReactions';

const EMOTION_EMOJIS: Record<Emotion, string> = { neutral: '—', happy: '✦', serious: '!', excited: '◆', mysterious: '◈', angry: '×', sad: '·', fear: '⚠' };
const SPEAKER_AVATARS: Record<string, string> = { Narrator: '📜', Shadow: '◈', Kael: '💰', Lyra: '⚔️', Oren: '◉', Malakai: '☠', Guardian: '⌂', Boss: '◆', Player: '◇' };

function shadowStateForEmotion(emotion: Emotion): ShadowState {
  if (emotion === 'angry') return 'threat';
  if (emotion === 'excited' || emotion === 'happy') return 'power';
  if (emotion === 'sad') return 'memory';
  if (emotion === 'fear') return 'warning';
  if (emotion === 'serious') return 'command';
  if (emotion === 'mysterious') return 'observing';
  return 'idle';
}

interface PortraitProps { speaker: string; emotion?: Emotion; isActive: boolean; side: 'left' | 'right'; }

export function Portrait({ speaker, emotion = 'neutral', isActive, side }: PortraitProps) {
  const isShadow = speaker.toLowerCase() === 'shadow';
  const isBoss = speaker === 'Boss';
  const avatar = SPEAKER_AVATARS[speaker] ?? '🎭';
  const shadowState = isShadow ? shadowStateForEmotion(emotion) : 'idle';
  const shadowImage = isShadow ? getShadowImage(shadowState) : '';

  return (
    <motion.div initial={{ opacity: 0, x: side === 'left' ? -36 : 36, scale: .84 }} animate={{ opacity: isActive ? 1 : .46, x: 0, scale: isActive ? 1 : .94 }} transition={{ type: 'spring', duration: .55 }} className={`relative flex-shrink-0 ${isBoss ? 'scale-110' : ''}`}>
      <div className={`absolute -inset-4 rounded-full blur-2xl transition-opacity duration-700 ${isActive ? 'opacity-70' : 'opacity-15'}`} style={{ background: isBoss ? 'radial-gradient(circle,rgba(220,38,38,.45),transparent 68%)' : 'radial-gradient(circle,rgba(139,92,246,.42),transparent 68%)' }} />
      <div className="relative h-[92px] w-[92px] md:h-[108px] md:w-[108px]">
        <div className={`absolute inset-0 rounded-[2rem] border ${isActive ? 'border-violet-300/40' : 'border-white/10'} bg-black/80 shadow-2xl backdrop-blur-xl`} />
        <div className="absolute inset-1 overflow-hidden rounded-[1.65rem]">
          {isShadow ? <img src={shadowImage} alt={`Shadow ${shadowState}`} className="h-full w-full object-cover object-center transition-transform duration-700" style={{ transform: isActive ? 'scale(1.04)' : 'scale(1)' }} loading="eager" onError={(event) => { if (!event.currentTarget.src.endsWith('/shadow_standing.png.jpg')) event.currentTarget.src = getShadowImage('standing'); }} /> : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/10 to-black text-4xl md:text-5xl">{avatar}</div>}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-white/[.05]" />
          {isShadow && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-violet-300/60 shadow-[0_0_14px_rgba(196,181,253,.8)]" />}
        </div>
        {emotion !== 'neutral' && <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-[#0a0810]/95 text-xs font-black text-violet-200 shadow-xl">{EMOTION_EMOJIS[emotion]}</div>}
        <div className={`absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[.2em] backdrop-blur-md ${isShadow ? 'border-violet-300/20 bg-violet-500/[.07] text-violet-200' : 'border-white/10 bg-black/70 text-white'} ${isActive ? 'opacity-100' : 'opacity-70'}`}>{speaker}</div>
      </div>
    </motion.div>
  );
}
