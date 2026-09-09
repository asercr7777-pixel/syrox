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
    let rafId = 0;
    let endTimer: number | undefined;
    let scrolling = false;

    const markScrolling = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        if (!scrolling) {
          scrolling = true;
          document.documentElement.classList.add('is-scrolling');
        }
        if (endTimer) window.clearTimeout(endTimer);
        endTimer = window.setTimeout(() => {
          scrolling = false;
          document.documentElement.classList.remove('is-scrolling');
          endTimer = undefined;
        }, 110);
      });
    };

    window.addEventListener('scroll', markScrolling, { passive: true });

    return () => {
      window.removeEventListener('scroll', markScrolling);
      if (rafId) window.cancelAnimationFrame(rafId);
      if (endTimer) window.clearTimeout(endTimer);
      document.documentElement.classList.remove('is-scrolling');
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
