import { useEffect, useState } from 'react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 360;
    let raf = 0;
    const tick = (now: number) => {
      const value = Math.min(100, ((now - start) / duration) * 100);
      setProgress(value);
      if (value < 100) raf = requestAnimationFrame(tick);
      else {
        setExiting(true);
        window.setTimeout(onComplete, 90);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  if (exiting) return null;

  return (
    <div className="stryven-splash fixed inset-0 z-[9999] flex flex-col items-center justify-center">
      <div className="stryven-splash-glow" />
      <div className="relative mb-7">
        <div className="stryven-splash-pulse absolute -inset-7 rounded-full" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background:'linear-gradient(135deg,#1a1e2e,#0a0c14)', border:'1px solid rgba(255,122,24,.2)', boxShadow:'0 0 40px rgba(255,122,24,.15)' }}>
          <svg width="48" height="48" viewBox="0 0 512 512" fill="none" aria-hidden="true">
            <defs><linearGradient id="splashFlame" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stopColor="#ffd9b3"/><stop offset="40%" stopColor="#ff7a18"/><stop offset="100%" stopColor="#c44600"/></linearGradient></defs>
            <g transform="translate(256 280)"><path d="M0 -120 C-35 -80 -55 -40 -55 0 C-55 50 -30 90 0 110 C30 90 55 50 55 0 C55 -40 35 -80 0 -120 Z" fill="url(#splashFlame)"/><path d="M0 -80 C-20 -50 -32 -20 -32 10 C-32 45 -15 75 0 90 C15 75 32 45 32 10 C32 -20 20 -50 0 -80 Z" fill="#ff9a3c" opacity=".7"/><path d="M0 -40 C-10 -20 -16 -5 -16 12 C-16 35 -8 55 0 65 C8 55 16 35 16 12 C16 -5 10 -20 0 -40 Z" fill="#ffd9b3" opacity=".5"/></g>
          </svg>
        </div>
      </div>
      <h1 className="font-display mb-2 text-2xl font-bold tracking-[.15em] text-[#e6eaf5]">DISCIPLINE</h1>
      <p className="mb-9 text-xs uppercase tracking-widest text-slate-500">Rise</p>
      <div className="h-0.5 w-44 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full" style={{ width:`${progress}%`, background:'linear-gradient(90deg,#ff9a3c,#ff7a18)', boxShadow:'0 0 8px rgba(255,122,24,.5)' }} /></div>
      <p className="mt-3 text-[10px] tracking-wide text-slate-600">Loading your journey...</p>
    </div>
  );
}
