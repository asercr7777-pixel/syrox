import { rngFor } from '../lib/seeded';
import type { Rarity } from '../data/collections';

interface ArtProps {
  id: string;
  name: string;
  rarity: Rarity;
  size?: number;
}

/**
 * Each weapon gets a unique SVG generated from its id+name.
 * The weapon TYPE (sword, dagger, axe, bow, spear, hammer, scythe, staff, katana, lance, greatsword, crossbow)
 * is detected from the name, then a unique silhouette is drawn with
 * rarity-based colors, materials, and magical effects.
 */

type WeaponType = 'sword' | 'dagger' | 'axe' | 'bow' | 'spear' | 'hammer' | 'scythe' | 'staff' | 'katana' | 'lance' | 'greatsword' | 'crossbow' | 'knife';

function detectType(name: string): WeaponType {
  const n = name.toLowerCase();
  if (n.includes('greatsword') || n.includes('cleaver')) return 'greatsword';
  if (n.includes('katana')) return 'katana';
  if (n.includes('scythe')) return 'scythe';
  if (n.includes('bow')) return 'bow';
  if (n.includes('crossbow')) return 'crossbow';
  if (n.includes('spear')) return 'spear';
  if (n.includes('lance')) return 'lance';
  if (n.includes('axe')) return 'axe';
  if (n.includes('hammer')) return 'hammer';
  if (n.includes('staff')) return 'staff';
  if (n.includes('dagger')) return 'dagger';
  if (n.includes('knife')) return 'knife';
  if (n.includes('blade') || n.includes('sword')) return 'sword';
  return 'sword';
}

const RARITY_PALETTE: Record<Rarity, { metal: string; metalDark: string; accent: string; glow: string; energy: string }> = {
  common: { metal: '#9ca3af', metalDark: '#4b5563', accent: '#6b7280', glow: 'rgba(156,163,175,0.3)', energy: '#d1d5db' },
  rare: { metal: '#60a5fa', metalDark: '#1e40af', accent: '#3b82f6', glow: 'rgba(59,130,246,0.5)', energy: '#93c5fd' },
  epic: { metal: '#c084fc', metalDark: '#6b21a8', accent: '#a855f7', glow: 'rgba(168,85,247,0.6)', energy: '#e9d5ff' },
  legendary: { metal: '#fbbf24', metalDark: '#92400e', accent: '#f59e0b', glow: 'rgba(245,158,11,0.7)', energy: '#fde68a' },
  mythic: { metal: '#f472b6', metalDark: '#9d174d', accent: '#ec4899', glow: 'rgba(236,72,153,0.75)', energy: '#fbcfe8' },
  secret: { metal: '#fde047', metalDark: '#854d0e', accent: '#fbbf24', glow: 'rgba(251,191,36,0.9)', energy: '#fef3c7' },
};

export function WeaponArt({ id, name, rarity, size = 120 }: ArtProps) {
  const rng = rngFor(id);
  const type = detectType(name);
  const pal = RARITY_PALETTE[rarity];
  const uid = `w-${id}`;
  const isHighRarity = rarity === 'legendary' || rarity === 'mythic' || rarity === 'secret';

  // Unique variations per weapon
  const bladeLen = rng.range(0.85, 1.0);
  const curveAmt = rng.range(-8, 12);
  const guardStyle = rng.int(0, 3);
  const pommelStyle = rng.int(0, 2);
  const hasEngraving = isHighRarity || rng.bool(0.4);
  const hasGlow = rarity !== 'common';
  const glowIntensity = rarity === 'common' ? 0 : rarity === 'rare' ? 0.4 : rarity === 'epic' ? 0.6 : 0.85;

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="overflow-visible">
      <defs>
        <linearGradient id={`${uid}-metal`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={pal.metal} />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="100%" stopColor={pal.metalDark} />
        </linearGradient>
        <linearGradient id={`${uid}-edge`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={pal.metalDark} />
          <stop offset="50%" stopColor={pal.metal} />
          <stop offset="100%" stopColor="#fff" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={pal.accent} stopOpacity={glowIntensity} />
          <stop offset="100%" stopColor={pal.accent} stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-blur`}>
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Glow background */}
      {hasGlow && <circle cx="60" cy="60" r="50" fill={`url(#${uid}-glow)`} />}

      {/* Weapon body — drawn per type */}
      <g transform="translate(60 60)">
        {drawWeapon(type, rng, pal, uid, bladeLen, curveAmt, guardStyle, pommelStyle, hasEngraving)}
      </g>

      {/* Energy particles for high rarity */}
      {isHighRarity && drawParticles(rng, pal, uid)}
    </svg>
  );
}

function drawWeapon(
  type: WeaponType,
  rng: ReturnType<typeof rngFor>,
  pal: any,
  uid: string,
  bladeLen: number,
  curveAmt: number,
  guardStyle: number,
  pommelStyle: number,
  hasEngraving: boolean,
) {
  const metal = `url(#${uid}-metal)`;
  const edge = `url(#${uid}-edge)`;
  const accent = pal.accent;
  const dark = pal.metalDark;

  switch (type) {
    case 'sword':
      return drawSword(rng, metal, edge, accent, dark, bladeLen, curveAmt, guardStyle, pommelStyle, hasEngraving);
    case 'greatsword':
      return drawGreatsword(rng, metal, edge, accent, dark, bladeLen, guardStyle, hasEngraving);
    case 'katana':
      return drawKatana(rng, metal, edge, accent, dark, bladeLen, curveAmt, hasEngraving);
    case 'dagger':
    case 'knife':
      return drawDagger(rng, metal, edge, accent, dark, bladeLen, curveAmt, hasEngraving);
    case 'axe':
      return drawAxe(rng, metal, edge, accent, dark, bladeLen, hasEngraving);
    case 'hammer':
      return drawHammer(rng, metal, edge, accent, dark, bladeLen, hasEngraving);
    case 'spear':
    case 'lance':
      return drawSpear(rng, metal, edge, accent, dark, bladeLen, hasEngraving);
    case 'bow':
      return drawBow(rng, metal, edge, accent, dark, hasEngraving);
    case 'crossbow':
      return drawCrossbow(rng, metal, edge, accent, dark, hasEngraving);
    case 'scythe':
      return drawScythe(rng, metal, edge, accent, dark, bladeLen, hasEngraving);
    case 'staff':
      return drawStaff(rng, metal, edge, accent, dark, bladeLen, hasEngraving);
    default:
      return drawSword(rng, metal, edge, accent, dark, bladeLen, curveAmt, guardStyle, pommelStyle, hasEngraving);
  }
}

function drawSword(rng: any, metal: string, _edge: string, accent: string, dark: string, len: number, curve: number, guard: number, pommel: number, engraving: boolean) {
  const bladeTop = -48 * len;
  const guardW = rng.range(14, 22);
  return (
    <g>
      {/* Blade */}
      <path d={`M 0 ${bladeTop} L -4 -10 L -3 5 L 3 5 L 4 -10 Z`} fill={metal} stroke={dark} strokeWidth="0.5" transform={`rotate(${curve} 0 0)`} />
      <path d={`M 0 ${bladeTop} L 0 5`} stroke="#fff" strokeWidth="0.8" opacity="0.6" transform={`rotate(${curve} 0 0)`} />
      {/* Fuller groove */}
      {engraving && <path d={`M 0 ${bladeTop + 8} L 0 0`} stroke={accent} strokeWidth="0.6" opacity="0.7" transform={`rotate(${curve} 0 0)`} />}
      {/* Crossguard */}
      {guard === 0 && <rect x={-guardW} y="5" width={guardW * 2} height="4" rx="1" fill={metal} stroke={dark} strokeWidth="0.4" />}
      {guard === 1 && <path d={`M ${-guardW} 7 Q ${-guardW - 4} 5 ${-guardW} 3 L ${guardW} 3 Q ${guardW + 4} 5 ${guardW} 7 Z`} fill={metal} stroke={dark} strokeWidth="0.4" />}
      {guard === 2 && <path d={`M ${-guardW} 5 L ${-guardW - 3} 9 L ${guardW + 3} 9 L ${guardW} 5 Z`} fill={metal} stroke={dark} strokeWidth="0.4" />}
      {guard === 3 && <g><circle cx={-guardW} cy="7" r="3" fill={metal} /><circle cx={guardW} cy="7" r="3" fill={metal} /><rect x={-guardW + 3} y="5" width={guardW * 2 - 6} height="4" fill={metal} /></g>}
      {/* Grip */}
      <rect x="-2" y="9" width="4" height="18" rx="1" fill={dark} />
      <rect x="-2" y="9" width="4" height="18" rx="1" fill="none" stroke={accent} strokeWidth="0.4" opacity="0.5" />
      {/* Pommel */}
      {pommel === 0 && <circle cx="0" cy="29" r="3.5" fill={metal} stroke={dark} strokeWidth="0.4" />}
      {pommel === 1 && <polygon points="0,25 -3,29 0,33 3,29" fill={metal} stroke={dark} strokeWidth="0.4" />}
      {pommel === 2 && <rect x="-3.5" y="26" width="7" height="6" rx="1" fill={metal} stroke={dark} strokeWidth="0.4" />}
      {/* Gem */}
      <circle cx="0" cy="29" r="1.5" fill={accent} opacity="0.9" />
    </g>
  );
}

function drawGreatsword(rng: any, metal: string, _edge: string, accent: string, dark: string, len: number, _guard: number, engraving: boolean) {
  const bladeTop = -52 * len;
  const guardW = rng.range(20, 28);
  return (
    <g>
      {/* Big blade */}
      <path d={`M -5 ${bladeTop} L -6 -12 L -4 8 L 4 8 L 6 -12 L 5 ${bladeTop} Z`} fill={metal} stroke={dark} strokeWidth="0.5" />
      <path d={`M 0 ${bladeTop} L 0 8`} stroke="#fff" strokeWidth="1" opacity="0.5" />
      {engraving && <path d={`M -2 ${bladeTop + 10} L 2 ${bladeTop + 10} L 0 ${bladeTop + 16} Z`} fill={accent} opacity="0.6" />}
      {/* Large guard */}
      <path d={`M ${-guardW} 8 L ${-guardW - 5} 12 L ${-guardW - 5} 14 L ${guardW + 5} 14 L ${guardW + 5} 12 L ${guardW} 8 Z`} fill={metal} stroke={dark} strokeWidth="0.5" />
      <circle cx={-guardW - 2} cy="11" r="2" fill={accent} />
      <circle cx={guardW + 2} cy="11" r="2" fill={accent} />
      {/* Long grip */}
      <rect x="-2.5" y="14" width="5" height="22" rx="1" fill={dark} />
      <line x1="-2.5" y1="18" x2="2.5" y2="18" stroke={accent} strokeWidth="0.3" opacity="0.6" />
      <line x1="-2.5" y1="24" x2="2.5" y2="24" stroke={accent} strokeWidth="0.3" opacity="0.6" />
      <line x1="-2.5" y1="30" x2="2.5" y2="30" stroke={accent} strokeWidth="0.3" opacity="0.6" />
      {/* Big pommel */}
      <circle cx="0" cy="38" r="4" fill={metal} stroke={dark} strokeWidth="0.5" />
      <circle cx="0" cy="38" r="2" fill={accent} />
    </g>
  );
}

function drawKatana(_rng: any, metal: string, _edge: string, accent: string, dark: string, len: number, curve: number, engraving: boolean) {
  const bladeTop = -50 * len;
  return (
    <g>
      {/* Curved single-edge blade */}
      <path d={`M 0 ${bladeTop} Q ${curve * 0.3} -20 4 0 L 4 5 L -2 5 Q ${curve * 0.2} -15 0 ${bladeTop} Z`} fill={metal} stroke={dark} strokeWidth="0.5" />
      <path d={`M 1 ${bladeTop + 4} Q ${curve * 0.25} -18 3 0`} stroke="#fff" strokeWidth="0.6" opacity="0.6" fill="none" />
      {engraving && <circle cx="0" cy="-30" r="1.5" fill={accent} opacity="0.7" />}
      {/* Tsuba (round guard) */}
      <ellipse cx="0" cy="6" rx="6" ry="3" fill={metal} stroke={dark} strokeWidth="0.4" />
      <circle cx="0" cy="6" r="1.5" fill={accent} />
      {/* Wrapped grip */}
      <rect x="-2" y="9" width="4" height="22" rx="1" fill={dark} />
      {[12, 16, 20, 24, 28].map((y) => (
        <line key={y} x1="-2" y1={y} x2="2" y2={y + 1} stroke={accent} strokeWidth="0.5" opacity="0.7" />
      ))}
      {/* Pommel */}
      <rect x="-2.5" y="31" width="5" height="4" rx="1" fill={metal} />
    </g>
  );
}

function drawDagger(_rng: any, metal: string, _edge: string, accent: string, dark: string, len: number, curve: number, engraving: boolean) {
  const bladeTop = -38 * len;
  return (
    <g>
      {/* Short blade */}
      <path d={`M 0 ${bladeTop} L -3 -5 L -2 5 L 2 5 L 3 -5 Z`} fill={metal} stroke={dark} strokeWidth="0.4" transform={`rotate(${curve * 0.5} 0 0)`} />
      {engraving && <line x1="0" y1={bladeTop + 5} x2="0" y2="0" stroke={accent} strokeWidth="0.4" opacity="0.6" />}
      {/* Small guard */}
      <rect x="-6" y="5" width="12" height="2.5" rx="1" fill={metal} />
      {/* Grip */}
      <rect x="-1.5" y="7.5" width="3" height="14" rx="1" fill={dark} />
      <line x1="-1.5" y1="10" x2="1.5" y2="11" stroke={accent} strokeWidth="0.3" opacity="0.6" />
      <line x1="-1.5" y1="14" x2="1.5" y2="15" stroke={accent} strokeWidth="0.3" opacity="0.6" />
      <line x1="-1.5" y1="18" x2="1.5" y2="19" stroke={accent} strokeWidth="0.3" opacity="0.6" />
      {/* Pommel */}
      <circle cx="0" cy="23" r="2.5" fill={metal} stroke={dark} strokeWidth="0.3" />
      <circle cx="0" cy="23" r="1" fill={accent} />
    </g>
  );
}

function drawAxe(rng: any, metal: string, _edge: string, accent: string, dark: string, _len: number, engraving: boolean) {
  const bladeStyle = rng.int(0, 2);
  return (
    <g>
      {/* Handle */}
      <rect x="-1.5" y="-40" width="3" height="70" rx="1" fill="#5b3a1a" stroke="#3a2510" strokeWidth="0.3" />
      <line x1="0" y1="-38" x2="0" y2="28" stroke="#7a5a2a" strokeWidth="0.4" opacity="0.5" />
      {/* Axe head */}
      {bladeStyle === 0 && (
        <path d="M 1 -30 Q 20 -28 22 -18 Q 20 -8 1 -10 Z" fill={metal} stroke={dark} strokeWidth="0.5" />
      )}
      {bladeStyle === 1 && (
        <path d="M 1 -32 L 18 -30 L 24 -20 L 20 -8 L 1 -12 Z" fill={metal} stroke={dark} strokeWidth="0.5" />
      )}
      {bladeStyle === 2 && (
        <g>
          <path d="M 1 -32 Q 16 -30 22 -20 Q 16 -10 1 -12 Z" fill={metal} stroke={dark} strokeWidth="0.5" />
          <path d="M -1 -32 Q -16 -30 -22 -20 Q -16 -10 -1 -12 Z" fill={metal} stroke={dark} strokeWidth="0.5" />
        </g>
      )}
      {/* Edge highlight */}
      <path d="M 22 -20 Q 20 -15 18 -12" stroke="#fff" strokeWidth="0.6" opacity="0.5" fill="none" />
      {engraving && <circle cx="10" cy="-20" r="2" fill={accent} opacity="0.7" />}
      {/* Pommel cap */}
      <circle cx="0" cy="30" r="2.5" fill={metal} />
    </g>
  );
}

function drawHammer(rng: any, metal: string, _edge: string, accent: string, dark: string, _len: number, engraving: boolean) {
  const headW = rng.range(16, 22);
  return (
    <g>
      {/* Handle */}
      <rect x="-1.5" y="-15" width="3" height="50" rx="1" fill="#5b3a1a" stroke="#3a2510" strokeWidth="0.3" />
      {/* Hammer head */}
      <rect x={-headW / 2} y={-22} width={headW} height="14" rx="2" fill={metal} stroke={dark} strokeWidth="0.5" />
      <rect x={-headW / 2} y={-22} width={headW} height="3" fill="#fff" opacity="0.3" />
      {engraving && <circle cx="0" cy="-15" r="2" fill={accent} opacity="0.8" />}
      {/* Side details */}
      <rect x={-headW / 2 - 2} y={-19} width="3" height="8" rx="1" fill={metal} stroke={dark} strokeWidth="0.3" />
      <rect x={headW / 2 - 1} y={-19} width="3" height="8" rx="1" fill={metal} stroke={dark} strokeWidth="0.3" />
      {/* Pommel */}
      <circle cx="0" cy="35" r="2.5" fill={metal} />
    </g>
  );
}

function drawSpear(_rng: any, metal: string, _edge: string, accent: string, dark: string, _len: number, engraving: boolean) {
  return (
    <g>
      {/* Long shaft */}
      <rect x="-1" y="-45" width="2" height="80" fill="#5b3a1a" stroke="#3a2510" strokeWidth="0.3" />
      {/* Spearhead */}
      <path d="M 0 -52 L -4 -30 L 0 -25 L 4 -30 Z" fill={metal} stroke={dark} strokeWidth="0.5" />
      <path d="M 0 -52 L 0 -25" stroke="#fff" strokeWidth="0.5" opacity="0.5" />
      {engraving && <line x1="0" y1="-45" x2="0" y2="-32" stroke={accent} strokeWidth="0.5" opacity="0.7" />}
      {/* Binding */}
      <rect x="-2" y="-28" width="4" height="4" fill={dark} />
      {/* Butt */}
      <path d="M -1 35 L 0 42 L 1 35 Z" fill={metal} />
    </g>
  );
}

function drawBow(rng: any, metal: string, _edge: string, accent: string, dark: string, engraving: boolean) {
  const curve = rng.range(30, 40);
  return (
    <g>
      {/* Bow limbs */}
      <path d={`M 0 -45 Q ${curve} 0 0 45`} fill="none" stroke={metal} strokeWidth="3" strokeLinecap="round" />
      <path d={`M 0 -45 Q ${curve} 0 0 45`} fill="none" stroke={dark} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      {/* Grip */}
      <rect x="-2" y="-6" width="6" height="12" rx="1" fill={dark} />
      <line x1="-2" y1="-4" x2="4" y2="-3" stroke={accent} strokeWidth="0.3" opacity="0.6" />
      <line x1="-2" y1="0" x2="4" y2="1" stroke={accent} strokeWidth="0.3" opacity="0.6" />
      <line x1="-2" y1="4" x2="4" y2="5" stroke={accent} strokeWidth="0.3" opacity="0.6" />
      {/* String */}
      <line x1="0" y1="-45" x2="0" y2="45" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.7" />
      {/* Tips */}
      <circle cx="0" cy="-45" r="1.5" fill={metal} />
      <circle cx="0" cy="45" r="1.5" fill={metal} />
      {engraving && <circle cx={curve * 0.5} cy="0" r="2" fill={accent} opacity="0.7" />}
    </g>
  );
}

function drawCrossbow(_rng: any, metal: string, _edge: string, accent: string, dark: string, engraving: boolean) {
  return (
    <g>
      {/* Stock */}
      <rect x="-3" y="-5" width="30" height="10" rx="1" fill={dark} />
      <rect x="-3" y="-5" width="30" height="3" fill={metal} opacity="0.5" />
      {/* Limbs */}
      <rect x="10" y="-25" width="3" height="50" rx="1" fill={metal} stroke={dark} strokeWidth="0.3" />
      {/* String */}
      <path d="M 10 -25 Q 0 0 10 25" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.7" />
      {/* Trigger */}
      <rect x="2" y="5" width="2" height="6" fill={metal} />
      {/* Bolt */}
      <path d="M -8 0 L -3 -1.5 L -3 1.5 Z" fill={metal} />
      {engraving && <circle cx="12" cy="0" r="2" fill={accent} opacity="0.7" />}
    </g>
  );
}

function drawScythe(_rng: any, metal: string, _edge: string, accent: string, dark: string, _len: number, engraving: boolean) {
  return (
    <g>
      {/* Shaft */}
      <rect x="-1" y="-45" width="2" height="85" fill="#5b3a1a" stroke="#3a2510" strokeWidth="0.3" />
      {/* Blade — curved */}
      <path d="M 0 -45 Q 30 -50 35 -25 Q 30 -15 5 -30" fill={metal} stroke={dark} strokeWidth="0.5" />
      <path d="M 5 -30 Q 25 -22 32 -25" stroke="#fff" strokeWidth="0.6" opacity="0.5" fill="none" />
      {engraving && <circle cx="20" cy="-32" r="1.5" fill={accent} opacity="0.7" />}
      {/* Binding */}
      <rect x="-2" y="-43" width="4" height="4" fill={dark} />
    </g>
  );
}

function drawStaff(rng: any, metal: string, _edge: string, accent: string, dark: string, _len: number, _engraving: boolean) {
  const orbStyle = rng.int(0, 2);
  return (
    <g>
      {/* Shaft */}
      <rect x="-1.5" y="-10" width="3" height="55" rx="1" fill="#5b3a1a" stroke="#3a2510" strokeWidth="0.3" />
      <line x1="0" y1="-8" x2="0" y2="43" stroke="#7a5a2a" strokeWidth="0.4" opacity="0.5" />
      {/* Orb holder */}
      <path d="M -8 -15 Q -10 -25 0 -28 Q 10 -25 8 -15 Z" fill={metal} stroke={dark} strokeWidth="0.4" />
      {/* Orb */}
      {orbStyle === 0 && <circle cx="0" cy="-25" r="6" fill={accent} opacity="0.9" />}
      {orbStyle === 1 && <polygon points="0,-32 5,-25 0,-18 -5,-25" fill={accent} opacity="0.9" />}
      {orbStyle === 2 && <circle cx="0" cy="-25" r="6" fill="none" stroke={accent} strokeWidth="2" />}
      <circle cx="0" cy="-25" r="3" fill="#fff" opacity="0.4" />
      {/* Bottom cap */}
      <circle cx="0" cy="45" r="2" fill={metal} />
    </g>
  );
}

function drawParticles(rng: any, pal: any, _uid: string) {
  const particles = Array.from({ length: 6 }, (_, _i) => ({
    x: rng.range(-40, 40),
    y: rng.range(-40, 40),
    r: rng.range(0.8, 2),
    delay: rng.range(0, 2),
  }));
  return (
    <g>
      {particles.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill={pal.energy}
          opacity="0.7"
          style={{
            animation: `floatParticle ${3 + p.delay}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            transformOrigin: `${p.x}px ${p.y}px`,
          }}
        />
      ))}
      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </g>
  );
}
