/* ---------- Kunden-Verknüpfung (Wirtschaftlichkeit 3.7) ----------
   Wo ein Kundenname eingegeben wird (Modulplan, Schnellauslegung, Kundenschritt), schlägt die App vorhandene Kunden
   aus dem gesamten CRM von lumbra.desk vor (Name, Kundennummer, Ort) – sonst aus den Kunden auf diesem Gerät.
   Ein Tipp verknüpft mit dem vorhandenen Kunden, statt einen doppelten anzulegen. */
const CRMC = { list: null, at: 0, busy: null };
async function crmCustomers() {
  if (!(typeof LD === 'object' && LD.on)) return null;
  if (CRMC.list && Date.now() - CRMC.at < 60000) return CRMC.list;
  if (!CRMC.busy) CRMC.busy = ldApi('ab-customers').then(r => { if (r.ok && r.j) { CRMC.list = r.j.customers || []; CRMC.at = Date.now(); } }).catch(() => {}).finally(() => { CRMC.busy = null; });
  await CRMC.busy; return CRMC.list;
}
const zcAddr = (st, zip, city) => [st, [zip, city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
function custMatches(q, exclude) {
  q = (q || '').trim().toLowerCase(); if (q.length < 2) return [];
  const out = [], seen = new Set([exclude]);
  for (const c of CRMC.list || []) if (!seen.has(c.id) && `${c.kdnr || ''} ${c.name} ${c.city || ''} ${c.street || ''}`.toLowerCase().includes(q)) { seen.add(c.id); out.push({ id: c.id, kdnr: c.kdnr || '', name: c.name, addr: zcAddr(c.street, c.zip, c.city), type: c.type }); }
  for (const p of PROJECTS.concat(ARCHIVED)) if (!seen.has(p.id) && custSearchText(p).includes(q)) { seen.add(p.id); out.push({ id: p.id, kdnr: (typeof LDP === 'object' && LDP.meta[p.id] && LDP.meta[p.id].kdnr) || '', name: [p.customer.salutation, p.customer.name].filter(Boolean).join(' '), addr: zcAddr(p.customer.street, p.customer.zip, p.customer.city), type: p.type }); }
  return out.slice(0, 6);
}
const custRow = (c, act) => `<button type="button" class="w-full text-left flex items-center gap-3 rounded-[calc(var(--r)-6px)] border border-line bg-card px-3 py-2.5 hover:border-p" data-a="${act}" data-id="${esc(c.id)}"><span class="flex-1 min-w-0"><b class="block text-[14.5px] truncate">${c.kdnr ? `<span class="text-p">${esc(c.kdnr)}</span> · ` : ''}${esc(c.name)}</b><span class="block text-[12.5px] text-ink3 truncate">${esc(c.addr || 'ohne Adresse')}</span></span><span class="text-[12.5px] text-p font-semibold shrink-0">Übernehmen</span></button>`;
/* Kunde lokal verfügbar machen (bei Bedarf aus lumbra.desk holen) */
async function custEnsure(id) {
  let p = findProject(id); if (p) return p;
  if (!(typeof LD === 'object' && LD.on)) return null;
  const r = await ldpPost('pget', { ids: [id] });
  if (!r.ok || !r.j || !(r.j.projects || []).length) { const c = (CRMC.list || []).find(x => x.id === id); toast(`Kein Zugriff auf ${c ? c.name : 'diesen Kunden'} – er ist einem Kollegen zugewiesen. Bitte im CRM zuweisen lassen.`, 'warn', 6000); return null; }
  const { data, ...meta } = r.j.projects[0]; return ldpApply(meta, data);
}

/* Feld „Für welchen Kunden?“ (Modulplan, Schnellauslegung) – mit Vorschlägen */
function custNameField() {
  if (NEWCUST.pick) return `<div id="nc-box" class="rounded-[calc(var(--r)-4px)] border border-p/40 p-4" style="background:rgb(var(--p-rgb)/.06)"><div class="font-semibold text-[15px] mb-2">Für welchen Kunden?</div>
    <div class="flex items-center gap-3"><span class="icon-box">${ic('users', 18)}</span><div class="flex-1 min-w-0"><b class="block text-[15px] truncate">${NEWCUST.pick.kdnr ? esc(NEWCUST.pick.kdnr) + ' · ' : ''}${esc(NEWCUST.pick.name)}</b><span class="block text-[12.5px] text-ink3 truncate">Vorhandener Kunde – wird verknüpft${NEWCUST.pick.addr ? ' · ' + esc(NEWCUST.pick.addr) : ''}</span></div><button type="button" class="btn-g !h-9 !px-3 text-[13px]" data-a="nc-unpick">Ändern</button></div></div>`;
  return `<div id="nc-box" class="rounded-[calc(var(--r)-4px)] border border-p/40 p-4" style="background:rgb(var(--p-rgb)/.06)"><div class="font-semibold text-[15px] mb-2">Für welchen Kunden?</div>
    <div class="grid grid-cols-[130px_1fr] gap-2"><select class="inp" data-nc="sal">${SALUTS.map(([k, l]) => `<option value="${k}" ${NEWCUST.sal === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <input class="inp" data-nc="name" value="${esc(NEWCUST.name)}" placeholder="Name oder Kundennummer" autocomplete="off"></div>
    <div id="nc-sug" class="grid gap-1.5 mt-2"></div><div class="hint">Vorhandenen Kunden antippen – oder neuen Namen eingeben (Pflichtfeld).</div></div>`;
}
function custNameTake() {
  if (NEWCUST.pick) { const r = { pick: NEWCUST.pick }; NEWCUST.pick = null; NEWCUST.name = ''; NEWCUST.sal = 'Familie'; return r; }
  const el = $('#modal [data-nc="name"]'), v = ((el && el.value) || NEWCUST.name || '').trim();
  if (!v) { toast('Bitte zuerst den Namen des Kunden eingeben.', 'err'); if (el) { el.focus(); el.classList.add('!border-[#D9482B]'); } return null; }
  const r = { salutation: (($('#modal [data-nc="sal"]') || {}).value) || NEWCUST.sal, name: v };
  NEWCUST.name = ''; NEWCUST.sal = 'Familie'; return r;
}
async function ncSuggest(q) {
  const box = $('#nc-sug'); if (!box) return;
  const draw = () => { const l = custMatches(q); box.innerHTML = l.length ? `<div class="text-[12.5px] text-ink3 mt-1">Vorhandene Kunden:</div>${l.map(c => custRow(c, 'nc-pick')).join('')}` : ''; };
  draw(); if (!CRMC.list) { await crmCustomers(); if ($('#modal [data-nc="name"]') && $('#modal [data-nc="name"]').value === q) draw(); }
}
document.addEventListener('input', e => { const el = e.target; if (el.dataset && el.dataset.nc === 'name') ncSuggest(el.value); });
document.addEventListener('focusin', e => { const el = e.target; if (el.dataset && el.dataset.nc === 'name') crmCustomers(); });

/* Modulplan / Schnellauslegung mit vorhandenem Kunden fortsetzen */
async function custUsePick(pick, mode, type) {
  const p = await custEnsure(pick.id); if (!p) return;
  if (mode === 'roof') { if (type === 'pvwp' && p.type === 'wp') p.type = 'pvwp'; if (type === 'pv' && p.type === 'wp') p.type = 'pvwp'; saveProject(p); closeModal(); go(`projekt/${p.id}/1`); setTimeout(() => roofOpen(p.id), 250); return; }
  if (mode === 'quick') { const was = p.type; if (p.type === 'pv') p.type = 'pvwp'; quickApplyTo(p); saveProject(p); closeModal(); go(`projekt/${p.id}/1`);
    toast(`Schnellauslegung bei ${p.customer.name} übernommen: ${num(p.hp.kw, 1)} kW, JAZ ${num(p.hp.jaz, 2)}.` + (was === 'pv' ? ' Kunde ist jetzt PV + Wärmepumpe.' : ''), 'ok', 5000); }
}
document.addEventListener('click', async e => {
  const a = e.target.closest && e.target.closest('[data-a="nc-pick"],[data-a="nc-unpick"],[data-a="roof-new"],[data-a="quick-create"],[data-a="cn-open"]'); if (!a) return;
  const k = a.dataset.a;
  if (k === 'nc-pick') { e.preventDefault(); e.stopImmediatePropagation(); const c = custMatches($('#modal [data-nc="name"]') ? $('#modal [data-nc="name"]').value : '').find(x => x.id === a.dataset.id) || { id: a.dataset.id, name: a.textContent.trim() }; NEWCUST.pick = c; const b = $('#nc-box'); if (b) b.outerHTML = custNameField(); return; }
  if (k === 'nc-unpick') { e.preventDefault(); e.stopImmediatePropagation(); NEWCUST.pick = null; const b = $('#nc-box'); if (b) b.outerHTML = custNameField(); return; }
  if ((k === 'roof-new' || k === 'quick-create') && NEWCUST.pick) {   // vorhandener Kunde gewählt → statt neuem Kunden verknüpfen
    e.preventDefault(); e.stopImmediatePropagation();
    if (k === 'quick-create') { if (!(isNum(QS.load) && QS.load > 0) && QS.calcOpen && isNum(qMethodLoad()) && qMethodLoad() > 0) QS.load = Math.round(qMethodLoad() * 100) / 100; if (!isNum(QS.load) || QS.load <= 0) { toast('Bitte eine Heizlast eingeben oder über „Heizlast berechnen“ ermitteln.'); return; } }
    const pick = NEWCUST.pick; NEWCUST.pick = null; NEWCUST.name = ''; await custUsePick(pick, k === 'roof-new' ? 'roof' : 'quick', a.dataset.type); return;
  }
  if (k === 'cn-open') { e.preventDefault(); e.stopImmediatePropagation(); const p = await custEnsure(a.dataset.id); if (p) go(`projekt/${p.id}/1`); }
}, true);

/* Kundenschritt: Hinweis, wenn es den Kunden schon gibt */
let CN_T = null;
document.addEventListener('input', e => {
  const el = e.target; if (!(el.dataset && el.dataset.b === 'p:customer.name')) return;
  clearTimeout(CN_T); CN_T = setTimeout(async () => {
    const p = curProject(); if (!p) return; await crmCustomers();
    const q = el.value.trim(), l = q.length >= 3 ? custMatches(q, p.id).filter(c => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 3) : [];
    let box = document.getElementById('cn-dupe'); if (!box) { const g = el.closest('.grid'); if (!g) return; box = document.createElement('div'); box.id = 'cn-dupe'; box.className = 'mt-3'; g.after(box); }
    box.innerHTML = l.length ? `<div class="rounded-[calc(var(--r)-4px)] border border-[#F5A524]/50 p-3" style="background:rgba(245,165,36,.08)"><div class="text-[13px] font-semibold mb-2">Diesen Kunden gibt es vielleicht schon:</div><div class="grid gap-1.5">${l.map(c => custRow(c, 'cn-open').replace('Übernehmen', 'Öffnen')).join('')}</div></div>` : '';
  }, 350);
});
