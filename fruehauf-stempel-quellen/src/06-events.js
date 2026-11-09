
/* =========================================================
   Ereignisse
   ========================================================= */
const todayDay = () => clone(dayOf(isoToday()));
function geoStamp(iso, kind) {
  if (!S.gps || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async pos => { const d = clone(dayOf(iso)); (d.geo = d.geo || []).push({ k: kind, t: nowHM(), lat: +pos.coords.latitude.toFixed(5), lon: +pos.coords.longitude.toFixed(5), acc: Math.round(pos.coords.accuracy) }); await saveDay(d); }, () => {}, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
}
async function stamp(kind) {
  const d = todayDay(), t = nowHM(), seg = curSeg(d), op = openPause(d);
  d.segs = d.segs || []; d.pauses = d.pauses || [];
  if (kind === 'in') {
    if (seg) return;
    if (d.type !== 'work') d.type = 'work';
    const site = ($('#site') || {}).value ? $('#site').value.trim() : ''; rememberSite(site);
    d.segs.push({ site, von: t, bis: '' }); toast(`Gekommen um ${t} Uhr${site ? ' · ' + site : ''}`);
  } else if (kind === 'pause') {
    if (!seg) return;
    if (op) { op.bis = t; toast(`Pause beendet um ${t} Uhr`); } else { d.pauses.push({ von: t, bis: '' }); toast(`Pause ab ${t} Uhr`); }
  } else if (kind === 'out') {
    if (!seg) return; if (op) op.bis = t; seg.bis = t;
    await saveDay(d); const c = calcDay(d); toast(`Gegangen um ${t} Uhr · heute ${hm(c.netto)} Std.`, 'ok', 4500); geoStamp(d.iso, kind); return rerender();
  }
  await saveDay(d); geoStamp(d.iso, kind); rerender();
}
function switchDialog() {
  modal(`<h3 class="text-[20px] font-semibold pr-8">Baustelle wechseln</h3><p class="text-ink3 text-[14px] mt-1">Die Zeit bis jetzt bleibt bei der bisherigen Baustelle.</p>
    <label class="block mt-5"><span class="lbl">Neue Baustelle</span><input class="inp" id="site2" list="dl-sites" placeholder="z. B. Schulz, Osnabrück" autocomplete="off"></label>${siteChips('site2')}
    <button class="btn-p w-full mt-5" data-a="switch-ok">${ic('refresh', 16)}Jetzt wechseln</button>`);
}
async function doSwitch() {
  const site = $('#site2').value.trim(); if (!site) { toast('Bitte eine Baustelle angeben.', 'warn'); return; }
  const d = todayDay(), t = nowHM(), seg = curSeg(d), op = openPause(d); if (!seg) return closeModal();
  if (op) op.bis = t; seg.bis = t; d.segs.push({ site, von: t, bis: '' }); rememberSite(site);
  await saveDay(d); closeModal(); toast(`Ab ${t} Uhr: ${site}`); rerender();
}

/* ---------- Freischalten (ohne „Passwort speichern?“) ----------
   Kein <form>, kein type=password: Browser bieten dann kein Speichern an. */
function unlockDialog() {
  return new Promise(res => {
    modal(`<h3 class="text-[20px] font-semibold pr-8">Admin-Freigabe</h3><p class="text-ink3 text-[14px] mt-1">Nachträgliche Änderungen nur mit Admin-Passwort. Jede Änderung wird protokolliert.</p>
      <input class="inp mt-5" id="unl-pw" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" data-lpignore="true" data-1p-ignore name="x-${Date.now()}" placeholder="Passwort" style="-webkit-text-security:disc;text-security:disc">
      <button class="btn-p w-full mt-4" id="unl-ok">Freischalten</button><p class="hint text-center">Gilt 10 Minuten auf diesem Gerät.</p>`);
    const go = async () => { const pw = $('#unl-pw').value; if (!pw) return; if (await checkAdmin(pw)) { UI.editUntil = Date.now() + 10 * 60000; closeModal(); toast('Freigeschaltet für 10 Minuten.'); res(true); } else { toast('Passwort falsch.', 'err'); $('#unl-pw').value = ''; } };
    $('#unl-ok').onclick = go; $('#unl-pw').onkeydown = e => { if (e.key === 'Enter') go(); };
    setTimeout(() => { const el = $('#unl-pw'); if (el) el.focus(); }, 60);
  });
}
async function needEdit() { if (canEdit()) return true; return unlockDialog(); }
/* Änderung protokollieren: was, alter und neuer Wert, wann, auf welchem Gerät */
function logChange(d, what, from, to) { if ((from ?? '') === (to ?? '') && what !== 'Zeitraum hinzugefügt') return; (d.log = d.log || []).push({ at: new Date().toISOString(), what, from: from ?? '', to: to ?? '', admin: DEVICE.admin ? 'Admin-Gerät' : 'Passwort' }); d.edited = true; }

document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a]'); if (!a) return;
  const act = a.dataset.a, iso = a.dataset.iso;
  switch (act) {
    case 'in': case 'pause': case 'out': stamp(act); break;
    case 'vac-today': { if (!(await confirmDlg('Heute Urlaub?', `${WD[new Date().getDay()]}, ${deDate(isoToday())} wird als Urlaubstag eingetragen (Resturlaub danach: ${vacation().left - 1} Tage).`, 'Urlaub eintragen'))) return; const d = todayDay(); logChange(d, 'Art des Tages', typeName(d.type), 'Urlaub'); d.edited = false; d.type = 'urlaub'; await saveDay(d); toast('Heute ist Urlaub eingetragen. Schönen freien Tag!'); rerender(); break; }
    case 'vac-undo': { const d = todayDay(); logChange(d, 'Art des Tages', 'Urlaub', 'Arbeit'); d.edited = false; d.type = 'work'; await saveDay(d); rerender(); break; }
    case 'vac-set': await setVacation(); break;
    case 'cal': UI.calM = a.dataset.v; rerender(); break;
    case 'bu-add': { if (!(await needEdit())) return; const von = $('#bu-von').value, bis = $('#bu-bis').value; if (!von || !bis || bis < von) return toast('Bitte Von und Bis angeben.', 'warn'); S.bu = (S.bu || []).concat({ name: $('#bu-name').value.trim() || 'Betriebsurlaub', von, bis, abzug: $('#bu-abzug').checked }); saveSettings(); toast('Betriebsurlaub eingetragen.'); rerender(); break; }
    case 'bu-del': { if (!(await needEdit())) return; S.bu.splice(+a.dataset.i, 1); saveSettings(); rerender(); break; }
    case 'pin-set': { const v = $('#pin-new').value.trim(); if (!/^\d{4,8}$/.test(v)) return toast('Bitte 4 bis 8 Ziffern.', 'warn'); const salt = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join(''); S.pin = { salt, hash: await pbkdf2(v, salt, 60000) }; saveSettings(); toast('PIN festgelegt.'); rerender(); break; }
    case 'pin-off': { if (!(await pinCheck('Zum Entfernen bitte die PIN eingeben'))) return; S.pin = null; saveSettings(); rerender(); break; }
    case 'vac-submit': await submitVacation(); break;
    case 'vac-del': { const past = a.dataset.von < isoToday(); if (past && !(await needEdit())) return; if (!(await confirmDlg('Urlaub entfernen?', `${deDate(a.dataset.von)} – ${deDate(a.dataset.bis)} wird wieder zu Arbeitstagen.`, 'Entfernen', true))) return; for (let i = a.dataset.von; i <= a.dataset.bis; i = addDays(i, 1)) { const d = clone(dayOf(i)); if (d.type !== 'urlaub') continue; logChange(d, 'Art des Tages', 'Urlaub', 'Arbeit'); if (i >= isoToday()) d.edited = !!(d.log || []).some(x => x.what !== 'Art des Tages'); d.type = 'work'; await saveDay(d); } rerender(); break; }
    case 'switch': { const v = ($('#site') || {}).value; if (v && v.trim()) { $('#site').id = 'site2'; return doSwitch(); } switchDialog(); break; }
    case 'switch-ok': doSwitch(); break;
    case 'site-pick': { const el = $('#' + a.dataset.t); if (el) el.value = a.dataset.v; break; }
    case 'send-week': sendPdf('week', a.dataset.mon); break;
    case 'send-month': sendPdf('month', a.dataset.iso); break;
    case 'unlock': if (await unlockDialog()) rerender(); break;
    case 'lock': UI.editUntil = 0; UI.openDay = ''; rerender(); break;
    case 'ed-open': if (await needEdit()) { UI.openDay = iso; rerender(); } break;
    case 'ed-type': { if (!(await needEdit())) return; const d = clone(dayOf(iso)); logChange(d, 'Art des Tages', typeName(d.type), typeName(a.dataset.v)); d.type = a.dataset.v; await saveDay(d); rerender(); break; }
    case 'ed-seg-add': { if (!(await needEdit())) return; const d = clone(dayOf(iso)); d.segs = d.segs || []; const last = d.segs[d.segs.length - 1], h = S.hours[new Date(iso + 'T12:00').getDay()] || {}; d.segs.push({ site: last ? last.site : '', von: last && last.bis ? last.bis : h.von || '07:30', bis: d.segs.length ? '' : h.bis || '' }); logChange(d, 'Zeitraum hinzugefügt', '', ''); await saveDay(d); rerender(); break; }
    case 'ed-seg-del': { if (!(await needEdit())) return; const d = clone(dayOf(iso)), s = d.segs[+a.dataset.i]; logChange(d, 'Zeitraum gelöscht', `${s.site || ''} ${s.von}–${s.bis}`, ''); d.segs.splice(+a.dataset.i, 1); await saveDay(d); rerender(); break; }
    case 'ed-pz-add': { if (!(await needEdit())) return; const d = clone(dayOf(iso)); (d.pauses = d.pauses || []).push({ von: '12:00', bis: '12:30' }); logChange(d, 'Pause hinzugefügt', '', '12:00–12:30'); await saveDay(d); rerender(); break; }
    case 'ed-pz-del': { if (!(await needEdit())) return; const d = clone(dayOf(iso)), p = d.pauses[+a.dataset.i]; logChange(d, 'Pause gelöscht', `${p.von}–${p.bis}`, ''); d.pauses.splice(+a.dataset.i, 1); await saveDay(d); rerender(); break; }
    case 'ed-clear': { if (!(await needEdit())) return; if (!(await confirmDlg('Tag leeren?', `Alle Zeiten am ${deDate(iso)} werden entfernt.`, 'Leeren', true))) return; const d = clone(dayOf(iso)); logChange(d, 'Tag geleert', `${(d.segs || []).length} Zeiträume`, ''); d.segs = []; d.pauses = []; d.type = holiday(iso) ? 'feiertag' : 'work'; await saveDay(d); rerender(); break; }
    case 'gps': if (!canEdit()) { a.checked = S.gps; return; } S.gps = a.checked; saveSettings(); if (S.gps && navigator.geolocation) navigator.geolocation.getCurrentPosition(() => {}, () => toast('Standort ist nicht freigegeben.', 'warn')); break;
    case 'over6': if (!canEdit()) { a.checked = S.pauseOnlyOver6; return; } S.pauseOnlyOver6 = a.checked; saveSettings(); rerender(); break;
    case 'mode': S.design.mode = a.dataset.v; saveSettings(); applyTheme(); render(); break;
    case 'design-reset': S.design = clone(DEFAULTS.design); saveSettings(); applyTheme(); render(); break;
    case 'logo-reset': S.company.logo = 'logo.png'; saveSettings(); render(); break;
    case 'admin-on': { const pw = $('#pw-admin').value; if (await checkAdmin(pw)) { DEVICE.admin = true; await DB.put('kv', DEVICE, 'device'); toast('Dieses Gerät ist jetzt ein Admin-Gerät.'); render(); } else toast('Passwort falsch.', 'err'); break; }
    case 'admin-off': DEVICE.admin = false; await DB.put('kv', DEVICE, 'device'); UI.editUntil = 0; toast('Admin-Gerät beendet.'); render(); break;
    case 'pw-change': { const p1 = $('#pw-new1').value, p2 = $('#pw-new2').value; if (p1.length < 6) return toast('Mindestens 6 Zeichen.', 'warn'); if (p1 !== p2) return toast('Die Passwörter stimmen nicht überein.', 'warn'); await setAdminPassword(p1); toast('Admin-Passwort geändert.'); render(); break; }
    case 'backup': backup(); break;
  }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.vac) { UI['v' + el.dataset.vac[0].toUpperCase() + el.dataset.vac.slice(1)] = el.value; if (el.dataset.vac === 'von' && (!UI.vBis || UI.vBis < el.value)) UI.vBis = el.value; if (el.dataset.vac !== 'note') rerender(); return; }
  if (el.dataset.s) {
    const path = el.dataset.s.split('.'), last = path.pop(), obj = path.reduce((o, k) => o[k], S);
    obj[last] = el.type === 'number' || el.type === 'range' ? (el.value === '' ? '' : +el.value) : el.value; saveSettings();
    if (/^design\./.test(el.dataset.s)) { applyTheme(); if (el.type === 'color') el.nextElementSibling.textContent = el.value; if (el.type === 'range') el.closest('label').querySelector('.lbl').textContent = `Ecken-Rundung: ${el.value} px`; }
  }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset.note) { const d = clone(dayOf(el.dataset.note)); d.note = el.value; await saveDay(d); return; }
  if (el.dataset.ed) {
    const iso = el.dataset.ed, d = clone(dayOf(iso)), k = el.dataset.k;
    if (!canEdit()) { toast('Bitte zuerst freischalten.', 'warn'); return rerender(); }
    if (el.dataset.seg !== undefined) { const s = d.segs[+el.dataset.seg]; logChange(d, k === 'site' ? 'Baustelle' : k === 'von' ? 'Beginn' : 'Ende', s[k], el.value); s[k] = k === 'site' ? el.value.trim() : el.value; if (k === 'site') rememberSite(s.site); }
    if (el.dataset.pz !== undefined) { const p = d.pauses[+el.dataset.pz]; logChange(d, k === 'von' ? 'Pause von' : 'Pause bis', p[k], el.value); p[k] = el.value; }
    await saveDay(d); return rerender();
  }
  if (el.dataset.hour !== undefined) { if (!canEdit()) return rerender(); const h = S.hours[el.dataset.hour]; h[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value; if (h.on && !h.von) { h.von = '07:30'; h.bis = '16:30'; } saveSettings(); return rerender(); }
  if (el.dataset.bal !== undefined) { if (!canEdit()) return rerender(); const m = /^\s*([−-])?\s*(\d+)(?::(\d{1,2}))?\s*$/.exec(el.value); if (!m) { toast('Bitte als Std:Min eingeben, z. B. 12:30', 'warn'); return; } S.balance.min = (m[1] ? -1 : 1) * (+m[2] * 60 + (+m[3] || 0)); saveSettings(); return rerender(); }
  if (el.dataset.s && (el.tagName === 'SELECT' || ['minPause', 'vacation.perYear', 'vacation.carry', 'balance.from'].includes(el.dataset.s))) { if (LOCKED_TABS.includes(UI.tab) && !canEdit()) return rerender(); return rerender(); }
  if (el.matches('[data-logo]') && el.files && el.files[0]) { const im = await shrinkImage(el.files[0], 700, 0.92, 'image/png'); S.company.logo = im.data; saveSettings(); render(); toast('Logo gespeichert.'); return; }
  if (el.matches('[data-restore]') && el.files && el.files[0]) restore(el.files[0]);
});

/* ---------- Urlaub ---------- */
async function setVacation(silent) {
  const days = workDaysIn(UI.vVon || isoToday(), UI.vBis || UI.vVon || isoToday());
  if (!days.length) { toast('Im Zeitraum liegen keine Arbeitstage.', 'warn'); return false; }
  if (days.some(i => i < isoToday()) && !(await needEdit())) return false;
  for (const i of days) { const d = clone(dayOf(i)); if (hasData(d) && d.type === 'work' && (d.segs || []).length) continue; if (d.type !== 'urlaub') { logChange(d, 'Art des Tages', typeName(d.type), 'Urlaub'); if (i >= isoToday()) d.edited = false; d.type = 'urlaub'; if (UI.vNote) d.note = UI.vNote; await saveDay(d); } }
  if (!silent) { toast(`${days.length} Urlaubstag${days.length > 1 ? 'e' : ''} eingetragen.`); rerender(); }
  return true;
}
async function submitVacation() {
  if (!S.person.name) { toast('Bitte zuerst deinen Namen eintragen.', 'warn'); location.hash = '#/einstellungen/person'; return; }
  const von = UI.vVon || isoToday(), bis = UI.vBis || von, days = workDaysIn(von, bis);
  if (!days.length) return toast('Im Zeitraum liegen keine Arbeitstage.', 'warn');
  const before = vacation(+von.slice(0, 4));
  modal(`<div class="text-center py-6"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('file', 26)}</div><div class="font-semibold text-[18px] mt-4">Urlaubsantrag wird erstellt …</div></div>`);
  try {
    const left = before.left - days.filter(i => dayOf(i).type !== 'urlaub').length;
    const blob = await buildVacationPdf({ von, bis, n: days.length, note: UI.vNote || '', leftBefore: before.left, leftAfter: left, total: before.total });
    const name = `Urlaubsantrag_${deDate(von).replace(/\./g, '-')}_bis_${deDate(bis).replace(/\./g, '-')}_${S.person.name.replace(/[^\wäöüÄÖÜß-]+/g, '_')}.pdf`;
    saveBlob(blob, name);
    UI.requests = (UI.requests || []).concat({ von, bis, n: days.length, at: new Date().toISOString() }); await DB.put('kv', UI.requests, 'requests');
    await setVacation(true);
    shareModal(blob, name, `Hallo ${S.recipient.name || ''}, hiermit beantrage ich Urlaub vom ${deDate(von)} bis ${deDate(bis)} (${days.length} Arbeitstage). Viele Grüße, ${S.person.name}`, 'Urlaubsantrag gespeichert');
    render();
  } catch (err) { console.error(err); closeModal(); toast('PDF konnte nicht erstellt werden: ' + (err.message || err), 'err', 5000); }
}
function shareModal(blob, name, text, title) {
  const file = new File([blob], name, { type: 'application/pdf' }), canShare = navigator.canShare && navigator.canShare({ files: [file] });
  const phone = (S.recipient.phone || '').replace(/[^\d+]/g, '').replace(/^00/, '+').replace(/^0/, '+49').replace(/^\+/, '');
  modal(`<div class="text-center pt-2"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('check', 26, 2.4)}</div><div class="font-semibold text-[19px] mt-4">${esc(title)}</div><div class="text-[13px] text-ink3 mt-1 break-all">${esc(name)}</div></div>
    <div class="grid gap-2 mt-6">${canShare ? `<button class="btn-p !h-12" id="pdf-share">${ic('send', 17)}An ${esc(S.recipient.name || 'Büro')} senden (WhatsApp)</button><p class="hint text-center -mt-1">Im Teilen-Menü WhatsApp und dann ${esc(S.recipient.name || 'den Empfänger')} wählen.</p>` : `<a class="btn-p !h-12" href="https://wa.me/${phone}?text=${encodeURIComponent(text + ' (PDF folgt als Anhang)')}" target="_blank" rel="noopener">${ic('send', 17)}WhatsApp an ${esc(S.recipient.name || 'Büro')} öffnen</a><p class="hint text-center -mt-1">Dann das gespeicherte PDF im Chat anhängen.</p>`}
    <button class="btn-s" id="pdf-again">${ic('download', 17)}Nochmal speichern / öffnen</button><button class="btn-g" data-a="modal-close">Fertig</button></div>`);
  $('#pdf-again').onclick = () => saveBlob(blob, name);
  const b = $('#pdf-share'); if (b) b.onclick = async () => { try { await navigator.share({ files: [file], text, title: name }); closeModal(); } catch (err) { if (err && err.name !== 'AbortError') toast('Teilen nicht möglich – das PDF ist gespeichert.', 'warn'); } };
}

/* ---------- PDF speichern und senden ---------- */
function saveBlob(blob, name) { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
async function sendPdf(kind, iso) {
  if (!S.person.name) { toast('Bitte zuerst deinen Namen eintragen.', 'warn'); location.hash = '#/einstellungen/person'; return; }
  modal(`<div class="text-center py-6"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('file', 26)}</div><div class="font-semibold text-[18px] mt-4">Stundenzettel wird erstellt …</div></div>`);
  try {
    const isos = kind === 'week' ? weekOf(iso) : monthOf(iso), wk = isoWeek(isos[0]), mo = MONTHS[+isos[0].slice(5, 7) - 1];
    const label = kind === 'week' ? `KW ${wk.w}/${wk.y}` : `${mo} ${isos[0].slice(0, 4)}`;
    const blob = await buildPdf(isos, label), who = S.person.name.replace(/[^\wäöüÄÖÜß-]+/g, '_');
    const name = `Stundenzettel_${label.replace(/[\s/]+/g, '_')}_${who}.pdf`;
    saveBlob(blob, name);
    shareModal(blob, name, `Hallo ${S.recipient.name || ''}, anbei mein Stundenzettel ${label}. Viele Grüße, ${S.person.name}`, 'Stundenzettel gespeichert');
  } catch (err) { console.error(err); closeModal(); toast('PDF konnte nicht erstellt werden: ' + (err.message || err), 'err', 5000); }
}

/* ---------- Datensicherung ---------- */
function backup() {
  const data = { app: 'fruehauf-stempel', version: APP_VERSION, date: new Date().toISOString(), settings: S, days: Object.values(DAYS) };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' }); saveBlob(blob, `stempeluhr-sicherung-${isoToday()}.json`); toast('Sicherung gespeichert.');
}
async function restore(file) {
  if (!canEdit()) return toast('Einspielen nur mit Admin-Freischaltung.', 'warn');
  try {
    const d = JSON.parse(await file.text()); if (d.app !== 'fruehauf-stempel') throw new Error('Keine Sicherung der Stempeluhr');
    if (!(await confirmDlg('Sicherung einspielen?', `${(d.days || []).length} Tage werden übernommen bzw. überschrieben.`, 'Einspielen'))) return;
    S = deepMerge(clone(DEFAULTS), d.settings || {}); saveSettings();
    for (const x of d.days || []) await DB.put('days', x);
    DAYS = {}; ((await DB.all('days')) || []).forEach(x => { DAYS[x.iso] = x; }); applyTheme(); render(); toast('Sicherung eingespielt.');
  } catch (err) { toast('Sicherung konnte nicht gelesen werden: ' + err.message, 'err', 5000); }
}

/* ---------- App-PIN ---------- */
function pinCheck(msg = 'PIN eingeben') {
  return new Promise(res => {
    $('#modal').innerHTML = `<div class="fixed inset-0 z-[90] grid place-items-center p-6" style="background:var(--bg)"><div class="w-full max-w-xs text-center">${logoMark(44)}<div class="font-semibold text-[18px] mt-5">${esc(msg)}</div>
      <input class="inp mt-5 text-center !text-[24px] !h-14 tracking-[.4em]" id="pin-in" inputmode="numeric" maxlength="8" autocomplete="off" name="x-${Date.now()}" style="-webkit-text-security:disc"><button class="btn-p w-full mt-3" id="pin-ok">Öffnen</button>${msg !== 'PIN eingeben' ? '<button class="btn-g w-full mt-2" id="pin-cancel">Abbrechen</button>' : ''}</div></div>`;
    const go = async () => { const v = $('#pin-in').value; if (await pbkdf2(v, S.pin.salt, 60000) === S.pin.hash) { closeModal(); res(true); } else { toast('PIN falsch.', 'err'); $('#pin-in').value = ''; } };
    $('#pin-ok').onclick = go; $('#pin-in').onkeyup = e => { if (e.key === 'Enter' || $('#pin-in').value.length >= 4 && e.key !== 'Backspace') { if (e.key === 'Enter') go(); } };
    const c = $('#pin-cancel'); if (c) c.onclick = () => { closeModal(); res(false); };
    setTimeout(() => { const el = $('#pin-in'); if (el) el.focus(); }, 80);
  });
}
let HIDDEN_AT = 0;
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') HIDDEN_AT = Date.now(); else if (S.pin && HIDDEN_AT && Date.now() - HIDDEN_AT > 5 * 60000) pinCheck(); });

/* ---------- Uhr und Start ---------- */
setInterval(() => {
  const c = $('#clock'); if (c) c.textContent = nowHM();
  if (UI.route === 'home' && !document.activeElement.matches('input,textarea,select')) {
    const d = dayOf(isoToday()), x = calcDay(d), n = $('#live-netto'), p = $('#live-pause'), df = $('#live-diff');
    if (n) n.textContent = hm(x.netto + x.credit); if (p) p.textContent = hm(x.abzug); if (df) { df.textContent = overTxt(Math.max(0, x.diff)); df.className = `text-[22px] font-semibold mt-1 ${diffCls(x.diff)}`; }
  }
}, 15000);
setInterval(() => { const c = $('#clock'); if (c) c.textContent = nowHM(); }, 1000);
(async function init() {
  await DB.open(); await loadSettings();
  DEVICE = (await DB.get('kv', 'device')) || { admin: false }; UI.requests = (await DB.get('kv', 'requests')) || [];
  ((await DB.all('days')) || []).forEach(x => { DAYS[x.iso] = x; });
  try { FIRMA = await (await fetch('firma.json?t=' + Date.now(), { cache: 'no-store' })).json(); DB.put('kv', FIRMA, 'firma'); } catch (e) { FIRMA = (await DB.get('kv', 'firma')) || FIRMA; }
  applyTheme(); route();
  if (S.pin) pinCheck();
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.design.mode === 'system') { applyTheme(); render(); } }); } catch (e) {}
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && UI.route === 'home') rerender(); });
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
})();
