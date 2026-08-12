import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(standalone || iosStandalone);
    };
    checkInstalled();

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPromptEvent(null);
    };

    const onControllerChange = () => window.location.reload();

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // Updates are silent: activate waiting workers without showing a popup.
        const activateWaiting = () => {
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        };
        activateWaiting();
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') activateWaiting();
          });
        });
      }).catch((err) => console.warn('[PWA] SW registration failed:', err));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
      navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPromptEvent) return false;
    try {
      await installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;
      setInstallPromptEvent(null);
      setIsInstallable(false);
      return choice.outcome === 'accepted';
    } catch {
      return false;
    }
  }, [installPromptEvent]);

  return { isInstalled, isInstallable, promptInstall };
}
