import type { Rank } from '../../data/ranks';

interface UserAvatarProps {
  avatar: string;
  rank: Rank;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRankGlow?: boolean;
}

const sizes = {
  sm: 'h-10 w-10 text-lg',
  md: 'h-14 w-14 text-2xl',
  lg: 'h-24 w-24 text-4xl',
  xl: 'h-28 w-28 text-5xl',
};

export function UserAvatar({ avatar, rank, size = 'md', className = '', showRankGlow = true }: UserAvatarProps) {
  const isImage = /^https?:\/\//.test(avatar) || avatar.startsWith('data:image/');
  const emblem = avatar?.trim() || rank.emoji || '🐺';

  if (isImage) {
    return (
      <>
        <style>{`.rank-badge:has(+ .user-avatar-image), .user-avatar-image + .rank-badge { display: none !important; }`}</style>
        <div className={`user-avatar-image relative shrink-0 ${sizes[size]} ${className}`}>
          {showRankGlow && (
            <div
              className="pointer-events-none absolute -inset-1 rounded-2xl opacity-35"
              style={{ background: `radial-gradient(circle, ${rank.glow}, transparent 68%)` }}
            />
          )}
          <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/15 bg-ink-950">
            <img src={avatar} alt="Hunter portrait" className="h-full w-full object-cover" loading="lazy" />
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className={`relative shrink-0 ${sizes[size]} rounded-2xl border bg-gradient-to-br from-[#141a2e] to-[#080b14] flex items-center justify-center shadow-lg ${className}`}
      style={{
        borderColor: `${rank.color}55`,
        boxShadow: showRankGlow ? `0 0 28px ${rank.glow}` : undefined,
      }}
    >
      <span role="img" aria-label="Hunter emblem" className="select-none leading-none">
        {emblem}
      </span>
    </div>
  );
}
