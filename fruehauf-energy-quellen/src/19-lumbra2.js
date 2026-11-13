/* =========================================================
   LumbraDesk: Kunden zentral
   - Alle Kunden liegen auf dem Server; jedes Gerät gleicht automatisch ab
     (beim Öffnen, alle 30 Sekunden und kurz nach jeder Änderung).
   - Offline wird weiter lokal gespeichert und später nachgereicht.
   - Admin und Büro sehen alle Kunden, Vertrieb die eigenen (zuständig oder selbst angelegt).
   - „Zuständig“ im Kundenkopf: Kunden an Kollegen zuweisen.
   Nur aktiv, wenn die App unter LumbraDesk (…/rechner/) mit Login läuft.
   ========================================================= */
const LDP = { meta: {}, team: [], me: 0, all: false, dirty: new Set(), del: new Set(), vers: {}, up: new Set(), syncing: false, last: 0, quiet: false, err: '', loaded: false };
const ldpOn = () => /\/rechner\//.test(location.pathname);
const _dbPutP = DB.put.bind(DB), _dbDelP = DB.del.bind(DB);
DB.put = function (store, val, key) { if (store === 'projects' && val && val.id && !LDP.quiet && ldpOn()) ldpMark(val.id); return _dbPutP(store, val, key); };
DB.del = function (store, key) { if (store === 'projects' && !LDP.quiet && ldpOn()) { LDP.del.add(key); ldpSave(); ldpSoon(); } return _dbDelP(store, key); };
function ldpMark(id) { LDP.dirty.add(id); ldpSave(); ldpSoon(); }
const ldpSave = debounce(() => _dbPutP('kv', { dirty: [...LDP.dirty], del: [...LDP.del], vers: LDP.vers, up: [...LDP.up].slice(-5000) }, 'ldsync'), 400);
async function ldpLoad() {
  if (LDP.loaded) return; LDP.loaded = true;
  const s = await DB.get('kv', 'ldsync').catch(() => null) || {};
  (s.dirty || []).forEach(x => LDP.dirty.add(x)); (s.del || []).forEach(x => LDP.del.add(x)); LDP.vers = s.vers || {}; (s.up || []).forEach(x => LDP.up.add(x));
}
let LDP_T = 0;
function ldpSoon() { clearTimeout(LDP_T); LDP_T = setTimeout(() => ldpSync(), 4000); }
const ldpAll = () => PROJECTS.concat(ARCHIVED);
const ldpFind = id => ldpAll().find(p => p.id === id);
/* Datei-Kennungen in einem Kunden (Angebotsseiten, Fotos, Unterschriften, Modulplan …) */
function ldpFileIds(o, out = new Set()) {
  if (typeof o === 'string') { if (/^f[a-z0-9]{10,20}$/.test(o)) out.add(o); }
  else if (Array.isArray(o)) o.forEach(x => ldpFileIds(x, out));
  else if (o && typeof o === 'object') for (const k in o) ldpFileIds(o[k], out);
  return out;
}
async function ldpPost(r, body, headers = {}) {
  const res = await fetch('../api/?r=' + r, { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'X-Lumbra': '1', ...(body instanceof Blob ? {} : { 'Content-Type': 'application/json' }), ...headers }, body: body instanceof Blob ? body : JSON.stringify(body) });
  let j = null; try { j = await res.json(); } catch (e) {}
  return { ok: res.ok, status: res.status, j };
}
/* Kunden lokal einsetzen, ohne erneut „geändert“ zu markieren */
async function ldpApply(meta, data) {
  const p = deepMerge(newProject(data.type || 'wp'), data);
  LDP.quiet = true;
  try {
    PROJECTS = PROJECTS.filter(x => x.id !== p.id); ARCHIVED = ARCHIVED.filter(x => x.id !== p.id);
    (p.archived ? ARCHIVED : PROJECTS).push(p);
    await DB.put('projects', clone(p));
  } finally { LDP.quiet = false; }
  LDP.vers[p.id] = meta.v; LDP.meta[p.id] = meta;
  return p;
}
async function ldpRemoveLocal(id) {
  LDP.quiet = true;
  try { PROJECTS = PROJECTS.filter(x => x.id !== id); ARCHIVED = ARCHIVED.filter(x => x.id !== id); await DB.del('projects', id); } finally { LDP.quiet = false; }
  delete LDP.vers[id]; delete LDP.meta[id]; LDP.dirty.delete(id); LDP.del.delete(id);
}
/* Papierkorb auf dem Gerät: entfernte Kunden 30 Tage aufheben */
const ldpName = id => { const p = ldpFind(id); return p ? (p.customer.name || 'Neuer Kunde') : 'Kunde'; };
async function ldpTrash(id, st) {
  const p = ldpFind(id);
  if (p) { const t = (await DB.get('kv', 'ldtrash').catch(() => null)) || []; t.unshift({ at: Date.now(), why: st.state, by: st.by || st.owner || '', p: clone(p) }); await _dbPutP('kv', t.filter(x => Date.now() - x.at < 30 * 864e5).slice(0, 100), 'ldtrash'); }
  console.warn('LumbraDesk: Kunde lokal entfernt', id, st);
  await ldpRemoveLocal(id);
}
async function ldpRestore(i) {
  const t = (await DB.get('kv', 'ldtrash').catch(() => null)) || [], x = t[i]; if (!x) return;
  const p = deepMerge(newProject(x.p.type || 'wp'), clone(x.p)); p.id = uid('p'); p.updated = Date.now();   // als neuer Kunde wiederherstellen
  PROJECTS.push(p); await DB.put('projects', clone(p)); t.splice(i, 1); await _dbPutP('kv', t, 'ldtrash');
  toast(`„${p.customer.name || 'Kunde'}“ wiederhergestellt.`); render();
}

/* fehlende Dateien eines Kunden laden (im Hintergrund) */
async function ldpFetchFiles(p) {
  let got = 0;
  for (const fid of ldpFileIds(p)) {
    if (FILES[fid] || await DB.get('files', fid)) continue;
    try {
      const r = await fetch(`../api/?r=pfile&p=${encodeURIComponent(p.id)}&id=${encodeURIComponent(fid)}`, { credentials: 'same-origin' }); if (!r.ok) continue;
      const blob = await r.blob(); await _dbPutP('files', { id: fid, blob, type: blob.type, name: decodeURIComponent(r.headers.get('x-file-name') || '') }); LDP.up.add(fid); got++;
    } catch (e) {}
  }
  return got;
}
async function ldpUploadFiles(p) {
  for (const fid of ldpFileIds(p)) {
    if (LDP.up.has(fid)) continue;
    const f = await DB.get('files', fid); if (!f || !f.blob) continue;
    const r = await ldpPost('pfile', f.blob, { 'Content-Type': f.type || f.blob.type || 'application/octet-stream', 'X-Project-Id': p.id, 'X-File-Id': fid, 'X-File-Name': encodeURIComponent(f.name || '') });
    if (!r.ok) throw new Error((r.j && r.j.error) || 'Datei-Upload fehlgeschlagen');
    LDP.up.add(fid);
  }
}

/* ---------- Abgleich ---------- */
async function ldpSync(opts = {}) {
  if (typeof LD === 'undefined' || !LD.on || LDP.syncing || !navigator.onLine) return;
  if (!['admin', 'buero', 'vertrieb'].includes((LD.user || {}).role)) return;
  LDP.syncing = true; LDP.err = ''; let changed = 0, removed = 0, pushed = 0, reupload = false; const removedTxt = [];
  try {
    await ldpLoad();
    /* noch nie abgeglichene Kunden dieses Geräts hochladen */
    for (const p of ldpAll()) if (!LDP.vers[p.id] && !LDP.meta[p.id]) LDP.dirty.add(p.id);
    /* Löschungen (nach Ablauf der „Wiederherstellen“-Zeit) */
    for (const id of [...LDP.del]) {
      if (ldpFind(id)) { LDP.del.delete(id); continue; }
      if (typeof LAST_DEL !== 'undefined' && LAST_DEL && LAST_DEL.p && LAST_DEL.p.id === id) continue;
      if (!LDP.vers[id]) { LDP.del.delete(id); continue; }
      const r = await ldpPost('pdel', { id }); if (r.ok || r.status === 403) { LDP.del.delete(id); delete LDP.vers[id]; }
    }
    /* Änderungen hochladen */
    for (const id of [...LDP.dirty]) {
      const p = ldpFind(id); if (!p) { LDP.dirty.delete(id); continue; }
      await ldpUploadFiles(p);
      let r = await ldpPost('pput', { id, base: LDP.vers[id] || 0, data: p });
      if (r.status === 409 && r.j && r.j.conflict) {
        /* gleichzeitig woanders geändert: der neuere Stand gewinnt */
        if ((+p.updated || 0) >= (+(r.j.data || {}).updated || 0)) r = await ldpPost('pput', { id, data: p, force: true });
        else { await ldpApply(r.j, r.j.data); LDP.dirty.delete(id); changed++; continue; }
      }
      if (r.status === 409 && r.j && r.j.deleted) { await ldpTrash(id, { state: 'deleted' }); removed++; removedTxt.push(`„${ldpName(id)}“ war auf dem Server schon gelöscht – liegt im Papierkorb`); continue; }
      if (r.status === 403) { LDP.dirty.delete(id); continue; }
      if (!r.ok) throw new Error((r.j && r.j.error) || 'Fehler ' + r.status);
      LDP.vers[id] = r.j.v; LDP.dirty.delete(id); pushed++;
    }
    /* Stand vom Server holen */
    const lr = await fetch('../api/?r=plist', { credentials: 'same-origin', cache: 'no-store' }); const L = await lr.json().catch(() => null);
    if (!lr.ok || !L) throw new Error((L && L.error) || 'Kundenliste nicht abrufbar');
    LDP.me = L.me; LDP.all = L.all; const srv = {}; L.projects.forEach(m => { srv[m.id] = m; });
    /* Kunden, die in der Liste fehlen: erst beim Server nachfragen – entfernt wird nur bei „gelöscht“ oder „anderem zugewiesen“ */
    const gone = ldpAll().filter(p => !srv[p.id] && !LDP.dirty.has(p.id) && LDP.vers[p.id]).map(p => p.id);
    if (gone.length) {
      const c = await ldpPost('pcheck', { ids: gone }); if (!c.ok) throw new Error('Prüfung nicht möglich');
      for (const id of gone) {
        const st = (c.j.states || {})[id] || { state: 'missing' };
        if (st.state === 'deleted' || st.state === 'hidden') { await ldpTrash(id, st); removed++; removedTxt.push(st.state === 'deleted' ? `„${ldpName(id)}“ wurde von ${st.by || 'jemandem'} gelöscht` : `„${ldpName(id)}“ ist jetzt bei ${st.owner || 'einem Kollegen'}`); }
        else if (st.state === 'missing') { delete LDP.vers[id]; LDP.dirty.add(id); reupload = true; }   // nicht auf dem Server: wieder hochladen statt löschen
      }
    }
    const need = L.projects.filter(m => !LDP.dirty.has(m.id) && (!ldpFind(m.id) || (LDP.vers[m.id] || 0) < m.v)).map(m => m.id);
    L.projects.forEach(m => { LDP.meta[m.id] = m; });
    for (let i = 0; i < need.length; i += 40) {
      const r = await ldpPost('pget', { ids: need.slice(i, i + 40) }); if (!r.ok) throw new Error('Kunden nicht abrufbar');
      for (const x of r.j.projects) { const { data, ...meta } = x; await ldpApply(meta, data); changed++; }
    }
    LDP.last = Date.now(); ldpSave(); if (reupload) ldpSoon();
    if (changed || removed || pushed) {
      const editing = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if (!editing && !$('#roof-ed') && !$('#modal').innerHTML.trim()) render(); else LDP.renderLater = true;
      if (removedTxt.length) toast(removedTxt.slice(0, 2).join(' · ') + (removedTxt.length > 2 ? ` · und ${removedTxt.length - 2} weitere` : '') + ' (Papierkorb unter Einstellungen → Daten & Abgleich).', 'info', 7000);
      else if (changed) toast(`Kunden abgeglichen · ${changed} aktualisiert.`);
      /* Fotos und Angebote der geänderten Kunden nachladen */
      (async () => { let got = 0; for (const id of need) { const p = ldpFind(id); if (p) got += await ldpFetchFiles(p); } if (got) { await loadFiles([...new Set(need.flatMap(id => [...ldpFileIds(ldpFind(id) || {})]))]); if (!$('#roof-ed') && !$('#modal').innerHTML.trim()) render(); } })();
    } else if (opts.manual) toast('Alles abgeglichen.');
  } catch (e) { LDP.err = e.message || String(e); console.warn('LumbraDesk Abgleich:', e); if (opts.manual) toast('Abgleich nicht möglich: ' + LDP.err, 'err'); }
  finally { LDP.syncing = false; ldpSave(); ldpStatusPaint(); }
}
document.addEventListener('focusout', () => { if (LDP.renderLater) setTimeout(() => { if (LDP.renderLater && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) && !$('#modal').innerHTML.trim() && !$('#roof-ed')) { LDP.renderLater = false; render(); } }, 300); });

/* ---------- Anzeige: Zuständig ---------- */
/* Kundennummer aus lumbra.desk (je Gewerk) vor dem Zuständig-Hinweis */
function ldpOwnerChip(p) { const m = typeof LD !== 'undefined' && LD.on ? LDP.meta[p.id] : null; return (m && m.kdnr ? `<span class="badge bg-bg text-ink border border-line font-semibold">${esc(m.kdnr)}</span>` : '') + ldpOwnerChip0(p); }
function ldpOwnerChip0(p) {
  if (typeof LD === 'undefined' || !LD.on) return '';
  const m = LDP.meta[p.id];
  if (!m) return LDP.dirty.has(p.id) ? `<span class="badge bg-bg text-ink3 border border-line">${ic('refresh', 12)}wird abgeglichen</span>` : '';
  if (m.owner !== LDP.me) return `<span class="badge bg-bg text-ink2 border border-line">${ic('users', 12)}${esc(m.ownerName || 'Kollege')}</span>`;
  if (m.assignedBy && m.assignedBy !== LDP.me) return `<span class="badge" style="background:rgb(var(--p-rgb)/.12);color:rgb(var(--p-rgb))">${ic('users', 12)}von ${esc(m.assignedByName)} zugewiesen</span>`;
  return '';
}
function ldpOwnerUI(p) {
  if (typeof LD === 'undefined' || !LD.on) return '';
  const m = LDP.meta[p.id];
  if (!m) return `<span class="text-[12px] text-ink3 hidden sm:inline">${ic('refresh', 13)} wird abgeglichen …</span>`;
  const team = LDP.team.length ? LDP.team : [{ id: m.owner, name: m.ownerName }];
  return `<span class="text-[12px] text-ink3 hidden sm:inline">Zuständig</span><select class="inp !h-9 !w-auto !pr-8 !text-[13px]" data-ldowner="${p.id}" title="Zuständig – Kunden an Kollegen zuweisen">${team.map(u => `<option value="${u.id}" ${u.id === m.owner ? 'selected' : ''}>${esc(u.name)}${u.id === LDP.me ? ' (ich)' : ''}</option>`).join('')}</select><a class="btn-s !h-9 !px-3 !text-[13px]" href="../#/kunde/${encodeURIComponent(p.id)}" title="Logbuch, Wiedervorlagen und Vertriebs-Stufe in lumbra.desk">${ic('clock', 15)}Logbuch</a>${(LD.features || {}).angebote ? `<a class="btn-s !h-9 !px-3 !text-[13px]" href="../#/angebot/neu/${encodeURIComponent(p.id)}" title="Angebot mit dem Assistenten erstellen – Schritt für Schritt">${ic('file', 15)}Angebot</a>` : ''}`;
}
document.addEventListener('change', async e => {
  const s = e.target.closest && e.target.closest('[data-ldowner]'); if (!s) return;
  const id = s.dataset.ldowner, to = +s.value, u = LDP.team.find(x => x.id === to);
  if (!(await confirmDlg('Kunden zuweisen?', `${u ? u.name : 'Der Kollege'} wird zuständig und sieht den Kunden ab sofort. Du siehst ihn weiterhin${LDP.all ? '' : ', wenn du ihn angelegt hast'}.`, 'Zuweisen', false))) { render(); return; }
  if (LDP.dirty.has(id)) await ldpSync();
  const r = await ldpPost('passign', { id, user: to });
  if (!r.ok) { toast('Zuweisen nicht möglich: ' + ((r.j && r.j.error) || r.status), 'err'); render(); return; }
  const { ok, ...meta } = r.j; LDP.meta[id] = meta; LDP.vers[id] = meta.v; ldpSave();
  toast(`Zugewiesen an ${meta.ownerName}.`); render();
});

/* ---------- Status unter Einstellungen → Datensicherung ---------- */
function ldpStatusHTML() {
  const open = LDP.dirty.size + LDP.del.size;
  return `<span id="ldp-status">${LDP.syncing ? 'Wird abgeglichen …' : LDP.err ? `<span class="text-[#D9482B]">Letzter Abgleich fehlgeschlagen: ${esc(LDP.err)}</span>` : LDP.last ? `Kunden zuletzt abgeglichen um <b>${new Date(LDP.last).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</b>` : 'Noch nicht abgeglichen'}${open ? ` · ${open} Änderung${open > 1 ? 'en' : ''} offen` : ''}</span>`;
}
function ldpStatusPaint() { const el = document.getElementById('ldp-status'); if (el) el.outerHTML = ldpStatusHTML(); }
const _setDatenLDP = SET.daten;
SET.daten = () => (typeof LD !== 'undefined' && LD.on ? sCard('users', 'Kunden zentral (LumbraDesk)', LDP.all ? 'Alle Kunden der Firma liegen auf dem Server und sind auf jedem Gerät gleich.' : 'Deine Kunden liegen auf dem Server und sind auf jedem deiner Geräte gleich.',
  `<div class="text-[14px]">${ldpStatusHTML()}</div><div class="flex flex-wrap gap-2 mt-3"><button class="btn-s" data-a="ldp-sync">${ic('refresh', 16)}Jetzt abgleichen</button><button class="btn-g" data-a="ldp-trash">${ic('trash', 16)}Papierkorb</button></div><div id="ldp-trash"></div><p class="hint">Ohne Internet wird auf dem Gerät gespeichert und später automatisch nachgereicht. Vom Abgleich entfernte Kunden liegen 30 Tage im Papierkorb.</p>`) : '') + _setDatenLDP();
document.addEventListener('click', async e => {
  if (e.target.closest('[data-a="ldp-sync"]')) ldpSync({ manual: true });
  if (e.target.closest('[data-a="ldp-trash"]')) {
    const t = (await DB.get('kv', 'ldtrash').catch(() => null)) || [], el = document.getElementById('ldp-trash'); if (!el) return;
    el.innerHTML = t.length ? `<div class="mt-3 space-y-2">${t.map((x, i) => `<div class="flex flex-wrap items-center gap-2 rounded-lg bg-raised px-3 py-2 text-[13px]"><b class="flex-1 min-w-[140px]">${esc(x.p.customer.name || 'Neuer Kunde')}</b><span class="text-ink3">${new Date(x.at).toLocaleString('de-DE')} · ${x.why === 'deleted' ? 'gelöscht' + (x.by ? ' von ' + esc(x.by) : '') : 'zugewiesen an ' + esc(x.by || 'Kollegen')}</span><button class="btn-s !h-8 !px-3 text-[12px]" data-a="ldp-restore" data-i="${i}">Wiederherstellen</button></div>`).join('')}</div>` : '<p class="text-[13px] text-ink3 mt-3">Der Papierkorb ist leer.</p>';
  }
  const r = e.target.closest('[data-a="ldp-restore"]'); if (r) ldpRestore(+r.dataset.i);
});

/* ---------- Start ---------- */
async function ldpInit() {
  if (!ldpOn()) return;
  let tries = 0; while ((typeof LD === 'undefined' || !LD.ready) && tries++ < 60) await new Promise(r => setTimeout(r, 500));
  if (typeof LD === 'undefined' || !LD.on) return;
  try { const r = await fetch('../api/?r=team', { credentials: 'same-origin' }); if (r.ok) LDP.team = (await r.json()).users || []; } catch (e) {}
  await ldpSync();
  setInterval(() => { if (!document.hidden) ldpSync(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ldpSync(); });
  window.addEventListener('online', () => ldpSync());
}
setTimeout(ldpInit, 0);
