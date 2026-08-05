import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { SplashScreen } from './components/pwa/SplashScreen.tsx';
import { initOneSignal } from './lib/onesignal';
import './index.css';

function Root() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const seen = sessionStorage.getItem('splash-seen');
    if (seen) {
      setShowSplash(false);
    }
    // Initialize OneSignal Web Push after a short delay so it doesn't block initial render
    const timer = setTimeout(() => { void initOneSignal(); }, 2000);
    return () => clearTimeout(timer);
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
