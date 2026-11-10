/* =========================================================
   LumbraDesk: Stempeluhr zentral
   Nur aktiv, wenn die App unter LumbraDesk läuft (lumbradesk.de/stempel/) – die eigenständige
   Netlify-Version bleibt unverändert (Daten nur auf dem Handy).
   - Tage und Einstellungen gleichen sich automatisch mit dem Server ab, ein neues Handy holt alles zurück.
   - Büro/Admin (LumbraDesk-Rolle) sehen unter „Mitarbeiter“ alle Kollegen und schicken Änderungen direkt.
   ========================================================= */
const LDS = { on: false, me: null, office: false, dirty: new Set(), setDirty: false, since: 0, last: 0, err: '', busy: false, timer: null, device: '', staffAt: 0 };
async function ldsState() { const s = (await DB.get('kv', 'ld-sync')) || {}; LDS.since = s.since || 0; LDS.device = s.device || uid('d'); LDS.dirty = new Set(s.dirty || []); LDS.setDirty = !!s.setDirty; LDS.init = !!s.init; LDS.setUpd = s.setUpd || 0; LDS.info = !!s.info; }
const ldsSave = () => DB.put('kv', { since: LDS.since, device: LDS.device, dirty: [...LDS.dirty], setDirty: LDS.setDirty, init: LDS.init, setUpd: LDS.setUpd, info: LDS.info }, 'ld-sync');
const ldsSoon = (ms = 3000) => { if (!LDS.on) return; clearTimeout(LDS.timer); LDS.timer = setTimeout(ldsSync, ms); };

/* Änderungen mitschreiben (Tage, Einstellungen) */
const _dbPutLd = DB.put.bind(DB), _dbDelLd = DB.del.bind(DB);
DB.put = function (store, val, key) {
  if (store === 'days' && !LDS.applying) { LDS.dirty.add(key ?? val.iso); if (LDS.on) { ldsSave(); ldsSoon(); } }
  if (store === 'kv' && key === 'settings' && !LDS.applying) { LDS.setDirty = true; LDS.setUpd = Date.now(); if (LDS.on) { ldsSave(); ldsSoon(); } }
  return _dbPutLd(store, val, key);
};
DB.del = function (store, key) {
  if (store === 'days' && !LDS.applying) { LDS.dirty.add(key); LDS.deleted = (LDS.deleted || new Set()).add(key); if (LDS.on) { ldsSave(); ldsSoon(); } }
  return _dbDelLd(store, key);
};

async function ldsApi(r, body) {
  const res = await fetch('../api/?r=' + r, body === undefined ? { credentials: 'same-origin', cache: 'no-store' } : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Lumbra': '1' }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({})); if (!res.ok) { const e = new Error(j.error || 'Fehler ' + res.status); e.status = res.status; throw e; } return j;
}

/* Abgleich */
async function ldsSync() {
  if (!LDS.on || LDS.busy || !navigator.onLine) return; LDS.busy = true; clearTimeout(LDS.timer);
  try {
    const fresh = !LDS.init;   // erstes Mal auf diesem Gerät: alles schicken und alles holen
    const isos = fresh ? Object.keys(DAYS) : [...LDS.dirty];
    const days = isos.map(i => DAYS[i] ? clone(DAYS[i]) : { iso: i, _deleted: true, updated: Date.now() });
    const sendSet = LDS.setDirty || fresh, noLocal = !Object.keys(DAYS).length && !S.person.start;
    const set = clone(S); delete set.admin; delete set.pin;
    const j = await ldsApi('st-sync', { device: LDS.device, version: APP_VERSION, since: fresh ? 0 : LDS.since, days, settings: sendSet && !(fresh && noLocal) ? set : undefined, settingsUpd: LDS.setUpd || Date.now(), wantSettings: fresh && noLocal });
    LDS.me = j.me; LDS.office = j.office;
    isos.forEach(i => LDS.dirty.delete(i)); if (sendSet) LDS.setDirty = !!(fresh && noLocal && !j.settings);   // neues Handy ohne Server-Stand: eigene Einstellungen beim nächsten Mal schicken
    /* Tage von anderen Geräten übernehmen (neues Handy, zweites Gerät) */
    LDS.applying = true; let changed = 0;
    try {
      for (const d of j.days || []) {
        const cur = DAYS[d.iso]; if (cur && (cur.updated || 0) > (d.updated || 0)) continue;
        if (d._deleted) { if (cur) { delete DAYS[d.iso]; await DB.del('days', d.iso); changed++; } continue; }
        DAYS[d.iso] = d; await DB.put('days', clone(d)); changed++;
      }
      if (j.settings && fresh && noLocal) { const keep = { admin: S.admin, pin: S.pin, design: S.design }; S = deepMerge(clone(DEFAULTS), j.settings); Object.assign(S, keep); fixSettings(); await DB.put('kv', clone(S), 'settings'); changed++; }
    } finally { LDS.applying = false; }
    if (!S.person.name && j.me && j.me.name) { S.person.name = j.me.name; saveSettings(); changed++; }
    LDS.since = j.since || LDS.since; LDS.init = true; LDS.last = Date.now(); LDS.err = '';
    await ldsSave();
    /* Änderungen vom Büro übernehmen */
    if ((j.ops || []).length) await ldsApplyOps(j.ops);
    if (changed && typeof rerender === 'function') rerender();
    if (fresh && changed) toast(`Vom Server geholt: ${(j.days || []).length} Tage.`);
    if (!LDS.info) ldsInfo();
  } catch (e) { LDS.err = e.status === 401 ? 'Bitte in LumbraDesk neu anmelden.' : 'Abgleich gerade nicht möglich – wird nachgeholt.'; }
  finally { LDS.busy = false; ldsStatusPaint(); if (LDS.dirty.size || LDS.setDirty) ldsSoon(30000); }
}
async function ldsApplyOps(list) {
  const ack = [];
  for (const u of list) {
    if ((S.updApplied || []).includes(u.id)) { ack.push(u.n); continue; }
    await applyUpdate(u); ack.push(u.n);
    modal(`<h3 class="text-[20px] font-semibold pr-8">Änderung vom Büro</h3><p class="text-ink3 text-[13px] mt-1">von ${esc(u.by || 'Büro')} · ${new Date(u.created).toLocaleString('de-DE')}</p>
      ${u.note ? `<div class="kpi mt-4 text-[14px]">${esc(u.note)}</div>` : ''}<ul class="list-disc pl-5 mt-4 space-y-1 text-[14px]">${u.ops.map(o => `<li>${esc(opText(o))}</li>`).join('')}</ul>
      <button class="btn-p w-full mt-6" data-a="modal-close">Verstanden</button>`);
  }
  if (ack.length) { await ldsApi('st-ack', { ids: ack }); if (typeof render === 'function') render(); ldsSoon(1500); }
}
function ldsInfo() {
  LDS.info = true; ldsSave();
  if ($('#modal').innerHTML) return;
  modal(`<div class="text-center"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('check', 26, 2.4)}</div><div class="font-semibold text-[19px] mt-4">Stempeluhr in LumbraDesk</div></div>
    <div class="text-[14px] text-ink2 mt-4 space-y-2"><p>Deine Zeiten, Abwesenheiten, Baustellen und der Standort beim Stempeln werden ab jetzt automatisch mit dem Firmen-Server von Frühauf Solar abgeglichen.</p><p>Sehen können sie nur <b>Büro und Admins</b> – Kollegen nicht. Urlaub, Krankheit und Konten trägt das Büro direkt ein, du siehst die Änderung beim nächsten Öffnen.</p><p>Vorteil: Geht dein Handy kaputt, ist nichts verloren – einfach auf dem neuen Handy anmelden.</p></div>
    <button class="btn-p w-full mt-5" data-a="modal-close">${ic('check', 16)}Verstanden</button>`);
}
const ago2 = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'gerade eben' : m < 60 ? `vor ${m} Min.` : `vor ${Math.round(m / 60)} Std.`; };
function ldsStatusHtml() {
  const n = LDS.dirty.size + (LDS.setDirty ? 1 : 0);
  return `<div id="lds-status" class="rounded-[var(--r)] border border-line p-4 mb-6"><div class="flex flex-wrap items-center gap-2"><h3 class="font-semibold flex-1">Abgleich mit LumbraDesk</h3><button class="btn-s !h-9" data-a="lds-now">${ic('refresh', 15)}Jetzt abgleichen</button></div>
    <p class="text-[14px] mt-2 ${LDS.err ? 'text-yel-ink' : 'text-ink2'}">${LDS.err ? esc(LDS.err) : LDS.last ? `Zuletzt abgeglichen ${ago2(LDS.last)}${n ? ` · ${n} Änderung${n === 1 ? '' : 'en'} warten` : ' · alles auf dem Server'}` : 'Noch nicht abgeglichen.'}</p>
    <p class="hint">Angemeldet als ${esc((LDS.me || {}).name || '')}. Änderungen vom Büro kommen automatisch – eine Sicherungsdatei schicken ist nicht mehr nötig.</p></div>`;
}
function ldsStatusPaint() { const el = $('#lds-status'); if (el) el.outerHTML = ldsStatusHtml(); }

/* Einstellungen → Daten: Status statt „Sicherung ans Büro“, Datenschutz-Hinweis passend */
const _setBodyLd = setBody;
setBody = function () {
  if (!LDS.on) return _setBodyLd();
  if (UI.tab === 'daten') return ldsStatusHtml() + _setBodyTeam().replace(/<p class="text-\[14px\] text-ink2 mt-2">Deine Zeiten,[\s\S]*?<\/p>/, '<p class="text-[14px] text-ink2 mt-2">Deine Zeiten, dein Urlaub, deine Baustellen und der Standort beim Stempeln werden mit dem Firmen-Server (LumbraDesk) abgeglichen. Sehen können sie nur <b>Büro und Admins</b> – Kollegen nicht.</p>');
  if (UI.tab === 'team' && LDS.office) return ldsTeam();
  return _setBodyLd();
};
consentModal = function () {
  return new Promise(res => {
    modal(`<div class="text-center"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('pin', 26)}</div><div class="font-semibold text-[19px] mt-4">Hinweis zum Standort</div></div>
      <div class="text-[14px] text-ink2 mt-4 space-y-2"><p>Beim <b>Kommen, bei Pausen und beim Gehen</b> speichert die Stempeluhr einmalig deinen Standort – nicht dauerhaft und nicht im Hintergrund.</p><p>Der Standort wird mit deinen Zeiten auf dem Firmen-Server (LumbraDesk) gespeichert und ist nur für Büro und Admins sichtbar. Ohne Standortfreigabe ist Stempeln nicht möglich.</p></div>
      <button class="btn-p w-full mt-5" id="cs-ok">${ic('check', 16)}Verstanden und einverstanden</button>`);
    $('#cs-ok').onclick = () => { S.gpsConsent = tNow().toISOString(); saveSettings(); closeModal(); res(true); };
  });
};

/* ---------- Büro/Admin: alle Mitarbeiter vom Server ---------- */
async function ldsLoadStaff(force) {
  if (!LDS.office || (!force && Date.now() - LDS.staffAt < 20000)) return;
  const j = await ldsApi('st-staff'); LDS.staffAt = Date.now();
  const keep = STAFF; STAFF = {};
  for (const m of j.staff) {
    const k = 'u' + m.uid, old = keep[k] || {};
    const settings = m.settings || deepMerge(clone(DEFAULTS), { person: { name: m.name, nr: '', start: '' } });
    STAFF[k] = { name: m.name, nr: (settings.person || {}).nr || '', uid: m.uid, role: m.role, at: m.at, lastSync: m.lastSync, version: m.version, settings: clone(settings), days: m.days || {}, pending: old.pending || [], open: m.open || [], sent: old.sent || [] };
    /* schon geschickte, vom Handy noch nicht übernommene Änderungen auf die Kopie legen */
    for (const x of STAFF[k].open) for (const o of x.ops) applyToCopy(STAFF[k], o);
    for (const o of STAFF[k].pending) applyToCopy(STAFF[k], o);
  }
  await saveStaff();
}
function ldsTeam() {
  const list = Object.entries(STAFF).filter(([k]) => k.startsWith('u')).sort((a, b) => a[1].name.localeCompare(b[1].name)), sel = STAFF[UI.staff] ? UI.staff : '';
  let h = `<p class="text-ink3 text-[14px] mb-4">Alle Mitarbeiter aus LumbraDesk mit dem aktuellen Stand ihrer Stempeluhr. Urlaub, Krankheit oder Konten unten eintragen und „An Handy senden“ – der Mitarbeiter bekommt die Änderung beim nächsten Öffnen der App.</p>
    <div class="flex flex-wrap gap-2 mb-4"><button class="btn-s" data-a="lds-staff">${ic('refresh', 15)}Aktualisieren</button></div>`;
  if (!list.length) return h + `<div class="kpi text-[14px] text-ink3">${LDS.staffAt ? 'Noch keine Mitarbeiter in LumbraDesk.' : 'Wird geladen …'}</div>`;
  h += `<div class="grid gap-2">${list.map(([k, st]) => { const s = staffStats(st), used = !!st.at; return `<button class="text-left rounded-[var(--rb)] border ${k === sel ? 'border-p' : 'border-line'} bg-raised px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1" data-a="tm-sel" data-v="${esc(k)}"><b class="text-[15px] flex-1 min-w-[140px]">${esc(st.name)}</b>${used ? `<span class="text-[13px] text-ink2">Resturlaub <b>${fmtDays(s.v.left)}</b> von ${fmtDays(s.v.total)}</span><span class="text-[13px] text-ink2">Überstunden <b>${hm(s.over)}</b></span>` : ''}<span class="text-[12px] text-ink3">${used ? 'abgeglichen ' + (st.lastSync ? ago2(new Date(st.lastSync).getTime()) : '') : 'nutzt die Stempeluhr noch nicht'}${(st.open || []).length ? ` · <span class="text-yel-ink">${st.open.length} noch nicht auf dem Handy</span>` : ''}${(st.pending || []).length ? ` · <span class="text-yel-ink">${st.pending.length} vorgemerkt</span>` : ''}</span></button>`; }).join('')}</div>`;
  if (sel) h += staffEditor(sel).replace(/<button class="btn-g !h-9 text-ember" data-a="tm-del"[\s\S]*?<\/button>/, '').replace('Aktualisierung senden', 'An Handy senden')
    + ((STAFF[sel].open || []).length ? `<p class="hint mt-2">Noch nicht auf dem Handy übernommen: ${STAFF[sel].open.map(x => x.ops.map(opText).join(' · ')).map(esc).join(' | ')}</p>` : '');
  return h;
}
/* „Aktualisierung senden“ / „Betriebsurlaub an alle“ direkt über den Server statt als Datei */
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a="tm-send"],[data-a="buf-send"],[data-a="lds-now"],[data-a="lds-staff"]'); if (!a || !LDS.on) return;
  if (a.dataset.a === 'lds-now') { e.stopImmediatePropagation(); await ldsSync(); toast(LDS.err || 'Abgeglichen.', LDS.err ? 'warn' : 'ok'); return; }
  if (a.dataset.a === 'lds-staff') { e.stopImmediatePropagation(); try { await ldsLoadStaff(true); rerender(); } catch (err) { toast(err.message, 'err'); } return; }
  if (!LDS.office) return;
  e.stopImmediatePropagation();
  try {
    if (a.dataset.a === 'buf-send') {
      if (!(await confirmDlg('Betriebsurlaub an alle senden?', 'Alle Mitarbeiter bekommen die Liste beim nächsten Öffnen der Stempeluhr.', 'An alle senden'))) return;
      await ldsApi('st-ops', { to: '*', ops: [{ t: 'bu', list: firmBu(), at: tNow().toISOString() }], note: '' }); toast('Betriebsurlaub an alle geschickt.'); return;
    }
    const k = a.dataset.v, st = STAFF[k]; if (!st || !(st.pending || []).length) return;
    const note = (($('#tm-note') || {}).value || '').trim();
    await ldsApi('st-ops', { to: st.uid, ops: st.pending, note });
    st.sent = (st.sent || []).concat({ at: tNow().toISOString(), n: st.pending.length }).slice(-20); st.pending = []; await saveStaff();
    toast(`An ${st.name.split(' ')[0]}s Handy geschickt – kommt beim nächsten Öffnen an.`);
    await ldsLoadStaff(true); rerender();
  } catch (err) { toast('Senden nicht möglich: ' + err.message, 'err', 5000); }
}, true);

/* Start: nur unter LumbraDesk */
(async function ldsStart() {
  if (!/\/stempel\/(index\.html)?$/.test(location.pathname)) return;
  try {
    const j = await ldsApi('me'); if (!j.user) return;
    await new Promise(r => { const t = setInterval(() => { if (APP_READY) { clearInterval(t); r(); } }, 50); });   // App-Start (Einstellungen, Tage) abwarten
    await ldsState(); LDS.on = true; LDS.me = j.user; LDS.office = ['admin', 'buero'].includes(j.user.role);
    if (LDS.office) DEVICE.admin = true;   // Büro/Admin in LumbraDesk: wie ein Admin-Gerät (nur solange angemeldet, nicht gespeichert)
    await ldsSync();
    if (LDS.office) { try { await ldsLoadStaff(true); if (UI.tab === 'team') rerender(); } catch (e) {} }
    setInterval(() => { ldsSync(); if (LDS.office && UI.tab === 'team' && UI.route !== 'home') ldsLoadStaff().then(() => rerender()).catch(() => {}); }, 60000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') ldsSync(); });
    window.addEventListener('online', () => ldsSync());
    if (typeof render === 'function') render();
  } catch (e) { /* nicht unter LumbraDesk oder offline */ }
})();
