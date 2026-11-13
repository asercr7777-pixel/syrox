import type { Rank } from '../../data/ranks';

interface UserAvatarProps {
  avatar: string;
  rank: Rank;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRankGlow?: boolean;
  frameColor?: string;
}

const sizes = {
  sm: 'h-10 w-10 text-lg',
  md: 'h-14 w-14 text-2xl',
  lg: 'h-24 w-24 text-4xl',
  xl: 'h-28 w-28 text-5xl',
};

export function UserAvatar({
  avatar,
  rank,
  size = 'md',
  className = '',
  showRankGlow = true,
  frameColor,
}: UserAvatarProps) {
  const isImage = /^https?:\/\//.test(avatar) || avatar.startsWith('data:image/');
  const emblem = avatar?.trim() || rank.emoji || '🐺';
  const borderColor = frameColor || `${rank.color}70`;
  const glowColor = frameColor || rank.glow;

  if (isImage) {
    return (
      <div className={`relative shrink-0 ${sizes[size]} ${className}`}>
        {showRankGlow && (
          <div
            className="pointer-events-none absolute -inset-1 rounded-2xl opacity-35 blur-sm"
            style={{ background: `radial-gradient(circle, ${glowColor}, transparent 70%)` }}
          />
        )}
        <div
          className="relative h-full w-full overflow-hidden rounded-2xl border-2 bg-ink-950"
          style={{ borderColor }}
        >
          <img src={avatar} alt="Hunter portrait" className="h-full w-full object-cover" loading="lazy" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 ${sizes[size]} rounded-2xl border-2 bg-gradient-to-br from-ink-800 to-ink-950 flex items-center justify-center shadow-lg ${className}`}
      style={{
        borderColor,
        boxShadow: showRankGlow ? `0 0 22px ${glowColor}45` : undefined,
      }}
    >
      <span role="img" aria-label="Hunter emblem" className="select-none leading-none">
        {emblem}
      </span>
    </div>
  );
}
