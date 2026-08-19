import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (string | PrecacheEntry)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & { registration: ServiceWorkerRegistration };
declare function importScripts(...urls: string[]): void;

// Firebase Messaging is loaded only when the public Firebase configuration is
// present. Keeping it as a runtime import avoids bundling a second worker into
// the Serwist build and lets the existing root worker handle push messages.
const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
if (firebaseProjectId && firebaseSenderId) {
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
  const firebase = (self as unknown as { firebase?: { initializeApp: (config: unknown) => void; messaging: () => { onBackgroundMessage: (handler: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void) => void } } }).firebase;
  firebase?.initializeApp({ apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, projectId: firebaseProjectId, messagingSenderId: firebaseSenderId, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID });
  firebase?.messaging().onBackgroundMessage((payload) => {
    void self.registration.showNotification(payload.notification?.title || 'PUZO', { body: payload.notification?.body || 'PUZO has something to tell you.', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', data: payload.data });
  });
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST || [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Cloudflare Insights is optional analytics. A blocked/offline beacon must
  // never become an uncaught Serwist `no-response` failure in the app.
  runtimeCaching: [
    {
      matcher: ({ url }) => url.hostname === 'static.cloudflareinsights.com',
      handler: async ({ request }) => {
        try {
          return await fetch(request);
        } catch {
          return new Response(null, { status: 204 });
        }
      },
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();
