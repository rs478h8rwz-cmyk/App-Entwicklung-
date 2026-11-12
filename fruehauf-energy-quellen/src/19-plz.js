/* PLZ ↔ Ort und Normaußentemperatur.
   Daten: vendor/plz-orte.json – je PLZ [Normaußentemperatur °C (geschätzt), Höhe m, Ort, Ortsteile …].
   Orte/PLZ: GeoNames (geonames.org), Lizenz CC BY 4.0. Höhen: SRTM über Open Topo Data.
   Normaußentemperatur geschätzt aus Lage und Höhe (abgeglichen auf DIN/TS-12831-Werte, ±1–2 K möglich). */
let PLZDB = null, PLZLIST = null, plzLoading = null;
async function plzDb() {
  if (PLZDB) return PLZDB;
  if (!plzLoading) plzLoading = fetch(VENDOR('plz-orte.json')).then(r => r.json()).catch(() => ({}));
  return (PLZDB = await plzLoading);
}
async function plzInfo(zip) { const d = await plzDb(), r = d[String(zip || '').trim()]; return r ? { te: r[0], h: r[1], orte: r.slice(2) } : null; }
async function plzSearch(q) {
  const d = await plzDb(); q = String(q || '').trim().toLowerCase();
  if (/^\d{2,5}$/.test(q)) { const out = []; for (const z in d) { if (z.startsWith(q)) { for (const o of d[z].slice(2)) { out.push([z, o]); if (out.length >= 8) return out; } } } return out; }
  if (q.length < 2) return [];
  if (!PLZLIST) { PLZLIST = []; for (const z in d) for (const o of d[z].slice(2)) PLZLIST.push([z, o, o.toLowerCase()]); }
  const pre = [], con = [];
  for (const e of PLZLIST) { if (e[2].startsWith(q)) pre.push(e); else if (con.length < 30 && e[2].includes(q)) con.push(e); }
  pre.sort((a, b) => a[1].length - b[1].length || a[1].localeCompare(b[1], 'de') || a[0].localeCompare(b[0]));
  return pre.concat(con).slice(0, 8).map(e => [e[0], e[1]]);
}
/* Bisherige Schätzung aus Koordinaten durch die PLZ-Tabelle ersetzen (genauer, mit Höhe) */
const teText = i => (i ? `Normaußentemperatur ca. <b>${num(i.te, 1)} °C</b> <span class="text-ink3">(geschätzt aus Lage und ${num(i.h)} m Höhe)</span>` : '');

/* Felder-Paare: PLZ ↔ Ort */
const PLZ_PAIRS = [['[data-b="p:customer.zip"]', '[data-b="p:customer.city"]'], ['[data-b="s:company.zip"]', '[data-b="s:company.city"]'], ['#quick-root [data-qi="zip"]', '#quick-root [data-qi="city"]']];
let plzPop = null, plzFor = null;
function plzSet(el, v) { if (!el) return; el.value = v; el.dataset.auto = '1'; el.dispatchEvent(new Event('input', { bubbles: true })); }
function plzHide() { if (plzPop) plzPop.style.display = 'none'; plzFor = null; }
function plzShow(el, items, onPick, note) {
  if (!plzPop) {
    plzPop = document.createElement('div'); plzPop.id = 'plz-pop';
    plzPop.className = 'card shadow-xl p-1.5 text-[14px]';
    plzPop.style.cssText = 'position:fixed;z-index:9998;max-height:280px;overflow:auto;display:none';
    plzPop.addEventListener('mousedown', e => e.preventDefault()); plzPop.addEventListener('pointerdown', e => e.preventDefault());
    document.body.appendChild(plzPop);
  }
  if (!items.length) return plzHide();
  plzFor = el; const r = el.getBoundingClientRect();
  plzPop.style.left = Math.max(8, r.left) + 'px'; plzPop.style.top = (r.bottom + 4) + 'px'; plzPop.style.width = Math.max(220, r.width) + 'px';
  plzPop.innerHTML = items.map(([z, o], i) => `<button type="button" class="w-full text-left px-3 py-2 rounded-lg hover:bg-raised flex gap-2" data-i="${i}"><span class="mono text-ink3">${z}</span><span class="font-medium truncate">${esc(o)}</span></button>`).join('') + (note ? `<div class="px-3 py-1.5 text-[12px] text-ink3">${note}</div>` : '');
  plzPop.onclick = e => { const b = e.target.closest('[data-i]'); if (!b) return; onPick(items[+b.dataset.i]); plzHide(); };
  plzPop.style.display = 'block';
}
let plzBusy = false;
document.addEventListener('input', async e => {
  if (plzBusy) return;
  const el = e.target; if (!el.matches) return;
  const pair = PLZ_PAIRS.find(([z, c]) => el.matches(z) || el.matches(c)); if (!pair || !e.isTrusted) return;
  const isZip = el.matches(pair[0]), other = $(isZip ? pair[1] : pair[0]);
  if (!isZip) delete el.dataset.auto;
  const v = el.value.trim();
  if (isZip) {
    const z = v.replace(/\D/g, '');
    if (z.length === 5) {
      const info = await plzInfo(z); plzTeUpdate();
      if (!info) return plzHide();
      if (info.orte.length === 1 || !other || !other.value || other.dataset.auto === '1') { plzBusy = true; if (other && (!other.value || other.dataset.auto === '1')) plzSet(other, info.orte[0]); plzBusy = false; }
      if (info.orte.length > 1) plzShow(el, info.orte.map(o => [z, o]), ([, o]) => { plzBusy = true; plzSet(other, o); plzBusy = false; }, 'Ortsteil wählen');
      else plzHide();
    } else if (z.length >= 2) plzShow(el, await plzSearch(z), ([pz, o]) => { plzBusy = true; plzSet(el, pz); plzSet(other, o); plzBusy = false; plzTeUpdate(); });
    else plzHide();
  } else {
    if (v.length < 2) return plzHide();
    const hits = await plzSearch(v);
    plzShow(el, hits, ([pz, o]) => { plzBusy = true; plzSet(other, pz); plzSet(el, o); plzBusy = false; plzTeUpdate(); }, hits.length >= 8 ? 'Weiter tippen oder PLZ eingeben, um einzugrenzen' : '');
  }
});
document.addEventListener('focusout', e => { if (e.target === plzFor) setTimeout(() => { if (document.activeElement !== plzFor) plzHide(); }, 150); });
window.addEventListener('scroll', () => { if (plzFor) plzHide(); }, true);

/* Normaußentemperatur unter den Adressfeldern anzeigen */
async function plzTeUpdate() {
  for (const box of $$('[data-plz-te]')) {
    const src = $(box.dataset.plzTe); const z = src ? src.value.replace(/\D/g, '') : '';
    const info = z.length === 5 ? await plzInfo(z) : null;
    box.innerHTML = info ? teText(info) : '';
  }
}
{ const _rPlz = render; render = function () { _rPlz.apply(this, arguments); if ($('[data-plz-te]')) plzTeUpdate(); }; }
