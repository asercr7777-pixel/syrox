import { useMemo } from 'react';

interface ParticleFieldProps {
  count?: number;
  color?: string;
  type?: 'float' | 'embers' | 'snow' | 'darkness';
}

export function ParticleField({ count = 20, color = '#a78bfa', type = 'float' }: ParticleFieldProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const seed = i * 137.5;
      return {
        id: i,
        left: `${(seed * 7) % 100}%`,
        top: `${(seed * 13) % 100}%`,
        size: type === 'embers' ? 3 + (i % 4) : 2 + (i % 3),
        delay: `${(i * 0.3) % 5}s`,
        duration: `${4 + (i % 5)}s`,
        opacity: type === 'darkness' ? 0.15 : 0.3 + (i % 3) * 0.1,
      };
    });
  }, [count, type]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: color,
            opacity: p.opacity,
            filter: `blur(${type === 'embers' ? 1 : 0.5}px)`,
            boxShadow: type === 'embers' ? `0 0 ${p.size * 2}px ${color}` : 'none',
            animation: `${type === 'embers' ? 'emberFloat' : type === 'snow' ? 'snowFall' : 'floatParticle'} ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
