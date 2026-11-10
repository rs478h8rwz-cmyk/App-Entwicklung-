const IP = {
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  trash: '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowL: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  pen: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  hard: '<path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a6 6 0 0 1 6-6"/><path d="M14 6a6 6 0 0 1 6 6v3"/>',
  siren: '<path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21a1 1 0 0 0 1-1v-1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1a1 1 0 0 0 1 1Z"/><path d="M21 12h1M18.5 4.5 18 5M2 12h1M12 2v1M4.93 4.93l.71.71"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  thumb: '<path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
  palm: '<path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4"/><path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3"/><path d="M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35"/><path d="M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14"/>',
  heartp: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
};

/* =========================================================
   Frühauf – Stempeluhr
   Eigenständige App: Arbeitszeiten stempeln (Kommen, Pause, Gehen), Baustellen je Tag,
   Wochenzettel als PDF – direkt per WhatsApp teilen. Daten bleiben auf dem Gerät.
   ========================================================= */
const APP_VERSION = '1.9';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = 'x') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = o => JSON.parse(JSON.stringify(o));
const pad2 = n => String(n).padStart(2, '0');
/* Geprüfte Uhrzeit: Abstand zur Serverzeit (HTTP-Date von Netlify). Verstellte Handy-Uhren ändern nichts. */
const TIME = { off: 0, ok: false, at: 0 };
const tNow = () => new Date(Date.now() + TIME.off);
async function syncTime(timeout = 3000) {
  try {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), timeout), t0 = performance.now();
    const r = await fetch('firma.json?time=' + Date.now(), { method: 'HEAD', cache: 'no-store', signal: ctl.signal }); clearTimeout(to);
    const h = r.headers.get('date'); if (!h) throw new Error('keine Serverzeit');
    const server = new Date(h).getTime() + 500 + (performance.now() - t0) / 2;   // Date-Header ist sekundengenau (abgerundet)
    TIME.off = Math.abs(server - Date.now()) < 1500 ? 0 : server - Date.now(); TIME.ok = true; TIME.at = performance.now();
    try { DB.put('kv', { off: TIME.off, at: Date.now() }, 'timeoff'); } catch (e) {}
    return true;
  } catch (e) { TIME.ok = TIME.ok && performance.now() - TIME.at < 30 * 60000; return TIME.ok; }
}
const isoToday = () => { const d = tNow(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const deDate = iso => { if (!iso) return '–'; const [y, m, d] = String(iso).slice(0, 10).split('-'); return d ? `${d}.${m}.${y}` : iso; };
const WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const wdOf = iso => WD[new Date(iso + 'T12:00').getDay()];
const num = (v, d = 0) => (isFinite(v) ? Number(v).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }) : '–');
const hrs = h => (isFinite(h) && h > 0 ? `${num(h, h % 1 ? 2 : 0)} Std.` : '–');
const ic = (n, s = 18, sw = 1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IP[n] || ''}</svg>`;
const wait = t => new Promise(r => setTimeout(r, t));

/* ---------- Speicher (IndexedDB) ---------- */
const DB = {
  db: null,
  open() {
    return new Promise(res => {
      try {
        const rq = indexedDB.open('fruehauf-stempel', 1);
        rq.onupgradeneeded = () => { const d = rq.result; if (!d.objectStoreNames.contains('days')) d.createObjectStore('days', { keyPath: 'iso' }); if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); };
        rq.onsuccess = () => { DB.db = rq.result; res(); }; rq.onerror = () => res();
      } catch (e) { res(); }
    });
  },
  req(store, mode, fn) { return new Promise((res, rej) => { const tx = DB.db.transaction(store, mode), r = fn(tx.objectStore(store)); tx.oncomplete = () => res(r && r.result); tx.onerror = () => rej(tx.error); }); },
  mem: { days: new Map(), kv: new Map() },
  get(store, key) { return DB.db ? DB.req(store, 'readonly', s => s.get(key)) : Promise.resolve(DB.mem[store].get(key)); },
  put(store, val, key) { if (!DB.db) { DB.mem[store].set(key ?? val.iso, val); return Promise.resolve(); } return DB.req(store, 'readwrite', s => (key !== undefined ? s.put(val, key) : s.put(val))); },
  del(store, key) { if (!DB.db) { DB.mem[store].delete(key); return Promise.resolve(); } return DB.req(store, 'readwrite', s => s.delete(key)); },
  all(store) { return DB.db ? DB.req(store, 'readonly', s => s.getAll()) : Promise.resolve([...DB.mem[store].values()]); }
};

/* ---------- Einstellungen ---------- */
const DEFAULTS = {
  company: { name: 'Frühauf Solar', street: '', city: '', phone: '', email: '', logo: 'logo.png' },
  design: { mode: 'system', primary: '#0E7C66', secondary: '#F5A524', radius: 14, fontBody: 'Geist', fontHead: 'Instrument Serif' },
  person: { name: '', nr: '', start: '' },   // start: Eintrittsdatum
  recipient: { name: 'Jule', phone: '' },
  state: 'NW',
  /* Sollzeiten je Wochentag (0 = Sonntag) */
  hours: { 1: { on: true, von: '07:30', bis: '16:30', pause: 30 }, 2: { on: true, von: '07:30', bis: '16:30', pause: 30 }, 3: { on: true, von: '07:30', bis: '16:30', pause: 30 }, 4: { on: true, von: '07:30', bis: '16:30', pause: 30 }, 5: { on: true, von: '07:30', bis: '13:45', pause: 15 }, 6: { on: false, von: '', bis: '', pause: 30 }, 0: { on: false, von: '', bis: '', pause: 30 } },
  minPause: 30,            // wird immer abgezogen – längere Pausen werden voll abgezogen
  pauseOnlyOver6: false,   // optional: Mindestpause erst ab 6 Std. Arbeit
  sites: [],               // zuletzt genutzte Baustellen (Vorschläge)
  vacation: { perYear: 30, carry: 0, takenBefore: 0, year: 0, rule: 'anteilig', manual: null },   // manual: { year, days } – Anspruch von Hand   // takenBefore: vor App-Nutzung genommene Tage im Jahr „year“
  kontoLog: [],
  balance: { from: '', min: 0 },   // Überstundenkonto: Startdatum und Startwert (Minuten)
  gps: true,               // Standort beim Stempeln (Pflicht)
  gpsConsent: '',          // Hinweis zur Standortnutzung bestätigt am
  admin: null,             // eigenes Admin-Passwort (nur als PBKDF2-Hash)
  bu: [],                  // zusätzlicher Betriebsurlaub (vom Admin auf diesem Gerät)
  halfDays: { '12-24': 'halb', '12-31': 'halb' }   // halb = ½ Urlaubstag und halbe Sollzeit, voll = normaler Tag, frei = arbeitsfrei
};
/* Admin-Passwort für nachträgliche Änderungen – nur als PBKDF2-Hash, nie im Klartext */
const ADMIN_DEFAULT = {"salt": "98ca4569816c7cf7ab78c9ca05af31d3", "hash": "a10b07b319ad55321647f139e3ab13d26e8f75d2b8949e49870d768843f71394", "iter": 150000};
const adminCfg = () => (S.admin && S.admin.hash ? S.admin : ADMIN_DEFAULT);
async function pbkdf2(pw, saltHex, iter) {
  const enc = new TextEncoder(), key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const salt = new Uint8Array(saltHex.match(/../g).map(h => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, key, 256);
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function checkAdmin(pw) { const a = adminCfg(); return (await pbkdf2(pw, a.salt, a.iter)) === a.hash; }
async function setAdminPassword(pw) { const salt = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join(''); S.admin = { salt, hash: await pbkdf2(pw, salt, 150000), iter: 150000 }; saveSettings(); }
let S = clone(DEFAULTS);
function deepMerge(base, add) {
  if (Array.isArray(base) || typeof base !== 'object' || base === null) return add === undefined ? base : add;
  const out = { ...base }; for (const k in add) out[k] = k in base && typeof base[k] === 'object' && !Array.isArray(base[k]) && base[k] !== null ? deepMerge(base[k], add[k]) : add[k]; return out;
}
async function loadSettings() { const s = await DB.get('kv', 'settings'); S = deepMerge(clone(DEFAULTS), s || {}); fixSettings(); }
/* Fehlende Wochentage ergänzen */
function fixSettings() { for (const k of [0, 1, 2, 3, 4, 5, 6]) { if (!S.hours[k]) S.hours[k] = clone(DEFAULTS.hours[k]); if (S.hours[k].pause === undefined) S.hours[k].pause = DEFAULTS.hours[k].pause; } }
let SAVE_T = null;
function saveSettings() { clearTimeout(SAVE_T); SAVE_T = setTimeout(() => DB.put('kv', clone(S), 'settings'), 250); }

/* ---------- Design (wie Wirtschaftlichkeits-App) ---------- */
const hex2rgb = h => { const m = /^#?([\da-f]{6})$/i.exec(h || ''); const n = m ? parseInt(m[1], 16) : 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgb2hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const x = hex2rgb(a), y = hex2rgb(b); return rgb2hex(x.map((v, i) => v + (y[i] - v) * t)); };
const rgba = (h, a) => { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; };
const appDark = () => S.design.mode === 'dark' || (S.design.mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
function applyTheme() {
  const d = S.design, dark = appDark(), st = document.documentElement.style, set = (k, v) => st.setProperty(k, v);
  const P = dark ? mix(d.primary, '#ffffff', 0.28) : d.primary;
  set('--p', P); set('--p-rgb', hex2rgb(P).join(' ')); set('--s', d.secondary); set('--s-rgb', hex2rgb(d.secondary).join(' '));
  if (dark) {
    const base = '#0A0E13';
    set('--bg', base); set('--card', mix(base, '#ffffff', 0.035)); set('--raised', mix(base, '#ffffff', 0.07)); set('--field', mix(base, '#000000', 0.15));
    set('--ink', '#ECEFF3'); set('--ink2', '#A7B2BE'); set('--ink3', '#7A8692'); set('--line', 'rgba(255,255,255,.07)'); set('--line2', 'rgba(255,255,255,.13)');
    set('--p-light', rgba(P, 0.15)); set('--t-red', 'rgba(217,72,43,.15)'); set('--t-yel', rgba(d.secondary, 0.13)); set('--yel-ink', mix(d.secondary, '#ffffff', 0.35)); set('--red-ink', '#F08A6E');
    set('--btn', '#ECEFF3'); set('--btn-ink', base); set('--btn-h', '#ffffff'); set('--hi', '.035'); set('--scheme', 'dark');
  } else {
    const base = '#F4F6F8', ink = '#0F1B26';
    set('--bg', base); set('--card', '#ffffff'); set('--raised', mix(base, ink, 0.035)); set('--field', '#ffffff');
    set('--ink', ink); set('--ink2', mix(ink, '#ffffff', 0.22)); set('--ink3', mix(ink, '#ffffff', 0.42)); set('--line', rgba(ink, 0.09)); set('--line2', rgba(ink, 0.16));
    set('--p-light', mix(d.primary, '#ffffff', 0.88)); set('--t-red', mix('#D9482B', '#ffffff', 0.9)); set('--t-yel', mix(d.secondary, '#ffffff', 0.86)); set('--yel-ink', mix(d.secondary, '#000000', 0.45)); set('--red-ink', mix('#D9482B', '#000000', 0.25));
    set('--btn', d.primary); set('--btn-ink', '#ffffff'); set('--btn-h', mix(d.primary, '#000000', 0.15)); set('--hi', '0'); set('--scheme', 'light');
  }
  set('--r', d.radius + 'px'); set('--rb', Math.max(4, Math.round(d.radius * 0.65)) + 'px');
  set('--fb', `"${d.fontBody}"`); set('--fh', `"${d.fontHead}"`);
  const m = $('meta[name=theme-color]'); if (m) m.content = dark ? '#0A0E13' : '#F4F6F8';
}

/* ---------- Feiertage (bundesweit + Bundesland) ---------- */
const STATES = [['BW', 'Baden-Württemberg'], ['BY', 'Bayern'], ['BE', 'Berlin'], ['BB', 'Brandenburg'], ['HB', 'Bremen'], ['HH', 'Hamburg'], ['HE', 'Hessen'], ['MV', 'Mecklenburg-Vorpommern'], ['NI', 'Niedersachsen'], ['NW', 'Nordrhein-Westfalen'], ['RP', 'Rheinland-Pfalz'], ['SL', 'Saarland'], ['SN', 'Sachsen'], ['ST', 'Sachsen-Anhalt'], ['SH', 'Schleswig-Holstein'], ['TH', 'Thüringen']];
function easter(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return new Date(y, mo - 1, da, 12); }
const firmState = () => (typeof FIRMA !== 'undefined' && FIRMA.firmensitz && FIRMA.firmensitz.bundesland) || S.state;
function holiday(iso, st = firmState()) {
  if (!iso) return ''; const d = new Date(iso + 'T12:00'), y = d.getFullYear(), E = easter(y), off = n => { const x = new Date(E); x.setDate(x.getDate() + n); return x; };
  const same = (a, b) => a.getMonth() === b.getMonth() && a.getDate() === b.getDate(), md = (m, dd) => new Date(y, m - 1, dd, 12);
  const bb = (() => { const x = md(11, 22); while (x.getDay() !== 3) x.setDate(x.getDate() - 1); return x; })();
  const list = [[md(1, 1), 'Neujahr'], [off(-2), 'Karfreitag'], [off(1), 'Ostermontag'], [md(5, 1), 'Tag der Arbeit'], [off(39), 'Christi Himmelfahrt'], [off(50), 'Pfingstmontag'], [md(10, 3), 'Tag der Deutschen Einheit'], [md(12, 25), '1. Weihnachtstag'], [md(12, 26), '2. Weihnachtstag'],
    [md(1, 6), 'Heilige Drei Könige', 'BW BY ST'], [md(3, 8), 'Frauentag', 'BE MV'], [off(60), 'Fronleichnam', 'BW BY HE NW RP SL'], [md(8, 15), 'Mariä Himmelfahrt', 'SL'], [md(9, 20), 'Weltkindertag', 'TH'],
    [md(10, 31), 'Reformationstag', 'BB HB HH MV NI SN ST SH TH'], [md(11, 1), 'Allerheiligen', 'BW BY NW RP SL'], [bb, 'Buß- und Bettag', 'SN']];
  const hit = list.find(([x, , only]) => same(x, d) && (!only || only.split(' ').includes(st)));
  return hit ? hit[1] : '';
}
/* ---------- Toast, Dialoge ---------- */
function toast(msg, kind = 'ok', ms = 3200) {
  const t = document.createElement('div');
  t.className = 'pointer-events-auto card px-4 py-3 text-[14px] flex items-center gap-2.5 shadow-xl fade-in';
  t.innerHTML = `<span class="${kind === 'err' ? 'text-ember' : kind === 'warn' ? 'text-yel-ink' : 'text-p'}">${ic(kind === 'ok' ? 'check' : 'alert', 17)}</span><span>${esc(msg)}</span>`;
  $('#toasts').appendChild(t); setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, ms);
}
function modal(html, opts = {}) {
  $('#modal').innerHTML = `<div class="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto overscroll-contain" style="padding-top:max(16px,env(safe-area-inset-top));padding-bottom:max(16px,env(safe-area-inset-bottom))" data-modal-bg>
    <div class="card w-full ${opts.wide ? 'max-w-2xl' : 'max-w-lg'} p-6 sm:p-7 fade-in my-4 sm:my-auto relative">
      <button class="absolute right-4 top-4 w-9 h-9 rounded-full grid place-items-center text-ink3 hover:bg-raised" data-a="modal-close" aria-label="Schließen">${ic('x', 18)}</button>${html}</div></div>`;
}
const closeModal = () => { $('#modal').innerHTML = ''; };
function confirmDlg(title, text, yes = 'Ja', danger = false) {
  return new Promise(res => {
    modal(`<h3 class="text-[20px] font-semibold pr-8">${esc(title)}</h3><p class="text-ink2 text-[14px] mt-2">${esc(text)}</p>
      <div class="flex flex-col sm:flex-row gap-2 mt-6"><button class="btn-p sm:flex-1 ${danger ? '!bg-[#D9482B] !text-white' : ''}" id="cf-yes">${esc(yes)}</button><button class="btn-s sm:flex-1" id="cf-no">Abbrechen</button></div>`);
    $('#cf-yes').onclick = () => { closeModal(); res(true); }; $('#cf-no').onclick = () => { closeModal(); res(false); };
  });
}
document.addEventListener('click', e => { if (e.target.matches('[data-modal-bg]') || e.target.closest('[data-a="modal-close"]')) closeModal(); });

/* Zoom per Doppeltipp/zwei Finger unterbinden (App-Gefühl) */
document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });

/* Bilder verkleinern (Fotos, Logo) */
async function shrinkImage(file, max = 1600, q = 0.82, type = 'image/jpeg') {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
    c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    const x = c.getContext('2d'); if (type === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); } x.drawImage(im, 0, 0, c.width, c.height);
    return { data: c.toDataURL(type, q), w: c.width, h: c.height };
  } finally { URL.revokeObjectURL(url); }
}

/* =========================================================
   Zeiten und Regeln
   Ein Tag besteht aus Abschnitten je Baustelle (von–bis) und gestempelten Pausen.
   Lücken zwischen zwei Abschnitten (Gehen → wieder Kommen) zählen als Pause.
   Pausenregel: Es wird immer mindestens die Mindestpause (30 Min.) abgezogen;
   ist die Pause länger, wird die tatsächliche Pause abgezogen.
   ========================================================= */
const toMin = t => { if (!t) return null; const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
const nowHM = () => { const d = tNow(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const nowHMS = () => { const d = tNow(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`; };
const hm = m => { if (m === null || m === undefined || isNaN(m)) return '–'; const neg = m < 0; m = Math.abs(Math.round(m)); return `${neg ? '−' : ''}${Math.floor(m / 60)}:${pad2(m % 60)}`; };
const hmPlus = m => (Math.round(m) > 0 ? '+' + hm(m) : hm(m));
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const mondayOf = iso => addDays(iso, -((new Date(iso + 'T12:00').getDay() + 6) % 7));
function isoWeek(iso) { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); const y = d.getFullYear(), w1 = new Date(y, 0, 4, 12); return { w: 1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7), y }; }
const weekOf = mon => [0, 1, 2, 3, 4, 5, 6].map(i => addDays(mon, i));
const monthOf = iso => { const [y, m] = iso.split('-').map(Number), n = new Date(y, m, 0).getDate(); return Array.from({ length: n }, (_, i) => `${y}-${pad2(m)}-${pad2(i + 1)}`); };
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const span = (a, b) => { const x = toMin(a), y = toMin(b); if (x === null || y === null) return 0; let m = y - x; if (m < 0) m += 1440; return m; };
const overlap = (a1, b1, a2, b2) => { const s = Math.max(toMin(a1), toMin(a2)), e = Math.min(toMin(b1), toMin(b2)); return Math.max(0, e - s); };

const DAY_TYPES = [['work', 'Arbeit', 'clock'], ['urlaub', 'Urlaub', 'palm'], ['krank', 'Krank', 'heartp'], ['feiertag', 'Feiertag', 'cal'], ['frei', 'Frei / Ausgleich', 'sun'], ['sonder', 'Sonderurlaub', 'star']];
const typeName = t => (DAY_TYPES.find(x => x[0] === t) || DAY_TYPES[0])[1];
let FIRMA = { betriebsurlaub: [] };   // aus firma.json (für alle)
/* Betriebsurlaub für alle: Firmenvorgabe (firma.json) – außer das Büro hat danach eine neuere Liste geschickt bzw. auf diesem Gerät geändert */
const firmBu = () => (S.buFirm && S.buFirm.list && (!FIRMA.stand || S.buFirm.at >= FIRMA.stand) ? S.buFirm.list : FIRMA.betriebsurlaub || []);
const buList = () => firmBu().map(x => ({ ...x, firm: true })).concat((S.bu || []).map(x => ({ ...x, firm: false })));
const betriebOf = iso => buList().find(x => x.von && x.bis && iso >= x.von && iso <= x.bis) || null;
let DAYS = {};   // iso → { iso, type, segs:[{site,von,bis}], pauses:[{von,bis}], note, geo:[] }
const dayOf = iso => {
  if (DAYS[iso]) return DAYS[iso];
  const b = isWorkday(iso) && betriebOf(iso);
  return { iso, type: holiday(iso) ? 'feiertag' : b ? 'urlaub' : 'work', betrieb: b ? b.name || 'Betriebsurlaub' : '', segs: [], pauses: [], note: '', geo: [] };
};
const hasData = d => !!((d.segs || []).length || (d.pauses || []).length || d.note || (DAYS[d.iso] && d.type !== 'work'));
const curSeg = d => { const s = d.segs || []; return s.length && !s[s.length - 1].bis ? s[s.length - 1] : null; };
const openPause = d => (d.pauses || []).find(p => p.von && !p.bis) || null;

/* Mindestpause je Wochentag (Mo–Do 30, Fr 15 Min.) */
const dayPause = iso => { const h = S.hours[new Date(iso + 'T12:00').getDay()]; return h && h.pause !== undefined && h.pause !== '' ? +h.pause : +S.minPause || 0; };
const minPauseFor = (net, iso) => (S.pauseOnlyOver6 && net <= 360 ? 0 : dayPause(iso));
/* Regelarbeitszeit eines Wochentags (ohne Pause) – auch an Feiertagen (werden gutgeschrieben) */
/* Anteil eines Tages: Heiligabend/Silvester je nach Einstellung halb, voll oder frei */
const HALF_DAYS = [['12-24', 'Heiligabend (24.12.)'], ['12-31', 'Silvester (31.12.)']];
function dayFactor(iso) { const r = (S.halfDays || {})[String(iso).slice(5, 10)]; return r === 'halb' ? 0.5 : r === 'frei' ? 0 : 1; }
const fmtDays = n => num(n, Math.round(n * 10) % 10 ? 1 : 0);
function tplSoll(iso) {
  const h = S.hours[new Date(iso + 'T12:00').getDay()]; if (!h || !h.on || !h.von || !h.bis) return 0;
  const b = span(h.von, h.bis), f = dayFactor(iso); if (!f) return 0;
  const full = Math.max(0, b - minPauseFor(b - dayPause(iso), iso));
  return f === 1 ? full : Math.round(full * f);
}
/* Urlaubstage eines Zeitraums (halbe Tage zählen ½) */
const vacDays = list => list.reduce((a, i) => a + dayFactor(i), 0);
const isWorkday = iso => tplSoll(iso) > 0 && !holiday(iso);
const sollOf = iso => tplSoll(iso);
/* Wochen-Soll (Summe der Regelzeiten Mo–So, Standard 40:00) */
const weekTarget = () => [1, 2, 3, 4, 5, 6, 7].reduce((s, i) => s + tplSoll(addDays('2026-11-08', i)), 0);
function calcDay(d, now = nowHM()) {
  const iso = d.iso, today = iso === isoToday(), soll = sollOf(iso);
  const r = { soll, start: '', end: '', brutto: 0, pause: 0, abzug: 0, netto: 0, credit: 0, diff: 0, over: 0, open: false, inPause: false, missingEnd: false, sites: [] };
  if (d.type !== 'work') { r.credit = d.type === 'frei' ? 0 : soll; r.diff = r.credit - soll; return r; }
  if (holiday(iso) && !(d.segs || []).length) { r.credit = soll; return r; }
  const segs = (d.segs || []).filter(s => s.von).slice().sort((a, b) => toMin(a.von) - toMin(b.von));
  if (!segs.length) { r.diff = iso < isoToday() ? -soll : 0; return r; }
  const last = segs[segs.length - 1], endOf = s => s.bis || (today ? now : null);
  r.start = segs[0].von; r.open = !last.bis; r.missingEnd = r.open && !today; r.end = last.bis || '';
  const end = endOf(last); r.brutto = end ? span(r.start, end) : 0;
  let gaps = 0; for (let i = 1; i < segs.length; i++) if (segs[i - 1].bis) gaps += span(segs[i - 1].bis, segs[i].von);
  let stamped = 0; const pz = (d.pauses || []).filter(p => p.von).map(p => ({ von: p.von, bis: p.bis || (today && r.open ? now : p.von) }));
  for (const p of pz) stamped += span(p.von, p.bis);
  r.inPause = today && r.open && !!openPause(d);
  r.pause = gaps + stamped;
  r.abzug = r.brutto ? Math.min(r.brutto, Math.max(r.pause, minPauseFor(r.brutto - r.pause, iso))) : 0;
  r.netto = Math.max(0, r.brutto - r.abzug);
  r.diff = r.missingEnd ? 0 : r.netto - soll;
  r.over = r.missingEnd ? 0 : Math.max(0, r.diff);
  /* Stunden je Baustelle: Abschnitt minus Pausen darin, Mindestpausen-Rest anteilig */
  const per = {};
  for (const s of segs) { const e = endOf(s); if (!e) continue; let m = span(s.von, e); for (const p of pz) m -= overlap(s.von, e, p.von, p.bis); const k = s.site || 'Ohne Baustelle'; per[k] = (per[k] || 0) + Math.max(0, m); }
  const tot = Object.values(per).reduce((a, b) => a + b, 0), extra = Math.max(0, tot - r.netto);
  r.sites = Object.entries(per).map(([site, m]) => ({ site, min: Math.round(m - (tot ? extra * m / tot : 0)) }));
  return r;
}
function calcRange(isos) {
  const days = isos.map(iso => { const d = dayOf(iso); return { d, c: calcDay(d) }; });
  const sum = k => days.reduce((s, x) => s + x.c[k], 0), sites = {};
  days.forEach(x => x.c.sites.forEach(s => { sites[s.site] = (sites[s.site] || 0) + s.min; }));
  return { days, netto: sum('netto'), credit: sum('credit'), soll: sum('soll'), diff: sum('diff'), over: sum('over'), pause: sum('pause'), abzug: sum('abzug'), sites, count: t => days.filter(x => x.d.type === t && x.c.soll > 0).length };
}
/* Wochenbilanz: Ist (Arbeit + Gutschriften für Urlaub/Krank/Feiertag) gegen Wochen-Soll; Überstunden nur über dem Soll */
function weekStat(mon) {
  const R = calcRange(weekOf(mon)), target = R.soll || weekTarget(), ist = R.netto + R.credit;
  return { ist, target, rest: Math.max(0, target - ist), over: Math.max(0, ist - target), pct: target ? Math.min(100, ist / target * 100) : 0, R };
}
/* Überstundenkonto Woche für Woche:
   + Stunden über dem Wochen-Soll kommen aufs Konto.
   − Fehlende Stunden (nur abgeschlossene Wochen) werden zuerst von den Überstunden abgezogen;
     reicht das nicht, wird der Rest als Minusstunden ausgewiesen (das Konto fällt nie unter 0). */
function account(upTo = mondayOf(isoToday())) {
  const b = S.balance || {}, keys = Object.keys(DAYS).filter(k => hasData(DAYS[k])).sort(), thisMon = mondayOf(isoToday());
  const st = { over: Math.max(0, +b.min || 0), minus: 0, weeks: {} };
  const startMon = b.from ? mondayOf(b.from) : keys.length ? mondayOf(keys[0]) : thisMon;
  for (let mon = startMon; mon <= upTo; mon = addDays(mon, 7)) {
    const w = weekStat(mon), diff = w.ist - w.target, done = addDays(mon, 6) < isoToday() || (mon === thisMon && false);
    const r = { over: 0, used: 0, minus: 0 };
    if (diff > 0) { r.over = diff; st.over += diff; }
    else if (diff < 0 && done) { const need = -diff; r.used = Math.min(st.over, need); st.over -= r.used; r.minus = need - r.used; st.minus += r.minus; }
    st.weeks[mon] = r;
  }
  return st;
}
const balance = () => account().over;
/* Arbeitstage eines Zeitraums (ohne Wochenende, Feiertage und freie Tage) */
const workDaysIn = (von, bis) => { const l = []; if (!von || !bis || bis < von) return l; for (let i = von; i <= bis; i = addDays(i, 1)) if (isWorkday(i)) l.push(i); return l; };
/* Urlaubsanspruch eines Jahres aus dem Eintrittsdatum
   anteilig: 1/12 je vollem Beschäftigungsmonat im Eintrittsjahr (ab ½ Tag aufgerundet)
   gesetzlich (BUrlG): Eintritt bis 1.7. = voller Anspruch, danach anteilig
   Ein von Hand eingetragener Wert für das Jahr hat immer Vorrang. */
function vacAuto(year, V = S.vacation, start = S.person.start) {
  const per = +V.perYear || 0; if (!start) return { days: per, months: 12, why: '' };
  const [sy, sm, sd] = start.split('-').map(Number);
  if (year < sy) return { days: 0, months: 0, why: `Eintritt erst am ${deDate(start)}` };
  if (year > sy) return { days: per, months: 12, why: '' };
  const months = sd === 1 ? 13 - sm : 12 - sm;
  if (V.rule === 'gesetz' && (sm < 7 || (sm === 7 && sd === 1))) return { days: per, months, why: `Eintritt ${deDate(start)} – voller Anspruch (Wartezeit bis Jahresende erfüllt)` };
  const raw = per * months / 12, days = raw % 1 >= 0.5 ? Math.ceil(raw) : Math.floor(raw);
  return { days, months, why: `Eintritt ${deDate(start)}: ${months} volle Monate × ${num(per)}/12 = ${num(raw, raw % 1 ? 2 : 0)} → ${days} Tage` };
}
function vacEntitle(year = tNow().getFullYear()) {
  const a = vacAuto(year), m = S.vacation.manual;
  if (m && +m.year === +year && m.days !== '' && m.days !== null && isFinite(+m.days)) return { ...a, auto: a.days, days: +m.days, manual: true };
  return { ...a, auto: a.days, manual: false };
}
function vacation(year = tNow().getFullYear()) {
  let taken = 0, planned = 0, betrieb = 0; const today = isoToday();
  for (let iso = `${year}-01-01`; iso <= `${year}-12-31`; iso = addDays(iso, 1)) {
    if (!isWorkday(iso)) continue; const d = dayOf(iso); if (d.type !== 'urlaub') continue;
    const b = !DAYS[iso] && betriebOf(iso); if (b && b.abzug === false) continue; const f = dayFactor(iso); if (b) betrieb += f;
    if (iso <= today) taken += f; else planned += f;
  }
  if (+S.vacation.year === +year) taken += +S.vacation.takenBefore || 0;
  let sonder = 0; for (const d of Object.values(DAYS)) if (d.type === 'sonder' && d.iso.startsWith(year + '-') && isWorkday(d.iso)) sonder++;
  const ent = vacEntitle(year), total = ent.days + (+S.vacation.carry || 0), used = taken + planned; return { taken, planned, betrieb, used, total, left: total - used, sonder, ent };
}
async function saveDay(d) { d.updated = Date.now(); DAYS[d.iso] = d; await DB.put('days', clone(d)); }
function rememberSite(name) { const n = (name || '').trim(); if (!n) return; S.sites = [n].concat((S.sites || []).filter(x => x !== n)).slice(0, 40); saveSettings(); }

/* =========================================================
   Oberfläche
   ========================================================= */
const UI = { route: 'home', mon: '', tab: 'person', editUntil: 0, openDay: '', vVon: '', vBis: '', vNote: '', calM: '' };
let DEVICE = { admin: false };   // Admin-Gerät: dauerhaft freigeschaltet (nur auf diesem Gerät, nicht in der Sicherung)
const canEdit = () => DEVICE.admin || Date.now() < UI.editUntil;

function logoMark(h = 34) {
  const l = S.company.logo;
  return l ? `<span class="inline-grid place-items-center rounded-[10px] bg-white px-2" style="height:${h}px"><img src="${esc(l)}" alt="" style="max-height:${h - 8}px;max-width:${h * 3.2}px"></span>` : `<span class="w-9 h-9 rounded-[10px] grid place-items-center text-white" style="background:rgb(var(--p-rgb))">${ic('clock', 18, 2.2)}</span>`;
}
function shell(inner) {
  const nav = [['home', 'Heute', 'clock', '#/'], ['week', 'Woche', 'cal', '#/woche'], ['urlaub', 'Urlaub', 'palm', '#/urlaub'], ['settings', 'Einstellungen', 'gear', '#/einstellungen']];
  return `<header class="sticky top-0 z-40 border-b border-line backdrop-blur-xl" style="background:color-mix(in srgb,var(--bg) 86%,transparent);padding-top:env(safe-area-inset-top)">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
      <a href="#/" class="flex items-center gap-3 min-w-0">${logoMark()}<span class="hidden sm:block leading-tight"><span class="block font-semibold text-[15px]">Stempeluhr</span><span class="block text-[12px] text-ink3">${esc(S.person.name || S.company.name)}</span></span></a>
      <nav class="ml-auto flex items-center gap-1">${nav.map(([k, l, i, h]) => `<a href="${h}" class="navl ${UI.route === k ? 'on' : ''}" aria-label="${l}">${ic(i, 17)}<span class="hidden md:inline">${l}</span></a>`).join('')}
      <button class="btn-p !h-10 !px-4 ml-1" data-a="send-week" data-mon="${mondayOf(isoToday())}">${ic('send', 16)}<span class="hidden sm:inline">An ${esc(S.recipient.name || 'Büro')}</span></button></nav>
    </div></header>
    <main class="max-w-6xl mx-auto px-4 sm:px-6 pb-24">${inner}</main>
    <datalist id="dl-sites">${(S.sites || []).map(x => `<option value="${esc(x)}">`).join('')}</datalist>`;
}
const kpi = (k, v, id = '', cls = '') => `<div class="kpi"><div class="text-[12px] text-ink3">${k}</div><div class="text-[22px] font-semibold mt-1 ${cls}" ${id ? `id="${id}"` : ''}>${v}</div></div>`;
const diffCls = m => (Math.round(m) > 0 ? 'text-p' : '');
const overTxt = m => (Math.round(m) > 0 ? '+' + hm(m) : '–');

const clockSrc = () => (TIME.ok ? `<span class="text-p">${ic('check', 12, 2.6)} Uhrzeit vom Server geprüft</span>` : `<span class="text-yel-ink">${ic('alert', 12)} Offline – Uhrzeit des Handys, Stempel werden markiert</span>`);

const GEO_K = { in: 'Kommen', out: 'Gehen', pause: 'Pause' };
const geoTile = g => g.lat ? `<a class="block rounded-[var(--rb)] overflow-hidden border border-line bg-raised" target="_blank" rel="noopener" href="https://maps.apple.com/?ll=${g.lat},${g.lon}&q=${encodeURIComponent(GEO_K[g.k] || '')}">${g.map ? `<img src="${g.map}" class="w-full aspect-[8/5] object-cover block" alt="">` : `<div class="w-full aspect-[8/5] grid place-items-center text-ink3">${ic('pin', 22)}</div>`}<div class="px-2 py-1.5 text-[12px] leading-tight"><b>${GEO_K[g.k] || g.k} ${esc(g.t)}</b><div class="text-ink3 truncate">${esc(g.addr || `${g.lat}, ${g.lon}`)}${g.acc ? ` · ±${g.acc} m` : ''}</div></div></a>`
  : `<div class="rounded-[var(--rb)] border border-line p-2 text-[12px]" style="background:var(--t-yel)"><b>${GEO_K[g.k] || g.k} ${esc(g.t)}</b><div class="text-yel-ink">Standort nicht ermittelbar</div></div>`;

/* ---------- Wochenstunden (Ziel 40:00) ---------- */
function weekCard(mon, big) {
  const w = weekStat(mon), done = w.ist >= w.target, past = addDays(mon, 6) < isoToday(), acc = past && !done ? account(mon).weeks[mon] || {} : null;
  return `<div class="card p-5 ${big ? 'sm:p-6' : ''}" style="${done ? 'background:var(--p-light)' : ''}">
    <div class="flex flex-wrap items-end justify-between gap-2"><div><div class="text-[13px] text-ink3">Wochenstunden KW ${isoWeek(mon).w}</div><div class="text-[30px] sm:text-[36px] font-semibold leading-tight mt-1 mono whitespace-nowrap" id="wk-ist">${hm(w.ist)} <span class="text-[15px] text-ink3 font-normal font-sans">von ${hm(w.target)} Std.</span></div></div>
      <div class="text-right">${done ? `<div class="text-[12px] text-ink3">Überstunden</div><div class="text-[26px] font-semibold text-p mono" id="wk-over">+${hm(w.over)}</div>` : past ? `<div class="text-[12px] text-ink3">Fehlend</div><div class="text-[26px] font-semibold mono text-ember">−${hm(w.rest)}</div>` : `<div class="text-[12px] text-ink3">Noch zu arbeiten</div><div class="text-[26px] font-semibold mono" id="wk-rest">${hm(w.rest)}</div>`}</div></div>
    <div class="prog !h-3 mt-4"><i id="wk-bar" style="width:${w.pct}%"></i></div>
    <div class="flex justify-between text-[12px] text-ink3 mt-2"><span>${Math.round(w.pct)} % geschafft</span><span>Urlaub, Krank und Feiertage zählen voll mit</span></div>
    ${acc ? `<div class="mt-3 text-[13px] rounded-[var(--rb)] px-3 py-2" style="background:var(--t-red)">${acc.used ? `${hm(acc.used)} Std. von den Überstunden abgezogen. ` : ''}${acc.minus ? `<b class="text-red-ink">${hm(acc.minus)} Minusstunden</b> (keine Überstunden mehr zum Verrechnen).` : ''}</div>` : ''}</div>`;
}

/* ---------- Erinnerung: Stundenzettel freitags übermitteln ---------- */
let SENT = {};   // Montag der Woche → Zeitpunkt des Sendens
function reminderCard() {
  const today = isoToday(), wd = tNow().getDay(), mon = mondayOf(today), last = addDays(mon, -7);
  let m = '', wk = '';
  if (wd === 5 && !SENT[mon]) { m = tNow().getHours() >= 12 || calcDay(dayOf(today)).end ? 'Heute ist Freitag – bitte den Stundenzettel an ' : 'Denk heute daran, den Stundenzettel an '; wk = mon; }
  else if ((wd === 6 || wd === 0) && !SENT[mon] && Object.keys(DAYS).some(i => i >= mon && i <= today)) { m = 'Stundenzettel dieser Woche noch nicht übermittelt – bitte an '; wk = mon; }
  else if (wd >= 1 && wd <= 4 && !SENT[last] && Object.keys(DAYS).some(i => i >= last && i < mon)) { m = 'Der Stundenzettel der letzten Woche fehlt noch – bitte an '; wk = last; }
  if (!m) return '';
  return `<div class="card p-4 mb-4 flex flex-wrap items-center gap-3 border-s/50" style="background:rgb(var(--s-rgb)/.14)"><span class="w-10 h-10 rounded-full grid place-items-center shrink-0" style="background:rgb(var(--s-rgb)/.25);color:var(--yel-ink)">${ic('alert', 20)}</span><div class="flex-1 min-w-[200px] text-[14px]"><b>Erinnerung:</b> ${m}${esc(S.recipient.name || 'das Büro')} schicken (KW ${isoWeek(wk).w}).</div><button class="btn-p !h-10" data-a="send-week" data-mon="${wk}">${ic('send', 16)}Jetzt senden</button></div>`;
}

/* ---------- Heute ---------- */
function siteChips(target) {
  const l = (S.sites || []).slice(0, 8); if (!l.length) return '';
  return `<div class="flex flex-wrap gap-1.5 mt-2">${l.map(x => `<button type="button" class="chip" data-a="site-pick" data-t="${target}" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;
}
function viewHome() {
  const iso = isoToday(), d = dayOf(iso), c = calcDay(d), seg = curSeg(d), wk = isoWeek(iso), dt = tNow();
  const state = d.type !== 'work' ? 'absent' : c.inPause ? 'pause' : seg ? 'work' : 'idle';
  const status = { idle: (d.segs || []).length ? `Ausgestempelt um ${esc(c.end)} Uhr` : 'Noch nicht eingestempelt', work: `Bei der Arbeit seit ${esc(seg ? seg.von : '')} Uhr${seg && seg.site ? ` · ${esc(seg.site)}` : ''}`, pause: `In Pause seit ${esc((openPause(d) || {}).von || '')} Uhr`, absent: typeName(d.type) }[state];
  const dot = { idle: 'bg-ink3', work: 'bg-p', pause: 'bg-s', absent: 'bg-s' }[state];
  const btn = (a, label, icon, style, dis) => `<button class="stamp" data-a="${a}" style="${style}" ${dis ? 'disabled' : ''}>${ic(icon, 30, 2)}<span>${label}</span></button>`;
  const G = 'background:rgb(var(--p-rgb));color:#fff', Y = 'background:rgb(var(--s-rgb));color:#1b1405', R = 'background:#D9482B;color:#fff', N = 'background:var(--raised);color:var(--ink);border:1px solid var(--line2)';
  let buttons = '';
  const V = 'background:rgb(var(--s-rgb)/.16);color:var(--yel-ink);border:1px solid rgb(var(--s-rgb)/.45)';
  if (state === 'idle') buttons = `<div class="grid gap-3">${btn('in', (d.segs || []).length ? 'Wieder kommen' : 'Kommen', 'play', G)}${(d.segs || []).length || !isWorkday(iso) ? '' : `<div class="grid grid-cols-2 gap-3">${btn('vac-today', 'Heute Urlaub', 'palm', V)}${btn('sick-today', 'Heute krank', 'heartp', 'background:var(--t-red);color:var(--red-ink);border:1px solid rgba(217,72,43,.35)')}</div>`}</div>`;
  else if (state === 'work') buttons = `<div class="grid grid-cols-2 gap-3">${btn('pause', 'Pause', 'coffee', Y)}${btn('switch', 'Baustelle wechseln', 'refresh', N)}<div class="col-span-2">${btn('out', 'Gehen', 'stop', R)}</div></div>`;
  else if (state === 'pause') buttons = `<div class="grid grid-cols-2 gap-3">${btn('pause', 'Pause beenden', 'play', G)}${btn('out', 'Gehen', 'stop', R)}</div>`;
  else buttons = `<div class="rounded-[var(--r)] p-5 text-center" style="background:rgb(var(--s-rgb)/.14)"><div class="text-yel-ink">${ic(d.type === 'urlaub' ? 'palm' : d.type === 'krank' ? 'heartp' : 'cal', 34, 1.7)}</div><div class="text-[20px] font-semibold mt-2">Heute: ${d.betrieb ? esc(d.betrieb) : typeName(d.type)}</div>${d.type === 'feiertag' && holiday(iso) ? `<div class="text-ink3 text-[14px]">${esc(holiday(iso))}</div>` : ''}</div><div class="grid grid-cols-2 gap-3 mt-3">${btn('in', 'Trotzdem kommen', 'play', G)}${d.type === 'urlaub' ? btn('vac-undo', 'Urlaub zurücknehmen', 'x', N) : d.type === 'krank' ? btn('sick-undo', 'Doch nicht krank', 'x', N) : ''}</div>${d.type === 'krank' ? `<button class="btn-s w-full mt-3" data-a="sick-tell">${ic('send', 16)}${esc(S.recipient.name || 'Büro')} Bescheid geben</button><p class="hint text-center">Gute Besserung! Bitte die Krankmeldung (AU) wie gewohnt einreichen.</p>` : ''}`;
  /* fehlendes Gehen an früheren Tagen */
  const miss = Object.values(DAYS).filter(x => x.iso < iso && x.iso >= addDays(iso, -21) && calcDay(x).missingEnd).sort((a, b) => a.iso.localeCompare(b.iso));
  const missCard = miss.length ? `<div class="card p-4 mt-4 border-ember/50 flex flex-wrap items-center gap-3" style="background:var(--t-red)"><span class="text-ember">${ic('alert', 20)}</span><div class="flex-1 min-w-[200px] text-[14px]">Ausstempeln fehlt: ${miss.map(x => `<b>${wdOf(x.iso).slice(0, 2)}, ${deDate(x.iso)}</b>`).join(', ')} – bitte vom Admin korrigieren lassen.</div><a class="btn-s !h-9" href="#/woche/${mondayOf(miss[0].iso)}">Ansehen</a></div>` : '';
  const segs = (d.segs || []).map(s => `<div class="flex items-center gap-3 py-2 border-b border-line last:border-0 text-[14px]"><span class="w-2 h-2 rounded-full ${s.bis ? 'bg-ink3' : 'bg-p'}"></span><span class="flex-1 min-w-0 truncate">${esc(s.site || 'Ohne Baustelle')}</span><span class="mono text-ink2">${esc(s.von)}–${esc(s.bis || 'jetzt')}</span></div>`).join('');
  const W = calcRange(weekOf(mondayOf(iso))), ACC = account(), bal = ACC.over, vac = vacation();
  const week = W.days.filter(x => x.c.soll > 0 || hasData(x.d)).map(x => `<a href="#/woche/${mondayOf(iso)}" class="flex items-center gap-3 py-2.5 border-b border-line last:border-0 text-[14px] ${x.d.iso === iso ? 'font-semibold' : ''}"><span class="w-24">${wdOf(x.d.iso).slice(0, 2)}, ${deDate(x.d.iso).slice(0, 6)}</span><span class="flex-1 text-ink3 truncate">${x.d.type !== 'work' ? typeName(x.d.type) : x.c.start ? `${x.c.start}–${x.c.end || '…'}` : '–'}</span><span class="mono w-14 text-right">${hm(x.c.netto + x.c.credit)}</span><span class="mono w-12 text-right text-ink3 text-[12px] whitespace-nowrap">/ ${hm(x.c.soll)}</span></a>`).join('');
  return `<section class="pt-6 sm:pt-10">
    ${reminderCard()}
    ${S.person.name ? '' : `<a href="#/einstellungen/person" class="card p-4 mb-4 flex items-center gap-3 text-[14px]" style="background:var(--t-yel)"><span class="text-yel-ink">${ic('info', 18)}</span><span class="flex-1">Bitte zuerst deinen Namen eintragen – er steht auf dem Stundenzettel.</span>${ic('arrowR', 16)}</a>`}
    <div class="grid lg:grid-cols-[1.1fr_.9fr] gap-4">
      <div class="card p-5 sm:p-7">
        <div class="flex items-center justify-between gap-3"><span class="text-[13px] text-ink3">${WD[dt.getDay()]}, ${deDate(iso)} · KW ${wk.w}</span><span class="inline-flex items-center gap-2 text-[13px]"><span class="w-2 h-2 rounded-full ${dot} ${state === 'work' ? 'animate-pulse' : ''}"></span>${esc(status)}</span></div>
        <div class="big-clock text-[52px] sm:text-[76px] leading-none mt-4" id="clock">${nowHMS()}</div><div class="text-[12px] mt-2" id="clock-src">${clockSrc()}</div>
        ${state === 'idle' || state === 'work' ? `<label class="block mt-6"><span class="lbl">${state === 'work' ? 'Neue Baustelle (für „Baustelle wechseln“)' : 'Baustelle'}</span><input class="inp" id="site" list="dl-sites" placeholder="z. B. Meier, Lotte" autocomplete="off" value="${state === 'idle' && (d.segs || []).length ? esc(d.segs[d.segs.length - 1].site || '') : ''}"></label>${siteChips('site')}` : ''}
        <div class="mt-5">${GEO_STATE === 'denied' ? `<div class="rounded-[var(--r)] p-5" style="background:var(--t-red)"><div class="flex items-center gap-2 font-semibold text-red-ink">${ic('pin', 18)}Standort nicht freigegeben – Stempeln gesperrt</div><div class="mt-3">${geoHelp()}</div><button class="btn-p w-full mt-4" data-a="geo-retry">${ic('refresh', 16)}Erneut prüfen</button></div>` : `${GEO_STATE !== 'granted' && !S.gpsConsent ? `<button class="w-full text-left rounded-[var(--rb)] p-3 mb-3 text-[13px] flex items-center gap-2" style="background:var(--p-light)" data-a="geo-ask">${ic('pin', 16)}<span class="flex-1">Zum Stempeln wird der Standort benötigt – jetzt freigeben</span>${ic('arrowR', 15)}</button>` : ''}${buttons}`}</div>
        ${missCard}
      </div>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-2">${kpi('Arbeitszeit heute', hm(c.netto + c.credit), 'live-netto')}${kpi('Soll heute', hm(c.soll))}${kpi('Pause (abgezogen)', `${hm(c.abzug)}`, 'live-pause')}${kpi('Pause gestempelt', hm(c.pause))}</div>
        <p class="text-[12px] text-ink3 -mt-2">Heute werden mindestens ${dayPause(iso)} Min. Pause abgezogen – auch ohne gestempelte Pause; längere Pausen voll.</p>
        ${segs ? `<div class="card p-4"><div class="text-[13px] text-ink3 mb-1">Heute</div>${segs}${(d.geo || []).length ? `<div class="grid grid-cols-2 gap-2 mt-3">${d.geo.slice(-2).map(geoTile).join('')}</div>` : ''}</div>` : ''}
        <div class="grid grid-cols-2 gap-2"><div class="kpi" style="background:var(--p-light)"><div class="text-[12px] text-ink3">Überstunden gesamt</div><div class="text-[26px] font-semibold mt-1 text-p">${overTxt(bal)}</div>${ACC.minus ? `<div class="text-[12px] text-red-ink mt-1">Minusstunden: ${hm(ACC.minus)}</div>` : ''}</div><a href="#/urlaub" class="kpi block"><div class="text-[12px] text-ink3">Resturlaub ${tNow().getFullYear()}</div><div class="text-[26px] font-semibold mt-1">${fmtDays(vac.left)} <span class="text-[13px] text-ink3 font-normal">von ${fmtDays(vac.total)} Tagen</span></div></a></div>
      </div>
    </div>
    <div class="mt-4">${weekCard(mondayOf(iso), true)}</div>
    <div class="card p-5 mt-4"><div class="flex flex-wrap items-center justify-between gap-2 mb-2"><h2 class="sec-t">Diese Woche</h2></div>${week || '<div class="text-ink3 text-[14px]">Noch keine Einträge.</div>'}
      <div class="flex flex-wrap gap-2 mt-4"><a class="btn-s" href="#/woche">${ic('cal', 16)}Woche ansehen</a><button class="btn-g" data-a="konto-edit">${ic('edit', 15)}Bestand einpflegen (Admin)</button><button class="btn-p" data-a="send-week" data-mon="${mondayOf(iso)}">${ic('send', 16)}Stundenzettel an ${esc(S.recipient.name || 'Büro')}</button></div></div>
  </section>`;
}

/* ---------- Woche ---------- */
function dayEditor(d) {
  const iso = d.iso, segs = d.segs || [], pz = d.pauses || [];
  return `<div class="mt-3 pt-3 border-t border-line space-y-4">
    <div><span class="lbl">Art des Tages</span><div class="flex flex-wrap gap-1.5">${DAY_TYPES.map(([k, l, i]) => `<button class="chip ${d.type === k ? '!border-p !text-ink !bg-p/15' : ''}" data-a="ed-type" data-iso="${iso}" data-v="${k}">${ic(i, 14)}${l}</button>`).join('')}</div></div>
    ${d.type === 'work' ? `<div><span class="lbl">Arbeitszeiten je Baustelle</span><div class="space-y-2">${segs.map((s, i) => `<div class="grid grid-cols-[1fr_88px_88px_auto] gap-2 items-center"><input class="inp !h-10" list="dl-sites" data-ed="${iso}" data-seg="${i}" data-k="site" value="${esc(s.site || '')}" placeholder="Baustelle"><input type="time" class="inp !h-10 !px-2" data-ed="${iso}" data-seg="${i}" data-k="von" value="${esc(s.von || '')}"><input type="time" class="inp !h-10 !px-2" data-ed="${iso}" data-seg="${i}" data-k="bis" value="${esc(s.bis || '')}"><button class="btn-g !px-2 hover:!text-ember" data-a="ed-seg-del" data-iso="${iso}" data-i="${i}" aria-label="Entfernen">${ic('trash', 15)}</button></div>`).join('')}</div>
      <button class="btn-s !h-9 mt-2" data-a="ed-seg-add" data-iso="${iso}">${ic('plus', 15)}Zeitraum</button></div>
    <div><span class="lbl">Gestempelte Pausen</span><div class="space-y-2">${pz.map((p, i) => `<div class="grid grid-cols-[88px_88px_auto] sm:w-max gap-2 items-center"><input type="time" class="inp !h-10 !px-2" data-ed="${iso}" data-pz="${i}" data-k="von" value="${esc(p.von || '')}"><input type="time" class="inp !h-10 !px-2" data-ed="${iso}" data-pz="${i}" data-k="bis" value="${esc(p.bis || '')}"><button class="btn-g !px-2 hover:!text-ember" data-a="ed-pz-del" data-iso="${iso}" data-i="${i}" aria-label="Entfernen">${ic('trash', 15)}</button></div>`).join('')}</div>
      <button class="btn-s !h-9 mt-2" data-a="ed-pz-add" data-iso="${iso}">${ic('plus', 15)}Pause</button></div>` : ''}
    ${hasData(d) ? `<button class="btn-g hover:!text-ember" data-a="ed-clear" data-iso="${iso}">${ic('trash', 15)}Tag leeren</button>` : ''}
  </div>`;
}
function viewWeek() {
  const mon = UI.mon || mondayOf(isoToday()), wk = isoWeek(mon), W = calcRange(weekOf(mon)), edit = canEdit(), today = isoToday();
  const days = W.days.filter(x => x.c.soll > 0 || hasData(x.d) || x.d.iso === today || [1, 2, 3, 4, 5].includes(new Date(x.d.iso + 'T12:00').getDay()));
  const cards = days.map(({ d, c }) => {
    const open = UI.openDay === d.iso, log = (d.log || []).length;
    return `<div class="card p-4 sm:p-5 ${d.iso === today ? 'border-p/50' : ''}">
      <div class="flex flex-wrap items-start gap-3">
        <div class="w-28"><div class="font-semibold">${wdOf(d.iso)}</div><div class="text-[13px] text-ink3">${deDate(d.iso)}</div></div>
        <div class="flex-1 min-w-[180px] text-[14px]">
          ${d.type !== 'work' ? `<span class="badge bg-tyel text-yel-ink">${d.betrieb ? esc(d.betrieb) : typeName(d.type)}${d.type === 'feiertag' && holiday(d.iso) ? ' · ' + esc(holiday(d.iso)) : ''}</span>` : c.start ? `<div><span class="mono">${c.start}–${c.end || (c.missingEnd ? '?' : 'jetzt')}</span> <span class="text-ink3">· Pause ${hm(c.pause)}${c.abzug > c.pause ? ` (abgezogen ${hm(c.abzug)})` : ''}</span></div>` : `<span class="text-ink3">${c.soll ? 'Kein Eintrag' : 'Frei'}</span>`}
          ${c.missingEnd ? `<div class="text-ember text-[13px] mt-1">${ic('alert', 13)} Ausstempeln fehlt</div>` : ''}
          ${c.sites.length ? `<div class="flex flex-wrap gap-1.5 mt-2">${c.sites.map(s => `<span class="badge bg-raised text-ink2">${ic('pin', 12)}${esc(s.site)} · ${hm(s.min)}</span>`).join('')}</div>` : ''}
          ${(d.geo || []).length ? `<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">${d.geo.map(geoTile).join('')}</div>` : ''}${(d.offline || []).length ? `<div class="text-[12px] text-yel-ink mt-1.5">${ic('alert', 12)} offline gestempelt (Handy-Uhr): ${esc(d.offline.join(', '))}</div>` : ''}${d.edited ? `<div class="text-[12px] text-ink3 mt-1.5">${ic('edit', 12)} nachgetragen${log ? ` (${log} Änderung${log > 1 ? 'en' : ''})` : ''}</div>` : ''}
        </div>
        <div class="text-right"><div class="text-[18px] font-semibold mono">${hm(c.netto + c.credit)}</div><div class="text-[12px] text-ink3">Soll ${hm(c.soll)}</div></div>
      </div>
      <label class="block mt-3"><span class="sr-only">Notiz</span><input class="inp !h-10 text-[14px]" data-note="${d.iso}" value="${esc(d.note || '')}" placeholder="Notiz zum Tag (optional)"></label>
      ${edit ? (open ? dayEditor(d) : `<button class="btn-g !h-8 mt-2 -ml-2" data-a="ed-open" data-iso="${d.iso}">${ic('edit', 14)}Zeiten bearbeiten</button>`) : ''}
    </div>`;
  }).join('');
  const lock = edit ? `<div class="flex flex-wrap items-center gap-2 text-[13px] rounded-[var(--rb)] px-3 py-2" style="background:var(--p-light)"><span class="text-p">${ic('check', 15, 2.4)}</span>${DEVICE.admin ? 'Admin-Gerät – Nachtragen freigeschaltet' : `Bearbeiten freigeschaltet bis ${new Date(UI.editUntil).toTimeString().slice(0, 5)} Uhr`}${DEVICE.admin ? '' : `<button class="btn-g !h-7 !px-2" data-a="lock">Sperren</button>`}</div>`
    : `<button class="btn-s" data-a="unlock">${ic('edit', 16)}Nachtragen / korrigieren</button>`;
  return `<section class="pt-6 sm:pt-10">
    <div class="flex flex-wrap items-center gap-3"><h1 class="h-font text-[38px] sm:text-[48px] leading-none mr-auto">KW ${wk.w}</h1>
      <div class="flex items-center gap-1"><a class="btn-s !px-3" href="#/woche/${addDays(mon, -7)}" aria-label="Vorige Woche">${ic('chevL', 18)}</a><a class="btn-s" href="#/woche/${mondayOf(today)}">Heute</a><a class="btn-s !px-3" href="#/woche/${addDays(mon, 7)}" aria-label="Nächste Woche">${ic('chevR', 18)}</a></div></div>
    <p class="text-ink3 text-[14px] mt-2">${deDate(mon)} – ${deDate(addDays(mon, 6))} · ${esc(S.person.name || 'Name fehlt')}</p>
    <div class="grid lg:grid-cols-[1fr_260px] gap-3 mt-5">${weekCard(mon)}<div class="kpi"><div class="text-[12px] text-ink3">Überstunden gesamt</div><div class="text-[22px] font-semibold mt-1 text-p">${overTxt(balance())}</div>${account().minus ? `<div class="text-[12px] text-red-ink mt-1">Minusstunden gesamt: ${hm(account().minus)}</div>` : ''}<button class="btn-g !h-8 !px-0 mt-2" data-a="konto-edit">${ic('edit', 14)}Bestand einpflegen</button></div></div>
    <div class="flex flex-wrap items-center gap-2 mt-5"><button class="btn-p" data-a="send-week" data-mon="${mon}">${ic('send', 16)}Stundenzettel an ${esc(S.recipient.name || 'Büro')}</button><button class="btn-s" data-a="send-month" data-iso="${mon}">${ic('file', 16)}Monat ${MONTHS[+mon.slice(5, 7) - 1]}</button><span class="flex-1"></span>${lock}</div>
    <div class="space-y-3 mt-5">${cards}</div>
    ${Object.keys(W.sites).length ? `<div class="card p-5 mt-4"><h2 class="sec-t mb-3">Baustellen dieser Woche</h2>${Object.entries(W.sites).sort((a, b) => b[1] - a[1]).map(([k, m]) => `<div class="flex justify-between py-2 border-b border-line last:border-0 text-[14px]"><span>${esc(k)}</span><b class="mono">${hm(m)}</b></div>`).join('')}</div>` : ''}
  </section>`;
}

/* ---------- Urlaub ---------- */
function calendar() {
  const base = UI.calM || isoToday().slice(0, 7) + '-01', [y, m] = base.split('-').map(Number), first = `${y}-${pad2(m)}-01`, days = monthOf(first), lead = (new Date(first + 'T12:00').getDay() + 6) % 7, today = isoToday();
  const cell = iso => {
    const d = dayOf(iso), wd = new Date(iso + 'T12:00').getDay(), hol = holiday(iso), b = d.type === 'urlaub' && (d.betrieb || (!DAYS[iso] && betriebOf(iso)));
    let bg = '', fg = '', tag = '';
    if (d.type === 'urlaub') { bg = b ? 'rgb(229,154,92,.22)' : 'rgb(var(--s-rgb)/.22)'; tag = b ? 'BU' : 'U'; }
    else if (d.type === 'krank') { bg = 'var(--t-red)'; tag = 'K'; }
    else if (hol || d.type === 'feiertag') { bg = 'rgba(59,130,246,.16)'; tag = 'F'; }
    else if (d.type === 'frei') { bg = 'var(--raised)'; tag = 'A'; }
    else if (d.type === 'sonder') { bg = 'rgba(139,92,246,.18)'; tag = 'S'; }
    else if ((d.segs || []).length) { tag = '•'; fg = 'color:rgb(var(--p-rgb))'; }
    const we = wd === 0 || wd === 6;
    return `<div class="aspect-square rounded-[10px] p-1 sm:p-1.5 flex flex-col text-[12px] sm:text-[13px] ${iso === today ? 'ring-2 ring-p' : ''} ${we && !bg ? 'opacity-45' : ''}" style="background:${bg || (we ? 'transparent' : 'var(--field)')}" title="${esc(hol || d.betrieb || typeName(d.type))}"><span class="font-medium">${+iso.slice(8)}</span><span class="mt-auto text-[10px] sm:text-[11px] font-semibold" style="${fg}">${tag}</span></div>`;
  };
  const prev = `${m === 1 ? y - 1 : y}-${pad2(m === 1 ? 12 : m - 1)}-01`, next = `${m === 12 ? y + 1 : y}-${pad2(m === 12 ? 1 : m + 1)}-01`;
  const lg = (c, l) => `<span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded" style="background:${c}"></span>${l}</span>`;
  return `<div class="card p-5 sm:p-6 mt-4"><div class="flex items-center gap-2 mb-4"><h2 class="sec-t flex-1">${MONTHS[m - 1]} ${y}</h2><button class="btn-s !px-3 !h-9" data-a="cal" data-v="${prev}" aria-label="Voriger Monat">${ic('chevL', 17)}</button><button class="btn-s !h-9" data-a="cal" data-v="">Heute</button><button class="btn-s !px-3 !h-9" data-a="cal" data-v="${next}" aria-label="Nächster Monat">${ic('chevR', 17)}</button></div>
    <div class="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[11px] text-ink3 mb-1">${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(x => `<span>${x}</span>`).join('')}</div>
    <div class="grid grid-cols-7 gap-1 sm:gap-1.5">${'<div></div>'.repeat(lead)}${days.map(cell).join('')}</div>
    <div class="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-[12px] text-ink2">${lg('rgb(var(--s-rgb)/.35)', 'U = Urlaub')}${lg('rgb(229,154,92,.4)', 'BU = Betriebsurlaub')}${lg('rgba(59,130,246,.3)', 'F = Feiertag')}${lg('var(--t-red)', 'K = Krank')}<span class="inline-flex items-center gap-1.5"><b class="text-p">•</b>gearbeitet</span></div>
    <p class="hint mt-3">${ic('alert', 12)} Nur deine eigenen Einträge – Kollegen sehen diesen Kalender nicht.</p></div>`;
}
function viewUrlaub() {
  const y = tNow().getFullYear(), v = vacation(y), today = isoToday();
  const von = UI.vVon || today, bis = UI.vBis || von, days = workDaysIn(von, bis);
  const list = Object.values(DAYS).filter(d => d.type === 'urlaub' && d.iso.startsWith(y + '-') && !betriebOf(d.iso)).sort((a, b) => a.iso.localeCompare(b.iso));
  const blocks = []; list.forEach(d => { const l = blocks[blocks.length - 1]; if (l && workDaysIn(addDays(l.bis, 1), addDays(d.iso, -1)).length === 0) { l.bis = d.iso; l.n += sollOf(d.iso) > 0 ? dayFactor(d.iso) : 0; } else blocks.push({ von: d.iso, bis: d.iso, n: sollOf(d.iso) > 0 ? dayFactor(d.iso) : 0 }); });
  const reqs = (UI.requests || []).slice().reverse().slice(0, 8);
  return `<section class="pt-6 sm:pt-10"><h1 class="h-font text-[38px] sm:text-[48px] leading-none">Urlaub</h1>
    ${buList().filter(b => b.bis >= today).length ? `<div class="card p-4 mt-5 flex flex-wrap items-center gap-3" style="background:rgb(229,154,92,.12)"><span style="color:#C7792F">${ic('cal', 20)}</span><a href="#/einstellungen/bu" class="text-[13px] text-p font-semibold order-last">Ansehen / ändern →</a><div class="flex-1 min-w-[200px] text-[14px]">${buList().filter(b => b.bis >= today).map(b => `<div><b>${esc(b.name || 'Betriebsurlaub')}</b>: ${deDate(b.von)} – ${deDate(b.bis)} · ${(() => { const l = workDaysIn(b.von, b.bis), ys = [...new Set(l.map(i => i.slice(0, 4)))]; return ys.length > 1 ? ys.map(y2 => { const n = vacDays(l.filter(i => i.startsWith(y2))); return `${fmtDays(n)} ${n === 1 ? 'Tag' : 'Tage'} ${y2}`; }).join(' + ') : `${fmtDays(vacDays(l))} Urlaubstage`; })()}${b.abzug === false ? ' (zählt nicht vom Urlaub)' : ''}</div>`).join('')}</div></div>` : ''}
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">${kpi(`Anspruch ${y}`, `${fmtDays(v.total)} Tage`)}${kpi('Genommen', `${fmtDays(v.taken)} Tage`)}${kpi('Geplant', `${fmtDays(v.planned)} Tage${v.betrieb ? ` <span class="text-[12px] text-ink3 font-normal">davon ${fmtDays(v.betrieb)} Betriebsurl.</span>` : ''}`)}<div class="kpi" style="background:var(--p-light)"><div class="text-[12px] text-ink3">Resturlaub</div><div class="text-[26px] font-semibold mt-1 text-p">${fmtDays(v.left)} Tage</div></div></div>
    ${v.ent.why || v.sonder ? `<p class="hint">${v.ent.why ? esc(v.ent.why) + (v.ent.manual ? ' · angepasst auf ' + v.ent.days + ' Tage' : '') : ''}${v.ent.why && v.sonder ? ' · ' : ''}${v.sonder ? `Sonderurlaub ${y}: ${v.sonder} ${v.sonder === 1 ? 'Tag' : 'Tage'} (wird nicht vom Urlaub abgezogen)` : ''}</p>` : ''}
    <button class="btn-g mt-2" data-a="konto-edit">${ic('edit', 15)}Urlaub / Überstunden einpflegen (Admin)</button>
    <div class="grid lg:grid-cols-2 gap-4 mt-4">
      <div class="card p-5 sm:p-6"><h2 class="sec-t mb-1">Urlaub eintragen oder einreichen</h2><p class="text-ink3 text-[14px] mb-5">Wochenenden und Feiertage werden nicht mitgezählt.</p>
        <div class="grid grid-cols-2 gap-3"><label class="block"><span class="lbl">Von</span><input type="date" class="inp" data-vac="von" value="${esc(von)}"></label><label class="block"><span class="lbl">Bis</span><input type="date" class="inp" data-vac="bis" value="${esc(bis)}"></label></div>
        <label class="block mt-3"><span class="lbl">Bemerkung (optional)</span><input class="inp" data-vac="note" value="${esc(UI.vNote || '')}" placeholder="z. B. Familienurlaub"></label>
        <div class="kpi mt-4 flex items-center justify-between"><span class="text-[14px]">${deDate(von)} – ${deDate(bis)}</span><b class="text-[22px]" id="vac-n">${fmtDays(vacDays(days))} Urlaubstag${days.length === 1 ? '' : 'e'}</b></div>
        ${vacDays(days) > v.left ? `<p class="text-ember text-[13px] mt-2">Achtung: mehr Tage als Resturlaub (${fmtDays(v.left)}).</p>` : ''}
        <div class="grid sm:grid-cols-2 gap-2 mt-4"><button class="btn-p !h-12" data-a="vac-submit">${ic('send', 17)}Urlaub einreichen (PDF an ${esc(S.recipient.name || 'Büro')})</button><button class="btn-s !h-12" data-a="vac-set">${ic('palm', 17)}Direkt eintragen</button></div>
        <p class="hint">„Einreichen“ erstellt einen Urlaubsantrag als PDF, speichert ihn und öffnet Teilen (WhatsApp). „Direkt eintragen“ trägt die Tage in den Kalender ein – vergangene Tage nur mit Admin-Passwort.</p></div>
      <div class="card p-5 sm:p-6"><h2 class="sec-t mb-3">Eingetragener Urlaub ${y}</h2>${blocks.length ? blocks.map(b => `<div class="flex items-center gap-3 py-2.5 border-b border-line last:border-0 text-[14px]"><span class="text-yel-ink">${ic('palm', 16)}</span><span class="flex-1">${deDate(b.von)}${b.bis !== b.von ? ' – ' + deDate(b.bis) : ''}</span><b>${fmtDays(b.n)} Tag${b.n === 1 ? '' : 'e'}</b><button class="btn-g !h-8 !px-2 hover:!text-ember" data-a="vac-del" data-von="${b.von}" data-bis="${b.bis}" aria-label="Entfernen">${ic('trash', 15)}</button></div>`).join('') : '<div class="text-ink3 text-[14px]">Noch kein Urlaub eingetragen.</div>'}
        ${reqs.length ? `<h3 class="font-semibold mt-6 mb-2 text-[15px]">Eingereichte Anträge</h3>${reqs.map(r => `<div class="flex items-center gap-3 py-2 border-b border-line last:border-0 text-[13px]"><span class="flex-1">${deDate(r.von)} – ${deDate(r.bis)} · ${r.n} Tage</span><span class="text-ink3">eingereicht ${deDate(r.at.slice(0, 10))}</span></div>`).join('')}` : ''}</div>
    </div>${calendar()}</section>`;
}

/* ---------- Einstellungen ---------- */
const SET_TABS = [['person', 'Ich & Empfänger', 'users'], ['zeiten', 'Arbeitszeiten', 'clock'], ['konten', 'Konten', 'cal'], ['bu', 'Betriebsurlaub', 'palm'], ['firma', 'Firma & Logo', 'building'], ['design', 'Design', 'sun'], ['admin', 'Admin', 'gear'], ['daten', 'Daten', 'download']];
const LOCKED_TABS = ['zeiten', 'konten', 'bu'];
const sIn = (path, label, ph = '', type = 'text', dis = false) => { const v = path.split('.').reduce((o, k) => (o || {})[k], S); return `<label class="block"><span class="lbl">${label}</span><input class="inp" data-s="${path}" type="${type}" value="${esc(v ?? '')}" placeholder="${esc(ph)}" ${type === 'number' ? 'inputmode="decimal"' : ''} ${dis ? 'disabled' : ''}></label>`; };
function setBody() {
  const ro = LOCKED_TABS.includes(UI.tab) && !canEdit();
  const lockNote = ro ? `<div class="rounded-[var(--rb)] bg-raised p-3 mb-5 flex flex-wrap items-center gap-3 text-[14px]"><span class="text-ink3">${ic('alert', 17)}</span><span class="flex-1">Nur mit Admin-Passwort änderbar.</span><button class="btn-s !h-9" data-a="unlock">Freischalten</button></div>` : '';
  switch (UI.tab) {
    case 'person': return `<div class="grid sm:grid-cols-2 gap-4">${sIn('person.name', 'Mein Name', 'Vor- und Nachname')}${sIn('person.nr', 'Personalnummer (optional)')}</div>
      <h3 class="font-semibold mt-7 mb-3">Stundenzettel senden an</h3><div class="grid sm:grid-cols-2 gap-4">${sIn('recipient.name', 'Name', 'z. B. Jule')}${sIn('recipient.phone', 'WhatsApp-Nummer (optional)', 'z. B. 0176 …', 'tel')}</div>
      <p class="hint">Das PDF wird gespeichert und über „Teilen“ an WhatsApp übergeben – dort ${esc(S.recipient.name || 'den Empfänger')} auswählen. Die Nummer wird genutzt, wenn das Gerät kein Teilen von Dateien kann.</p>
      <h3 class="font-semibold mt-7 mb-2">Erinnerung jeden Freitag</h3><p class="text-ink3 text-[14px] mb-3">Die App erinnert freitags auf der Startseite. Zusätzlich kann eine wiederkehrende Erinnerung in den Handy-Kalender übernommen werden – sie meldet sich jeden Freitag um 13:30 Uhr, auch wenn die App geschlossen ist.</p><button class="btn-s" data-a="ics">${ic('cal', 16)}Erinnerung in Kalender übernehmen</button>
      <div class="kpi mt-6 text-[14px] flex items-start gap-2"><span class="text-p mt-0.5">${ic('pin', 16)}</span><span>Beim Kommen, bei Pausen und beim Gehen wird der Standort gespeichert (Pflicht). Ohne Standortfreigabe ist Stempeln nicht möglich.${S.gpsConsent ? ` Hinweis bestätigt am ${deDate(S.gpsConsent.slice(0, 10))}.` : ''}</span></div>`;
    case 'zeiten': return `${lockNote}<p class="text-ink3 text-[14px] mb-4">Sollzeiten je Wochentag. Die Mindestpause wird bei der Sollzeit und bei jedem Arbeitstag abgezogen.</p>
      <div class="grid grid-cols-[70px_1fr_1fr_64px_58px] gap-2 text-[12px] text-ink3 mb-1"><span>Tag</span><span>Beginn</span><span>Ende</span><span>Pause</span><span class="text-right">Soll</span></div><div class="space-y-2">${[1, 2, 3, 4, 5, 6, 0].map(k => { const h = S.hours[k]; return `<div class="grid grid-cols-[70px_1fr_1fr_64px_58px] gap-2 items-center"><label class="flex items-center gap-2 text-[14px]"><input type="checkbox" data-hour="${k}" data-k="on" ${h.on ? 'checked' : ''} ${ro ? 'disabled' : ''}>${WD[k].slice(0, 2)}</label><input type="time" class="inp !h-10 !px-2" data-hour="${k}" data-k="von" value="${esc(h.von)}" ${ro || !h.on ? 'disabled' : ''}><input type="time" class="inp !h-10 !px-2" data-hour="${k}" data-k="bis" value="${esc(h.bis)}" ${ro || !h.on ? 'disabled' : ''}><input class="inp !h-10 !px-2" inputmode="numeric" data-hour="${k}" data-k="pause" value="${esc(h.pause ?? '')}" ${ro || !h.on ? 'disabled' : ''}><span class="text-[13px] text-ink3 mono text-right">${h.on ? hm(tplSoll(k === 0 ? '2026-11-15' : addDays('2026-11-09', k - 1))) : '–'}</span></div>`; }).join('')}</div>
      <div class="kpi mt-3 flex justify-between text-[14px]"><span>Wochen-Soll</span><b>${hm(weekTarget())} Std.</b></div>
      <p class="hint">Pause = Mindestpause in Minuten, die an diesem Tag immer abgezogen wird (längere Pausen voll).</p><div class="grid sm:grid-cols-2 gap-4 mt-6"><div class="kpi"><div class="text-[12px] text-ink3">Feiertage nach Firmensitz</div><div class="text-[15px] font-semibold mt-1">${esc((STATES.find(x => x[0] === firmState()) || ['', firmState()])[1])}</div><div class="text-[12px] text-ink3 mt-0.5">${esc(FIRMA.firmensitz ? `${FIRMA.firmensitz.name}, ${FIRMA.firmensitz.ort}` : '')}</div></div></div>
      <label class="flex items-center gap-2.5 text-[14px] text-ink2 mt-4"><input type="checkbox" data-a="over6" ${S.pauseOnlyOver6 ? 'checked' : ''} ${ro ? 'disabled' : ''}>Mindestpause nur bei mehr als 6 Std. Arbeit abziehen</label>
      <h3 class="font-semibold mt-7 mb-1">Heiligabend und Silvester</h3><p class="text-ink3 text-[14px] mb-3">Halber Tag = halbe Sollzeit und ½ Urlaubstag (auch im Betriebsurlaub). Frei = arbeitsfrei, zählt nicht als Urlaub.</p>
      <div class="space-y-2">${HALF_DAYS.map(([k, l]) => `<div class="flex flex-wrap items-center gap-2"><span class="text-[14px] w-44">${l}</span><div class="seg">${[['halb', 'Halber Tag'], ['voll', 'Ganzer Tag'], ['frei', 'Frei']].map(([v, t]) => `<button class="${((S.halfDays || {})[k] || 'voll') === v ? 'on' : ''}" data-a="half-day" data-k="${k}" data-v="${v}" ${ro ? 'disabled' : ''}>${t}</button>`).join('')}</div></div>`).join('')}</div>`;
    case 'konten': { const v = vacation(); return `${lockNote}<h3 class="font-semibold mb-3">Urlaub ${tNow().getFullYear()}</h3><div class="grid grid-cols-2 gap-4">${sIn('person.start', 'Eintrittsdatum (hier angefangen am)', '', 'date', ro)}${sIn('vacation.perYear', 'Urlaubstage pro Jahr (laut Vertrag)', '30', 'number', ro)}</div>
      <div class="mt-4"><span class="lbl">Berechnung im Eintrittsjahr</span><div class="seg">${[['anteilig', 'Anteilig (1/12 je Monat)'], ['gesetz', 'Gesetzlich (BUrlG)']].map(([k, l]) => `<button class="${(S.vacation.rule || 'anteilig') === k ? 'on' : ''}" data-a="vac-rule" data-v="${k}" ${ro ? 'disabled' : ''}>${l}</button>`).join('')}</div></div>
      <div class="grid grid-cols-2 gap-4 mt-4"><label class="block"><span class="lbl">Anspruch ${tNow().getFullYear()} (automatisch: ${v.ent.auto} Tage)</span><input class="inp" data-vman type="number" inputmode="decimal" value="${v.ent.manual ? esc(v.ent.days) : ''}" placeholder="automatisch" ${ro ? 'disabled' : ''}></label>${sIn('vacation.carry', 'Resturlaub Vorjahr', '0', 'number', ro)}</div>
      ${v.ent.why ? `<p class="hint">${esc(v.ent.why)}${v.ent.manual ? ' · von Hand angepasst' : ''}</p>` : ''}<p class="hint">Genommen: ${fmtDays(v.taken)} · Geplant: ${fmtDays(v.planned)} · Übrig: ${fmtDays(v.left)} Tage (nur Arbeitstage, ohne Wochenende und Feiertage)${v.sonder ? ` · Sonderurlaub: ${v.sonder} ${v.sonder === 1 ? 'Tag' : 'Tage'} (zählt nicht zum Urlaub)` : ''}</p>
      <h3 class="font-semibold mt-7 mb-2">Betriebsurlaub</h3><a href="#/einstellungen/bu" class="kpi flex items-center gap-3 text-[14px]"><span style="color:#C7792F">${ic('cal', 17)}</span><span class="flex-1">${firmBu().map(b => `${esc(b.name || 'Betriebsurlaub')}: ${deDate(b.von)} – ${deDate(b.bis)}`).join(' · ') || 'Kein Betriebsurlaub eingetragen'}</span><span class="text-p font-semibold">Ändern →</span></a>
      <h3 class="font-semibold mt-7 mb-3">Überstundenkonto</h3><div class="grid grid-cols-2 gap-4">${sIn('balance.from', 'Zählt ab', '', 'date', ro)}<label class="block"><span class="lbl">Startwert Überstunden (Std:Min, z. B. 12:30)</span><input class="inp" data-bal value="${esc(hm(S.balance.min || 0))}" ${ro ? 'disabled' : ''}></label></div><p class="hint">Aktuell: <b>${overTxt(balance())}</b>${account().minus ? ` · Minusstunden: ${hm(account().minus)}` : ''}. Fehlende Stunden werden zuerst von den Überstunden abgezogen, der Rest als Minusstunden ausgewiesen.</p>
      <button class="btn-p mt-4" data-a="konto-edit">${ic('edit', 16)}Bestand einpflegen</button>
      ${(S.kontoLog || []).length ? `<h3 class="font-semibold mt-7 mb-2">Änderungsprotokoll</h3><div class="space-y-1">${S.kontoLog.slice().reverse().slice(0, 15).map(l => `<div class="text-[12px] text-ink3"><b class="text-ink2">${new Date(l.at).toLocaleString('de-DE')}</b> · ${esc(l.what)}</div>`).join('')}</div>` : ''}`; }
    case 'firma': return `<div class="grid sm:grid-cols-2 gap-4">${sIn('company.name', 'Firmenname')}${sIn('company.phone', 'Telefon')}${sIn('company.street', 'Straße')}${sIn('company.city', 'PLZ und Ort')}</div>
      <div class="mt-6"><span class="lbl">Logo (App und PDF)</span><div class="flex flex-wrap items-center gap-3">${S.company.logo ? `<span class="rounded-[var(--rb)] bg-white p-3 border border-line"><img src="${esc(S.company.logo)}" class="h-14" alt=""></span>` : '<span class="text-ink3 text-[14px]">Kein Logo</span>'}
        <label class="btn-s cursor-pointer">${ic('upload', 16)}Logo wählen<input type="file" accept="image/*" class="hidden" data-logo></label>${S.company.logo !== 'logo.png' ? '<button class="btn-g" data-a="logo-reset">Standard-Logo</button>' : ''}</div></div>`;
    case 'design': return `<div><span class="lbl">Ansicht</span><div class="seg">${[['system', 'Wie Gerät'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([k, l]) => `<button class="${S.design.mode === k ? 'on' : ''}" data-a="mode" data-v="${k}">${l}</button>`).join('')}</div></div>
      <div class="grid grid-cols-2 gap-4 mt-6">${[['primary', 'Hauptfarbe'], ['secondary', 'Akzentfarbe']].map(([k, l]) => `<label class="block"><span class="lbl">${l}</span><div class="flex items-center gap-2"><input type="color" class="w-12 h-11 rounded-[var(--rb)] border border-line2 bg-field p-1" data-s="design.${k}" value="${esc(S.design[k])}"><span class="mono text-[13px] text-ink3">${esc(S.design[k])}</span></div></label>`).join('')}</div>
      <label class="block mt-6"><span class="lbl">Ecken-Rundung: ${S.design.radius} px</span><input type="range" min="4" max="24" step="1" class="w-full" data-s="design.radius" value="${S.design.radius}"></label>
      <button class="btn-g mt-6" data-a="design-reset">${ic('refresh', 15)}Design zurücksetzen</button>`;
    case 'admin': return DEVICE.admin ? `<div class="rounded-[var(--rb)] p-4 text-[14px] flex items-center gap-3" style="background:var(--p-light)"><span class="text-p">${ic('check', 20, 2.4)}</span><span class="flex-1">Dieses Gerät ist ein <b>Admin-Gerät</b>: Nachtragen und Korrigieren ohne erneute Abfrage. Alle Änderungen werden protokolliert.</span></div>
      <button class="btn-s mt-4" data-a="admin-off">${ic('x', 16)}Admin-Gerät beenden</button>
      <h3 class="font-semibold mt-8 mb-3">Admin-Passwort ändern</h3><div class="grid sm:grid-cols-2 gap-3"><input type="password" class="inp" id="pw-new1" placeholder="Neues Passwort" autocomplete="new-password"><input type="password" class="inp" id="pw-new2" placeholder="Wiederholen" autocomplete="new-password"></div><button class="btn-s mt-3" data-a="pw-change">Passwort ändern</button><p class="hint">Gilt für dieses Gerät und für Sicherungen, die von hier eingespielt werden.</p>`
      : `<p class="text-ink3 text-[14px] mb-4">Nur für Manuel, Artjom und Jule: Mit dem Admin-Passwort wird dieses Gerät dauerhaft zum Admin-Gerät – dort lässt sich ohne erneute Abfrage nachtragen und korrigieren. Auf Mitarbeiter-Geräten wird bei jeder Änderung neu gefragt.</p>
      <div class="flex flex-col sm:flex-row gap-2 max-w-md"><input type="password" class="inp" id="pw-admin" placeholder="Admin-Passwort" autocomplete="current-password"><button class="btn-p shrink-0" data-a="admin-on">Als Admin-Gerät freischalten</button></div>`;
    case 'daten': return `<div class="rounded-[var(--r)] p-4 mb-6" style="background:var(--p-light)"><div class="flex items-center gap-2 font-semibold">${ic('check', 17, 2.4)}Datenschutz</div><p class="text-[14px] text-ink2 mt-2">Deine Zeiten, dein Urlaub und deine Baustellen liegen <b>nur auf deinem Handy</b>. Es gibt keinen gemeinsamen Server – Kollegen sehen nichts davon. Ins Büro geht nur, was du selbst als PDF an ${esc(S.recipient.name || 'das Büro')} schickst.</p></div>
      <h3 class="font-semibold mb-2">App-PIN</h3><p class="text-ink3 text-[14px] mb-3">Schützt die App, falls das Handy verloren geht oder jemand anderes es benutzt. Beim Öffnen wird die PIN abgefragt.</p>
      ${S.pin ? `<div class="flex flex-wrap gap-2"><span class="badge bg-tgrn text-p !h-9 !px-3">${ic('check', 14, 2.4)}PIN aktiv</span><button class="btn-s !h-9" data-a="pin-off">PIN entfernen</button></div>` : `<div class="flex flex-col sm:flex-row gap-2 max-w-md"><input class="inp" id="pin-new" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="4–8 Ziffern" style="-webkit-text-security:disc"><button class="btn-s shrink-0" data-a="pin-set">PIN festlegen</button></div>`}
      <h3 class="font-semibold mt-8 mb-2">Sicherung</h3><p class="text-ink3 text-[14px] mb-4">Alle Daten liegen nur auf diesem Gerät. Bitte regelmäßig eine Sicherung speichern – damit lassen sich die Zeiten auch auf ein neues Handy übertragen.</p>
      <div class="flex flex-wrap gap-2"><button class="btn-p" data-a="backup">${ic('download', 16)}Sicherung speichern</button><label class="btn-s cursor-pointer ${canEdit() ? '' : 'opacity-40 pointer-events-none'}">${ic('upload', 16)}Sicherung einspielen<input type="file" accept="application/json,.json" class="hidden" data-restore ${canEdit() ? '' : 'disabled'}></label></div>
      ${canEdit() ? '' : '<p class="hint">Einspielen nur mit Admin-Freischaltung.</p>'}
      <div class="kpi mt-5 text-[14px]">${Object.keys(DAYS).length} Tage gespeichert</div><p class="hint mt-6">Version ${APP_VERSION}</p>`;
  }
  return '';
}
function viewSettings() {
  return `<section class="pt-8 sm:pt-12"><h1 class="h-font text-[38px] sm:text-[48px] leading-none">Einstellungen</h1>
    <div class="flex flex-col md:flex-row gap-5 mt-6"><nav class="flex md:flex-col gap-1 overflow-x-auto no-scrollbar md:w-56 shrink-0">${SET_TABS.map(([k, l, i]) => `<a href="#/einstellungen/${k}" class="navl ${UI.tab === k ? 'on' : ''} md:w-full">${ic(i, 16)}${l}${LOCKED_TABS.includes(k) && !canEdit() ? `<span class="ml-auto text-ink3 hidden md:inline">${ic('alert', 13)}</span>` : ''}</a>`).join('')}</nav>
    <div class="card p-5 sm:p-7 flex-1 min-w-0"><h2 class="sec-t mb-5">${SET_TABS.find(t => t[0] === UI.tab)[1]}</h2>${setBody()}</div></div></section>`;
}

/* ---------- Rendern und Navigation ---------- */
function render() {
  const inner = UI.route === 'week' ? viewWeek() : UI.route === 'urlaub' ? viewUrlaub() : UI.route === 'settings' ? viewSettings() : viewHome();
  $('#app').innerHTML = shell(inner);
}
function route() {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  if (h[0] === 'woche') { UI.route = 'week'; UI.mon = h[1] && /^\d{4}-\d\d-\d\d$/.test(h[1]) ? mondayOf(h[1]) : mondayOf(isoToday()); }
  else if (h[0] === 'urlaub') UI.route = 'urlaub';
  else if (h[0] === 'einstellungen') { UI.route = 'settings'; UI.tab = SET_TABS.some(t => t[0] === h[1]) ? h[1] : 'person'; }
  else UI.route = 'home';
  render(); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
const rerender = () => { const y = window.scrollY; render(); window.scrollTo(0, y); };

/* =========================================================
   Ereignisse
   ========================================================= */
const todayDay = () => clone(dayOf(isoToday()));
function geoStamp(iso, kind) {
  if (!S.gps || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async pos => { const d = clone(dayOf(iso)); (d.geo = d.geo || []).push({ k: kind, t: nowHM(), lat: +pos.coords.latitude.toFixed(5), lon: +pos.coords.longitude.toFixed(5), acc: Math.round(pos.coords.accuracy) }); await saveDay(d); }, () => {}, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
}
/* Große Einblendung, verschwindet von selbst */
function cheer(title, sub, icon) {
  const el = document.createElement('div');
  el.className = 'fixed inset-0 z-[95] grid place-items-center p-6 cheer'; el.style.cssText = 'background:rgba(0,0,0,.35);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)';
  el.innerHTML = `<div class="card px-8 py-9 text-center max-w-sm w-full" style="animation:chIn .45s cubic-bezier(.2,1.4,.4,1) both"><div class="w-20 h-20 rounded-full grid place-items-center mx-auto" style="background:rgb(var(--s-rgb)/.2);color:rgb(var(--s-rgb))">${ic(icon, 40, 1.8)}</div><div class="h-font text-[38px] leading-tight mt-5">${esc(title)}</div><div class="text-ink2 text-[16px] mt-2">${esc(sub)}</div></div>`;
  document.body.appendChild(el); const close = () => { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 420); };
  el.onclick = close; setTimeout(close, 2800);
}
document.head.insertAdjacentHTML('beforeend', '<style>@keyframes chIn{from{opacity:0;transform:scale(.7) translateY(20px)}to{opacity:1;transform:none}}</style>');
const isFriday = () => tNow().getDay() === 5;
/* ---------- Standort (Pflicht beim Stempeln) ---------- */
let GEO_STATE = 'unknown';   // granted | denied | prompt | unknown
function getPos(timeout = 12000) {
  return new Promise(res => {
    if (!navigator.geolocation) return res({ err: 'unsupported' });
    navigator.geolocation.getCurrentPosition(p => { GEO_STATE = 'granted'; res({ lat: +p.coords.latitude.toFixed(5), lon: +p.coords.longitude.toFixed(5), acc: Math.round(p.coords.accuracy) }); },
      e => { if (e.code === 1) GEO_STATE = 'denied'; res({ err: e.code === 1 ? 'denied' : e.code === 3 ? 'timeout' : 'unavailable' }); },
      { enableHighAccuracy: true, timeout, maximumAge: 30000 });
  });
}
async function checkGeoPerm() { try { if (navigator.permissions) { const st = await navigator.permissions.query({ name: 'geolocation' }); GEO_STATE = st.state; st.onchange = () => { GEO_STATE = st.state; if (UI.route === 'home') rerender(); }; } } catch (e) {} }
function geoHelp() {
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  return `<div class="text-[14px] text-ink2 space-y-1.5 text-left">${ios
    ? '<div><b>iPhone/iPad:</b> Einstellungen → Datenschutz &amp; Sicherheit → Ortungsdienste einschalten → <b>Safari-Websites</b> → „Beim Verwenden der App“ und „Genauer Standort“ an.</div><div>Danach die Stempeluhr schließen und neu öffnen, beim Stempeln „Erlauben“ tippen.</div>'
    : '<div><b>Android (Chrome):</b> in der Adresszeile bzw. im App-Menü auf das Schloss/„Website-Einstellungen“ → <b>Standort: Zulassen</b>.</div><div>Außerdem in den Handy-Einstellungen den Standort einschalten.</div>'}</div>`;
}
function geoBlockedModal() {
  modal(`<div class="text-center"><div class="w-14 h-14 rounded-full grid place-items-center mx-auto" style="background:var(--t-red);color:var(--red-ink)">${ic('pin', 26)}</div><div class="font-semibold text-[19px] mt-4">Standort erforderlich</div><p class="text-ink3 text-[14px] mt-1">Ohne Standortfreigabe kann nicht gestempelt werden.</p></div><div class="rounded-[var(--rb)] bg-raised p-4 mt-5">${geoHelp()}</div><button class="btn-p w-full mt-4" data-a="geo-retry">${ic('refresh', 16)}Erneut prüfen</button>`);
}
function consentModal() {
  return new Promise(res => {
    modal(`<div class="text-center"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('pin', 26)}</div><div class="font-semibold text-[19px] mt-4">Hinweis zum Standort</div></div>
      <div class="text-[14px] text-ink2 mt-4 space-y-2"><p>Beim <b>Kommen, bei Pausen und beim Gehen</b> speichert die Stempeluhr einmalig deinen Standort – nicht dauerhaft und nicht im Hintergrund.</p><p>Der Standort liegt auf deinem Handy und erscheint in deinem Stundenzettel, den du an ${esc(S.recipient.name || 'das Büro')} schickst. Ohne Standortfreigabe ist Stempeln nicht möglich.</p></div>
      <button class="btn-p w-full mt-5" id="cs-ok">${ic('check', 16)}Verstanden und einverstanden</button>`);
    $('#cs-ok').onclick = () => { S.gpsConsent = tNow().toISOString(); saveSettings(); closeModal(); res(true); };
  });
}

/* ---------- Kartenausschnitt und Adresse zum Stempel ----------
   Karte: OpenStreetMap (© OpenStreetMap-Mitwirkende), Adresse: Photon/Nominatim. Blauer Punkt wie in Apple Karten. */
async function geoAddr(lat, lon) {
  try {
    const j = await (await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&lang=de`)).json(), p = (j.features[0] || {}).properties || {};
    const a = [[p.street || p.name, p.housenumber].filter(Boolean).join(' '), [p.postcode, p.city || p.town || p.village || p.district].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    if (a) return a;
  } catch (e) {}
  try {
    const j = await (await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&accept-language=de`)).json(), a = j.address || {};
    return [[a.road, a.house_number].filter(Boolean).join(' '), [a.postcode, a.city || a.town || a.village].filter(Boolean).join(' ')].filter(Boolean).join(', ') || j.display_name || '';
  } catch (e) { return ''; }
}
async function geoMap(lat, lon, acc) {
  const z = 17, W = 480, H = 300, n = 2 ** z, rad = lat * Math.PI / 180;
  const px = (lon + 180) / 360 * n * 256, py = (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * n * 256, x0 = px - W / 2, y0 = py - H / 2;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = '#e8eef0'; x.fillRect(0, 0, W, H);
  const jobs = [];
  for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x0 + W) / 256); tx++) for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y0 + H) / 256); ty++)
    jobs.push(new Promise(res => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { x.drawImage(im, tx * 256 - x0, ty * 256 - y0); res(true); }; im.onerror = () => res(false); im.src = `https://tile.openstreetmap.org/${z}/${tx}/${ty}.png`; }));
  const ok = (await Promise.all(jobs)).some(Boolean); if (!ok) return '';
  const mpp = 156543.03 * Math.cos(rad) / n, r = Math.max(14, Math.min(120, (acc || 10) / mpp)), cx = W / 2, cy = H / 2;
  x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = 'rgba(10,132,255,.16)'; x.fill(); x.strokeStyle = 'rgba(10,132,255,.45)'; x.lineWidth = 1.5; x.stroke();
  x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 6; x.beginPath(); x.arc(cx, cy, 11, 0, 7); x.fillStyle = '#fff'; x.fill(); x.restore();
  x.beginPath(); x.arc(cx, cy, 8, 0, 7); x.fillStyle = '#0A84FF'; x.fill();
  x.font = '11px system-ui,sans-serif'; const t = '© OpenStreetMap', w = x.measureText(t).width + 8; x.fillStyle = 'rgba(255,255,255,.8)'; x.fillRect(W - w, H - 16, w, 16); x.fillStyle = '#333'; x.fillText(t, W - w + 4, H - 4.5);
  try { return c.toDataURL('image/jpeg', 0.82); } catch (e) { return ''; }
}
async function enrichGeo(iso, idx) {
  const g0 = (dayOf(iso).geo || [])[idx]; if (!g0 || !g0.lat) return;
  const [addr, map] = await Promise.all([geoAddr(g0.lat, g0.lon), geoMap(g0.lat, g0.lon, g0.acc)]);
  const d = clone(dayOf(iso)), g = d.geo[idx]; if (!g) return; if (addr) g.addr = addr; if (map) g.map = map; await saveDay(d); if (UI.route !== 'settings') rerender();
}

let STAMPING = false;
async function stamp(kind) {
  if (STAMPING) return; STAMPING = true;
  try { await stampInner(kind); } finally { STAMPING = false; }
}
async function stampInner(kind) {
  if (!S.gpsConsent && !(await consentModal())) return;
  const [ok, pos] = await Promise.all([syncTime(2500), getPos()]);
  if (pos.err === 'denied' || pos.err === 'unsupported') { rerender(); return geoBlockedModal(); }
  const d = todayDay(), t = nowHM(), seg = curSeg(d), op = openPause(d);
  const geo = pos.err ? { k: kind, t, err: 'Standort nicht ermittelbar' } : { k: kind, t, ...pos }; (d.geo = d.geo || []).push(geo); const gi = d.geo.length - 1; setTimeout(() => enrichGeo(d.iso, gi), 300); if (pos.err) toast('Standort gerade nicht ermittelbar – Stempel wird trotzdem gespeichert und vermerkt.', 'warn', 4500);
  if (!ok) { d.offline = (d.offline || []).concat(`${kind === 'in' ? 'Kommen' : kind === 'out' ? 'Gehen' : 'Pause'} ${t}`); toast('Kein Internet – Uhrzeit des Handys verwendet, Eintrag wird als „offline“ markiert.', 'warn', 5000); }
  d.segs = d.segs || []; d.pauses = d.pauses || [];
  if (kind === 'in') {
    if (seg) return;
    if (d.type !== 'work') d.type = 'work';
    const site = ($('#site') || {}).value ? $('#site').value.trim() : ''; rememberSite(site);
    const first = !d.segs.length; d.segs.push({ site, von: t, bis: '' }); toast(`Gekommen um ${t} Uhr${site ? ' · ' + site : ''}`);
    if (isFriday() && first) cheer('Bald geschafft!', 'Letzter Tag der Woche – gib Gas! 💪'.replace(' 💪', ''), 'sun');
  } else if (kind === 'pause') {
    if (!seg) return;
    if (op) { op.bis = t; toast(`Pause beendet um ${t} Uhr`); } else { d.pauses.push({ von: t, bis: '' }); toast(`Pause ab ${t} Uhr`); }
  } else if (kind === 'out') {
    if (!seg) return; if (op) op.bis = t; seg.bis = t;
    await saveDay(d); const c = calcDay(d); toast(`Gegangen um ${t} Uhr · heute ${hm(c.netto)} Std.`, 'ok', 4500); rerender();
    if (isFriday()) { const w = weekStat(mondayOf(d.iso)); cheer('Geschafft!', `Schönes Wochenende!${w.over ? ` Diese Woche +${hm(w.over)} Überstunden.` : ''}${SENT[mondayOf(d.iso)] ? '' : ` Denk an den Stundenzettel für ${S.recipient.name || 'das Büro'}.`}`, 'check'); }
    return;
  }
  await saveDay(d); rerender();
}
function switchDialog() {
  modal(`<h3 class="text-[20px] font-semibold pr-8">Baustelle wechseln</h3><p class="text-ink3 text-[14px] mt-1">Die Zeit bis jetzt bleibt bei der bisherigen Baustelle.</p>
    <label class="block mt-5"><span class="lbl">Neue Baustelle</span><input class="inp" id="site2" list="dl-sites" placeholder="z. B. Schulz, Osnabrück" autocomplete="off"></label>${siteChips('site2')}
    <button class="btn-p w-full mt-5" data-a="switch-ok">${ic('refresh', 16)}Jetzt wechseln</button>`);
}
async function doSwitch() {
  const site = $('#site2').value.trim(); if (!site) { toast('Bitte eine Baustelle angeben.', 'warn'); return; }
  await syncTime(2500); const d = todayDay(), t = nowHM(), seg = curSeg(d), op = openPause(d); if (!seg) return closeModal();
  if (op) op.bis = t; seg.bis = t; d.segs.push({ site, von: t, bis: '' }); rememberSite(site);
  await saveDay(d); closeModal(); toast(`Ab ${t} Uhr: ${site}`); rerender();
}

/* ---------- Freischalten (ohne „Passwort speichern?“) ----------
   Kein <form>, kein type=password: Browser bieten dann kein Speichern an. */
function unlockDialog() {
  return new Promise(res => {
    modal(`<h3 class="text-[20px] font-semibold pr-8">Admin-Freigabe</h3><p class="text-ink3 text-[14px] mt-1">Nachträgliche Änderungen nur mit Admin-Passwort. Jede Änderung wird protokolliert.</p>
      <input class="inp mt-5" id="unl-pw" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" data-lpignore="true" data-1p-ignore name="x-${Date.now()}" placeholder="Passwort" style="-webkit-text-security:disc;text-security:disc">
      <button class="btn-p w-full mt-4" id="unl-ok">Freischalten</button><p class="hint text-center">Gilt 10 Minuten auf diesem Gerät.</p>`);
    const go = async () => { const pw = $('#unl-pw').value; if (!pw) return; if (await checkAdmin(pw)) { UI.editUntil = Date.now() + 10 * 60000; closeModal(); toast('Freigeschaltet für 10 Minuten.'); res(true); } else { toast('Passwort falsch.', 'err'); $('#unl-pw').value = ''; } };
    $('#unl-ok').onclick = go; $('#unl-pw').onkeydown = e => { if (e.key === 'Enter') go(); };
    setTimeout(() => { const el = $('#unl-pw'); if (el) el.focus(); }, 60);
  });
}
async function needEdit() { if (canEdit()) return true; return unlockDialog(); }
/* Änderung protokollieren: was, alter und neuer Wert, wann, auf welchem Gerät */
function logChange(d, what, from, to) { if ((from ?? '') === (to ?? '') && what !== 'Zeitraum hinzugefügt') return; (d.log = d.log || []).push({ at: tNow().toISOString(), what, from: from ?? '', to: to ?? '', admin: DEVICE.admin ? 'Admin-Gerät' : 'Passwort' }); d.edited = true; }

document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a]'); if (!a) return;
  const act = a.dataset.a, iso = a.dataset.iso;
  switch (act) {
    case 'in': case 'pause': case 'out': stamp(act); break;
    case 'geo-retry': { closeModal(); const p = await getPos(); if (p.err === 'denied') geoBlockedModal(); else { toast(p.err ? 'Standort noch nicht ermittelbar – bitte draußen erneut versuchen.' : 'Standort freigegeben.', p.err ? 'warn' : 'ok'); rerender(); } break; }
    case 'geo-ask': { if (!S.gpsConsent && !(await consentModal())) return; const p = await getPos(); if (p.err === 'denied') geoBlockedModal(); else rerender(); break; }
    case 'vac-today': { if (!(await confirmDlg('Heute Urlaub?', `${WD[tNow().getDay()]}, ${deDate(isoToday())} wird als Urlaubstag eingetragen (Resturlaub danach: ${fmtDays(vacation().left - dayFactor(isoToday()))} Tage).`, 'Urlaub eintragen'))) return; const d = todayDay(); logChange(d, 'Art des Tages', typeName(d.type), 'Urlaub'); d.edited = false; d.type = 'urlaub'; await saveDay(d); toast('Heute ist Urlaub eingetragen. Schönen freien Tag!'); rerender(); break; }
    case 'vac-undo': { const d = todayDay(); logChange(d, 'Art des Tages', 'Urlaub', 'Arbeit'); d.edited = false; d.type = 'work'; await saveDay(d); rerender(); break; }
    case 'vac-set': await setVacation(); break;
    case 'sick-today': { if (!(await confirmDlg('Heute krank?', `${WD[tNow().getDay()]}, ${deDate(isoToday())} wird als Krankheitstag eingetragen.`, 'Krank eintragen'))) return; const d = todayDay(); logChange(d, 'Art des Tages', typeName(d.type), 'Krank'); d.edited = false; d.type = 'krank'; await saveDay(d); rerender(); tellSick(); break; }
    case 'sick-undo': { const d = todayDay(); logChange(d, 'Art des Tages', 'Krank', 'Arbeit'); d.edited = false; d.type = 'work'; await saveDay(d); rerender(); break; }
    case 'sick-tell': tellSick(); break;
    case 'ics': icsReminder(); break;
    case 'konto-edit': if (await needEdit()) kontoDialog(); break;
    case 'konto-save': kontoSave(); break;
    case 'cal': UI.calM = a.dataset.v; rerender(); break;
    case 'bu-add': { if (!(await needEdit())) return; const von = $('#bu-von').value, bis = $('#bu-bis').value; if (!von || !bis || bis < von) return toast('Bitte Von und Bis angeben.', 'warn'); S.bu = (S.bu || []).concat({ name: $('#bu-name').value.trim() || 'Betriebsurlaub', von, bis, abzug: $('#bu-abzug').checked }); saveSettings(); toast('Betriebsurlaub eingetragen.'); rerender(); break; }
    case 'bu-del': { if (!(await needEdit())) return; S.bu.splice(+a.dataset.i, 1); saveSettings(); rerender(); break; }
    case 'pin-set': { const v = $('#pin-new').value.trim(); if (!/^\d{4,8}$/.test(v)) return toast('Bitte 4 bis 8 Ziffern.', 'warn'); const salt = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join(''); S.pin = { salt, hash: await pbkdf2(v, salt, 60000) }; saveSettings(); toast('PIN festgelegt.'); rerender(); break; }
    case 'pin-off': { if (!(await pinCheck('Zum Entfernen bitte die PIN eingeben'))) return; S.pin = null; saveSettings(); rerender(); break; }
    case 'vac-submit': await submitVacation(); break;
    case 'vac-del': { const past = a.dataset.von < isoToday(); if (past && !(await needEdit())) return; if (!(await confirmDlg('Urlaub entfernen?', `${deDate(a.dataset.von)} – ${deDate(a.dataset.bis)} wird wieder zu Arbeitstagen.`, 'Entfernen', true))) return; for (let i = a.dataset.von; i <= a.dataset.bis; i = addDays(i, 1)) { const d = clone(dayOf(i)); if (d.type !== 'urlaub') continue; logChange(d, 'Art des Tages', 'Urlaub', 'Arbeit'); if (i >= isoToday()) d.edited = !!(d.log || []).some(x => x.what !== 'Art des Tages'); d.type = 'work'; await saveDay(d); } rerender(); break; }
    case 'switch': { const v = ($('#site') || {}).value; if (v && v.trim()) { $('#site').id = 'site2'; return doSwitch(); } switchDialog(); break; }
    case 'switch-ok': doSwitch(); break;
    case 'site-pick': { const el = $('#' + a.dataset.t); if (el) el.value = a.dataset.v; break; }
    case 'send-week': sendPdf('week', a.dataset.mon); break;
    case 'send-month': sendPdf('month', a.dataset.iso); break;
    case 'unlock': if (await unlockDialog()) rerender(); break;
    case 'lock': UI.editUntil = 0; UI.openDay = ''; rerender(); break;
    case 'ed-open': if (await needEdit()) { UI.openDay = iso; rerender(); } break;
    case 'ed-type': { if (!(await needEdit())) return; const d = clone(dayOf(iso)); logChange(d, 'Art des Tages', typeName(d.type), typeName(a.dataset.v)); d.type = a.dataset.v; await saveDay(d); rerender(); break; }
    case 'ed-seg-add': { if (!(await needEdit())) return; const d = clone(dayOf(iso)); d.segs = d.segs || []; const last = d.segs[d.segs.length - 1], h = S.hours[new Date(iso + 'T12:00').getDay()] || {}; d.segs.push({ site: last ? last.site : '', von: last && last.bis ? last.bis : h.von || '07:30', bis: d.segs.length ? '' : h.bis || '' }); logChange(d, 'Zeitraum hinzugefügt', '', ''); await saveDay(d); rerender(); break; }
    case 'ed-seg-del': { if (!(await needEdit())) return; const d = clone(dayOf(iso)), s = d.segs[+a.dataset.i]; logChange(d, 'Zeitraum gelöscht', `${s.site || ''} ${s.von}–${s.bis}`, ''); d.segs.splice(+a.dataset.i, 1); await saveDay(d); rerender(); break; }
    case 'ed-pz-add': { if (!(await needEdit())) return; const d = clone(dayOf(iso)); (d.pauses = d.pauses || []).push({ von: '12:00', bis: '12:30' }); logChange(d, 'Pause hinzugefügt', '', '12:00–12:30'); await saveDay(d); rerender(); break; }
    case 'ed-pz-del': { if (!(await needEdit())) return; const d = clone(dayOf(iso)), p = d.pauses[+a.dataset.i]; logChange(d, 'Pause gelöscht', `${p.von}–${p.bis}`, ''); d.pauses.splice(+a.dataset.i, 1); await saveDay(d); rerender(); break; }
    case 'ed-clear': { if (!(await needEdit())) return; if (!(await confirmDlg('Tag leeren?', `Alle Zeiten am ${deDate(iso)} werden entfernt.`, 'Leeren', true))) return; const d = clone(dayOf(iso)); logChange(d, 'Tag geleert', `${(d.segs || []).length} Zeiträume`, ''); d.segs = []; d.pauses = []; d.type = holiday(iso) ? 'feiertag' : 'work'; await saveDay(d); rerender(); break; }
    case 'gps': if (!canEdit()) { a.checked = S.gps; return; } S.gps = a.checked; saveSettings(); if (S.gps && navigator.geolocation) navigator.geolocation.getCurrentPosition(() => {}, () => toast('Standort ist nicht freigegeben.', 'warn')); break;
    case 'over6': if (!canEdit()) { a.checked = S.pauseOnlyOver6; return; } S.pauseOnlyOver6 = a.checked; saveSettings(); rerender(); break;
    case 'mode': S.design.mode = a.dataset.v; saveSettings(); applyTheme(); render(); break;
    case 'design-reset': S.design = clone(DEFAULTS.design); saveSettings(); applyTheme(); render(); break;
    case 'logo-reset': S.company.logo = 'logo.png'; saveSettings(); render(); break;
    case 'admin-on': { const pw = $('#pw-admin').value; if (await checkAdmin(pw)) { DEVICE.admin = true; await DB.put('kv', DEVICE, 'device'); toast('Dieses Gerät ist jetzt ein Admin-Gerät.'); render(); } else toast('Passwort falsch.', 'err'); break; }
    case 'admin-off': DEVICE.admin = false; await DB.put('kv', DEVICE, 'device'); UI.editUntil = 0; toast('Admin-Gerät beendet.'); render(); break;
    case 'pw-change': { const p1 = $('#pw-new1').value, p2 = $('#pw-new2').value; if (p1.length < 6) return toast('Mindestens 6 Zeichen.', 'warn'); if (p1 !== p2) return toast('Die Passwörter stimmen nicht überein.', 'warn'); await setAdminPassword(p1); toast('Admin-Passwort geändert.'); render(); break; }
    case 'backup': backup(); break;
  }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.vac) { UI['v' + el.dataset.vac[0].toUpperCase() + el.dataset.vac.slice(1)] = el.value; if (el.dataset.vac === 'von' && (!UI.vBis || UI.vBis < el.value)) UI.vBis = el.value; if (el.dataset.vac !== 'note') rerender(); return; }
  if (el.dataset.s) {
    const path = el.dataset.s.split('.'), last = path.pop(), obj = path.reduce((o, k) => o[k], S);
    obj[last] = el.type === 'number' || el.type === 'range' ? (el.value === '' ? '' : +el.value) : el.value; saveSettings();
    if (/^design\./.test(el.dataset.s)) { applyTheme(); if (el.type === 'color') el.nextElementSibling.textContent = el.value; if (el.type === 'range') el.closest('label').querySelector('.lbl').textContent = `Ecken-Rundung: ${el.value} px`; }
  }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset.note) { const d = clone(dayOf(el.dataset.note)); d.note = el.value; await saveDay(d); return; }
  if (el.dataset.ed) {
    const iso = el.dataset.ed, d = clone(dayOf(iso)), k = el.dataset.k;
    if (!canEdit()) { toast('Bitte zuerst freischalten.', 'warn'); return rerender(); }
    if (el.dataset.seg !== undefined) { const s = d.segs[+el.dataset.seg]; logChange(d, k === 'site' ? 'Baustelle' : k === 'von' ? 'Beginn' : 'Ende', s[k], el.value); s[k] = k === 'site' ? el.value.trim() : el.value; if (k === 'site') rememberSite(s.site); }
    if (el.dataset.pz !== undefined) { const p = d.pauses[+el.dataset.pz]; logChange(d, k === 'von' ? 'Pause von' : 'Pause bis', p[k], el.value); p[k] = el.value; }
    await saveDay(d); return rerender();
  }
  if (el.dataset.hour !== undefined) { if (!canEdit()) return rerender(); const h = S.hours[el.dataset.hour]; h[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value; if (h.on && !h.von) { h.von = '07:30'; h.bis = '16:30'; } saveSettings(); return rerender(); }
  if (el.dataset.bal !== undefined) { if (!canEdit()) return rerender(); const m = /^\s*([−-])?\s*(\d+)(?::(\d{1,2}))?\s*$/.exec(el.value); if (!m) { toast('Bitte als Std:Min eingeben, z. B. 12:30', 'warn'); return; } S.balance.min = (m[1] ? -1 : 1) * (+m[2] * 60 + (+m[3] || 0)); saveSettings(); return rerender(); }
  if (el.dataset.s && (el.tagName === 'SELECT' || ['minPause', 'vacation.perYear', 'vacation.carry', 'balance.from', 'person.start'].includes(el.dataset.s))) { if (LOCKED_TABS.includes(UI.tab) && !canEdit()) return rerender(); return rerender(); }
  if (el.matches('[data-logo]') && el.files && el.files[0]) { const im = await shrinkImage(el.files[0], 700, 0.92, 'image/png'); S.company.logo = im.data; saveSettings(); render(); toast('Logo gespeichert.'); return; }
  if (el.matches('[data-restore]') && el.files && el.files[0]) restore(el.files[0]);
});

/* ---------- Bestand einpflegen (nur mit Admin-Passwort) ---------- */
function kontoDialog() {
  const y = tNow().getFullYear(), v = S.vacation, b = S.balance;
  modal(`<h3 class="text-[20px] font-semibold pr-8">Bestand einpflegen</h3><p class="text-ink3 text-[14px] mt-1">Für ${esc(S.person.name || 'diesen Mitarbeiter')}. Alle Änderungen werden protokolliert.</p>
    <div class="space-y-4 mt-5">
      <div class="rounded-[var(--r)] border border-line2 p-4"><div class="font-semibold text-[15px] mb-3">Überstunden</div><div class="grid grid-cols-2 gap-3">
        <label class="block"><span class="lbl">Bestand (Std:Min)</span><input class="inp" id="k-over" inputmode="text" value="${esc(hm(b.min || 0))}" placeholder="z. B. 12:30"></label>
        <label class="block"><span class="lbl">Stand zum Montag</span><input class="inp" type="date" id="k-from" value="${esc(b.from || mondayOf(isoToday()))}"></label></div>
        <p class="hint">Ab diesem Montag rechnet die App weiter (vorherige Wochen zählen nicht mehr).</p></div>
      <div class="rounded-[var(--r)] border border-line2 p-4"><div class="font-semibold text-[15px] mb-3">Urlaub ${y}</div><div class="grid grid-cols-3 gap-3">
        <label class="block"><span class="lbl">Anspruch / Jahr</span><input class="inp" id="k-per" inputmode="numeric" value="${esc(v.perYear)}"></label>
        <label class="block"><span class="lbl">Rest Vorjahr</span><input class="inp" id="k-carry" inputmode="numeric" value="${esc(v.carry)}"></label>
        <label class="block"><span class="lbl">schon genommen</span><input class="inp" id="k-taken" inputmode="numeric" value="${esc(+v.year === y ? v.takenBefore : 0)}"></label></div>
        <p class="hint">„Schon genommen“ = Urlaubstage ${y}, die nicht in der App eingetragen sind.</p></div>
    </div><button class="btn-p w-full mt-5" data-a="konto-save">${ic('check', 16)}Speichern</button>`, { wide: false });
}
function kontoSave() {
  const m = /^\s*(\d+)(?::(\d{1,2}))?\s*$/.exec($('#k-over').value); if (!m) return toast('Überstunden bitte als Std:Min eingeben, z. B. 12:30', 'warn');
  const over = +m[1] * 60 + (+m[2] || 0), from = $('#k-from').value || mondayOf(isoToday()), per = +$('#k-per').value || 0, carry = +$('#k-carry').value || 0, taken = +$('#k-taken').value || 0, y = tNow().getFullYear();
  const ch = [];
  if (over !== +S.balance.min || from !== S.balance.from) ch.push(`Überstunden-Bestand ${hm(S.balance.min || 0)} → ${hm(over)} (ab ${deDate(mondayOf(from))})`);
  if (per !== +S.vacation.perYear) ch.push(`Urlaubsanspruch ${S.vacation.perYear} → ${per}`);
  if (carry !== +S.vacation.carry) ch.push(`Resturlaub Vorjahr ${S.vacation.carry} → ${carry}`);
  if (taken !== (+S.vacation.year === y ? +S.vacation.takenBefore : 0)) ch.push(`schon genommen ${y}: ${taken} Tage`);
  S.balance = { from: mondayOf(from), min: over }; S.vacation = { ...S.vacation, perYear: per, carry, takenBefore: taken, year: y };
  if (ch.length) S.kontoLog = (S.kontoLog || []).concat({ at: tNow().toISOString(), what: ch.join(' · ') + (DEVICE.admin ? ' (Admin-Gerät)' : ' (Passwort)') });
  saveSettings(); closeModal(); toast(ch.length ? 'Bestand gespeichert.' : 'Keine Änderung.'); rerender();
}

/* ---------- Krank melden ---------- */
function tellSick() {
  const text = `Hallo ${S.recipient.name || ''}, ich bin heute (${WD[tNow().getDay()]}, ${deDate(isoToday())}) krank und kann nicht arbeiten. Die Krankmeldung reiche ich nach. Viele Grüße, ${S.person.name || ''}`;
  const phone = (S.recipient.phone || '').replace(/[^\d+]/g, '').replace(/^00/, '+').replace(/^0/, '+49').replace(/^\+/, '');
  modal(`<div class="text-center pt-2"><div class="w-14 h-14 rounded-full grid place-items-center mx-auto" style="background:var(--t-red);color:var(--red-ink)">${ic('heartp', 26)}</div><div class="font-semibold text-[19px] mt-4">Gute Besserung!</div><p class="text-ink3 text-[14px] mt-1">Heute ist als Krankheitstag eingetragen.</p></div>
    <div class="rounded-[var(--rb)] bg-raised p-3 text-[14px] mt-5">${esc(text)}</div>
    <div class="grid gap-2 mt-4">${navigator.share ? `<button class="btn-p !h-12" id="sick-share">${ic('send', 17)}${esc(S.recipient.name || 'Büro')} Bescheid geben (WhatsApp)</button>` : ''}<a class="${navigator.share ? 'btn-s' : 'btn-p !h-12'}" href="https://wa.me/${phone}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">${ic('send', 17)}WhatsApp öffnen</a><button class="btn-g" data-a="modal-close">Später</button></div>`);
  const b = $('#sick-share'); if (b) b.onclick = async () => { try { await navigator.share({ text }); closeModal(); } catch (e) {} };
}
/* Wiederkehrende Kalender-Erinnerung (jeden Freitag 13:30, Hinweis 0 Min. vorher) */
function icsReminder() {
  let d = tNow(); while (d.getDay() !== 5) d.setDate(d.getDate() + 1); const ymd = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`, stamp = tNow().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fruehauf//Stempeluhr//DE', 'BEGIN:VEVENT', `UID:stundenzettel-${Date.now()}@fruehauf`, `DTSTAMP:${stamp}`, `DTSTART;TZID=Europe/Berlin:${ymd}T133000`, `DTEND;TZID=Europe/Berlin:${ymd}T134500`, 'RRULE:FREQ=WEEKLY;BYDAY=FR', `SUMMARY:Stundenzettel an ${S.recipient.name || 'Büro'} senden`, 'DESCRIPTION:Stempeluhr öffnen → „Stundenzettel senden“.', 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Stundenzettel senden', 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  saveBlob(new Blob([ics], { type: 'text/calendar' }), 'Erinnerung-Stundenzettel.ics'); toast('Kalender-Datei gespeichert – zum Übernehmen öffnen.', 'ok', 4500);
}

/* ---------- Urlaub ---------- */
async function setVacation(silent) {
  const days = workDaysIn(UI.vVon || isoToday(), UI.vBis || UI.vVon || isoToday());
  if (!days.length) { toast('Im Zeitraum liegen keine Arbeitstage.', 'warn'); return false; }
  if (days.some(i => i < isoToday()) && !(await needEdit())) return false;
  for (const i of days) { const d = clone(dayOf(i)); if (hasData(d) && d.type === 'work' && (d.segs || []).length) continue; if (d.type !== 'urlaub') { logChange(d, 'Art des Tages', typeName(d.type), 'Urlaub'); if (i >= isoToday()) d.edited = false; d.type = 'urlaub'; if (UI.vNote) d.note = UI.vNote; await saveDay(d); } }
  if (!silent) { toast(`${fmtDays(vacDays(days))} Urlaubstag${vacDays(days) === 1 ? '' : 'e'} eingetragen.`); rerender(); }
  return true;
}
async function submitVacation() {
  if (!S.person.name) { toast('Bitte zuerst deinen Namen eintragen.', 'warn'); location.hash = '#/einstellungen/person'; return; }
  const von = UI.vVon || isoToday(), bis = UI.vBis || von, days = workDaysIn(von, bis);
  if (!days.length) return toast('Im Zeitraum liegen keine Arbeitstage.', 'warn');
  const before = vacation(+von.slice(0, 4));
  modal(`<div class="text-center py-6"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('file', 26)}</div><div class="font-semibold text-[18px] mt-4">Urlaubsantrag wird erstellt …</div></div>`);
  try {
    const left = before.left - days.filter(i => dayOf(i).type !== 'urlaub').length;
    const blob = await buildVacationPdf({ von, bis, n: vacDays(days), note: UI.vNote || '', leftBefore: before.left, leftAfter: left, total: before.total });
    const name = `Urlaubsantrag_${deDate(von).replace(/\./g, '-')}_bis_${deDate(bis).replace(/\./g, '-')}_${S.person.name.replace(/[^\wäöüÄÖÜß-]+/g, '_')}.pdf`;
    saveBlob(blob, name);
    UI.requests = (UI.requests || []).concat({ von, bis, n: vacDays(days), at: tNow().toISOString() }); await DB.put('kv', UI.requests, 'requests');
    await setVacation(true);
    shareModal(blob, name, `Hallo ${S.recipient.name || ''}, hiermit beantrage ich Urlaub vom ${deDate(von)} bis ${deDate(bis)} (${fmtDays(vacDays(days))} Urlaubstage). Viele Grüße, ${S.person.name}`, 'Urlaubsantrag gespeichert');
    render();
  } catch (err) { console.error(err); closeModal(); toast('PDF konnte nicht erstellt werden: ' + (err.message || err), 'err', 5000); }
}
function shareModal(blob, name, text, title) {
  const file = new File([blob], name, { type: 'application/pdf' }), canShare = navigator.canShare && navigator.canShare({ files: [file] });
  const phone = (S.recipient.phone || '').replace(/[^\d+]/g, '').replace(/^00/, '+').replace(/^0/, '+49').replace(/^\+/, '');
  modal(`<div class="text-center pt-2"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('check', 26, 2.4)}</div><div class="font-semibold text-[19px] mt-4">${esc(title)}</div><div class="text-[13px] text-ink3 mt-1 break-all">${esc(name)}</div></div>
    <div class="grid gap-2 mt-6">${canShare ? `<button class="btn-p !h-12" id="pdf-share">${ic('send', 17)}An ${esc(S.recipient.name || 'Büro')} senden (WhatsApp)</button><p class="hint text-center -mt-1">Im Teilen-Menü WhatsApp und dann ${esc(S.recipient.name || 'den Empfänger')} wählen.</p>` : `<a class="btn-p !h-12" href="https://wa.me/${phone}?text=${encodeURIComponent(text + ' (PDF folgt als Anhang)')}" target="_blank" rel="noopener">${ic('send', 17)}WhatsApp an ${esc(S.recipient.name || 'Büro')} öffnen</a><p class="hint text-center -mt-1">Dann das gespeicherte PDF im Chat anhängen.</p>`}
    <button class="btn-s" id="pdf-again">${ic('download', 17)}Nochmal speichern / öffnen</button><button class="btn-g" data-a="modal-close">Fertig</button></div>`);
  $('#pdf-again').onclick = () => saveBlob(blob, name);
  const b = $('#pdf-share'); if (b) b.onclick = async () => { try { await navigator.share({ files: [file], text, title: name }); closeModal(); } catch (err) { if (err && err.name !== 'AbortError') toast('Teilen nicht möglich – das PDF ist gespeichert.', 'warn'); } };
}

/* ---------- PDF speichern und senden ---------- */
function saveBlob(blob, name) { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
async function sendPdf(kind, iso) {
  if (!S.person.name) { toast('Bitte zuerst deinen Namen eintragen.', 'warn'); location.hash = '#/einstellungen/person'; return; }
  modal(`<div class="text-center py-6"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('file', 26)}</div><div class="font-semibold text-[18px] mt-4">Stundenzettel wird erstellt …</div></div>`);
  try {
    const isos = kind === 'week' ? weekOf(iso) : monthOf(iso), wk = isoWeek(isos[0]), mo = MONTHS[+isos[0].slice(5, 7) - 1];
    const label = kind === 'week' ? `KW ${wk.w}/${wk.y}` : `${mo} ${isos[0].slice(0, 4)}`;
    const blob = await buildPdf(isos, label), who = S.person.name.replace(/[^\wäöüÄÖÜß-]+/g, '_');
    const name = `Stundenzettel_${label.replace(/[\s/]+/g, '_')}_${who}.pdf`;
    saveBlob(blob, name);
    if (kind === 'week') { SENT[mondayOf(iso)] = Date.now(); DB.put('kv', SENT, 'sent'); }
    shareModal(blob, name, `Hallo ${S.recipient.name || ''}, anbei mein Stundenzettel ${label}. Viele Grüße, ${S.person.name}`, 'Stundenzettel gespeichert');
  } catch (err) { console.error(err); closeModal(); toast('PDF konnte nicht erstellt werden: ' + (err.message || err), 'err', 5000); }
}

/* ---------- Datensicherung ---------- */
function backup() {
  const data = { app: 'fruehauf-stempel', version: APP_VERSION, date: tNow().toISOString(), settings: S, days: Object.values(DAYS) };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' }); saveBlob(blob, `stempeluhr-sicherung-${isoToday()}.json`); toast('Sicherung gespeichert.');
}
async function restore(file) {
  if (!canEdit()) return toast('Einspielen nur mit Admin-Freischaltung.', 'warn');
  try {
    const d = JSON.parse(await file.text()); if (d.app !== 'fruehauf-stempel') throw new Error('Keine Sicherung der Stempeluhr');
    if (!(await confirmDlg('Sicherung einspielen?', `${(d.days || []).length} Tage werden übernommen bzw. überschrieben.`, 'Einspielen'))) return;
    S = deepMerge(clone(DEFAULTS), d.settings || {}); saveSettings();
    for (const x of d.days || []) await DB.put('days', x);
    DAYS = {}; ((await DB.all('days')) || []).forEach(x => { DAYS[x.iso] = x; }); applyTheme(); render(); toast('Sicherung eingespielt.');
  } catch (err) { toast('Sicherung konnte nicht gelesen werden: ' + err.message, 'err', 5000); }
}

/* ---------- App-PIN ---------- */
function pinCheck(msg = 'PIN eingeben') {
  return new Promise(res => {
    $('#modal').innerHTML = `<div class="fixed inset-0 z-[90] grid place-items-center p-6" style="background:var(--bg)"><div class="w-full max-w-xs text-center">${logoMark(44)}<div class="font-semibold text-[18px] mt-5">${esc(msg)}</div>
      <input class="inp mt-5 text-center !text-[24px] !h-14 tracking-[.4em]" id="pin-in" inputmode="numeric" maxlength="8" autocomplete="off" name="x-${Date.now()}" style="-webkit-text-security:disc"><button class="btn-p w-full mt-3" id="pin-ok">Öffnen</button>${msg !== 'PIN eingeben' ? '<button class="btn-g w-full mt-2" id="pin-cancel">Abbrechen</button>' : ''}</div></div>`;
    const go = async () => { const v = $('#pin-in').value; if (await pbkdf2(v, S.pin.salt, 60000) === S.pin.hash) { closeModal(); res(true); } else { toast('PIN falsch.', 'err'); $('#pin-in').value = ''; } };
    $('#pin-ok').onclick = go; $('#pin-in').onkeyup = e => { if (e.key === 'Enter' || $('#pin-in').value.length >= 4 && e.key !== 'Backspace') { if (e.key === 'Enter') go(); } };
    const c = $('#pin-cancel'); if (c) c.onclick = () => { closeModal(); res(false); };
    setTimeout(() => { const el = $('#pin-in'); if (el) el.focus(); }, 80);
  });
}
let HIDDEN_AT = 0;
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') HIDDEN_AT = Date.now(); else if (S.pin && HIDDEN_AT && Date.now() - HIDDEN_AT > 5 * 60000) pinCheck(); });

/* ---------- Uhr und Start ---------- */
setInterval(() => {
  const c = $('#clock'); if (c) c.textContent = nowHM();
  if (UI.route === 'home' && !document.activeElement.matches('input,textarea,select')) {
    const d = dayOf(isoToday()), x = calcDay(d), n = $('#live-netto'), p = $('#live-pause'), df = $('#live-diff');
    if (n) n.textContent = hm(x.netto + x.credit); if (p) p.textContent = hm(x.abzug);
    const w = weekStat(mondayOf(isoToday())), wi = $('#wk-ist'), wr = $('#wk-rest'), wo = $('#wk-over'), wb = $('#wk-bar');
    if (wi) wi.innerHTML = `${hm(w.ist)} <span class="text-[15px] text-ink3 font-normal font-sans">von ${hm(w.target)} Std.</span>`; if (wr) wr.textContent = hm(w.rest); if (wo) wo.textContent = '+' + hm(w.over); if (wb) wb.style.width = w.pct + '%';
  }
}, 15000);
setInterval(() => { const c = $('#clock'); if (c) c.textContent = nowHMS(); const v = $('#clock-src'); if (v) v.innerHTML = clockSrc(); }, 1000);
setInterval(() => syncTime(), 5 * 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncTime(); });
(async function init() {
  await DB.open(); await loadSettings();
  { const o = await DB.get('kv', 'timeoff'); if (o) TIME.off = o.off || 0; } await syncTime();
  DEVICE = (await DB.get('kv', 'device')) || { admin: false }; UI.requests = (await DB.get('kv', 'requests')) || []; SENT = (await DB.get('kv', 'sent')) || {};
  ((await DB.all('days')) || []).forEach(x => { DAYS[x.iso] = x; });
  try { FIRMA = await (await fetch('firma.json?t=' + Date.now(), { cache: 'no-store' })).json(); DB.put('kv', FIRMA, 'firma'); } catch (e) { FIRMA = (await DB.get('kv', 'firma')) || FIRMA; }
  await checkGeoPerm();
  applyTheme(); route();
  if (S.pin) pinCheck();
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.design.mode === 'system') { applyTheme(); render(); } }); } catch (e) {}
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && UI.route === 'home') rerender(); });
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
})();

/* =========================================================
   Stundenzettel als PDF (direkt mit jsPDF – auch auf iPad/iPhone sauber)
   ========================================================= */
function loadScript(src) { return new Promise((res, rej) => { if ($(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Bibliothek fehlt: ' + src)); document.head.appendChild(s); }); }
const T = s => String(s ?? '').replace(/[„“”]/g, '"').replace(/[‚‘’]/g, "'").replace(/[–—]/g, '-').replace(/−/g, '-').replace(/×/g, 'x').replace(/…/g, '...').replace(/[•·]/g, '·').replace(/[^\x00-\xFF€]/g, '');
async function imgInfo(src) {
  if (!src) return null; let data = src;
  if (!/^data:/.test(src)) { const b = await (await fetch(src)).blob(); data = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); }
  const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = data; });
  return { data, w: im.naturalWidth, h: im.naturalHeight, fmt: /^data:image\/png/.test(data) ? 'PNG' : 'JPEG' };
}
async function buildPdf(isos, label) {
  await loadScript('vendor/jspdf.umd.min.js');
  const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const W = 210, H = 297, M = 14, CW = W - 2 * M, P = hex2rgb(S.design.primary), INK = [19, 35, 52], GRAY = [110, 124, 138], LINE = [222, 228, 234], RED = [200, 60, 40], GREEN = P;
  const logo = await imgInfo(S.company.logo).catch(() => null), R = calcRange(isos);
  let y = 0;
  const header = () => {
    doc.setFillColor(...P); doc.rect(0, 0, W, 2.2, 'F');
    if (logo) { const h = 12, w = Math.min(50, (logo.w / logo.h) * h); doc.addImage(logo.data, logo.fmt, M, 8, w, w / (logo.w / logo.h)); }
    else { doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...INK); doc.text(T(S.company.name), M, 16); }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...INK); doc.text(T(`Stundenzettel ${label}`), W - M, 12.5, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text(T(`${S.person.name}${S.person.nr ? ' · Pers.-Nr. ' + S.person.nr : ''} · ${deDate(isos[0])} - ${deDate(isos[isos.length - 1])}`), W - M, 18, { align: 'right' });
    doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(M, 25, W - M, 25); y = 31;
  };
  header();
  /* Tabelle */
  const cols = [['Tag', 23], ['Kommen', 14], ['Gehen', 14], ['Pause', 13], ['Abzug', 13], ['Arbeit', 14], ['Soll', 13], ['', 15], ['Baustellen / Bemerkung', CW - 119]];
  const thead = () => { doc.setFillColor(238, 242, 245); doc.rect(M, y - 1, CW, 7, 'F'); doc.setFontSize(7.8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRAY); let x = M + 1.5; cols.forEach(([l, w], i) => { doc.text(l, i >= 3 && i <= 7 ? x + w - 3 : x, y + 3.6, { align: i >= 3 && i <= 7 ? 'right' : 'left' }); x += w; }); y += 8; };
  thead();
  const rows = R.days.filter(x => x.c.soll > 0 || hasData(x.d));
  for (const { d, c } of rows) {
    const work = d.type === 'work', bem = [];
    if (!work) bem.push((d.betrieb || typeName(d.type)) + (d.type === 'feiertag' && holiday(d.iso) ? ' (' + holiday(d.iso) + ')' : ''));
    c.sites.forEach(s => bem.push(`${s.site} (${hm(s.min)})`));
    if (c.missingEnd) bem.push('Ausstempeln fehlt');
    if (d.note) bem.push('Notiz: ' + d.note);
    if (d.edited) bem.push('nachgetragen');
    if ((d.offline || []).length) bem.push('offline gestempelt: ' + d.offline.join(', '));
    doc.setFontSize(8.4); doc.setFont('helvetica', 'normal');
    const bl = doc.splitTextToSize(T(bem.join('\n') || '-'), cols[8][1] - 3), h = Math.max(1, bl.length) * 3.7 + 3;
    if (y + h > H - 60) { doc.addPage(); header(); thead(); }
    const vals = [`${wdOf(d.iso).slice(0, 2)}, ${deDate(d.iso).slice(0, 6)}`, work ? c.start || '-' : '-', work ? c.end || (c.open ? '?' : '-') : '-', work && c.start ? hm(c.pause) : '-', work && c.start ? hm(c.abzug) : '-', hm(c.netto + c.credit), hm(c.soll), ''];
    let x = M + 1.5;
    vals.forEach((v, i) => { const w = cols[i][1], right = i >= 3; doc.setTextColor(...(i === 7 && c.over > 0 ? GREEN : INK)); if (i === 5) doc.setFont('helvetica', 'bold'); doc.text(T(v), right ? x + w - 3 : x, y + 3.2, { align: right ? 'right' : 'left' }); doc.setFont('helvetica', 'normal'); x += w; });
    doc.setTextColor(...INK); doc.text(bl, x, y + 3.2);
    y += h; doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(M, y - 0.8, W - M, y - 0.8);
  }
  /* Summen */
  y += 3; doc.setFillColor(244, 247, 249); doc.roundedRect(M, y, CW, 24, 2, 2, 'F');
  const vac = vacation(+isos[0].slice(0, 4)), mons = [...new Set(isos.map(mondayOf))], ACC = account(mons[mons.length - 1]), bal = ACC.over, wover = mons.reduce((a, m) => a + weekStat(m).over, 0), wused = mons.reduce((a, m) => a + ((ACC.weeks[m] || {}).used || 0), 0), wminus = mons.reduce((a, m) => a + ((ACC.weeks[m] || {}).minus || 0), 0);
  const tiles = [['Arbeitszeit', hm(R.netto + R.credit)], ['Soll', hm(R.soll)], ['Überstunden (über ' + hm(weekTarget()) + ' / Woche)', wover ? '+' + hm(wover) : '0:00'], ['Überstunden gesamt', bal ? '+' + hm(bal) : '0:00'], [wminus ? 'Minusstunden' : wused ? 'Von Überstunden abgezogen' : 'Urlaub / Krank', wminus ? '-' + hm(wminus) : wused ? '-' + hm(wused) : `${R.count('urlaub')} / ${R.count('krank')} Tage`], ['Resturlaub', `${fmtDays(vac.left)} Tage`]];
  tiles.forEach(([k, v], i) => { const cx = M + 5 + (i % 3) * (CW / 3), cy = y + 6 + Math.floor(i / 3) * 10.5; doc.setFontSize(7.4); doc.setTextColor(...GRAY); doc.setFont('helvetica', 'normal'); doc.text(T(k), cx, cy); doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...(v.startsWith('+') ? GREEN : v.startsWith('-') && k === 'Minusstunden' ? RED : INK)); doc.text(T(v), cx, cy + 4.6); });
  y += 30;
  /* Baustellen-Summen */
  const sites = Object.entries(R.sites).sort((a, b) => b[1] - a[1]);
  if (sites.length) {
    if (y + 10 + sites.length * 5 > H - 45) { doc.addPage(); header(); }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...INK); doc.setFillColor(...P); doc.rect(M, y - 3.2, 1.2, 4.6, 'F'); doc.text('Stunden je Baustelle', M + 3.5, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    sites.forEach(([k, m]) => { doc.setTextColor(...INK); doc.text(T(k), M + 1.5, y + 3); doc.setFont('helvetica', 'bold'); doc.text(hm(m), M + 90, y + 3, { align: 'right' }); doc.setFont('helvetica', 'normal'); y += 5; doc.setDrawColor(...LINE); doc.line(M, y - 0.6, M + 92, y - 0.6); });
    y += 4;
  }
  /* Hinweis und Unterschriften */
  if (y > H - 45) { doc.addPage(); header(); }
  doc.setFontSize(7.8); doc.setTextColor(...GRAY);
  doc.text(doc.splitTextToSize(T(`Pausenregel: Je Arbeitstag wird die Mindestpause abgezogen (Mo-Do ${S.hours[1].pause} Min., Fr ${S.hours[5].pause} Min.)${S.pauseOnlyOver6 ? ' (ab 6 Std. Arbeit)' : ''}; Überstunden = Wochenstunden über ${hm(weekTarget())}; fehlende Stunden werden von den Überstunden abgezogen, der Rest als Minusstunden ausgewiesen; längere Pausen werden vollständig abgezogen. "Pause" = gestempelte Pausen und Unterbrechungen, "Abzug" = davon abgezogen. Nachträgliche Änderungen sind mit "nachgetragen" gekennzeichnet; Stempelzeiten kommen vom Server, ohne Internet gestempelte Zeiten sind als "offline" markiert. Standorte je Stempel mit Kartenausschnitt auf der Seite "Standorte".`), CW), M, y + 2);
  y = Math.max(y + 16, H - 38);
  const bw = (CW - 12) / 2;
  [['Mitarbeiter', S.person.name], ['Geprüft', S.recipient.name]].forEach(([l, n], i) => { const x0 = M + i * (bw + 12); doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.line(x0, y + 12, x0 + bw, y + 12); doc.setFontSize(8); doc.setTextColor(...GRAY); doc.text(T(`${l}${n ? ' - ' + n : ''} · Datum, Unterschrift`), x0, y + 16); });
  /* Standorte mit Kartenausschnitt */
  const geos = R.days.flatMap(({ d }) => (d.geo || []).map(g => ({ g, iso: d.iso })));
  if (geos.length) {
    doc.addPage(); header();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...INK); doc.setFillColor(...P); doc.rect(M, y - 3.2, 1.2, 4.6, 'F'); doc.text('Standorte beim Stempeln', M + 3.5, y); y += 6;
    const cw = (CW - 8) / 3, mh = cw * 5 / 8, ch = mh + 12;
    for (let i = 0; i < geos.length; i++) {
      const { g, iso } = geos[i], col = i % 3;
      if (col === 0 && y + ch > H - 18) { doc.addPage(); header(); }
      const x0 = M + col * (cw + 4);
      if (g.map) doc.addImage(g.map, 'JPEG', x0, y, cw, mh, undefined, 'FAST'); else { doc.setFillColor(244, 247, 249); doc.rect(x0, y, cw, mh, 'F'); doc.setFontSize(8); doc.setTextColor(...GRAY); doc.text(g.lat ? `${g.lat}, ${g.lon}` : 'Standort nicht ermittelbar', x0 + cw / 2, y + mh / 2, { align: 'center' }); }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...INK); doc.text(T(`${wdOf(iso).slice(0, 2)} ${deDate(iso).slice(0, 6)} · ${({ in: 'Kommen', out: 'Gehen', pause: 'Pause' })[g.k] || g.k} ${g.t}`), x0, y + mh + 4);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.2); doc.setTextColor(...GRAY); doc.text(doc.splitTextToSize(T(g.addr || (g.lat ? `${g.lat}, ${g.lon}` : '')) + (g.acc ? T(` (±${g.acc} m)`) : ''), cw)[0] || '', x0, y + mh + 7.8);
      if (col === 2 || i === geos.length - 1) y += ch + 2;
    }
    doc.setFontSize(7); doc.setTextColor(...GRAY); doc.text('Karten: © OpenStreetMap-Mitwirkende · Adressen: Photon/OpenStreetMap', M, y + 2);
  }
  /* Fußzeile */
  const n = doc.getNumberOfPages(), c = S.company, foot = T([c.name, c.street, c.city, c.phone].filter(Boolean).join(' · '));
  for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(M, H - 12, W - M, H - 12); doc.setFontSize(7.2); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY); doc.text(foot, M, H - 8); doc.text(T(`Erstellt ${deDate(isoToday())} ${nowHM()} · Seite ${i} / ${n}`), W - M, H - 8, { align: 'right' }); }
  return doc.output('blob');
}

/* Urlaubsantrag */
async function buildVacationPdf(v) {
  await loadScript('vendor/jspdf.umd.min.js');
  const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const W = 210, M = 18, CW = W - 2 * M, P = hex2rgb(S.design.primary), INK = [19, 35, 52], GRAY = [110, 124, 138], LINE = [222, 228, 234];
  const logo = await imgInfo(S.company.logo).catch(() => null);
  doc.setFillColor(...P); doc.rect(0, 0, W, 2.2, 'F');
  if (logo) { const h = 13, w = Math.min(52, (logo.w / logo.h) * h); doc.addImage(logo.data, logo.fmt, M, 10, w, w / (logo.w / logo.h)); }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...INK); doc.text('Urlaubsantrag', W - M, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY); doc.text(T(`eingereicht am ${deDate(isoToday())}`), W - M, 24, { align: 'right' });
  doc.setDrawColor(...LINE); doc.line(M, 31, W - M, 31);
  let y = 42;
  const row = (k, val, big) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GRAY); doc.text(T(k), M, y); doc.setFont('helvetica', 'bold'); doc.setFontSize(big ? 15 : 11.5); doc.setTextColor(...INK); doc.text(doc.splitTextToSize(T(val), CW - 62), M + 62, y); y += big ? 11 : 9; doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(M, y - 5, W - M, y - 5); };
  row('Mitarbeiter', `${S.person.name}${S.person.nr ? ' (Pers.-Nr. ' + S.person.nr + ')' : ''}`);
  row('Zeitraum', `${wdOf(v.von).slice(0, 2)}, ${deDate(v.von)} bis ${wdOf(v.bis).slice(0, 2)}, ${deDate(v.bis)}`, true);
  row('Urlaubstage', `${fmtDays(v.n)} Tag${v.n === 1 ? '' : 'e'} (ohne Wochenende und Feiertage${v.n % 1 ? ', 24./31.12. halb' : ''})`);
  row('Urlaubsanspruch', `${fmtDays(v.total)} Tage`);
  row('Resturlaub vorher', `${fmtDays(v.leftBefore)} Tage`);
  row('Resturlaub danach', `${fmtDays(v.leftAfter)} Tage`);
  if (v.note) row('Bemerkung', v.note);
  /* einzelne Tage */
  y += 4; doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...INK); doc.setFillColor(...P); doc.rect(M, y - 3.2, 1.2, 4.6, 'F'); doc.text('Urlaubstage', M + 3.5, y); y += 6;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); const days = workDaysIn(v.von, v.bis);
  days.forEach((d, i) => { const cx = M + (i % 4) * (CW / 4), cy = y + Math.floor(i / 4) * 5.5; doc.text(T(`${wdOf(d).slice(0, 2)}, ${deDate(d)}`), cx, cy); });
  y += Math.ceil(days.length / 4) * 5.5 + 12;
  /* Unterschriften und Genehmigung */
  const bw = (CW - 12) / 2;
  doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.line(M, y + 12, M + bw, y + 12); doc.setFontSize(8); doc.setTextColor(...GRAY); doc.text(T(`Datum, Unterschrift ${S.person.name}`), M, y + 16);
  y += 28; doc.setFillColor(244, 247, 249); doc.roundedRect(M, y, CW, 34, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...INK); doc.text(T(`Vom Büro auszufüllen${S.recipient.name ? ' (' + S.recipient.name + ')' : ''}`), M + 5, y + 7);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); [['genehmigt', 0], ['abgelehnt', 40]].forEach(([l, dx]) => { doc.setDrawColor(...INK); doc.rect(M + 5 + dx, y + 12, 4.5, 4.5); doc.text(l, M + 12 + dx, y + 15.6); });
  doc.line(M + 5, y + 28, M + 5 + bw, y + 28); doc.setFontSize(8); doc.setTextColor(...GRAY); doc.text('Datum, Unterschrift', M + 5, y + 32);
  const c = S.company; doc.setFontSize(7.2); doc.text(T([c.name, c.street, c.city, c.phone].filter(Boolean).join(' · ')), M, 287);
  return doc.output('blob');
}

/* =========================================================
   Mitarbeiter-Sicherungen und Aktualisierungen vom Büro
   - Jeder Mitarbeiter schickt seine Sicherung ans Büro (WhatsApp).
   - Admin-Geräte (Manuel, Jule, Artjom) bewahren je Mitarbeiter eine Kopie auf,
     ändern dort Urlaub, Krankheit, Urlaubskonto und Überstunden
     und schicken eine Aktualisierung zurück.
   - Die Aktualisierung ist mit dem Firmen-Admin-Passwort digital unterschrieben:
     nur echte Büro-Dateien lassen sich einspielen.
   ========================================================= */
/* Öffentlicher Prüfschlüssel und der mit dem Admin-Passwort verschlüsselte Signaturschlüssel (kein Klartext-Passwort im Code) */
const UPD_KEY = {"pub":{"kty":"EC","crv":"P-256","x":"GfRI2SrMeUAiop8Ky0zDUFqOY2O80YNc5ZyggeSJS2k","y":"xvD8q0z-apOnVmUiSYym32fj0YBlK3UR8QnpMKQNVJk"},"enc":{"salt":"a516bfdb02fd1949f0b412a27b672e96","iv":"5e1490b37849e74b0d8917b5","ct":"CjHJJXNKpi15w0cuSnWJN1UyCpp/sTIOQiMz+gJ4kkIvpxSyUycN3WgZ7uDfuIiPEokZrZqWnNUb8lD/laprzWoGc2UKbgUKdnjwrCgGQmAWD2pKfELgQSDtVN1iIVFY+OWAzluVLj64Wxe/v2OSkia1F++POcksP6hN9epHEwrIXLIq9S/QaKXiGl+9RMyqa5rEMjCEOEKtHA==","iter":150000}};
const TYPE_DE = { urlaub: 'Urlaub', krank: 'Krank', frei: 'Ausgleich (frei)', sonder: 'Sonderurlaub', work: 'Arbeitstag' };
const OFF_TYPES = ['urlaub', 'krank', 'frei', 'sonder'];
const hexBytes = h => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));
const b64Bytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const bytesB64 = b => btoa(String.fromCharCode(...new Uint8Array(b)));
const normName = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
let SIGN_KEY = null;   // nach Passworteingabe nur im Speicher
async function signKey(pw) {
  const E = UPD_KEY.enc, base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
  const aes = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: hexBytes(E.salt), iterations: E.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const pk8 = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: hexBytes(E.iv) }, aes, b64Bytes(E.ct));
  return crypto.subtle.importKey('pkcs8', pk8, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}
async function verifyUpd(payload, sig) {
  const k = await crypto.subtle.importKey('jwk', UPD_KEY.pub, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, b64Bytes(sig), new TextEncoder().encode(payload));
}
function askPw(title, text) {
  return new Promise(res => {
    modal(`<h3 class="text-[20px] font-semibold pr-8">${esc(title)}</h3><p class="text-ink2 text-[14px] mt-2">${esc(text)}</p>
      <input class="inp mt-4" id="upw" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" style="-webkit-text-security:disc" placeholder="Firmen-Admin-Passwort">
      <div class="flex flex-col sm:flex-row gap-2 mt-5"><button class="btn-p sm:flex-1" id="upw-ok">Weiter</button><button class="btn-s sm:flex-1" id="upw-no">Abbrechen</button></div>`);
    const go = () => { const v = $('#upw').value; closeModal(); res(v); };
    $('#upw-ok').onclick = go; $('#upw-no').onclick = () => { closeModal(); res(null); }; $('#upw').onkeydown = e => { if (e.key === 'Enter') go(); }; setTimeout(() => $('#upw') && $('#upw').focus(), 50);
  });
}
async function ensureSignKey() {
  if (SIGN_KEY) return true;
  const pw = await askPw('Aktualisierung unterschreiben', 'Zum Erstellen einer Aktualisierung bitte das Firmen-Admin-Passwort eingeben (einmal pro App-Start).');
  if (!pw) return false;
  try { SIGN_KEY = await signKey(pw); return true; } catch (e) { toast('Passwort falsch – bitte das Firmen-Admin-Passwort verwenden.', 'err', 4500); return false; }
}
function shareFile(blob, name, text, title) {
  const file = new File([blob], name, { type: 'application/json' }), can = navigator.canShare && navigator.canShare({ files: [file] });
  modal(`<div class="text-center pt-2"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('check', 26, 2.4)}</div><div class="font-semibold text-[19px] mt-4">${esc(title)}</div><div class="text-[13px] text-ink3 mt-1 break-all">${esc(name)}</div>
    <div class="grid gap-2 mt-6">${can ? `<button class="btn-p !h-12" id="tf-share">${ic('send', 17)}Per WhatsApp senden</button><p class="hint text-center -mt-1">Im Teilen-Menü WhatsApp wählen.</p>` : ''}
    <button class="btn-s" id="tf-save">${ic('download', 17)}Datei speichern</button><button class="btn-g" data-a="modal-close">Fertig</button></div>`);
  $('#tf-save').onclick = () => saveBlob(blob, name);
  const b = $('#tf-share'); if (b) b.onclick = async () => { try { await navigator.share({ files: [file], text, title: name }); closeModal(); } catch (err) { if (err && err.name !== 'AbortError') { saveBlob(blob, name); toast('Teilen nicht möglich – die Datei ist gespeichert.', 'warn'); } } };
}
const fileSafe = s => String(s || 'Mitarbeiter').trim().replace(/[^\wäöüÄÖÜß-]+/g, '_');

/* ---------- Mitarbeiter: Sicherung ans Büro senden ---------- */
function sendBackupToOffice() {
  if (!S.person.name) { toast('Bitte zuerst deinen Namen eintragen.', 'warn'); location.hash = '#/einstellungen/person'; return; }
  const data = { app: 'fruehauf-stempel', version: APP_VERSION, date: tNow().toISOString(), settings: S, days: Object.values(DAYS) };
  const name = `Stempeluhr_Sicherung_${fileSafe(S.person.name)}_${isoToday()}.json`;
  shareFile(new Blob([JSON.stringify(data)], { type: 'application/json' }), name, `Hallo ${S.recipient.name || ''}, hier meine Stempeluhr-Sicherung. Viele Grüße, ${S.person.name}`, 'Sicherung fürs Büro erstellt');
}

/* ---------- Mitarbeiter: Aktualisierung vom Büro einspielen ---------- */
function opText(o) {
  if (o.t === 'vac') return `Urlaubskonto: ${o.perYear} Tage/Jahr${o.start ? `, Eintritt ${deDate(o.start)}` : ''}${o.rule === 'gesetz' ? ' (gesetzlich)' : ''}${o.manual ? `, Anspruch ${o.manual.year}: ${o.manual.days} Tage` : ''}, Rest Vorjahr ${o.carry}, schon genommen ${o.year}: ${o.takenBefore}`;
  if (o.t === 'bal') return `Überstunden-Bestand ${hm(o.min)} ab ${deDate(o.from)}`;
  if (o.t === 'days') return `${deDate(o.von)}${o.bis !== o.von ? ' – ' + deDate(o.bis) : ''}: ${TYPE_DE[o.type] || o.type}`;
  return '';
}
async function importUpdate(file) {
  try {
    const f = JSON.parse(await file.text());
    if (f.app === 'fruehauf-stempel') return toast('Das ist eine Sicherung, keine Aktualisierung. Sicherungen spielt das Büro ein.', 'warn', 5000);
    if (f.app !== 'fruehauf-stempel-update' || !f.payload || !f.sig) throw new Error('Keine Aktualisierung der Stempeluhr');
    if (!(await verifyUpd(f.payload, f.sig))) throw new Error('Unterschrift ungültig – die Datei stammt nicht vom Büro oder wurde verändert');
    const u = JSON.parse(f.payload), done = S.updApplied || [];
    if (done.includes(u.id)) return toast('Diese Aktualisierung ist schon eingespielt.', 'warn');
    if (u.to.name !== '*' && S.person.name && normName(u.to.name) !== normName(S.person.name)) return toast(`Diese Aktualisierung ist für ${u.to.name} – nicht für ${S.person.name}.`, 'err', 5000);
    const list = u.ops.map(o => `<li>${esc(opText(o))}</li>`).join('');
    modal(`<h3 class="text-[20px] font-semibold pr-8">Aktualisierung vom Büro</h3><p class="text-ink3 text-[13px] mt-1">von ${esc(u.by || 'Büro')} · ${new Date(u.created).toLocaleString('de-DE')}</p>
      ${u.note ? `<div class="kpi mt-4 text-[14px]">${esc(u.note)}</div>` : ''}<ul class="list-disc pl-5 mt-4 space-y-1 text-[14px]">${list}</ul>
      <div class="flex flex-col sm:flex-row gap-2 mt-6"><button class="btn-p sm:flex-1" id="up-ok">Übernehmen</button><button class="btn-s sm:flex-1" data-a="modal-close">Abbrechen</button></div>`);
    $('#up-ok').onclick = async () => { await applyUpdate(u); closeModal(); toast('Aktualisierung übernommen.'); render(); };
  } catch (err) { toast('Aktualisierung nicht möglich: ' + err.message, 'err', 5500); }
}
async function applyUpdate(u) {
  const who = `Büro (${u.by || 'Admin'})`, at = tNow().toISOString();
  if (!S.person.name && u.to.name && u.to.name !== '*') S.person.name = u.to.name;
  for (const o of u.ops) {
    if (o.t === 'vac') { S.vacation = { ...S.vacation, perYear: +o.perYear, carry: +o.carry, takenBefore: +o.takenBefore, year: +o.year, rule: o.rule || S.vacation.rule || 'anteilig', manual: o.manual || null }; if (o.start !== undefined) S.person.start = o.start; }
    if (o.t === 'bal') S.balance = { from: o.from, min: +o.min };
    if (o.t === 'days') {
      for (let iso = o.von; iso <= o.bis; iso = addDays(iso, 1)) {
        const cur = DAYS[iso];
        if (o.type === 'work') { if (!cur || !OFF_TYPES.includes(cur.type)) continue; }
        else if (!isWorkday(iso)) continue;
        const d = clone(dayOf(iso)), from = d.type; if (from === o.type) continue;
        d.type = o.type; if (o.type !== 'urlaub') d.betrieb = '';
        (d.log = d.log || []).push({ at, what: 'Art des Tages', from: TYPE_DE[from] || from, to: TYPE_DE[o.type], admin: who }); d.edited = true;
        await saveDay(d);
      }
    }
  }
  S.kontoLog = (S.kontoLog || []).concat({ at, what: 'Aktualisierung vom ' + who + ': ' + u.ops.map(opText).join(' · ') });
  S.updApplied = (S.updApplied || []).concat(u.id).slice(-200);
  saveSettings();
}

/* ---------- Admin: Mitarbeiter-Sicherungen ---------- */
let STAFF = {};   // name (klein) → { name, nr, at, settings, days:{}, pending:[], note, sent:[] }
async function loadStaff() { try { STAFF = (await DB.get('kv', 'staff')) || {}; } catch (e) { STAFF = {}; } }
const saveStaff = () => DB.put('kv', clone(STAFF), 'staff');
/* Rechnen mit den Daten eines Mitarbeiters (eigene Daten bleiben unberührt) */
function withStaff(st, fn) {
  const s0 = S, d0 = DAYS;
  try { S = deepMerge(clone(DEFAULTS), st.settings || {}); DAYS = st.days || {}; return fn(); } finally { S = s0; DAYS = d0; }
}
async function importStaffBackup(file) {
  try {
    const d = JSON.parse(await file.text()); if (d.app !== 'fruehauf-stempel') throw new Error('Keine Sicherung der Stempeluhr');
    const name = ((d.settings || {}).person || {}).name; if (!name) throw new Error('In der Sicherung fehlt der Name');
    const k = normName(name), old = STAFF[k], days = {}; (d.days || []).forEach(x => { days[x.iso] = x; });
    STAFF[k] = { ...(old || {}), name, nr: (d.settings.person || {}).nr || '', at: d.date, settings: d.settings, days, pending: (old && old.pending) || [] };
    /* noch nicht übernommene Änderungen auf die neue Kopie legen */
    for (const o of STAFF[k].pending) applyToCopy(STAFF[k], o);
    await saveStaff(); toast(`Sicherung von ${name} gespeichert.`); UI.staff = k; render();
  } catch (err) { toast('Sicherung konnte nicht gelesen werden: ' + err.message, 'err', 5000); }
}
function applyToCopy(st, o) {
  st.settings = st.settings || clone(DEFAULTS);
  if (o.t === 'vac') { st.settings.vacation = { ...(st.settings.vacation || {}), perYear: +o.perYear, carry: +o.carry, takenBefore: +o.takenBefore, year: +o.year, rule: o.rule || 'anteilig', manual: o.manual || null }; if (o.start !== undefined) st.settings.person = { ...(st.settings.person || {}), start: o.start }; }
  if (o.t === 'bal') st.settings.balance = { from: o.from, min: +o.min };
  if (o.t === 'days') withStaff(st, () => {
    for (let iso = o.von; iso <= o.bis; iso = addDays(iso, 1)) {
      const cur = DAYS[iso];
      if (o.type === 'work') { if (cur && OFF_TYPES.includes(cur.type)) { cur.type = 'work'; } continue; }
      if (!isWorkday(iso)) continue; const d = clone(dayOf(iso)); d.type = o.type; DAYS[iso] = d;
    }
    st.days = DAYS;
  });
}
function staffStats(st) {
  return withStaff(st, () => { const v = vacation(), a = account(); return { v, over: a.over, minus: a.minus }; });
}
function teamBody() {
  if (!DEVICE.admin) return `<p class="text-ink3 text-[14px]">Nur auf Admin-Geräten (Manuel, Jule, Artjom). Unter „Admin“ dieses Gerät mit dem Admin-Passwort freischalten.</p>`;
  const list = Object.entries(STAFF).sort((a, b) => a[1].name.localeCompare(b[1].name));
  const sel = STAFF[UI.staff] ? UI.staff : '';
  let h = `<p class="text-ink3 text-[14px] mb-4">So geht's: Mitarbeiter schickt seine Sicherung per WhatsApp → hier öffnen → Urlaub, Krankheit oder Konten ändern → „Aktualisierung senden“. Der Mitarbeiter spielt sie unter Einstellungen → Daten ein, fertig.</p>
    <div class="flex flex-wrap gap-2"><label class="btn-p cursor-pointer">${ic('upload', 16)}Sicherung eines Mitarbeiters öffnen<input type="file" accept=".json,application/json" class="hidden" data-staff-file></label><button class="btn-s" data-a="tm-new">${ic('plus', 16)}Ohne Sicherung anlegen</button></div>`;
  if (!list.length) return h + `<div class="kpi mt-5 text-[14px] text-ink3">Noch keine Mitarbeiter gespeichert.</div>`;
  h += `<div class="grid gap-2 mt-5">${list.map(([k, st]) => { const s = staffStats(st); return `<button class="text-left rounded-[var(--rb)] border ${k === sel ? 'border-p' : 'border-line'} bg-raised px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1" data-a="tm-sel" data-v="${esc(k)}"><b class="text-[15px] flex-1 min-w-[140px]">${esc(st.name)}</b><span class="text-[13px] text-ink2">Resturlaub <b>${fmtDays(s.v.left)}</b> von ${fmtDays(s.v.total)}</span><span class="text-[13px] text-ink2">Überstunden <b>${hm(s.over)}</b></span><span class="text-[12px] text-ink3">${st.at ? 'Sicherung ' + new Date(st.at).toLocaleDateString('de-DE') : 'ohne Sicherung'}${(st.pending || []).length ? ` · <span class="text-yel-ink">${st.pending.length} offen</span>` : ''}</span></button>`; }).join('')}</div>`;
  if (sel) h += staffEditor(sel);
  return h;
}
function staffEditor(k) {
  const st = STAFF[k], s = staffStats(st), v = (st.settings || {}).vacation || DEFAULTS.vacation, b = (st.settings || {}).balance || DEFAULTS.balance, y = tNow().getFullYear();
  const days = withStaff(st, () => Object.values(DAYS).filter(d => OFF_TYPES.includes(d.type) && d.iso >= `${y}-01-01`).sort((a, c) => a.iso.localeCompare(c.iso)));
  /* zusammenhängende Zeiträume gleicher Art */
  const runs = []; days.forEach(d => { const r = runs[runs.length - 1]; if (r && r.type === d.type && withStaff(st, () => workDaysIn(addDays(r.bis, 1), addDays(d.iso, -1)).length === 0)) r.bis = d.iso; else runs.push({ type: d.type, von: d.iso, bis: d.iso }); });
  return `<div class="mt-6 rounded-[var(--r)] border border-line p-4 sm:p-5">
    <div class="flex flex-wrap items-center gap-2"><h3 class="font-semibold text-[18px] flex-1">${esc(st.name)}</h3><button class="btn-g !h-9" data-a="tm-dl" data-v="${esc(k)}">${ic('download', 15)}Sicherung herunterladen</button><button class="btn-g !h-9 text-ember" data-a="tm-del" data-v="${esc(k)}">${ic('trash', 15)}Entfernen</button></div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">${kpi('Anspruch ' + y, fmtDays(s.v.total) + ' Tage')}${kpi('Genommen', fmtDays(s.v.taken) + ' Tage')}${kpi('Geplant', fmtDays(s.v.planned) + ' Tage')}${kpi('Rest', fmtDays(s.v.left) + ' Tage')}</div>
    <h4 class="font-semibold mt-6 mb-2">Urlaub / Krank / Ausgleich eintragen</h4>
    <div class="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1.2fr_auto] gap-2"><input type="date" class="inp" id="tm-von"><input type="date" class="inp" id="tm-bis"><select class="inp" id="tm-type"><option value="urlaub">Urlaub</option><option value="krank">Krank</option><option value="sonder">Sonderurlaub</option><option value="frei">Ausgleich (frei)</option><option value="work">Wieder Arbeitstag</option></select><button class="btn-s col-span-2 sm:col-span-1" data-a="tm-days" data-v="${esc(k)}">${ic('plus', 16)}Eintragen</button></div>
    <div class="space-y-1 mt-3">${runs.map(r => `<div class="flex flex-wrap items-center gap-2 rounded-[var(--rb)] bg-raised px-3 py-1.5 text-[13px]"><span class="badge ${r.type === 'krank' ? 'bg-tred text-red-ink' : r.type === 'sonder' ? 'text-[#7C3AED] bg-[rgba(139,92,246,.16)]' : 'bg-tyel text-yel-ink'}">${TYPE_DE[r.type]}</span><span class="flex-1">${deDate(r.von)}${r.bis !== r.von ? ' – ' + deDate(r.bis) : ''}</span><button class="text-ink3 hover:text-ink" data-a="tm-undo-run" data-v="${esc(k)}" data-von="${r.von}" data-bis="${r.bis}" title="Wieder Arbeitstage">${ic('x', 15)}</button></div>`).join('') || '<div class="text-[13px] text-ink3">Keine Einträge in diesem Jahr.</div>'}</div>
    <h4 class="font-semibold mt-6 mb-2">Konten</h4>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2"><label><span class="lbl">Eintrittsdatum</span><input type="date" class="inp" id="tm-start" value="${esc(((st.settings || {}).person || {}).start || '')}"></label><label><span class="lbl">Berechnung Eintrittsjahr</span><select class="inp" id="tm-rule"><option value="anteilig" ${(v.rule || 'anteilig') === 'anteilig' ? 'selected' : ''}>Anteilig (1/12 je Monat)</option><option value="gesetz" ${v.rule === 'gesetz' ? 'selected' : ''}>Gesetzlich (BUrlG)</option></select></label><label><span class="lbl">Anspruch ${y} (auto ${s.v.ent.auto})</span><input class="inp" id="tm-man" inputmode="numeric" value="${s.v.ent.manual ? esc(s.v.ent.days) : ''}" placeholder="leer = automatisch"></label>
      <label><span class="lbl">Urlaubstage/Jahr</span><input class="inp" id="tm-per" inputmode="numeric" value="${esc(v.perYear)}"></label><label><span class="lbl">Rest Vorjahr</span><input class="inp" id="tm-carry" inputmode="numeric" value="${esc(v.carry)}"></label><label><span class="lbl">Schon genommen ${y}</span><input class="inp" id="tm-taken" inputmode="numeric" value="${esc(+v.year === y ? v.takenBefore : 0)}"></label>
      <label><span class="lbl">Überstunden zählen ab</span><input type="date" class="inp" id="tm-from" value="${esc(b.from)}"></label><label><span class="lbl">Startwert (Std:Min)</span><input class="inp" id="tm-over" value="${esc(hm(b.min || 0))}"></label><div class="flex items-end"><button class="btn-s w-full" data-a="tm-konto" data-v="${esc(k)}">Konten übernehmen</button></div></div>
    <p class="hint">${s.v.ent.why ? esc(s.v.ent.why) + ' · ' : ''}Aktuell: Überstunden ${hm(s.over)}${s.minus ? ` · Minusstunden ${hm(s.minus)}` : ''}${s.v.sonder ? ` · Sonderurlaub ${s.v.sonder} ${s.v.sonder === 1 ? 'Tag' : 'Tage'}` : ''}</p>
    <h4 class="font-semibold mt-6 mb-2">Offene Änderungen ${(st.pending || []).length ? `(${st.pending.length})` : ''}</h4>
    ${(st.pending || []).length ? `<ul class="list-disc pl-5 space-y-1 text-[14px]">${st.pending.map(o => `<li>${esc(opText(o))}</li>`).join('')}</ul>
      <label class="block mt-3"><span class="lbl">Nachricht an ${esc(st.name.split(' ')[0])} (optional)</span><input class="inp" id="tm-note" placeholder="z. B. Urlaub wie besprochen eingetragen"></label>
      <div class="flex flex-wrap gap-2 mt-3"><button class="btn-p" data-a="tm-send" data-v="${esc(k)}">${ic('send', 16)}Aktualisierung senden</button><button class="btn-g" data-a="tm-clear" data-v="${esc(k)}">Verwerfen</button></div>` : '<div class="text-[13px] text-ink3">Keine – Änderungen oben eintragen.</div>'}
    ${(st.sent || []).length ? `<p class="hint mt-4">Zuletzt gesendet: ${st.sent.slice(-3).reverse().map(x => new Date(x.at).toLocaleString('de-DE')).join(', ')}</p>` : ''}
  </div>`;
}
async function staffAction(a) {
  const k = a.dataset.v, st = STAFF[k], act = a.dataset.a;
  if (act === 'tm-sel') { UI.staff = UI.staff === k ? '' : k; return rerender(); }
  if (act === 'tm-new') {
    const name = await askName(); if (!name) return; const kk = normName(name);
    if (!STAFF[kk]) STAFF[kk] = { name, nr: '', at: '', settings: clone(DEFAULTS), days: {}, pending: [] };
    STAFF[kk].settings.person = { name, nr: '' }; UI.staff = kk; await saveStaff(); return rerender();
  }
  if (!st) return;
  if (act === 'tm-days' || act === 'tm-undo-run') {
    const von = act === 'tm-days' ? $('#tm-von').value : a.dataset.von, bis = act === 'tm-days' ? $('#tm-bis').value || von : a.dataset.bis, type = act === 'tm-days' ? $('#tm-type').value : 'work';
    if (!von || bis < von) return toast('Bitte Von und Bis angeben.', 'warn');
    const o = { t: 'days', von, bis, type }; st.pending = (st.pending || []).concat(o); applyToCopy(st, o);
  }
  if (act === 'tm-konto') {
    const m = /^\s*(\d+)(?::(\d{1,2}))?\s*$/.exec($('#tm-over').value); if (!m) return toast('Überstunden bitte als Std:Min, z. B. 12:30', 'warn');
    const y = tNow().getFullYear(), man = $('#tm-man').value.trim(), ops = [{ t: 'vac', perYear: +$('#tm-per').value || 0, carry: +$('#tm-carry').value || 0, takenBefore: +$('#tm-taken').value || 0, year: y, start: $('#tm-start').value || '', rule: $('#tm-rule').value, manual: man !== '' && isFinite(+man) ? { year: y, days: +man } : null }, { t: 'bal', from: $('#tm-from').value ? mondayOf($('#tm-from').value) : mondayOf(isoToday()), min: +m[1] * 60 + (+m[2] || 0) }];
    /* Überstunden nur mitschicken, wenn sie hier wirklich geändert wurden – sonst bleibt der Stand des Mitarbeiters */
    const ob = (st.settings || {}).balance || {}, nb = ops[1], balChanged = +nb.min !== (+ob.min || 0) || ($('#tm-from').value && nb.from !== ob.from);
    if (!balChanged) ops.pop();
    st.pending = (st.pending || []).filter(o => o.t !== 'vac' && (balChanged ? o.t !== 'bal' : true)).concat(ops); ops.forEach(o => applyToCopy(st, o));
    toast('Konten vorgemerkt – jetzt „Aktualisierung senden“.');
  }
  if (act === 'tm-clear') { if (!(await confirmDlg('Änderungen verwerfen?', 'Die offenen Änderungen werden nicht gesendet. Die gespeicherte Kopie bleibt wie zuletzt geändert – zum Zurücksetzen die Sicherung neu öffnen.', 'Verwerfen', true))) return; st.pending = []; }
  if (act === 'tm-del') { if (!(await confirmDlg(`${st.name} entfernen?`, 'Die gespeicherte Sicherung auf diesem Gerät wird gelöscht.', 'Entfernen', true))) return; delete STAFF[k]; UI.staff = ''; }
  if (act === 'tm-dl') { const data = { app: 'fruehauf-stempel', version: APP_VERSION, date: st.at || tNow().toISOString(), settings: st.settings, days: Object.values(st.days || {}) }; saveBlob(new Blob([JSON.stringify(data)], { type: 'application/json' }), `Stempeluhr_Sicherung_${fileSafe(st.name)}_${isoToday()}.json`); return; }
  if (act === 'tm-send') {
    if (!(st.pending || []).length) return;
    const note = ($('#tm-note') || {}).value || '';
    if (!(await ensureSignKey())) return;
    const u = { id: uid('u'), created: tNow().toISOString(), by: S.person.name || 'Büro', to: { name: st.name, nr: st.nr || '' }, ops: st.pending, note: note.trim() };
    const payload = JSON.stringify(u), sig = bytesB64(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, SIGN_KEY, new TextEncoder().encode(payload)));
    const blob = new Blob([JSON.stringify({ app: 'fruehauf-stempel-update', payload, sig })], { type: 'application/json' });
    st.sent = (st.sent || []).concat({ at: u.created, id: u.id, n: u.ops.length }).slice(-20); st.pending = []; await saveStaff();
    const first = st.name.split(' ')[0];
    shareFile(blob, `Stempeluhr_Aktualisierung_${fileSafe(st.name)}_${isoToday()}.json`, `Hallo ${first}, hier eine Aktualisierung für deine Stempeluhr. Datei speichern, dann in der App: Einstellungen → Daten → „Aktualisierung vom Büro einspielen“.`, `Aktualisierung für ${st.name} erstellt`);
    rerender(); return;
  }
  await saveStaff(); rerender();
}
function askName() {
  return new Promise(res => {
    modal(`<h3 class="text-[20px] font-semibold pr-8">Mitarbeiter anlegen</h3><p class="text-ink2 text-[14px] mt-2">Genau so schreiben, wie der Mitarbeiter seinen Namen in der App eingetragen hat.</p><input class="inp mt-4" id="tm-name" placeholder="Vor- und Nachname">
      <div class="flex flex-col sm:flex-row gap-2 mt-5"><button class="btn-p sm:flex-1" id="tn-ok">Anlegen</button><button class="btn-s sm:flex-1" id="tn-no">Abbrechen</button></div>`);
    $('#tn-ok').onclick = () => { const v = $('#tm-name').value.trim(); closeModal(); res(v); }; $('#tn-no').onclick = () => { closeModal(); res(''); };
  });
}

/* ---------- Einbindung in die Einstellungen ---------- */
SET_TABS.splice(SET_TABS.findIndex(t => t[0] === 'admin'), 0, ['team', 'Mitarbeiter', 'users']);
const _setBodyTeam = setBody;
setBody = function () {
  if (UI.tab === 'team') return teamBody();
  const b = _setBodyTeam();
  if (UI.tab !== 'daten') return b;
  return `<div class="rounded-[var(--r)] border border-line p-4 mb-6"><h3 class="font-semibold mb-1">Mit dem Büro abgleichen</h3><p class="text-ink3 text-[14px] mb-3">Sicherung an ${esc(S.recipient.name || 'das Büro')} schicken – das Büro bewahrt sie auf und kann Urlaub oder Konten ändern. Kommt eine Aktualisierung zurück, hier einspielen.</p>
    <div class="flex flex-wrap gap-2"><button class="btn-p" data-a="tm-backup">${ic('send', 16)}Sicherung ans Büro senden</button><label class="btn-s cursor-pointer">${ic('upload', 16)}Aktualisierung vom Büro einspielen<input type="file" accept=".json,application/json" class="hidden" data-upd-file></label></div></div>` + b;
};
document.addEventListener('click', e => {
  const a = e.target.closest('[data-a^="tm-"]'); if (!a) return;
  if (a.dataset.a === 'tm-backup') return sendBackupToOffice();
  staffAction(a);
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.matches && el.matches('[data-staff-file]') && el.files && el.files[0]) { importStaffBackup(el.files[0]); el.value = ''; }
  if (el.matches && el.matches('[data-upd-file]') && el.files && el.files[0]) { importUpdate(el.files[0]); el.value = ''; }
});
loadStaff().then(() => { if (UI.tab === 'team' && typeof render === 'function') render(); });

/* Konten-Reiter: Berechnungsart und von Hand angepasster Anspruch */
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a="vac-rule"]'); if (!a) return;
  if (!(await needEdit())) return; S.vacation.rule = a.dataset.v; S.kontoLog = (S.kontoLog || []).concat({ at: tNow().toISOString(), what: 'Urlaubsberechnung: ' + (a.dataset.v === 'gesetz' ? 'gesetzlich' : 'anteilig') }); saveSettings(); rerender();
});
document.addEventListener('change', e => {
  const el = e.target; if (!el.matches || !el.matches('[data-vman]')) return;
  if (!canEdit()) return rerender();
  const y = tNow().getFullYear(), v = el.value.trim();
  S.vacation.manual = v === '' ? null : { year: y, days: +v };
  S.kontoLog = (S.kontoLog || []).concat({ at: tNow().toISOString(), what: v === '' ? `Urlaubsanspruch ${y}: wieder automatisch` : `Urlaubsanspruch ${y} von Hand: ${v} Tage` });
  saveSettings(); rerender();
});

/* Heiligabend / Silvester einstellen (Arbeitszeiten, mit Freischaltung) */
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a="half-day"]'); if (!a) return;
  if (!(await needEdit())) return;
  S.halfDays = { ...(S.halfDays || {}), [a.dataset.k]: a.dataset.v };
  S.kontoLog = (S.kontoLog || []).concat({ at: tNow().toISOString(), what: `${a.dataset.k === '12-24' ? 'Heiligabend' : 'Silvester'}: ${{ halb: 'halber Tag', voll: 'ganzer Tag', frei: 'frei' }[a.dataset.v]}` });
  saveSettings(); rerender();
});

/* ---------- Reiter „Betriebsurlaub“: für alle anpassbar, vom Büro an alle verteilbar ---------- */
function buBody(ro) {
  const L = firmBu(), y = tNow().getFullYear(), cnt = b => { const l = workDaysIn(b.von, b.bis), ys = [...new Set(l.map(i => i.slice(0, 4)))]; return ys.map(y2 => { const n = vacDays(l.filter(i => i.startsWith(y2))); return `${fmtDays(n)} ${n === 1 ? 'Tag' : 'Tage'} ${y2}`; }).join(' + ') || '0 Tage'; };
  const src = S.buFirm && L === S.buFirm.list ? `Stand ${new Date(S.buFirm.at).toLocaleDateString('de-DE')}${S.buFirm.by ? ' · vom Büro (' + esc(S.buFirm.by) + ')' : ''}` : 'Firmenvorgabe aus dem App-Update';
  return `${ro ? `<div class="rounded-[var(--rb)] bg-raised p-3 mb-5 flex flex-wrap items-center gap-3 text-[14px]"><span class="text-ink3">${ic('alert', 17)}</span><span class="flex-1">Nur mit Admin-Passwort änderbar.</span><button class="btn-s !h-9" data-a="unlock">Freischalten</button></div>` : ''}
    <p class="text-ink3 text-[14px] mb-4">Gilt für alle Mitarbeiter. Die Tage werden vom Urlaubsanspruch abgezogen (Wochenenden und Feiertage nicht, Heiligabend/Silvester je nach Einstellung halb). ${src}.</p>
    <div class="space-y-2">${L.map((b, i) => ro ? `<div class="flex flex-wrap items-center gap-2 rounded-[var(--rb)] bg-raised px-3 py-2.5 text-[14px]"><span style="color:#C7792F">${ic('cal', 16)}</span><b>${esc(b.name || 'Betriebsurlaub')}</b><span class="flex-1">${deDate(b.von)} – ${deDate(b.bis)}</span><span class="text-[13px] text-ink2">${b.abzug === false ? 'zählt nicht vom Urlaub' : cnt(b)}</span></div>`
      : `<div class="rounded-[var(--rb)] bg-raised p-3"><div class="grid grid-cols-2 sm:grid-cols-[1.3fr_1fr_1fr_auto] gap-2 items-center"><input class="inp col-span-2 sm:col-span-1" data-buf="${i}" data-k="name" value="${esc(b.name || '')}" placeholder="Name"><input type="date" class="inp" data-buf="${i}" data-k="von" value="${esc(b.von)}"><input type="date" class="inp" data-buf="${i}" data-k="bis" value="${esc(b.bis)}"><button class="btn-g !h-10 col-span-2 sm:col-span-1 hover:!text-ember" data-a="buf-del" data-i="${i}">${ic('trash', 15)}Entfernen</button></div>
        <div class="flex flex-wrap items-center gap-3 mt-2 text-[13px]"><label class="flex items-center gap-2 text-ink2"><input type="checkbox" data-buf="${i}" data-k="abzug" ${b.abzug === false ? '' : 'checked'}>vom Urlaub abziehen</label><span class="text-ink3">${b.abzug === false ? '' : cnt(b)}</span></div></div>`).join('') || '<div class="kpi text-[14px] text-ink3">Kein Betriebsurlaub eingetragen.</div>'}</div>
    ${ro ? '' : `<button class="btn-s mt-3" data-a="buf-add">${ic('plus', 16)}Zeitraum hinzufügen</button>`}
    ${(S.bu || []).length ? `<h3 class="font-semibold mt-7 mb-2">Nur auf diesem Gerät</h3><div class="space-y-1.5">${S.bu.map((b, i) => `<div class="flex flex-wrap items-center gap-2 rounded-[var(--rb)] bg-raised px-3 py-2 text-[14px]"><b>${esc(b.name || 'Betriebsurlaub')}</b><span class="flex-1">${deDate(b.von)} – ${deDate(b.bis)}</span>${ro ? '' : `<button class="text-ink3 hover:text-ember" data-a="bu-del" data-i="${i}">${ic('trash', 15)}</button>`}</div>`).join('')}</div>` : ''}
    ${DEVICE.admin ? `<div class="rounded-[var(--r)] border border-line p-4 mt-7"><h3 class="font-semibold">An alle Mitarbeiter verteilen</h3><p class="text-ink3 text-[14px] mt-1 mb-3">Erstellt eine Aktualisierung für alle – z. B. in die WhatsApp-Gruppe schicken. Jeder spielt sie unter Einstellungen → Daten → „Aktualisierung vom Büro einspielen“ ein.</p><button class="btn-p" data-a="buf-send">${ic('send', 16)}Betriebsurlaub an alle senden</button></div>` : `<p class="hint mt-5">Änderungen hier gelten nur auf diesem Handy. Für alle Mitarbeiter: auf einem Admin-Gerät ändern und „An alle senden“.</p>`}`;
}
const _setBodyBu = setBody;
setBody = function () { if (UI.tab === 'bu') return buBody(!canEdit()); return _setBodyBu(); };
function buEdit(fn) { const list = clone(firmBu()); fn(list); S.buFirm = { at: tNow().toISOString(), by: S.person.name || '', list }; saveSettings(); }
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a="buf-add"],[data-a="buf-del"],[data-a="buf-send"]'); if (!a) return;
  if (a.dataset.a === 'buf-send') {
    if (!(await ensureSignKey())) return;
    const u = { id: uid('u'), created: tNow().toISOString(), by: S.person.name || 'Büro', to: { name: '*', nr: '' }, ops: [{ t: 'bu', list: firmBu(), at: tNow().toISOString() }], note: '' };
    const payload = JSON.stringify(u), sig = bytesB64(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, SIGN_KEY, new TextEncoder().encode(payload)));
    shareFile(new Blob([JSON.stringify({ app: 'fruehauf-stempel-update', payload, sig })], { type: 'application/json' }), `Stempeluhr_Betriebsurlaub_${isoToday()}.json`, 'Hallo zusammen, hier der aktuelle Betriebsurlaub für die Stempeluhr. Datei speichern, dann in der App: Einstellungen → Daten → „Aktualisierung vom Büro einspielen“.', 'Betriebsurlaub für alle erstellt');
    return;
  }
  if (!(await needEdit())) return;
  if (a.dataset.a === 'buf-add') { const y = tNow().getFullYear(); buEdit(l => l.push({ name: 'Betriebsurlaub', von: `${y}-12-24`, bis: `${y + 1}-01-01`, abzug: true })); }
  if (a.dataset.a === 'buf-del') { if (!(await confirmDlg('Zeitraum entfernen?', 'Der Betriebsurlaub wird gelöscht – die Tage werden wieder normale Arbeitstage.', 'Entfernen', true))) return; buEdit(l => l.splice(+a.dataset.i, 1)); }
  rerender();
});
document.addEventListener('change', async e => {
  const el = e.target; if (!el.dataset || el.dataset.buf === undefined) return;
  if (!canEdit()) return rerender();
  const i = +el.dataset.buf, k = el.dataset.k, v = el.type === 'checkbox' ? el.checked : el.value;
  if ((k === 'von' || k === 'bis') && !v) return rerender();
  buEdit(l => { if (!l[i]) return; l[i][k] = v; if (l[i].bis < l[i].von) l[i].bis = l[i].von; });
  rerender();
});
/* Aktualisierung „Betriebsurlaub für alle“ */
const _opTextBu = opText;
opText = function (o) { if (o.t === 'bu') return 'Betriebsurlaub für alle: ' + (o.list.map(b => `${b.name || 'Betriebsurlaub'} ${deDate(b.von)} – ${deDate(b.bis)}${b.abzug === false ? ' (zählt nicht)' : ''}`).join(', ') || 'keiner'); return _opTextBu(o); };
const _applyUpdateBu = applyUpdate;
applyUpdate = async function (u) { for (const o of u.ops) if (o.t === 'bu') S.buFirm = { at: o.at || u.created, by: u.by || '', list: o.list }; return _applyUpdateBu(u); };
