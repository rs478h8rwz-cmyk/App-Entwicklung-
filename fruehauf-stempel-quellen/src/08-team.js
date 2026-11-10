
/* =========================================================
   Mitarbeiter-Sicherungen und Aktualisierungen vom Büro
   - Jeder Mitarbeiter schickt seine Sicherung ans Büro (WhatsApp).
   - Admin-Geräte (Manuel, Jule, Artjom) bewahren je Mitarbeiter eine Kopie auf,
     ändern dort Urlaub, Krankheit, Urlaubskonto und Überstunden
     und schicken eine Aktualisierung zurück.
   - Die Aktualisierung ist mit dem Firmen-Admin-Passwort digital unterschrieben:
     nur echte Büro-Dateien lassen sich einspielen.
   ========================================================= */
/* Öffentlicher Prüfschlüssel und der mit dem Admin-Passwort verschlüsselte Signaturschlüssel (kein Klartext-Passwort im Code) */
const UPD_KEY = {"pub":{"kty":"EC","crv":"P-256","x":"GfRI2SrMeUAiop8Ky0zDUFqOY2O80YNc5ZyggeSJS2k","y":"xvD8q0z-apOnVmUiSYym32fj0YBlK3UR8QnpMKQNVJk"},"enc":{"salt":"a516bfdb02fd1949f0b412a27b672e96","iv":"5e1490b37849e74b0d8917b5","ct":"CjHJJXNKpi15w0cuSnWJN1UyCpp/sTIOQiMz+gJ4kkIvpxSyUycN3WgZ7uDfuIiPEokZrZqWnNUb8lD/laprzWoGc2UKbgUKdnjwrCgGQmAWD2pKfELgQSDtVN1iIVFY+OWAzluVLj64Wxe/v2OSkia1F++POcksP6hN9epHEwrIXLIq9S/QaKXiGl+9RMyqa5rEMjCEOEKtHA==","iter":150000}};
const TYPE_DE = { urlaub: 'Urlaub', krank: 'Krank', frei: 'Ausgleich (frei)', sonder: 'Sonderurlaub', work: 'Arbeitstag' };
const OFF_TYPES = ['urlaub', 'krank', 'frei', 'sonder'];
const hexBytes = h => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));
const b64Bytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const bytesB64 = b => btoa(String.fromCharCode(...new Uint8Array(b)));
const normName = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
let SIGN_KEY = null;   // nach Passworteingabe nur im Speicher
async function signKey(pw) {
  const E = UPD_KEY.enc, base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
  const aes = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: hexBytes(E.salt), iterations: E.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const pk8 = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: hexBytes(E.iv) }, aes, b64Bytes(E.ct));
  return crypto.subtle.importKey('pkcs8', pk8, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}
async function verifyUpd(payload, sig) {
  const k = await crypto.subtle.importKey('jwk', UPD_KEY.pub, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, b64Bytes(sig), new TextEncoder().encode(payload));
}
function askPw(title, text) {
  return new Promise(res => {
    modal(`<h3 class="text-[20px] font-semibold pr-8">${esc(title)}</h3><p class="text-ink2 text-[14px] mt-2">${esc(text)}</p>
      <input class="inp mt-4" id="upw" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" style="-webkit-text-security:disc" placeholder="Firmen-Admin-Passwort">
      <div class="flex flex-col sm:flex-row gap-2 mt-5"><button class="btn-p sm:flex-1" id="upw-ok">Weiter</button><button class="btn-s sm:flex-1" id="upw-no">Abbrechen</button></div>`);
    const go = () => { const v = $('#upw').value; closeModal(); res(v); };
    $('#upw-ok').onclick = go; $('#upw-no').onclick = () => { closeModal(); res(null); }; $('#upw').onkeydown = e => { if (e.key === 'Enter') go(); }; setTimeout(() => $('#upw') && $('#upw').focus(), 50);
  });
}
async function ensureSignKey() {
  if (SIGN_KEY) return true;
  const pw = await askPw('Aktualisierung unterschreiben', 'Zum Erstellen einer Aktualisierung bitte das Firmen-Admin-Passwort eingeben (einmal pro App-Start).');
  if (!pw) return false;
  try { SIGN_KEY = await signKey(pw); return true; } catch (e) { toast('Passwort falsch – bitte das Firmen-Admin-Passwort verwenden.', 'err', 4500); return false; }
}
function shareFile(blob, name, text, title) {
  const file = new File([blob], name, { type: 'application/json' }), can = navigator.canShare && navigator.canShare({ files: [file] });
  modal(`<div class="text-center pt-2"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('check', 26, 2.4)}</div><div class="font-semibold text-[19px] mt-4">${esc(title)}</div><div class="text-[13px] text-ink3 mt-1 break-all">${esc(name)}</div>
    <div class="grid gap-2 mt-6">${can ? `<button class="btn-p !h-12" id="tf-share">${ic('send', 17)}Per WhatsApp senden</button><p class="hint text-center -mt-1">Im Teilen-Menü WhatsApp wählen.</p>` : ''}
    <button class="btn-s" id="tf-save">${ic('download', 17)}Datei speichern</button><button class="btn-g" data-a="modal-close">Fertig</button></div>`);
  $('#tf-save').onclick = () => saveBlob(blob, name);
  const b = $('#tf-share'); if (b) b.onclick = async () => { try { await navigator.share({ files: [file], text, title: name }); closeModal(); } catch (err) { if (err && err.name !== 'AbortError') { saveBlob(blob, name); toast('Teilen nicht möglich – die Datei ist gespeichert.', 'warn'); } } };
}
const fileSafe = s => String(s || 'Mitarbeiter').trim().replace(/[^\wäöüÄÖÜß-]+/g, '_');

/* ---------- Mitarbeiter: Sicherung ans Büro senden ---------- */
function sendBackupToOffice() {
  if (!S.person.name) { toast('Bitte zuerst deinen Namen eintragen.', 'warn'); location.hash = '#/einstellungen/person'; return; }
  const data = { app: 'fruehauf-stempel', version: APP_VERSION, date: tNow().toISOString(), settings: S, days: Object.values(DAYS) };
  const name = `Stempeluhr_Sicherung_${fileSafe(S.person.name)}_${isoToday()}.json`;
  shareFile(new Blob([JSON.stringify(data)], { type: 'application/json' }), name, `Hallo ${S.recipient.name || ''}, hier meine Stempeluhr-Sicherung. Viele Grüße, ${S.person.name}`, 'Sicherung fürs Büro erstellt');
}

/* ---------- Mitarbeiter: Aktualisierung vom Büro einspielen ---------- */
function opText(o) {
  if (o.t === 'vac') return `Urlaubskonto: ${o.perYear} Tage/Jahr${o.start ? `, Eintritt ${deDate(o.start)}` : ''}${o.rule === 'gesetz' ? ' (gesetzlich)' : ''}${o.manual ? `, Anspruch ${o.manual.year}: ${o.manual.days} Tage` : ''}, Rest Vorjahr ${o.carry}, schon genommen ${o.year}: ${o.takenBefore}`;
  if (o.t === 'bal') return `Überstunden-Bestand ${hm(o.min)} ab ${deDate(o.from)}`;
  if (o.t === 'days') return `${deDate(o.von)}${o.bis !== o.von ? ' – ' + deDate(o.bis) : ''}: ${TYPE_DE[o.type] || o.type}`;
  return '';
}
async function importUpdate(file) {
  try {
    const f = JSON.parse(await file.text());
    if (f.app === 'fruehauf-stempel') return toast('Das ist eine Sicherung, keine Aktualisierung. Sicherungen spielt das Büro ein.', 'warn', 5000);
    if (f.app !== 'fruehauf-stempel-update' || !f.payload || !f.sig) throw new Error('Keine Aktualisierung der Stempeluhr');
    if (!(await verifyUpd(f.payload, f.sig))) throw new Error('Unterschrift ungültig – die Datei stammt nicht vom Büro oder wurde verändert');
    const u = JSON.parse(f.payload), done = S.updApplied || [];
    if (done.includes(u.id)) return toast('Diese Aktualisierung ist schon eingespielt.', 'warn');
    if (u.to.name !== '*' && S.person.name && normName(u.to.name) !== normName(S.person.name)) return toast(`Diese Aktualisierung ist für ${u.to.name} – nicht für ${S.person.name}.`, 'err', 5000);
    const list = u.ops.map(o => `<li>${esc(opText(o))}</li>`).join('');
    modal(`<h3 class="text-[20px] font-semibold pr-8">Aktualisierung vom Büro</h3><p class="text-ink3 text-[13px] mt-1">von ${esc(u.by || 'Büro')} · ${new Date(u.created).toLocaleString('de-DE')}</p>
      ${u.note ? `<div class="kpi mt-4 text-[14px]">${esc(u.note)}</div>` : ''}<ul class="list-disc pl-5 mt-4 space-y-1 text-[14px]">${list}</ul>
      <div class="flex flex-col sm:flex-row gap-2 mt-6"><button class="btn-p sm:flex-1" id="up-ok">Übernehmen</button><button class="btn-s sm:flex-1" data-a="modal-close">Abbrechen</button></div>`);
    $('#up-ok').onclick = async () => { await applyUpdate(u); closeModal(); toast('Aktualisierung übernommen.'); render(); };
  } catch (err) { toast('Aktualisierung nicht möglich: ' + err.message, 'err', 5500); }
}
async function applyUpdate(u) {
  const who = `Büro (${u.by || 'Admin'})`, at = tNow().toISOString();
  if (!S.person.name && u.to.name && u.to.name !== '*') S.person.name = u.to.name;
  for (const o of u.ops) {
    if (o.t === 'vac') { S.vacation = { ...S.vacation, perYear: +o.perYear, carry: +o.carry, takenBefore: +o.takenBefore, year: +o.year, rule: o.rule || S.vacation.rule || 'anteilig', manual: o.manual || null }; if (o.start !== undefined) S.person.start = o.start; }
    if (o.t === 'bal') S.balance = { from: o.from, min: +o.min };
    if (o.t === 'days') {
      for (let iso = o.von; iso <= o.bis; iso = addDays(iso, 1)) {
        const cur = DAYS[iso];
        if (o.type === 'work') { if (!cur || !OFF_TYPES.includes(cur.type)) continue; }
        else if (!isWorkday(iso)) continue;
        const d = clone(dayOf(iso)), from = d.type; if (from === o.type) continue;
        d.type = o.type; if (o.type !== 'urlaub') d.betrieb = '';
        (d.log = d.log || []).push({ at, what: 'Art des Tages', from: TYPE_DE[from] || from, to: TYPE_DE[o.type], admin: who }); d.edited = true;
        await saveDay(d);
      }
    }
  }
  S.kontoLog = (S.kontoLog || []).concat({ at, what: 'Aktualisierung vom ' + who + ': ' + u.ops.map(opText).join(' · ') });
  S.updApplied = (S.updApplied || []).concat(u.id).slice(-200);
  saveSettings();
}

/* ---------- Admin: Mitarbeiter-Sicherungen ---------- */
let STAFF = {};   // name (klein) → { name, nr, at, settings, days:{}, pending:[], note, sent:[] }
async function loadStaff() { try { STAFF = (await DB.get('kv', 'staff')) || {}; } catch (e) { STAFF = {}; } }
const saveStaff = () => DB.put('kv', clone(STAFF), 'staff');
/* Rechnen mit den Daten eines Mitarbeiters (eigene Daten bleiben unberührt) */
function withStaff(st, fn) {
  const s0 = S, d0 = DAYS;
  try { S = deepMerge(clone(DEFAULTS), st.settings || {}); DAYS = st.days || {}; return fn(); } finally { S = s0; DAYS = d0; }
}
async function importStaffBackup(file) {
  try {
    const d = JSON.parse(await file.text()); if (d.app !== 'fruehauf-stempel') throw new Error('Keine Sicherung der Stempeluhr');
    const name = ((d.settings || {}).person || {}).name; if (!name) throw new Error('In der Sicherung fehlt der Name');
    const k = normName(name), old = STAFF[k], days = {}; (d.days || []).forEach(x => { days[x.iso] = x; });
    STAFF[k] = { ...(old || {}), name, nr: (d.settings.person || {}).nr || '', at: d.date, settings: d.settings, days, pending: (old && old.pending) || [] };
    /* noch nicht übernommene Änderungen auf die neue Kopie legen */
    for (const o of STAFF[k].pending) applyToCopy(STAFF[k], o);
    await saveStaff(); toast(`Sicherung von ${name} gespeichert.`); UI.staff = k; render();
  } catch (err) { toast('Sicherung konnte nicht gelesen werden: ' + err.message, 'err', 5000); }
}
function applyToCopy(st, o) {
  st.settings = st.settings || clone(DEFAULTS);
  if (o.t === 'vac') { st.settings.vacation = { ...(st.settings.vacation || {}), perYear: +o.perYear, carry: +o.carry, takenBefore: +o.takenBefore, year: +o.year, rule: o.rule || 'anteilig', manual: o.manual || null }; if (o.start !== undefined) st.settings.person = { ...(st.settings.person || {}), start: o.start }; }
  if (o.t === 'bal') st.settings.balance = { from: o.from, min: +o.min };
  if (o.t === 'days') withStaff(st, () => {
    for (let iso = o.von; iso <= o.bis; iso = addDays(iso, 1)) {
      const cur = DAYS[iso];
      if (o.type === 'work') { if (cur && OFF_TYPES.includes(cur.type)) { cur.type = 'work'; } continue; }
      if (!isWorkday(iso)) continue; const d = clone(dayOf(iso)); d.type = o.type; DAYS[iso] = d;
    }
    st.days = DAYS;
  });
}
function staffStats(st) {
  return withStaff(st, () => { const v = vacation(), a = account(); return { v, over: a.over, minus: a.minus }; });
}
function teamBody() {
  if (!DEVICE.admin) return `<p class="text-ink3 text-[14px]">Nur auf Admin-Geräten (Manuel, Jule, Artjom). Unter „Admin“ dieses Gerät mit dem Admin-Passwort freischalten.</p>`;
  const list = Object.entries(STAFF).sort((a, b) => a[1].name.localeCompare(b[1].name));
  const sel = STAFF[UI.staff] ? UI.staff : '';
  let h = `<p class="text-ink3 text-[14px] mb-4">So geht's: Mitarbeiter schickt seine Sicherung per WhatsApp → hier öffnen → Urlaub, Krankheit oder Konten ändern → „Aktualisierung senden“. Der Mitarbeiter spielt sie unter Einstellungen → Daten ein, fertig.</p>
    <div class="flex flex-wrap gap-2"><label class="btn-p cursor-pointer">${ic('upload', 16)}Sicherung eines Mitarbeiters öffnen<input type="file" accept=".json,application/json" class="hidden" data-staff-file></label><button class="btn-s" data-a="tm-new">${ic('plus', 16)}Ohne Sicherung anlegen</button></div>`;
  if (!list.length) return h + `<div class="kpi mt-5 text-[14px] text-ink3">Noch keine Mitarbeiter gespeichert.</div>`;
  h += `<div class="grid gap-2 mt-5">${list.map(([k, st]) => { const s = staffStats(st); return `<button class="text-left rounded-[var(--rb)] border ${k === sel ? 'border-p' : 'border-line'} bg-raised px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1" data-a="tm-sel" data-v="${esc(k)}"><b class="text-[15px] flex-1 min-w-[140px]">${esc(st.name)}</b><span class="text-[13px] text-ink2">Resturlaub <b>${fmtDays(s.v.left)}</b> von ${fmtDays(s.v.total)}</span><span class="text-[13px] text-ink2">Überstunden <b>${hm(s.over)}</b></span><span class="text-[12px] text-ink3">${st.at ? 'Sicherung ' + new Date(st.at).toLocaleDateString('de-DE') : 'ohne Sicherung'}${(st.pending || []).length ? ` · <span class="text-yel-ink">${st.pending.length} offen</span>` : ''}</span></button>`; }).join('')}</div>`;
  if (sel) h += staffEditor(sel);
  return h;
}
function staffEditor(k) {
  const st = STAFF[k], s = staffStats(st), v = (st.settings || {}).vacation || DEFAULTS.vacation, b = (st.settings || {}).balance || DEFAULTS.balance, y = tNow().getFullYear();
  const days = withStaff(st, () => Object.values(DAYS).filter(d => OFF_TYPES.includes(d.type) && d.iso >= `${y}-01-01`).sort((a, c) => a.iso.localeCompare(c.iso)));
  /* zusammenhängende Zeiträume gleicher Art */
  const runs = []; days.forEach(d => { const r = runs[runs.length - 1]; if (r && r.type === d.type && withStaff(st, () => workDaysIn(addDays(r.bis, 1), addDays(d.iso, -1)).length === 0)) r.bis = d.iso; else runs.push({ type: d.type, von: d.iso, bis: d.iso }); });
  return `<div class="mt-6 rounded-[var(--r)] border border-line p-4 sm:p-5">
    <div class="flex flex-wrap items-center gap-2"><h3 class="font-semibold text-[18px] flex-1">${esc(st.name)}</h3><button class="btn-g !h-9" data-a="tm-dl" data-v="${esc(k)}">${ic('download', 15)}Sicherung herunterladen</button><button class="btn-g !h-9 text-ember" data-a="tm-del" data-v="${esc(k)}">${ic('trash', 15)}Entfernen</button></div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">${kpi('Anspruch ' + y, fmtDays(s.v.total) + ' Tage')}${kpi('Genommen', fmtDays(s.v.taken) + ' Tage')}${kpi('Geplant', fmtDays(s.v.planned) + ' Tage')}${kpi('Rest', fmtDays(s.v.left) + ' Tage')}</div>
    <h4 class="font-semibold mt-6 mb-2">Urlaub / Krank / Ausgleich eintragen</h4>
    <div class="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1.2fr_auto] gap-2"><input type="date" class="inp" id="tm-von"><input type="date" class="inp" id="tm-bis"><select class="inp" id="tm-type"><option value="urlaub">Urlaub</option><option value="krank">Krank</option><option value="sonder">Sonderurlaub</option><option value="frei">Ausgleich (frei)</option><option value="work">Wieder Arbeitstag</option></select><button class="btn-s col-span-2 sm:col-span-1" data-a="tm-days" data-v="${esc(k)}">${ic('plus', 16)}Eintragen</button></div>
    <div class="space-y-1 mt-3">${runs.map(r => `<div class="flex flex-wrap items-center gap-2 rounded-[var(--rb)] bg-raised px-3 py-1.5 text-[13px]"><span class="badge ${r.type === 'krank' ? 'bg-tred text-red-ink' : r.type === 'sonder' ? 'text-[#7C3AED] bg-[rgba(139,92,246,.16)]' : 'bg-tyel text-yel-ink'}">${TYPE_DE[r.type]}</span><span class="flex-1">${deDate(r.von)}${r.bis !== r.von ? ' – ' + deDate(r.bis) : ''}</span><button class="text-ink3 hover:text-ink" data-a="tm-undo-run" data-v="${esc(k)}" data-von="${r.von}" data-bis="${r.bis}" title="Wieder Arbeitstage">${ic('x', 15)}</button></div>`).join('') || '<div class="text-[13px] text-ink3">Keine Einträge in diesem Jahr.</div>'}</div>
    <h4 class="font-semibold mt-6 mb-2">Konten</h4>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2"><label><span class="lbl">Eintrittsdatum</span><input type="date" class="inp" id="tm-start" value="${esc(((st.settings || {}).person || {}).start || '')}"></label><label><span class="lbl">Berechnung Eintrittsjahr</span><select class="inp" id="tm-rule"><option value="anteilig" ${(v.rule || 'anteilig') === 'anteilig' ? 'selected' : ''}>Anteilig (1/12 je Monat)</option><option value="gesetz" ${v.rule === 'gesetz' ? 'selected' : ''}>Gesetzlich (BUrlG)</option></select></label><label><span class="lbl">Anspruch ${y} (auto ${s.v.ent.auto})</span><input class="inp" id="tm-man" inputmode="numeric" value="${s.v.ent.manual ? esc(s.v.ent.days) : ''}" placeholder="leer = automatisch"></label>
      <label><span class="lbl">Urlaubstage/Jahr</span><input class="inp" id="tm-per" inputmode="numeric" value="${esc(v.perYear)}"></label><label><span class="lbl">Rest Vorjahr</span><input class="inp" id="tm-carry" inputmode="numeric" value="${esc(v.carry)}"></label><label><span class="lbl">Schon genommen ${y}</span><input class="inp" id="tm-taken" inputmode="numeric" value="${esc(+v.year === y ? v.takenBefore : 0)}"></label>
      <label><span class="lbl">Überstunden zählen ab</span><input type="date" class="inp" id="tm-from" value="${esc(b.from)}"></label><label><span class="lbl">Startwert (Std:Min)</span><input class="inp" id="tm-over" value="${esc(hm(b.min || 0))}"></label><div class="flex items-end"><button class="btn-s w-full" data-a="tm-konto" data-v="${esc(k)}">Konten übernehmen</button></div></div>
    <p class="hint">${s.v.ent.why ? esc(s.v.ent.why) + ' · ' : ''}Aktuell: Überstunden ${hm(s.over)}${s.minus ? ` · Minusstunden ${hm(s.minus)}` : ''}${s.v.sonder ? ` · Sonderurlaub ${s.v.sonder} ${s.v.sonder === 1 ? 'Tag' : 'Tage'}` : ''}</p>
    <h4 class="font-semibold mt-6 mb-2">Offene Änderungen ${(st.pending || []).length ? `(${st.pending.length})` : ''}</h4>
    ${(st.pending || []).length ? `<ul class="list-disc pl-5 space-y-1 text-[14px]">${st.pending.map(o => `<li>${esc(opText(o))}</li>`).join('')}</ul>
      <label class="block mt-3"><span class="lbl">Nachricht an ${esc(st.name.split(' ')[0])} (optional)</span><input class="inp" id="tm-note" placeholder="z. B. Urlaub wie besprochen eingetragen"></label>
      <div class="flex flex-wrap gap-2 mt-3"><button class="btn-p" data-a="tm-send" data-v="${esc(k)}">${ic('send', 16)}Aktualisierung senden</button><button class="btn-g" data-a="tm-clear" data-v="${esc(k)}">Verwerfen</button></div>` : '<div class="text-[13px] text-ink3">Keine – Änderungen oben eintragen.</div>'}
    ${(st.sent || []).length ? `<p class="hint mt-4">Zuletzt gesendet: ${st.sent.slice(-3).reverse().map(x => new Date(x.at).toLocaleString('de-DE')).join(', ')}</p>` : ''}
  </div>`;
}
async function staffAction(a) {
  const k = a.dataset.v, st = STAFF[k], act = a.dataset.a;
  if (act === 'tm-sel') { UI.staff = UI.staff === k ? '' : k; return rerender(); }
  if (act === 'tm-new') {
    const name = await askName(); if (!name) return; const kk = normName(name);
    if (!STAFF[kk]) STAFF[kk] = { name, nr: '', at: '', settings: clone(DEFAULTS), days: {}, pending: [] };
    STAFF[kk].settings.person = { name, nr: '' }; UI.staff = kk; await saveStaff(); return rerender();
  }
  if (!st) return;
  if (act === 'tm-days' || act === 'tm-undo-run') {
    const von = act === 'tm-days' ? $('#tm-von').value : a.dataset.von, bis = act === 'tm-days' ? $('#tm-bis').value || von : a.dataset.bis, type = act === 'tm-days' ? $('#tm-type').value : 'work';
    if (!von || bis < von) return toast('Bitte Von und Bis angeben.', 'warn');
    const o = { t: 'days', von, bis, type }; st.pending = (st.pending || []).concat(o); applyToCopy(st, o);
  }
  if (act === 'tm-konto') {
    const m = /^\s*(\d+)(?::(\d{1,2}))?\s*$/.exec($('#tm-over').value); if (!m) return toast('Überstunden bitte als Std:Min, z. B. 12:30', 'warn');
    const y = tNow().getFullYear(), man = $('#tm-man').value.trim(), ops = [{ t: 'vac', perYear: +$('#tm-per').value || 0, carry: +$('#tm-carry').value || 0, takenBefore: +$('#tm-taken').value || 0, year: y, start: $('#tm-start').value || '', rule: $('#tm-rule').value, manual: man !== '' && isFinite(+man) ? { year: y, days: +man } : null }, { t: 'bal', from: $('#tm-from').value ? mondayOf($('#tm-from').value) : mondayOf(isoToday()), min: +m[1] * 60 + (+m[2] || 0) }];
    /* Überstunden nur mitschicken, wenn sie hier wirklich geändert wurden – sonst bleibt der Stand des Mitarbeiters */
    const ob = (st.settings || {}).balance || {}, nb = ops[1], balChanged = +nb.min !== (+ob.min || 0) || ($('#tm-from').value && nb.from !== ob.from);
    if (!balChanged) ops.pop();
    st.pending = (st.pending || []).filter(o => o.t !== 'vac' && (balChanged ? o.t !== 'bal' : true)).concat(ops); ops.forEach(o => applyToCopy(st, o));
    toast('Konten vorgemerkt – jetzt „Aktualisierung senden“.');
  }
  if (act === 'tm-clear') { if (!(await confirmDlg('Änderungen verwerfen?', 'Die offenen Änderungen werden nicht gesendet. Die gespeicherte Kopie bleibt wie zuletzt geändert – zum Zurücksetzen die Sicherung neu öffnen.', 'Verwerfen', true))) return; st.pending = []; }
  if (act === 'tm-del') { if (!(await confirmDlg(`${st.name} entfernen?`, 'Die gespeicherte Sicherung auf diesem Gerät wird gelöscht.', 'Entfernen', true))) return; delete STAFF[k]; UI.staff = ''; }
  if (act === 'tm-dl') { const data = { app: 'fruehauf-stempel', version: APP_VERSION, date: st.at || tNow().toISOString(), settings: st.settings, days: Object.values(st.days || {}) }; saveBlob(new Blob([JSON.stringify(data)], { type: 'application/json' }), `Stempeluhr_Sicherung_${fileSafe(st.name)}_${isoToday()}.json`); return; }
  if (act === 'tm-send') {
    if (!(st.pending || []).length) return;
    const note = ($('#tm-note') || {}).value || '';
    if (!(await ensureSignKey())) return;
    const u = { id: uid('u'), created: tNow().toISOString(), by: S.person.name || 'Büro', to: { name: st.name, nr: st.nr || '' }, ops: st.pending, note: note.trim() };
    const payload = JSON.stringify(u), sig = bytesB64(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, SIGN_KEY, new TextEncoder().encode(payload)));
    const blob = new Blob([JSON.stringify({ app: 'fruehauf-stempel-update', payload, sig })], { type: 'application/json' });
    st.sent = (st.sent || []).concat({ at: u.created, id: u.id, n: u.ops.length }).slice(-20); st.pending = []; await saveStaff();
    const first = st.name.split(' ')[0];
    shareFile(blob, `Stempeluhr_Aktualisierung_${fileSafe(st.name)}_${isoToday()}.json`, `Hallo ${first}, hier eine Aktualisierung für deine Stempeluhr. Datei speichern, dann in der App: Einstellungen → Daten → „Aktualisierung vom Büro einspielen“.`, `Aktualisierung für ${st.name} erstellt`);
    rerender(); return;
  }
  await saveStaff(); rerender();
}
function askName() {
  return new Promise(res => {
    modal(`<h3 class="text-[20px] font-semibold pr-8">Mitarbeiter anlegen</h3><p class="text-ink2 text-[14px] mt-2">Genau so schreiben, wie der Mitarbeiter seinen Namen in der App eingetragen hat.</p><input class="inp mt-4" id="tm-name" placeholder="Vor- und Nachname">
      <div class="flex flex-col sm:flex-row gap-2 mt-5"><button class="btn-p sm:flex-1" id="tn-ok">Anlegen</button><button class="btn-s sm:flex-1" id="tn-no">Abbrechen</button></div>`);
    $('#tn-ok').onclick = () => { const v = $('#tm-name').value.trim(); closeModal(); res(v); }; $('#tn-no').onclick = () => { closeModal(); res(''); };
  });
}

/* ---------- Einbindung in die Einstellungen ---------- */
SET_TABS.splice(SET_TABS.findIndex(t => t[0] === 'admin'), 0, ['team', 'Mitarbeiter', 'users']);
const _setBodyTeam = setBody;
setBody = function () {
  if (UI.tab === 'team') return teamBody();
  const b = _setBodyTeam();
  if (UI.tab !== 'daten') return b;
  return `<div class="rounded-[var(--r)] border border-line p-4 mb-6"><h3 class="font-semibold mb-1">Mit dem Büro abgleichen</h3><p class="text-ink3 text-[14px] mb-3">Sicherung an ${esc(S.recipient.name || 'das Büro')} schicken – das Büro bewahrt sie auf und kann Urlaub oder Konten ändern. Kommt eine Aktualisierung zurück, hier einspielen.</p>
    <div class="flex flex-wrap gap-2"><button class="btn-p" data-a="tm-backup">${ic('send', 16)}Sicherung ans Büro senden</button><label class="btn-s cursor-pointer">${ic('upload', 16)}Aktualisierung vom Büro einspielen<input type="file" accept=".json,application/json" class="hidden" data-upd-file></label></div></div>` + b;
};
document.addEventListener('click', e => {
  const a = e.target.closest('[data-a^="tm-"]'); if (!a) return;
  if (a.dataset.a === 'tm-backup') return sendBackupToOffice();
  staffAction(a);
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.matches && el.matches('[data-staff-file]') && el.files && el.files[0]) { importStaffBackup(el.files[0]); el.value = ''; }
  if (el.matches && el.matches('[data-upd-file]') && el.files && el.files[0]) { importUpdate(el.files[0]); el.value = ''; }
});
loadStaff().then(() => { if (UI.tab === 'team' && typeof render === 'function') render(); });

/* Konten-Reiter: Berechnungsart und von Hand angepasster Anspruch */
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a="vac-rule"]'); if (!a) return;
  if (!(await needEdit())) return; S.vacation.rule = a.dataset.v; S.kontoLog = (S.kontoLog || []).concat({ at: tNow().toISOString(), what: 'Urlaubsberechnung: ' + (a.dataset.v === 'gesetz' ? 'gesetzlich' : 'anteilig') }); saveSettings(); rerender();
});
document.addEventListener('change', e => {
  const el = e.target; if (!el.matches || !el.matches('[data-vman]')) return;
  if (!canEdit()) return rerender();
  const y = tNow().getFullYear(), v = el.value.trim();
  S.vacation.manual = v === '' ? null : { year: y, days: +v };
  S.kontoLog = (S.kontoLog || []).concat({ at: tNow().toISOString(), what: v === '' ? `Urlaubsanspruch ${y}: wieder automatisch` : `Urlaubsanspruch ${y} von Hand: ${v} Tage` });
  saveSettings(); rerender();
});

/* Heiligabend / Silvester einstellen (Arbeitszeiten, mit Freischaltung) */
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a="half-day"]'); if (!a) return;
  if (!(await needEdit())) return;
  S.halfDays = { ...(S.halfDays || {}), [a.dataset.k]: a.dataset.v };
  S.kontoLog = (S.kontoLog || []).concat({ at: tNow().toISOString(), what: `${a.dataset.k === '12-24' ? 'Heiligabend' : 'Silvester'}: ${{ halb: 'halber Tag', voll: 'ganzer Tag', frei: 'frei' }[a.dataset.v]}` });
  saveSettings(); rerender();
});

/* ---------- Reiter „Betriebsurlaub“: für alle anpassbar, vom Büro an alle verteilbar ---------- */
function buBody(ro) {
  const L = firmBu(), y = tNow().getFullYear(), cnt = b => { const l = workDaysIn(b.von, b.bis), ys = [...new Set(l.map(i => i.slice(0, 4)))]; return ys.map(y2 => { const n = vacDays(l.filter(i => i.startsWith(y2))); return `${fmtDays(n)} ${n === 1 ? 'Tag' : 'Tage'} ${y2}`; }).join(' + ') || '0 Tage'; };
  const src = S.buFirm && L === S.buFirm.list ? `Stand ${new Date(S.buFirm.at).toLocaleDateString('de-DE')}${S.buFirm.by ? ' · vom Büro (' + esc(S.buFirm.by) + ')' : ''}` : 'Firmenvorgabe aus dem App-Update';
  return `${ro ? `<div class="rounded-[var(--rb)] bg-raised p-3 mb-5 flex flex-wrap items-center gap-3 text-[14px]"><span class="text-ink3">${ic('alert', 17)}</span><span class="flex-1">Nur mit Admin-Passwort änderbar.</span><button class="btn-s !h-9" data-a="unlock">Freischalten</button></div>` : ''}
    <p class="text-ink3 text-[14px] mb-4">Gilt für alle Mitarbeiter. Die Tage werden vom Urlaubsanspruch abgezogen (Wochenenden und Feiertage nicht, Heiligabend/Silvester je nach Einstellung halb). ${src}.</p>
    <div class="space-y-2">${L.map((b, i) => ro ? `<div class="flex flex-wrap items-center gap-2 rounded-[var(--rb)] bg-raised px-3 py-2.5 text-[14px]"><span style="color:#C7792F">${ic('cal', 16)}</span><b>${esc(b.name || 'Betriebsurlaub')}</b><span class="flex-1">${deDate(b.von)} – ${deDate(b.bis)}</span><span class="text-[13px] text-ink2">${b.abzug === false ? 'zählt nicht vom Urlaub' : cnt(b)}</span></div>`
      : `<div class="rounded-[var(--rb)] bg-raised p-3"><div class="grid grid-cols-2 sm:grid-cols-[1.3fr_1fr_1fr_auto] gap-2 items-center"><input class="inp col-span-2 sm:col-span-1" data-buf="${i}" data-k="name" value="${esc(b.name || '')}" placeholder="Name"><input type="date" class="inp" data-buf="${i}" data-k="von" value="${esc(b.von)}"><input type="date" class="inp" data-buf="${i}" data-k="bis" value="${esc(b.bis)}"><button class="btn-g !h-10 col-span-2 sm:col-span-1 hover:!text-ember" data-a="buf-del" data-i="${i}">${ic('trash', 15)}Entfernen</button></div>
        <div class="flex flex-wrap items-center gap-3 mt-2 text-[13px]"><label class="flex items-center gap-2 text-ink2"><input type="checkbox" data-buf="${i}" data-k="abzug" ${b.abzug === false ? '' : 'checked'}>vom Urlaub abziehen</label><span class="text-ink3">${b.abzug === false ? '' : cnt(b)}</span></div></div>`).join('') || '<div class="kpi text-[14px] text-ink3">Kein Betriebsurlaub eingetragen.</div>'}</div>
    ${ro ? '' : `<button class="btn-s mt-3" data-a="buf-add">${ic('plus', 16)}Zeitraum hinzufügen</button>`}
    ${(S.bu || []).length ? `<h3 class="font-semibold mt-7 mb-2">Nur auf diesem Gerät</h3><div class="space-y-1.5">${S.bu.map((b, i) => `<div class="flex flex-wrap items-center gap-2 rounded-[var(--rb)] bg-raised px-3 py-2 text-[14px]"><b>${esc(b.name || 'Betriebsurlaub')}</b><span class="flex-1">${deDate(b.von)} – ${deDate(b.bis)}</span>${ro ? '' : `<button class="text-ink3 hover:text-ember" data-a="bu-del" data-i="${i}">${ic('trash', 15)}</button>`}</div>`).join('')}</div>` : ''}
    ${DEVICE.admin ? `<div class="rounded-[var(--r)] border border-line p-4 mt-7"><h3 class="font-semibold">An alle Mitarbeiter verteilen</h3><p class="text-ink3 text-[14px] mt-1 mb-3">Erstellt eine Aktualisierung für alle – z. B. in die WhatsApp-Gruppe schicken. Jeder spielt sie unter Einstellungen → Daten → „Aktualisierung vom Büro einspielen“ ein.</p><button class="btn-p" data-a="buf-send">${ic('send', 16)}Betriebsurlaub an alle senden</button></div>` : `<p class="hint mt-5">Änderungen hier gelten nur auf diesem Handy. Für alle Mitarbeiter: auf einem Admin-Gerät ändern und „An alle senden“.</p>`}`;
}
const _setBodyBu = setBody;
setBody = function () { if (UI.tab === 'bu') return buBody(!canEdit()); return _setBodyBu(); };
function buEdit(fn) { const list = clone(firmBu()); fn(list); S.buFirm = { at: tNow().toISOString(), by: S.person.name || '', list }; saveSettings(); }
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a="buf-add"],[data-a="buf-del"],[data-a="buf-send"]'); if (!a) return;
  if (a.dataset.a === 'buf-send') {
    if (!(await ensureSignKey())) return;
    const u = { id: uid('u'), created: tNow().toISOString(), by: S.person.name || 'Büro', to: { name: '*', nr: '' }, ops: [{ t: 'bu', list: firmBu(), at: tNow().toISOString() }], note: '' };
    const payload = JSON.stringify(u), sig = bytesB64(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, SIGN_KEY, new TextEncoder().encode(payload)));
    shareFile(new Blob([JSON.stringify({ app: 'fruehauf-stempel-update', payload, sig })], { type: 'application/json' }), `Stempeluhr_Betriebsurlaub_${isoToday()}.json`, 'Hallo zusammen, hier der aktuelle Betriebsurlaub für die Stempeluhr. Datei speichern, dann in der App: Einstellungen → Daten → „Aktualisierung vom Büro einspielen“.', 'Betriebsurlaub für alle erstellt');
    return;
  }
  if (!(await needEdit())) return;
  if (a.dataset.a === 'buf-add') { const y = tNow().getFullYear(); buEdit(l => l.push({ name: 'Betriebsurlaub', von: `${y}-12-24`, bis: `${y + 1}-01-01`, abzug: true })); }
  if (a.dataset.a === 'buf-del') { if (!(await confirmDlg('Zeitraum entfernen?', 'Der Betriebsurlaub wird gelöscht – die Tage werden wieder normale Arbeitstage.', 'Entfernen', true))) return; buEdit(l => l.splice(+a.dataset.i, 1)); }
  rerender();
});
document.addEventListener('change', async e => {
  const el = e.target; if (!el.dataset || el.dataset.buf === undefined) return;
  if (!canEdit()) return rerender();
  const i = +el.dataset.buf, k = el.dataset.k, v = el.type === 'checkbox' ? el.checked : el.value;
  if ((k === 'von' || k === 'bis') && !v) return rerender();
  buEdit(l => { if (!l[i]) return; l[i][k] = v; if (l[i].bis < l[i].von) l[i].bis = l[i].von; });
  rerender();
});
/* Aktualisierung „Betriebsurlaub für alle“ */
const _opTextBu = opText;
opText = function (o) { if (o.t === 'bu') return 'Betriebsurlaub für alle: ' + (o.list.map(b => `${b.name || 'Betriebsurlaub'} ${deDate(b.von)} – ${deDate(b.bis)}${b.abzug === false ? ' (zählt nicht)' : ''}`).join(', ') || 'keiner'); return _opTextBu(o); };
const _applyUpdateBu = applyUpdate;
applyUpdate = async function (u) { for (const o of u.ops) if (o.t === 'bu') S.buFirm = { at: o.at || u.created, by: u.by || '', list: o.list }; return _applyUpdateBu(u); };
