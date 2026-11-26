// Service Worker for PWA Push Notifications
// Place in public/sw.js

const CACHE_NAME = 'envi-v1';
const STATIC_ASSETS = [
  '/',
  '/today',
  '/reflex',
  '/speaking',
  '/assessment',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      });
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'EnVi - Time for your daily English practice!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/today',
      ...data.data,
    },
    actions: [
      { action: 'open', title: 'Mở EnVi' },
      { action: 'dismiss', title: 'Để sau' },
    ],
    requireInteraction: true,
    tag: data.tag || 'envi-daily-reminder',
    renotify: true,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'EnVi - Luyện nói tiếng Anh', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const url = event.notification.data?.url || '/today';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  // Track dismissal if needed
  console.log('Notification closed:', event.notification.tag);
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-speaking-data') {
    event.waitUntil(syncSpeakingData());
  }
});

async function syncSpeakingData() {
  // Implement offline data sync when back online
  console.log('Syncing speaking data...');
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-reminder-check') {
    event.waitUntil(checkDailyReminder());
  }
});

async function checkDailyReminder() {
  // Check if user has completed today's session
  // If not, show reminder notification
  console.log('Checking daily reminder...');
}