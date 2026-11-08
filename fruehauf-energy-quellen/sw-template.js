/* Frühauf Energy – Offline-Betrieb. Version wird beim Bauen gesetzt. */
const VERSION = '__VERSION__';
const SEMVER = '__SEMVER__';
const CORE = __CORE__;
self.addEventListener('install', e => { e.waitUntil(caches.open('core-' + VERSION).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => !k.endsWith(VERSION)).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  // Versionsprüfung und sw.js selbst nie aus dem Speicher – sonst wird keine neue Version erkannt
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/pvgis/') || url.pathname.startsWith('/wetter/') || url.pathname.endsWith('/sw.js') || url.searchParams.has('check')) return;
  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    // App-Seite: zuerst aus dem Netz (Updates sofort), ohne Netz aus dem Speicher
    e.respondWith(fetch(url.href, { cache: 'no-store', credentials: 'same-origin' }).then(r => (r.redirected ? fetch(req) : r)).then(r => { const copy = r.clone(); caches.open('core-' + VERSION).then(c => c.put('index.html', copy)); return r; }).catch(() => caches.match('index.html')));
    return;
  }
  // Bibliotheken, Schriften, Bilder: aus dem Speicher, sonst laden und merken (z. B. Texterkennung beim ersten Einsatz)
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open('lazy-' + VERSION).then(c => c.put(req, copy)); } return r; })));
});
