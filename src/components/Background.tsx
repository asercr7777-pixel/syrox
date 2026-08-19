import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { BACKGROUNDS } from '../data/collections';

export function Background() {
  const { state } = useStore();
  const [imgError, setImgError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => { setImgError(false); }, [state.customBackground]);
  useEffect(() => { setVideoError(false); }, [state.backgroundVideo]);

  const brightness = state.backgroundBrightness / 100;
  const blur = Math.min(state.backgroundBlur, 8);
  const blurFilter = blur > 0 ? `blur(${blur}px)` : 'none';
  const transform = blur > 0 ? 'scale(1.02)' : 'none';
  const handleImgError = useCallback(() => setImgError(true), []);
  const handleVideoError = useCallback(() => setVideoError(true), []);

  const renderBackgroundLayer = () => {
    if (state.backgroundType === 'video' && state.backgroundVideo && !videoError) {
      return (
        <video autoPlay muted loop playsInline preload="metadata" className="fixed inset-0 h-full w-full object-cover" style={{ filter: `brightness(${brightness}) ${blurFilter}`, transform, zIndex: -20 }} src={state.backgroundVideo} onError={handleVideoError} />
      );
    }

    if (state.backgroundType === 'image' && state.customBackground && !imgError) {
      return (
        <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${state.customBackground}")`, filter: `brightness(${brightness}) ${blurFilter}`, transform, zIndex: -20 }} role="img" aria-label="Custom background" onError={handleImgError as never} />
      );
    }

    if (state.backgroundType === 'animated' && state.selectedBackgroundId) {
      const bg = BACKGROUNDS.find((item) => item.id === state.selectedBackgroundId);
      if (bg) return <div className="fixed inset-0" style={{ background: bg.css, filter: `brightness(${brightness}) ${blurFilter}`, transform, zIndex: -20 }} />;
    }

    return null;
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#07080b]" style={{ zIndex: -30 }} />
      {renderBackgroundLayer()}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 75% 55% at 42% 8%, rgba(245,158,11,0.105), transparent 62%), radial-gradient(ellipse 65% 70% at 8% 52%, rgba(180,83,9,0.055), transparent 68%), linear-gradient(115deg, rgba(255,255,255,0.018), transparent 42%, rgba(0,0,0,0.2))', zIndex: -15 }} />
      <div className="fixed inset-0 pointer-events-none bg-grid opacity-[0.055]" style={{ zIndex: -14 }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.28) 100%)', zIndex: -13 }} />
      {state.backgroundDarken > 0 && <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: `rgba(5, 6, 10, ${state.backgroundDarken / 100})`, zIndex: -11 }} />}
    </>
  );
}
