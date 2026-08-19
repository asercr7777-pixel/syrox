import type { MarketItem } from '../data/marketplace';

interface TitleArtProps {
  item: MarketItem;
  size?: number;
}

const rarityStyles = {
  common: { stroke: '#9ca3af', fill: '#374151', glow: '#d1d5db' },
  rare: { stroke: '#60a5fa', fill: '#172554', glow: '#93c5fd' },
  epic: { stroke: '#c084fc', fill: '#3b0764', glow: '#e9d5ff' },
  legendary: { stroke: '#fbbf24', fill: '#451a03', glow: '#fde68a' },
  mythic: { stroke: '#f472b6', fill: '#500724', glow: '#fbcfe8' },
  secret: { stroke: '#fde047', fill: '#422006', glow: '#fef3c7' },
} as const;

export function TitleArt({ item, size = 120 }: TitleArtProps) {
  const style = rarityStyles[item.rarity];
  const uid = `t-${item.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const shortName = item.name.length > 18 ? `${item.name.slice(0, 17)}…` : item.name;

  return (
    <svg viewBox="0 0 180 100" width={size * 1.45} height={size * 0.8} className="overflow-visible" role="img" aria-label={item.name}>
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={style.fill} />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
        <filter id={`${uid}-glow`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M18 50 L30 22 L150 22 L162 50 L150 78 L30 78 Z" fill={`url(#${uid}-fill)`} stroke={style.stroke} strokeWidth="2" filter={`url(#${uid}-glow)`} />
      <path d="M30 32 H150 M30 68 H150" stroke={style.glow} strokeWidth="0.8" opacity="0.55" />
      <text x="90" y="55" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="11" fontWeight="700" letterSpacing="1.2">
        {shortName}
      </text>
      <circle cx="30" cy="50" r="3" fill={style.glow} />
      <circle cx="150" cy="50" r="3" fill={style.glow} />
    </svg>
  );
}
