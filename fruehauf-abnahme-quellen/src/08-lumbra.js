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
  return ldaStatus() + b.replace('Alle Daten liegen nur auf diesem Gerät. Bitte regelmäßig eine Sicherung speichern – damit lassen sich Protokolle auch auf ein anderes Gerät übertragen.', 'Fertige Protokolle werden automatisch auf dem Firmen-Server gespeichert. Eine Sicherungsdatei brauchst du nur noch, um Protokolle aus der alten App zu übernehmen.');
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
