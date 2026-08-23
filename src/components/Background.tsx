import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { BACKGROUNDS } from '../data/backgrounds';

export function Background() {
  const { state } = useStore();
  const [imgError, setImgError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const brightness = state.backgroundBrightness ?? 1;
  const blur = state.backgroundBlur ?? 0;
  const blurFilter = blur > 0 ? `blur(${blur}px)` : 'none';
  const transform = blur > 0 ? 'scale(1.03)' : undefined;

  useEffect(() => {
    setImgError(false);
    setVideoError(false);
  }, [state.backgroundType, state.customBackground, state.backgroundVideo]);

  const handleImgError = () => setImgError(true);
  const handleVideoError = () => setVideoError(true);

  if (state.backgroundType === 'video' && state.backgroundVideo && !videoError) {
    return (
      <video
        className="fixed inset-0 h-full w-full object-cover"
        style={{ filter: `brightness(${brightness}) ${blurFilter}`, transform, zIndex: -20 }}
        src={state.backgroundVideo}
        onError={handleVideoError}
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
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

  return <div className="fixed inset-0 bg-ink-950" style={{ zIndex: -20 }} />;
}
