const VERSION = 'ledger-v2';
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const PRECACHE = ['/offline.html', '/privacy/', '/terms/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/assets/ledger-proof.webp'];
self.addEventListener('install', (event) => event.waitUntil((async () => {
  const cache = await caches.open(SHELL);
  for (const path of PRECACHE) {
    const response = await fetch(`${path}?offline-precache=v2`, { cache: 'reload' });
    if (response.ok) await cache.put(path, response);
  }
  const htmlResponse = await fetch('/?offline-precache=v2', { cache: 'reload' });
  const html = await htmlResponse.clone().text();
  await cache.put('/', htmlResponse);
  const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
  for (const path of new Set(builtAssets)) {
    const response = await fetch(`${path}?offline-precache=v2`, { cache: 'reload' });
    if (response.ok) await cache.put(path, response);
  }
  await self.skipWaiting();
})()));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => ![SHELL, ASSETS].includes(key)).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('message', (event) => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); caches.open(SHELL).then((cache) => cache.put(event.request, copy)); return response; }).catch(async () => (await caches.match(event.request, { ignoreVary: true })) || (await caches.match('/', { ignoreVary: true })) || (await caches.match('/offline.html', { ignoreVary: true }))));
    return;
  }
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => { if (response.ok) caches.open(ASSETS).then((cache) => cache.put(event.request, response.clone())); return response; })));
});
