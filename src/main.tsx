import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { SplashScreen } from './components/pwa/SplashScreen.tsx';
import './index.css';

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

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          const scriptUrl = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL || '';
          if (scriptUrl.includes('OneSignalSDKWorker.js') || scriptUrl.includes('OneSignalSDK.sw.js')) {
            registration.unregister().catch(() => undefined);
          }
        });
      }).catch(() => undefined);
    }
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
