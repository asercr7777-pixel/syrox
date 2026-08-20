import type { Rank } from '../../data/ranks';
import { getAuraById } from '../../data/collections';

interface RankBadgeProps {
  rank: Rank;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  auraColor?: string;
  showRing?: boolean;
}

export function RankBadge({ rank, size = 'md', auraColor, showRing = true }: RankBadgeProps) {
  const sizes = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-4xl',
    xl: 'w-32 h-32 text-5xl',
  };
  const inner = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-12 h-12 text-xl',
    lg: 'w-18 h-18 text-3xl',
    xl: 'w-24 h-24 text-4xl',
  };

  return (
    <div className={`relative ${sizes[size]} flex items-center justify-center`}>
      {showRing && (
        <div
          className="absolute inset-0 rank-ring"
          style={{
            '--ring-color': rank.color,
            '--ring-pct': '75%',
          } as React.CSSProperties}
        />
      )}
      {auraColor && (
        <div
          className="absolute inset-0 rounded-full aura-glow"
          style={{ '--aura-color': auraColor } as React.CSSProperties}
        />
      )}
      <div
        className="absolute inset-[10%] rounded-full opacity-30"
        style={{
          background: `radial-gradient(circle, ${rank.color}45 0%, transparent 68%)`,
          boxShadow: `0 0 28px ${rank.glow}`,
        }}
      />
      <div
        className={`relative ${inner[size]} rounded-full flex items-center justify-center bg-ink-950/95 border-2 overflow-hidden`}
        style={{
          borderColor: rank.color,
          boxShadow: `inset 0 0 14px ${rank.color}25, 0 0 20px ${rank.glow}`,
        }}
      >
        <span
          className="font-black leading-none select-none"
          style={{ color: rank.color, textShadow: `0 0 12px ${rank.color}, 0 0 24px ${rank.glow}` }}
        >
          {rank.emoji}
        </span>
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
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };
  if (!aura) {
    return <div className={`${sizes[size]} rounded-full bg-ink-800 border border-white/10 flex items-center justify-center text-ink-400`}>—</div>;
  }
  return (
    <div className={`relative ${sizes[size]} flex items-center justify-center`}>
      <div
        className="absolute inset-0 rounded-full aura-glow"
        style={{ '--aura-color': aura.color } as React.CSSProperties}
      />
      <div
        className={`relative ${sizes[size]} rounded-full border-2 flex items-center justify-center`}
        style={{
          borderColor: aura.color,
          background: `radial-gradient(circle at 50% 50%, ${aura.color}40, transparent 70%)`,
          boxShadow: `0 0 ${aura.intensity / 2}px ${aura.color}`,
        }}
      >
        <div
          className="w-1/2 h-1/2 rounded-full"
          style={{
            background: `radial-gradient(circle, ${aura.color}, transparent 70%)`,
            animation: 'pulseGlow 2s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}
