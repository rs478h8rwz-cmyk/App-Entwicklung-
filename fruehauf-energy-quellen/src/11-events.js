
/* =========================================================
   Router & Rendern
   ========================================================= */
function go(path) { if (location.hash === '#/' + path) route(); else location.hash = '#/' + path; }
async function route() {
  const [a, b, c] = location.hash.replace(/^#\/?/, '').split('/');
  const prev = UI.route + UI.pid + UI.settingsTab;
  if (a === 'projekt' && b && findProject(b)) {
    const p = findProject(b);
    UI.route = 'projekt'; if (UI.pid !== b) UI.resultTab = 'overview'; UI.pid = b; UI.step = clamp(+c || p.step || 1, 1, 4); p.step = UI.step;
    await loadFiles(p.docs.flatMap(d => d.pages).concat(p.components.map(x => (PRODUCTS.find(y => y.id === x.id) || {}).img), p.sign ? [p.sign.cust, p.sign.adv] : []));
  } else if (a === 'produkte') { UI.route = 'produkte'; await loadFiles(PRODUCTS.map(x => x.img)); }
  else if (a === 'einstellungen') { UI.route = 'einstellungen'; UI.settingsTab = STABS.find(t => t[0] === b) ? b : 'ansicht'; }
  else UI.route = 'kunden';
  render(true);
  if (prev !== UI.route + UI.pid + UI.settingsTab || a === 'projekt') window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
function render(nav) {
  const ae = document.activeElement, key = ae && ae.dataset ? ae.dataset.b : null;
  let ss = null; try { ss = ae && ae.selectionStart; } catch (e) {}
  const y = window.scrollY;
  const inner = UI.route === 'projekt' ? viewProject() : UI.route === 'produkte' ? viewProducts() : UI.route === 'einstellungen' ? viewSettings() : viewKunden();
  $('#app').innerHTML = shell(inner);
  if (!nav) window.scrollTo(0, y);
  if (key) { const el = $(`#app [data-b="${key.replace(/"/g, '\\"')}"]`); if (el && el.type !== 'range') { el.focus({ preventScroll: true }); if (ss !== null && ss !== undefined) try { el.setSelectionRange(ss, ss); } catch (e) {} } }
  fitPreview();
  if ($('canvas[data-pad]')) initPads();
}
const renderSoon = () => setTimeout(render, 0);

/* =========================================================
   Ereignisse
   ========================================================= */
function readVal(el) {
  const t = el.dataset.t;
  if (el.type === 'checkbox') return el.checked;
  if (t === 'n') { const v = pnum(el.value); return isFinite(v) ? v : null; }
  if (t === 'y') { const v = parseInt(String(el.value).replace(/\D/g, ''), 10); return isFinite(v) ? v : null; }
  if (t === 'r') return parseFloat(el.value);
  if (t === 'hex') { let v = el.value.trim(); if (!v.startsWith('#')) v = '#' + v; return /^#[0-9a-f]{6}$/i.test(v) ? v : undefined; }
  return el.value;
}
const _scopeOf = scopeOf;
scopeOf = function (b) { if (b.startsWith('u:')) return { obj: UI, path: b.slice(2), kind: 'u' }; return _scopeOf(b); };
const _bset = bset;
bset = function (b, v) { if (b.startsWith('u:')) { setPath(UI, b.slice(2), v); return; } _bset(b, v); };

document.addEventListener('input', e => {
  const el = e.target;
  if (el.hasAttribute('data-daymonth')) { const p = curProject(), m = +el.value; p.docOpts.dayMonth = m; saveProject(p); const R = compute(p), d = dayChartHtml(p, R); $('#day-month').textContent = MONTH_NAMES[m - 1]; $('#day-chart').innerHTML = d.svg; $('#day-info').textContent = d.info; return; }
  if (el.dataset.b) {
    const v = readVal(el); if (v === undefined) return;
    const b = el.dataset.b;
    if (b.startsWith('p:') && curProject()) delete curProject().from[b.slice(2)];
    bset(b, v);
    if (b === 'u:search') { const l = $('#cust-list'); render(); return; }
    if (b.startsWith('s:design.') && !b.startsWith('s:design.cover')) applyTheme();
    if (el.type === 'range') { const lab = $(`[data-rv="${b}"]`); if (lab) lab.textContent = num(v) + (lab.textContent.match(/\s?\D+$/) || [''])[0]; const cp = $('#cover-prev'); if (cp) cp.innerHTML = coverPreview(); }
    if (b.startsWith('p:')) updateLive();
    if (b.startsWith('s:prices.')) { const pc = $('#price-chart'); if (pc) pc.innerHTML = priceChart(UI.priceKey || 'strom'); }
    return;
  }
  if (el.hasAttribute('data-compqty')) { const p = curProject(), c = p.components.find(x => x.id === el.dataset.compqty); if (c) { c.qty = Math.max(1, parseInt(el.value, 10) || 1); applyComponents(p); saveProject(p); updateLive(); } return; }
  if (el.hasAttribute('data-recqty')) { const p = curProject(), m = (p.rec[el.dataset.doc].products || []).find(x => x.id === el.dataset.id); if (m) { m.qty = Math.max(1, parseInt(el.value, 10) || 1); saveProject(p); } }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset.b) {
    const v = readVal(el); if (v !== undefined) bset(el.dataset.b, v);
    if (el.type === 'range' || el.dataset.b === 'u:search') return;
    if (el.closest('#modal')) { const b = el.dataset.b; if (b.startsWith('x:') && /:(cat|imgUrl)$/.test(b)) productModal(b.split(':')[1]); }
    if (el.dataset.b.startsWith('s:design.')) applyTheme();
    renderSoon(); return;
  }
  if (el.hasAttribute('data-import-config')) { const f = el.files[0]; el.value = ''; if (f) importConfig(f); return; }
  if (el.hasAttribute('data-status-set')) { const p = curProject(); p.status = el.value; p.statusDate = isoToday(); saveProject(p); toast('Status: ' + STATUS[el.value][0]); render(); return; }
  if (el.dataset.roof !== undefined) { const p = curProject(), rs = p.pv.roofs = roofsOf(p).map(r => ({ ...r })), r = rs[+el.dataset.roof], k = el.dataset.k; r[k] = k === 'az' ? +el.value : k === 'kwp' ? (isFinite(pnum(el.value)) ? pnum(el.value) : null) : clamp(parseInt(el.value, 10) || 0, 0, 90); saveProject(p); renderSoon(); return; }
  if (el.dataset.var) { const p = curProject(), v = (p.variants || []).find(x => x.id === el.dataset.var); if (v) { v[el.dataset.k] = el.dataset.t === 'n' ? (isFinite(pnum(el.value)) ? pnum(el.value) : null) : el.value; saveProject(p); renderSoon(); } return; }
  if (el.dataset.varRod) { const p = curProject(), v = (p.variants || []).find(x => x.id === el.dataset.varRod); if (v) { v.rod = el.checked; saveProject(p); renderSoon(); } return; }
  if (el.dataset.tgcheck) { bset(el.dataset.tgcheck, el.checked); renderSoon(); return; }
  if (el.hasAttribute('data-advisor-pick')) { const p = curProject(), v = el.value; if (v === '__other') { p.offer.advisorId = ''; p.offer.advisor = ''; } else { const a = (S.company.advisors || []).find(x => x.id === v); p.offer.advisorId = a ? a.id : ''; p.offer.advisor = a ? a.name : ''; } delete p.from['offer.advisor']; saveProject(p); renderSoon(); return; }
  if (el.dataset.upload) { const p = curProject(); const fs = [...el.files]; el.value = ''; if (p && fs.length) handleUpload(p, el.dataset.upload, fs); return; }
  if (el.dataset.replace) { const p = curProject(); const fs = [...el.files]; el.value = ''; if (p && fs.length) handleUpload(p, el.dataset.role, fs.slice(0, 1), el.dataset.replace); return; }
  if (el.dataset.imgup) { const f = el.files[0]; el.value = ''; if (f) await handleImage(el.dataset.imgup, f, el.dataset.id); return; }
  if (el.hasAttribute('data-import')) { const f = el.files[0]; el.value = ''; if (f) importBackup(f); return; }
  if (el.hasAttribute('data-compqty') || el.hasAttribute('data-recqty')) renderSoon();
});
function focusSearch() { if (UI.route !== 'kunden') go('kunden'); setTimeout(() => { const el = $('[data-b="u:search"]'); if (el) { el.focus(); el.scrollIntoView({ block: 'center' }); } }, 80); }
document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); focusSearch(); } });
document.addEventListener('submit', e => { if (e.target.matches('[data-admin-form]')) { e.preventDefault(); tryUnlock(); } });
document.addEventListener('toggle', e => { const d = e.target; if (d.dataset && d.dataset.det) UI.open[d.dataset.det] = d.open; }, true);
document.addEventListener('dragover', e => { const z = e.target.closest && e.target.closest('[data-drop]'); if (z) { e.preventDefault(); z.classList.add('!border-p', '!bg-p/5'); } });
document.addEventListener('dragleave', e => { const z = e.target.closest && e.target.closest('[data-drop]'); if (z) z.classList.remove('!border-p', '!bg-p/5'); });
document.addEventListener('drop', e => { const z = e.target.closest && e.target.closest('[data-drop]'); if (!z) return; e.preventDefault(); const p = curProject(); if (p && e.dataTransfer.files.length) handleUpload(p, z.dataset.drop, [...e.dataTransfer.files]); });

async function resizeImage(file, maxPx, type = 'image/png') {
  const cv = await imageToCanvas(file, maxPx);
  if (type === 'image/png') { const ctx = cv.getContext('2d'); }
  return new Promise(r => cv.toBlob(r, type, 0.88));
}
async function imageKeepAlpha(file, maxPx) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const sc = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * sc); cv.height = Math.round(img.naturalHeight * sc);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    return await new Promise(r => cv.toBlob(r, 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}
async function handleImage(kind, file, id) {
  try {
    if (kind === 'cover') {
      let blob;
      if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) { toast('PDF wird gelesen …', 'info'); const r = await readPdf(file, 1); blob = r.images[0]; r.canvases.forEach(c => { c.width = c.height = 0; }); }
      else blob = await resizeImage(file, 2400, 'image/jpeg');
      if (S.design.cover.file) await delFiles([S.design.cover.file]);
      S.design.cover.file = await putFile(blob, file.name); S.design.cover.use = true; S.design.coverStyle = 'image';
      await updateCoverPalette();
    } else if (kind === 'logo') {
      const blob = await imageKeepAlpha(file, 900); if (S.company.logoFile) await delFiles([S.company.logoFile]); S.company.logoFile = await putFile(blob, file.name);
    } else if (kind === 'coverlogo') {
      const blob = await imageKeepAlpha(file, 900); if (S.design.coverLogo.file) await delFiles([S.design.coverLogo.file]); S.design.coverLogo.file = await putFile(blob, file.name);
    } else if (kind === 'me') {
      const blob = await resizeImage(file, 500, 'image/jpeg'); if (PERSONAL.profile.photo) await delFiles([PERSONAL.profile.photo]); PERSONAL.profile.photo = await putFile(blob, file.name); savePersonal(); render(); toast('Foto gespeichert.'); return;
    } else if (kind === 'mark') {
      const blob = await imageKeepAlpha(file, 400); if (S.design.mark.file) await delFiles([S.design.mark.file]); S.design.mark.file = await putFile(blob, file.name); S.design.mark.style = 'image';
    } else if (kind === 'advisor') {
      const a = S.company.advisors.find(x => x.id === id); const blob = await resizeImage(file, 500, 'image/jpeg'); if (a.photo) await delFiles([a.photo]); a.photo = await putFile(blob, file.name);
    } else if (kind === 'product') {
      const pr = PRODUCTS.find(x => x.id === id); const blob = await imageKeepAlpha(file, 700); if (pr.img) await delFiles([pr.img]); pr.img = await putFile(blob, file.name); saveProducts(); productModal(id);
    }
    saveSettings(); render(); toast('Bild gespeichert.');
  } catch (e) { console.error(e); toast('Bild konnte nicht gelesen werden.', 'err'); }
}

document.addEventListener('click', async e => {
  const tg = e.target.closest('[data-tg]');
  if (tg) { const b = tg.dataset.tg; bset(b, !bval(b)); if (b.startsWith('p:')) updateLive(); if (tg.closest('#modal')) { tg.classList.toggle('on'); render(); return; } render(); return; }
  const sg = e.target.closest('[data-seg]');
  if (sg) { bset(sg.dataset.seg, JSON.parse(sg.dataset.v)); if (sg.dataset.seg.startsWith('s:design.')) applyTheme(); render(); return; }
  const a = e.target.closest('[data-a]'); if (!a) return;
  const act = a.dataset.a, p = curProject();
  if (a.tagName === 'A' && act !== 'modal-close') return;
  if (a.type !== 'checkbox') e.preventDefault();
  switch (act) {
    case 'modal-close': closeModal(); if (UI.route === 'produkte') render(); break;
    case 'new': newDialog(); break;
    case 'create': { const np = newProject(a.dataset.type); PROJECTS.push(np); await DB.put('projects', clone(np)); closeModal(); go(`projekt/${np.id}/1`); break; }
    case 'won': { e.stopPropagation(); const p = findProject(a.dataset.id); if (!p) break; p.step = 4; go(`projekt/${p.id}/4`); let n = 0; const t = setInterval(() => { const el = $('#sign-card'); if (el || ++n > 40) { clearInterval(t); if (el) { el.scrollIntoView({ block: 'start', behavior: 'smooth' }); el.classList.add('ring-2', 'ring-p'); setTimeout(() => el.classList.remove('ring-2', 'ring-p'), 2500); } } }, 100); break; }
    case 'back': go('kunden'); break;
    case 'restore-del': restoreDeleted(); break;
    case 'archive': { e.stopPropagation(); const d = findProject(a.dataset.id); if (!d || !(await confirmDlg('Kunden archivieren?', `„${d.customer.name || 'Neue Berechnung'}“ wird ins Archiv verschoben. Sie finden ihn dort unter dem Filter „Archiv“ und können ihn jederzeit wiederherstellen.`, 'Archivieren', false))) break;
      d.archived = true; d.archivedAt = Date.now(); await DB.put('projects', clone(d)); splitArchive(); toast('Kunde archiviert – zu finden unter „Archiv“.'); render(); break; }
    case 'unarchive': { e.stopPropagation(); const d = ARCHIVED.find(x => x.id === a.dataset.id); if (!d) break; d.archived = false; await DB.put('projects', clone(d)); splitArchive(); if (!ARCHIVED.length) UI.statusFilter = 'alle'; toast('Kunde wiederhergestellt.'); render(); break; }
    case 'open': if (e.target.closest('button[data-a="dup"],button[data-a="del"],button[data-a="won"],button[data-a="archive"],button[data-a="unarchive"]')) break; if (!findProject(a.dataset.id)) break; go(`projekt/${a.dataset.id}/${findProject(a.dataset.id).step || 1}`); break;
    case 'dup': { e.stopPropagation(); const src = findProject(a.dataset.id), cp = clone(src); cp.id = uid('p'); cp.created = cp.updated = Date.now(); cp.customer.name = (cp.customer.name || 'Kunde') + ' (Kopie)';
      for (const d of cp.docs) { const oldId = d.id; d.id = uid('d'); d.pages = (await Promise.all(d.pages.map(copyFile))).filter(Boolean); if (cp.rec[oldId]) { cp.rec[d.id] = cp.rec[oldId]; delete cp.rec[oldId]; } }
      PROJECTS.push(cp); await DB.put('projects', clone(cp)); toast('Berechnung dupliziert.'); render(); break; }
    case 'del': { e.stopPropagation(); const d = ARCHIVED.find(x => x.id === a.dataset.id) || findProject(a.dataset.id); if (!d || !(await confirmDlg('Endgültig löschen?', `„${d.customer.name || 'Neue Berechnung'}“ und alle zugehörigen Dokumente werden endgültig gelöscht.`, 'Endgültig löschen'))) break;
      await DB.del('projects', d.id); PROJECTS = PROJECTS.filter(x => x.id !== d.id); ARCHIVED = ARCHIVED.filter(x => x.id !== d.id); if (!ARCHIVED.length && UI.statusFilter === 'archiv') UI.statusFilter = 'alle'; render(); undoDeletePopup(d); break; }
    case 'step': { const n = +a.dataset.n; p.step = n; saveProject(p); go(`projekt/${p.id}/${n}`); break; }
    case 'doc-attach': { const d = p.docs.find(x => x.id === a.dataset.id); d.attach = !d.attach; saveProject(p); render(); break; }
    case 'doc-choose': UI.chooseOpen[a.dataset.id] = !UI.chooseOpen[a.dataset.id]; render(); break;
    case 'doc-page': { const d = p.docs.find(x => x.id === a.dataset.id); d.sel[+a.dataset.i] = !d.sel[+a.dataset.i]; saveProject(p); render(); break; }
    case 'doc-all': case 'doc-none': { const d = p.docs.find(x => x.id === a.dataset.id); d.sel = d.pages.map(() => act === 'doc-all'); saveProject(p); render(); break; }
    case 'doc-del': if (await confirmDlg('Dokument entfernen?', 'Die Datei wird aus dieser Berechnung gelöscht.', 'Entfernen')) removeDoc(p, a.dataset.id); break;
    case 'set-price': { const v = +a.dataset.v, role = a.dataset.role; const path = p.type === 'pvwp' ? (role === 'offerPV' ? 'offer.grossPV' : 'offer.grossWP') : 'offer.gross'; setPath(p, path, v); p.from[path] = true; Object.values(p.rec).forEach(r => { if (r.role === role) r.gross = v; }); saveProject(p); toast('Bruttopreis gesetzt: ' + eur2(v)); render(); break; }
    case 'set-jaz': p.hp.jaz = +a.dataset.v; p.from['hp.jaz'] = true; saveProject(p); toast('JAZ übernommen: ' + num(+a.dataset.v, 2)); render(); break;
    case 'recprod-on': { const m = (p.rec[a.dataset.doc].products || []).find(x => x.id === a.dataset.id); m.on = a.checked; saveProject(p); break; }
    case 'recprod-apply': { let n = 0; p.docs.forEach(d => (p.rec[d.id] && p.rec[d.id].products || []).filter(m => m.on).forEach(m => { const c = p.components.find(x => x.id === m.id); if (c) c.qty = m.qty; else p.components.push({ id: m.id, qty: m.qty }); n++; })); applyComponents(p); saveProject(p); toast(n ? `${n} Produkt(e) übernommen.` : 'Kein Produkt ausgewählt.', n ? 'ok' : 'warn'); render(); break; }
    case 'comp': { const id = a.dataset.id; if (a.checked) p.components.push({ id, qty: 1 }); else p.components = p.components.filter(c => c.id !== id); applyComponents(p); saveProject(p); render(); break; }
    case 'fuel': { const v = a.dataset.v, h = p.heating; if (h.fuel === v) break; if (isNum(h.cons)) h.cons = v === 'oil' ? Math.round(h.cons / 10) : h.cons * 10; h.fuel = v; h.price = v === 'oil' ? S.calc.oilPrice : S.calc.gasPrice; h.maint = v === 'oil' ? S.calc.oilMaint : S.calc.gasMaint; h.base = v === 'oil' ? S.calc.oilBase : S.calc.gasBase; delete p.from['heating.cons']; saveProject(p); render(); break; }
    case 'speed': p.fund.speed = !fundingOf(p).speedOn; saveProject(p); render(); break;
    case 'speed-auto': p.fund.speed = null; saveProject(p); render(); break;
    case 'scen': p.scenario = a.dataset.v; saveProject(p); render(); break;
    case 'rtab': UI.resultTab = a.dataset.v; render(); window.scrollTo(0, 0); break;
    case 'page-tg': { const R = compute(p), d = docPageDefs(p, R).find(x => x.key === a.dataset.k); p.pages[a.dataset.k] = !d.on; saveProject(p); render(); break; }
    case 'opt-assump': { const R = compute(p); if (R.scen === 'opt') { toast('Beim optimistischen Szenario werden die Annahmen immer gedruckt.', 'warn'); break; } p.docOpts.assumptions = !showAssumptions(p, R); saveProject(p); render(); break; }
    case 'pdf': makePdf(); break;
    case 'print': printDoc(); break;
    case 'prod-new': { const pr = { id: uid('pr'), name: '', maker: '', cat: 'wp', power: null, jaz: null, weight: null, dims: '', beg: true, warranty: '', note: '', img: '', imgUrl: '' }; PRODUCTS.unshift(pr); saveProducts(); render(); productModal(pr.id); break; }
    case 'prod-edit': productModal(a.dataset.id); break;
    case 'prod-copy': copyProduct(a.dataset.id); break;
    case 'prod-sort': PERSONAL.prodSort = a.dataset.v; savePersonal(); render(); break;
    case 'prod-del': { const pr = PRODUCTS.find(x => x.id === a.dataset.id); if (!(await confirmDlg('Produkt löschen?', `„${pr.name || 'Ohne Namen'}“ wird aus Ihrer Datenbank gelöscht.`))) break; if (pr.img) await delFiles([pr.img]); PRODUCTS = PRODUCTS.filter(x => x.id !== pr.id); saveProducts(); render(); break; }
    case 'prod-img-del': { const pr = PRODUCTS.find(x => x.id === a.dataset.id); await delFiles([pr.img]); pr.img = ''; saveProducts(); productModal(pr.id); break; }
    case 'logo-del': await delFiles([S.company.logoFile]); S.company.logoFile = ''; saveSettings(); render(); break;
    case 'color-quick': S.design[a.dataset.k] = a.dataset.v; applyTheme(); saveSettings(); render(); break;
    case 'a2hs-install': if (installEvt) { installEvt.prompt(); installEvt.userChoice.finally(() => { installEvt = null; render(); }); } break;
    case 'house-pick': { const p = curProject(); if (p) { p.docOpts[a.dataset.k === 'style' ? 'houseStyle' : 'houseLight'] = a.dataset.v; saveProject(p); pdfChooser(p); } break; }
    case 'disc-on': { const p = curProject(); if (p) { p.discount.on = !p.discount.on; if (p.discount.on && !p.discount.until) p.discount.until = addDays(isoToday(), S.discount.days); if (p.discount.on && !isNum(p.discount.amount)) p.discount.amount = S.discount.amount; saveProject(p); pdfChooser(p); renderSoon(); } break; }
    case 'qr-proj': { const p = curProject(); if (p) { p.docOpts.qr = !!a.checked; saveProject(p); render(); } break; }
    case 'a2hs-off': PERSONAL.a2hsOff = true; savePersonal(); render(); break;
    case 'review-done': S.calc.reviewedAt = isoToday(); saveSettings(); toast('Als geprüft markiert – nächste Erinnerung in 6 Monaten.'); render(); break;
    case 'pdf-small': PERSONAL.pdfSmall = !!a.checked; savePersonal(); $$('[data-a=pdf-small]').forEach(x => { x.checked = PERSONAL.pdfSmall; }); break;
    case 'app-update': { const done = () => location.reload(); if (navigator.serviceWorker) navigator.serviceWorker.getRegistration().then(r => (r ? r.update() : null)).then(done, done); else done(); break; }
    case 'legal-reset': if (!confirm('Impressum-Zusatz, Datenschutzerklärung und Widerrufsbelehrung auf die Standardtexte zurücksetzen?')) break; S.legal = clone(LEGAL_DEFAULT); saveSettings(); render(); break;
    case 'hdr-auto': S.design[a.dataset.k] = ''; saveSettings(); applyTheme(); render(); break;
    case 'rv-add': S.reviews.items = (S.reviews.items || []).concat([{ id: uid('rv'), on: true, name: '', place: '', stars: 5, text: '' }]); saveSettings(); render(); break;
    case 'rv-del': if (!confirm('Diese Bewertung löschen?')) break; S.reviews.items.splice(+a.dataset.i, 1); saveSettings(); render(); break;
    case 'sig-alpha': S.design.sigBox = { ...(S.design.sigBox || {}), alpha: +a.dataset.v }; saveSettings(); render(); break;
    case 'sig-color': S.design.sigBox = { ...(S.design.sigBox || {}), color: a.dataset.v }; saveSettings(); render(); break;
    case 'bg-alpha': S.design[a.dataset.k].bgAlpha = +a.dataset.v; saveSettings(); render(); break;
    case 'cover-blocks-reset': S.design.cover.blocks = clone(DEFAULT_SETTINGS.design.cover.blocks); saveSettings(); render(); break;
    case 'logo-pos': S.design.coverLogo.x = +a.dataset.x; S.design.coverLogo.y = +a.dataset.y; saveSettings(); render(); break;
    case 'stand-sel': UI.standSel = a.dataset.id; render(); break;
    case 'stand-new': { const base = S.funding.stands.find(s => s.id === (UI.standSel || currentStand().id)) || currentStand(); const ns = { ...clone(base), id: uid('st'), builtin: false, from: isoToday(), to: '' }; S.funding.stands.push(ns); UI.standSel = ns.id; saveSettings(); render(); toast('Neuer Förderstand angelegt.'); break; }
    case 'stand-reset': if (await confirmDlg('Richtlinienwerte wiederherstellen?', 'Alle hinterlegten Förderstände werden auf die Werte der Richtlinie zurückgesetzt. Eigene Stände bleiben erhalten.', 'Wiederherstellen', false)) { S.funding.stands = clone(DEFAULT_STANDS).concat(S.funding.stands.filter(s => !s.builtin)); saveSettings(); render(); toast('Richtlinienwerte wiederhergestellt.'); } break;
    case 'stand-del': if (await confirmDlg('Förderstand löschen?', 'Projekte mit diesem Stand erhalten den aktuell gültigen Stand.')) { S.funding.stands = S.funding.stands.filter(s => s.id !== a.dataset.id); PROJECTS.forEach(x => { if (x.fund.stand === a.dataset.id) { x.fund.stand = currentStand().id; saveProject(x); } }); UI.standSel = null; saveSettings(); render(); } break;
    case 'price-key': UI.priceKey = a.dataset.v; render(); break;
    case 'price-year-add': { const d = S.prices[UI.priceKey || 'strom'], ys = Object.keys(d.years).map(Number); const y = ys.length ? Math.max(...ys) + 1 : 2006; d.years[y] = ys.length ? d.years[Math.max(...ys)] : d.current; saveSettings(); render(); break; }
    case 'price-year-del': delete S.prices[UI.priceKey || 'strom'].years[a.dataset.y]; saveSettings(); render(); break;
    case 'prices-reset': if (await confirmDlg('Recherchierte Werte wiederherstellen?', 'Alle Preisdaten werden auf den Stand Oktober 2026 zurückgesetzt.', 'Wiederherstellen', false)) { S.prices = clone(DEFAULT_PRICES); saveSettings(); render(); toast('Preisdaten wiederhergestellt.'); } break;
    case 'cmp-add': S.comparisons.items.push({ id: uid('c'), on: true, icon: 'gift', label: 'Neuer Vergleich', price: 1000 }); saveSettings(); render(); break;
    case 'cmp-del': S.comparisons.items = S.comparisons.items.filter(i => i.id !== a.dataset.id); saveSettings(); render(); break;
    case 'adv-from-offer': { const ad = { id: uid('a'), name: a.dataset.n, role: 'Energieberater', phone: a.dataset.ph, email: a.dataset.em, photo: '' }; (S.company.advisors = S.company.advisors || []).push(ad); if (!S.company.defaultAdvisor) S.company.defaultAdvisor = ad.id; p.offer.advisorId = ad.id; p.offer.advisor = ad.name; saveSettings(); saveProject(p); toast(`${ad.name} wurde als Berater angelegt.`); render(); break; }
    case 'status-filter': UI.statusFilter = a.dataset.v; render(); break;
    case 'roof-add': { const rs = p.pv.roofs = roofsOf(p).map(r => ({ ...r })); rs.push({ id: uid('r'), az: rs.length === 1 ? 90 : -90, tilt: 35, kwp: null }); if (rs.length === 2 && rs[0].az === 0) rs[0].az = -90; saveProject(p); render(); break; }
    case 'roof-del': { const rs = roofsOf(p).filter((_, i) => i !== +a.dataset.i); p.pv.roofs = rs.length ? rs : [{ id: 'r1', az: 0, tilt: 35, kwp: null }]; saveProject(p); render(); break; }
    case 'pvgis': fetchPvgis(p); break;
    case 'var-add': { const t = a.dataset.tpl, n = (p.variants || []).length; const v = { id: uid('v'), name: t === 'nobat' ? 'Ohne Speicher' : t === 'rod' ? 'Mit Heizstab' : 'Variante ' + 'BCDEF'[n] }; if (p.type === 'pvwp') { v.grossWP = p.offer.grossWP; v.grossPV = p.offer.grossPV; } else v.gross = p.offer.gross; if (hasPV(p)) { v.kwp = p.pv.kwp; v.bat = t === 'nobat' ? 0 : p.pv.bat; } if (p.type === 'pvwp') v.rod = t === 'rod' ? true : !!(p.rod && p.rod.on); (p.variants = p.variants || []).push(v); saveProject(p); render(); break; }
    case 'var-del': p.variants = (p.variants || []).filter(v => v.id !== a.dataset.id); saveProject(p); render(); break;
    case 'pad-clear': { const st = PADS[a.dataset.k]; if (st) { st.ctx.clearRect(0, 0, st.cv.width, st.cv.height); st.drawn = false; } break; }
    case 'sign-save': saveSignature(p); break;
    case 'sign-del': if (await confirmDlg('Unterschrift entfernen?', 'Die gespeicherte Unterschrift wird gelöscht.', 'Entfernen')) { await delFiles([p.sign.cust, p.sign.adv].filter(Boolean)); p.sign = null; if (p.status === 'unterschrieben') p.status = 'gesendet'; saveProject(p); render(); } break;
    case 'pdf-force': closeModal(); makePdf(true, UI.pdfLayout); break;
    case 'pdf-go': closeModal(); makePdf(false, a.dataset.v); break;
    case 'plaus-back': closeModal(); p.step = 3; saveProject(p); go(`projekt/${p.id}/3`); break;
    case 'tut': showTutorial(+a.dataset.i); break;
    case 'whatsnew': showWhatsNew(); break;
    case 'whatsnew-all': showWhatsNew(true); break;
    case 'archive': showArchive(); break;
    case 'tut-skip': closeModal(); PERSONAL.tutorialDone = true; savePersonal(); break;
    case 'admin-lock': lockAdmin(); break;
    case 'export-config': exportConfig(); break;
    case 'admin-pw': { const a1 = $('#pw-new1').value, a2 = $('#pw-new2').value; if (a1.length < 8) { toast('Bitte mindestens 8 Zeichen.', 'err'); break; } if (a1 !== a2) { toast('Die Passwörter stimmen nicht überein.', 'err'); break; } await setAdminPassword(a1); toast('Admin-Passwort geändert. Bitte die Konfiguration neu exportieren.'); render(); break; }
    case 'cover-pal': updateCoverPalette().then(render); break;
    case 'clear-color': bset(a.dataset.b, ''); applyTheme(); render(); break;
    case 'theme-toggle': setMode(curMode() === 'light' ? 'dark' : 'light'); render(); toast('Ansicht: ' + MODE_LABEL[curMode()]); break;
    case 'focus-search': focusSearch(); break;
    case 'theme-preset': { const t = THEME_PRESETS[+a.dataset.i]; Object.assign(S.design, { primary: t.primary, secondary: t.secondary, accent: t.accent, old: t.old, ink: t.ink, bg: t.bg, night: t.night }); applyTheme(); saveSettings(); render(); break; }
    case 'ord': { const sl = a.dataset.l === 's', o = sl ? salesOrder() : docOrder(), i = o.indexOf(a.dataset.k), j = i + +a.dataset.d; if (j < 0 || j >= o.length) break; [o[i], o[j]] = [o[j], o[i]]; if (sl) S.doc.salesOrder = o; else S.doc.order = o; saveSettings(); render(); break; }
    case 'ord-reset': if (a.dataset.l === 's') { S.doc.salesOrder = null; saveSettings(); render(); break; } S.doc.order = null; saveSettings(); render(); break;
    case 'docdef': { const k = a.dataset.k, on = k === 'sBasis' ? S.doc.defaults.sBasis !== true : S.doc.defaults[k] === false; S.doc.defaults[k] = on; if (on && k === 'sign') S.discount.signPage = true; if (on && (k === 'prices' || k === 'why')) S.prices.showPages = true; saveSettings(); render(); break; }
    case 'tr-add': S.sales.trust.push({ id: uid('t'), on: true, icon: 'check', title: 'Neues Argument', text: '' }); saveSettings(); render(); break;
    case 'tr-del': S.sales.trust = S.sales.trust.filter(t => t.id !== a.dataset.id); saveSettings(); render(); break;
    case 'adv-add': (S.company.advisors = S.company.advisors || []).push({ id: uid('a'), name: '', role: 'Energieberater', phone: '', email: '', photo: '' }); saveSettings(); render(); break;
    case 'adv-del': { const ad = S.company.advisors.find(x => x.id === a.dataset.id); if (ad && ad.photo) await delFiles([ad.photo]); S.company.advisors = S.company.advisors.filter(x => x.id !== a.dataset.id); saveSettings(); render(); break; }
    case 'rm-add': S.roadmap[a.dataset.l].push({ id: uid('r'), title: 'Neuer Schritt', text: '', dur: '' }); saveSettings(); render(); break;
    case 'rm-del': S.roadmap[a.dataset.l] = S.roadmap[a.dataset.l].filter(x => x.id !== a.dataset.id); saveSettings(); render(); break;
    case 'rm-move': { const l = S.roadmap[a.dataset.l], i = l.findIndex(x => x.id === a.dataset.id), j = i + +a.dataset.d; if (j < 0 || j >= l.length) break; [l[i], l[j]] = [l[j], l[i]]; saveSettings(); render(); break; }
    case 'rm-reset': if (await confirmDlg('Standardschritte wiederherstellen?', 'Alle Roadmap-Schritte werden auf die Vorlage zurückgesetzt.', 'Wiederherstellen', false)) { S.roadmap = clone(DEFAULT_SETTINGS.roadmap); saveSettings(); render(); } break;
    case 'backup': exportBackup(); break;
    case 'wipe': wipeAll(); break;
  }
});

/* =========================================================
   Start
   ========================================================= */
(async function init() {
  await loadAll();
  await loadPersonal();
  applyTheme();
  ensureCoverPalette();
  if (!location.hash) history.replaceState(null, '', '#/kunden');
  await route();
  try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.design.mode === 'system') { applyTheme(); render(); } }); } catch (e) {}
  if (!PERSONAL.tutorialDone) { PERSONAL.tutorialDone = true; PERSONAL.seenRelease = WHATS_NEW.id; savePersonal(); setTimeout(() => showTutorial(0), 600); }
  else setTimeout(maybeWhatsNew, 900);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(e => console.warn('Offline-Betrieb nicht verfügbar', e));
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
})();
</script>
</body>
</html>
