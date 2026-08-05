// OneSignal Web Push Notifications integration
// The SDK is loaded and initialized via the OneSignalDeferred pattern in index.html.
// This module provides typed helpers for subscribing/unsubscribing from push,
// tagging the user with their Supabase user ID, and managing notification tags.

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

/** Tag the OneSignal user with their Supabase user ID so the backend can target them. */
export async function setExternalUserId(userId: string): Promise<void> {
  const OneSignal = await waitForOneSignal();
  if (!OneSignal) return;
  try {
    await OneSignal.User.addExternalId(userId);
  } catch {
    // Some SDK versions use a different API
    try { await OneSignal.setExternalUserId(userId); } catch { /* noop */ }
  }
}

/** Remove the external user ID (on sign-out). */
export async function removeExternalUserId(): Promise<void> {
  const OneSignal = await waitForOneSignal();
  if (!OneSignal) return;
  try {
    await OneSignal.User.removeExternalId();
  } catch {
    try { await OneSignal.removeExternalUserId(); } catch { /* noop */ }
  }
}

/** Sync notification category tags so the backend can filter who gets what. */
export async function syncNotificationTags(tags: Record<string, string>): Promise<void> {
  const OneSignal = await waitForOneSignal();
  if (!OneSignal) return;
  try {
    for (const [key, value] of Object.entries(tags)) {
      await OneSignal.User.addTag(key, value);
    }
  } catch {
    try { await OneSignal.sendTags(tags); } catch { /* noop */ }
  }
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
