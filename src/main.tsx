import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { SplashScreen } from './components/pwa/SplashScreen.tsx';
import './index.css';
import './mobile.css';
import './stryven-premium.css';
import './scroll-fix.css';

function safeSessionGet(key: string) {
  try { return window.sessionStorage.getItem(key); } catch { return null; }
}

function safeSessionSet(key: string, value: string) {
  try { window.sessionStorage.setItem(key, value); } catch { /* storage may be blocked */ }
}

function Root() {
  const [showSplash, setShowSplash] = useState(() => safeSessionGet('splash-seen') !== 'true');

  useEffect(() => {
    if (safeSessionGet('splash-seen')) setShowSplash(false);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    // Make the browser's document the only vertical scroll owner.
    html.style.setProperty('overflow-y', 'scroll', 'important');
    html.style.setProperty('overflow-x', 'hidden', 'important');
    html.style.setProperty('height', 'auto', 'important');
    html.style.setProperty('touch-action', 'pan-y', 'important');

    body.style.setProperty('overflow-y', 'visible', 'important');
    body.style.setProperty('overflow-x', 'hidden', 'important');
    body.style.setProperty('height', 'auto', 'important');
    body.style.setProperty('min-height', '100%', 'important');
    body.style.setProperty('touch-action', 'pan-y', 'important');

    root?.style.setProperty('overflow', 'visible', 'important');
    root?.style.setProperty('height', 'auto', 'important');
    root?.style.setProperty('max-height', 'none', 'important');

    let rafId = 0;
    let endTimer: number | undefined;
    let scrolling = false;

    const markScrolling = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        if (!scrolling) {
          scrolling = true;
          html.classList.add('is-scrolling');
        }
        if (endTimer) window.clearTimeout(endTimer);
        endTimer = window.setTimeout(() => {
          scrolling = false;
          html.classList.remove('is-scrolling');
          endTimer = undefined;
        }, 110);
      });
    };

    window.addEventListener('scroll', markScrolling, { passive: true });

    return () => {
      window.removeEventListener('scroll', markScrolling);
      if (rafId) window.cancelAnimationFrame(rafId);
      if (endTimer) window.clearTimeout(endTimer);
      html.classList.remove('is-scrolling');
    };
  }, []);

  const handleSplashComplete = () => {
    safeSessionSet('splash-seen', 'true');
    setShowSplash(false);
  };

  if (showSplash) return <SplashScreen onComplete={handleSplashComplete} />;

  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<Root />);
