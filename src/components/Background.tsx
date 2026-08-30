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
  const blur = Math.min(state.backgroundBlur, 4);
  const blurFilter = blur > 0 ? `blur(${blur}px)` : 'none';
  const transform = blur > 0 ? 'scale(1.01)' : 'none';
  const handleImgError = useCallback(() => setImgError(true), []);
  const handleVideoError = useCallback(() => setVideoError(true), []);

  const renderBackgroundLayer = () => {
    if (state.backgroundType === 'video' && state.backgroundVideo && !videoError) {
      return (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="fixed inset-0 h-full w-full object-cover"
          style={{ filter: `brightness(${brightness}) ${blurFilter}`, transform, zIndex: -20 }}
          src={state.backgroundVideo}
          onError={handleVideoError}
          aria-hidden="true"
        />
      );
    }

    if (state.backgroundType === 'image' && state.customBackground && !imgError) {
      return (
        <div
          className="fixed inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${state.customBackground}")`, filter: `brightness(${brightness}) ${blurFilter}`, transform, zIndex: -20 }}
          role="img"
          aria-label="Custom background"
          onError={handleImgError as never}
        />
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
      <div className="fixed inset-0" style={{ background: 'rgb(var(--site-bg))', zIndex: -30 }} />
      {renderBackgroundLayer()}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--theme-background-overlay)', zIndex: -15 }} />
      {state.backgroundDarken > 0 && <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: `rgb(var(--site-bg) / ${state.backgroundDarken / 100})`, zIndex: -11 }} />}

      {/* Theme atmosphere is decorative only. It never participates in document layout. */}
      <div className="theme-atmosphere" aria-hidden="true">
        <span className="theme-particle theme-particle-1" />
        <span className="theme-particle theme-particle-2" />
        <span className="theme-particle theme-particle-3" />
        <span className="theme-particle theme-particle-4" />
        <span className="theme-particle theme-particle-5" />
        <span className="theme-scan-line" />
        <span className="theme-corona" />
      </div>
    </>
  );
}
