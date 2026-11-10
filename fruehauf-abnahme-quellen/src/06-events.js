
/* =========================================================
   Ereignisse
   ========================================================= */
function gewerkDialog() {
  modal(`<h3 class="text-[20px] font-semibold pr-8">Neues Protokoll</h3><p class="text-ink3 text-[14px] mt-1">Welches Gewerk?</p>
    <div class="grid gap-2 mt-5">${Object.entries(GEWERKE).map(([k, g]) => `<button class="opt !min-h-[64px]" data-a="pick" data-g="${k}"><span class="w-10 h-10 rounded-[var(--rb)] grid place-items-center shrink-0" style="background:${rgba(g.color, 0.14)};color:${g.color}">${ic(g.icon, 20)}</span><span><span class="block font-semibold">${g.name}</span><span class="block text-[12px] text-ink3 font-normal">${g.desc}</span></span></button>`).join('')}</div>`);
}
async function askReplaceDraft() { return !CUR || (await confirmDlg('Offenen Entwurf verwerfen?', `Das angefangene Protokoll ${CUR.nr} (${CUR.answers.kunde || 'ohne Kunde'}) wird verworfen.`, 'Verwerfen', true)); }
function guessOrt() { const m = /\d{5}\s+([^,]+)$/.exec((CUR.answers.adresse || '').trim()); return m ? m[1].trim() : ''; }

function validateScreen() {
  const sc = screens(CUR), [kind, , step] = sc[UI.step];
  if (kind === 'step') {
    const bad = stepIssues(CUR, step);
    if (bad.length) { UI.bad = bad; render(); const el = $(`[data-f="${bad[0]}"]`) || $('.inp-req,.ring-4'); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); toast('Bitte die markierten Pflichtfelder ausfüllen.', 'warn'); return false; }
    const msg = step.block && step.block(CUR.answers); if (msg) { toast(msg, 'warn', 4500); return false; }
  }
  if (kind === 'sig_monteur' && !CUR.sig.monteur.data) { toast('Bitte als Monteur unterschreiben.', 'warn'); return false; }
  if (kind === 'sig_kunde' && !CUR.sig.kunde.absent && !CUR.sig.kunde.data) { toast('Bitte den Kunden unterschreiben lassen – oder „Kunde nicht anwesend“ anhaken.', 'warn', 4500); return false; }
  return true;
}
function firstIncomplete() {
  const sc = screens(CUR);
  for (let i = 0; i < sc.length; i++) {
    const [k, , s] = sc[i];
    if (k === 'step' && (stepIssues(CUR, s).length || (s.block && s.block(CUR.answers)))) return i;
    if (k === 'sig_monteur' && !CUR.sig.monteur.data) return i;
    if (k === 'sig_kunde' && !CUR.sig.kunde.absent && !CUR.sig.kunde.data) return i;
  }
  return -1;
}
async function finish() {
  const i = firstIncomplete(); if (i >= 0) { UI.maxStep = Math.max(UI.maxStep, i); setStep(i); validateScreen(); return; }
  const rec = clone(CUR); delete rec.step; delete rec.maxStep; rec.updated = Date.now(); rec.done = rec.done || Date.now();
  await DB.put('prot', rec); PROTS = PROTS.filter(p => p.id !== rec.id).concat(rec);
  CUR = null; await saveDraft(true);
  go('#/p/' + rec.id); toast('Protokoll gespeichert.');
  pdfFlow(rec);
}

/* ---------- Material-/Fittingeliste ----------
   Hinzufügen reagiert schon beim Berühren (bevor die Tastatur schließt und die Seite springt),
   per Enter auf der Tastatur und beim „Weiter“ (noch nicht übernommene Eingabe). */
let ITEM_PD = 0;
function addItem(f, quiet) {
  const ni = $('#it-n-' + f), qi = $('#it-q-' + f), ui = $('#it-u-' + f); if (!ni || !CUR) return false;
  const n = ni.value.trim(); if (!n) { if (!quiet) toast('Bitte zuerst eine Bezeichnung eintragen.', 'warn'); return false; }
  const l = CUR.answers[f] || []; l.push({ n, q: (qi && qi.value.trim().replace('.', ',')) || '1', u: ui ? ui.value : 'Stk' }); CUR.answers[f] = l;
  UI.bad = (UI.bad || []).filter(x => x !== f); saveDraft();
  const box = $('#it-list-' + f); if (box) box.innerHTML = itemRows(f, l);
  ni.value = ''; ni.classList.remove('inp-req'); if (qi) qi.value = '1';
  if (!quiet) toast(`„${n}“ hinzugefügt.`);
  return true;
}
function flushItems() { $$('#app input[id^="it-n-"]').forEach(el => { if (el.value.trim()) addItem(el.id.slice(5), true); }); }
document.addEventListener('pointerdown', e => {
  const a = e.target.closest && e.target.closest('[data-a="item-add"]'); if (!a) return;
  e.preventDefault(); ITEM_PD = Date.now(); addItem(a.dataset.f);
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target.id || !/^it-[nq]-/.test(e.target.id)) return;
  e.preventDefault(); const f = e.target.id.slice(5); if (addItem(f)) { const ni = $('#it-n-' + f); if (ni) ni.focus(); }
});

document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a]'); if (!a) return;
  const act = a.dataset.a, f = a.dataset.f;
  switch (act) {
    case 'new': if (UI.route === 'wizard' && !(await askReplaceDraft())) return; gewerkDialog(); break;
    case 'pick': pickDialog(a.dataset.g); break;
    case 'start': { closeModal(); if (CUR && !(await askReplaceDraft())) return; startRecord(newRecord(a.dataset.t, a.dataset.g)); break; }
    case 'resume': go('#/protokoll'); break;
    case 'discard': if (await confirmDlg('Entwurf verwerfen?', 'Alle Eingaben dieses Protokolls gehen verloren.', 'Verwerfen', true)) { CUR = null; await saveDraft(true); render(); } break;
    case 'home': go('#/'); break;
    case 'back': if (UI.step === 0) go('#/'); else setStep(UI.step - 1); break;
    case 'next': flushItems(); if (validateScreen()) setStep(UI.step + 1); break;
    case 'jump': if (+a.dataset.i <= UI.maxStep) setStep(+a.dataset.i); break;
    case 'goto': setStep(+a.dataset.i); break;
    case 'goto-x': setStep(screens(CUR).findIndex(s => s[0] === a.dataset.k)); break;
    case 'finish': flushItems(); finish(); break;
    case 'opt': CUR.answers[f] = a.dataset.v; UI.bad = (UI.bad || []).filter(x => x !== f); saveDraft(); { const y = window.scrollY; render(); window.scrollTo(0, y); } break;
    case 'chip': { const el = $(`textarea[data-f="${f}"]`), cur = (el ? el.value : CUR.answers[f] || '').trim(), v = a.dataset.v; if (cur.split('\n').includes(v)) return; const nv = cur ? cur + '\n' + v : v; CUR.answers[f] = nv; if (el) { el.value = nv; el.classList.remove('inp-req'); } saveDraft(); break; }
    case 'day-add': { const d = $('#day-' + f).value; if (!d) return; const l = CUR.answers[f] || []; if (!l.includes(d)) l.push(d); l.sort(); CUR.answers[f] = l; UI.bad = (UI.bad || []).filter(x => x !== f); saveDraft(); render(); break; }
    case 'day-del': CUR.answers[f].splice(+a.dataset.i, 1); saveDraft(); render(); break;
    case 'item-add': if (Date.now() - ITEM_PD < 900) return; addItem(f); break;
    case 'hk-raum': { const el = $('#hk-raum'); if (el) el.value = a.dataset.v; $$('[data-a="hk-raum"]').forEach(b => b.classList.toggle('!border-p', b === a)); break; }
    case 'hk-add': { const raum = $('#hk-raum').value.trim(); if (!raum) { toast('Bitte zuerst den Raum wählen.', 'warn'); return; } const l = CUR.answers[f] || []; l.push({ raum, typ: $('#hk-typ').value, h: $('#hk-h').value, l: $('#hk-l').value }); UI.hkLast = { 'hk-typ': $('#hk-typ').value, 'hk-h': $('#hk-h').value, 'hk-l': $('#hk-l').value }; CUR.answers[f] = l; UI.bad = (UI.bad || []).filter(x => x !== f); saveDraft(); { const y = window.scrollY; render(); window.scrollTo(0, y); } toast(`${raum} hinzugefügt.`); break; }
    case 'hk-del': CUR.answers[f].splice(+a.dataset.i, 1); saveDraft(); render(); break;
    case 'item-del': { CUR.answers[f].splice(+a.dataset.i, 1); saveDraft(); const box = $('#it-list-' + f); if (box) box.innerHTML = itemRows(f, CUR.answers[f]); else render(); break; }
    case 'ein-add': { const l = CUR.answers.einsaetze || (CUR.answers.einsaetze = []); const last = l[l.length - 1]; l.push({ id: uid('e'), datum: last ? last.datum : isoToday(), von: '', bis: '', pause: '' }); saveDraft(); render(); break; }
    case 'ein-del': CUR.answers.einsaetze.splice(+a.dataset.i, 1); saveDraft(); render(); break;
    case 'photo-del': CUR.photos.splice(+a.dataset.i, 1); saveDraft(); render(); break;
    case 'sig-clear': CUR.sig[a.dataset.w].data = ''; saveDraft(); render(); break;
    case 'absent': CUR.sig.kunde.absent = a.checked; saveDraft(); render(); break;
    case 'view': go('#/p/' + a.dataset.id); break;
    case 'pdf': { const p = PROTS.find(x => x.id === a.dataset.id); if (p) pdfFlow(p); break; }
    case 'edit': { const p = PROTS.find(x => x.id === a.dataset.id); if (!p || !(await askReplaceDraft())) return; const r = clone(p); r.step = screens(r).length - 1; r.maxStep = r.step; startRecord(r); break; }
    case 'del': { const p = PROTS.find(x => x.id === a.dataset.id); if (!p || !(await confirmDlg('Protokoll löschen?', `${p.nr} – ${p.answers.kunde || ''} wird endgültig gelöscht.`, 'Löschen', true))) return; await DB.del('prot', p.id); PROTS = PROTS.filter(x => x.id !== p.id); go('#/protokolle'); toast('Gelöscht.'); break; }
    case 'filter': UI[a.dataset.k] = a.dataset.v; render(); break;
    case 'mode': S.design.mode = a.dataset.v; saveSettings(); applyTheme(); render(); break;
    case 'logo-reset': S.company.logo = 'logo.png'; saveSettings(); render(); break;
    case 'logo-none': S.company.logo = ''; saveSettings(); render(); break;
    case 'design-reset': S.design = clone(DEFAULTS.design); saveSettings(); applyTheme(); render(); break;
    case 'mont-add': { const v = $('#mont-new').value.trim(); if (!v) return; if (!S.monteure.some(m => m.name === v)) S.monteure.push({ name: v, gw: [] }); saveSettings(); render(); break; }
    case 'mont-gw': { const m = S.monteure[+a.dataset.i], g = a.dataset.g; m.gw = m.gw.includes(g) ? m.gw.filter(x => x !== g) : m.gw.concat(g); saveSettings(); render(); break; }
    case 'mont-pick': { const el = $(`input[data-f="${f}"]`), l = (el ? el.value : CUR.answers[f] || '').split(',').map(x => x.trim()).filter(Boolean), v = a.dataset.v; const nl = l.includes(v) ? l.filter(x => x !== v) : l.concat(v); CUR.answers[f] = nl.join(', '); UI.bad = (UI.bad || []).filter(x => x !== f); saveDraft(); { const y = window.scrollY; render(); window.scrollTo(0, y); } break; }
    case 'wp-add': S.wps.push({ id: uid('w'), name: 'Neuer Hersteller', models: [], multi: true, unit: 'Wärmepumpen (Kaskade)' }); saveSettings(); render(); break;
    case 'wp-del': { const x = S.wps[+a.dataset.i]; if (await confirmDlg('Hersteller löschen?', `„${x.name}“ wird aus der Auswahl entfernt.`, 'Löschen', true)) { S.wps.splice(+a.dataset.i, 1); saveSettings(); render(); } break; }
    case 'wp-reset': if (await confirmDlg('Wärmepumpen zurücksetzen?', 'Wolf, Buderus und Samsung mit den Standardmodellen – eigene Änderungen gehen verloren.', 'Zurücksetzen')) { S.wps = clone(DEFAULTS.wps); saveSettings(); render(); } break;
    case 'sys-add': S.systems.push({ id: uid('s'), name: 'Neues System', wr: [], sp: [], multi: false, unit: 'Geräte' }); saveSettings(); render(); break;
    case 'sys-del': { const x = S.systems[+a.dataset.i]; if (await confirmDlg('System löschen?', `„${x.name}“ wird aus der Auswahl entfernt.`, 'Löschen', true)) { S.systems.splice(+a.dataset.i, 1); saveSettings(); render(); } break; }
    case 'sys-reset': if (await confirmDlg('Systeme zurücksetzen?', 'EcoFlow, Tesla und E3/DC mit den Standardgrößen – eigene Änderungen gehen verloren.', 'Zurücksetzen')) { S.systems = clone(DEFAULTS.systems); saveSettings(); render(); } break;
    case 'mont-del': S.monteure.splice(+a.dataset.i, 1); saveSettings(); render(); break;
    case 'lists-reset': if (await confirmDlg('Listen zurücksetzen?', 'Alle Auswahllisten werden auf den Standard gesetzt.', 'Zurücksetzen')) { S.lists = clone(DEFAULTS.lists); saveSettings(); render(); } break;
    case 'backup': backup(); break;
  }
});

/* Eingaben ohne Neuaufbau (Tastatur bleibt offen) */
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.f && CUR && el.tagName !== 'BUTTON') { CUR.answers[el.dataset.f] = el.value; el.classList.remove('inp-req'); saveDraft(); return; }
  if (el.dataset.e !== undefined && CUR) {
    const i = +el.dataset.e, row = CUR.answers.einsaetze[i]; row[el.dataset.k] = el.value; saveDraft();
    const inf = $('#ein-info-' + i); if (inf) inf.innerHTML = einInfo(row, zuschlag(row.datum, CUR.answers.notdienst === 'ja'));
    const t = $('#ein-total'); if (t) t.textContent = hrs(serviceHours(CUR)); return;
  }
  if (el.dataset.sig && CUR) { CUR.sig[el.dataset.sig][el.dataset.k] = el.value; saveDraft(); return; }
  if (el.dataset.s) {
    const path = el.dataset.s.split('.'), last = path.pop(), obj = path.reduce((o, k) => o[k], S);
    obj[last] = el.type === 'number' || el.type === 'range' ? (el.value === '' ? '' : +el.value) : el.value; saveSettings();
    if (/^design\./.test(el.dataset.s)) applyTheme();
    if (el.type === 'range' || el.type === 'color') { const lab = el.closest('label'); if (lab && el.type === 'range') lab.querySelector('.lbl').textContent = `Ecken-Rundung: ${el.value} px`; if (el.type === 'color') el.nextElementSibling.textContent = el.value; }
    return;
  }
  if (el.dataset.wp !== undefined) { const x = S.wps[+el.dataset.wp], k = el.dataset.k; x[k] = k === 'multi' ? el.checked : k === 'models' ? el.value.split('\n').map(v => v.trim()).filter(Boolean) : el.value; saveSettings(); return; }
  if (el.dataset.sys !== undefined) { const x = S.systems[+el.dataset.sys], k = el.dataset.k; x[k] = k === 'multi' ? el.checked : k === 'wr' || k === 'sp' ? el.value.split('\n').map(v => v.trim()).filter(Boolean) : el.value; saveSettings(); return; }
  if (el.dataset.list) { S.lists[el.dataset.list] = el.value.split('\n').map(x => x.trim()).filter(Boolean); saveSettings(); return; }
  if (el.id === 'q') { UI.q = el.value; const box = $('#plist'); if (box) { const tmp = document.createElement('div'); tmp.innerHTML = viewList(); box.innerHTML = $('#plist', tmp).innerHTML; } }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset.s && (el.tagName === 'SELECT' || el.dataset.s.startsWith('zuschlag') || el.dataset.s === 'state')) { applyTheme(); render(); return; }
  if (el.matches('[data-photo]') && el.files && el.files.length && CUR) {
    toast('Fotos werden vorbereitet …');
    for (const file of el.files) { try { CUR.photos.push(await shrinkImage(file, 1600, 0.8)); } catch (err) { toast('Ein Foto konnte nicht gelesen werden.', 'err'); } }
    saveDraft(); render(); return;
  }
  if (el.matches('[data-logo]') && el.files && el.files[0]) { const im = await shrinkImage(el.files[0], 700, 0.92, 'image/png'); S.company.logo = im.data; saveSettings(); render(); toast('Logo gespeichert.'); return; }
  if (el.matches('[data-restore]') && el.files && el.files[0]) restore(el.files[0]);
});

/* ---------- Unterschrift ---------- */
function initSig() {
  const cv = $('#sig-cv'); if (!cv || !CUR) return;
  const who = cv.dataset.w, s = CUR.sig[who];
  if (!s.ort) { s.ort = guessOrt(); const o = $(`[data-sig="${who}"][data-k="ort"]`); if (o && s.ort) o.value = s.ort; }
  const r = cv.getBoundingClientRect(), dpr = Math.max(2, devicePixelRatio || 1);
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  const x = cv.getContext('2d'); x.scale(dpr, dpr); x.lineWidth = 2.6; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#13233A';
  if (s.data) { const im = new Image(); im.onload = () => x.drawImage(im, 0, 0, r.width, r.height); im.src = s.data; }
  let down = false, last = null, drawn = false;
  const pos = ev => { const b = cv.getBoundingClientRect(); return [ev.clientX - b.left, ev.clientY - b.top]; };
  cv.onpointerdown = ev => { cv.setPointerCapture(ev.pointerId); down = true; last = pos(ev); const ph = $('#sig-ph'); if (ph) ph.remove(); };
  cv.onpointermove = ev => { if (!down) return; const q = pos(ev); x.beginPath(); x.moveTo(...last); x.lineTo(...q); x.stroke(); last = q; drawn = true; };
  cv.onpointerup = cv.onpointercancel = () => { if (!down) return; down = false; if (drawn) { s.data = cv.toDataURL('image/png'); saveDraft(); } };
}

/* ---------- PDF anzeigen / teilen ---------- */
function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
/* PDF erstellen und sofort speichern; danach zusätzlich Teilen anbieten */
async function pdfFlow(rec) {
  modal(`<div class="text-center py-6"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('file', 26)}</div><div class="font-semibold text-[18px] mt-4">PDF wird erstellt …</div></div>`);
  try {
    const blob = await buildPdf(rec), name = `${rec.nr}_${(rec.answers.kunde || 'Kunde').replace(/[^\wäöüÄÖÜß-]+/g, '_')}.pdf`;
    saveBlob(blob, name);
    const file = new File([blob], name, { type: 'application/pdf' }), canShare = navigator.canShare && navigator.canShare({ files: [file] });
    modal(`<div class="text-center pt-2"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('check', 26, 2.4)}</div><div class="font-semibold text-[19px] mt-4">PDF gespeichert</div><div class="text-[13px] text-ink3 mt-1 break-all">${esc(name)}</div><p class="text-[13px] text-ink3 mt-2">Zu finden unter „Downloads“ bzw. in der Dateien-App.</p></div>
      <div class="grid gap-2 mt-6">${canShare ? `<button class="btn-p" id="pdf-share">${ic('share', 17)}Zusätzlich teilen (Mail, WhatsApp …)</button>` : ''}<button class="${canShare ? 'btn-s' : 'btn-p'}" id="pdf-again">${ic('download', 17)}Nochmal speichern / öffnen</button><button class="btn-g" data-a="modal-close">Fertig</button></div>`);
    $('#pdf-again').onclick = () => saveBlob(blob, name);
    const b = $('#pdf-share'); if (b) b.onclick = async () => { try { await navigator.share({ files: [file], title: name }); closeModal(); } catch (err) { if (err && err.name !== 'AbortError') toast('Teilen nicht möglich – das PDF ist bereits gespeichert.', 'warn'); } };
  } catch (err) { console.error(err); closeModal(); toast('PDF konnte nicht erstellt werden: ' + (err.message || err), 'err', 5000); }
}

/* ---------- Datensicherung ---------- */
function backup() {
  const data = { app: 'fruehauf-abnahme', version: APP_VERSION, date: new Date().toISOString(), settings: S, protocols: PROTS, draft: CUR };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `abnahme-sicherung-${isoToday()}.json`; document.body.appendChild(a); a.click(); a.remove();
  toast('Sicherung gespeichert.');
}
async function restore(file) {
  try {
    const d = JSON.parse(await file.text()); if (d.app !== 'fruehauf-abnahme') throw new Error('Keine Sicherung dieser App');
    if (!(await confirmDlg('Sicherung einspielen?', `${(d.protocols || []).length} Protokolle werden ergänzt bzw. aktualisiert, Einstellungen übernommen.`, 'Einspielen'))) return;
    S = deepMerge(clone(DEFAULTS), d.settings || {}); fixSettings(); saveSettings();
    for (const p of d.protocols || []) await DB.put('prot', p);
    PROTS = (await DB.all('prot')) || []; applyTheme(); render(); toast('Sicherung eingespielt.');
  } catch (err) { toast('Sicherung konnte nicht gelesen werden: ' + err.message, 'err', 5000); }
}

/* ---------- Start ---------- */
(async function init() {
  await DB.open(); await loadSettings();
  CUR = (await DB.get('kv', 'draft')) || null; if (CUR) { UI.step = CUR.step || 0; UI.maxStep = CUR.maxStep || 0; }
  PROTS = (await DB.all('prot')) || [];
  applyTheme(); route();
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.design.mode === 'system') { applyTheme(); render(); } }); } catch (e) {}
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
})();
