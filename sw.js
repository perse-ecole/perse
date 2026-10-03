/* Service worker de l'appli Persé : met en cache uniquement la coquille
   (cette page, le manifest, les icônes). Les pages Persé servies par Google
   (script.google.com, googleusercontent.com) ne sont jamais mises en cache. */
const CACHE = 'perse-coquille-v2';
const COQUILLE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];
const JAMAIS_EN_CACHE = /(^|\.)(script\.google\.com|googleusercontent\.com|google\.com|gstatic\.com)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || JAMAIS_EN_CACHE.test(url.hostname)) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((rep) => {
          if (rep.ok) {
            const copie = rep.clone();
            caches.open(CACHE).then((c) => c.put('./index.html', copie));
          }
          return rep;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(caches.match(req).then((enCache) => enCache || fetch(req)));
});
