// OneSignal Web Push Notifications integration
// The SDK script is loaded in index.html; this module provides typed helpers.

declare global {
  interface Window {
    OneSignal?: any;
  }
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;

let initialized = false;

export function isOneSignalConfigured(): boolean {
  return Boolean(ONESIGNAL_APP_ID);
}

export async function initOneSignal(): Promise<void> {
  if (initialized || !isOneSignalConfigured()) return;

  // Wait for the SDK script to load
  const OneSignal = await waitForOneSignal();
  if (!OneSignal) {
    console.warn('[OneSignal] SDK not found on window');
    return;
  }

  await OneSignal.init({
    appId: ONESIGNAL_APP_ID!,
    serviceWorkerPath: '/OneSignalSDKWorker.js',
    serviceWorkerParam: { scope: '/' },
    allowLocalhostAsSecureOrigin: true,
    welcomeNotification: { title: 'Discipline System', message: 'Push notifications activated, Hunter.' },
  });

  // Register the existing PWA service worker alongside OneSignal's worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch {
      // PWA SW registration is non-fatal
    }
  }

  initialized = true;
}

export async function subscribeToPush(): Promise<boolean> {
  const OneSignal = await waitForOneSignal();
  if (!OneSignal) return false;

  // Request permission and subscribe
  const permission = await OneSignal.Notifications.requestPermission();
  if (!permission) return false;

  await OneSignal.User.PushSubscription.optIn();
  return true;
}

export async function isPushSubscribed(): Promise<boolean> {
  const OneSignal = await waitForOneSignal();
  if (!OneSignal) return false;
  return OneSignal.User.PushSubscription.optedIn === true;
}

export async function unsubscribeFromPush(): Promise<void> {
  const OneSignal = await waitForOneSignal();
  if (!OneSignal) return;
  await OneSignal.User.PushSubscription.optOut();
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied';
  return Notification.permission;
}

function waitForOneSignal(): Promise<any | null> {
  return new Promise((resolve) => {
    if (window.OneSignal) return resolve(window.OneSignal);
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.OneSignal) {
        clearInterval(interval);
        resolve(window.OneSignal);
      } else if (attempts > 50) {
        clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });
}
