
/* =========================================================
   Frühauf – Abnahme & Service
   Eigenständige App: Baustellen-Abnahme und Serviceeinsätze für DC, AC und SHK.
   Daten bleiben auf dem Gerät (IndexedDB), Protokolle als PDF teilen.
   ========================================================= */
const APP_VERSION = '1.8';
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
