'use strict';
/* Lade-Anzeige: Wärmepumpen-Außeneinheit mit drehendem Ventilator in der Bildschirmmitte.
   Erscheint erst, wenn etwas länger als 300 ms dauert (kein Flackern bei schnellen Antworten). */
const LOADER_SVG = `<svg viewBox="0 0 220 150" width="190" height="130" aria-hidden="true">
  <rect x="14" y="10" width="192" height="118" rx="12" class="hp-body"/>
  <rect x="14" y="10" width="192" height="118" rx="12" class="hp-edge"/>
  <circle cx="78" cy="69" r="47" class="hp-ring"/><circle cx="78" cy="69" r="41" class="hp-hole"/>
  <g class="hp-fan"><path d="M78 69 C70 52 72 36 84 30 C94 40 90 58 78 69Z"/><path d="M78 69 C70 52 72 36 84 30 C94 40 90 58 78 69Z" transform="rotate(120 78 69)"/><path d="M78 69 C70 52 72 36 84 30 C94 40 90 58 78 69Z" transform="rotate(240 78 69)"/><circle cx="78" cy="69" r="7" class="hp-hub"/></g>
  <g class="hp-grille">${[0, 1, 2, 3, 4].map(i => `<circle cx="78" cy="69" r="${12 + i * 7}"/>`).join('')}<path d="M37 69H119M78 28V110"/></g>
  <g class="hp-side"><rect x="140" y="26" width="52" height="86" rx="6"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M148 ${38 + i * 10.5}H184"/>`).join('')}</g>
  <rect x="34" y="128" width="20" height="10" rx="2" class="hp-foot"/><rect x="166" y="128" width="20" height="10" rx="2" class="hp-foot"/>
  <circle cx="190" cy="20" r="3" class="hp-led"/></svg>`;
const LOADER = { n: 0, t: null };
function loaderShow(text) {
  let el = document.getElementById('ld-loader');
  if (!el) { el = document.createElement('div'); el.id = 'ld-loader'; el.setAttribute('role', 'status'); el.innerHTML = `<div class="ldl-box">${LOADER_SVG}<span class="ldl-t"></span></div>`; document.body.appendChild(el); }
  el.querySelector('.ldl-t').textContent = text || 'Lädt …'; requestAnimationFrame(() => el.classList.add('on'));
}
function loaderHide() { const el = document.getElementById('ld-loader'); if (el) el.classList.remove('on'); }
/* Zähler: mehrere gleichzeitige Ladevorgänge → eine Anzeige */
function loadStart(text) { LOADER.n++; if (LOADER.n === 1) { clearTimeout(LOADER.t); LOADER.t = setTimeout(() => { if (LOADER.n > 0) loaderShow(text); }, 300); } }
function loadEnd() { LOADER.n = Math.max(0, LOADER.n - 1); if (!LOADER.n) { clearTimeout(LOADER.t); loaderHide(); } }
async function withLoader(p, text) { loadStart(text); try { return await p; } finally { loadEnd(); } }
