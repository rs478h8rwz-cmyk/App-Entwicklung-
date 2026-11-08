/* =========================================================
   Fenster vor dem PDF: Sonderrabatt prüfen (nicht übersehbar),
   Layout wählen, verkleinern, QR-Code
   ========================================================= */
function discPreview(p) {
  if (!p.discount.on) return 'Kein Sonderrabatt im Dokument.';
  return `„${S.discount.text.replace('{datum}', p.discount.until ? deDate(p.discount.until) : '…')}“ – ${eur(nz(p.discount.amount))}`;
}
function discBox(p) {
  const on = !!p.discount.on, past = on && p.discount.until && p.discount.until < isoToday();
  return `<div id="disc-box" class="rounded-[calc(var(--r)-2px)] p-4 mt-5" style="background:rgb(var(--s-rgb)/.14);box-shadow:inset 0 0 0 1.5px rgb(var(--s-rgb)/.55)">
    <div class="flex items-center gap-3"><div class="icon-box !text-yel-ink shrink-0">${ic('tag', 18)}</div><div class="flex-1"><div class="font-semibold text-[16px]">Sonderrabatt</div><div class="text-[13px] text-ink2" id="disc-prev">${esc(discPreview(p))}</div></div>
      <button type="button" class="tgl ${on ? 'on' : ''}" role="switch" aria-checked="${on}" aria-label="Sonderrabatt anbieten" data-a="disc-on"></button></div>
    ${on ? `<div class="grid grid-cols-2 gap-3 mt-4">${field('Rabatt', 'p:discount.amount', { t: 'n', unit: '€', ph: num(S.discount.amount) })}${field('Gültig bis', 'p:discount.until', { t: 'date' })}</div>${past ? '<div class="text-[13px] mt-2" style="color:var(--old)">Achtung: Das Datum liegt in der Vergangenheit.</div>' : ''}` : ''}
  </div>`;
}
pdfChooser = function (p) {
  const R = compute(p), ask = S.doc.pdfAsk || 'ask', list = ask === 'ask' ? ['full', 'sales'] : [ask];
  const cnt = l => { const prev = UI.docLayout; UI.docLayout = l; try { return visiblePages(p, compute(p)).reduce((a, x) => a + x.count, 0); } finally { UI.docLayout = prev; } };
  const info = { full: ['Komplette PDF', 'Alle Seiten mit Erklärungen, Diagrammen und Hintergründen.', 'file'], sales: ['Vertriebs-PDF', 'Kompakt und verkaufsstark: die wichtigsten Zahlen, Förderung, Ersparnis und Auftrag.', 'sparkle'] };
  const opt = l => `<button class="w-full text-left rounded-[calc(var(--r)-2px)] border border-line2 hover:border-p p-4 flex items-start gap-3 ${list.length > 1 && layoutOf(p) === l ? 'ring-2 ring-p/40' : ''}" data-a="pdf-go" data-v="${l}"><span class="icon-box shrink-0">${ic(info[l][2], 18)}</span><span class="flex-1"><span class="block font-semibold text-[15px]">${info[l][0]} erstellen <span class="text-ink3 font-normal text-[13px]">· ${cnt(l)} Seiten</span></span><span class="block text-[13px] text-ink3 mt-0.5">${info[l][1]}</span></span></button>`;
  const qr = `<label class="flex items-center gap-2.5 text-[14px] text-ink2 cursor-pointer mt-2"><input type="checkbox" data-a="qr-proj" ${qrOnFor(p) ? 'checked' : ''}>QR-Code im Dokument</label>`;
  modal(`<h3 class="text-[20px] font-semibold pr-8">Vor dem Erstellen kurz prüfen</h3><p class="text-ink3 text-[14px] mt-1">${esc(custName(p))}${p.offer.number ? ' · Angebot ' + esc(p.offer.number) : ''}</p>
    ${discBox(p)}
    <div class="lbl mt-5">${list.length > 1 ? 'Welche PDF?' : 'PDF'}</div><div class="space-y-3">${list.map(opt).join('')}</div>
    ${smallToggle()}${qr}
    ${list.length === 1 ? '<p class="hint mt-3">Das Layout ist unter Einstellungen → Dokument & Verkauf fest eingestellt.</p>' : ''}`);
};
/* Fenster erscheint jetzt immer vor dem PDF – auch bei fest eingestelltem Layout */
const _makePdf15 = makePdf;
makePdf = function (force, layout) {
  const p = curProject(); if (!p) return;
  if (!force && !layout) { if (!checkBeforePdf(p)) return; pdfChooser(p); return; }
  return _makePdf15(force, layout);
};
/* Vorschau im Fenster live aktualisieren */
document.addEventListener('input', e => {
  if (!e.target.closest || !e.target.closest('#disc-box')) return;
  const p = curProject(), el = $('#disc-prev'); if (p && el) setTimeout(() => { el.textContent = discPreview(p); }, 0);
});

/* Deckblatt-Haus: Stil und Licht – Vorgabe vom Admin, pro PDF änderbar nur wenn freigegeben */
function coverHouseOpts(p) {
  const d = S.design, allow = !!d.houseUserChoice, o = (p && p.docOpts) || {};
  return { style: (allow && o.houseStyle) || d.houseStyle || 'classic', light: (allow && o.houseLight) || d.houseLight || 'auto' };
}
function houseChoiceBox(p) {
  if (!S.design.houseUserChoice) return '';
  const c = coverHouseOpts(p), b = (k, v, l) => `<button type="button" class="${c[k] === v ? 'on' : ''}" data-a="house-pick" data-k="${k}" data-v="${v}">${l}</button>`;
  return `<div class="mt-5"><span class="lbl">Deckblatt</span><div class="flex flex-wrap gap-2"><div class="seg">${b('style', 'classic', 'Klassisches Haus')}${b('style', 'modern', 'Modernes Haus')}</div><div class="seg">${b('light', 'auto', 'Licht automatisch')}${b('light', 'on', 'An')}${b('light', 'off', 'Aus')}</div></div></div>`;
}
const _pdfChooser15b = pdfChooser;
pdfChooser = function (p) { _pdfChooser15b(p); const box = $('#disc-box'); if (box) box.insertAdjacentHTML('afterend', houseChoiceBox(p)); };

/* Notfall-Knopf: gelöschten Kunden 5 Sekunden lang wiederherstellen; Dateien werden erst danach endgültig entfernt */
let LAST_DEL = null;
function undoDeletePopup(d) {
  if (LAST_DEL) finalizeDelete();
  LAST_DEL = { p: clone(d), t: setTimeout(finalizeDelete, 5000) };
  const old = $('#del-pop'); if (old) old.remove();
  document.body.insertAdjacentHTML('beforeend', `<div id="del-pop" class="fixed left-1/2 -translate-x-1/2 z-[80] card overflow-hidden shadow-xl" style="bottom:calc(env(safe-area-inset-bottom) + 16px);width:min(440px,calc(100vw - 24px))">
    <div class="px-4 py-3 flex items-center gap-3"><span class="text-[14px] flex-1 min-w-0"><b class="font-semibold">„${esc(d.customer.name || 'Neue Berechnung')}“ endgültig gelöscht.</b></span><button class="btn-p btn-sm" data-a="restore-del">Wiederherstellen</button></div>
    <div class="h-1 bg-p" style="transform-origin:left;animation:delbar 5s linear forwards"></div></div><style>@keyframes delbar{from{transform:scaleX(1)}to{transform:scaleX(0)}}</style>`);
}
async function finalizeDelete() {
  const x = LAST_DEL; LAST_DEL = null; const el = $('#del-pop'); if (el) el.remove();
  if (x) { clearTimeout(x.t); await delFiles(x.p.docs.flatMap(d => d.pages).concat(x.p.sign ? [x.p.sign.cust, x.p.sign.adv] : [], x.p.roof ? x.p.roof.faces.map(f => f.photo) : [])); }
}
async function restoreDeleted() {
  const x = LAST_DEL; if (!x) return; clearTimeout(x.t); LAST_DEL = null; const el = $('#del-pop'); if (el) el.remove();
  (x.p.archived ? ARCHIVED : PROJECTS).push(x.p); await DB.put('projects', clone(x.p)); render(); toast('Kunde wiederhergestellt.');
}
