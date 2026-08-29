let frameQueued = false;
let pending = false;

/** Coalesces multiple store notifications into one render per animation frame. */
export function scheduleFrameNotify(flush: () => void) {
  pending = true;
  if (frameQueued) return;
  frameQueued = true;
  const run = () => {
    frameQueued = false;
    if (!pending) return;
    pending = false;
    flush();
  };
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(run);
  } else {
    queueMicrotask(run);
  }
}

/** Avoids running expensive work when a tab is hidden. */
export function isPageVisible() {
  return typeof document === 'undefined' || document.visibilityState === 'visible';
}
