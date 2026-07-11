import { rngFor } from '../lib/seeded';
import type { Rarity } from '../data/collections';

interface ArtProps {
  id: string;
  name: string;
  rarity: Rarity;
  color: string;
  size?: number;
  animated?: boolean;
}

type FrameStyle = 'shadow' | 'golden' | 'crimson' | 'frost' | 'eclipse' | 'dragon' | 'void' | 'celestial' | 'monarch' | 'infinity';

function detectStyle(name: string): FrameStyle {
  const n = name.toLowerCase();
  if (n.includes('shadow')) return 'shadow';
  if (n.includes('golden')) return 'golden';
  if (n.includes('crimson')) return 'crimson';
  if (n.includes('frost')) return 'frost';
  if (n.includes('eclipse')) return 'eclipse';
  if (n.includes('dragon')) return 'dragon';
  if (n.includes('void')) return 'void';
  if (n.includes('celestial')) return 'celestial';
  if (n.includes('monarch')) return 'monarch';
  if (n.includes('infinity')) return 'infinity';
  return 'shadow';
}

export function FrameArt({ id, name, rarity, color, size = 120, animated = true }: ArtProps) {
  const rng = rngFor(id);
  const style = detectStyle(name);
  const uid = `f-${id}`;
  const isHighRarity = rarity === 'legendary' || rarity === 'mythic' || rarity === 'secret';

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="overflow-visible">
      <defs>
        <linearGradient id={`${uid}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="80%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </radialGradient>
      </defs>

      {/* Inner avatar area indicator */}
      <circle cx="60" cy="60" r="32" fill="#0a0c14" opacity="0.6" />
      <circle cx="60" cy="60" r="32" fill={`url(#${uid}-glow)`} />

      <g transform="translate(60 60)">
        {drawFrame(style, rng, color, uid, animated, isHighRarity)}
      </g>
    </svg>
  );
}

function drawFrame(style: FrameStyle, rng: any, color: string, uid: string, animated: boolean, high: boolean) {
  const grad = `url(#${uid}-grad)`;

  switch (style) {
    case 'shadow': return (
      <g>
        {/* Shadow tendrils */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <path key={i} d={`M ${Math.cos(a) * 38} ${Math.sin(a) * 38} Q ${Math.cos(a) * 44} ${Math.sin(a) * 44} ${Math.cos(a) * 48} ${Math.sin(a) * 48}`} stroke={color} strokeWidth="2" opacity="0.6" fill="none" className={animated ? `${uid}-anim` : ''} style={animated ? { animationDelay: `${i * 0.2}s`, transformOrigin: 'center' } : {}} />;
        })}
        <circle cx="0" cy="0" r="38" fill="none" stroke={color} strokeWidth="2" opacity="0.7" />
        <circle cx="0" cy="0" r="34" fill="none" stroke={color} strokeWidth="0.5" opacity="0.4" strokeDasharray="2 3" />
      </g>
    );
    case 'golden': return (
      <g>
        {/* Ornate gold frame */}
        <circle cx="0" cy="0" r="40" fill="none" stroke={grad} strokeWidth="3" />
        <circle cx="0" cy="0" r="36" fill="none" stroke={color} strokeWidth="1" opacity="0.6" />
        {/* Ornaments */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <circle key={i} cx={Math.cos(a) * 40} cy={Math.sin(a) * 40} r="2.5" fill={color} />;
        })}
        {/* Top crown */}
        <polygon points="-6,-44 0,-50 6,-44 4,-40 -4,-40" fill={color} />
      </g>
    );
    case 'crimson': return (
      <g>
        <circle cx="0" cy="0" r="40" fill="none" stroke={color} strokeWidth="3" />
        {/* Spikes */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <polygon key={i} points={`${Math.cos(a) * 38},${Math.sin(a) * 38} ${Math.cos(a) * 46},${Math.sin(a) * 46} ${Math.cos(a + 0.1) * 38},${Math.sin(a + 0.1) * 38}`} fill={color} opacity="0.7" />;
        })}
        <circle cx="0" cy="0" r="34" fill="none" stroke={color} strokeWidth="0.5" opacity="0.4" />
      </g>
    );
    case 'frost': return (
      <g>
        <circle cx="0" cy="0" r="40" fill="none" stroke={grad} strokeWidth="2" />
        {/* Ice crystals around */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <g key={i} transform={`translate(${Math.cos(a) * 40} ${Math.sin(a) * 40}) rotate(${(a * 180) / Math.PI})`}>
              <polygon points="0,-6 2,0 0,6 -2,0" fill={color} opacity="0.8" />
            </g>
          );
        })}
        <circle cx="0" cy="0" r="36" fill="none" stroke={color} strokeWidth="0.5" opacity="0.5" strokeDasharray="3 2" />
      </g>
    );
    case 'eclipse': return (
      <g>
        <circle cx="0" cy="0" r="40" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="0" cy="0" r="36" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
        {/* Eclipse ring */}
        <circle cx="0" cy="0" r="30" fill={color} opacity="0.15" />
        <circle cx="6" cy="-4" r="24" fill="#05060a" />
        {/* Stars */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = rng.range(0, Math.PI * 2);
          const r = rng.range(34, 42);
          return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r="0.8" fill="#fff" opacity="0.8" />;
        })}
      </g>
    );
    case 'dragon': return (
      <g>
        <circle cx="0" cy="0" r="40" fill="none" stroke={grad} strokeWidth="2" />
        {/* Dragon horns at top */}
        <path d="M -10 -38 Q -18 -48 -14 -52 Q -8 -46 -6 -38" fill={color} opacity="0.8" />
        <path d="M 10 -38 Q 18 -48 14 -52 Q 8 -46 6 -38" fill={color} opacity="0.8" />
        {/* Scales pattern */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <path key={i} d={`M ${Math.cos(a) * 36} ${Math.sin(a) * 36} Q ${Math.cos(a) * 42} ${Math.sin(a) * 42} ${Math.cos(a + 0.2) * 36} ${Math.sin(a + 0.2) * 36}`} stroke={color} strokeWidth="0.8" fill="none" opacity="0.5" />;
        })}
      </g>
    );
    case 'void': return (
      <g>
        <circle cx="0" cy="0" r="40" fill="none" stroke={color} strokeWidth="2" opacity="0.7" />
        {/* Cosmic energy swirl */}
        <path d="M 0 -38 Q 30 -20 38 0 Q 30 20 0 38 Q -30 20 -38 0 Q -30 -20 0 -38" fill="none" stroke={color} strokeWidth="1" opacity="0.5" className={animated ? `${uid}-anim` : ''} />
        {/* Stars */}
        {Array.from({ length: 10 }, (_, i) => {
          const a = rng.range(0, Math.PI * 2);
          const r = rng.range(34, 44);
          return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={rng.range(0.5, 1.5)} fill="#fff" opacity="0.7" />;
        })}
      </g>
    );
    case 'celestial': return (
      <g>
        {/* Radiating rays */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1={Math.cos(a) * 38} y1={Math.sin(a) * 38} x2={Math.cos(a) * 48} y2={Math.sin(a) * 48} stroke={color} strokeWidth="1.5" opacity="0.6" />;
        })}
        <circle cx="0" cy="0" r="38" fill="none" stroke={grad} strokeWidth="2" />
        <circle cx="0" cy="0" r="34" fill="none" stroke={color} strokeWidth="0.5" opacity="0.4" />
      </g>
    );
    case 'monarch': return (
      <g>
        {/* Royal purple with crown */}
        <circle cx="0" cy="0" r="40" fill="none" stroke={grad} strokeWidth="3" />
        <circle cx="0" cy="0" r="36" fill="none" stroke={color} strokeWidth="0.5" opacity="0.5" strokeDasharray="4 2" />
        {/* Crown */}
        <path d="M -12 -42 L -8 -50 L -4 -44 L 0 -52 L 4 -44 L 8 -50 L 12 -42 Z" fill={color} />
        <circle cx="0" cy="-50" r="1.5" fill="#fff" />
        {/* Jewels */}
        <circle cx="-20" cy="0" r="2" fill={color} />
        <circle cx="20" cy="0" r="2" fill={color} />
        <circle cx="0" cy="38" r="2" fill={color} />
      </g>
    );
    case 'infinity': return (
      <g>
        <circle cx="0" cy="0" r="42" fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" strokeDasharray="1 3" className={animated ? `${uid}-anim` : ''} />
        <circle cx="0" cy="0" r="40" fill="none" stroke={grad} strokeWidth="2" />
        {/* Galaxy border */}
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return <circle key={i} cx={Math.cos(a) * 40} cy={Math.sin(a) * 40} r={rng.range(0.5, 1.5)} fill={rng.bool() ? color : '#fff'} opacity="0.7" />;
        })}
        {high && <circle cx="0" cy="0" r="44" fill="none" stroke={color} strokeWidth="0.3" opacity="0.2" strokeDasharray="2 6" />}
      </g>
    );
    default: return null;
  }
}
