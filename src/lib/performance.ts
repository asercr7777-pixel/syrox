let frameQueued = false;
let pending = false;
let idleTimer: number | null = null;

/** Coalesces multiple store/UI notifications into one render per animation frame. */
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

/** Schedules non-critical work when the browser is idle. */
export function scheduleIdleWork(work: () => void, timeout = 1200) {
  if (typeof window === 'undefined') return;
  if (idleTimer !== null) window.clearTimeout(idleTimer);
  const run = () => {
    idleTimer = null;
    if (!isPageVisible()) return;
    work();
  };
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
  if (typeof idle === 'function') idle(run, { timeout });
  else idleTimer = window.setTimeout(run, Math.min(timeout, 250));
}

/** True when animations should be reduced for accessibility and smoother low-power devices. */
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/** Avoids running expensive work when a tab is hidden. */
export function isPageVisible() {
  return typeof document === 'undefined' || document.visibilityState === 'visible';
}
