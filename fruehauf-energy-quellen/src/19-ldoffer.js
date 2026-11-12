/* ---------- Angebot: PDF hochladen ODER in lumbra.desk erstellen und übernehmen (Wirtschaftlichkeit 3.0) ----------
   Ein in lumbra.desk erstelltes Angebot liefert Preis, Nummer, kWp, Module, Speicher und Wärmepumpe direkt –
   ohne PDF-Erkennung. Bei PV + Wärmepumpe wird der Preis nach Positionen aufgeteilt (Kategorie „Wärmepumpe“ → WP-Anteil). */
const LDOF = {};
async function ldOffersLoad(pid, force) {
  if (!(typeof LD === 'object' && LD.on && (LD.features || {}).angebote)) return null;
  if (LDOF[pid] && !force && Date.now() - LDOF[pid].at < 30000) return LDOF[pid].list;
  const r = await ldApi('of-list&p=' + encodeURIComponent(pid)); LDOF[pid] = { at: Date.now(), list: r.ok && r.j ? r.j.offers || [] : [] }; return LDOF[pid].list;
}
function ldOfferFacts(o) {
  const d = o.data || {}, f = 1 - (+d.discount || 0) / 100, pos = d.pos || [];
  const gross = p => { const t = (+p.tax || 0) / 100, u = p.pm === 'brutto' ? Math.round(p.price * (1 + t) * 100) / 100 : p.price * (1 + t); return u * p.qty * f; };
  const kwOf = p => +p.power > 0 ? +p.power : (m => m ? +m[1].replace(',', '.') : 0)(/(\d+(?:[.,]\d+)?)\s*kW(?!h|p)/i.exec(p.name || ''));   // Leistung oder aus dem Namen („9 kW“)
  const mods = pos.filter(p => p.cat === 'mod' && +p.power >= 100), bats = pos.filter(p => p.cat === 'bat' && +p.power > 0);
  const wps = pos.filter(p => p.cat === 'wp' && !/montage|demontage|installation|entsorgung|hydraulik/i.test(p.name || '') && (kwOf(p) > 0 || /wärmepumpe|waermepumpe/i.test(p.name || '')));
  const kwp = Math.round(mods.reduce((a, p) => a + p.qty * p.power, 0) / 10) / 100;
  return {
    gross: o.gross, grossWP: Math.round(pos.filter(p => p.cat === 'wp').reduce((a, p) => a + gross(p), 0) * 100) / 100,
    kwp: kwp || null, modules: mods.map(p => `${numFmt(p.qty)} × ${numFmt(p.power)} Wp ${p.name}`).join(' + '), bat: bats.reduce((a, p) => a + p.qty * p.power, 0) || null,
    hpKw: wps.length ? kwOf(wps[0]) || null : null, hpModel: wps.length ? wps[0].name : '', number: o.nr, date: String(o.created || '').slice(0, 10)
  };
}
const numFmt = n => String(Math.round(n * 100) / 100).replace('.', ',');
function ldOfferApply(p, o) {
  const r = ldOfferFacts(o);
  if (p.type === 'pvwp') { setFrom(p, 'offer.grossWP', r.grossWP || null); setFrom(p, 'offer.grossPV', Math.round((r.gross - (r.grossWP || 0)) * 100) / 100); }
  else setFrom(p, 'offer.gross', r.gross);
  setFrom(p, 'offer.number', r.number); setFrom(p, 'offer.date', r.date);
  if (hasPV(p) && r.kwp) { p.offerPv = { kwp: r.kwp, modules: r.modules, n: modCount(r.modules), w: modWatt(r.modules) }; if (!(p.roof && p.roof.applied)) { setFrom(p, 'pv.kwp', r.kwp); setFrom(p, 'pv.modules', r.modules); } }
  if (hasPV(p)) setFrom(p, 'pv.bat', r.bat);
  if (hasWP(p)) { setFrom(p, 'hp.kw', r.hpKw); setFrom(p, 'hp.model', r.hpModel); }
  p.ldOffer = { id: o.id, nr: o.nr, gross: o.gross, at: Date.now() };
  saveProject(p);
  return r;
}
async function ldOfferTake(p, oid) {
  const r = await ldApi('of-get&id=' + encodeURIComponent(oid)); if (!r.ok || !r.j) throw new Error((r.j && r.j.error) || 'Angebot nicht gefunden');
  if (r.j.project !== p.id) throw new Error('Das Angebot gehört zu einem anderen Kunden.');
  const f = ldOfferApply(p, r.j);
  toast(`Angebot ${r.j.nr} übernommen: ${eur(r.j.gross)}${f.kwp ? ` · ${num(f.kwp, 2)} kWp` : ''}${f.bat ? ` · Speicher ${num(f.bat, 1)} kWh` : ''}${f.hpKw ? ` · WP ${num(f.hpKw, 1)} kW` : ''}${p.type === 'pvwp' ? ' – Aufteilung PV/WP bitte prüfen' : ''}.`, 'ok', 6000);
}
/* Auswahl im Schritt „Angebot“ */
function ldOfferChoice(p) {
  if (!(typeof LD === 'object' && LD.on && (LD.features || {}).angebote)) return '';
  const L = LDOF[p.id] ? LDOF[p.id].list : null; if (!L) setTimeout(() => ldOffersLoad(p.id).then(() => { if (curProject() && curProject().id === p.id) render(); }), 0);
  const cur = p.ldOffer && p.ldOffer.id;
  return `<div class="card p-5 sm:p-6">${cardHead('file', 'Angebot', 'Vorhandenes Angebot als PDF hochladen – oder das Angebot direkt in lumbra.desk erstellen.')}
    <div class="grid sm:grid-cols-2 gap-3">
      <a class="rounded-[calc(var(--r)-4px)] border border-line p-4 flex items-center gap-3 hover:border-p" href="#ld-upload" data-a="ldof-up"><span class="icon-box">${ic('upload', 18)}</span><span><b class="block text-[15px]">PDF hinzufügen</b><span class="text-[13px] text-ink3">Angebot hochladen – wird automatisch erkannt</span></span></a>
      <a class="rounded-[calc(var(--r)-4px)] border-2 border-p p-4 flex items-center gap-3" href="../#/angebot/neu/${encodeURIComponent(p.id)}"><span class="icon-box">${ic('file', 18)}</span><span><b class="block text-[15px]">Selbst erstellen</b><span class="text-[13px] text-ink3">in lumbra.desk – auch per Sprache, mit Paketen</span></span></a></div>
    ${L === null ? '<p class="hint mt-3">Lade Angebote aus lumbra.desk …</p>' : L.length ? `<div class="mt-4"><div class="text-[13px] font-semibold mb-2">Angebote dieses Kunden in lumbra.desk</div><div class="space-y-2">${L.map(o => `<div class="flex items-center gap-3 rounded-[calc(var(--r)-4px)] bg-bg px-4 py-3"><div class="flex-1 min-w-0"><b class="text-[14px]">${esc(o.nr)} · ${esc(o.title)}</b><div class="text-[12.5px] text-ink3">${eur(o.gross)} brutto${cur === o.id ? ' · <span class="text-p font-semibold">übernommen</span>' : ''}</div></div><a class="btn-s !h-9 !px-3 !text-[13px]" href="../#/angebot/${encodeURIComponent(o.id)}">Öffnen</a><button class="btn-p !h-9 !px-3 !text-[13px]" data-a="ldof-take" data-id="${esc(o.id)}">${cur === o.id ? 'Neu übernehmen' : 'Übernehmen'}</button></div>`).join('')}</div></div>` : ''}</div>`;
}
const _step1Ld = step1;
step1 = function (p) { return ldOfferChoice(p) + `<div id="ld-upload">${_step1Ld(p)}</div>`; };
document.addEventListener('click', async e => {
  const a = e.target.closest && e.target.closest('[data-a="ldof-take"],[data-a="ldof-up"]'); if (!a) return; e.preventDefault(); e.stopImmediatePropagation();
  const p = curProject(); if (!p) return;
  if (a.dataset.a === 'ldof-up') { const z = $('#ld-upload'); if (z) z.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  a.disabled = true; try { await ldOfferTake(p, a.dataset.id); render(); } catch (err) { toast(err.message, 'warn'); a.disabled = false; }
}, true);
/* Rücksprung aus lumbra.desk: rechner/?ldOffer=<id>#projekt/<pid>/1 → automatisch übernehmen */
(function () {
  const oid = new URLSearchParams(location.search).get('ldOffer'); if (!oid) return;
  history.replaceState(null, '', location.pathname + location.hash);
  let n = 0; const t = setInterval(async () => {
    if (++n > 60) return clearInterval(t);
    if (!(typeof LD === 'object' && LD.ready && curProject())) return; clearInterval(t);
    try { await ldOfferTake(curProject(), oid); delete LDOF[curProject().id]; render(); } catch (err) { toast(err.message, 'warn'); }
  }, 500);
})();
