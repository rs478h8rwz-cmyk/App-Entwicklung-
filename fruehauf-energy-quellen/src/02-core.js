<body class="min-h-screen antialiased">
<style id="splash-css">
#splash{position:fixed;inset:0;z-index:200;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 58%,#16262a 0%,#0a0f14 60%,#06080b 100%);overflow:hidden;cursor:pointer}
#splash.sp-light{background:radial-gradient(ellipse at 50% 58%,#ffffff 0%,#eef4f8 60%,#dfe8ef 100%)}
#splash .sp-stage{position:relative;width:min(92vw,760px);aspect-ratio:3/2;transform-origin:50% 62%;opacity:0;transform:translateY(14px) scale(.97);transition:opacity .55s ease,transform .7s cubic-bezier(.2,.8,.2,1)}
#splash.s-in .sp-stage{opacity:1;transform:none}
#splash .sp-stage svg{width:100%;height:100%;display:block;border-radius:22px}
#splash .spk-pv polygon,#splash .spk-pv rect{opacity:0;transform:translateY(-6px);transition:opacity .22s ease,transform .3s ease}
#splash.s-pv .spk-pv polygon,#splash.s-pv .spk-pv rect{opacity:1;transform:none}
#splash .spk-bat{opacity:0;transform:translateY(18px);transition:opacity .35s ease,transform .45s cubic-bezier(.2,1.4,.4,1)}
#splash.s-bat .spk-bat{opacity:1;transform:none}
#splash .spk-hp{opacity:0;transform-box:fill-box;transform-origin:50% 100%;transform:scale(.6);transition:opacity .3s ease,transform .45s cubic-bezier(.2,1.5,.4,1)}
#splash.s-hp .spk-hp{opacity:1;transform:none}
#splash .spk-car{opacity:0;transform:translateX(-140px);transition:opacity .3s ease,transform .8s cubic-bezier(.2,.8,.2,1)}
#splash.s-car .spk-car{opacity:1;transform:none}
#splash.s-bat .spk-bat,#splash.s-hp .spk-hp,#splash.s-car .spk-car{animation:spGlowIn 1.1s ease}
#splash.s-pv .spk-pv{animation:spGlowIn 1.6s .2s ease}
@keyframes spGlowIn{0%{filter:none}30%{filter:drop-shadow(0 0 6px #5CE0A8) drop-shadow(0 0 14px #5CE0A8) brightness(1.35)}100%{filter:none}}
#splash.s-zoom .sp-stage{transition:transform .8s cubic-bezier(.7,0,.2,1),opacity .6s .2s ease;transform:scale(7);opacity:0}
#splash .sp-logo{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.7);opacity:0;display:flex;flex-direction:column;align-items:center;gap:14px;transition:opacity .45s ease,transform .6s cubic-bezier(.2,.8,.2,1);white-space:nowrap;pointer-events:none}
#splash .sp-logo img.sp-img{max-width:min(70vw,360px);max-height:150px;background:#fff;border-radius:18px;padding:14px 22px;box-shadow:0 24px 60px -24px rgba(0,0,0,.6)}
#splash .sp-name{font:600 24px/1.2 system-ui,-apple-system,Segoe UI,sans-serif;color:#eef6f3}
#splash.sp-light .sp-name{color:#132430}
#splash.s-logo .sp-logo{opacity:1;transform:translate(-50%,-50%) scale(1)}
#splash.s-out .sp-logo{transition:transform .75s cubic-bezier(.7,0,.2,1),opacity .55s .15s ease;transform:translate(-50%,-50%) scale(5);opacity:0}
#splash.s-out{background:transparent;transition:background .6s .2s ease;pointer-events:none}
#splash.s-zoom{pointer-events:none}
#splash .sp-skipbtn{position:absolute;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:2;font:600 15px system-ui,sans-serif;color:#fff;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:12px 20px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);touch-action:manipulation}
#splash.sp-light .sp-skipbtn{color:#132430;background:rgba(0,0,0,.06);border-color:rgba(0,0,0,.15)}
#splash .sp-skip{position:absolute;bottom:max(18px,env(safe-area-inset-bottom));left:0;right:0;text-align:center;font:500 12px system-ui,sans-serif;color:rgba(160,180,190,.6)}
@media (prefers-reduced-motion: reduce){#splash *{transition-duration:.15s!important;transition-delay:0s!important}}
</style>
<div id="splash" aria-hidden="true"><div class="sp-stage" id="sp-stage"></div><div class="sp-logo" id="sp-logo"></div><button type="button" class="sp-skipbtn" id="sp-skip">Überspringen ›</button></div>
<div id="app"></div>
<div id="toasts" class="fixed top-3 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-2 pointer-events-none w-[92vw] max-w-md"></div>
<div id="modal"></div>
<div id="print-root" aria-hidden="true"></div>
<script>
'use strict';
/* =========================================================
   Frühauf Energy – Wirtschaftlichkeitsrechner
   ========================================================= */

/* ---------- Kleine Helfer ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const isNum = v => typeof v === 'number' && isFinite(v);
const nz = (v, d = 0) => (isNum(v) ? v : d);
const NF = {};
const nfmt = (d, g = true) => NF[d + '' + g] || (NF[d + '' + g] = new Intl.NumberFormat('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: g }));
const num = (v, d = 0) => (isNum(v) ? nfmt(d).format(v) : '–');
const eur = (v, d = 0) => (isNum(v) ? nfmt(d).format(v) + ' €' : '–');
const eur2 = v => eur(v, 2);
/* Erzeugter Strom ist eine Schätzung: immer auf volle 100 kWh abrunden */
const kwh100 = v => (isNum(v) ? nfmt(0).format(Math.max(0, Math.floor(v / 100) * 100)) : '–');
const pct = (v, d = 0) => (isNum(v) ? nfmt(d).format(v) + ' %' : '–');
const ct = v => (isNum(v) ? nfmt(1).format(v * 100) + ' ct' : '–');
const yrs = (v, d = 1) => (isNum(v) ? nfmt(d).format(v) + ' Jahre' : 'über 20 Jahre');
const inputFmt = (v, t) => {
  if (v === null || v === undefined || v === '' || (typeof v === 'number' && !isFinite(v))) return '';
  if (t === 'y') return String(v);
  if (t === 'n') return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 4 }).format(v);
  return String(v);
};
function pnum(s) {
  if (typeof s === 'number') return s;
  s = String(s ?? '').replace(/[€\s%]/g, '').replace(/ct|kWh|kWp|kW|EUR/gi, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const v = parseFloat(s);
  return isFinite(v) ? v : NaN;
}
const deDate = iso => { if (!iso) return ''; const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return m ? `${m[3]}.${m[2]}.${m[1]}` : iso; };
const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const yearOf = iso => { const m = /^(\d{4})/.exec(iso || ''); return m ? +m[1] : new Date().getFullYear(); };
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
function setPath(o, p, v) { const ks = p.split('.'); let a = o; ks.slice(0, -1).forEach(k => { if (a[k] == null || typeof a[k] !== 'object') a[k] = {}; a = a[k]; }); a[ks[ks.length - 1]] = v; }
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
function deepMerge(base, over) {
  if (Array.isArray(base)) return Array.isArray(over) ? over : base;
  if (base && typeof base === 'object') {
    const out = { ...base };
    if (over && typeof over === 'object' && !Array.isArray(over)) for (const k of Object.keys(over)) out[k] = k in base ? deepMerge(base[k], over[k]) : over[k];
    return out;
  }
  return over === undefined ? base : over;
}
const initials = n => (String(n || '').replace(/^(Herr|Frau|Familie|Eheleute|Firma)\s+/i, '').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('') || '?').toUpperCase();

/* ---------- Farben ---------- */
function hexToRgb(h) { h = String(h || '').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); if (!/^[0-9a-f]{6}$/i.test(h)) return [14, 124, 102]; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')).join('');
function mix(h1, h2, w) { const a = hexToRgb(h1), b = hexToRgb(h2); return rgbToHex(a[0] * (1 - w) + b[0] * w, a[1] * (1 - w) + b[1] * w, a[2] * (1 - w) + b[2] * w); }
function lum(h) { const c = hexToRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
const contrastOn = h => (lum(h) > 0.45 ? '#0F2A3D' : '#ffffff');
const FONTS = {
  'Geist': 'Geist:wght@400;500;600;700', 'Inter': 'Inter:wght@400;500;600;700', 'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;500;600;700', 'DM Sans': 'DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700',
  'Figtree': 'Figtree:wght@400;500;600;700', 'Instrument Sans': 'Instrument+Sans:wght@400;500;600;700', 'Manrope': 'Manrope:wght@400;500;600;700', 'IBM Plex Sans': 'IBM+Plex+Sans:wght@400;500;600;700',
  'Instrument Serif': 'Instrument+Serif', 'Fraunces': 'Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600', 'Newsreader': 'Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600', 'DM Serif Display': 'DM+Serif+Display',
  'Geist Mono': 'Geist+Mono:wght@400;500', 'IBM Plex Mono': 'IBM+Plex+Mono:wght@400;500', 'JetBrains Mono': 'JetBrains+Mono:wght@400;500'
};
const SERIFS = ['Instrument Serif', 'Fraunces', 'Newsreader', 'DM Serif Display'];
const MONOS = ['Geist Mono', 'IBM Plex Mono', 'JetBrains Mono'];
let THEME_CTX = 'app';
const sysDark = () => { try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return true; } };
const isStudio = () => false; /* Studio-Ansicht entfernt – alte Einstellung „studio“ zählt als Dunkel */
const appDark = () => (S.design.mode === 'system' ? sysDark() : S.design.mode !== 'light');
const STUDIO = { base: '#141415', side: '#0f0f10', card: '#19191b', raised: '#232325', field: '#111112', ink: '#ededed', ink2: '#a1a1a6', ink3: '#85858b' };
const docDark = () => S.design.pdfTheme === 'dark';
const rgbStr = h => hexToRgb(h).join(' ');
const rgba = (h, a) => `rgba(${hexToRgb(h).join(',')},${a})`;
function applyTheme() {
  const d = S.design, dark = appDark(), r = document.documentElement.style, set = (k, v) => r.setProperty(k, v);
  const P = dark ? mix(d.primary, '#ffffff', 0.28) : d.primary;
  set('--p', P); set('--p-rgb', rgbStr(P)); set('--s', d.secondary); set('--s-rgb', rgbStr(d.secondary));
  set('--acc', d.accent); set('--old', d.old); set('--gold', mix(d.secondary, '#ffffff', 0.35));
  set('--p-dark', mix(d.primary, '#000000', 0.22));
  document.documentElement.dataset.ui = isStudio() ? 'studio' : dark ? 'dark' : 'light';
  if (dark) {
    const st = isStudio(), base = st ? STUDIO.base : d.night, ink = st ? STUDIO.ink : '#ECEFF3';
    set('--bg', base); set('--card', st ? STUDIO.card : mix(base, '#ffffff', 0.035)); set('--raised', st ? STUDIO.raised : mix(base, '#ffffff', 0.07)); set('--field', st ? STUDIO.field : mix(base, '#000000', 0.15)); set('--side', st ? STUDIO.side : base);
    set('--ink', ink); set('--ink2', st ? STUDIO.ink2 : '#A7B2BE'); set('--ink3', st ? STUDIO.ink3 : '#7A8692');
    set('--line', 'rgba(255,255,255,.07)'); set('--line2', 'rgba(255,255,255,.13)');
    set('--p-light', rgba(P, 0.15)); set('--t-red', rgba(d.old, 0.15)); set('--t-yel', rgba(d.secondary, 0.13)); set('--tile', mix(base, '#ffffff', 0.07));
    set('--yel-ink', mix(d.secondary, '#ffffff', 0.35)); set('--red-ink', mix(d.old, '#ffffff', 0.4)); set('--s-dark', mix(d.secondary, '#ffffff', 0.3));
    set('--btn', d.buttonStyle === 'color' ? P : ink); set('--btn-ink', d.buttonStyle === 'color' ? contrastOn(P) : base); set('--btn-h', d.buttonStyle === 'color' ? mix(P, '#ffffff', 0.1) : '#ffffff');
    set('--hl', st ? 'linear-gradient(180deg,#232325 0%,#1c1c1e 100%)' : d.highlight === 'gradient' ? `linear-gradient(125deg,${mix(d.primary, base, 0.35)} 0%,${mix(d.accent, base, 0.4)} 100%)` : mix(d.primary, base, 0.62));
    set('--header', base); set('--hi', '.035'); set('--scheme', 'dark'); set('--hero-fade', rgba(base, 0.82)); set('--hero-fade2', rgba(base, 0.45));
  } else {
    const base = d.bg, ink = d.ink;
    set('--bg', base); set('--card', '#ffffff'); set('--raised', mix(base, ink, 0.035)); set('--field', '#ffffff');
    set('--ink', ink); set('--ink2', mix(ink, '#ffffff', 0.22)); set('--ink3', mix(ink, '#ffffff', 0.42));
    set('--line', rgba(ink, 0.09)); set('--line2', rgba(ink, 0.16));
    set('--p-light', mix(d.primary, '#ffffff', 0.88)); set('--t-red', mix(d.old, '#ffffff', 0.9)); set('--t-yel', mix(d.secondary, '#ffffff', 0.86)); set('--tile', mix(base, '#ffffff', 0.35));
    set('--yel-ink', mix(d.secondary, '#000000', 0.45)); set('--red-ink', mix(d.old, '#000000', 0.25)); set('--s-dark', mix(d.secondary, '#000000', 0.4));
    set('--btn', d.buttonStyle === 'light' ? ink : d.primary); set('--btn-ink', '#ffffff'); set('--btn-h', mix(d.buttonStyle === 'light' ? ink : d.primary, '#000000', 0.15));
    set('--hl', d.highlight === 'gradient' ? `linear-gradient(125deg,${d.primary} 0%,${d.accent} 100%)` : d.primary);
    set('--header', base); set('--hi', '0'); set('--scheme', 'light'); set('--hero-fade', rgba(base, 0.85)); set('--hero-fade2', rgba(base, 0.5));
  }
  set('--hl-num', mix(d.secondary, '#ffffff', 0.4));
  set('--r', d.radius + 'px'); set('--rb', (d.buttons === 'pill' ? 999 : Math.max(4, Math.round(d.radius * 0.65))) + 'px'); set('--dr', (d.radius / 4.8).toFixed(2) + 'mm');
  set('--fb', `"${d.fontBody}"`); set('--fh', `"${d.fontHead}"`); set('--fm', `"${d.fontMono}"`); set('--hw', d.headWeight);
  // Kundendokument (bei eigenem Deckblatt in dessen Farben)
  const pal = typeof coverPalActive === 'function' ? coverPalActive() : null, dd0 = pal ? { ...d, ...pal } : d;
  const dd = docDark(), mixed = d.pdfTheme === 'mixed', night = '#0B1118';
  set('--d-p', dd0.primary); set('--d-p-rgb', rgbStr(dd0.primary)); set('--d-p-light-dk', rgba(mix(dd0.primary, '#ffffff', 0.2), 0.18));
  set('--d-ink', d.ink); set('--d-ink2', mix(d.ink, '#ffffff', 0.22)); set('--d-ink3', mix(d.ink, '#ffffff', 0.42));
  set('--d-line', rgba(d.ink, 0.1)); set('--d-line2', rgba(d.ink, 0.17)); set('--d-bg', '#ffffff'); set('--d-tile', mix(d.bg, '#ffffff', 0.25)); set('--d-th', mix(d.bg, d.ink, 0.04));
  set('--d-t-red', mix(d.old, '#ffffff', 0.9)); set('--d-t-yel', mix(dd0.secondary, '#ffffff', 0.86)); set('--d-p-light', mix(dd0.primary, '#ffffff', 0.88));
  set('--d-s-dark', mix(dd0.secondary, '#000000', 0.42)); set('--d-sky', mix(dd0.accent, '#ffffff', 0.9));
  set('--d-hl', mixed || dd ? (d.highlight === 'gradient' ? `linear-gradient(125deg,${mix(dd0.primary, night, 0.45)} 0%,${night} 100%)` : mix(dd0.primary, night, 0.7)) : (d.highlight === 'gradient' ? `linear-gradient(125deg,${dd0.primary} 0%,${dd0.accent} 100%)` : dd0.primary));
  set('--d-hl-num', mix(dd0.secondary, '#ffffff', 0.35)); set('--d-band', mixed || dd ? night : dd0.primary);
  // dunkle Seiten: Himmel und Farbband mit sichtbarem Übergang
  set('--d-sky-dk', mix(dd0.accent, night, 0.62)); set('--d-band-dk', (() => { const a = mix(dd0.primary, night, 0.5), st = []; for (let i = 0; i <= 10; i++) { const t = i / 10, e = t * t * (3 - 2 * t); st.push(`${mix(a, night, e)} ${t * 100}%`); } return `linear-gradient(180deg,${st.join(',')})`; })());
  // Kopfzeile „Farbverlauf“: Farben, Stärke und Länge frei wählbar
  // Verlauf wird durchgehend heller: von „Farbe oben“ bis zur Endfarbe (leer = Seitenhintergrund), danach bleibt die Endfarbe
  const hf = d.hdrFrom || dd0.primary, hl = clamp(nz(d.hdrHeight, 60), 25, 297);
  // weiche S-Kurve mit vielen Zwischenstufen – kein harter Übergang
  const soft = (a, b, len) => { const st = []; for (let i = 0; i <= 14; i++) { const t = i / 14, e = t * t * t * (t * (t * 6 - 15) + 10); st.push(`${mix(a, b, e)} ${(t * len).toFixed(2)}%`); } return `linear-gradient(180deg,${st.join(',')},${b} 100%)`; };
  // Lesbarkeit: Endfarbe passend zur Schrift (helle Seiten: dunkle Schrift, dunkle Seiten: helle Schrift)
  const lumOf = h => { const [r, g, b] = hexToRgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  const fit = (col, toward, ok) => { let c = col; for (let i = 0; i < 20 && !ok(lumOf(c)); i++) c = mix(c, toward, 0.15); return c; };
  const ease = t => t * t * t * (t * (t * 6 - 15) + 10);
  const variant = (end, ok, toward) => {
    const e2 = fit(end, toward, ok); let len = hl;
    // ab ca. 29 mm beginnt der Text – dort muss der Verlauf schon hell bzw. dunkel genug sein
    while (len > 30 && !ok(lumOf(mix(hf, e2, ease(Math.min(1, 29 / len)))))) len -= 4;
    return soft(hf, e2, len / 297 * 100);
  };
  set('--d-hdr-lt', variant(d.hdrTo || '#ffffff', l => l >= 0.62, '#ffffff'));
  set('--d-hdr-dk', variant(d.hdrTo || night, l => l <= 0.3, night));
  const lum = (() => { const [r, g, b] = hexToRgb(hf); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; })();
  set('--d-hdr-ink', lum < 0.6 ? '#ffffff' : '#0F2A3D');
  const m = $('meta[name=theme-color]'); if (m) m.content = dark ? d.night : d.bg;
}
/* Diagrammfarben – abhängig davon, ob für App oder Dokument gezeichnet wird */
function C() {
  const d = S.design, dark = THEME_CTX === 'doc' ? docDark() : appDark();
  const P = dark ? mix(d.primary, '#ffffff', THEME_CTX === 'doc' ? 0.15 : 0.28) : d.primary;
  const st = THEME_CTX !== 'doc' && isStudio();
  const ink = dark ? (st ? STUDIO.ink : '#ECEFF3') : d.ink, surf = dark ? (THEME_CTX === 'doc' ? '#141B24' : st ? STUDIO.raised : mix(d.night, '#ffffff', 0.07)) : '#ffffff';
  return {
    dark, p: P, s: d.secondary, pl: dark ? rgba(P, 0.18) : mix(d.primary, '#ffffff', 0.88), pd: mix(d.primary, '#000000', 0.22),
    ink, ink2: dark ? '#A7B2BE' : mix(ink, '#ffffff', 0.22), ink3: dark ? '#7F8B98' : mix(ink, '#ffffff', 0.42), ink4: dark ? '#6A7683' : mix(ink, '#ffffff', 0.5),
    grid: dark ? 'rgba(255,255,255,.07)' : rgba(ink, 0.08), track: dark ? 'rgba(255,255,255,.08)' : rgba(ink, 0.06), stroke: dark ? 'rgba(255,255,255,.16)' : rgba(ink, 0.18),
    surface: surf, neutral: dark ? 'rgba(255,255,255,.14)' : mix(ink, '#ffffff', 0.84),
    tBlue: dark ? rgba(d.accent, 0.22) : mix(d.accent, '#ffffff', 0.9), tRed: dark ? rgba(d.old, 0.2) : mix(d.old, '#ffffff', 0.9), tYel: dark ? rgba(d.secondary, 0.18) : mix(d.secondary, '#ffffff', 0.86),
    tGrn: dark ? rgba(P, 0.2) : mix(d.primary, '#ffffff', 0.88), tGray: dark ? 'rgba(255,255,255,.07)' : rgba(ink, 0.05), yelInk: dark ? mix(d.secondary, '#ffffff', 0.35) : mix(d.secondary, '#000000', 0.45),
    line: dark ? 'rgba(255,255,255,.1)' : rgba(ink, 0.1), red: d.old, red2: dark ? mix(d.old, '#ffffff', 0.12) : mix(d.old, '#ffffff', 0.08), blue: dark ? mix(d.accent, '#ffffff', 0.35) : d.accent,
    salmon: dark ? rgba(d.old, 0.45) : mix(d.old, '#ffffff', 0.62)
  };
}

/* ---------- Zoom unterbinden ---------- */
document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', e => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
/* Doppeltipp-Zoom per CSS abschalten – Tipps werden nie verworfen (früherer touchend-Filter schluckte schnelle Tipps) */
document.head.insertAdjacentHTML('beforeend', '<style>button,a,[data-a],[data-r],.chip,.btn,.btn-p,.btn-s,.btn-g{touch-action:manipulation}input,textarea,select,[contenteditable]{touch-action:auto!important;-webkit-user-select:text;user-select:text}</style>');

/* ---------- Icons ---------- */
const IP = {
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
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
  studio: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  fan: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 7.5v9M7.5 12h9"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  battery: '<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 11v2M6 10v4M10 10v4"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  euro: '<path d="M4 10h12M4 14h9M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c.93 0 1.5-.75 1.5-1.5 0-.4-.15-.74-.4-1-.26-.26-.4-.6-.4-1 0-.83.67-1.5 1.5-1.5H16a6 6 0 0 0 6-6c0-4.97-4.48-9-10-9z"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
  scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1ZM2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M16 14v4M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',
  ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  sparkle: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  spa: '<path d="M12 22c4.97 0 9-2.69 9-6s-4.03-6-9-6-9 2.69-9 6 4.03 6 9 6Z"/><path d="M12 10c0-3 1.5-6 4-8M12 10c0-3-1.5-6-4-8"/>',
  bike: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  pen: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>'
};
const ic = (n, s = 18, cls = '') => `<svg class="${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IP[n] || ''}</svg>`;
const icC = (n, s, color, sw = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${IP[n] || ''}</svg>`;

/* ---------- IndexedDB ---------- */
const DB = {
  db: null, mem: { kv: new Map(), projects: new Map(), files: new Map() },
  open() {
    return new Promise(res => {
      try {
        const r = indexedDB.open('fruehauf-energy', 1);
        r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); if (!d.objectStoreNames.contains('projects')) d.createObjectStore('projects', { keyPath: 'id' }); if (!d.objectStoreNames.contains('files')) d.createObjectStore('files', { keyPath: 'id' }); };
        r.onsuccess = () => { DB.db = r.result; res(); };
        r.onerror = () => { console.warn('IndexedDB nicht verfügbar'); res(); };
      } catch (e) { res(); }
    });
  },
  req(store, mode, fn) {
    if (!DB.db) return Promise.resolve(fn(null));
    return new Promise((res, rej) => { const t = DB.db.transaction(store, mode); const r = fn(t.objectStore(store)); t.oncomplete = () => res(r && 'result' in r ? r.result : undefined); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });
  },
  get(store, key) { if (!DB.db) return Promise.resolve(store === 'kv' ? DB.mem.kv.get(key) : DB.mem[store].get(key)); return DB.req(store, 'readonly', s => s.get(key)); },
  put(store, val, key) { if (!DB.db) { DB.mem[store].set(key ?? val.id, val); return Promise.resolve(); } return DB.req(store, 'readwrite', s => (store === 'kv' ? s.put(val, key) : s.put(val))); },
  del(store, key) { if (!DB.db) { DB.mem[store].delete(key); return Promise.resolve(); } return DB.req(store, 'readwrite', s => s.delete(key)); },
  all(store) { if (!DB.db) return Promise.resolve([...DB.mem[store].values()]); return DB.req(store, 'readonly', s => s.getAll()); },
  clear(store) { if (!DB.db) { DB.mem[store].clear(); return Promise.resolve(); } return DB.req(store, 'readwrite', s => s.clear()); }
};
const FILES = {}; // id -> {url, blob, type, name}
async function putFile(blob, name = '', meta = {}) {
  const id = uid('f');
  await DB.put('files', { id, blob, type: blob.type, name, ...meta });
  FILES[id] = { url: URL.createObjectURL(blob), blob, type: blob.type, name };
  return id;
}
async function loadFiles(ids) {
  const need = [...new Set(ids.filter(id => id && !FILES[id]))];
  await Promise.all(need.map(async id => { const f = await DB.get('files', id); if (f && f.blob) FILES[id] = { url: URL.createObjectURL(f.blob), blob: f.blob, type: f.type, name: f.name }; }));
}
const fileUrl = id => (id && FILES[id] ? FILES[id].url : '');
async function delFiles(ids) { for (const id of ids) { if (!id) continue; if (FILES[id]) { URL.revokeObjectURL(FILES[id].url); delete FILES[id]; } await DB.del('files', id); } }
async function copyFile(id) { await loadFiles([id]); const f = FILES[id]; if (!f) return null; return putFile(f.blob, f.name); }
const blobToDataURL = b => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
const dataURLToBlob = async d => (await fetch(d)).blob();

/* ---------- Bibliotheken bei Bedarf laden ---------- */
const LIBS = {};
function loadScript(src) {
  if (LIBS[src]) return LIBS[src];
  return (LIBS[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = () => { delete LIBS[src]; rej(new Error('Bibliothek konnte nicht geladen werden: ' + src)); }; document.head.appendChild(s); }));
}
const VENDOR = p => new URL('vendor/' + p, location.href).href;   // alles lokal: keine Daten an fremde Server
async function needPdfJs() {
  await loadScript(VENDOR('pdf.min.js'));
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = VENDOR('pdf.worker.min.js');
  return window.pdfjsLib;
}
async function needTesseract() { await loadScript(VENDOR('tesseract/tesseract.min.js')); return window.Tesseract; }
const TESS_OPTS = () => ({ workerPath: VENDOR('tesseract/worker.min.js'), corePath: VENDOR('tesseract/'), langPath: VENDOR('tesseract'), workerBlobURL: false, gzip: true });
async function needPdfMaker() {
  await Promise.all([loadScript(VENDOR('html2canvas.min.js')), loadScript(VENDOR('jspdf.umd.min.js'))]);
  return { html2canvas: window.html2canvas, jsPDF: window.jspdf.jsPDF };
}

/* ---------- Toasts & Dialoge ---------- */
function toast(msg, kind = 'ok', ms = 3200) {
  const el = document.createElement('div');
  const col = kind === 'err' ? 'bg-card text-red-ink ring-line2' : kind === 'warn' ? 'bg-card text-yel-ink ring-line2' : 'bg-card text-ink ring-line2';
  el.className = `pointer-events-auto fade-in rounded-[calc(var(--r)-4px)] px-4 py-3 text-[14px] font-semibold shadow-[0_16px_40px_-12px_rgba(0,0,0,.5)] ring-1 ${col} flex items-center gap-2`;
  el.innerHTML = (kind === 'ok' ? `<span class="text-p">${ic('check', 18)}</span>` : kind === 'err' ? ic('alert', 18) : ic('info', 18)) + `<span>${esc(msg)}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 320); }, ms);
}
function modal(html, opts = {}) {
  const root = $('#modal');
  root.innerHTML = `<div class="modal-wrap fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto overscroll-contain" style="padding-top:max(16px,env(safe-area-inset-top));padding-bottom:max(16px,env(safe-area-inset-bottom))" data-modal-bg>
    <div class="card w-full ${opts.wide ? 'max-w-3xl' : 'max-w-lg'} p-6 sm:p-7 fade-in my-4 sm:my-auto relative">
      <button class="absolute right-4 top-4 w-9 h-9 rounded-full grid place-items-center text-ink3 hover:bg-bg" data-a="modal-close" aria-label="Schließen">${ic('x', 18)}</button>
      ${html}
    </div></div>`;
  root.querySelector('[data-modal-bg]').addEventListener('click', e => { if (e.target.hasAttribute('data-modal-bg')) closeModal(); });
}
function closeModal() { $('#modal').innerHTML = ''; }
function confirmDlg(title, text, okLabel = 'Löschen', danger = true) {
  return new Promise(res => {
    modal(`<h3 class="text-[19px] font-semibold pr-8">${esc(title)}</h3><p class="text-ink2 mt-2 text-[15px]">${esc(text)}</p>
      <div class="flex justify-end gap-2 mt-6"><button class="btn-s" id="cd-no">Abbrechen</button><button class="${danger ? 'btn bg-ember text-white hover:brightness-110' : 'btn-p'}" id="cd-ok">${esc(okLabel)}</button></div>`);
    $('#cd-no').onclick = () => { closeModal(); res(false); };
    $('#cd-ok').onclick = () => { closeModal(); res(true); };
  });
}
