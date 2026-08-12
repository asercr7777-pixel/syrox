import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { SplashScreen } from './components/pwa/SplashScreen.tsx';
import './index.css';

function Root() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const seen = sessionStorage.getItem('splash-seen');
    if (seen) {
      setShowSplash(false);
    }

    // Remove any legacy OneSignal service worker left by older builds.
    // Push notifications are intentionally disabled for Discipline.
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
    sessionStorage.setItem('splash-seen', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
