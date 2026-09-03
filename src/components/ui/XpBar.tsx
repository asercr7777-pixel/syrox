import { useEffect, useRef, useState } from 'react';
import { levelProgress } from '../../store/defaults';

interface XpBarProps {
  xp: number;
  showNumbers?: boolean;
  compact?: boolean;
}

export function XpBar({ xp, showNumbers = true, compact = false }: XpBarProps) {
  const prog = levelProgress(xp);
  const prevXp = useRef(xp);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [float, setFloat] = useState<{ id: number; amount: number } | null>(null);

  useEffect(() => {
    const diff = xp - prevXp.current;
    prevXp.current = xp;
    if (diff <= 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    const id = Date.now();
    setFloat({ id, amount: diff });
    timerRef.current = setTimeout(() => {
      setFloat((current) => (current?.id === id ? null : current));
      timerRef.current = null;
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [xp]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="w-full relative">
      {showNumbers && (
        <div className={`flex items-center justify-between mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
          <span className="font-semibold text-ink-200">Level {prog.level}</span>
          <span className="text-ink-300 tabular-nums">
            {prog.current.toLocaleString()} / {prog.needed.toLocaleString()} XP
          </span>
        </div>
      )}
      <div className={`w-full ${compact ? 'h-2' : 'h-3'} bg-ink-950 rounded-full overflow-hidden border border-white/5 relative`}>
        <div
          className="h-full xp-bar-fill rounded-full transition-all duration-700 ease-out"
          style={{ width: `${prog.pct}%` }}
        />
        <div
          className="absolute inset-x-0 top-0 h-1/2 rounded-full pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)' }}
        />
      </div>
      {float && (
        <div
          key={float.id}
          className="xp-float absolute right-0 top-0 text-sm font-bold text-ember-400"
          style={{ textShadow: '0 0 8px rgba(255,122,24,0.6)' }}
          aria-hidden="true"
        >
          +{float.amount.toLocaleString()} XP
        </div>
      )}
    </div>
  );
}
