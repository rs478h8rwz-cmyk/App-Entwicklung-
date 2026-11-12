/* Frühauf Stempeluhr – Offline-Betrieb. Version wird beim Bauen gesetzt. */
const VERSION = '__VERSION__';
const CORE = __CORE__;
self.addEventListener('install', e => { e.waitUntil(caches.open('core-' + VERSION).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => !x.endsWith(VERSION)).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('/sw.js')) return;
  if (req.mode === 'navigate') { e.respondWith(fetch(req, { cache: 'no-store' }).then(r => { const c = r.clone(); caches.open('core-' + VERSION).then(x => x.put('index.html', c)); return r; }).catch(() => caches.match('index.html'))); return; }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
