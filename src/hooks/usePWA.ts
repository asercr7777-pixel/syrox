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

    let cancelled = false;
    const register = () => {
      if (cancelled || !('serviceWorker' in navigator)) return;
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      navigator.serviceWorker.register('/sw.js').then((reg) => {
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
    };

    // Do not compete with the first render. Register once the browser is idle.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    if (idle) idleId = idle(register, { timeout: 2500 });
    else timeoutId = window.setTimeout(register, 1200);

    return () => {
      cancelled = true;
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
      navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange);
      if (idleId !== undefined && (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
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
