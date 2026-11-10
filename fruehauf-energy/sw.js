/* Frühauf Energy – Offline-Betrieb. Version wird beim Bauen gesetzt. */
const VERSION = '20261110220748';
const SEMVER = '2.28';
const CORE = ["index.html", "manifest.webmanifest", "favicon.svg", "icon-180.png", "icon-192.png", "icon-512.png", "vendor/fonts.css", "vendor/tailwind.js", "vendor/pdf.min.js", "vendor/pdf.worker.min.js", "vendor/html2canvas.min.js", "vendor/jspdf.umd.min.js", "vendor/plz.json", "vendor/plz-orte.json", "vendor/qrcode.js", "vendor/fonts/Caveat-latin.woff2", "vendor/fonts/Caveat-latinext.woff2", "vendor/fonts/DMSans-33d679b3.woff2", "vendor/fonts/DMSans-b9df6239.woff2", "vendor/fonts/DMSerifDisplay-10885690.woff2", "vendor/fonts/DMSerifDisplay-f5a25084.woff2", "vendor/fonts/Figtree-7073ac15.woff2", "vendor/fonts/Figtree-fd63b3a7.woff2", "vendor/fonts/Fraunces-1fba8b40.woff2", "vendor/fonts/Fraunces-63f1654d.woff2", "vendor/fonts/Geist-001175b1.woff2", "vendor/fonts/Geist-98bbbccb.woff2", "vendor/fonts/GeistMono-013b2f2f.woff2", "vendor/fonts/GeistMono-44745446.woff2", "vendor/fonts/IBMPlexMono-60d1ee22.woff2", "vendor/fonts/IBMPlexMono-8d0aead6.woff2", "vendor/fonts/IBMPlexMono-9994c10a.woff2", "vendor/fonts/IBMPlexMono-d7731959.woff2", "vendor/fonts/IBMPlexSans-05d29bfe.woff2", "vendor/fonts/IBMPlexSans-118b756c.woff2", "vendor/fonts/InstrumentSans-416253b0.woff2", "vendor/fonts/InstrumentSans-e190a634.woff2", "vendor/fonts/InstrumentSerif-a20ac721.woff2", "vendor/fonts/InstrumentSerif-fa1a1a83.woff2", "vendor/fonts/Inter-1ab1ad55.woff2", "vendor/fonts/Inter-749a3084.woff2", "vendor/fonts/JetBrainsMono-1cd702cd.woff2", "vendor/fonts/JetBrainsMono-76306ee8.woff2", "vendor/fonts/Manrope-2ee76fc7.woff2", "vendor/fonts/Manrope-f00cccc4.woff2", "vendor/fonts/Newsreader-7a09be03.woff2", "vendor/fonts/Newsreader-f0c28dac.woff2", "vendor/fonts/PlusJakartaSans-305d441d.woff2", "vendor/fonts/PlusJakartaSans-be25729b.woff2"];
self.addEventListener('install', e => { e.waitUntil(caches.open('core-' + VERSION).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => !k.endsWith(VERSION)).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  // Versionsprüfung und sw.js selbst nie aus dem Speicher – sonst wird keine neue Version erkannt
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/pvgis/') || url.pathname.startsWith('/wetter/') || url.pathname.endsWith('/sw.js') || url.searchParams.has('check')) return;
  // Weitere Seiten (z. B. Tastatur-Testseite) immer direkt aus dem Netz
  if (req.mode === 'navigate' && url.pathname.endsWith('.html') && !url.pathname.endsWith('/index.html')) return;
  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    // App-Seite: zuerst aus dem Netz (Updates sofort), ohne Netz aus dem Speicher
    e.respondWith(fetch(url.href, { cache: 'no-store', credentials: 'same-origin' }).then(r => (r.redirected ? fetch(req) : r)).then(r => { const copy = r.clone(); caches.open('core-' + VERSION).then(c => c.put('index.html', copy)); return r; }).catch(() => caches.match('index.html')));
    return;
  }
  // Bibliotheken, Schriften, Bilder: aus dem Speicher, sonst laden und merken (z. B. Texterkennung beim ersten Einsatz)
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open('lazy-' + VERSION).then(c => c.put(req, copy)); } return r; })));
});
