import { getApp, getApps, initializeApp } from 'firebase/app';
import { deleteToken, getMessaging, getToken, isSupported, onMessage, type Messaging } from 'firebase/messaging';
import { registerPushSubscription, removePushSubscription } from './api';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
export const isFcmConfigured = Boolean(config.apiKey && config.projectId && config.messagingSenderId && config.appId && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
let messaging: Messaging | null = null;
async function getClientMessaging() {
  if (typeof window === 'undefined' || !isFcmConfigured || !(await isSupported())) return null;
  const app = getApps().length ? getApp() : initializeApp(config);
  messaging ||= getMessaging(app);
  return messaging;
}
export async function enablePushNotifications() {
  const clientMessaging = await getClientMessaging();
  if (!clientMessaging) throw new Error('Push notifications are not configured for this dashboard');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted');
  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(clientMessaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) throw new Error('The browser did not provide a push token');
  await registerPushSubscription(token);
  return token;
}

/** Revokes this browser's push token on the backend and deletes it locally. */
export async function disablePushNotifications() {
  const clientMessaging = await getClientMessaging();
  if (!clientMessaging) return;
  if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') return;
  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(clientMessaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  }).catch(() => null);
  if (!token) return;
  await removePushSubscription(token).catch(() => {});
  await deleteToken(clientMessaging).catch(() => {});
}

/** True when this browser already granted notification permission. */
export function hasPushPermission(): boolean {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}
export async function listenForForegroundMessages(handler: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void) {
  const clientMessaging = await getClientMessaging();
  if (!clientMessaging || Notification.permission !== 'granted') return () => {};
  return onMessage(clientMessaging, handler);
}
