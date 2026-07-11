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

/**
 * Each aura gets a unique animated magical effect.
 * The effect TYPE is detected from the aura name (ember→flames, frost→ice, storm→lightning, etc.)
 * and rendered with unique particle counts, positions, and colors from the seeded RNG.
 */

type AuraEffect =
  | 'flames' | 'ice' | 'lightning' | 'wind' | 'mist' | 'stone' | 'bronze' | 'crimson'
  | 'azure' | 'phantom' | 'void' | 'eclipse' | 'inferno' | 'celestial' | 'titan'
  | 'shadow' | 'solar' | 'dragon' | 'divine' | 'eternal' | 'abyss' | 'cosmic'
  | 'chaos' | 'infinity' | 'ragnarok' | 'sung' | 'blackflame' | 'bloodmoon'
  | 'necromancer' | 'worldbreaker' | 'dimensional' | 'generic';

function detectEffect(name: string): AuraEffect {
  const n = name.toLowerCase();
  if (n.includes('ember') || n.includes('inferno') || n.includes('black flame') || n.includes('blackflame')) return 'flames';
  if (n.includes('frost') || n.includes('frozen') || n.includes('ice')) return 'ice';
  if (n.includes('storm') || n.includes('thunder') || n.includes('lightning') || n.includes('ragnarok')) return 'lightning';
  if (n.includes('breeze') || n.includes('wind')) return 'wind';
  if (n.includes('mist') || n.includes('phantom') || n.includes('shadow')) return 'mist';
  if (n.includes('stone') || n.includes('titan')) return 'stone';
  if (n.includes('bronze')) return 'bronze';
  if (n.includes('crimson') || n.includes('blood')) return 'crimson';
  if (n.includes('azure') || n.includes('abyss')) return 'azure';
  if (n.includes('void') || n.includes('dimensional')) return 'void';
  if (n.includes('eclipse')) return 'eclipse';
  if (n.includes('celestial') || n.includes('solar') || n.includes('divine') || n.includes('sung')) return 'celestial';
  if (n.includes('dragon')) return 'dragon';
  if (n.includes('eternal') || n.includes('infinity')) return 'eternal';
  if (n.includes('cosmic') || n.includes('galaxy')) return 'cosmic';
  if (n.includes('chaos')) return 'chaos';
  if (n.includes('necromancer')) return 'necromancer';
  if (n.includes('world breaker') || n.includes('worldbreaker')) return 'worldbreaker';
  return 'generic';
}

export function AuraArt({ id, name, rarity, color, size = 120, animated = true }: ArtProps) {
  const rng = rngFor(id);
  const effect = detectEffect(name);
  const uid = `a-${id}`;
  const isHighRarity = rarity === 'legendary' || rarity === 'mythic' || rarity === 'secret';
  const particleCount = rarity === 'common' ? 8 : rarity === 'rare' ? 12 : rarity === 'epic' ? 16 : 20;

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="overflow-visible">
      <defs>
        <radialGradient id={`${uid}-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="60%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-blur`}><feGaussianBlur stdDeviation="3" /></filter>
        <filter id={`${uid}-blur-lg`}><feGaussianBlur stdDeviation="6" /></filter>
      </defs>

      {/* Outer glow */}
      <circle cx="60" cy="60" r="55" fill={`url(#${uid}-glow)`} className={animated ? 'aura-pulse-outer' : ''} />

      {/* Effect-specific base */}
      {drawEffect(effect, rng, color, uid, particleCount, animated, isHighRarity)}

      {/* Core orb */}
      <circle cx="60" cy="60" r="14" fill={`url(#${uid}-core)`} className={animated ? 'aura-pulse-core' : ''} />
      <circle cx="60" cy="60" r="6" fill={color} opacity="0.8" className={animated ? 'aura-pulse-core' : ''} />

      <style>{`
        .${uid}-particle { animation: ${uid}-float 3s ease-in-out infinite; }
        @keyframes ${uid}-float {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
      {animated && (
        <style>{`
          .aura-pulse-outer { animation: auraPulseOuter 3s ease-in-out infinite; transform-origin: center; }
          .aura-pulse-core { animation: auraPulseCore 2s ease-in-out infinite; transform-origin: center; }
          @keyframes auraPulseOuter { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
          @keyframes auraPulseCore { 0%, 100% { opacity: 0.8; transform: scale(1); } 50% { opacity: 1; transform: scale(1.15); } }
        `}</style>
      )}
    </svg>
  );
}

function drawEffect(effect: AuraEffect, rng: any, color: string, uid: string, count: number, animated: boolean, high: boolean) {
  switch (effect) {
    case 'flames': return drawFlames(rng, color, uid, count, animated);
    case 'ice': return drawIce(rng, color, uid, count, animated);
    case 'lightning': return drawLightning(rng, color, uid, count, animated);
    case 'wind': return drawWind(rng, color, uid, count, animated);
    case 'mist': return drawMist(rng, color, uid, count, animated);
    case 'stone': return drawStone(rng, color, uid, count, animated);
    case 'bronze': return drawBronze(rng, color, uid, count, animated);
    case 'crimson': return drawCrimson(rng, color, uid, count, animated);
    case 'azure': return drawAzure(rng, color, uid, count, animated);
    case 'void': return drawVoid(rng, color, uid, count, animated, high);
    case 'eclipse': return drawEclipse(rng, color, uid, count, animated);
    case 'celestial': return drawCelestial(rng, color, uid, count, animated, high);
    case 'dragon': return drawDragon(rng, color, uid, count, animated);
    case 'eternal': return drawEternal(rng, color, uid, count, animated);
    case 'cosmic': return drawCosmic(rng, color, uid, count, animated, high);
    case 'chaos': return drawChaos(rng, color, uid, count, animated);
    case 'necromancer': return drawNecromancer(rng, color, uid, count, animated);
    case 'worldbreaker': return drawWorldbreaker(rng, color, uid, count, animated);
    default: return drawGeneric(rng, color, uid, count, animated);
  }
}

function drawFlames(rng: any, color: string, uid: string, count: number, animated: boolean) {
  const flames = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + rng.range(-0.2, 0.2);
    const r = rng.range(20, 32);
    const h = rng.range(14, 24);
    return { x: 60 + Math.cos(angle) * r, y: 60 + Math.sin(angle) * r, h, w: rng.range(5, 9), delay: rng.range(0, 1.5) };
  });
  return (
    <g>
      {flames.map((f, i) => (
        <path
          key={i}
          d={`M ${f.x} ${f.y} Q ${f.x - f.w} ${f.y - f.h * 0.6} ${f.x} ${f.y - f.h} Q ${f.x + f.w} ${f.y - f.h * 0.6} ${f.x} ${f.y} Z`}
          fill={color}
          opacity="0.7"
          className={animated ? `${uid}-particle` : ''}
          style={animated ? { animationDelay: `${f.delay}s`, transformOrigin: `${f.x}px ${f.y}px` } : {}}
        />
      ))}
    </g>
  );
}

function drawIce(rng: any, color: string, uid: string, count: number, animated: boolean) {
  const crystals = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const r = rng.range(22, 36);
    return { x: 60 + Math.cos(angle) * r, y: 60 + Math.sin(angle) * r, size: rng.range(3, 7), rot: rng.range(0, 360), delay: rng.range(0, 2) };
  });
  return (
    <g>
      {crystals.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`} className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${c.delay}s`, transformOrigin: `${c.x}px ${c.y}px` } : {}}>
          <polygon points={`0,${-c.size} ${c.size * 0.4},0 0,${c.size} ${-c.size * 0.4},0`} fill={color} opacity="0.8" />
          <polygon points={`0,${-c.size} ${c.size * 0.4},0 0,${c.size} ${-c.size * 0.4},0`} fill="#fff" opacity="0.3" />
        </g>
      ))}
    </g>
  );
}

function drawLightning(rng: any, color: string, uid: string, count: number, animated: boolean) {
  const bolts = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const r = rng.range(18, 34);
    return { x1: 60 + Math.cos(angle) * r, y1: 60 + Math.sin(angle) * r, x2: 60 + Math.cos(angle) * (r - 12), y2: 60 + Math.sin(angle) * (r - 12), delay: rng.range(0, 1) };
  });
  return (
    <g>
      {bolts.map((b, i) => (
        <path
          key={i}
          d={`M ${b.x1} ${b.y1} L ${b.x1 + rng.range(-3, 3)} ${b.y1 + (b.y2 - b.y1) * 0.5} L ${b.x2} ${b.y2}`}
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          opacity="0.8"
          className={animated ? `${uid}-particle` : ''}
          style={animated ? { animationDelay: `${b.delay}s` } : {}}
        />
      ))}
    </g>
  );
}

function drawWind(rng: any, color: string, uid: string, count: number, animated: boolean) {
  const swirls = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const r = rng.range(20, 38);
    return { cx: 60 + Math.cos(angle) * r, cy: 60 + Math.sin(angle) * r, r: rng.range(4, 10), delay: rng.range(0, 2) };
  });
  return (
    <g>
      {swirls.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="none" stroke={color} strokeWidth="1" opacity="0.5" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${s.delay}s`, transformOrigin: `${s.cx}px ${s.cy}px` } : {}} />
      ))}
    </g>
  );
}

function drawMist(rng: any, color: string, uid: string, count: number, animated: boolean) {
  const clouds = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const r = rng.range(15, 35);
    return { cx: 60 + Math.cos(angle) * r, cy: 60 + Math.sin(angle) * r, r: rng.range(6, 14), delay: rng.range(0, 2) };
  });
  return (
    <g filter={`url(#${uid}-blur)`}>
      {clouds.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={color} opacity="0.4" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${c.delay}s` } : {}} />
      ))}
    </g>
  );
}

function drawStone(rng: any, color: string, uid: string, count: number, animated: boolean) {
  const rocks = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const r = rng.range(22, 36);
    return { x: 60 + Math.cos(angle) * r, y: 60 + Math.sin(angle) * r, s: rng.range(3, 7), delay: rng.range(0, 2) };
  });
  return (
    <g>
      {rocks.map((r, i) => (
        <polygon key={i} points={`${r.x},${r.y - r.s} ${r.x + r.s},${r.y} ${r.x},${r.y + r.s} ${r.x - r.s},${r.y}`} fill={color} opacity="0.7" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${r.delay}s`, transformOrigin: `${r.x}px ${r.y}px` } : {}} />
      ))}
    </g>
  );
}

function drawBronze(rng: any, color: string, uid: string, count: number, animated: boolean) {
  const rings = Array.from({ length: 3 }, (_, i) => ({ r: 20 + i * 8, delay: i * 0.5 }));
  return (
    <g>
      {rings.map((r, i) => (
        <circle key={i} cx="60" cy="60" r={r.r} fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${r.delay}s`, transformOrigin: '60px 60px' } : {}} />
      ))}
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        return <circle key={i} cx={60 + Math.cos(angle) * 28} cy={60 + Math.sin(angle) * 28} r="1.5" fill={color} opacity="0.8" />;
      })}
    </g>
  );
}

function drawCrimson(rng: any, color: string, uid: string, count: number, animated: boolean) {
  return drawFlames(rng, color, uid, count, animated);
}

function drawAzure(rng: any, color: string, uid: string, count: number, animated: boolean) {
  const waves = Array.from({ length: 3 }, (_, i) => ({ r: 18 + i * 8, delay: i * 0.4 }));
  return (
    <g>
      {waves.map((w, i) => (
        <circle key={i} cx="60" cy="60" r={w.r} fill="none" stroke={color} strokeWidth="2" opacity="0.4" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${w.delay}s`, transformOrigin: '60px 60px' } : {}} />
      ))}
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const r = rng.range(20, 35);
        return <circle key={i} cx={60 + Math.cos(angle) * r} cy={60 + Math.sin(angle) * r} r="1.5" fill={color} opacity="0.7" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${rng.range(0, 2)}s` } : {}} />;
      })}
    </g>
  );
}

function drawVoid(rng: any, color: string, uid: string, count: number, animated: boolean, high: boolean) {
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const r = rng.range(15, 38);
    return { x: 60 + Math.cos(angle) * r, y: 60 + Math.sin(angle) * r, r: rng.range(1, 3), delay: rng.range(0, 3) };
  });
  return (
    <g>
      {/* Swirl */}
      <path d="M 60 20 Q 90 40 90 60 Q 90 90 60 90 Q 30 90 30 60 Q 30 40 60 20" fill="none" stroke={color} strokeWidth="1" opacity="0.3" className={animated ? `${uid}-particle` : ''} />
      {particles.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={color} opacity="0.8" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${p.delay}s`, transformOrigin: `${p.x}px ${p.y}px` } : {}} />
      ))}
      {high && <circle cx="60" cy="60" r="30" fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" strokeDasharray="3 3" />}
    </g>
  );
}

function drawEclipse(rng: any, color: string, uid: string, count: number, animated: boolean) {
  return (
    <g>
      <circle cx="60" cy="60" r="28" fill={color} opacity="0.3" />
      <circle cx="60" cy="60" r="22" fill="#05060a" />
      <circle cx="60" cy="60" r="22" fill="none" stroke={color} strokeWidth="1.5" opacity="0.8" className={animated ? `${uid}-particle` : ''} />
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const r = rng.range(28, 40);
        return <circle key={i} cx={60 + Math.cos(angle) * r} cy={60 + Math.sin(angle) * r} r="1" fill={color} opacity="0.6" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${rng.range(0, 2)}s` } : {}} />;
      })}
    </g>
  );
}

function drawCelestial(rng: any, color: string, uid: string, count: number, animated: boolean, high: boolean) {
  const stars = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const r = rng.range(18, 40);
    return { x: 60 + Math.cos(angle) * r, y: 60 + Math.sin(angle) * r, s: rng.range(1, 3), delay: rng.range(0, 2) };
  });
  return (
    <g>
      {/* Rays */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <line key={i} x1="60" y1="60" x2={60 + Math.cos(a) * 45} y2={60 + Math.sin(a) * 45} stroke={color} strokeWidth="0.8" opacity="0.3" />;
      })}
      {stars.map((s, i) => (
        <g key={i} className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${s.delay}s`, transformOrigin: `${s.x}px ${s.y}px` } : {}}>
          <polygon points={`${s.x},${s.y - s.s * 2} ${s.x + s.s * 0.5},${s.y} ${s.x},${s.y + s.s * 2} ${s.x - s.s * 0.5},${s.y}`} fill={color} opacity="0.9" />
          <polygon points={`${s.x - s.s * 2},${s.y} ${s.x},${s.y - s.s * 0.5} ${s.x + s.s * 2},${s.y} ${s.x},${s.y + s.s * 0.5}`} fill={color} opacity="0.9" />
        </g>
      ))}
      {high && <circle cx="60" cy="60" r="40" fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" strokeDasharray="2 4" />}
    </g>
  );
}

function drawDragon(rng: any, color: string, uid: string, count: number, animated: boolean) {
  return (
    <g>
      {/* Dragon flame swirl */}
      <path d="M 60 60 Q 80 40 85 60 Q 80 80 60 75" fill="none" stroke={color} strokeWidth="2" opacity="0.6" className={animated ? `${uid}-particle` : ''} />
      <path d="M 60 60 Q 40 80 35 60 Q 40 40 60 45" fill="none" stroke={color} strokeWidth="2" opacity="0.6" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: '0.5s' } : {}} />
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const r = rng.range(20, 38);
        return <circle key={i} cx={60 + Math.cos(angle) * r} cy={60 + Math.sin(angle) * r} r={rng.range(1, 2.5)} fill={color} opacity="0.7" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${rng.range(0, 2)}s` } : {}} />;
      })}
    </g>
  );
}

function drawEternal(rng: any, color: string, uid: string, count: number, animated: boolean) {
  return (
    <g>
      {/* Infinity symbol */}
      <path d="M 40 60 C 40 45, 55 45, 60 60 C 65 75, 80 75, 80 60 C 80 45, 65 45, 60 60 C 55 75, 40 75, 40 60 Z" fill="none" stroke={color} strokeWidth="2" opacity="0.7" className={animated ? `${uid}-particle` : ''} />
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const r = rng.range(25, 40);
        return <circle key={i} cx={60 + Math.cos(angle) * r} cy={60 + Math.sin(angle) * r} r="1.5" fill={color} opacity="0.6" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${rng.range(0, 2)}s` } : {}} />;
      })}
    </g>
  );
}

function drawCosmic(rng: any, color: string, uid: string, count: number, animated: boolean, high: boolean) {
  return (
    <g>
      {/* Galaxy spiral */}
      <path d="M 60 60 Q 75 50 80 60 Q 75 75 60 70 Q 45 65 45 50 Q 50 35 70 40" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" className={animated ? `${uid}-particle` : ''} />
      <path d="M 60 60 Q 45 70 40 60 Q 45 45 60 50 Q 75 55 75 70 Q 70 85 50 80" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: '1s' } : {}} />
      {Array.from({ length: count }, (_, i) => {
        const angle = rng.range(0, Math.PI * 2);
        const r = rng.range(15, 42);
        return <circle key={i} cx={60 + Math.cos(angle) * r} cy={60 + Math.sin(angle) * r} r={rng.range(0.5, 2)} fill={rng.bool() ? color : '#fff'} opacity="0.8" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${rng.range(0, 3)}s` } : {}} />;
      })}
      {high && <circle cx="60" cy="60" r="45" fill="none" stroke={color} strokeWidth="0.3" opacity="0.2" strokeDasharray="1 5" />}
    </g>
  );
}

function drawChaos(rng: any, color: string, uid: string, count: number, animated: boolean) {
  const shards = Array.from({ length: count }, (_, i) => {
    const angle = rng.range(0, Math.PI * 2);
    const r = rng.range(18, 40);
    return { x: 60 + Math.cos(angle) * r, y: 60 + Math.sin(angle) * r, s: rng.range(2, 5), rot: rng.range(0, 360), delay: rng.range(0, 2) };
  });
  return (
    <g>
      {shards.map((s, i) => (
        <polygon key={i} points={`0,${-s.s} ${s.s},0 0,${s.s} ${-s.s},0`} fill={color} opacity="0.7" transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`} className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${s.delay}s`, transformOrigin: `${s.x}px ${s.y}px` } : {}} />
      ))}
    </g>
  );
}

function drawNecromancer(rng: any, color: string, uid: string, count: number, animated: boolean) {
  return (
    <g>
      {/* Skull-like base */}
      <circle cx="60" cy="60" r="20" fill={color} opacity="0.2" />
      <circle cx="54" cy="56" r="3" fill={color} opacity="0.8" />
      <circle cx="66" cy="56" r="3" fill={color} opacity="0.8" />
      {/* Souls rising */}
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const r = rng.range(22, 38);
        return { x: 60 + Math.cos(angle) * r, y: 60 + Math.sin(angle) * r, delay: rng.range(0, 2) };
      }).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} opacity="0.6" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${p.delay}s`, transformOrigin: `${p.x}px ${p.y}px` } : {}} />
      ))}
    </g>
  );
}

function drawWorldbreaker(rng: any, color: string, uid: string, count: number, animated: boolean) {
  return (
    <g>
      {/* Cracks */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return <path key={i} d={`M 60 60 L ${60 + Math.cos(angle) * 40} ${60 + Math.sin(angle) * 40}`} stroke={color} strokeWidth="1.5" opacity="0.5" />;
      })}
      {Array.from({ length: count }, (_, i) => {
        const angle = rng.range(0, Math.PI * 2);
        const r = rng.range(20, 42);
        return <circle key={i} cx={60 + Math.cos(angle) * r} cy={60 + Math.sin(angle) * r} r={rng.range(1, 2.5)} fill={color} opacity="0.7" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${rng.range(0, 2)}s` } : {}} />;
      })}
    </g>
  );
}

function drawGeneric(rng: any, color: string, uid: string, count: number, animated: boolean) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const r = rng.range(20, 38);
        return <circle key={i} cx={60 + Math.cos(angle) * r} cy={60 + Math.sin(angle) * r} r={rng.range(1, 2.5)} fill={color} opacity="0.7" className={animated ? `${uid}-particle` : ''} style={animated ? { animationDelay: `${rng.range(0, 2)}s` } : {}} />;
      })}
    </g>
  );
}
