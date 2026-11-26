const CACHE_NAME = 'envi-v1';
const STATIC_ASSETS = [
  '/',
  '/today',
  '/dashboard',
  '/reflex',
  '/speaking',
  '/shadowing',
  '/chunks',
  '/voice-diary',
  '/speak/picture-talk',
  '/assessment',
  '/gamification',
];

const CACHE_STRATEGIES = {
  // Cache first for static assets
  static: ['/static/', '/_next/static/', '/fonts/', '/images/'],
  // Network first for API calls
  networkFirst: ['/api/'],
  // Stale while revalidate for pages
  staleWhileRevalidate: ['/today', '/dashboard', '/reflex', '/speaking', '/shadowing', '/chunks', '/voice-diary', '/speak/picture-talk', '/assessment', '/gamification'],
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // API calls - network first with offline fallback
  if (CACHE_STRATEGIES.networkFirst.some(path => url.pathname.startsWith(path))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets - cache first
  if (CACHE_STRATEGIES.static.some(path => url.pathname.startsWith(path))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Pages - stale while revalidate
  if (CACHE_STRATEGIES.staleWhileRevalidate.some(path => url.pathname.startsWith(path))) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: network first
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Background sync for recording uploads
self.addEventListener('sync', (event) => {
  if (event.tag === 'upload-recordings') {
    event.waitUntil(uploadPendingRecordings());
  }
});

async function uploadPendingRecordings() {
  const db = await openDB();
  const tx = db.transaction('pending-recordings', 'readwrite');
  const store = tx.objectStore('pending-recordings');
  const recordings = await store.getAll();

  for (const recording of recordings) {
    try {
      const response = await fetch('/api/speak/turns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recording),
      });

      if (response.ok) {
        await store.delete(recording.id);
      }
    } catch (error) {
      console.error('Failed to upload recording:', error);
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('envi-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-recordings')) {
        db.createObjectStore('pending-recordings', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('tts-cache')) {
        db.createObjectStore('tts-cache', { keyPath: 'key' });
      }
    };
  });
}

// TTS caching
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_TTS') {
    event.waitUntil(cacheTTS(event.data.key, event.data.audioBlob));
  }
});

async function cacheTTS(key, audioBlob) {
  const db = await openDB();
  const tx = db.transaction('tts-cache', 'readwrite');
  const store = tx.objectStore('tts-cache');
  await store.put({ key, audioBlob, timestamp: Date.now() });
}