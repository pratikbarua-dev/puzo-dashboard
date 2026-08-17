import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (string | PrecacheEntry)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
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
