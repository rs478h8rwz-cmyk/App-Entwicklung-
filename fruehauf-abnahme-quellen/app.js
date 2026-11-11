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
};

/* =========================================================
   Frühauf – Abnahme & Service
   Eigenständige App: Baustellen-Abnahme und Serviceeinsätze für DC, AC und SHK.
   Daten bleiben auf dem Gerät (IndexedDB), Protokolle als PDF teilen.
   ========================================================= */
const APP_VERSION = '1.7';
let APP_READY = false;   // wird am Ende des App-Starts gesetzt
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = 'x') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = o => JSON.parse(JSON.stringify(o));
const pad2 = n => String(n).padStart(2, '0');
const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
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
        const rq = indexedDB.open('fruehauf-abnahme', 1);
        rq.onupgradeneeded = () => { const d = rq.result; if (!d.objectStoreNames.contains('prot')) d.createObjectStore('prot', { keyPath: 'id' }); if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); };
        rq.onsuccess = () => { DB.db = rq.result; res(); }; rq.onerror = () => res();
      } catch (e) { res(); }
    });
  },
  req(store, mode, fn) { return new Promise((res, rej) => { const tx = DB.db.transaction(store, mode), r = fn(tx.objectStore(store)); tx.oncomplete = () => res(r && r.result); tx.onerror = () => rej(tx.error); }); },
  mem: { prot: new Map(), kv: new Map() },
  get(store, key) { return DB.db ? DB.req(store, 'readonly', s => s.get(key)) : Promise.resolve(DB.mem[store].get(key)); },
  put(store, val, key) { if (!DB.db) { DB.mem[store].set(key ?? val.id, val); return Promise.resolve(); } return DB.req(store, 'readwrite', s => (key !== undefined ? s.put(val, key) : s.put(val))); },
  del(store, key) { if (!DB.db) { DB.mem[store].delete(key); return Promise.resolve(); } return DB.req(store, 'readwrite', s => s.delete(key)); },
  all(store) { return DB.db ? DB.req(store, 'readonly', s => s.getAll()) : Promise.resolve([...DB.mem[store].values()]); }
};

/* ---------- Einstellungen ---------- */
const DEFAULTS = {
  company: { name: 'Frühauf Solar', street: '', city: '', phone: '', email: '', web: '', logo: 'logo.png' },
  design: { mode: 'system', primary: '#0E7C66', secondary: '#F5A524', radius: 14, fontBody: 'Geist', fontHead: 'Instrument Serif' },
  monteure: [],
  state: 'NW',
  zuschlag: { sat: 150, sun: 200, hol: 200, not: 50 },
  lists: {
    grundDC: ['String ausgefallen', 'Modul beschädigt', 'Stecker/Kabel defekt', 'Tierschaden (Marder)', 'Befestigung lose', 'Verschmutzung/Verschattung'],
    grundAC: ['Fehlermeldung Wechselrichter', 'Speicher lädt nicht', 'Keine Verbindung zur App', 'Zähler/Messung falsch', 'Wallbox lädt nicht', 'FI/Sicherung ausgelöst'],
    grundSHK: ['Störung Wärmepumpe (Fehlercode)', 'Kein Warmwasser', 'Heizung bleibt kalt', 'Druckverlust/Undicht', 'Geräusche', 'Regelung/Einstellung'],
    fixDC: ['Stecker getauscht', 'Modul getauscht', 'Kabel erneuert', 'Befestigung nachgezogen', 'Anlage gereinigt'],
    fixAC: ['Neustart/Reset', 'Firmware aktualisiert', 'Einstellungen angepasst', 'Komponente getauscht', 'Sicherung/FI zurückgesetzt'],
    hkRaum: ['Wohnzimmer', 'Esszimmer', 'Küche', 'Schlafzimmer', 'Kinderzimmer', 'Bad', 'Gäste-WC', 'Flur', 'Arbeitszimmer', 'Hauswirtschaftsraum', 'Keller', 'Dachgeschoss'],
    hkTyp: ['Typ 10', 'Typ 11', 'Typ 20', 'Typ 21', 'Typ 22', 'Typ 33', 'Badheizkörper'],
    hkHoehe: ['300 mm', '400 mm', '500 mm', '600 mm', '900 mm'],
    hkLaenge: ['400 mm', '500 mm', '600 mm', '700 mm', '800 mm', '900 mm', '1000 mm', '1100 mm', '1200 mm', '1400 mm', '1600 mm', '1800 mm', '2000 mm', '2300 mm', '2600 mm', '3000 mm'],
    fixSHK: ['Anlage entlüftet', 'Druck aufgefüllt', 'Einstellungen angepasst', 'Bauteil getauscht', 'Filter/Schmutzfänger gereinigt']
  },
  numbers: {},
  /* Wärmepumpen (SHK): Hersteller mit Modellen – in den Einstellungen frei änderbar */
  wps: [
    { id: 'wolf', name: 'Wolf CHA-Monoblock', models: ['CHA-07 (1,6–6,8 kW)', 'CHA-10 (2,2–9,8 kW)', 'CHA-16/20 (3,0–16,7 kW)', 'CHA-20/24 (3,1–19,6 kW)'], multi: true, unit: 'Wärmepumpen (Kaskade)' },
    { id: 'buderus', name: 'Buderus WLW186i', models: ['WLW186i-4', 'WLW186i-5', 'WLW186i-7', 'WLW186i-11', 'WLW186i-13', 'WLW186i-15'], multi: true, unit: 'Wärmepumpen (Kaskade)' },
    { id: 'samsung', name: 'Samsung EHS Mono R290', models: ['AE050 – 5 kW', 'AE080 – 8 kW', 'AE120 – 12 kW (1-phasig)', 'AE120 – 12 kW (3-phasig)', 'AE160 – 16 kW (1-phasig)', 'AE160 – 16 kW (3-phasig)'], multi: true, unit: 'Wärmepumpen (Kaskade)' }
  ],
  /* AC-Systeme: Wechselrichter- und Speichergrößen als Vorauswahl – in den Einstellungen frei änderbar */
  systems: [
    { id: 'ecoflow', name: 'EcoFlow PowerOcean', wr: ['3 kW (1-phasig)', '5 kW (1-phasig)', '6 kW (1-phasig)', '6 kW (3-phasig)', '8 kW (3-phasig)', '10 kW (3-phasig)', '12 kW (3-phasig)'],
      sp: ['5 kWh (1 Modul)', '10 kWh (2 Module)', '15 kWh (3 Module)', '20 kWh (4 Module)', '25 kWh (5 Module)', '30 kWh (6 Module)', '35 kWh (7 Module)', '40 kWh (8 Module)', '45 kWh (9 Module)'], multi: true, unit: 'Wechselrichter' },
    { id: 'tesla', name: 'Tesla Powerwall 3', wr: ['Powerwall 3 (1-phasig, integriert)', 'Powerwall 3P (3-phasig, integriert)'],
      sp: ['13,5 kWh (1 Einheit)', '27 kWh (2 Einheiten)', '40,5 kWh (3 Einheiten)', '54 kWh (4 Einheiten)', '67,5 kWh (5 Einheiten)', '81 kWh (6 Einheiten)', '94,5 kWh (7 Einheiten)'], multi: true, unit: 'Powerwalls' },
    { id: 'e3dc', name: 'E3/DC One', wr: ['12 kW Hybrid (integriert)'],
      sp: ['one 6 – 5,5 kWh', 'one 9 – 8,7 kWh', 'one 12 – 11,8 kWh', 'erweitert – bis 15 kWh', '2 Türme – bis ca. 30 kWh'], multi: true, unit: 'Geräte' }
  ]
};
let S = clone(DEFAULTS);
function deepMerge(base, add) {
  if (Array.isArray(base) || typeof base !== 'object' || base === null) return add === undefined ? base : add;
  const out = { ...base }; for (const k in add) out[k] = k in base && typeof base[k] === 'object' && !Array.isArray(base[k]) && base[k] !== null ? deepMerge(base[k], add[k]) : add[k]; return out;
}
async function loadSettings() { const s = await DB.get('kv', 'settings'); S = deepMerge(clone(DEFAULTS), s || {}); fixSettings(); }
/* Ältere Stände: Monteure als reine Namen → mit Gewerk-Zuordnung */
function fixSettings() { S.monteure = (S.monteure || []).map(m => (typeof m === 'string' ? { name: m, gw: [] } : m)); if (!Array.isArray(S.systems)) S.systems = clone(DEFAULTS.systems); if (!Array.isArray(S.wps)) S.wps = clone(DEFAULTS.wps); }
const monteureFor = g => S.monteure.filter(m => m.gw.includes(g));
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
function holiday(iso, st = S.state) {
  if (!iso) return ''; const d = new Date(iso + 'T12:00'), y = d.getFullYear(), E = easter(y), off = n => { const x = new Date(E); x.setDate(x.getDate() + n); return x; };
  const same = (a, b) => a.getMonth() === b.getMonth() && a.getDate() === b.getDate(), md = (m, dd) => new Date(y, m - 1, dd, 12);
  const bb = (() => { const x = md(11, 22); while (x.getDay() !== 3) x.setDate(x.getDate() - 1); return x; })();
  const list = [[md(1, 1), 'Neujahr'], [off(-2), 'Karfreitag'], [off(1), 'Ostermontag'], [md(5, 1), 'Tag der Arbeit'], [off(39), 'Christi Himmelfahrt'], [off(50), 'Pfingstmontag'], [md(10, 3), 'Tag der Deutschen Einheit'], [md(12, 25), '1. Weihnachtstag'], [md(12, 26), '2. Weihnachtstag'],
    [md(1, 6), 'Heilige Drei Könige', 'BW BY ST'], [md(3, 8), 'Frauentag', 'BE MV'], [off(60), 'Fronleichnam', 'BW BY HE NW RP SL'], [md(8, 15), 'Mariä Himmelfahrt', 'SL'], [md(9, 20), 'Weltkindertag', 'TH'],
    [md(10, 31), 'Reformationstag', 'BB HB HH MV NI SN ST SH TH'], [md(11, 1), 'Allerheiligen', 'BW BY NW RP SL'], [bb, 'Buß- und Bettag', 'SN']];
  const hit = list.find(([x, , only]) => same(x, d) && (!only || only.split(' ').includes(st)));
  return hit ? hit[1] : '';
}
/* Zuschlag eines Einsatztags: Werktag 100 %, Samstag 150 %, Sonntag/Feiertag 200 %, Notdienst +50 % */
function zuschlag(iso, notdienst) {
  const z = S.zuschlag, hol = holiday(iso), wd = iso ? new Date(iso + 'T12:00').getDay() : 1;
  let base = 100, typ = 'Werktag';
  if (hol) { base = +z.hol; typ = 'Feiertag – ' + hol; } else if (wd === 0) { base = +z.sun; typ = 'Sonntag'; } else if (wd === 6) { base = +z.sat; typ = 'Samstag'; }
  const nd = notdienst ? +z.not : 0;
  return { typ, base, nd, total: base + nd, label: `${base} %${nd ? ` + ${nd} % Notdienst` : ''}` };
}
const durH = e => { if (!e || !e.von || !e.bis) return 0; const [a, b] = e.von.split(':').map(Number), [c, d] = e.bis.split(':').map(Number); let m = c * 60 + d - (a * 60 + b); if (m < 0) m += 1440; m -= +e.pause || 0; return Math.max(0, m / 60); };

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
   Fragenkataloge
   Feld: { id, label, type, req, opts (Liste oder Funktion), show (Bedingung), ph, hint, chips }
   Typen: text, textarea, number, date, phone, radio, multiday, items, einsaetze, thumbs
   ========================================================= */
const YN = [['ja', 'Ja'], ['nein', 'Nein']];
const o = arr => arr.map(x => (Array.isArray(x) ? x : [x, x]));

const KOPF_ABNAHME = [
  { id: 'kunde', label: 'Kundenname', type: 'text', req: true, ph: 'Vor- und Nachname' },
  { id: 'adresse', label: 'Adresse der Baustelle', type: 'text', req: true, ph: 'Straße, PLZ, Ort' },
  { id: 'datum', label: 'Datum', type: 'date', req: true },
  { id: 'monteur', label: 'Monteur(e)', type: 'monteur', req: true, ph: 'Name(n) – oder unten antippen' },
  { id: 'projekt', label: 'Baustelle / Projektbezeichnung', type: 'text', ph: 'z. B. Projektnummer' },
  { id: 'tage', label: 'An welchen Tagen war der Monteur vor Ort?', type: 'multiday', req: true }
];

/* ---------- Abnahme DC ---------- */
const steil = a => a.dachart === 'steildach' || a.dachart === 'beides', flach = a => a.dachart === 'flachdach' || a.dachart === 'beides';
const ABNAHME_DC = [
  { title: 'Kopfdaten', sub: 'Kunde, Baustelle und Einsatztage.', fields: KOPF_ABNAHME },
  { title: 'Module', sub: 'Angaben zu den verbauten PV-Modulen.', fields: [
    { id: 'module_typ', label: 'Welche Module wurden verbaut?', type: 'textarea', req: true, ph: 'Hersteller, Typ, Leistung' },
    { id: 'module_anzahl', label: 'Wie viele Module wurden verbaut?', type: 'number', req: true, unit: 'Stk' }] },
  { title: 'Dachart', sub: 'Welche Dachart hat die Anlage?', fields: [
    { id: 'dachart', label: 'Dachart', type: 'radio', req: true, opts: [['steildach', 'Steildach'], ['flachdach', 'Flachdach'], ['beides', 'Beides']] }] },
  { title: 'Gerüst', sub: 'Angaben zum Gerüst.', fields: [
    { id: 'geruest', label: 'Wurde ein Gerüst gestellt?', type: 'radio', req: true, opts: [['uns', 'Ja, von uns'], ['geruestbauer', 'Ja, von einem Gerüstbauer'], ['nein', 'Nein']] },
    { id: 'geruest_art', label: 'Welche Art von Gerüst?', type: 'radio', req: true, show: a => a.geruest === 'uns', opts: [['turm', 'Turm'], ['fang', 'Fanggerüst']] },
    { id: 'geruest_menge', label: 'Menge (Felder / laufende Meter)', type: 'text', req: true, show: a => a.geruest === 'uns', ph: 'z. B. 12 Felder oder 24 lfm' },
    { id: 'geruest_seiten', label: 'Welche Dachseiten wurden eingerüstet?', type: 'text', req: true, show: a => a.geruest === 'uns', ph: 'z. B. Süd, West' }] },
  { title: 'Strings – Steildach', sub: 'Wie wurden die Strings verbaut? Beispiel: Süd 1×10, West 1×7', show: steil, fields: [
    { id: 'strings_steil', label: 'Strings (Steildach)', type: 'textarea', req: true, ph: 'Süd 1x10\nWest 1x7' },
    { id: 'dachhaken', label: 'Wie viele Dachhaken wurden verbaut?', type: 'number', req: true, unit: 'Stk' },
    { id: 'schiene', label: 'Wie viele Meter Schiene wurden verbaut?', type: 'number', req: true, unit: 'm' }] },
  { title: 'Strings – Flachdach', sub: 'Beispiel: Ost 1×12, West 1×12, Süd 2×12', show: flach, fields: [
    { id: 'strings_flach', label: 'Strings (Flachdach)', type: 'textarea', req: true, ph: 'Ost 1x12\nWest 1x12' }] },
  { title: 'Verkabelung', sub: 'Stringkabel und Kabelweg.', fields: [
    { id: 'stringkabel', label: 'Wie viele Meter Stringkabel wurden verbaut?', type: 'number', req: true, unit: 'm' },
    { id: 'kabelweg', label: 'Wie wurde der Kabelweg gelöst?', type: 'radio', req: true, opts: [['fassade', 'Fassade'], ['schornstein', 'Schornstein'], ['kabelschacht', 'Kabelschacht'], ['sonstiges', 'Sonstiges']] },
    { id: 'kabelweg_text', label: 'Kabelweg – bitte beschreiben', type: 'text', req: true, show: a => a.kabelweg === 'sonstiges' }] },
  { title: 'Flachlüfter', sub: '', fields: [
    { id: 'flachluefter', label: 'Wurden Flachlüfter verbaut?', type: 'radio', req: true, opts: YN },
    { id: 'flachluefter_anz', label: 'Wie viele Flachlüfter?', type: 'number', req: true, unit: 'Stk', show: a => a.flachluefter === 'ja' }] },
  { title: 'Material & Sonstiges', sub: 'Zusätzliches Material oder Hinweise.', fields: [
    { id: 'material', label: 'Zusätzliches Material', type: 'items' },
    { id: 'sonstiges', label: 'Sonstige Informationen', type: 'textarea' }] },
  { title: 'Restarbeiten', sub: '', fields: [
    { id: 'rest', label: 'Sind noch Restarbeiten offen?', type: 'radio', req: true, opts: YN },
    { id: 'rest_text', label: 'Welche Restarbeiten sind offen?', type: 'textarea', req: true, show: a => a.rest === 'ja' },
    { id: 'rest_ok', type: 'thumbs', show: a => a.rest === 'nein' }] },
  { title: 'Kundenwünsche', sub: '', fields: [
    { id: 'zusatz', label: 'Wünscht der Kunde Zusatzarbeiten?', type: 'textarea' }] }
];

/* ---------- Abnahme AC ---------- */
const sysOf = a => S.systems.find(x => x.id === a.system);
const ABNAHME_AC = [
  { title: 'Kopfdaten', sub: 'Kunde, Baustelle und Einsatztage.', fields: KOPF_ABNAHME },
  { title: 'Installation', sub: '', fields: [
    { id: 'installation', label: 'Was wurde installiert?', type: 'radio', req: true, opts: [['pv', 'Photovoltaik'], ['wp', 'Wärmepumpe'], ['beides', 'Beides']] }] },
  { title: 'System & Wechselrichter', sub: 'Welches System wurde verbaut?', fields: [
    { id: 'system', label: 'System', type: 'radio', req: true, opts: () => S.systems.map(x => [x.id, x.name]).concat([['sonstige', 'Sonstiges System']]) },
    { id: 'system_text', label: 'Welches System?', type: 'text', req: true, show: a => a.system === 'sonstige' },
    { id: 'wr_groesse', label: 'Wechselrichter', type: 'radio', req: true, show: a => sysOf(a) && sysOf(a).wr.length, opts: a => sysOf(a).wr.map(x => [x, x]).concat([['andere', 'Andere Größe']]) },
    { id: 'wr_text', label: 'Größe des Wechselrichters', type: 'text', req: true, ph: 'z. B. 10 kW', show: a => !a.system || a.system === 'sonstige' || !(sysOf(a) && sysOf(a).wr.length) || a.wr_groesse === 'andere' },
    { id: 'mehrere', label: a => `Wurde mehr als ein Gerät verbaut${sysOf(a) ? ` (${sysOf(a).unit || 'Geräte'})` : ''}?`, type: 'radio', req: true, show: a => sysOf(a) && sysOf(a).multi, opts: YN },
    { id: 'anzahl', label: 'Wie viele insgesamt?', type: 'number', req: true, unit: 'Stk', show: a => sysOf(a) && sysOf(a).multi && a.mehrere === 'ja' }] },
  { title: 'Speicher', sub: '', fields: [
    { id: 'speicher', label: 'Speicher vorhanden?', type: 'radio', req: true, opts: YN },
    { id: 'speicher_groesse', label: 'Speichergröße (gesamt)', type: 'radio', req: true, show: a => a.speicher === 'ja' && sysOf(a) && sysOf(a).sp.length, opts: a => sysOf(a).sp.map(x => [x, x]).concat([['andere', 'Andere Größe']]) },
    { id: 'speicher_text', label: 'Größe des Speichers', type: 'text', req: true, ph: 'z. B. 10 kWh', show: a => a.speicher === 'ja' && (!(sysOf(a) && sysOf(a).sp.length) || a.speicher_groesse === 'andere') }] },
  { title: 'Wallbox & Heizstab', sub: '', fields: [
    { id: 'wallbox', label: 'Wallbox vorhanden?', type: 'radio', req: true, opts: YN },
    { id: 'wallbox_typ', label: 'Welche Wallbox?', type: 'text', req: true, show: a => a.wallbox === 'ja' },
    { id: 'heizstab', label: 'Wurde ein Heizstab angeschlossen?', type: 'radio', req: true, opts: YN }] },
  { title: 'Zählerkasten', sub: '', fields: [
    { id: 'zk', label: 'Zusätzlicher Zählerkasten?', type: 'radio', req: true, opts: YN },
    { id: 'zk_typ', label: 'Welcher Zählerkasten?', type: 'radio', req: true, show: a => a.zk === 'ja', opts: [['2reihig', '2-reihig'], ['3reihig', '3-reihig'], ['sonstige', 'Sonstige']] },
    { id: 'zk_text', label: 'Bitte beschreiben', type: 'text', req: true, show: a => a.zk === 'ja' && a.zk_typ === 'sonstige' }] },
  { title: 'Stromzähler fotografiert?', sub: 'Pflicht: Zählernummer und Zählerstand müssen per Foto dokumentiert sein.', danger: true, fields: [
    { id: 'zaehler_foto', label: 'Wurde der Stromzähler fotografiert?', type: 'radio', req: true, opts: YN, danger: true }], block: a => a.zaehler_foto === 'nein' && 'Bitte zuerst den Stromzähler fotografieren – sonst kann das Protokoll nicht abgeschlossen werden.' },
  { title: 'Material & Mehraufwand', sub: '', fields: [
    { id: 'material', label: 'Zusätzliches Material', type: 'items' },
    { id: 'mehraufwand', label: 'Ist Mehraufwand entstanden?', type: 'radio', req: true, opts: YN },
    { id: 'mehraufwand_text', label: 'Beschreibung des Mehraufwands', type: 'textarea', req: true, show: a => a.mehraufwand === 'ja' }] },
  { title: 'Baustelle', sub: '', fields: [
    { id: 'fertig', label: 'Baustelle abgeschlossen?', type: 'radio', req: true, opts: YN },
    { id: 'rest_text', label: 'Welche Restarbeiten sind offen?', type: 'textarea', req: true, show: a => a.fertig === 'nein' },
    { id: 'rest_ok', type: 'thumbs', show: a => a.fertig === 'ja' }] },
  { title: 'Kundenwünsche & Einweisung', sub: '', fields: [
    { id: 'zusatz', label: 'Wünscht der Kunde zusätzliche Arbeiten?', type: 'textarea' },
    { id: 'einweisung', label: 'Wurde der Kunde in Anlage und App eingewiesen?', type: 'radio', req: true, opts: YN }] }
];

/* ---------- Abnahme SHK ---------- */
const wpOf = a => S.wps.find(x => x.id === a.wp_hersteller);
const ABNAHME_SHK = [
  { title: 'Kopfdaten', sub: 'Kunde, Baustelle und Einsatztage.', fields: KOPF_ABNAHME },
  { title: 'Wärmepumpe', sub: 'Welche Wärmepumpe wurde verbaut?', fields: [
    { id: 'wp_hersteller', label: 'Hersteller / Baureihe', type: 'radio', req: true, opts: () => S.wps.map(x => [x.id, x.name]).concat([['sonstige', 'Sonstige']]) },
    { id: 'wp_modell', label: 'Modell', type: 'radio', req: true, show: a => wpOf(a) && wpOf(a).models.length, opts: a => wpOf(a).models.map(x => [x, x]).concat([['andere', 'Anderes Modell']]) },
    { id: 'wp_text', label: 'Hersteller und Modell', type: 'text', req: true, show: a => a.wp_hersteller === 'sonstige' || (wpOf(a) && !wpOf(a).models.length) || a.wp_modell === 'andere' },
    { id: 'wp_mehrere', label: 'Wurde mehr als eine Wärmepumpe verbaut (Kaskade)?', type: 'radio', req: true, show: a => wpOf(a) && wpOf(a).multi, opts: YN },
    { id: 'wp_anzahl', label: 'Wie viele Wärmepumpen insgesamt?', type: 'number', req: true, unit: 'Stk', show: a => wpOf(a) && wpOf(a).multi && a.wp_mehrere === 'ja' }] },
  { title: 'Rohr & Fittinge', sub: '', fields: [
    { id: 'rohr_m', label: 'Wie viele Meter Rohr wurden verwendet?', type: 'number', req: true, unit: 'm' },
    { id: 'rohr_verlegung', label: 'Wärmepumpenrohr verlegt', type: 'radio', req: true, opts: [['ueber', 'Überirdisch'], ['unter', 'Unterirdisch'], ['beides', 'Beides']] },
    { id: 'rohr_ueber', label: 'Wie viele Meter überirdisch?', type: 'number', req: true, unit: 'm', show: a => a.rohr_verlegung === 'ueber' || a.rohr_verlegung === 'beides' },
    { id: 'rohr_unter', label: 'Wie viele Meter unterirdisch?', type: 'number', req: true, unit: 'm', show: a => a.rohr_verlegung === 'unter' || a.rohr_verlegung === 'beides' },
    { id: 'fittinge', label: 'Welche Fittinge wurden verwendet?', type: 'items', ph: 'z. B. Winkel 90°' }] },
  { title: 'Befüllung', sub: '', fields: [
    { id: 'befuellung', label: 'Zum Befüllen verwendet', type: 'radio', req: true, opts: [['heaty', 'UWS Heaty'], ['spuelwagen', 'Spülwagen']] },
    { id: 'kartusche', label: 'Wurde die Kartusche getauscht?', type: 'radio', req: true, show: a => a.befuellung === 'heaty', opts: YN }] },
  { title: 'Ausdehnung & Entlüfter', sub: '', fields: [
    { id: 'ag_anz', label: 'Wie viele Ausdehnungsgefäße wurden gesetzt?', type: 'number', req: true, unit: 'Stk' },
    { id: 'ag_druck', label: 'Mit welchem Druck?', type: 'number', req: true, unit: 'bar' },
    { id: 'se_anz', label: 'Wie viele Schnellentlüfter?', type: 'number', req: true, unit: 'Stk' },
    { id: 'kh_anz', label: 'Wie viele Kugelhähne?', type: 'number', req: true, unit: 'Stk' },
    { id: 'zirkulation', label: 'Wurde eine Zirkulationspumpe verbaut?', type: 'radio', req: true, opts: YN }] },
  { title: 'Speicher', sub: '', fields: [
    { id: 'ww', label: 'Warmwasserspeicher vorhanden?', type: 'radio', req: true, opts: YN },
    { id: 'ww_groesse', label: 'Größe Warmwasserspeicher', type: 'text', req: true, show: a => a.ww === 'ja', ph: 'z. B. 300 l' },
    { id: 'puffer', label: 'Größe Pufferspeicher (falls vorhanden)', type: 'text' },
    { id: 'kombi', label: 'Größe Kombispeicher (falls vorhanden)', type: 'text' }] },
  { title: 'Isolierung', sub: '', fields: [
    { id: 'iso', label: 'Wurde die Anlage vollständig isoliert?', type: 'radio', req: true, opts: YN },
    { id: 'iso_fehlt', label: 'Wie viele Meter fehlen?', type: 'number', req: true, unit: 'm', show: a => a.iso === 'nein' },
    { id: 'iso_dim', label: 'Welche Dimension?', type: 'text', req: true, show: a => a.iso === 'nein' }] },
  { title: 'Verteiler & Ventile', sub: '', fields: [
    { id: 'vt', label: 'Fußbodenverteiler getauscht?', type: 'radio', req: true, opts: YN },
    { id: 'vt_anz', label: 'Wie viele?', type: 'number', req: true, unit: 'Stk', show: a => a.vt === 'ja' },
    { id: 'vt_art', label: 'Welche Art?', type: 'text', req: true, show: a => a.vt === 'ja' },
    { id: 'ventile', label: 'Ventile getauscht?', type: 'radio', req: true, opts: YN },
    { id: 'ventile_anz', label: 'Wie viele Ventile?', type: 'number', req: true, unit: 'Stk', show: a => a.ventile === 'ja' },
    { id: 'thermo', label: 'Thermostatköpfe getauscht?', type: 'radio', req: true, opts: YN },
    { id: 'thermo_anz', label: 'Wie viele Thermostatköpfe?', type: 'number', req: true, unit: 'Stk', show: a => a.thermo === 'ja' }] },
  { title: 'Heizkörper', sub: '', fields: [
    { id: 'hk', label: 'Heizkörper getauscht?', type: 'radio', req: true, opts: YN },
    { id: 'hk_liste', label: 'Welche Heizkörper? (je Heizkörper Raum, Typ und Maße)', type: 'heizkoerper', req: true, show: a => a.hk === 'ja' }] },
  { title: 'Inbetriebnahme', sub: '', fields: [
    { id: 'ibn_fehler', label: 'Gab es bei der Inbetriebnahme einen Fehler?', type: 'radio', req: true, opts: YN },
    { id: 'ibn_text', label: 'Welcher Fehler?', type: 'text', req: true, show: a => a.ibn_fehler === 'ja' },
    { id: 'ibn_behoben', label: 'Wurde der Fehler behoben?', type: 'radio', req: true, show: a => a.ibn_fehler === 'ja', opts: YN }] },
  { title: 'Restarbeiten', sub: '', fields: [
    { id: 'material', label: 'Zusätzliches Material', type: 'items' },
    { id: 'rest', label: 'Restarbeiten offen?', type: 'radio', req: true, opts: YN },
    { id: 'rest_text', label: 'Beschreibung', type: 'textarea', req: true, show: a => a.rest === 'ja' },
    { id: 'rest_ok', type: 'thumbs', show: a => a.rest === 'nein' }] },
  { title: 'Kundenwünsche & Einweisung', sub: '', fields: [
    { id: 'zusatz', label: 'Wünscht der Kunde zusätzliche Arbeiten?', type: 'textarea' },
    { id: 'einweisung', label: 'Wurde der Kunde in Anlage und App eingewiesen?', type: 'radio', req: true, opts: YN }] }
];

/* ---------- Serviceauftrag (für jedes Gewerk) ---------- */
function serviceSteps(g) {
  return [
    { title: 'Auftrag', sub: 'Kunde und Monteur.', fields: [
      { id: 'kunde', label: 'Kundenname', type: 'text', req: true, ph: 'Vor- und Nachname' },
      { id: 'adresse', label: 'Adresse', type: 'text', req: true, ph: 'Straße, PLZ, Ort' },
      { id: 'telefon', label: 'Telefon (optional)', type: 'phone' },
      { id: 'auftrag', label: 'Auftrags- / Ticketnummer (optional)', type: 'text' },
      { id: 'monteur', label: 'Monteur(e)', type: 'monteur', req: true, ph: 'Name(n) – oder unten antippen' }] },
    { title: 'Einsatz & Zeiten', sub: 'Wann und wie lange war der Monteur vor Ort?', fields: [
      { id: 'notdienst', label: 'War es ein Notfall (Notdienst-Einsatz)?', type: 'radio', req: true, opts: YN, hint: () => `Zuschläge: Samstag ${S.zuschlag.sat} %, Sonntag ${S.zuschlag.sun} %, Feiertag ${S.zuschlag.hol} % – im Notdienst jeweils + ${S.zuschlag.not} % (auch werktags).` },
      { id: 'einsaetze', label: 'Einsätze', type: 'einsaetze', req: true }] },
    { title: 'Grund', sub: 'Warum wurde der Service gerufen?', fields: [
      { id: 'grund', label: 'Grund / Störung', type: 'textarea', req: true, chips: () => S.lists['grund' + g], ph: 'Was war das Problem?' },
      { id: 'fehlercode', label: 'Fehlercode (falls angezeigt)', type: 'text' }] },
    { title: 'Behebung', sub: 'Wie wurde es behoben?', fields: [
      { id: 'behoben', label: 'Wurde das Problem behoben?', type: 'radio', req: true, opts: [['ja', 'Ja, vollständig'], ['teilweise', 'Teilweise'], ['nein', 'Nein']] },
      { id: 'behebung', label: 'Wie wurde es behoben bzw. was wurde gemacht?', type: 'textarea', req: true, chips: () => S.lists['fix' + g] },
      { id: 'folge', label: 'Was ist noch zu tun?', type: 'textarea', req: true, show: a => a.behoben && a.behoben !== 'ja', ph: 'z. B. Ersatzteil bestellen, zweiter Termin' }] },
    { title: 'Material', sub: 'Welches Material wurde verwendet?', fields: [
      { id: 'mat_ja', label: 'Wurde Material verwendet?', type: 'radio', req: true, opts: YN },
      { id: 'material', label: 'Material', type: 'items', req: true, show: a => a.mat_ja === 'ja', ph: 'z. B. MC4-Stecker' }] },
    { title: 'Hinweise', sub: 'Optional.', fields: [
      { id: 'hinweis', label: 'Hinweise für den Kunden oder das Büro', type: 'textarea' }] }
  ];
}

const GEWERKE = {
  DC: { name: 'DC-Montage', desc: 'Module, Strings, Gerüst, Verkabelung', icon: 'sun', color: '#F5A524' },
  AC: { name: 'AC-Montage', desc: 'Wechselrichter, Speicher, Wallbox, Zählerkasten', icon: 'bolt', color: '#3B82F6' },
  SHK: { name: 'SHK', desc: 'Wärmepumpe, Rohrleitungen, Heizkörper', icon: 'flame', color: '#E5484D' }
};
const TYPES = { abnahme: { name: 'Baustellen-Abnahme', short: 'Abnahme', icon: 'hard', pre: 'AB' }, service: { name: 'Serviceauftrag', short: 'Service', icon: 'wrench', pre: 'SV' } };
const stepsOf = r => (r.type === 'service' ? serviceSteps(r.gewerk) : { DC: ABNAHME_DC, AC: ABNAHME_AC, SHK: ABNAHME_SHK }[r.gewerk]);

/* =========================================================
   Oberfläche
   ========================================================= */
const UI = { route: 'home', step: 0, maxStep: 0, viewId: null, q: '', fType: '', fGew: '', tab: 'firma' };
let CUR = null;            // aktuelles Protokoll in Bearbeitung (Entwurf)
let PROTS = [];            // abgeschlossene Protokolle

/* ---------- Entwurf ---------- */
let DRAFT_T = null;
function saveDraft(now) { clearTimeout(DRAFT_T); const go = () => (CUR ? DB.put('kv', clone(CUR), 'draft') : DB.del('kv', 'draft')); if (now) return go(); DRAFT_T = setTimeout(go, 300); }
function nextNumber(type, g) {
  const y = new Date().getFullYear(), key = `${TYPES[type].pre}-${g}-${y}`;
  S.numbers[key] = (S.numbers[key] || 0) + 1; saveSettings();
  return `${key}-${String(S.numbers[key]).padStart(4, '0')}`;
}
function newRecord(type, g) {
  const r = { id: uid('p'), type, gewerk: g, nr: nextNumber(type, g), created: Date.now(), updated: Date.now(), answers: {}, photos: [], sig: { monteur: { ort: '', datum: isoToday(), data: '' }, kunde: { ort: '', datum: isoToday(), data: '', absent: false } } };
  if (type === 'abnahme') r.answers.datum = isoToday();
  else r.answers.einsaetze = [{ id: uid('e'), datum: isoToday(), von: '', bis: '', pause: '' }];
  const mg = monteureFor(g); if (mg.length === 1) r.answers.monteur = mg[0].name;
  return r;
}

/* ---------- Sichtbare Schritte und Felder ---------- */
const visSteps = r => stepsOf(r).filter(s => !s.show || s.show(r.answers));
const visFields = (r, s) => s.fields.filter(f => !f.show || f.show(r.answers));
const EXTRA = [['fotos', 'Fotos'], ['sig_monteur', 'Unterschrift Monteur'], ['sig_kunde', 'Unterschrift Kunde'], ['summary', 'Zusammenfassung']];
const screens = r => visSteps(r).map(s => ['step', s.title, s]).concat(EXTRA.map(([k, t]) => [k, t]));
const optsOf = (f, a = {}) => (typeof f.opts === 'function' ? f.opts(a) : f.opts || []);
const labOf = (f, a = {}) => (typeof f.label === 'function' ? f.label(a) : f.label);
const filled = v => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== '');

/* Wert für Anzeige und PDF */
function fmtValue(r, f) {
  const v = r.answers[f.id];
  if (f.type === 'radio') return (optsOf(f, r.answers).find(x => x[0] === v) || [v, v])[1];
  if (f.type === 'multiday') return (v || []).map(d => `${wdOf(d).slice(0, 2)}, ${deDate(d)}`).join('\n');
  if (f.type === 'heizkoerper') return (v || []).map((x, i) => `${i + 1}. ${x.raum} – ${x.typ}, ${x.h} × ${x.l}`).join('\n');
  if (f.type === 'items') return (v || []).map(x => `${x.q || 1} ${x.u || 'Stk'} × ${x.n}`).join('\n');
  if (f.type === 'einsaetze') return (v || []).map(e => { const z = zuschlag(e.datum, r.answers.notdienst === 'ja'); return `${wdOf(e.datum).slice(0, 2)}, ${deDate(e.datum)} · ${e.von || '?'}–${e.bis || '?'} Uhr${+e.pause ? ` (−${e.pause} Min. Pause)` : ''} · ${hrs(durH(e))} · ${z.typ}: ${z.label}`; }).join('\n');
  if (f.type === 'date') return v ? `${wdOf(v).slice(0, 2)}, ${deDate(v)}` : '';
  if (f.type === 'number') return v !== undefined && v !== '' ? `${v}${f.unit ? ' ' + f.unit : ''}` : '';
  return v ?? '';
}
function stepIssues(r, s) {
  const a = r.answers, bad = [];
  for (const f of visFields(r, s)) {
    if (!f.req) continue; const v = a[f.id];
    if (f.type === 'einsaetze') { if (!(v || []).length || v.some(e => !e.datum || !e.von || !e.bis)) bad.push(f.id); continue; }
    if (!filled(v)) bad.push(f.id);
  }
  return bad;
}
const serviceHours = r => (r.answers.einsaetze || []).reduce((s, e) => s + durH(e), 0);

/* ---------- Rahmen ---------- */
function logoMark(h = 34) {
  const l = S.company.logo;
  return l ? `<span class="inline-grid place-items-center rounded-[10px] bg-white px-2" style="height:${h}px"><img src="${esc(l)}" alt="" style="max-height:${h - 8}px;max-width:${h * 3.2}px"></span>` : `<span class="w-9 h-9 rounded-[10px] grid place-items-center text-white" style="background:rgb(var(--p-rgb))">${ic('check', 18, 2.4)}</span>`;
}
/* Zurück zu lumbra.desk (Startseite mit allen Apps) */
const ldHome = (s = 36) => `<a href="../" class="shrink-0 rounded-[10px] overflow-hidden block" style="width:${s}px;height:${s}px;background:#242E48" title="Zurück zu lumbra.desk" aria-label="Zurück zu lumbra.desk"><img src="../icon-192.png" width="${s}" height="${s}" alt="" style="display:block"></a>`;
function shell(inner) {
  const nav = [['home', 'Start', 'grid', '#/'], ['list', 'Protokolle', 'file', '#/protokolle'], ['settings', 'Einstellungen', 'gear', '#/einstellungen']];
  return `<header class="sticky top-0 z-40 border-b border-line backdrop-blur-xl" style="background:color-mix(in srgb,var(--bg) 86%,transparent);padding-top:env(safe-area-inset-top)">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
      ${ldHome()}<a href="#/" class="flex items-center gap-3 min-w-0">${logoMark()}<span class="hidden sm:block leading-tight"><span class="block font-semibold text-[15px]">Abnahme &amp; Service</span><span class="block text-[12px] text-ink3">${esc(S.company.name)}</span></span></a>
      <nav class="ml-auto flex items-center gap-1">${nav.map(([k, l, i, h]) => `<a href="${h}" class="navl ${UI.route === k || (k === 'list' && UI.route === 'view') ? 'on' : ''}" aria-label="${l}">${ic(i, 17)}<span class="hidden md:inline">${l}</span></a>`).join('')}
      <button class="btn-p !h-10 !px-4 ml-1" data-a="new">${ic('plus', 17)}<span class="hidden sm:inline">Neues Protokoll</span></button></nav>
    </div></header>
    <main class="max-w-6xl mx-auto px-4 sm:px-6 pb-28">${inner}</main>
    <datalist id="dl-monteure">${S.monteure.map(m => `<option value="${esc(m.name)}">`).join('')}</datalist>`;
}

/* ---------- Startseite ---------- */
function gewerkCard(g, k) {
  return `<button class="card p-5 text-left flex items-start gap-4 hover:border-line2 transition-colors w-full" data-a="pick" data-g="${k}">
    <span class="w-12 h-12 rounded-[var(--rb)] grid place-items-center shrink-0" style="background:${rgba(g.color, 0.14)};color:${g.color}">${ic(g.icon, 24)}</span>
    <span class="min-w-0 flex-1"><span class="block font-semibold text-[17px]">${g.name}</span><span class="block text-[13px] text-ink3 mt-0.5">${g.desc}</span>
    <span class="flex gap-1.5 mt-3"><span class="badge bg-raised text-ink2">${ic('hard', 13)}Abnahme</span><span class="badge bg-raised text-ink2">${ic('wrench', 13)}Service</span></span></span>
    <span class="text-ink3 mt-1">${ic('arrowR', 18)}</span></button>`;
}
function protRow(p) {
  const g = GEWERKE[p.gewerk], t = TYPES[p.type], date = p.type === 'service' ? (p.answers.einsaetze || [])[0]?.datum : p.answers.datum;
  return `<div class="card p-4 flex items-center gap-3 sm:gap-4">
    <span class="w-11 h-11 rounded-[var(--rb)] grid place-items-center shrink-0" style="background:${rgba(g.color, 0.14)};color:${g.color}">${ic(t.icon, 20)}</span>
    <button class="min-w-0 flex-1 text-left" data-a="view" data-id="${p.id}"><span class="flex flex-wrap items-center gap-x-2 gap-y-1"><b class="font-semibold text-[15px] truncate">${esc(p.answers.kunde || 'Ohne Namen')}</b><span class="badge ${p.type === 'service' ? 'bg-tyel text-yel-ink' : 'bg-tgrn text-p'}">${t.short} · ${p.gewerk}</span>${p.type === 'service' && p.answers.notdienst === 'ja' ? '<span class="badge bg-tred text-red-ink">Notdienst</span>' : ''}</span>
      <span class="block text-[13px] text-ink3 truncate mt-0.5"><span class="mono">${esc(p.nr)}</span> · ${deDate(date)} · ${esc(p.answers.adresse || '')}</span></button>
    <button class="btn-g !px-2.5" data-a="pdf" data-id="${p.id}" title="PDF teilen">${ic('share', 17)}<span class="hidden sm:inline">PDF</span></button></div>`;
}
function viewHome() {
  const recent = PROTS.slice().sort((a, b) => b.updated - a.updated).slice(0, 5);
  const draft = CUR ? (() => { const sc = screens(CUR), i = Math.min(UI.maxStep || 0, sc.length - 1); return `<div class="card p-5 mt-6 flex flex-wrap items-center gap-4 border-p/40" style="background:rgb(var(--p-rgb)/.06)">
      <span class="w-11 h-11 rounded-[var(--rb)] grid place-items-center bg-p/15 text-p shrink-0">${ic('edit', 20)}</span>
      <div class="flex-1 min-w-[200px]"><div class="font-semibold">Weitermachen: ${TYPES[CUR.type].name} · ${GEWERKE[CUR.gewerk].name}</div><div class="text-[13px] text-ink3 mt-0.5">${esc(CUR.answers.kunde || 'Noch kein Kunde')} · <span class="mono">${esc(CUR.nr)}</span> · ${sc.length} Schritte</div></div>
      <div class="flex gap-2"><button class="btn-p" data-a="resume">Fortsetzen ${ic('arrowR', 16)}</button><button class="btn-g" data-a="discard">${ic('trash', 16)}</button></div></div>`; })() : '';
  return `<section class="pt-10 sm:pt-14">
      <span class="mono text-[12px] text-ink2 inline-flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-s"></span>${esc(S.company.name)}</span>
      <h1 class="h-font text-[44px] sm:text-[60px] leading-[1] mt-4">Abnahme &amp; Service.</h1>
      <p class="text-ink2 text-[16px] mt-4 max-w-xl">Baustellen sauber abnehmen und Serviceeinsätze dokumentieren – Schritt für Schritt, mit Fotos und Unterschrift, als PDF zum Teilen.</p>
      ${draft}
      <h2 class="sec-t mt-10 mb-4">Neues Protokoll – welches Gewerk?</h2>
      <div class="grid md:grid-cols-3 gap-3">${Object.entries(GEWERKE).map(([k, g]) => gewerkCard(g, k)).join('')}</div>
      <div class="flex items-end justify-between mt-10 mb-4"><h2 class="sec-t">Zuletzt</h2>${PROTS.length ? `<a href="#/protokolle" class="text-[14px] text-p font-medium">Alle ${PROTS.length} anzeigen →</a>` : ''}</div>
      ${recent.length ? `<div class="space-y-2">${recent.map(protRow).join('')}</div>` : `<div class="card p-8 text-center text-ink3 text-[14px]">Noch keine Protokolle – oben ein Gewerk wählen.</div>`}
    </section>`;
}
function pickDialog(g) {
  const G = GEWERKE[g];
  modal(`<div class="flex items-center gap-3 pr-8"><span class="w-11 h-11 rounded-[var(--rb)] grid place-items-center" style="background:${rgba(G.color, 0.14)};color:${G.color}">${ic(G.icon, 22)}</span><div><div class="text-[12px] text-ink3">${G.name}</div><h3 class="text-[20px] font-semibold leading-tight">Neue Baustelle oder Service?</h3></div></div>
    <div class="grid gap-3 mt-6">
      <button class="opt !min-h-[76px]" data-a="start" data-g="${g}" data-t="abnahme"><span class="w-10 h-10 rounded-[var(--rb)] grid place-items-center bg-p/15 text-p shrink-0">${ic('hard', 20)}</span><span><span class="block text-[16px] font-semibold">Neue Baustelle – Abnahme</span><span class="block text-[13px] text-ink3 font-normal">Montage abgeschlossen, alles dokumentieren</span></span></button>
      <button class="opt !min-h-[76px]" data-a="start" data-g="${g}" data-t="service"><span class="w-10 h-10 rounded-[var(--rb)] grid place-items-center shrink-0" style="background:rgb(var(--s-rgb)/.16);color:rgb(var(--s-rgb))">${ic('wrench', 20)}</span><span><span class="block text-[16px] font-semibold">Serviceauftrag</span><span class="block text-[13px] text-ink3 font-normal">Grund, Behebung, Material, Zeiten, Notdienst</span></span></button>
    </div>`);
}

/* ---------- Assistent ---------- */
function itemRows(fid, v) {
  return (v || []).map((x, i) => `<div class="flex items-center gap-2 rounded-[var(--rb)] bg-raised px-3 py-2 text-[14px]"><b class="mono whitespace-nowrap">${esc(x.q)} ${esc(x.u)}</b><span class="flex-1 min-w-0">${esc(x.n)}</span><button type="button" class="w-9 h-9 -my-1 grid place-items-center text-ink3 hover:text-ember" data-a="item-del" data-f="${fid}" data-i="${i}" aria-label="Entfernen">${ic('trash', 15)}</button></div>`).join('');
}
function fieldHTML(r, f, bad) {
  const a = r.answers, v = a[f.id], err = bad.includes(f.id), lab = f.label ? `<span class="lbl ${f.danger ? '!text-ember !text-[15px] !font-semibold' : ''}">${esc(labOf(f, a))}${f.req ? ' <span class="text-ember">*</span>' : ''}</span>` : '';
  const hint = f.hint ? `<p class="hint">${esc(typeof f.hint === 'function' ? f.hint() : f.hint)}</p>` : '';
  const base = `class="inp ${err ? 'inp-req' : ''}" data-f="${f.id}"`;
  switch (f.type) {
    case 'text': case 'phone': return `<label class="block">${lab}<input ${base} type="${f.type === 'phone' ? 'tel' : 'text'}" value="${esc(v || '')}" placeholder="${esc(f.ph || '')}" ${f.list ? 'list="dl-monteure"' : ''} autocomplete="off">${hint}</label>`;
    case 'number': return `<label class="block">${lab}<div class="relative"><input ${base} inputmode="decimal" value="${esc(v ?? '')}" placeholder="${esc(f.ph || '0')}">${f.unit ? `<span class="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-ink3">${f.unit}</span>` : ''}</div>${hint}</label>`;
    case 'date': return `<label class="block">${lab}<input ${base} type="date" value="${esc(v || '')}">${hint}</label>`;
    case 'textarea': return `<label class="block">${lab}<textarea ${base} rows="3" placeholder="${esc(f.ph || '')}">${esc(v || '')}</textarea></label>${f.chips ? `<div class="flex flex-wrap gap-1.5 mt-2">${f.chips().map(c => `<button type="button" class="chip" data-a="chip" data-f="${f.id}" data-v="${esc(c)}">${ic('plus', 13)}${esc(c)}</button>`).join('')}</div>` : ''}${hint}`;
    case 'monteur': {
      const cur = (v || '').split(',').map(x => x.trim()).filter(Boolean), chip = m => `<button type="button" class="chip ${cur.includes(m.name) ? '!border-p !text-ink !bg-p/15' : ''}" data-a="mont-pick" data-f="${f.id}" data-v="${esc(m.name)}">${cur.includes(m.name) ? ic('check', 13, 2.6) : ic('plus', 13)}${esc(m.name)}</button>`;
      const own = monteureFor(r.gewerk), other = S.monteure.filter(m => !m.gw.includes(r.gewerk));
      return `<label class="block">${lab}<input ${base} type="text" value="${esc(v || '')}" placeholder="${esc(f.ph || '')}" list="dl-monteure" autocomplete="off"></label>
        ${own.length ? `<div class="text-[12px] text-ink3 mt-3 mb-1.5">${GEWERKE[r.gewerk].name}</div><div class="flex flex-wrap gap-1.5">${own.map(chip).join('')}</div>` : ''}
        ${other.length ? `<details class="mt-3" ${other.some(m => cur.includes(m.name)) ? 'open' : ''}><summary class="text-[12px] text-ink3 inline-flex items-center gap-1">${ic('chevD', 13)}Monteure anderer Gewerke</summary><div class="flex flex-wrap gap-1.5 mt-1.5">${other.map(chip).join('')}</div></details>` : ''}
        ${S.monteure.length ? '' : '<p class="hint">Tipp: Monteure unter Einstellungen → Monteure anlegen, dann erscheinen sie hier zum Antippen.</p>'}`;
    }
    case 'radio': return `<div>${lab}<div class="grid ${optsOf(f, a).length > 3 ? 'sm:grid-cols-2' : ''} gap-2 ${err ? 'rounded-[var(--rb)] ring-4 ring-[rgba(217,72,43,0.18)]' : ''}">${optsOf(f, a).map(([k, l]) => `<button type="button" class="opt ${v === k ? 'on' : ''}" data-a="opt" data-f="${f.id}" data-v="${esc(k)}"><span class="dot"></span>${esc(l)}</button>`).join('')}</div>${hint}</div>`;
    case 'thumbs': return `<div class="thumbs">${ic('thumb', 40, 1.6)}<div class="font-semibold mt-2">Super – alles erledigt.</div></div>`;
    case 'multiday': return `<div>${lab}<div class="flex flex-wrap gap-1.5 mb-2">${(v || []).map((d, i) => `<span class="chip !h-9">${wdOf(d).slice(0, 2)}, ${deDate(d)}<button class="text-ink3 hover:text-ember -mr-1" data-a="day-del" data-f="${f.id}" data-i="${i}" aria-label="Entfernen">${ic('x', 14)}</button></span>`).join('')}</div>
      <div class="flex gap-2"><input type="date" class="inp ${err ? 'inp-req' : ''}" id="day-${f.id}" value="${isoToday()}"><button type="button" class="btn-s shrink-0" data-a="day-add" data-f="${f.id}">${ic('plus', 16)}Tag</button></div><p class="hint">Mehrere Tage nacheinander hinzufügen.</p></div>`;
    case 'items': return `<div>${lab}<div class="space-y-1.5 mb-2" id="it-list-${f.id}">${itemRows(f.id, v)}</div>
      <div class="grid grid-cols-[1fr_80px_86px] sm:grid-cols-[1fr_90px_96px_auto] gap-2"><input class="inp ${err ? 'inp-req' : ''}" id="it-n-${f.id}" placeholder="${esc(f.ph || 'Bezeichnung')}" enterkeyhint="enter" autocomplete="off"><input class="inp" id="it-q-${f.id}" inputmode="decimal" enterkeyhint="enter" value="1"><select class="inp appearance-none" id="it-u-${f.id}">${['Stk', 'm', 'l', 'kg', 'Set', 'Pkg'].map(u => `<option>${u}</option>`).join('')}</select><button type="button" class="btn-p col-span-3 sm:col-span-1 !h-12 sm:!h-11" data-a="item-add" data-f="${f.id}">${ic('plus', 16)}Hinzufügen</button></div><p class="hint">Bezeichnung und Menge eintragen, dann „Hinzufügen“ oder Enter – beliebig viele Positionen.</p></div>`;
    case 'heizkoerper': {
      const last = UI.hkLast || {}, sel = (id, list, ph) => `<label class="block"><span class="text-[12px] text-ink3">${ph}</span><select class="inp appearance-none" id="${id}">${list.map(x => `<option ${last[id] === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>`;
      return `<div>${lab}<div class="space-y-1.5 mb-3">${(v || []).map((x, i) => `<div class="flex items-center gap-3 rounded-[var(--rb)] bg-raised px-3 py-2.5 text-[14px]"><b class="mono text-ink3 w-6">${i + 1}.</b><span class="flex-1 min-w-0"><b>${esc(x.raum)}</b> <span class="text-ink2">· ${esc(x.typ)} · ${esc(x.h)} × ${esc(x.l)}</span></span><button class="text-ink3 hover:text-ember" data-a="hk-del" data-f="${f.id}" data-i="${i}" aria-label="Entfernen">${ic('trash', 15)}</button></div>`).join('')}</div>
        <div class="rounded-[var(--r)] border ${err ? 'border-ember' : 'border-line2'} p-3 sm:p-4"><div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <label class="block col-span-2 sm:col-span-1"><span class="text-[12px] text-ink3">Raum</span><input class="inp" id="hk-raum" list="dl-hkraum" placeholder="Raum wählen oder tippen" autocomplete="off"></label>
          ${sel('hk-typ', S.lists.hkTyp, 'Typ')}${sel('hk-h', S.lists.hkHoehe, 'Bauhöhe')}${sel('hk-l', S.lists.hkLaenge, 'Baulänge')}</div>
          <div class="flex flex-wrap gap-1.5 mt-3">${S.lists.hkRaum.map(x => `<button type="button" class="chip" data-a="hk-raum" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
          <button type="button" class="btn-s w-full sm:w-auto mt-3" data-a="hk-add" data-f="${f.id}">${ic('plus', 16)}Heizkörper hinzufügen</button></div>
        <datalist id="dl-hkraum">${S.lists.hkRaum.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
        <p class="hint">${(v || []).length} Heizkörper erfasst. Typ, Höhen und Längen unter Einstellungen → Auswahllisten anpassbar.</p></div>`;
    }
    case 'einsaetze': {
      const nd = a.notdienst === 'ja';
      return `<div>${lab}<div class="space-y-3">${(v || []).map((e, i) => { const z = zuschlag(e.datum, nd); return `<div class="rounded-[var(--r)] border ${err && (!e.datum || !e.von || !e.bis) ? 'border-ember' : 'border-line2'} p-3 sm:p-4" data-row="${i}">
        <div class="flex items-center justify-between mb-2"><b class="text-[14px]">Einsatz ${i + 1}</b>${v.length > 1 ? `<button class="btn-g !h-8 !px-2" data-a="ein-del" data-i="${i}">${ic('trash', 15)}</button>` : ''}</div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <label class="col-span-2 sm:col-span-1"><span class="text-[12px] text-ink3">Datum</span><input type="date" class="inp" data-e="${i}" data-k="datum" value="${esc(e.datum || '')}"></label>
          <label><span class="text-[12px] text-ink3">Ankunft</span><input type="time" class="inp" data-e="${i}" data-k="von" value="${esc(e.von || '')}"></label>
          <label><span class="text-[12px] text-ink3">Abfahrt</span><input type="time" class="inp" data-e="${i}" data-k="bis" value="${esc(e.bis || '')}"></label>
          <label class="col-span-2 sm:col-span-1"><span class="text-[12px] text-ink3">Pause (Min.)</span><input class="inp" inputmode="numeric" data-e="${i}" data-k="pause" value="${esc(e.pause || '')}" placeholder="0"></label>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2 text-[13px]" id="ein-info-${i}">${einInfo(e, z)}</div></div>`; }).join('')}</div>
        <button type="button" class="btn-s mt-3" data-a="ein-add">${ic('plus', 16)}Weiteren Einsatz</button>
        <div class="kpi mt-4 flex flex-wrap items-center justify-between gap-2"><span class="text-[13px] text-ink3">Gesamtzeit vor Ort</span><b class="text-[20px]" id="ein-total">${hrs(serviceHours(r))}</b></div></div>`;
    }
  }
  return '';
}
function einInfo(e, z) {
  const col = z.total > 100 ? 'bg-tyel text-yel-ink' : 'bg-raised text-ink2';
  return `${e.datum ? `<span class="badge bg-raised text-ink2">${ic('cal', 13)}${wdOf(e.datum)}</span><span class="badge ${col}">${esc(z.typ)}: ${esc(z.label)}${z.nd || z.base !== 100 ? ` = ${z.total} %` : ''}</span>` : ''}<span class="badge bg-raised text-ink2">${ic('clock', 13)}${hrs(durH(e))}</span>`;
}

function sigHTML(r, who) {
  const s = r.sig[who], kunde = who === 'kunde';
  return `<div class="grid sm:grid-cols-2 gap-3"><label class="block"><span class="lbl">Ort</span><input class="inp" data-sig="${who}" data-k="ort" value="${esc(s.ort || '')}" placeholder="Ort"></label><label class="block"><span class="lbl">Datum</span><input class="inp" type="date" data-sig="${who}" data-k="datum" value="${esc(s.datum || '')}"></label></div>
    ${kunde ? `<label class="flex items-center gap-2.5 text-[14px] text-ink2 mt-4"><input type="checkbox" data-a="absent" ${s.absent ? 'checked' : ''}>Kunde nicht anwesend – ohne Unterschrift</label>` : ''}
    <div class="${kunde && s.absent ? 'hidden' : ''} mt-4"><div class="flex items-center justify-between mb-2"><span class="lbl !mb-0">Unterschrift ${kunde ? 'Kunde' : 'Monteur'} <span class="text-ember">*</span></span><button class="btn-g !h-8" data-a="sig-clear" data-w="${who}">${ic('trash', 15)}Löschen</button></div>
    <div class="sig-wrap"><canvas id="sig-cv" data-w="${who}"></canvas><div class="base"></div>${s.data ? '' : '<div class="ph" id="sig-ph">Hier mit Finger oder Stift unterschreiben</div>'}</div></div>`;
}
function photosHTML(r) {
  return `${r.gewerk === 'AC' && r.type === 'abnahme' ? `<div class="rounded-[var(--rb)] bg-tyel text-yel-ink text-[13px] p-3 mb-4">Bitte das Foto vom Stromzähler (Zählernummer + Stand) mit hinzufügen.</div>` : ''}
    <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">${r.photos.map((p, i) => `<div class="relative aspect-square rounded-[var(--rb)] overflow-hidden bg-raised"><img src="${p.data}" class="w-full h-full object-cover" alt=""><button class="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-black/60 text-white grid place-items-center" data-a="photo-del" data-i="${i}" aria-label="Foto löschen">${ic('x', 15)}</button></div>`).join('')}</div>
    <div class="grid grid-cols-2 gap-2 mt-4"><label class="btn-p cursor-pointer">${ic('camera', 18)}Kamera<input type="file" accept="image/*" capture="environment" class="hidden" data-photo multiple></label><label class="btn-s cursor-pointer">${ic('image', 18)}Galerie<input type="file" accept="image/*" class="hidden" data-photo multiple></label></div>
    <p class="hint">${r.photos.length} Foto${r.photos.length === 1 ? '' : 's'} · Fotos werden verkleinert und mit dem Protokoll gespeichert.</p>`;
}
function summaryHTML(r, ro) {
  const parts = visSteps(r).map((s, si) => {
    const rows = visFields(r, s).filter(f => f.type !== 'thumbs' && filled(r.answers[f.id])).map(f => `<div class="grid sm:grid-cols-[minmax(0,240px)_1fr] gap-x-4 gap-y-0.5 py-2 border-b border-line last:border-0"><span class="text-[13px] text-ink3">${esc(labOf(f, r.answers))}</span><span class="text-[14px] whitespace-pre-line">${esc(fmtValue(r, f))}</span></div>`).join('');
    return `<div class="card p-4 sm:p-5"><div class="flex items-center justify-between mb-1"><b class="text-[15px]">${esc(s.title)}</b>${ro ? '' : `<button class="btn-g !h-8" data-a="goto" data-i="${si}">${ic('edit', 14)}Ändern</button>`}</div>${rows || '<div class="text-[13px] text-ink3 py-2">–</div>'}</div>`;
  }).join('');
  const sig = w => { const s = r.sig[w]; return `<div class="card p-4"><div class="text-[13px] text-ink3">Unterschrift ${w === 'kunde' ? 'Kunde' : 'Monteur'}</div>${w === 'kunde' && s.absent ? '<div class="text-[14px] mt-2">Kunde nicht anwesend</div>' : s.data ? `<div class="rounded-lg bg-white mt-2 p-2"><img src="${s.data}" class="h-16" alt=""></div>` : '<div class="text-ember text-[14px] mt-2">fehlt</div>'}<div class="text-[12px] text-ink3 mt-1">${esc(s.ort || '')}${s.ort ? ', ' : ''}${deDate(s.datum)}</div></div>`; };
  const svc = r.type === 'service' ? `<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">${[['Zeit vor Ort', hrs(serviceHours(r))], ['Notdienst', r.answers.notdienst === 'ja' ? 'Ja' : 'Nein'], ['Einsätze', (r.answers.einsaetze || []).length]].map(([k, v]) => `<div class="kpi"><div class="text-[12px] text-ink3">${k}</div><div class="text-[20px] font-semibold mt-1">${v}</div></div>`).join('')}</div>` : '';
  return `<div class="space-y-3">${svc}${parts}
    <div class="card p-4 sm:p-5"><div class="flex items-center justify-between"><b class="text-[15px]">Fotos (${r.photos.length})</b>${ro ? '' : `<button class="btn-g !h-8" data-a="goto-x" data-k="fotos">${ic('edit', 14)}Ändern</button>`}</div>${r.photos.length ? `<div class="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mt-3">${r.photos.map(p => `<img src="${p.data}" class="aspect-square object-cover rounded-lg w-full" alt="">`).join('')}</div>` : ''}</div>
    <div class="grid sm:grid-cols-2 gap-3">${sig('monteur')}${sig('kunde')}</div></div>`;
}
function viewWizard() {
  const r = CUR; if (!r) return viewHome();
  const sc = screens(r), i = Math.min(UI.step, sc.length - 1), [kind, title, step] = sc[i], g = GEWERKE[r.gewerk];
  const bad = UI.bad || [];
  let body = '';
  if (kind === 'step') body = `${step.sub ? `<p class="${step.danger ? 'text-ember font-medium' : 'text-ink3'} text-[14px] -mt-1 mb-5">${esc(step.sub)}</p>` : '<div class="mb-4"></div>'}<div class="space-y-5">${visFields(r, step).map(f => fieldHTML(r, f, bad)).join('')}</div>`;
  else if (kind === 'fotos') body = `<p class="text-ink3 text-[14px] -mt-1 mb-5">Fotos von der Baustelle – Kamera oder Galerie.</p>${photosHTML(r)}`;
  else if (kind === 'sig_monteur') body = `<p class="text-ink3 text-[14px] -mt-1 mb-5">Ort, Datum und Unterschrift des Monteurs.</p>${sigHTML(r, 'monteur')}`;
  else if (kind === 'sig_kunde') body = `<p class="text-ink3 text-[14px] -mt-1 mb-5">Der Kunde bestätigt die ${r.type === 'service' ? 'Arbeiten' : 'Abnahme'}.</p>${sigHTML(r, 'kunde')}`;
  else body = `<p class="text-ink3 text-[14px] -mt-1 mb-5">Bitte alles prüfen – dann abschließen und als PDF teilen.</p>${summaryHTML(r)}`;
  const pct = Math.round((i / (sc.length - 1)) * 100), last = kind === 'summary';
  const side = `<aside class="hidden lg:block w-64 shrink-0"><div class="sticky top-24 card p-2 max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">${sc.map(([k, t], j) => `<button class="w-full text-left flex items-center gap-2.5 px-3 h-9 rounded-[var(--rb)] text-[13px] ${j === i ? 'bg-raised text-ink font-medium' : j <= UI.maxStep ? 'text-ink2 hover:bg-raised' : 'text-ink3 opacity-60'}" data-a="jump" data-i="${j}" ${j > UI.maxStep ? 'disabled' : ''}><span class="w-5 h-5 rounded-full grid place-items-center text-[10px] shrink-0 ${j < i ? 'bg-p text-white' : j === i ? 'border-2 border-p' : 'border border-line2'}">${j < i ? ic('check', 11, 3) : j + 1}</span><span class="truncate">${esc(t)}</span></button>`).join('')}</div></aside>`;
  return `<div class="pt-5 sm:pt-8">
    <div class="flex items-center gap-3"><button class="btn-g !px-2" data-a="home" aria-label="Zur Startseite">${ic('arrowL', 18)}</button>
      <span class="w-9 h-9 rounded-[var(--rb)] grid place-items-center shrink-0" style="background:${rgba(g.color, 0.14)};color:${g.color}">${ic(TYPES[r.type].icon, 18)}</span>
      <div class="min-w-0 flex-1"><div class="font-semibold text-[15px] truncate">${TYPES[r.type].name} · ${g.name}</div><div class="text-[12px] text-ink3 mono">${esc(r.nr)}</div></div>
      <span class="text-[12px] text-ink3 whitespace-nowrap">Schritt ${i + 1}/${sc.length}</span></div>
    <div class="prog mt-4"><i style="width:${pct}%"></i></div>
    <div class="flex gap-6 mt-6">${side}
      <section class="flex-1 min-w-0 max-w-3xl"><div class="card p-5 sm:p-7 fade-in ${step && step.danger ? '!border-ember border-2' : ''}" ${step && step.danger ? 'style="background:var(--t-red)"' : ''}><h2 class="h-font text-[30px] sm:text-[34px] leading-tight mb-3 ${step && step.danger ? 'text-ember' : ''}">${step && step.danger ? `<span class="inline-block align-middle mr-2">${ic('camera', 26)}</span>` : ''}${esc(title)}</h2>${body}</div>
        <div class="fixed lg:static left-0 right-0 bottom-0 z-30 lg:z-auto border-t lg:border-0 border-line lg:mt-4" style="background:color-mix(in srgb,var(--bg) 92%,transparent);padding-bottom:env(safe-area-inset-bottom)">
          <div class="max-w-3xl mx-auto px-4 lg:px-0 py-3 flex gap-2"><button class="btn-s" data-a="back">${ic('arrowL', 16)}Zurück</button>
          ${last ? `<button class="btn-p flex-1" data-a="finish">${ic('check', 17)}Abschließen &amp; PDF</button>` : `<button class="btn-p flex-1" data-a="next">Weiter ${ic('arrowR', 16)}</button>`}</div></div></section></div></div>`;
}

/* ---------- Protokolle ---------- */
function viewList() {
  const q = UI.q.trim().toLowerCase();
  const list = PROTS.slice().sort((a, b) => b.updated - a.updated).filter(p => (!UI.fType || p.type === UI.fType) && (!UI.fGew || p.gewerk === UI.fGew) && (!q || [p.nr, p.answers.kunde, p.answers.adresse, p.answers.monteur].join(' ').toLowerCase().includes(q)));
  const seg = (k, opts) => `<div class="seg flex-wrap">${opts.map(([v, l]) => `<button class="${UI[k] === v ? 'on' : ''}" data-a="filter" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
  return `<section class="pt-8 sm:pt-12"><h1 class="h-font text-[38px] sm:text-[48px] leading-none">Protokolle</h1><p class="text-ink3 text-[14px] mt-2">${PROTS.length} gespeichert – auf dem LumbraDesk-Server.</p>
    <div class="flex flex-col lg:flex-row gap-3 mt-6"><div class="relative flex-1"><span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink3">${ic('search', 17)}</span><input class="inp !pl-11" id="q" placeholder="Kunde, Adresse, Nummer, Monteur …" value="${esc(UI.q)}" autocomplete="off"></div>
      <div class="flex flex-wrap gap-2">${seg('fType', [['', 'Alle'], ['abnahme', 'Abnahme'], ['service', 'Service']])}${seg('fGew', [['', 'Alle Gewerke'], ['DC', 'DC'], ['AC', 'AC'], ['SHK', 'SHK']])}</div></div>
    <div class="space-y-2 mt-5" id="plist">${list.length ? list.map(protRow).join('') : '<div class="card p-8 text-center text-ink3 text-[14px]">Keine Protokolle gefunden.</div>'}</div></section>`;
}
function viewProt() {
  const p = PROTS.find(x => x.id === UI.viewId); if (!p) return viewList();
  const g = GEWERKE[p.gewerk];
  return `<section class="pt-6 sm:pt-10 max-w-3xl"><a href="#/protokolle" class="btn-g -ml-3">${ic('arrowL', 16)}Alle Protokolle</a>
    <div class="flex flex-wrap items-start gap-4 mt-4"><span class="w-12 h-12 rounded-[var(--rb)] grid place-items-center shrink-0" style="background:${rgba(g.color, 0.14)};color:${g.color}">${ic(TYPES[p.type].icon, 22)}</span>
      <div class="flex-1 min-w-[200px]"><h1 class="h-font text-[34px] leading-tight">${esc(p.answers.kunde || 'Ohne Namen')}</h1><div class="text-[13px] text-ink3 mt-1">${TYPES[p.type].name} · ${g.name} · <span class="mono">${esc(p.nr)}</span> · abgeschlossen ${new Date(p.done || p.updated).toLocaleDateString('de-DE')}</div></div></div>
    <div class="flex flex-wrap gap-2 mt-5"><button class="btn-p" data-a="pdf" data-id="${p.id}">${ic('share', 17)}PDF teilen</button><button class="btn-s" data-a="edit" data-id="${p.id}">${ic('edit', 16)}Bearbeiten</button><button class="btn-g hover:!text-ember" data-a="del" data-id="${p.id}">${ic('trash', 16)}Löschen</button></div>
    <div class="mt-6">${summaryHTML(p, true)}</div></section>`;
}

/* ---------- Einstellungen ---------- */
const SET_TABS = [['firma', 'Firma & Logo', 'building'], ['design', 'Design', 'sun'], ['monteure', 'Monteure', 'users'], ['zuschlag', 'Zuschläge', 'clock'], ['systeme', 'Systeme (AC)', 'bolt'], ['wps', 'Wärmepumpen (SHK)', 'flame'], ['listen', 'Auswahllisten', 'list'], ['daten', 'Daten', 'download']];
const LISTS = [['hkRaum', 'Räume (Heizkörper)'], ['hkTyp', 'Heizkörper-Typen'], ['hkHoehe', 'Heizkörper-Bauhöhen'], ['hkLaenge', 'Heizkörper-Baulängen'], ['grundDC', 'Service-Gründe DC'], ['grundAC', 'Service-Gründe AC'], ['grundSHK', 'Service-Gründe SHK'], ['fixDC', 'Behebung DC'], ['fixAC', 'Behebung AC'], ['fixSHK', 'Behebung SHK']];
const sIn = (path, label, ph = '', type = 'text') => { const v = path.split('.').reduce((o, k) => (o || {})[k], S); return `<label class="block"><span class="lbl">${label}</span><input class="inp" data-s="${path}" type="${type}" value="${esc(v ?? '')}" placeholder="${esc(ph)}" ${type === 'number' ? 'inputmode="decimal"' : ''}></label>`; };
function setBody() {
  switch (UI.tab) {
    case 'firma': return `<div class="grid sm:grid-cols-2 gap-4">${sIn('company.name', 'Firmenname')}${sIn('company.phone', 'Telefon')}${sIn('company.street', 'Straße')}${sIn('company.city', 'PLZ und Ort')}${sIn('company.email', 'E-Mail')}${sIn('company.web', 'Website')}</div>
      <div class="mt-6"><span class="lbl">Logo (App und PDF)</span><div class="flex flex-wrap items-center gap-3">${S.company.logo ? `<span class="rounded-[var(--rb)] bg-white p-3 border border-line"><img src="${esc(S.company.logo)}" class="h-14" alt=""></span>` : '<span class="text-ink3 text-[14px]">Kein Logo</span>'}
        <label class="btn-s cursor-pointer">${ic('upload', 16)}Logo wählen<input type="file" accept="image/*" class="hidden" data-logo></label>${S.company.logo !== 'logo.png' ? '<button class="btn-g" data-a="logo-reset">Standard-Logo</button>' : ''}${S.company.logo ? '<button class="btn-g" data-a="logo-none">Ohne Logo</button>' : ''}</div></div>`;
    case 'design': return `<div><span class="lbl">Ansicht</span><div class="seg">${[['system', 'Wie Gerät'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([k, l]) => `<button class="${S.design.mode === k ? 'on' : ''}" data-a="mode" data-v="${k}">${l}</button>`).join('')}</div></div>
      <div class="grid grid-cols-2 gap-4 mt-6">${[['primary', 'Hauptfarbe'], ['secondary', 'Akzentfarbe']].map(([k, l]) => `<label class="block"><span class="lbl">${l}</span><div class="flex items-center gap-2"><input type="color" class="w-12 h-11 rounded-[var(--rb)] border border-line2 bg-field p-1" data-s="design.${k}" value="${esc(S.design[k])}"><span class="mono text-[13px] text-ink3">${esc(S.design[k])}</span></div></label>`).join('')}</div>
      <label class="block mt-6"><span class="lbl">Ecken-Rundung: ${S.design.radius} px</span><input type="range" min="4" max="24" step="1" class="w-full" data-s="design.radius" value="${S.design.radius}"></label>
      <div class="grid grid-cols-2 gap-4 mt-6">${[['fontHead', 'Schrift Überschriften', ['Instrument Serif', 'DM Serif Display', 'Fraunces', 'Geist', 'Inter']], ['fontBody', 'Schrift Text', ['Geist', 'Inter', 'DM Sans', 'Figtree', 'IBM Plex Sans', 'Instrument Sans']]].map(([k, l, fs]) => `<label class="block"><span class="lbl">${l}</span><select class="inp" data-s="design.${k}">${fs.map(f => `<option ${S.design[k] === f ? 'selected' : ''}>${f}</option>`).join('')}</select></label>`).join('')}</div>
      <button class="btn-g mt-6" data-a="design-reset">${ic('refresh', 15)}Design zurücksetzen</button>`;
    case 'monteure': {
      const gwBtn = (m, i, g) => `<button class="chip !h-7 !px-2 text-[12px] ${m.gw.includes(g) ? '!border-p !text-ink !bg-p/15' : ''}" data-a="mont-gw" data-i="${i}" data-g="${g}">${g}</button>`;
      const row = (m, i) => `<div class="flex flex-wrap items-center gap-2 rounded-[var(--rb)] bg-raised px-3 py-2"><span class="text-ink3">${ic('users', 16)}</span><span class="flex-1 min-w-[120px] font-medium">${esc(m.name)}</span><span class="flex gap-1">${Object.keys(GEWERKE).map(g => gwBtn(m, i, g)).join('')}</span><button class="text-ink3 hover:text-ember ml-1" data-a="mont-del" data-i="${i}" aria-label="Löschen">${ic('trash', 15)}</button></div>`;
      const groups = Object.entries(GEWERKE).map(([g, G]) => { const l = S.monteure.map((m, i) => [m, i]).filter(([m]) => m.gw.includes(g)); return `<div><div class="flex items-center gap-2 mb-2"><span style="color:${G.color}">${ic(G.icon, 16)}</span><b class="text-[14px]">${G.name}</b><span class="text-[12px] text-ink3">${l.length}</span></div><div class="space-y-1.5">${l.map(([m, i]) => row(m, i)).join('') || '<div class="text-[13px] text-ink3">Noch niemand zugeordnet.</div>'}</div></div>`; }).join('');
      const none = S.monteure.map((m, i) => [m, i]).filter(([m]) => !m.gw.length);
      return `<p class="text-ink3 text-[14px] mb-4">Monteure den Gewerken zuordnen (DC / AC / SHK antippen, auch mehrere). Im Protokoll erscheinen die Monteure des Gewerks als Schnellauswahl – Monteure anderer Gewerke lassen sich darunter zusätzlich auswählen.</p>
      <div class="flex gap-2 mb-6"><input class="inp" id="mont-new" placeholder="Name des Monteurs"><button class="btn-s shrink-0" data-a="mont-add">${ic('plus', 16)}Hinzufügen</button></div>
      <div class="space-y-6">${groups}${none.length ? `<div><b class="text-[14px]">Ohne Gewerk</b><div class="space-y-1.5 mt-2">${none.map(([m, i]) => row(m, i)).join('')}</div></div>` : ''}</div>`;
    }
    case 'wps': return `<p class="text-ink3 text-[14px] mb-4">Diese Hersteller und Modelle erscheinen bei der SHK-Abnahme. Je Zeile ein Modell – „Anderes Modell“ und „Sonstige“ sind immer möglich. Bitte bei neuen Modellen mit dem Herstellerdatenblatt abgleichen.</p>
      <div class="space-y-4">${S.wps.map((x, i) => `<div class="rounded-[var(--r)] border border-line2 p-4">
        <div class="flex gap-2"><input class="inp" data-wp="${i}" data-k="name" value="${esc(x.name)}" placeholder="Hersteller / Baureihe"><button class="btn-g !px-2.5 hover:!text-ember" data-a="wp-del" data-i="${i}" aria-label="Löschen">${ic('trash', 16)}</button></div>
        <label class="block mt-3"><span class="lbl">Modelle</span><textarea class="inp" rows="5" data-wp="${i}" data-k="models">${esc(x.models.join('\n'))}</textarea></label>
        <label class="flex items-center gap-2 text-[14px] text-ink2 mt-3"><input type="checkbox" data-wp="${i}" data-k="multi" ${x.multi ? 'checked' : ''}>Fragen, ob mehr als eine Wärmepumpe verbaut wurde (Kaskade)</label></div>`).join('')}</div>
      <div class="flex flex-wrap gap-2 mt-4"><button class="btn-s" data-a="wp-add">${ic('plus', 16)}Hersteller hinzufügen</button><button class="btn-g" data-a="wp-reset">${ic('refresh', 15)}Auf Standard zurücksetzen</button></div>`;
    case 'systeme': return `<p class="text-ink3 text-[14px] mb-4">Diese Systeme erscheinen bei der AC-Abnahme. Je Zeile eine Größe – Wechselrichter und Speicher werden als Vorauswahl angezeigt, „Andere Größe“ ist immer möglich. Bitte Größen bei neuen Modellen mit dem Herstellerdatenblatt abgleichen.</p>
      <div class="space-y-4">${S.systems.map((x, i) => `<div class="rounded-[var(--r)] border border-line2 p-4">
        <div class="flex gap-2"><input class="inp" data-sys="${i}" data-k="name" value="${esc(x.name)}" placeholder="Name des Systems"><button class="btn-g !px-2.5 hover:!text-ember" data-a="sys-del" data-i="${i}" aria-label="System löschen">${ic('trash', 16)}</button></div>
        <div class="grid md:grid-cols-2 gap-3 mt-3"><label class="block"><span class="lbl">Wechselrichter-Größen</span><textarea class="inp" rows="5" data-sys="${i}" data-k="wr">${esc(x.wr.join('\n'))}</textarea></label><label class="block"><span class="lbl">Speichergrößen</span><textarea class="inp" rows="5" data-sys="${i}" data-k="sp">${esc(x.sp.join('\n'))}</textarea></label></div>
        <div class="flex flex-wrap items-center gap-3 mt-3"><label class="flex items-center gap-2 text-[14px] text-ink2"><input type="checkbox" data-sys="${i}" data-k="multi" ${x.multi ? 'checked' : ''}>Fragen, ob mehr als ein Gerät verbaut wurde</label><input class="inp !h-9 !w-44" data-sys="${i}" data-k="unit" value="${esc(x.unit || '')}" placeholder="z. B. Powerwalls"></div></div>`).join('')}</div>
      <div class="flex flex-wrap gap-2 mt-4"><button class="btn-s" data-a="sys-add">${ic('plus', 16)}System hinzufügen</button><button class="btn-g" data-a="sys-reset">${ic('refresh', 15)}Auf Standard zurücksetzen</button></div>`;
    case 'zuschlag': {
      const ex = [['Werktag', '2026-11-10'], ['Samstag', '2026-11-14'], ['Sonntag', '2026-11-15']];
      return `<p class="text-ink3 text-[14px] mb-4">Die App erfasst Stunden und Zuschlag in Prozent – abgerechnet wird im Büro. Sonntag und Feiertage werden am Datum automatisch erkannt.</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">${sIn('zuschlag.sat', 'Samstag %', '', 'number')}${sIn('zuschlag.sun', 'Sonntag %', '', 'number')}${sIn('zuschlag.hol', 'Feiertag %', '', 'number')}${sIn('zuschlag.not', 'Notdienst + %', '', 'number')}</div>
      <label class="block mt-5"><span class="lbl">Bundesland (für Feiertage)</span><select class="inp" data-s="state">${STATES.map(([k, l]) => `<option value="${k}" ${S.state === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <div class="kpi mt-5 text-[14px] space-y-1.5"><div class="text-[12px] text-ink3 mb-1">Beispiele</div>${ex.map(([l, d]) => `<div class="flex justify-between gap-3"><span>${l}</span><span>${zuschlag(d, false).total} % · im Notdienst <b>${zuschlag(d, true).total} %</b></span></div>`).join('')}</div>`;
    }
    case 'listen': return `<p class="text-ink3 text-[14px] mb-4">Je Zeile ein Eintrag. Diese Listen erscheinen als Auswahl bzw. als Schnell-Knöpfe in den Protokollen.</p>
      <div class="grid md:grid-cols-2 gap-4">${LISTS.map(([k, l]) => `<label class="block"><span class="lbl">${l}</span><textarea class="inp" rows="5" data-list="${k}">${esc(S.lists[k].join('\n'))}</textarea></label>`).join('')}</div>
      <button class="btn-g mt-4" data-a="lists-reset">${ic('refresh', 15)}Listen zurücksetzen</button>`;
    case 'daten': return `<p class="text-ink3 text-[14px] mb-4">Fertige Protokolle mit Fotos und Unterschriften liegen auf dem LumbraDesk-Server und erscheinen beim Kunden. Ein neues Handy holt sie automatisch zurück.</p>
      <div class="kpi mt-5 text-[14px]">${PROTS.length} Protokolle gespeichert${CUR ? ' · 1 Entwurf' : ''}</div>
      <p class="hint mt-6">Version ${APP_VERSION}</p>`;
  }
  return '';
}
function viewSettings() {
  return `<section class="pt-8 sm:pt-12"><h1 class="h-font text-[38px] sm:text-[48px] leading-none">Einstellungen</h1>
    <div class="flex flex-col md:flex-row gap-5 mt-6"><nav class="flex md:flex-col gap-1 overflow-x-auto no-scrollbar md:w-56 shrink-0">${SET_TABS.map(([k, l, i]) => `<a href="#/einstellungen/${k}" class="navl ${UI.tab === k ? 'on' : ''} md:w-full">${ic(i, 16)}${l}</a>`).join('')}</nav>
    <div class="card p-5 sm:p-7 flex-1 min-w-0"><h2 class="sec-t mb-5">${SET_TABS.find(t => t[0] === UI.tab)[1]}</h2>${setBody()}</div></div></section>`;
}

/* ---------- Rendern und Navigation ---------- */
function render() {
  const inner = UI.route === 'wizard' ? viewWizard() : UI.route === 'list' ? viewList() : UI.route === 'view' ? viewProt() : UI.route === 'settings' ? viewSettings() : viewHome();
  $('#app').innerHTML = shell(inner);
  if (UI.route === 'wizard') initSig();
}
function route() {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  if (h[0] === 'protokolle') UI.route = 'list';
  else if (h[0] === 'p' && h[1]) { UI.route = 'view'; UI.viewId = h[1]; }
  else if (h[0] === 'einstellungen') { UI.route = 'settings'; UI.tab = SET_TABS.some(t => t[0] === h[1]) ? h[1] : 'firma'; }
  else if (h[0] === 'protokoll' && CUR) UI.route = 'wizard';
  else UI.route = 'home';
  render(); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
const go = h => { if (location.hash === h) route(); else location.hash = h; };
function setStep(i) {
  const n = screens(CUR).length; UI.step = Math.max(0, Math.min(n - 1, i)); UI.maxStep = Math.max(UI.maxStep, UI.step); UI.bad = []; CUR.step = UI.step; CUR.maxStep = UI.maxStep; saveDraft();
  render(); window.scrollTo(0, 0);
}
function startRecord(r) { CUR = r; UI.step = r.step || 0; UI.maxStep = r.maxStep || 0; UI.bad = []; saveDraft(true); go('#/protokoll'); }

/* =========================================================
   Ereignisse
   ========================================================= */
function gewerkDialog() {
  modal(`<h3 class="text-[20px] font-semibold pr-8">Neues Protokoll</h3><p class="text-ink3 text-[14px] mt-1">Welches Gewerk?</p>
    <div class="grid gap-2 mt-5">${Object.entries(GEWERKE).map(([k, g]) => `<button class="opt !min-h-[64px]" data-a="pick" data-g="${k}"><span class="w-10 h-10 rounded-[var(--rb)] grid place-items-center shrink-0" style="background:${rgba(g.color, 0.14)};color:${g.color}">${ic(g.icon, 20)}</span><span><span class="block font-semibold">${g.name}</span><span class="block text-[12px] text-ink3 font-normal">${g.desc}</span></span></button>`).join('')}</div>`);
}
async function askReplaceDraft() { return !CUR || (await confirmDlg('Offenen Entwurf verwerfen?', `Das angefangene Protokoll ${CUR.nr} (${CUR.answers.kunde || 'ohne Kunde'}) wird verworfen.`, 'Verwerfen', true)); }
function guessOrt() { const m = /\d{5}\s+([^,]+)$/.exec((CUR.answers.adresse || '').trim()); return m ? m[1].trim() : ''; }

function validateScreen() {
  const sc = screens(CUR), [kind, , step] = sc[UI.step];
  if (kind === 'step') {
    const bad = stepIssues(CUR, step);
    if (bad.length) { UI.bad = bad; render(); const el = $(`[data-f="${bad[0]}"]`) || $('.inp-req,.ring-4'); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); toast('Bitte die markierten Pflichtfelder ausfüllen.', 'warn'); return false; }
    const msg = step.block && step.block(CUR.answers); if (msg) { toast(msg, 'warn', 4500); return false; }
  }
  if (kind === 'sig_monteur' && !CUR.sig.monteur.data) { toast('Bitte als Monteur unterschreiben.', 'warn'); return false; }
  if (kind === 'sig_kunde' && !CUR.sig.kunde.absent && !CUR.sig.kunde.data) { toast('Bitte den Kunden unterschreiben lassen – oder „Kunde nicht anwesend“ anhaken.', 'warn', 4500); return false; }
  return true;
}
function firstIncomplete() {
  const sc = screens(CUR);
  for (let i = 0; i < sc.length; i++) {
    const [k, , s] = sc[i];
    if (k === 'step' && (stepIssues(CUR, s).length || (s.block && s.block(CUR.answers)))) return i;
    if (k === 'sig_monteur' && !CUR.sig.monteur.data) return i;
    if (k === 'sig_kunde' && !CUR.sig.kunde.absent && !CUR.sig.kunde.data) return i;
  }
  return -1;
}
async function finish() {
  const i = firstIncomplete(); if (i >= 0) { UI.maxStep = Math.max(UI.maxStep, i); setStep(i); validateScreen(); return; }
  const rec = clone(CUR); delete rec.step; delete rec.maxStep; rec.updated = Date.now(); rec.done = rec.done || Date.now();
  await DB.put('prot', rec); PROTS = PROTS.filter(p => p.id !== rec.id).concat(rec);
  CUR = null; await saveDraft(true);
  go('#/p/' + rec.id); toast('Protokoll gespeichert.');
  pdfFlow(rec);
}

/* ---------- Material-/Fittingeliste ----------
   Hinzufügen reagiert schon beim Berühren (bevor die Tastatur schließt und die Seite springt),
   per Enter auf der Tastatur und beim „Weiter“ (noch nicht übernommene Eingabe). */
let ITEM_PD = 0;
function addItem(f, quiet) {
  const ni = $('#it-n-' + f), qi = $('#it-q-' + f), ui = $('#it-u-' + f); if (!ni || !CUR) return false;
  const n = ni.value.trim(); if (!n) { if (!quiet) toast('Bitte zuerst eine Bezeichnung eintragen.', 'warn'); return false; }
  const l = CUR.answers[f] || []; l.push({ n, q: (qi && qi.value.trim().replace('.', ',')) || '1', u: ui ? ui.value : 'Stk' }); CUR.answers[f] = l;
  UI.bad = (UI.bad || []).filter(x => x !== f); saveDraft();
  const box = $('#it-list-' + f); if (box) box.innerHTML = itemRows(f, l);
  ni.value = ''; ni.classList.remove('inp-req'); if (qi) qi.value = '1';
  if (!quiet) toast(`„${n}“ hinzugefügt.`);
  return true;
}
function flushItems() { $$('#app input[id^="it-n-"]').forEach(el => { if (el.value.trim()) addItem(el.id.slice(5), true); }); }
document.addEventListener('pointerdown', e => {
  const a = e.target.closest && e.target.closest('[data-a="item-add"]'); if (!a) return;
  e.preventDefault(); ITEM_PD = Date.now(); addItem(a.dataset.f);
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target.id || !/^it-[nq]-/.test(e.target.id)) return;
  e.preventDefault(); const f = e.target.id.slice(5); if (addItem(f)) { const ni = $('#it-n-' + f); if (ni) ni.focus(); }
});

document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a]'); if (!a) return;
  const act = a.dataset.a, f = a.dataset.f;
  switch (act) {
    case 'new': if (UI.route === 'wizard' && !(await askReplaceDraft())) return; gewerkDialog(); break;
    case 'pick': pickDialog(a.dataset.g); break;
    case 'start': { closeModal(); if (CUR && !(await askReplaceDraft())) return; startRecord(newRecord(a.dataset.t, a.dataset.g)); break; }
    case 'resume': go('#/protokoll'); break;
    case 'discard': if (await confirmDlg('Entwurf verwerfen?', 'Alle Eingaben dieses Protokolls gehen verloren.', 'Verwerfen', true)) { CUR = null; await saveDraft(true); render(); } break;
    case 'home': go('#/'); break;
    case 'back': if (UI.step === 0) go('#/'); else setStep(UI.step - 1); break;
    case 'next': flushItems(); if (validateScreen()) setStep(UI.step + 1); break;
    case 'jump': if (+a.dataset.i <= UI.maxStep) setStep(+a.dataset.i); break;
    case 'goto': setStep(+a.dataset.i); break;
    case 'goto-x': setStep(screens(CUR).findIndex(s => s[0] === a.dataset.k)); break;
    case 'finish': flushItems(); finish(); break;
    case 'opt': CUR.answers[f] = a.dataset.v; UI.bad = (UI.bad || []).filter(x => x !== f); saveDraft(); { const y = window.scrollY; render(); window.scrollTo(0, y); } break;
    case 'chip': { const el = $(`textarea[data-f="${f}"]`), cur = (el ? el.value : CUR.answers[f] || '').trim(), v = a.dataset.v; if (cur.split('\n').includes(v)) return; const nv = cur ? cur + '\n' + v : v; CUR.answers[f] = nv; if (el) { el.value = nv; el.classList.remove('inp-req'); } saveDraft(); break; }
    case 'day-add': { const d = $('#day-' + f).value; if (!d) return; const l = CUR.answers[f] || []; if (!l.includes(d)) l.push(d); l.sort(); CUR.answers[f] = l; UI.bad = (UI.bad || []).filter(x => x !== f); saveDraft(); render(); break; }
    case 'day-del': CUR.answers[f].splice(+a.dataset.i, 1); saveDraft(); render(); break;
    case 'item-add': if (Date.now() - ITEM_PD < 900) return; addItem(f); break;
    case 'hk-raum': { const el = $('#hk-raum'); if (el) el.value = a.dataset.v; $$('[data-a="hk-raum"]').forEach(b => b.classList.toggle('!border-p', b === a)); break; }
    case 'hk-add': { const raum = $('#hk-raum').value.trim(); if (!raum) { toast('Bitte zuerst den Raum wählen.', 'warn'); return; } const l = CUR.answers[f] || []; l.push({ raum, typ: $('#hk-typ').value, h: $('#hk-h').value, l: $('#hk-l').value }); UI.hkLast = { 'hk-typ': $('#hk-typ').value, 'hk-h': $('#hk-h').value, 'hk-l': $('#hk-l').value }; CUR.answers[f] = l; UI.bad = (UI.bad || []).filter(x => x !== f); saveDraft(); { const y = window.scrollY; render(); window.scrollTo(0, y); } toast(`${raum} hinzugefügt.`); break; }
    case 'hk-del': CUR.answers[f].splice(+a.dataset.i, 1); saveDraft(); render(); break;
    case 'item-del': { CUR.answers[f].splice(+a.dataset.i, 1); saveDraft(); const box = $('#it-list-' + f); if (box) box.innerHTML = itemRows(f, CUR.answers[f]); else render(); break; }
    case 'ein-add': { const l = CUR.answers.einsaetze || (CUR.answers.einsaetze = []); const last = l[l.length - 1]; l.push({ id: uid('e'), datum: last ? last.datum : isoToday(), von: '', bis: '', pause: '' }); saveDraft(); render(); break; }
    case 'ein-del': CUR.answers.einsaetze.splice(+a.dataset.i, 1); saveDraft(); render(); break;
    case 'photo-del': CUR.photos.splice(+a.dataset.i, 1); saveDraft(); render(); break;
    case 'sig-clear': CUR.sig[a.dataset.w].data = ''; saveDraft(); render(); break;
    case 'absent': CUR.sig.kunde.absent = a.checked; saveDraft(); render(); break;
    case 'view': go('#/p/' + a.dataset.id); break;
    case 'pdf': { const p = PROTS.find(x => x.id === a.dataset.id); if (p) pdfFlow(p); break; }
    case 'edit': { const p = PROTS.find(x => x.id === a.dataset.id); if (!p || !(await askReplaceDraft())) return; const r = clone(p); r.step = screens(r).length - 1; r.maxStep = r.step; startRecord(r); break; }
    case 'del': { const p = PROTS.find(x => x.id === a.dataset.id); if (!p || !(await confirmDlg('Protokoll löschen?', `${p.nr} – ${p.answers.kunde || ''} wird endgültig gelöscht.`, 'Löschen', true))) return; await DB.del('prot', p.id); PROTS = PROTS.filter(x => x.id !== p.id); go('#/protokolle'); toast('Gelöscht.'); break; }
    case 'filter': UI[a.dataset.k] = a.dataset.v; render(); break;
    case 'mode': S.design.mode = a.dataset.v; saveSettings(); applyTheme(); render(); break;
    case 'logo-reset': S.company.logo = 'logo.png'; saveSettings(); render(); break;
    case 'logo-none': S.company.logo = ''; saveSettings(); render(); break;
    case 'design-reset': S.design = clone(DEFAULTS.design); saveSettings(); applyTheme(); render(); break;
    case 'mont-add': { const v = $('#mont-new').value.trim(); if (!v) return; if (!S.monteure.some(m => m.name === v)) S.monteure.push({ name: v, gw: [] }); saveSettings(); render(); break; }
    case 'mont-gw': { const m = S.monteure[+a.dataset.i], g = a.dataset.g; m.gw = m.gw.includes(g) ? m.gw.filter(x => x !== g) : m.gw.concat(g); saveSettings(); render(); break; }
    case 'mont-pick': { const el = $(`input[data-f="${f}"]`), l = (el ? el.value : CUR.answers[f] || '').split(',').map(x => x.trim()).filter(Boolean), v = a.dataset.v; const nl = l.includes(v) ? l.filter(x => x !== v) : l.concat(v); CUR.answers[f] = nl.join(', '); UI.bad = (UI.bad || []).filter(x => x !== f); saveDraft(); { const y = window.scrollY; render(); window.scrollTo(0, y); } break; }
    case 'wp-add': S.wps.push({ id: uid('w'), name: 'Neuer Hersteller', models: [], multi: true, unit: 'Wärmepumpen (Kaskade)' }); saveSettings(); render(); break;
    case 'wp-del': { const x = S.wps[+a.dataset.i]; if (await confirmDlg('Hersteller löschen?', `„${x.name}“ wird aus der Auswahl entfernt.`, 'Löschen', true)) { S.wps.splice(+a.dataset.i, 1); saveSettings(); render(); } break; }
    case 'wp-reset': if (await confirmDlg('Wärmepumpen zurücksetzen?', 'Wolf, Buderus und Samsung mit den Standardmodellen – eigene Änderungen gehen verloren.', 'Zurücksetzen')) { S.wps = clone(DEFAULTS.wps); saveSettings(); render(); } break;
    case 'sys-add': S.systems.push({ id: uid('s'), name: 'Neues System', wr: [], sp: [], multi: false, unit: 'Geräte' }); saveSettings(); render(); break;
    case 'sys-del': { const x = S.systems[+a.dataset.i]; if (await confirmDlg('System löschen?', `„${x.name}“ wird aus der Auswahl entfernt.`, 'Löschen', true)) { S.systems.splice(+a.dataset.i, 1); saveSettings(); render(); } break; }
    case 'sys-reset': if (await confirmDlg('Systeme zurücksetzen?', 'EcoFlow, Tesla und E3/DC mit den Standardgrößen – eigene Änderungen gehen verloren.', 'Zurücksetzen')) { S.systems = clone(DEFAULTS.systems); saveSettings(); render(); } break;
    case 'mont-del': S.monteure.splice(+a.dataset.i, 1); saveSettings(); render(); break;
    case 'lists-reset': if (await confirmDlg('Listen zurücksetzen?', 'Alle Auswahllisten werden auf den Standard gesetzt.', 'Zurücksetzen')) { S.lists = clone(DEFAULTS.lists); saveSettings(); render(); } break;
  }
});

/* Eingaben ohne Neuaufbau (Tastatur bleibt offen) */
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.f && CUR && el.tagName !== 'BUTTON') { CUR.answers[el.dataset.f] = el.value; el.classList.remove('inp-req'); saveDraft(); return; }
  if (el.dataset.e !== undefined && CUR) {
    const i = +el.dataset.e, row = CUR.answers.einsaetze[i]; row[el.dataset.k] = el.value; saveDraft();
    const inf = $('#ein-info-' + i); if (inf) inf.innerHTML = einInfo(row, zuschlag(row.datum, CUR.answers.notdienst === 'ja'));
    const t = $('#ein-total'); if (t) t.textContent = hrs(serviceHours(CUR)); return;
  }
  if (el.dataset.sig && CUR) { CUR.sig[el.dataset.sig][el.dataset.k] = el.value; saveDraft(); return; }
  if (el.dataset.s) {
    const path = el.dataset.s.split('.'), last = path.pop(), obj = path.reduce((o, k) => o[k], S);
    obj[last] = el.type === 'number' || el.type === 'range' ? (el.value === '' ? '' : +el.value) : el.value; saveSettings();
    if (/^design\./.test(el.dataset.s)) applyTheme();
    if (el.type === 'range' || el.type === 'color') { const lab = el.closest('label'); if (lab && el.type === 'range') lab.querySelector('.lbl').textContent = `Ecken-Rundung: ${el.value} px`; if (el.type === 'color') el.nextElementSibling.textContent = el.value; }
    return;
  }
  if (el.dataset.wp !== undefined) { const x = S.wps[+el.dataset.wp], k = el.dataset.k; x[k] = k === 'multi' ? el.checked : k === 'models' ? el.value.split('\n').map(v => v.trim()).filter(Boolean) : el.value; saveSettings(); return; }
  if (el.dataset.sys !== undefined) { const x = S.systems[+el.dataset.sys], k = el.dataset.k; x[k] = k === 'multi' ? el.checked : k === 'wr' || k === 'sp' ? el.value.split('\n').map(v => v.trim()).filter(Boolean) : el.value; saveSettings(); return; }
  if (el.dataset.list) { S.lists[el.dataset.list] = el.value.split('\n').map(x => x.trim()).filter(Boolean); saveSettings(); return; }
  if (el.id === 'q') { UI.q = el.value; const box = $('#plist'); if (box) { const tmp = document.createElement('div'); tmp.innerHTML = viewList(); box.innerHTML = $('#plist', tmp).innerHTML; } }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset.s && (el.tagName === 'SELECT' || el.dataset.s.startsWith('zuschlag') || el.dataset.s === 'state')) { applyTheme(); render(); return; }
  if (el.matches('[data-photo]') && el.files && el.files.length && CUR) {
    toast('Fotos werden vorbereitet …');
    for (const file of el.files) { try { CUR.photos.push(await shrinkImage(file, 1600, 0.8)); } catch (err) { toast('Ein Foto konnte nicht gelesen werden.', 'err'); } }
    saveDraft(); render(); return;
  }
  if (el.matches('[data-logo]') && el.files && el.files[0]) { const im = await shrinkImage(el.files[0], 700, 0.92, 'image/png'); S.company.logo = im.data; saveSettings(); render(); toast('Logo gespeichert.'); return; }
  if (el.matches('[data-restore]') && el.files && el.files[0]) restore(el.files[0]);
});

/* ---------- Unterschrift ---------- */
function initSig() {
  const cv = $('#sig-cv'); if (!cv || !CUR) return;
  const who = cv.dataset.w, s = CUR.sig[who];
  if (!s.ort) { s.ort = guessOrt(); const o = $(`[data-sig="${who}"][data-k="ort"]`); if (o && s.ort) o.value = s.ort; }
  const r = cv.getBoundingClientRect(), dpr = Math.max(2, devicePixelRatio || 1);
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  const x = cv.getContext('2d'); x.scale(dpr, dpr); x.lineWidth = 2.6; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#13233A';
  if (s.data) { const im = new Image(); im.onload = () => x.drawImage(im, 0, 0, r.width, r.height); im.src = s.data; }
  let down = false, last = null, drawn = false;
  const pos = ev => { const b = cv.getBoundingClientRect(); return [ev.clientX - b.left, ev.clientY - b.top]; };
  cv.onpointerdown = ev => { cv.setPointerCapture(ev.pointerId); down = true; last = pos(ev); const ph = $('#sig-ph'); if (ph) ph.remove(); };
  cv.onpointermove = ev => { if (!down) return; const q = pos(ev); x.beginPath(); x.moveTo(...last); x.lineTo(...q); x.stroke(); last = q; drawn = true; };
  cv.onpointerup = cv.onpointercancel = () => { if (!down) return; down = false; if (drawn) { s.data = cv.toDataURL('image/png'); saveDraft(); } };
}

/* ---------- PDF anzeigen / teilen ---------- */
function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
/* PDF erstellen und sofort speichern; danach zusätzlich Teilen anbieten */
async function pdfFlow(rec) {
  modal(`<div class="text-center py-6"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('file', 26)}</div><div class="font-semibold text-[18px] mt-4">PDF wird erstellt …</div></div>`);
  try {
    const blob = await buildPdf(rec), name = `${rec.nr}_${(rec.answers.kunde || 'Kunde').replace(/[^\wäöüÄÖÜß-]+/g, '_')}.pdf`;
    saveBlob(blob, name);
    const file = new File([blob], name, { type: 'application/pdf' }), canShare = navigator.canShare && navigator.canShare({ files: [file] });
    modal(`<div class="text-center pt-2"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('check', 26, 2.4)}</div><div class="font-semibold text-[19px] mt-4">PDF gespeichert</div><div class="text-[13px] text-ink3 mt-1 break-all">${esc(name)}</div><p class="text-[13px] text-ink3 mt-2">Zu finden unter „Downloads“ bzw. in der Dateien-App.</p></div>
      <div class="grid gap-2 mt-6">${canShare ? `<button class="btn-p" id="pdf-share">${ic('share', 17)}Zusätzlich teilen (Mail, WhatsApp …)</button>` : ''}<button class="${canShare ? 'btn-s' : 'btn-p'}" id="pdf-again">${ic('download', 17)}Nochmal speichern / öffnen</button><button class="btn-g" data-a="modal-close">Fertig</button></div>`);
    $('#pdf-again').onclick = () => saveBlob(blob, name);
    const b = $('#pdf-share'); if (b) b.onclick = async () => { try { await navigator.share({ files: [file], title: name }); closeModal(); } catch (err) { if (err && err.name !== 'AbortError') toast('Teilen nicht möglich – das PDF ist bereits gespeichert.', 'warn'); } };
  } catch (err) { console.error(err); closeModal(); toast('PDF konnte nicht erstellt werden: ' + (err.message || err), 'err', 5000); }
}

/* ---------- Datensicherung ---------- */
function backup() {
  const data = { app: 'fruehauf-abnahme', version: APP_VERSION, date: new Date().toISOString(), settings: S, protocols: PROTS, draft: CUR };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `abnahme-sicherung-${isoToday()}.json`; document.body.appendChild(a); a.click(); a.remove();
  toast('Sicherung gespeichert.');
}
async function restore(file) {
  try {
    const d = JSON.parse(await file.text()); if (d.app !== 'fruehauf-abnahme') throw new Error('Keine Sicherung dieser App');
    if (!(await confirmDlg('Sicherung einspielen?', `${(d.protocols || []).length} Protokolle werden ergänzt bzw. aktualisiert, Einstellungen übernommen.`, 'Einspielen'))) return;
    S = deepMerge(clone(DEFAULTS), d.settings || {}); fixSettings(); saveSettings();
    for (const p of d.protocols || []) await DB.put('prot', p);
    PROTS = (await DB.all('prot')) || []; applyTheme(); render(); toast('Sicherung eingespielt.');
  } catch (err) { toast('Sicherung konnte nicht gelesen werden: ' + err.message, 'err', 5000); }
}

/* ---------- Start ---------- */
(async function init() {
  await DB.open(); await loadSettings();
  CUR = (await DB.get('kv', 'draft')) || null; if (CUR) { UI.step = CUR.step || 0; UI.maxStep = CUR.maxStep || 0; }
  PROTS = (await DB.all('prot')) || [];
  applyTheme(); route(); APP_READY = true;
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.design.mode === 'system') { applyTheme(); render(); } }); } catch (e) {}
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
})();

/* =========================================================
   PDF direkt mit jsPDF (Text, Fotos, Unterschriften) –
   kein Bildschirmfoto, daher auf iPad/iPhone genauso sauber wie am PC.
   ========================================================= */
function loadScript(src) { return new Promise((res, rej) => { if ($(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Bibliothek fehlt: ' + src)); document.head.appendChild(s); }); }
/* Nur Zeichen, die die PDF-Standardschrift kennt */
const T = s => String(s ?? '').replace(/[„“”]/g, '"').replace(/[‚‘’]/g, "'").replace(/[–—]/g, '-').replace(/×/g, 'x').replace(/…/g, '...').replace(/→/g, '->').replace(/[•·]/g, '·').replace(/[^\x00-\xFF€]/g, '');
async function imgInfo(src) {
  if (!src) return null;
  let data = src;
  if (!/^data:/.test(src)) { const b = await (await fetch(src)).blob(); data = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); }
  const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = data; });
  return { data, w: im.naturalWidth, h: im.naturalHeight, fmt: /^data:image\/png/.test(data) ? 'PNG' : 'JPEG' };
}
async function buildPdf(r) {
  await loadScript('vendor/jspdf.umd.min.js');
  const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const W = 210, H = 297, M = 16, CW = W - 2 * M, P = hex2rgb(S.design.primary), INK = [19, 35, 52], GRAY = [110, 124, 138], LINE = [222, 228, 234];
  const logo = await imgInfo(S.company.logo).catch(() => null), g = GEWERKE[r.gewerk], t = TYPES[r.type];
  const title = r.type === 'service' ? 'Serviceprotokoll' : 'Abnahmeprotokoll';
  let y = 0;
  const header = () => {
    doc.setFillColor(...P); doc.rect(0, 0, W, 2.2, 'F');
    if (logo) { const h = 13, w = Math.min(52, (logo.w / logo.h) * h); doc.addImage(logo.data, logo.fmt, M, 9, w, w / (logo.w / logo.h)); }
    else { doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...INK); doc.text(T(S.company.name), M, 17); }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...INK); doc.text(title, W - M, 13.5, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY); doc.text(T(`${g.name} · Nr. ${r.nr}`), W - M, 19, { align: 'right' });
    doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(M, 27, W - M, 27); y = 35;
  };
  const newPage = () => { doc.addPage(); header(); };
  const need = h => { if (y + h > H - 22) newPage(); };
  const section = s => { need(16); doc.setFillColor(...P); doc.rect(M, y - 3.2, 1.2, 4.6, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...INK); doc.text(T(s), M + 3.5, y); y += 5; };
  const LW = 62;
  const row = (label, value) => {
    doc.setFontSize(9.2); const lines = doc.splitTextToSize(T(value || '-'), CW - LW - 3), lab = doc.splitTextToSize(T(label), LW - 3), h = Math.max(lines.length, lab.length) * 4.3 + 2.6;
    need(h); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY); doc.text(lab, M, y + 3.2);
    doc.setTextColor(...INK); doc.text(lines, M + LW, y + 3.2); y += h; doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(M, y - 0.8, W - M, y - 0.8);
  };
  header();
  /* Kopf-Kasten */
  const date = r.type === 'service' ? ((r.answers.einsaetze || [])[0] || {}).datum : r.answers.datum;
  const facts = [['Kunde', r.answers.kunde], ['Adresse', r.answers.adresse], ['Datum', deDate(date)], ['Monteur', r.answers.monteur], ['Art', `${t.name} · ${g.name}`], [r.type === 'service' ? 'Auftrag' : 'Projekt', r.type === 'service' ? r.answers.auftrag : r.answers.projekt]].filter(x => x[1]);
  const fh = Math.ceil(facts.length / 2) * 11 + 4; doc.setFillColor(244, 247, 249); doc.roundedRect(M, y - 2, CW, fh, 2, 2, 'F');
  facts.forEach(([k, v], i) => { const cx = M + 5 + (i % 2) * (CW / 2), cy = y + 3 + Math.floor(i / 2) * 11; doc.setFontSize(7.6); doc.setTextColor(...GRAY); doc.setFont('helvetica', 'normal'); doc.text(T(k), cx, cy); doc.setFontSize(10); doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.text(doc.splitTextToSize(T(v), CW / 2 - 9)[0], cx, cy + 4.6); });
  y += fh + 6;
  /* Service: Zeiten und Zuschläge */
  if (r.type === 'service') {
    section('Einsatzzeiten und Zuschläge');
    const nd = r.answers.notdienst === 'ja', cols = [['Datum', 24], ['Tag', 22], ['Zeit', 24], ['Pause', 16], ['Dauer', 18], ['Zuschlag', CW - 104]];
    need(10); doc.setFillColor(238, 242, 245); doc.rect(M, y - 1, CW, 6.5, 'F'); doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRAY);
    let cx = M + 2; cols.forEach(([l, w]) => { doc.text(l, cx, y + 3.3); cx += w; }); y += 7.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    (r.answers.einsaetze || []).forEach(e => {
      const z = zuschlag(e.datum, nd), hol = holiday(e.datum), vals = [deDate(e.datum), hol ? 'Feiertag' : wdOf(e.datum), `${e.von || '?'}-${e.bis || '?'}`, +e.pause ? `${e.pause} Min.` : '-', hrs(durH(e)), `${z.total} %${z.nd || z.base !== 100 ? ` (${z.label})` : ''}`];
      need(7); cx = M + 2; doc.setTextColor(...INK); vals.forEach((v, i) => { doc.text(doc.splitTextToSize(T(v), cols[i][1] - 2)[0], cx, y + 3); cx += cols[i][1]; }); y += 6; doc.setDrawColor(...LINE); doc.line(M, y - 1, W - M, y - 1);
    });
    need(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK); doc.text(T(`Gesamtzeit vor Ort: ${hrs(serviceHours(r))}${nd ? '  ·  Notdienst-Einsatz' : ''}`), M + 2, y + 3.5); y += 10;
  }
  /* Alle Abschnitte */
  const skip = new Set(['kunde', 'adresse', 'datum', 'monteur', 'projekt', 'auftrag', 'einsaetze', 'notdienst']);
  for (const s of visSteps(r)) {
    const fs = visFields(r, s).filter(f => f.type !== 'thumbs' && !skip.has(f.id) && filled(r.answers[f.id]));
    if (!fs.length) continue;
    section(s.title); fs.forEach(f => row(labOf(f, r.answers), fmtValue(r, f))); y += 4;
  }
  /* Fotos */
  if (r.photos.length) {
    section(`Fotos (${r.photos.length})`);
    const cw = (CW - 6) / 2, chh = 66;
    for (let i = 0; i < r.photos.length; i++) {
      if (i % 2 === 0) need(chh + 4);
      const p = r.photos[i], k = Math.min(cw / p.w, chh / p.h), w = p.w * k, h = p.h * k, x0 = M + (i % 2) * (cw + 6);
      doc.setFillColor(244, 247, 249); doc.roundedRect(x0, y, cw, chh, 1.5, 1.5, 'F');
      doc.addImage(p.data, 'JPEG', x0 + (cw - w) / 2, y + (chh - h) / 2, w, h, undefined, 'FAST');
      if (i % 2 === 1 || i === r.photos.length - 1) y += chh + 5;
    }
  }
  /* Unterschriften */
  need(52); section('Bestätigung');
  doc.setFontSize(8.6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
  const conf = doc.splitTextToSize(T(r.type === 'service' ? 'Die oben aufgeführten Arbeiten, Zeiten und Materialien wurden ausgeführt bzw. verwendet.' : 'Die Arbeiten wurden wie oben beschrieben ausgeführt und abgenommen. Offene Restarbeiten sind im Protokoll vermerkt.'), CW);
  doc.text(conf, M, y + 2); y += conf.length * 4 + 4;
  const bw = (CW - 10) / 2;
  for (const [i, who] of [['0', 'monteur'], ['1', 'kunde']]) {
    const s = r.sig[who], x0 = M + +i * (bw + 10), sy = y;
    if (s.data && !(who === 'kunde' && s.absent)) { const im = await imgInfo(s.data); const k = Math.min(bw / im.w, 24 / im.h); doc.addImage(im.data, 'PNG', x0, sy + 24 - im.h * k, im.w * k, im.h * k); }
    else if (who === 'kunde' && s.absent) { doc.setFontSize(9); doc.setTextColor(...GRAY); doc.text('Kunde nicht anwesend', x0, sy + 20); }
    doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.line(x0, sy + 26, x0 + bw, sy + 26);
    doc.setFontSize(8); doc.setTextColor(...GRAY); doc.text(T(`${who === 'kunde' ? 'Kunde' : 'Monteur'}${who === 'monteur' && r.answers.monteur ? ' – ' + r.answers.monteur : who === 'kunde' && r.answers.kunde ? ' – ' + r.answers.kunde : ''}`), x0, sy + 30.5);
    doc.text(T(`${s.ort || ''}${s.ort ? ', ' : ''}${deDate(s.datum)}`), x0, sy + 34.5);
  }
  y += 40;
  /* Fußzeile */
  const n = doc.getNumberOfPages(), c = S.company, foot = T([c.name, c.street, c.city, c.phone, c.email, c.web].filter(Boolean).join(' · '));
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(M, H - 14, W - M, H - 14);
    doc.setFontSize(7.4); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY); doc.text(doc.splitTextToSize(foot, CW - 30)[0] || '', M, H - 9.5); doc.text(`Seite ${i} / ${n}`, W - M, H - 9.5, { align: 'right' });
  }
  return doc.output('blob');
}
/* =========================================================
   LumbraDesk: Abnahme & Service zentral
   Nur aktiv unter LumbraDesk (lumbradesk.de/abnahme/) – die eigenständige Version bleibt unverändert.
   - Fertige Protokolle (mit Fotos und Unterschriften) gehen automatisch auf den Server; ein neues Handy holt sie zurück.
   - Nummern vergibt der Server (keine doppelten Nummern zwischen Monteuren).
   - Beim Start wird der Kunde aus LumbraDesk gewählt – das Protokoll hängt dann beim Kunden.
   ========================================================= */
const LDA = { on: false, me: null, office: false, dirty: new Set(), gone: new Set(), init: false, last: 0, err: '', busy: false, timer: null, custs: null, custAt: 0, applying: false };
async function ldaState() { const s = (await DB.get('kv', 'ld-sync')) || {}; LDA.dirty = new Set(s.dirty || []); LDA.gone = new Set(s.gone || []); LDA.init = !!s.init; LDA.info = !!s.info; }
const ldaSave = () => DB.put('kv', { dirty: [...LDA.dirty], gone: [...LDA.gone], init: LDA.init, info: LDA.info }, 'ld-sync');
const ldaSoon = (ms = 2500) => { if (!LDA.on) return; clearTimeout(LDA.timer); LDA.timer = setTimeout(ldaSync, ms); };

/* Änderungen an Protokollen mitschreiben */
const _dbPutLda = DB.put.bind(DB), _dbDelLda = DB.del.bind(DB);
DB.put = function (store, val, key) {
  if (store === 'prot' && !LDA.applying && val && !val._remote) { LDA.dirty.add(val.id); LDA.gone.delete(val.id); if (LDA.on) { ldaSave(); ldaSoon(); } }
  return _dbPutLda(store, val, key);
};
DB.del = function (store, key) {
  if (store === 'prot' && !LDA.applying) { LDA.dirty.delete(key); LDA.gone.add(key); if (LDA.on) { ldaSave(); ldaSoon(); } }
  return _dbDelLda(store, key);
};
async function ldaApi(r, body) {
  const res = await fetch('../api/?r=' + r, body === undefined ? { credentials: 'same-origin', cache: 'no-store' } : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Lumbra': '1' }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({})); if (!res.ok) { const e = new Error(j.error || 'Fehler ' + res.status); e.status = res.status; throw e; } return j;
}

/* Abgleich */
async function ldaSync() {
  if (!LDA.on || LDA.busy || !navigator.onLine) return; LDA.busy = true; clearTimeout(LDA.timer);
  try {
    /* 1. Erstes Mal auf diesem Gerät: alle eigenen Protokolle hochladen */
    if (!LDA.init) PROTS.forEach(p => { if (!p._remote) LDA.dirty.add(p.id); });
    for (const id of [...LDA.gone]) { await ldaApi('ab-del', { id }); LDA.gone.delete(id); await ldaSave(); }
    for (const id of [...LDA.dirty]) {
      const p = PROTS.find(x => x.id === id); if (!p) { LDA.dirty.delete(id); continue; }
      const m = await ldaApi('ab-put', p); LDA.dirty.delete(id); await ldaSave();
      if (m.project && p.projectId !== m.project) { p.projectId = m.project; LDA.applying = true; try { await DB.put('prot', clone(p)); } finally { LDA.applying = false; } }
    }
    /* 2. Eigene Protokolle vom Server holen, die hier fehlen (neues Handy) oder anderswo geändert wurden */
    const j = await ldaApi('ab-list&scope=mine'); let got = 0;
    for (const m of j.list) {
      const loc = PROTS.find(x => x.id === m.id);
      if (m.deleted) { if (loc && !LDA.dirty.has(m.id)) { LDA.applying = true; try { await DB.del('prot', m.id); } finally { LDA.applying = false; } PROTS = PROTS.filter(x => x.id !== m.id); got++; } continue; }
      if (loc && (loc.updated || 0) >= m.upd) continue;
      const rec = await ldaApi('ab-get&id=' + encodeURIComponent(m.id)); delete rec._meta;
      LDA.applying = true; try { await DB.put('prot', rec); } finally { LDA.applying = false; }
      PROTS = PROTS.filter(x => x.id !== m.id).concat(rec); got++;
    }
    LDA.init = true; LDA.last = Date.now(); LDA.err = ''; await ldaSave();
    if (got) { render(); toast(`${got} Protokoll${got === 1 ? '' : 'e'} vom Server geholt.`); }
    if (!LDA.info) ldaInfo();
  } catch (e) { LDA.err = e.status === 401 ? 'Bitte in LumbraDesk neu anmelden.' : 'Abgleich gerade nicht möglich – wird nachgeholt.'; }
  finally { LDA.busy = false; ldaPaint(); if (LDA.dirty.size || LDA.gone.size) ldaSoon(30000); }
}
function ldaInfo() {
  LDA.info = true; ldaSave(); if ($('#modal').innerHTML) return;
  modal(`<div class="text-center"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('check', 26, 2.4)}</div><div class="font-semibold text-[19px] mt-4">Abnahme & Service in LumbraDesk</div></div>
    <div class="text-[14px] text-ink2 mt-4 space-y-2"><p>Fertige Protokolle – mit Fotos und Unterschriften – werden ab jetzt automatisch auf dem Firmen-Server gespeichert und erscheinen beim Kunden in LumbraDesk.</p><p>Beim neuen Protokoll wählst du den Kunden aus der Liste. Die Nummer vergibt der Server, damit es keine doppelten Nummern gibt.</p><p>Geht dein Handy kaputt, ist nichts verloren – einfach auf dem neuen Handy anmelden.</p></div>
    <button class="btn-p w-full mt-5" data-a="modal-close">${ic('check', 16)}Verstanden</button>`);
}
const ldaAgo = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'gerade eben' : m < 60 ? `vor ${m} Min.` : `vor ${Math.round(m / 60)} Std.`; };
function ldaStatus() {
  const n = LDA.dirty.size + LDA.gone.size;
  return `<div id="lda-status" class="rounded-[var(--r)] border border-line p-4 mb-5"><div class="flex flex-wrap items-center gap-2"><b class="flex-1">Abgleich mit LumbraDesk</b><button class="btn-s !h-9" data-a="lda-now">${ic('refresh', 15)}Jetzt abgleichen</button></div>
    <p class="text-[14px] mt-2 ${LDA.err ? 'text-yel-ink' : 'text-ink2'}">${LDA.err ? esc(LDA.err) : LDA.last ? `Zuletzt abgeglichen ${ldaAgo(LDA.last)}${n ? ` · ${n} Protokoll${n === 1 ? '' : 'e'} warten` : ' · alles auf dem Server'}` : 'Noch nicht abgeglichen.'}</p>
    <p class="hint">Angemeldet als ${esc((LDA.me || {}).name || '')}. Fertige Protokolle mit Fotos und Unterschriften liegen auf dem Firmen-Server; Büro und Admins sehen sie beim Kunden.</p></div>`;
}
function ldaPaint() { const el = $('#lda-status'); if (el) el.outerHTML = ldaStatus(); }
const _setBodyLda = setBody;
setBody = function () {
  const b = _setBodyLda(); if (!LDA.on || UI.tab !== 'daten') return b;
  return ldaStatus() + b;
};

/* Neues Protokoll: Kunde aus LumbraDesk wählen, Nummer vom Server */
async function ldaCustomers() {
  if (LDA.custs && Date.now() - LDA.custAt < 120000) return LDA.custs;
  try { LDA.custs = (await ldaApi('ab-customers')).customers; LDA.custAt = Date.now(); await DB.put('kv', LDA.custs, 'ld-custs'); }
  catch (e) { LDA.custs = LDA.custs || (await DB.get('kv', 'ld-custs')) || []; }
  return LDA.custs;
}
const STG_DE = { anfrage: 'Anfrage', termin: 'Termin', angebot: 'Angebot', auftrag: 'Auftrag', montage: 'Montage', fertig: 'Abgeschlossen' };
function ldaPick(r) {
  return new Promise(async res => {
    const list = await ldaCustomers();
    const rows = q => { const s = q.trim().toLowerCase(); const l = list.filter(c => !s || `${c.name} ${c.city} ${c.street}`.toLowerCase().includes(s)).slice(0, 40);
      return l.map(c => `<button class="opt !min-h-[58px] text-left" data-lc="${esc(c.id)}"><span class="flex-1 min-w-0"><span class="block font-semibold truncate">${esc(c.name)}</span><span class="block text-[12px] text-ink3 font-normal truncate">${esc([c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || 'ohne Adresse')}</span></span><span class="badge bg-raised text-ink2 border border-line shrink-0">${STG_DE[c.stage] || ''}</span></button>`).join('') || '<p class="text-ink3 text-[14px] py-3">Kein Kunde gefunden.</p>'; };
    modal(`<h3 class="text-[20px] font-semibold pr-8">Für welchen Kunden?</h3><p class="text-ink3 text-[14px] mt-1">Kunden aus LumbraDesk – Aufträge in Montage stehen oben.</p>
      <input class="inp mt-4" id="lc-q" placeholder="Name oder Ort suchen …" autocomplete="off"><div class="grid gap-2 mt-3 max-h-[52vh] overflow-y-auto" id="lc-list">${rows('')}</div>
      <button class="btn-s w-full mt-4" id="lc-none">Kunde ist nicht in der Liste</button>`);
    const done = c => { closeModal(); if (c) { r.projectId = c.id; r.answers.kunde = c.name; r.answers.adresse = [c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', '); if (c.phone) r.answers.telefon = c.phone; } res(true); };
    $('#lc-q').oninput = e => { $('#lc-list').innerHTML = rows(e.target.value); };
    $('#lc-list').onclick = e => { const b = e.target.closest('[data-lc]'); if (b) done(list.find(c => c.id === b.dataset.lc)); };
    $('#lc-none').onclick = () => done(null);
  });
}
const _startRecordLda = startRecord;
startRecord = async function (r) {
  if (r.step) delete r._remote;   // Protokoll eines Kollegen ändern (Büro): danach normal abgleichen
  if (!LDA.on || r.step) return _startRecordLda(r);
  await ldaPick(r);
  try {   // Nummer vom Server (offline: die Nummer dieses Geräts bleibt)
    const key = r.nr.replace(/-\d+$/, ''), j = await ldaApi('ab-number', { key, local: (S.numbers[key] || 1) - 1 });
    r.nr = `${key}-${String(j.n).padStart(4, '0')}`; S.numbers[key] = j.n; saveSettings();
  } catch (e) {}
  return _startRecordLda(r);
};

/* Protokoll eines Kollegen öffnen (Link aus LumbraDesk): vom Server holen und nur hier anzeigen */
const _routeLda = route;
route = async function () {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  if (LDA.ready && h[0] === 'p' && h[1] && !PROTS.some(p => p.id === h[1])) {
    try { const rec = await ldaApi('ab-get&id=' + encodeURIComponent(h[1])); delete rec._meta; rec._remote = true; LDA.applying = true; try { await DB.put('prot', rec); } finally { LDA.applying = false; } PROTS = PROTS.concat(rec); }
    catch (e) { toast('Protokoll nicht verfügbar: ' + e.message, 'err', 5000); }
  }
  return _routeLda();
};
window.removeEventListener('hashchange', _routeLda); window.addEventListener('hashchange', () => route());

document.addEventListener('click', e => { const a = e.target.closest('[data-a="lda-now"]'); if (!a) return; e.stopImmediatePropagation(); ldaSync().then(() => toast(LDA.err || 'Abgeglichen.', LDA.err ? 'warn' : 'ok')); }, true);

/* Start: nur unter LumbraDesk */
(async function ldaStart() {
  if (!/\/abnahme\/(index\.html)?$/.test(location.pathname)) return;
  try {
    const j = await ldaApi('me'); if (!j.user) return;
    await new Promise(r => { const t = setInterval(() => { if (APP_READY) { clearInterval(t); r(); } }, 50); });
    await ldaState(); LDA.on = true; LDA.ready = true; LDA.me = j.user; LDA.office = ['admin', 'buero'].includes(j.user.role);
    if (/^#\/?p\//.test(location.hash)) await route();
    await ldaSync(); ldaCustomers();
    setInterval(ldaSync, 120000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') ldaSync(); });
    window.addEventListener('online', () => ldaSync());
  } catch (e) { /* nicht unter LumbraDesk oder offline */ }
})();
