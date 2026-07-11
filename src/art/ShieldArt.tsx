import { rngFor } from '../lib/seeded';
import type { Rarity } from '../data/collections';

interface ArtProps {
  id: string;
  name: string;
  rarity: Rarity;
  size?: number;
}

const RARITY_PALETTE: Record<Rarity, { metal: string; metalDark: string; accent: string; glow: string }> = {
  common: { metal: '#9ca3af', metalDark: '#4b5563', accent: '#6b7280', glow: 'rgba(156,163,175,0.3)' },
  rare: { metal: '#60a5fa', metalDark: '#1e40af', accent: '#3b82f6', glow: 'rgba(59,130,246,0.5)' },
  epic: { metal: '#c084fc', metalDark: '#6b21a8', accent: '#a855f7', glow: 'rgba(168,85,247,0.6)' },
  legendary: { metal: '#fbbf24', metalDark: '#92400e', accent: '#f59e0b', glow: 'rgba(245,158,11,0.7)' },
  mythic: { metal: '#f472b6', metalDark: '#9d174d', accent: '#ec4899', glow: 'rgba(236,72,153,0.75)' },
  secret: { metal: '#fde047', metalDark: '#854d0e', accent: '#fbbf24', glow: 'rgba(251,191,36,0.9)' },
};

type ShieldShape = 'heater' | 'kite' | 'round' | 'tower' | 'buckler' | 'oval' | 'hexagon' | 'crescent' | 'aegis' | 'rune';

function detectShape(name: string): ShieldShape {
  const n = name.toLowerCase();
  if (n.includes('aegis')) return 'aegis';
  if (n.includes('guardian') || n.includes('iron fortress')) return 'tower';
  if (n.includes('dragon')) return 'heater';
  if (n.includes('titan')) return 'kite';
  if (n.includes('eclipse')) return 'crescent';
  if (n.includes('void')) return 'hexagon';
  if (n.includes('celestial')) return 'round';
  if (n.includes('monarch')) return 'rune';
  if (n.includes('shadow')) return 'oval';
  if (n.includes('eternal')) return 'aegis';
  return 'heater';
}

export function ShieldArt({ id, name, rarity, size = 120 }: ArtProps) {
  const rng = rngFor(id);
  const shape = detectShape(name);
  const pal = RARITY_PALETTE[rarity];
  const uid = `s-${id}`;
  const isHighRarity = rarity === 'legendary' || rarity === 'mythic' || rarity === 'secret';
  const hasGlow = rarity !== 'common';
  const emblemStyle = rng.int(0, 4);

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="overflow-visible">
      <defs>
        <linearGradient id={`${uid}-metal`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={pal.metal} />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="100%" stopColor={pal.metalDark} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={pal.accent} stopOpacity={hasGlow ? 0.6 : 0} />
          <stop offset="100%" stopColor={pal.accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {hasGlow && <circle cx="60" cy="60" r="50" fill={`url(#${uid}-glow)`} />}

      <g transform="translate(60 60)">
        {drawShape(shape, rng, pal, uid, emblemStyle, isHighRarity)}
      </g>
    </svg>
  );
}

function drawShape(shape: ShieldShape, rng: any, pal: any, uid: string, emblem: number, high: boolean) {
  const metal = `url(#${uid}-metal)`;
  const dark = pal.metalDark;
  const accent = pal.accent;

  switch (shape) {
    case 'heater': return (
      <g>
        <path d="M -28 -32 L 28 -32 L 28 0 Q 28 28 0 36 Q -28 28 -28 0 Z" fill={metal} stroke={dark} strokeWidth="1" />
        <path d="M -28 -32 L 28 -32 L 28 0 Q 28 28 0 36 Q -28 28 -28 0 Z" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
        <path d="M -20 -24 L 20 -24 L 20 -2 Q 20 20 0 28 Q -20 20 -20 -2 Z" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />
        {drawEmblem(emblem, accent, rng)}
      </g>
    );
    case 'kite': return (
      <g>
        <path d="M 0 -38 L 24 -28 L 24 10 Q 24 30 0 38 Q -24 30 -24 10 L -24 -28 Z" fill={metal} stroke={dark} strokeWidth="1" />
        <path d="M 0 -38 L 24 -28 L 24 10 Q 24 30 0 38 Q -24 30 -24 10 L -24 -28 Z" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
        <line x1="0" y1="-30" x2="0" y2="30" stroke={accent} strokeWidth="0.8" opacity="0.4" />
        {drawEmblem(emblem, accent, rng)}
      </g>
    );
    case 'round': return (
      <g>
        <circle cx="0" cy="0" r="32" fill={metal} stroke={dark} strokeWidth="1" />
        <circle cx="0" cy="0" r="32" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
        <circle cx="0" cy="0" r="24" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />
        <circle cx="0" cy="0" r="16" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.4" />
        {drawEmblem(emblem, accent, rng)}
      </g>
    );
    case 'tower': return (
      <g>
        <path d="M -26 -36 L -26 32 L 26 32 L 26 -36 L 18 -36 L 18 -28 L 10 -28 L 10 -36 L -10 -36 L -10 -28 L -18 -28 L -18 -36 Z" fill={metal} stroke={dark} strokeWidth="1" />
        <rect x="-20" y="-20" width="40" height="4" fill={accent} opacity="0.4" />
        <rect x="-20" y="10" width="40" height="4" fill={accent} opacity="0.4" />
        {drawEmblem(emblem, accent, rng)}
      </g>
    );
    case 'buckler': return (
      <g>
        <circle cx="0" cy="0" r="26" fill={metal} stroke={dark} strokeWidth="1" />
        <circle cx="0" cy="0" r="26" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
        <circle cx="0" cy="0" r="8" fill={accent} opacity="0.6" />
        <circle cx="0" cy="0" r="4" fill="#fff" opacity="0.4" />
        {/* Boss */}
        <circle cx="0" cy="0" r="3" fill={metal} stroke={dark} strokeWidth="0.3" />
      </g>
    );
    case 'oval': return (
      <g>
        <ellipse cx="0" cy="0" rx="24" ry="34" fill={metal} stroke={dark} strokeWidth="1" />
        <ellipse cx="0" cy="0" rx="24" ry="34" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
        <ellipse cx="0" cy="0" rx="16" ry="26" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.5" />
        {drawEmblem(emblem, accent, rng)}
      </g>
    );
    case 'hexagon': return (
      <g>
        <polygon points="-28,-16 -28,16 0,32 28,16 28,-16 0,-32" fill={metal} stroke={dark} strokeWidth="1" />
        <polygon points="-28,-16 -28,16 0,32 28,16 28,-16 0,-32" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
        <polygon points="-20,-12 -20,12 0,24 20,12 20,-12 0,-24" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.5" />
        {drawEmblem(emblem, accent, rng)}
      </g>
    );
    case 'crescent': return (
      <g>
        <path d="M 20 -30 A 32 32 0 1 0 20 30 A 24 24 0 1 1 20 -30 Z" fill={metal} stroke={dark} strokeWidth="1" />
        <path d="M 20 -30 A 32 32 0 1 0 20 30 A 24 24 0 1 1 20 -30 Z" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
        <circle cx="-8" cy="0" r="6" fill={accent} opacity="0.6" />
        {drawEmblem(emblem, accent, rng)}
      </g>
    );
    case 'aegis': return (
      <g>
        {/* Aegis — magical shield with wings */}
        <ellipse cx="0" cy="0" rx="22" ry="30" fill={metal} stroke={dark} strokeWidth="1" />
        <ellipse cx="0" cy="0" rx="22" ry="30" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
        {/* Wings */}
        <path d="M -22 -10 Q -40 -15 -42 0 Q -38 5 -22 0" fill={metal} stroke={dark} strokeWidth="0.5" opacity="0.7" />
        <path d="M 22 -10 Q 40 -15 42 0 Q 38 5 22 0" fill={metal} stroke={dark} strokeWidth="0.5" opacity="0.7" />
        {/* Gorgon face */}
        <circle cx="0" cy="-8" r="3" fill={accent} />
        <circle cx="-4" cy="-8" r="1" fill="#fff" opacity="0.5" />
        <circle cx="4" cy="-8" r="1" fill="#fff" opacity="0.5" />
        <path d="M -4 2 Q 0 6 4 2" stroke={accent} strokeWidth="0.8" fill="none" />
        {high && <circle cx="0" cy="0" r="34" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.3" strokeDasharray="2 3" />}
      </g>
    );
    case 'rune': return (
      <g>
        <path d="M -28 -32 L 28 -32 L 28 0 Q 28 28 0 36 Q -28 28 -28 0 Z" fill={metal} stroke={dark} strokeWidth="1" />
        {/* Rune circle */}
        <circle cx="0" cy="-2" r="14" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.7" />
        {/* Rune marks */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return <line key={i} x1={Math.cos(a) * 10} y1={-2 + Math.sin(a) * 10} x2={Math.cos(a) * 16} y2={-2 + Math.sin(a) * 16} stroke={accent} strokeWidth="1" opacity="0.6" />;
        })}
        <circle cx="0" cy="-2" r="3" fill={accent} opacity="0.8" />
      </g>
    );
    default: return null;
  }
}

function drawEmblem(style: number, accent: string, rng: any) {
  switch (style) {
    case 0: return <circle cx="0" cy="-2" r="6" fill={accent} opacity="0.7" />;
    case 1: return <polygon points="0,-10 6,-2 0,6 -6,-2" fill={accent} opacity="0.7" />;
    case 2: return <g><path d="M -8 -2 L 0 -10 L 8 -2 L 0 6 Z" fill={accent} opacity="0.6" /><circle cx="0" cy="-2" r="2" fill="#fff" opacity="0.5" /></g>;
    case 3: return <g><line x1="-8" y1="-2" x2="8" y2="-2" stroke={accent} strokeWidth="2" opacity="0.6" /><line x1="0" y1="-10" x2="0" y2="6" stroke={accent} strokeWidth="2" opacity="0.6" /></g>;
    case 4: return <g><circle cx="-5" cy="-5" r="2" fill={accent} opacity="0.7" /><circle cx="5" cy="-5" r="2" fill={accent} opacity="0.7" /><path d="M -6 2 Q 0 8 6 2" stroke={accent} strokeWidth="1" fill="none" opacity="0.6" /></g>;
    default: return null;
  }
}
