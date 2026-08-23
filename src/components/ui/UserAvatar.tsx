import type { Rank } from '../../data/ranks';

interface UserAvatarProps {
  avatar: string;
  rank: Rank;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRankGlow?: boolean;
}

const sizes = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-24 w-24',
  xl: 'h-28 w-28',
};

export function UserAvatar({ avatar, rank, size = 'md', className = '', showRankGlow = true }: UserAvatarProps) {
  const isImage = /^https?:\/\//.test(avatar) || avatar.startsWith('data:image/');

  if (isImage) {
    return (
      <>
        <style>{`.rank-badge:has(+ .user-avatar-image), .user-avatar-image + .rank-badge { display: none !important; }`}</style>
        <div className={`user-avatar-image relative shrink-0 ${sizes[size]} ${className}`}>
          {showRankGlow && <div className="pointer-events-none absolute -inset-1 rounded-2xl opacity-25" style={{ background: `radial-gradient(circle, ${rank.glow}, transparent 68%)` }} />}
          <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-950">
            <img src={avatar} alt="Profile" className="h-full w-full object-cover" loading="lazy" />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={`relative shrink-0 ${sizes[size]} rounded-2xl border border-white/10 bg-ink-950/70 flex items-center justify-center ${className}`}>
      <span className="text-[10px] text-ink-500">No photo</span>
    </div>
  );
}
