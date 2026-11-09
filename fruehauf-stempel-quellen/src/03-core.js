
/* =========================================================
   Frühauf – Stempeluhr
   Eigenständige App: Arbeitszeiten stempeln (Kommen, Pause, Gehen), Baustellen je Tag,
   Wochenzettel als PDF – direkt per WhatsApp teilen. Daten bleiben auf dem Gerät.
   ========================================================= */
const APP_VERSION = '1.1';
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
  person: { name: '', nr: '' },
  recipient: { name: 'Jule', phone: '' },
  state: 'NW',
  /* Sollzeiten je Wochentag (0 = Sonntag) */
  hours: { 1: { on: true, von: '07:30', bis: '16:30' }, 2: { on: true, von: '07:30', bis: '16:30' }, 3: { on: true, von: '07:30', bis: '16:30' }, 4: { on: true, von: '07:30', bis: '16:30' }, 5: { on: true, von: '07:30', bis: '13:45' }, 6: { on: false, von: '', bis: '' }, 0: { on: false, von: '', bis: '' } },
  minPause: 30,            // wird immer abgezogen – längere Pausen werden voll abgezogen
  pauseOnlyOver6: false,   // optional: Mindestpause erst ab 6 Std. Arbeit
  sites: [],               // zuletzt genutzte Baustellen (Vorschläge)
  vacation: { perYear: 30, carry: 0 },
  balance: { from: '', min: 0 },   // Überstundenkonto: Startdatum und Startwert (Minuten)
  gps: false,              // Standort beim Stempeln merken
  admin: null              // eigenes Admin-Passwort (nur als PBKDF2-Hash)
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
function fixSettings() { for (const k of [0, 1, 2, 3, 4, 5, 6]) if (!S.hours[k]) S.hours[k] = clone(DEFAULTS.hours[k]); }
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
