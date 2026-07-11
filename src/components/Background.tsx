import { useEffect, useState, useCallback, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { BACKGROUNDS } from '../data/collections';

type WeatherType = 'clear' | 'rain' | 'storm' | 'snow';

function getWeatherForHour(): WeatherType {
  const hour = new Date().getHours();
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const seed = (dayOfYear * 24 + hour) % 7;
  if (seed === 0) return 'rain';
  if (seed === 1) return 'storm';
  if (seed === 2) return 'snow';
  return 'clear';
}

function getTimeOfDay(): 'morning' | 'day' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

const TIME_OVERLAYS: Record<string, string> = {
  morning: 'linear-gradient(180deg, rgba(251,146,60,0.08) 0%, transparent 50%)',
  day: 'linear-gradient(180deg, rgba(59,130,246,0.05) 0%, transparent 50%)',
  evening: 'linear-gradient(180deg, rgba(168,85,247,0.1) 0%, transparent 50%)',
  night: 'linear-gradient(180deg, rgba(10,12,20,0.2) 0%, transparent 40%)',
};

const PARTICLE_COUNT = 18;

export function Background() {
  const { state } = useStore();
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'day' | 'evening' | 'night'>('night');
  const [imgError, setImgError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    setWeather(getWeatherForHour());
    setTimeOfDay(getTimeOfDay());
    const interval = setInterval(() => {
      setWeather(getWeatherForHour());
      setTimeOfDay(getTimeOfDay());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { setImgError(false); }, [state.customBackground]);
  useEffect(() => { setVideoError(false); }, [state.backgroundVideo]);

  const brightness = state.backgroundBrightness / 100;
  const blurFilter = state.backgroundBlur > 0 ? `blur(${state.backgroundBlur}px)` : 'none';
  const transform = state.backgroundBlur > 0 ? 'scale(1.1)' : 'none';

  const handleImgError = useCallback(() => setImgError(true), [state.customBackground]);
  const handleVideoError = useCallback(() => setVideoError(true), [state.backgroundVideo]);

  // Pre-compute particle positions so they don't re-randomize on re-render
  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 10,
      dx: (Math.random() - 0.5) * 60,
      dy: -(80 + Math.random() * 120),
      opacity: 0.2 + Math.random() * 0.3,
    })), []);

  const renderBackgroundLayer = () => {
    if (state.backgroundType === 'video' && state.backgroundVideo && !videoError) {
      return (
        <video
          autoPlay muted loop playsInline
          className="fixed inset-0 w-full h-full object-cover"
          style={{ filter: `brightness(${brightness}) ${blurFilter}`, transform, zIndex: -20 }}
          src={state.backgroundVideo}
          onError={handleVideoError}
        />
      );
    }
    if (state.backgroundType === 'image' && state.customBackground && !imgError) {
      return (
        <>
          <div
            className="fixed inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${state.customBackground}")`, filter: `brightness(${brightness}) ${blurFilter}`, transform, zIndex: -20 }}
          />
          <img src={state.customBackground} alt="" className="hidden" onError={handleImgError} onLoad={() => setImgError(false)} />
        </>
      );
    }
    if (state.backgroundType === 'animated' && state.selectedBackgroundId) {
      const bg = BACKGROUNDS.find((b) => b.id === state.selectedBackgroundId);
      if (bg) {
        return <div className="fixed inset-0" style={{ background: bg.css, filter: `brightness(${brightness}) ${blurFilter}`, transform, zIndex: -20 }} />;
      }
    }
    return null;
  };

  return (
    <>
      <div className="fixed inset-0 bg-ink-950" style={{ zIndex: -30 }} />
      {renderBackgroundLayer()}

      {/* Ambient fog layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -18 }}>
        <div
          className="fog-drift absolute top-0 left-0 w-[120%] h-[60%] rounded-full"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(139,92,246,0.06), transparent 60%)' }}
        />
        <div
          className="fog-drift absolute bottom-0 right-0 w-[120%] h-[60%] rounded-full"
          style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(255,122,24,0.05), transparent 60%)', animationDelay: '5s' }}
        />
      </div>

      {/* Floating energy particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -17 }}>
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle-drift absolute rounded-full"
            style={{
              left: `${p.left}%`,
              bottom: '-10px',
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: `radial-gradient(circle, rgba(167,139,250,${p.opacity}), transparent 70%)`,
              ['--dx' as any]: `${p.dx}px`,
              ['--dy' as any]: `${p.dy}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Time of day overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: TIME_OVERLAYS[timeOfDay], zIndex: -15 }} />

      {/* Weather effects */}
      {weather === 'rain' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -15 }}>
          {Array.from({ length: 40 }, (_, i) => (
            <div key={i} className="absolute w-px h-8 bg-gradient-to-b from-transparent via-frost-400/20 to-frost-400/40"
              style={{ left: `${(i * 2.5)}%`, top: '-32px', animation: `rainFall ${0.8 + (i % 5) * 0.2}s linear infinite`, animationDelay: `${(i % 7) * 0.15}s` }} />
          ))}
        </div>
      )}
      {weather === 'storm' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -15 }}>
          {Array.from({ length: 60 }, (_, i) => (
            <div key={i} className="absolute w-px h-10 bg-gradient-to-b from-transparent via-frost-300/30 to-frost-300/60"
              style={{ left: `${(i * 1.7)}%`, top: '-40px', animation: `rainFall ${0.5 + (i % 4) * 0.15}s linear infinite`, animationDelay: `${(i % 9) * 0.1}s` }} />
          ))}
        </div>
      )}
      {weather === 'snow' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -15 }}>
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} className="absolute w-1 h-1 rounded-full bg-white/40"
              style={{ left: `${(i * 3.3)}%`, top: '-10px', animation: `snowFall ${4 + (i % 5)}s ease-in-out infinite`, animationDelay: `${(i % 8) * 0.5}s` }} />
          ))}
        </div>
      )}

      {/* Grid overlay */}
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" style={{ zIndex: -12 }} />
      {/* Radial fade */}
      <div className="fixed inset-0 bg-radial-fade pointer-events-none" style={{ zIndex: -12 }} />
      {/* Dark overlay for readability */}
      {state.backgroundDarken > 0 && (
        <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: `rgba(5, 6, 10, ${state.backgroundDarken / 100})`, zIndex: -11 }} />
      )}

      <style>{`
        @keyframes rainFall { 0% { transform: translateY(0); } 100% { transform: translateY(100vh); } }
        @keyframes snowFall { 0% { transform: translateY(0) translateX(0); opacity: 0.4; } 50% { opacity: 0.8; } 100% { transform: translateY(100vh) translateX(20px); opacity: 0.2; } }
      `}</style>
    </>
  );
}
