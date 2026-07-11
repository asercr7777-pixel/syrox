import { rngFor } from '../lib/seeded';

interface ArtProps {
  id: string;
  name: string;
  size?: number;
  animated?: boolean;
}

type SceneType = 'shadow_realm' | 'crimson_eclipse' | 'frozen_kingdom' | 'celestial_sky' | 'dragons_lair' | 'abyss_gate' | 'mystic_forest' | 'neon_city' | 'galaxy_horizon' | 'throne_of_monarch';

function detectScene(name: string): SceneType {
  const n = name.toLowerCase();
  if (n.includes('shadow realm')) return 'shadow_realm';
  if (n.includes('crimson eclipse')) return 'crimson_eclipse';
  if (n.includes('frozen')) return 'frozen_kingdom';
  if (n.includes('celestial')) return 'celestial_sky';
  if (n.includes("dragon")) return 'dragons_lair';
  if (n.includes('abyss')) return 'abyss_gate';
  if (n.includes('mystic') || n.includes('forest')) return 'mystic_forest';
  if (n.includes('neon')) return 'neon_city';
  if (n.includes('galaxy')) return 'galaxy_horizon';
  if (n.includes('throne') || n.includes('monarch')) return 'throne_of_monarch';
  return 'shadow_realm';
}

export function BackgroundArt({ id, name, size = 200, animated = true }: ArtProps) {
  const rng = rngFor(id);
  const scene = detectScene(name);
  const uid = `bg-${id}`;

  return (
    <svg viewBox="0 0 200 120" width={size} height={size * 0.6} className="overflow-hidden rounded-lg" preserveAspectRatio="xMidYMid slice">
      <defs>
        {scene === 'shadow_realm' && <radialGradient id={`${uid}-sky`} cx="50%" cy="30%" r="80%"><stop offset="0%" stopColor="#1e1b4b" /><stop offset="100%" stopColor="#05060a" /></radialGradient>}
        {scene === 'crimson_eclipse' && <radialGradient id={`${uid}-sky`} cx="50%" cy="40%" r="70%"><stop offset="0%" stopColor="#7f1d1d" /><stop offset="100%" stopColor="#05060a" /></radialGradient>}
        {scene === 'frozen_kingdom' && <radialGradient id={`${uid}-sky`} cx="50%" cy="20%" r="80%"><stop offset="0%" stopColor="#0c4a6e" /><stop offset="100%" stopColor="#05060a" /></radialGradient>}
        {scene === 'celestial_sky' && <radialGradient id={`${uid}-sky`} cx="50%" cy="30%" r="80%"><stop offset="0%" stopColor="#1e3a8a" /><stop offset="100%" stopColor="#05060a" /></radialGradient>}
        {scene === 'dragons_lair' && <radialGradient id={`${uid}-sky`} cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="#14532d" /><stop offset="100%" stopColor="#05060a" /></radialGradient>}
        {scene === 'abyss_gate' && <radialGradient id={`${uid}-sky`} cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="#4c1d95" /><stop offset="100%" stopColor="#05060a" /></radialGradient>}
        {scene === 'mystic_forest' && <radialGradient id={`${uid}-sky`} cx="50%" cy="30%" r="80%"><stop offset="0%" stopColor="#064e3b" /><stop offset="100%" stopColor="#05060a" /></radialGradient>}
        {scene === 'neon_city' && <linearGradient id={`${uid}-sky`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#0f172a" /><stop offset="60%" stopColor="#1e1b4b" /><stop offset="100%" stopColor="#0c4a6e" /></linearGradient>}
        {scene === 'galaxy_horizon' && <radialGradient id={`${uid}-sky`} cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="#312e81" /><stop offset="100%" stopColor="#05060a" /></radialGradient>}
        {scene === 'throne_of_monarch' && <radialGradient id={`${uid}-sky`} cx="50%" cy="40%" r="70%"><stop offset="0%" stopColor="#78350f" /><stop offset="100%" stopColor="#05060a" /></radialGradient>}
      </defs>

      {drawScene(scene, rng, uid, animated)}
    </svg>
  );
}

function drawScene(scene: SceneType, rng: any, uid: string, animated: boolean) {
  const sky = `url(#${uid}-sky)`;

  switch (scene) {
    case 'shadow_realm': return (
      <g>
        <rect width="200" height="120" fill={sky} />
        {/* Floating shadow particles */}
        {Array.from({ length: 20 }, (_, i) => (
          <circle key={i} cx={rng.range(0, 200)} cy={rng.range(0, 120)} r={rng.range(0.5, 2)} fill="#a78bfa" opacity={rng.range(0.2, 0.6)} className={animated ? `${uid}-float` : ''} style={animated ? { animationDelay: `${rng.range(0, 3)}s`, animationDuration: `${rng.range(4, 8)}s` } : {}} />
        ))}
        {/* Shadow pillars */}
        <path d="M 20 120 L 30 60 L 40 120 Z" fill="#0a0c14" opacity="0.8" />
        <path d="M 160 120 L 170 50 L 180 120 Z" fill="#0a0c14" opacity="0.8" />
        <path d="M 80 120 L 100 40 L 120 120 Z" fill="#0a0c14" opacity="0.6" />
        {/* Fog */}
        <ellipse cx="100" cy="100" rx="120" ry="20" fill="#1e1b4b" opacity="0.4" className={animated ? `${uid}-float` : ''} />
      </g>
    );
    case 'crimson_eclipse': return (
      <g>
        <rect width="200" height="120" fill={sky} />
        {/* Eclipse */}
        <circle cx="100" cy="50" r="28" fill="#dc2626" opacity="0.3" />
        <circle cx="100" cy="50" r="22" fill="#05060a" />
        <circle cx="100" cy="50" r="22" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.6" />
        {/* Blood particles */}
        {Array.from({ length: 15 }, (_, i) => (
          <circle key={i} cx={rng.range(0, 200)} cy={rng.range(0, 100)} r={rng.range(0.5, 1.5)} fill="#f43f5e" opacity={rng.range(0.3, 0.7)} className={animated ? `${uid}-float` : ''} style={animated ? { animationDelay: `${rng.range(0, 2)}s` } : {}} />
        ))}
        {/* Mountains */}
        <path d="M 0 120 L 40 80 L 80 120 Z" fill="#1a0510" />
        <path d="M 120 120 L 160 70 L 200 120 Z" fill="#1a0510" />
      </g>
    );
    case 'frozen_kingdom': return (
      <g>
        <rect width="200" height="120" fill={sky} />
        {/* Aurora */}
        <path d="M 0 30 Q 100 10 200 30 Q 200 50 100 40 Q 0 50 0 30" fill="#38bdf8" opacity="0.2" className={animated ? `${uid}-float` : ''} />
        {/* Snow */}
        {Array.from({ length: 25 }, (_, i) => (
          <circle key={i} cx={rng.range(0, 200)} cy={rng.range(0, 120)} r={rng.range(0.5, 1.5)} fill="#fff" opacity={rng.range(0.4, 0.8)} className={animated ? `${uid}-snow` : ''} style={animated ? { animationDelay: `${rng.range(0, 3)}s`, animationDuration: `${rng.range(3, 6)}s` } : {}} />
        ))}
        {/* Ice mountains */}
        <path d="M 0 120 L 50 60 L 100 120 Z" fill="#0c4a6e" opacity="0.7" />
        <path d="M 100 120 L 150 50 L 200 120 Z" fill="#0c4a6e" opacity="0.7" />
        <polygon points="50,60 55,65 50,70 45,65" fill="#fff" opacity="0.6" />
        <polygon points="150,50 155,55 150,60 145,55" fill="#fff" opacity="0.6" />
      </g>
    );
    case 'celestial_sky': return (
      <g>
        <rect width="200" height="120" fill={sky} />
        {/* Stars */}
        {Array.from({ length: 30 }, (_, i) => (
          <circle key={i} cx={rng.range(0, 200)} cy={rng.range(0, 100)} r={rng.range(0.3, 1.5)} fill="#fff" opacity={rng.range(0.4, 1)} className={animated ? `${uid}-twinkle` : ''} style={animated ? { animationDelay: `${rng.range(0, 3)}s` } : {}} />
        ))}
        {/* Light rays */}
        <path d="M 100 0 L 80 120 L 120 120 Z" fill="#fbbf24" opacity="0.1" />
        {/* Clouds */}
        <ellipse cx="40" cy="80" rx="30" ry="8" fill="#fff" opacity="0.15" className={animated ? `${uid}-float` : ''} />
        <ellipse cx="160" cy="70" rx="25" ry="6" fill="#fff" opacity="0.15" className={animated ? `${uid}-float` : ''} style={animated ? { animationDelay: '1s' } : {}} />
      </g>
    );
    case 'dragons_lair': return (
      <g>
        <rect width="200" height="120" fill={sky} />
        {/* Cave arch */}
        <path d="M 20 120 L 20 60 Q 100 20 180 60 L 180 120 Z" fill="#020408" opacity="0.6" />
        {/* Dragon glow */}
        <circle cx="100" cy="70" r="20" fill="#16a34a" opacity="0.2" className={animated ? `${uid}-pulse` : ''} />
        {/* Embers */}
        {Array.from({ length: 18 }, (_, i) => (
          <circle key={i} cx={rng.range(40, 160)} cy={rng.range(60, 110)} r={rng.range(0.5, 1.5)} fill="#f97316" opacity={rng.range(0.4, 0.8)} className={animated ? `${uid}-ember` : ''} style={animated ? { animationDelay: `${rng.range(0, 2)}s`, animationDuration: `${rng.range(2, 4)}s` } : {}} />
        ))}
        {/* Dragon eye */}
        <ellipse cx="100" cy="70" rx="6" ry="3" fill="#dc2626" opacity="0.8" />
        <circle cx="100" cy="70" r="1.5" fill="#fff" />
      </g>
    );
    case 'abyss_gate': return (
      <g>
        <rect width="200" height="120" fill={sky} />
        {/* Gate */}
        <ellipse cx="100" cy="60" rx="30" ry="50" fill="#05060a" />
        <ellipse cx="100" cy="60" rx="30" ry="50" fill="none" stroke="#7c3aed" strokeWidth="1.5" opacity="0.7" className={animated ? `${uid}-pulse` : ''} />
        <ellipse cx="100" cy="60" rx="24" ry="44" fill="none" stroke="#a78bfa" strokeWidth="0.5" opacity="0.5" />
        {/* Void particles */}
        {Array.from({ length: 20 }, (_, i) => (
          <circle key={i} cx={rng.range(60, 140)} cy={rng.range(20, 100)} r={rng.range(0.5, 2)} fill="#a78bfa" opacity={rng.range(0.3, 0.7)} className={animated ? `${uid}-float` : ''} style={animated ? { animationDelay: `${rng.range(0, 3)}s` } : {}} />
        ))}
        {/* Pillars */}
        <rect x="60" y="40" width="6" height="70" fill="#1e1b4b" />
        <rect x="134" y="40" width="6" height="70" fill="#1e1b4b" />
      </g>
    );
    case 'mystic_forest': return (
      <g>
        <rect width="200" height="120" fill={sky} />
        {/* Trees */}
        {[20, 50, 150, 180].map((x, i) => (
          <g key={i}>
            <rect x={x - 2} y={60 + (i % 2) * 10} width="4" height="50" fill="#1a2a1a" />
            <path d={`M ${x} ${50 + (i % 2) * 10} L ${x - 15} ${80 + (i % 2) * 10} L ${x + 15} ${80 + (i % 2) * 10} Z`} fill="#064e3b" opacity="0.8" />
          </g>
        ))}
        {/* Fireflies */}
        {Array.from({ length: 15 }, (_, i) => (
          <circle key={i} cx={rng.range(0, 200)} cy={rng.range(40, 100)} r={rng.range(0.5, 1.5)} fill="#fbbf24" opacity={rng.range(0.4, 0.8)} className={animated ? `${uid}-twinkle` : ''} style={animated ? { animationDelay: `${rng.range(0, 3)}s`, animationDuration: `${rng.range(2, 5)}s` } : {}} />
        ))}
        {/* Fog */}
        <ellipse cx="100" cy="110" rx="120" ry="15" fill="#064e3b" opacity="0.3" className={animated ? `${uid}-float` : ''} />
      </g>
    );
    case 'neon_city': return (
      <g>
        <rect width="200" height="120" fill={sky} />
        {/* Buildings */}
        {Array.from({ length: 12 }, (_, i) => {
          const x = i * 18;
          const h = rng.range(40, 90);
          return (
            <g key={i}>
              <rect x={x} y={120 - h} width="14" height={h} fill="#0a0c14" />
              <rect x={x} y={120 - h} width="14" height="2" fill={rng.pick(['#06b6d4', '#a855f7', '#ec4899'])} opacity="0.8" />
              {/* Windows */}
              {Array.from({ length: Math.floor(h / 8) }, (_, j) => (
                <rect key={j} x={x + 2} y={120 - h + 4 + j * 8} width="2" height="2" fill={rng.bool() ? '#fbbf24' : '#06b6d4'} opacity={rng.range(0.3, 0.8)} />
              ))}
            </g>
          );
        })}
        {/* Neon glow */}
        <rect x="0" y="100" width="200" height="20" fill="#06b6d4" opacity="0.1" />
      </g>
    );
    case 'galaxy_horizon': return (
      <g>
        <rect width="200" height="120" fill={sky} />
        {/* Galaxy spiral */}
        <path d="M 100 60 Q 140 40 160 60 Q 140 80 100 60 Q 60 80 40 60 Q 60 40 100 60" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.4" className={animated ? `${uid}-pulse` : ''} />
        {/* Stars */}
        {Array.from({ length: 40 }, (_, i) => (
          <circle key={i} cx={rng.range(0, 200)} cy={rng.range(0, 120)} r={rng.range(0.3, 1.5)} fill={rng.bool() ? '#fff' : '#a78bfa'} opacity={rng.range(0.3, 1)} className={animated ? `${uid}-twinkle` : ''} style={animated ? { animationDelay: `${rng.range(0, 3)}s` } : {}} />
        ))}
        {/* Nebula */}
        <ellipse cx="60" cy="40" rx="40" ry="15" fill="#7c3aed" opacity="0.15" />
        <ellipse cx="140" cy="80" rx="35" ry="12" fill="#ec4899" opacity="0.15" />
      </g>
    );
    case 'throne_of_monarch': return (
      <g>
        <rect width="200" height="120" fill={sky} />
        {/* Throne */}
        <path d="M 70 120 L 70 70 L 80 60 L 80 50 L 120 50 L 120 60 L 130 70 L 130 120 Z" fill="#1a1008" />
        <path d="M 75 115 L 125 115 L 125 75 L 120 65 L 80 65 L 75 75 Z" fill="#78350f" opacity="0.6" />
        {/* Crown on throne */}
        <polygon points="90,50 95,42 100,48 105,42 110,50" fill="#fbbf24" />
        {/* Light rays */}
        <path d="M 100 50 L 60 120 L 140 120 Z" fill="#fbbf24" opacity="0.08" />
        {/* Particles */}
        {Array.from({ length: 15 }, (_, i) => (
          <circle key={i} cx={rng.range(0, 200)} cy={rng.range(0, 100)} r={rng.range(0.5, 1.5)} fill="#fbbf24" opacity={rng.range(0.3, 0.7)} className={animated ? `${uid}-float` : ''} style={animated ? { animationDelay: `${rng.range(0, 3)}s` } : {}} />
        ))}
        {/* Steps */}
        <rect x="60" y="115" width="80" height="5" fill="#3a2510" />
        <rect x="55" y="110" width="90" height="5" fill="#2a1a08" />
      </g>
    );
    default: return null;
  }
}
