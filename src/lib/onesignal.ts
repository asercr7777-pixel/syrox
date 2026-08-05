// OneSignal Web Push Notifications integration
// The SDK is loaded and initialized via the OneSignalDeferred pattern in index.html.
// This module provides typed helpers for subscribing/unsubscribing from push.

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: ((OneSignal: any) => Promise<void>)[];
  }
}

const ONESIGNAL_APP_ID = 'da4d587d-2e86-4056-b7fb-f65d37c2d819';

export function isOneSignalConfigured(): boolean {
  return Boolean(ONESIGNAL_APP_ID);
}

export async function subscribeToPush(): Promise<boolean> {
  const OneSignal = await waitForOneSignal();
  if (!OneSignal) return false;

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
