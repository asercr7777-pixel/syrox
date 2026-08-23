import {
  Aperture, Axe, Castle, Crown, Crosshair, Diamond, Flame, Gem, Infinity as InfinityIcon, Moon,
  Shield, Skull, Sparkles, Swords, Target, Trophy, Wand2, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Rank } from '../../data/ranks';
import { getAuraById } from '../../data/collections';

interface RankBadgeProps { rank: Rank; size?: 'sm' | 'md' | 'lg' | 'xl'; auraColor?: string; showRing?: boolean; compact?: boolean; }

const rankIcons: Record<string, LucideIcon> = {
  E: Shield, F: Target, D: Diamond, C: Sparkles, B: Gem, A: Trophy, S: Swords, SS: Zap, SS_DARK: Moon,
  SS_SHADOW_DARK: Aperture, SHADOW_HUNTER: Crosshair, SHADOW_MONARCH: Crown, ELITE_SLAYER: Axe,
  NIGHTMARE_BRINGER: Wand2, DOOM_BRINGER: Flame, EXECUTIONER: Skull, MYTHIC_ONE: Sparkles,
  IMMORTAL_WARRIOR: InfinityIcon, SHADOW_KING: Crown, SYSTEM_OVERLORD: Castle,
};
const rankShapes: Record<string, string> = {
  E: 'rounded-[28%]', F: 'rounded-full', D: 'rotate-45 rounded-[18%]', C: 'rounded-[35%]', B: 'rotate-45 rounded-[20%]',
  A: 'rounded-[42%]', S: 'rounded-[18%]', SS: 'rounded-full', SS_DARK: 'rounded-[28%]', SS_SHADOW_DARK: 'rotate-45 rounded-[18%]',
  SHADOW_HUNTER: 'rounded-[30%]', SHADOW_MONARCH: 'rounded-[40%]', ELITE_SLAYER: 'rounded-[18%]', NIGHTMARE_BRINGER: 'rounded-full',
  DOOM_BRINGER: 'rounded-[26%]', EXECUTIONER: 'rounded-[16%]', MYTHIC_ONE: 'rounded-[45%]', IMMORTAL_WARRIOR: 'rounded-full',
  SHADOW_KING: 'rounded-[24%]', SYSTEM_OVERLORD: 'rounded-[32%]',
};
const tierMotion: Record<string, string> = {
  bronze: 'animate-[pulse_4s_ease-in-out_infinite]', silver: 'animate-[pulse_4s_ease-in-out_infinite]', green: 'animate-[pulse_3.5s_ease-in-out_infinite]',
  blue: 'animate-[pulse_3s_ease-in-out_infinite]', purple: 'animate-[pulse_2.8s_ease-in-out_infinite]', gold: 'animate-[pulse_2.5s_ease-in-out_infinite]',
  fire: 'animate-[pulse_2s_ease-in-out_infinite]', lightning: 'animate-[pulse_1.7s_ease-in-out_infinite]', shadow: 'animate-[pulse_2.2s_ease-in-out_infinite]', monarch: 'animate-[pulse_1.5s_ease-in-out_infinite]',
};

export function RankBadge({ rank, size = 'md', auraColor, showRing = true, compact = false }: RankBadgeProps) {
  const actualSize = compact ? 'sm' : size;
  const sizes = { sm: 'w-10 h-10', md: 'w-16 h-16', lg: 'w-24 h-24', xl: 'w-32 h-32' };
  const iconSizes = { sm: 15, md: 23, lg: 34, xl: 46 };
  const Icon = rankIcons[rank.id] ?? Sparkles;
  const shape = rankShapes[rank.id] ?? 'rounded-full';
  const motion = tierMotion[rank.tier] ?? '';
  const glow = auraColor || rank.color;
  return <div className={`rank-badge relative ${sizes[actualSize]} shrink-0 flex items-center justify-center ${motion}`}>
    <div className="absolute -inset-[22%] rounded-full opacity-35 blur-xl" style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 68%)` }} />
    {!compact && <div className="absolute -inset-[10%] rounded-full opacity-25 blur-md" style={{ background: `conic-gradient(from 0deg, transparent, ${glow}, transparent, ${glow}, transparent)` }} />}
    {showRing && <div className="absolute inset-0 rounded-full border-2 border-dashed opacity-65" style={{ borderColor: glow, boxShadow: `0 0 16px ${rank.glow}` }} />}
    <div className={`relative ${shape} flex items-center justify-center border-2 ${rank.tier === 'monarch' ? 'border-[3px]' : ''}`} style={{ width: compact ? '72%' : actualSize === 'sm' ? '70%' : actualSize === 'md' ? '72%' : '74%', height: compact ? '72%' : actualSize === 'sm' ? '70%' : actualSize === 'md' ? '72%' : '74%', background: `radial-gradient(circle at 35% 25%, ${rank.color}45, rgba(8,10,18,.98) 62%), linear-gradient(135deg, ${rank.color}22, transparent)`, borderColor: rank.color, boxShadow: `inset 0 0 16px ${rank.color}35, 0 0 14px ${rank.glow}, 0 0 28px ${rank.color}30`, transform: rank.id === 'D' || rank.id === 'B' || rank.id === 'SS_SHADOW_DARK' ? 'rotate(0deg)' : undefined }}>
      <Icon size={iconSizes[actualSize]} strokeWidth={1.8} style={{ color: rank.color, filter: `drop-shadow(0 0 7px ${rank.color})` }} />
      <span className="absolute inset-0 rounded-[inherit] opacity-40" style={{ background: `linear-gradient(135deg, ${rank.color}35, transparent 42%, ${rank.color}18)` }} />
    </div>
    {!compact && (rank.tier === 'fire' || rank.tier === 'lightning' || rank.tier === 'shadow' || rank.tier === 'monarch') && <><span className="absolute w-1 h-1 rounded-full animate-ping" style={{ backgroundColor: rank.color, top: '8%', left: '22%' }} /><span className="absolute w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: rank.color, right: '8%', bottom: '24%' }} /></>}
  </div>;
}

interface AuraPreviewProps { auraId: string | null; size?: 'sm' | 'md' | 'lg'; }
export function AuraPreview({ auraId, size = 'md' }: AuraPreviewProps) {
  const aura = auraId ? getAuraById(auraId) : null; const sizes = { sm: 'w-10 h-10', md: 'w-16 h-16', lg: 'w-24 h-24' };
  if (!aura) return <div className={`${sizes[size]} rounded-full bg-ink-800 border border-white/10 flex items-center justify-center text-ink-400`}>—</div>;
  return <div className={`relative ${sizes[size]} flex items-center justify-center`}><div className="absolute inset-0 rounded-full aura-glow" style={{ '--aura-color': aura.color } as React.CSSProperties} /><div className={`relative ${sizes[size]} rounded-full border-2 flex items-center justify-center`} style={{ borderColor: aura.color, background: `radial-gradient(circle at 50% 50%, ${aura.color}40, transparent 70%)`, boxShadow: `0 0 ${aura.intensity / 2}px ${aura.color}` }}><div className="w-1/2 h-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${aura.color}, transparent 70%)`, animation: 'pulseGlow 2s ease-in-out infinite' }} /></div></div>;
}
