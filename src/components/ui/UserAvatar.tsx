import { RankBadge } from './RankBadge';
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

const badgeSizes = { sm: 'sm', md: 'md', lg: 'lg', xl: 'xl' } as const;

export function UserAvatar({ avatar, rank, size = 'md', className = '', showRankGlow = true }: UserAvatarProps) {
  const isImage = /^https?:\/\//.test(avatar) || avatar.startsWith('data:image/');

  if (isImage) {
    return (
      <div className={`relative shrink-0 ${sizes[size]} ${className}`}>
        <div className="absolute -inset-1 rounded-2xl opacity-60" style={{ background: `radial-gradient(circle, ${rank.glow}, transparent 68%)` }} />
        <div className="relative h-full w-full overflow-hidden rounded-2xl border-2 bg-ink-950" style={{ borderColor: `${rank.color}90`, boxShadow: `0 0 22px ${rank.glow}` }}>
          <img src={avatar} alt="Profile" className="h-full w-full object-cover" loading="lazy" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 ${sizes[size]} flex items-center justify-center ${className}`}>
      {showRankGlow && <div className="absolute -inset-2 rounded-full opacity-40 blur-md" style={{ background: rank.glow }} />}
      <RankBadge rank={rank} size={badgeSizes[size]} auraColor={rank.color} showRing />
    </div>
  );
}
