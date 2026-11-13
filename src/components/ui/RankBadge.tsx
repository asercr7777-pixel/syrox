import {
  Aperture, Axe, Castle, Crown, Crosshair, Diamond, Flame, Gem, Infinity as InfinityIcon, Moon,
  Shield, Skull, Sparkles, Swords, Target, Trophy, Wand2, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Rank } from '../../data/ranks';
import { getAuraById } from '../../data/collections';

interface RankBadgeProps {
  rank: Rank;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  auraColor?: string;
  showRing?: boolean;
  compact?: boolean;
}

const rankIcons: Record<string, LucideIcon> = {
  E: Shield, F: Target, D: Diamond, C: Sparkles, B: Gem, A: Trophy, S: Swords, SS: Zap, SS_DARK: Moon,
  SS_SHADOW_DARK: Aperture, SHADOW_HUNTER: Crosshair, SHADOW_MONARCH: Crown, ELITE_SLAYER: Axe,
  NIGHTMARE_BRINGER: Wand2, DOOM_BRINGER: Flame, EXECUTIONER: Skull, MYTHIC_ONE: Sparkles,
  IMMORTAL_WARRIOR: InfinityIcon, SHADOW_KING: Crown, SYSTEM_OVERLORD: Castle,
};

const rankShapes: Record<string, string> = {
  E: 'rounded-xl', F: 'rounded-full', D: 'rounded-xl', C: 'rounded-2xl', B: 'rounded-xl',
  A: 'rounded-2xl', S: 'rounded-xl', SS: 'rounded-full', SS_DARK: 'rounded-xl', SS_SHADOW_DARK: 'rounded-xl',
  SHADOW_HUNTER: 'rounded-2xl', SHADOW_MONARCH: 'rounded-2xl', ELITE_SLAYER: 'rounded-xl', NIGHTMARE_BRINGER: 'rounded-full',
  DOOM_BRINGER: 'rounded-xl', EXECUTIONER: 'rounded-xl', MYTHIC_ONE: 'rounded-2xl', IMMORTAL_WARRIOR: 'rounded-full',
  SHADOW_KING: 'rounded-xl', SYSTEM_OVERLORD: 'rounded-2xl',
};

export function RankBadge({ rank, size = 'md', auraColor, showRing = true, compact = false }: RankBadgeProps) {
  const actualSize = compact ? 'sm' : size;
  const sizes = { sm: 'w-10 h-10', md: 'w-14 h-14', lg: 'w-20 h-20', xl: 'w-28 h-28' };
  const iconSizes = { sm: 16, md: 22, lg: 30, xl: 42 };
  const Icon = rankIcons[rank.id] ?? Sparkles;
  const shape = rankShapes[rank.id] ?? 'rounded-full';
  const glow = auraColor || rank.color;

  return (
    <div className={`rank-badge relative ${sizes[actualSize]} shrink-0 flex items-center justify-center`}>
      <div
        className="pointer-events-none absolute -inset-1.5 rounded-full opacity-25 blur-md"
        style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }}
      />
      {showRing && (
        <div
          className="pointer-events-none absolute inset-0 rounded-full border opacity-55"
          style={{ borderColor: glow, boxShadow: `0 0 14px ${rank.glow}` }}
        />
      )}
      <div
        className={`relative ${shape} flex items-center justify-center border-2 transition-colors`}
        style={{
          width: actualSize === 'sm' ? '76%' : '78%',
          height: actualSize === 'sm' ? '76%' : '78%',
          background: `radial-gradient(circle at 32% 24%, ${rank.color}36, rgb(var(--ink-950)) 74%)`,
          borderColor: rank.color,
          boxShadow: `inset 0 0 14px ${rank.color}28, 0 0 16px ${rank.color}26`,
        }}
      >
        <Icon
          size={iconSizes[actualSize]}
          strokeWidth={1.9}
          style={{ color: rank.color }}
        />
      </div>
    </div>
  );
}

interface AuraPreviewProps {
  auraId: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function AuraPreview({ auraId, size = 'md' }: AuraPreviewProps) {
  const aura = auraId ? getAuraById(auraId) : null;
  const sizes = { sm: 'w-10 h-10', md: 'w-14 h-14', lg: 'w-20 h-20' };

  if (!aura) {
    return (
      <div className={`${sizes[size]} rounded-full bg-ink-800 border border-white/10 flex items-center justify-center text-ink-400 text-xs font-mono`}>
        —
      </div>
    );
  }

  return (
    <div className={`relative ${sizes[size]} flex items-center justify-center`}>
      <div
        className={`relative ${sizes[size]} rounded-full border-2 flex items-center justify-center`}
        style={{
          borderColor: aura.color,
          background: `radial-gradient(circle at 50% 50%, ${aura.color}38, transparent 72%)`,
          boxShadow: `0 0 ${Math.max(10, Math.round(aura.intensity / 3))}px ${aura.color}55`,
        }}
      >
        <div
          className="w-1/2 h-1/2 rounded-full"
          style={{ background: `radial-gradient(circle, ${aura.color}, transparent 75%)` }}
        />
      </div>
    </div>
  );
}
