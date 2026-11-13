import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 320;
    let raf = 0;
    let doneTimer: number | undefined;
    const tick = (now: number) => {
      const value = Math.min(100, ((now - start) / duration) * 100);
      setProgress(value);
      if (value < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setExiting(true);
        doneTimer = window.setTimeout(onComplete, 80);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (doneTimer !== undefined) window.clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (exiting) return null;

  return (
    <div
      onClick={onComplete}
      className="stryven-splash fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070a12] cursor-pointer select-none"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(167,139,250,0.18), transparent 45%), radial-gradient(circle at 50% 60%, rgba(92,236,255,0.08), transparent 55%)',
        }}
      />
      <div className="relative mb-6">
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#a78bfa]/35"
          style={{
            background: 'linear-gradient(135deg, #141a2e, #070a12)',
            boxShadow: '0 0 42px rgba(167,139,250,0.22)',
          }}
        >
          <Shield size={36} className="text-[#a78bfa]" />
        </div>
      </div>
      <h1 className="font-display mb-1.5 text-2xl font-black tracking-[0.22em] text-[#eef2ff]">STRYVEN</h1>
      <p className="mb-8 font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-[#5cecff]">
        HUNTER OPERATING SYSTEM
      </p>
      <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #a78bfa, #5cecff)',
            boxShadow: '0 0 10px rgba(92,236,255,0.55)',
          }}
        />
      </div>
      <p className="mt-3 font-mono text-[10px] tracking-widest text-[#64748b] uppercase">
        Synchronizing system core…
      </p>
    </div>
  );
}
