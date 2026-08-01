import { useState, useCallback, useRef, useEffect } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  duration: number;
  borderRadius: string;
}

const COLORS = ['#ff7a18', '#fbbf24', '#a855f7', '#06b6d4', '#10b981', '#f43f5e'];

let burstListener: ((n: number) => void) | null = null;

export function triggerConfetti(count = 60) {
  if (burstListener) burstListener(count);
}

export function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const idRef = useRef(0);

  const burst = useCallback((count: number) => {
    const batch: ConfettiPiece[] = [];
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      const duration = 1.5 + Math.random() * 0.8;
      batch.push({
        id: idRef.current++,
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        duration,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      });
    }
    setPieces((prev) => [...prev, ...batch]);
  }, []);

  useEffect(() => {
    burstListener = burst;
    return () => { burstListener = null; };
  }, [burst]);

  const handleAnimationEnd = useCallback((id: number) => {
    setPieces((prev) => prev.filter((p) => p.id !== id));
  }, []);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          onAnimationEnd={() => handleAnimationEnd(p.id)}
          style={{
            position: 'absolute',
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: p.borderRadius,
            ['--confetti-vx' as any]: `${p.vx * p.duration}px`,
            ['--confetti-vy' as any]: `${(p.vy + 200) * p.duration}px`,
            ['--confetti-rot' as any]: `${(Math.random() - 0.5) * 720 * p.duration}deg`,
            animation: `confettiBurst ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
          }}
        />
      ))}
    </div>
  );
}
