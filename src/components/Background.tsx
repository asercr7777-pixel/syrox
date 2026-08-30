import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { BACKGROUNDS } from '../data/collections';

export function Background() {
  const { state } = useStore();
  const [imgError, setImgError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [customColor, setCustomColor] = useState<string>(() => localStorage.getItem('stryven-custom-bg-color') || '');

  useEffect(() => { setImgError(false); }, [state.customBackground]);
  useEffect(() => { setVideoError(false); }, [state.backgroundVideo]);
  useEffect(() => {
    const onChange = () => setCustomColor(localStorage.getItem('stryven-custom-bg-color') || '');
    window.addEventListener('stryven-background-change', onChange);
    window.addEventListener('storage', onChange);
    return () => { window.removeEventListener('stryven-background-change', onChange); window.removeEventListener('storage', onChange); };
  }, []);

  const brightness = Math.max(.35, Math.min(1.6, state.backgroundBrightness / 100));
  const blur = Math.min(Math.max(state.backgroundBlur, 0), 8);
  const blurFilter = blur > 0 ? `blur(${blur}px)` : 'none';
  const transform = blur > 0 ? 'scale(1.02)' : 'none';
  const handleImgError = useCallback(() => setImgError(true), []);
  const handleVideoError = useCallback(() => setVideoError(true), []);

  const customVisualActive = Boolean(
    (state.backgroundType === 'image' && state.customBackground && !imgError) ||
    (state.backgroundType === 'video' && state.backgroundVideo && !videoError) ||
    (state.backgroundType === 'animated' && state.selectedBackgroundId) ||
    customColor
  );

  const renderBackgroundLayer = () => {
    if (state.backgroundType === 'video' && state.backgroundVideo && !videoError) {
      return <video autoPlay muted loop playsInline preload="auto" className="fixed inset-0 w-full h-full object-cover pointer-events-none" style={{ filter: `brightness(${brightness}) ${blurFilter}`, transform, zIndex: 0 }} src={state.backgroundVideo} onError={handleVideoError} aria-hidden="true" />;
    }
    if (state.backgroundType === 'image' && state.customBackground && !imgError) {
      return <div className="fixed inset-0 pointer-events-none bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url("${state.customBackground}")`, filter: `brightness(${brightness}) ${blurFilter}`, transform, zIndex: 0 }} role="img" aria-label="Custom background" />;
    }
    if (state.backgroundType === 'animated' && state.selectedBackgroundId) {
      const bg = BACKGROUNDS.find((item) => item.id === state.selectedBackgroundId);
      if (bg) return <div className="fixed inset-0 pointer-events-none" style={{ background: bg.css, filter: `brightness(${brightness}) ${blurFilter}`, transform, zIndex: 0 }} />;
    }
    if (customColor) return <div className="fixed inset-0 pointer-events-none" style={{ background: customColor, zIndex: 0 }} aria-hidden="true" />;
    return null;
  };

  return <>
    <div className="fixed inset-0 pointer-events-none" style={{ background: 'rgb(var(--site-bg))', zIndex: -1 }} />
    {renderBackgroundLayer()}
    <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--theme-background-overlay)', zIndex: 2 }} />
    {state.backgroundDarken > 0 && <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: `rgb(var(--site-bg) / ${state.backgroundDarken / 100})`, zIndex: 3 }} />}
    {!customVisualActive && <div className="theme-atmosphere" aria-hidden="true" />}
  </>;
}
