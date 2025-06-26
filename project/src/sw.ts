import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches
cleanupOutdatedCaches();

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
  })
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
  })
);

// Cache audio files
registerRoute(
  ({ request }) => request.destination === 'audio',
  new CacheFirst({
    cacheName: 'audio-cache',
  })
);

// Cache game assets
registerRoute(
  ({ url }) => url.pathname.includes('/assets/'),
  new StaleWhileRevalidate({
    cacheName: 'assets-cache',
  })
);

// Handle offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html') || new Response('Offline');
      })
    );
  }
});

// Background sync for save data
self.addEventListener('sync', (event) => {
  if (event.tag === 'save-game') {
    event.waitUntil(syncSaveData());
  }
});

async function syncSaveData() {
  try {
    // Sync pending save data when online
    const pendingSaves = await getStoredSaves();
    for (const save of pendingSaves) {
      await uploadSaveToCloud(save);
    }
  } catch (error) {
    console.error('Failed to sync save data:', error);
  }
}

async function getStoredSaves() {
  // Implementation to get pending saves from IndexedDB
  return [];
}

async function uploadSaveToCloud(save: any) {
  // Implementation to upload save to cloud
  console.log('Uploading save to cloud:', save);
}