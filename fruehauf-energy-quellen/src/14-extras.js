/* =========================================================
   Ergänzungen: Home-Bildschirm-Hinweis, Prüf-Erinnerung für
   Preise/Förderung, Finanzierungsrechner, QR-Code, E-Mail-Versand,
   kleine PDF für E-Mail, Hinweis auf neue App-Version
   ========================================================= */
const APP_VERSION = '__APPVER__';
const EXTRA_DEFAULT = {
  finance: { enabled: true, rate: 4.5, years: 15, label: 'Finanzierung über Ihre Bank oder den KfW-Ergänzungskredit' },
  qrOn: false, qrMode: 'tel', qrUrl: '', qrLabel: '', qrColor: 'dark', qrCustom: '#0F2A3D', qrSize: 20, qrWhere: { contact: true, sign: true, why: true },
  mailSubject: 'Ihr persönliches Energiekonzept von {firma}',
  mailText: 'Guten Tag {kunde},\n\nvielen Dank für das angenehme Gespräch. Anbei erhalten Sie Ihr persönliches Energiekonzept mit allen Zahlen zu Ersparnis, Förderung und Amortisation.\n\nBei Fragen bin ich gern für Sie da.\n\nViele Grüße\n{berater}\n{firma}\n{telefon}'
};
DEFAULT_SETTINGS.finance = clone(EXTRA_DEFAULT.finance);
Object.assign(DEFAULT_SETTINGS.sales, { qrOn: false, qrMode: 'tel', qrUrl: '', qrLabel: '', qrColor: 'dark', qrCustom: '#0F2A3D', qrSize: 20, qrWhere: clone(EXTRA_DEFAULT.qrWhere), mailSubject: EXTRA_DEFAULT.mailSubject, mailText: EXTRA_DEFAULT.mailText });
if (!S.finance) S.finance = clone(EXTRA_DEFAULT.finance);
for (const k of ['qrOn', 'qrMode', 'qrUrl', 'qrLabel', 'qrColor', 'qrCustom', 'qrSize', 'qrWhere', 'mailSubject', 'mailText']) if (S.sales[k] === undefined) S.sales[k] = EXTRA_DEFAULT[k];

/* ---------- 1) Hinweis „Zum Home-Bildschirm“ + Sicherung nach 7 Tagen ---------- */
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches));
const isAndroid = () => /Android/i.test(navigator.userAgent);
const platform = () => (isIOS() ? 'ios' : isAndroid() ? 'android' : 'desktop');
/* Android/Chrome: Installieren mit einem Tipp, wenn der Browser es anbietet */
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (UI.route === 'kunden') render(); });
window.addEventListener('appinstalled', () => { installEvt = null; PERSONAL.a2hsOff = true; savePersonal(); render(); });
/* Daten möglichst vor automatischem Löschen schützen */
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
const A2HS_STEPS = {
  ios: 'In <b>Safari</b> unten auf <b>Teilen</b> (Quadrat mit Pfeil) tippen → <b>Zum Home-Bildschirm</b> → <b>Hinzufügen</b>. Danach die App immer über das neue Symbol öffnen.',
  android: 'In <b>Chrome</b> oben rechts auf das Menü <b>⋮</b> tippen → <b>App installieren</b> bzw. <b>Zum Startbildschirm hinzufügen</b> → bestätigen. Danach die App immer über das neue Symbol öffnen.'
};
function a2hsBanner() {
  const pf = platform();
  if (isStandalone() || PERSONAL.a2hsOff || pf === 'desktop') return '';
  const why = pf === 'ios' ? 'Im Safari-Tab kann iOS Ihre Daten nach einigen Wochen ohne Nutzung löschen.' : 'Als installierte App startet sie schneller, läuft offline und Ihre Daten sind besser geschützt.';
  return `<div class="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 mb-4" style="border-color:rgb(var(--p-rgb)/.45)"><div class="icon-box">${ic('download', 18)}</div><div class="flex-1"><div class="font-medium text-[15px]">Bitte als App auf den ${pf === 'ios' ? 'Home-Bildschirm' : 'Startbildschirm'} legen</div><div class="text-[13px] text-ink3">${why} ${A2HS_STEPS[pf]}</div></div><div class="flex gap-2">${installEvt ? `<button class="btn-p btn-sm" data-a="a2hs-install">${ic('download', 15)}Jetzt installieren</button>` : ''}<button class="btn-g btn-sm" data-a="a2hs-off">Erledigt</button></div></div>`;
}
/* Wohin die Sicherung geht – je nach Gerät */
const backupWhere = () => (platform() === 'android' ? 'Google Drive oder „Downloads“' : platform() === 'ios' ? 'iCloud Drive oder „Dateien“' : 'einen sicheren Ordner oder Cloud-Speicher');
/* Anleitung für iPhone und Android (Einstellungen → Ansicht & Tutorial) */
function guideCard() {
  const pf = platform(), col = (title, items) => `<div class="rounded-[calc(var(--r)-4px)] border border-line p-4"><div class="font-medium text-[15px] mb-2">${title}</div><ol class="list-decimal pl-5 space-y-2 text-[14px] text-ink2 leading-relaxed">${items.map(i => `<li>${i}</li>`).join('')}</ol></div>`;
  const sec = (t, ios, and) => `<div class="mt-5"><div class="font-semibold text-[15px] mb-2">${t}</div><div class="grid lg:grid-cols-2 gap-3">${col(`iPhone / iPad${pf === 'ios' ? ' <span class="badge ml-1 text-[11px]">Ihr Gerät</span>' : ''}`, ios)}${col(`Android${pf === 'android' ? ' <span class="badge ml-1 text-[11px]">Ihr Gerät</span>' : ''}`, and)}</div></div>`;
  return sCard('info', 'Anleitung für iPhone und Android', 'Einmal einrichten – dann sind Ihre Daten gut geschützt.',
    sec('1 · App auf den Startbildschirm legen',
      ['Die App-Adresse in <b>Safari</b> öffnen (nicht in Chrome oder einer anderen App).', 'Unten auf <b>Teilen</b> tippen (Quadrat mit Pfeil nach oben).', 'Nach unten scrollen → <b>Zum Home-Bildschirm</b> → <b>Hinzufügen</b>.', 'Die App ab jetzt <b>nur noch über das neue Symbol</b> öffnen – sonst sieht iOS sie als normale Webseite und kann die Daten nach einigen Wochen löschen.'],
      ['Die App-Adresse in <b>Chrome</b> öffnen.', 'Oben rechts auf das Menü <b>⋮</b> tippen.', '<b>App installieren</b> oder <b>Zum Startbildschirm hinzufügen</b> wählen und bestätigen.', 'Die App ab jetzt über das neue Symbol öffnen.'])
    + sec('2 · Daten sichern (mindestens einmal pro Woche)',
      ['In der App: <b>Einstellungen → Datensicherung → Sicherung erstellen</b>.', 'Im Teilen-Dialog <b>In Dateien sichern</b> wählen.', 'Ordner <b>iCloud Drive</b> (z. B. „Frühauf Sicherungen“) auswählen → <b>Sichern</b>.', 'Die App erinnert Sie nach 7 Tagen ohne Sicherung.'],
      ['In der App: <b>Einstellungen → Datensicherung → Sicherung erstellen</b>.', 'Im Teilen-Dialog <b>Drive</b> wählen (oder die Datei landet unter <b>Downloads</b>).', 'In Google Drive einen Ordner wie „Frühauf Sicherungen“ wählen → <b>Speichern</b>.', 'Die App erinnert Sie nach 7 Tagen ohne Sicherung.'])
    + sec('3 · Sicherung zurückspielen (z. B. neues Handy)',
      ['App wie unter 1 auf dem neuen Gerät einrichten.', '<b>Einstellungen → Datensicherung → Sicherung einspielen</b>.', 'In <b>Dateien → iCloud Drive</b> die neueste Sicherung antippen.', 'Fertig – Kunden, Berechnungen und Angebote sind wieder da.'],
      ['App wie unter 1 auf dem neuen Gerät einrichten.', '<b>Einstellungen → Datensicherung → Sicherung einspielen</b>.', 'Die Datei in <b>Drive</b> oder <b>Downloads</b> auswählen.', 'Fertig – Kunden, Berechnungen und Angebote sind wieder da.'])
    + sec('4 · Firmen-Einstellungen vom Admin übernehmen',
      ['Die vom Admin geschickte <b>Konfigurationsdatei</b> (z. B. per Mail oder AirDrop) in <b>Dateien</b> speichern.', 'In der App: <b>Einstellungen → Datensicherung → Firmen-Konfiguration einspielen</b> und die Datei wählen.', 'Ihre eigenen Kunden bleiben dabei erhalten.'],
      ['Die vom Admin geschickte <b>Konfigurationsdatei</b> (z. B. per Mail oder WhatsApp) unter <b>Downloads</b> speichern.', 'In der App: <b>Einstellungen → Datensicherung → Firmen-Konfiguration einspielen</b> und die Datei wählen.', 'Ihre eigenen Kunden bleiben dabei erhalten.'])
    + sec('5 · App aktualisieren',
      ['Gibt es eine neue Version, erscheint unten <b>„Neue Version verfügbar“</b>.', 'Auf <b>Jetzt aktualisieren</b> tippen – Ihre Daten bleiben erhalten.'],
      ['Gibt es eine neue Version, erscheint unten <b>„Neue Version verfügbar“</b>.', 'Auf <b>Jetzt aktualisieren</b> tippen – Ihre Daten bleiben erhalten.']));
}
const _setAnsicht14 = SET.ansicht;
SET.ansicht = () => _setAnsicht14() + guideCard();
const _setDaten14 = SET.daten;
if (_setDaten14) SET.daten = () => _setDaten14().replace('Auf dem iPhone öffnet sich der Teilen-Dialog: „In Dateien sichern“ → iCloud Drive.', platform() === 'android' ? 'Auf Android öffnet sich der Teilen-Dialog: „Drive“ wählen – oder die Datei landet unter „Downloads“.' : 'Auf dem iPhone öffnet sich der Teilen-Dialog: „In Dateien sichern“ → iCloud Drive. Auf Android: „Drive“ oder „Downloads“.') + `<p class="hint">Schritt-für-Schritt-Anleitung für iPhone und Android: <a class="text-p underline" href="#/einstellungen/ansicht">Einstellungen → Ansicht &amp; Tutorial</a>.</p>`;

/* ---------- 5) Erinnerung: Preise und Förderung prüfen ---------- */
const REVIEW_DAYS = 180;
function reviewAge() {
  if (!S.calc.reviewedAt) { S.calc.reviewedAt = isoToday(); saveSettings(); }
  return Math.floor((Date.now() - new Date(S.calc.reviewedAt).getTime()) / 864e5);
}
function reviewBanner() {
  const d = reviewAge(); if (d < REVIEW_DAYS) return '';
  const mon = Math.max(1, Math.round(d / 30.4));
  return `<div class="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 mb-4" style="border-color:rgb(var(--s-rgb)/.45)"><div class="icon-box !text-yel-ink">${ic('alert', 18)}</div><div class="flex-1"><div class="font-medium text-[15px]">Preise und Förderung zuletzt geprüft vor ${mon} Monaten</div><div class="text-[13px] text-ink3">Einspeisevergütung, Strom-, Gas- und Ölpreise sowie die BEG-Fördersätze ändern sich regelmäßig. Bitte im Admin-Bereich (Preisentwicklung, Förderung, Berechnung) prüfen.</div></div>${UI.admin ? `<button class="btn-p btn-sm" data-a="review-done">${ic('check', 15)}Geprüft</button>` : '<a class="btn-s btn-sm" href="#/einstellungen/preise">Zum Admin-Bereich</a>'}</div>`;
}
function reviewCard() {
  const d = reviewAge();
  return `<div class="card p-4 flex flex-wrap items-center gap-3"><div class="icon-box">${ic('refresh', 18)}</div><div class="flex-1 min-w-[200px]"><div class="font-medium text-[15px]">Zuletzt geprüft am ${deDate(S.calc.reviewedAt)}</div><div class="text-[13px] text-ink3">Nach ${REVIEW_DAYS / 30} Monaten erinnert die App alle Nutzer an eine Prüfung von Preisen, Einspeisevergütung und Förderung.</div></div><button class="btn-s btn-sm" data-a="review-done">${ic('check', 15)}Heute geprüft</button></div>`;
}
const _backup14 = backupBanner;
backupBanner = function () { return a2hsBanner() + reviewBanner() + _backup14(); };
const _setPreise14 = SET.preise, _setFoerd14 = SET.foerderung;
if (_setPreise14) SET.preise = () => reviewCard() + _setPreise14();
if (_setFoerd14) SET.foerderung = () => reviewCard() + _setFoerd14();

/* ---------- 6) Finanzierungsrechner ---------- */
function finOf(p, R) {
  const f = p.finance || {};
  if (!f.on || S.finance.enabled === false) return null;
  const amount = isNum(f.amount) && f.amount > 0 ? f.amount : Math.max(0, R.net), rate = isNum(f.rate) ? f.rate : nz(S.finance.rate, 4.5), years = isNum(f.years) && f.years > 0 ? f.years : nz(S.finance.years, 15);
  const n = Math.round(years * 12), i = rate / 100 / 12, monthly = n ? (i ? amount * i / (1 - Math.pow(1 + i, -n)) : amount / n) : 0;
  const save = R.monthOld1 - R.monthNew1;
  return { amount, rate, years, monthly, interest: monthly * n - amount, save, diff: save - monthly };
}
const _compute14 = compute;
compute = function (p, scen) { const R = _compute14(p, scen); R.fin = finOf(p, R); return R; };
const finSentence = F => (F.diff >= 0 ? `Ab dem ersten Monat ${eur(F.diff)} im Plus – die Ersparnis ist höher als die Rate.` : `Sie zahlen anfangs ${eur(-F.diff)} pro Monat zu; mit steigenden Energiepreisen wächst Ihre Ersparnis Jahr für Jahr.`);
function finCard(p, R) {
  if (S.finance.enabled === false) return '';
  const f = p.finance || {}, F = R.fin;
  return `<div class="card p-5 sm:p-6">${cardHead('euro', 'Finanzierung', 'Monatliche Rate im Vergleich zur monatlichen Ersparnis – erscheint auch im Kundendokument')}
    <div class="rounded-[calc(var(--r)-4px)] bg-raised px-4">${toggleRow('Finanzierung anbieten', 'p:finance.on')}</div>
    ${f.on ? `<div class="grid sm:grid-cols-3 gap-3 mt-4">${field('Kreditbetrag', 'p:finance.amount', { t: 'n', unit: '€', ph: num(Math.round(R.net)) })}${field('Effektiver Jahreszins', 'p:finance.rate', { t: 'n', unit: '%', ph: num(S.finance.rate, 2) })}${field('Laufzeit', 'p:finance.years', { t: 'n', unit: 'Jahre', ph: String(S.finance.years) })}</div>
      ${F ? `<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4"><div class="kpi"><div class="kpi-k">Monatliche Rate</div><div class="kpi-v">${eur(F.monthly)}</div><div class="text-[12px] text-ink3">${num(F.years)} Jahre · ${num(F.rate, 2)} %</div></div><div class="kpi"><div class="kpi-k">Ersparnis pro Monat</div><div class="kpi-v">${eur(F.save)}</div><div class="text-[12px] text-ink3">im ersten Jahr</div></div><div class="kpi" style="background:${F.diff >= 0 ? 'rgb(var(--p-rgb)/.12)' : 'var(--tred, rgba(217,72,43,.12))'}"><div class="kpi-k">${F.diff >= 0 ? 'Monatlich im Plus' : 'Monatliche Zuzahlung'}</div><div class="kpi-v">${eur(Math.abs(F.diff))}</div><div class="text-[12px] text-ink3">ab dem ersten Monat</div></div></div><p class="hint">${esc(finSentence(F))} Zinsen gesamt rund ${eur(F.interest)}. Leer gelassene Felder nutzen die Vorgaben aus den Einstellungen.</p>` : ''}` : ''}</div>`;
}
/* Baustein für die PDFs */
function finDocBlock(R, sales) {
  const F = R.fin; if (!F) return '';
  const cells = [['Monatliche Rate', eur(F.monthly), `${num(F.years)} Jahre · ${num(F.rate, 2)} % eff.`], ['Ihre Ersparnis', eur(F.save), 'pro Monat im ersten Jahr'], [F.diff >= 0 ? 'Monatlich im Plus' : 'Monatliche Zuzahlung', eur(Math.abs(F.diff)), 'ab dem ersten Monat']];
  const pad = sales ? '4.5mm 6mm' : '3.2mm 4.5mm';
  return `<div style="margin-top:${sales ? 5 : 3}mm;border-radius:var(--dr);background:var(--p-light);padding:${pad}"><div style="display:flex;justify-content:space-between;gap:4mm;align-items:baseline"><div style="font-weight:700;font-size:${sales ? 10.5 : 9.4}pt">Mit Finanzierung</div><div class="small">${esc(S.finance.label || '')}</div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm;margin-top:2mm">${cells.map(([k, v, u], i) => `<div><div class="small">${k}</div><div style="font-size:${sales ? 16 : 13}pt;font-weight:${sales ? 800 : 600};line-height:1.25;${i === 2 ? `color:${F.diff >= 0 ? 'var(--p)' : 'var(--old)'}` : ''}">${v}</div><div class="small" style="margin-top:0.5mm">${u}</div></div>`).join('')}</div>
    <div style="font-size:${sales ? 8.8 : 8}pt;margin-top:2mm;color:var(--ink2)">${esc(finSentence(F))}</div></div>`;
}
const _sGlance14 = DOC.sGlance, _sMonthly14 = DOC.sMonthly, _monthly14 = DOC.monthly;
/* Finanzierung als zusätzliche Zeile im Kasten „Ihre Investition“ */
function finDocRow(R) {
  const F = R.fin; if (!F) return '';
  return `<div style="grid-column:1/-1;margin-top:3.5mm;padding-top:3mm;border-top:0.25mm solid var(--line);display:grid;grid-template-columns:1.1fr 1fr 1fr 1fr;align-items:baseline;font-size:9pt"><b style="font-size:9.6pt;color:var(--p)">Mit Finanzierung</b><span>Rate <b>${eur(F.monthly)}</b>/Monat</span><span>Ersparnis <b>${eur(F.save)}</b>/Monat</span><b style="color:${F.diff >= 0 ? 'var(--p)' : 'var(--old)'}">${F.diff >= 0 ? 'im Plus' : 'Zuzahlung'} ${eur(Math.abs(F.diff))}</b></div>`;
}
DOC.sGlance = function (p, R) { const r = _sGlance14(p, R); if (R.fin) r.body = r.body.replace('<h2 style="margin-top:8mm">Ihre Vorteile</h2>', '<h2 style="margin-top:6mm">Ihre Vorteile</h2>').replace(/<\/div>$/, finDocRow(R) + '</div>'); return r; };
DOC.sMonthly = function (p, R) { const r = _sMonthly14(p, R); if (R.fin) r.body = r.body.replace('<div class="sbox" style="margin-top:5mm;padding:5mm 5mm 3mm">', finDocBlock(R, true) + '<div class="sbox" style="margin-top:5mm;padding:5mm 5mm 3mm">'); return r; };
DOC.monthly = function (p, R) { const r = _monthly14(p, R); if (R.fin) r.body = r.body.replace('<div class="sec">', finDocBlock(R, false) + '<div class="sec" style="margin-top:4mm">'); return r; };

/* ---------- 7) QR-Code (Terminbuchung oder Anruf) ---------- */
const QR_MODES = [['tel', 'Berater anrufen'], ['vcard', 'Kontakt speichern'], ['url', 'Eigener Link'], ['web', 'Firmen-Website']];
const qrOnFor = p => (p && p.docOpts && p.docOpts.qr !== undefined ? !!p.docOpts.qr : !!S.sales.qrOn);
function qrTarget(p, force) {
  if (!force && !qrOnFor(p)) return null;
  const a = advisorOf(p), tel = String(a.phone || '').replace(/[^\d+]/g, '').replace(/^00/, '+').replace(/^0/, '+49'), mode = S.sales.qrMode || 'tel', lab = String(S.sales.qrLabel || '').trim();
  const web = String(S.company.web || '').trim(), webUrl = web && !/^https?:/i.test(web) ? 'https://' + web : web;
  if (mode === 'url') { const u = String(S.sales.qrUrl || '').trim(); return u ? { data: u, label: lab || 'Termin vereinbaren' } : null; }
  if (mode === 'web') return webUrl ? { data: webUrl, label: lab || 'Mehr erfahren' } : null;
  if (mode === 'vcard') {
    const name = a.name || coName(), parts = name.split(' '), last = parts.length > 1 ? parts.pop() : '', first = parts.join(' ');
    const v = ['BEGIN:VCARD', 'VERSION:3.0', `N:${last};${first}`, `FN:${name}`, `ORG:${coName()}`, a.role ? `TITLE:${a.role}` : '', tel ? `TEL;TYPE=CELL:${tel}` : '', a.email ? `EMAIL:${a.email}` : '', webUrl ? `URL:${webUrl}` : '', 'END:VCARD'].filter(Boolean).join('\n');
    return { data: v, label: lab || 'Kontakt speichern' };
  }
  return tel.length > 6 ? { data: 'tel:' + tel, label: lab || 'Direkt anrufen' } : null;
}
const qrColor = () => (S.sales.qrColor === 'brand' ? mix(S.design.primary, '#000000', 0.25) : S.sales.qrColor === 'custom' ? (S.sales.qrCustom || '#0F2A3D') : '#0F2A3D');
const qrWhere = k => (S.sales.qrWhere || {})[k] !== false;
function qrSvgUri(text, col = qrColor()) {
  if (typeof qrcode !== 'function') return '';
  const q = qrcode(0, 'M'); q.addData(text); q.make();
  const n = q.getModuleCount(), m = 2; let r = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) r += `M${x + m} ${y + m}h1v1h-1z`;
  const W = (n + 2 * m) * 8;
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}" viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${r}" fill="${col}"/></svg>`);
}
function qrBlock(p, mm, force) {
  mm = mm || nz(S.sales.qrSize, 20);
  const t = qrTarget(p, force); if (!t) return '';
  const u = qrSvgUri(t.data); if (!u) return '';
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:1mm;flex-shrink:0"><img src="${u}" style="width:${mm}mm;height:${mm}mm;display:block;border-radius:1.5mm"><div style="font-size:6.8pt;font-weight:600;color:var(--ink2);text-align:center;white-space:nowrap">${esc(t.label)}</div></div>`;
}
const _salesContact14 = salesContact;
salesContact = function (p) { const h = _salesContact14(p), q = qrWhere('why') ? qrBlock(p) : ''; return q ? h.replace(/<div style="font-size:10.5pt;font-weight:700;color:var\(--p\);text-align:right">[^<]*<\/div><\/div>$/, `<div style="display:flex;align-items:center;gap:4mm"><div style="font-size:10pt;font-weight:700;color:var(--p);text-align:right;max-width:45mm">Fragen? Wir sind gern für Sie da.</div>${q}</div></div>`) : h; };
const _advisorCard14 = advisorCard;
advisorCard = function (p, R, compact) { const h = _advisorCard14(p, R, compact), q = qrWhere(compact ? 'sign' : 'contact') ? qrBlock(p, Math.min(nz(S.sales.qrSize, 20), compact ? 15 : 22)) : ''; return q ? h.replace(/<\/div><\/div>\s*$/, `</div>${q}</div>`) : h; };
const _sSign14 = DOC.sSign;
DOC.sSign = function (p, R) { const r = _sSign14(p, R), q = qrWhere('sign') ? qrBlock(p) : ''; if (q) r.body += `<div style="display:flex;justify-content:flex-end;margin-top:5mm">${q}</div>`; return r; };

/* ---------- 8) PDF per E-Mail an den Kunden ---------- */
function mailFill(s, p) {
  const a = advisorOf(p);
  return String(s || '').replace(/\{kunde\}/g, custName(p)).replace(/\{berater\}/g, a.name || '').replace(/\{firma\}/g, coName()).replace(/\{telefon\}/g, a.phone || '').replace(/\{angebot\}/g, p.offer.number || '').replace(/\n{3,}/g, '\n\n').trim();
}
pdfReady = function (blob, name) {
  const p = curProject(), url = URL.createObjectURL(blob), file = new File([blob], name, { type: 'application/pdf' });
  const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
  const subj = p ? mailFill(S.sales.mailSubject, p) : name, body = p ? mailFill(S.sales.mailText, p) : '', to = p ? (p.customer.email || '') : '';
  modal(`<div class="text-center"><div class="w-14 h-14 rounded-full bg-p text-white grid place-items-center mx-auto">${ic('check', 28)}</div><h3 class="text-[20px] font-extrabold mt-4">PDF ist fertig</h3><p class="text-ink3 text-[14px] mt-1 break-all">${esc(name)} · ${num(blob.size / 1024 / 1024, 1)} MB</p>
    <div class="flex flex-col gap-2 mt-6"><button class="btn-p" id="pdf-mail">${ic('share', 17)}Per E-Mail an ${to ? esc(to) : 'den Kunden'}</button>${canShare ? `<button class="btn-s" id="pdf-share">${ic('share', 17)}Teilen / In Dateien sichern</button>` : ''}<a class="btn-s" href="${url}" download="${esc(name)}">${ic('download', 17)}Herunterladen</a><a class="btn-s" href="${url}" target="_blank" rel="noopener">${ic('ext', 17)}Öffnen</a></div>
    <p class="hint text-left mt-3" id="pdf-mail-hint"></p></div>`);
  const sb = $('#pdf-share'); if (sb) sb.onclick = async () => { try { await navigator.share({ files: [file], title: name }); } catch (e) { if (e.name !== 'AbortError') toast('Teilen nicht möglich.', 'err'); } };
  $('#pdf-mail').onclick = async () => {
    if (canShare) {
      try { if (navigator.clipboard && to) await navigator.clipboard.writeText(to).catch(() => {}); await navigator.share({ files: [file], title: subj, text: body }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    const h = $('#pdf-mail-hint'); if (h) h.textContent = 'Die PDF wurde heruntergeladen – bitte in der E-Mail als Anhang hinzufügen.';
  };
  if (canShare && to) { const h = $('#pdf-mail-hint'); if (h) h.textContent = `Tipp: Die E-Mail-Adresse ${to} wird beim Tippen in die Zwischenablage kopiert – im Mail-Programm einfach ins Feld „An“ einfügen.`; }
};

/* ---------- 9) Kleine PDF für E-Mail ---------- */
const pdfSmall = () => !!PERSONAL.pdfSmall;
const smallToggle = () => `<label class="flex items-center gap-2.5 text-[14px] text-ink2 cursor-pointer mt-4"><input type="checkbox" data-a="pdf-small" ${pdfSmall() ? 'checked' : ''}>Für E-Mail verkleinern <span class="text-ink3 text-[12px]">(kleinere Datei, etwas weniger scharf)</span></label>`;
const _pdfChooser14 = pdfChooser;
pdfChooser = function (p) { _pdfChooser14(p); const box = $('.modal-wrap .space-y-3') || $('[data-a=pdf-go]').parentElement; if (box) box.insertAdjacentHTML('afterend', smallToggle()); };
const _docCreate14 = docCreateCard;
docCreateCard = function (p, R) { return _docCreate14(p, R).replace(/<\/div><\/div>$/, `</div>${smallToggle()}<label class="flex items-center gap-2.5 text-[14px] text-ink2 cursor-pointer mt-2"><input type="checkbox" data-a="qr-proj" ${qrOnFor(p) ? 'checked' : ''}>QR-Code im Dokument <span class="text-ink3 text-[12px]">(${esc((QR_MODES.find(m => m[0] === (S.sales.qrMode || 'tel')) || QR_MODES[0])[1])} – einstellbar unter Dokument & Verkauf)</span></label></div>`); };
/* Anlagen verkleinern (für die kleine PDF) */
async function shrinkDataUrl(data, maxW = 1300, q = 0.7) {
  const img = await new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = data; });
  const sc = Math.min(1, maxW / img.naturalWidth), c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', q);
}

/* ---------- 11) Hinweis: neue App-Version verfügbar ---------- */
let updShown = false;
async function checkUpdate() {
  if (updShown || APP_VERSION.startsWith('__') || !navigator.onLine) return;
  try {
    const t = await (await fetch('sw.js?check=' + Date.now(), { cache: 'no-store' })).text(), m = t.match(/VERSION = '(\d+)'/), sv = (t.match(/SEMVER = '([\d.]+)'/) || [])[1];
    if (m && m[1] !== APP_VERSION) {
      updShown = true;
      document.body.insertAdjacentHTML('beforeend', `<div id="upd-bar" class="fixed left-1/2 -translate-x-1/2 z-[60] card px-4 py-3 flex items-center gap-3 shadow-xl" style="bottom:calc(env(safe-area-inset-bottom) + 16px);max-width:calc(100vw - 24px)"><span class="text-[14px]"><b class="font-semibold">${sv ? `Version ${sv} verfügbar.` : 'Neue Version verfügbar.'}</b> <span class="text-ink3">Ihre Daten bleiben erhalten.</span></span><button class="btn-p btn-sm" data-a="app-update">Jetzt aktualisieren</button></div>`);
    }
  } catch (e) { /* offline – später erneut */ }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkUpdate(); });
setInterval(checkUpdate, 30 * 60 * 1000);
setTimeout(checkUpdate, 8000);

/* ---------- Einstellungen: QR-Code personalisieren ---------- */
function qrSettings() {
  const s = S.sales, mode = s.qrMode || 'tel', sample = sampleProject(), t = qrTarget(sample, true), prev = t ? qrSvgUri(t.data) : '';
  const wh = [['contact', 'Kontaktbox (komplette PDF)'], ['sign', '„Angebot annehmen“'], ['why', '„Warum jetzt?“ (Vertriebs-PDF)']];
  return `<div class="rounded-[calc(var(--r)-4px)] bg-raised px-4 mt-2">${toggleRow('Standardmäßig anzeigen', 's:sales.qrOn', 'Aus = nur, wenn Sie ihn im Projekt anhaken.')}</div>
  <div class="grid lg:grid-cols-[minmax(0,1fr)_150px] gap-5 mt-4"><div class="space-y-4">
    <div><span class="lbl">Was steckt im QR-Code?</span>${seg('s:sales.qrMode', QR_MODES, { cls: 'flex-wrap' })}
      <div class="hint">${mode === 'tel' ? 'Der Kunde scannt und ruft direkt seinen Berater an (Telefonnummer aus dem Projekt bzw. Berater-Profil).' : mode === 'vcard' ? 'Der Kunde scannt und speichert Name, Telefon, E-Mail und Firma des Beraters als Kontakt.' : mode === 'web' ? `Führt auf Ihre Website (${esc(S.company.web || 'bitte unter Unternehmen eintragen')}).` : 'Z. B. Ihr Online-Terminkalender, eine Bewertungsseite oder eine Referenzseite.'}</div></div>
    ${mode === 'url' ? field('Link', 's:sales.qrUrl', { ph: 'https://…' }) : ''}
    ${field('Beschriftung unter dem Code', 's:sales.qrLabel', { ph: (QR_MODES.find(m => m[0] === mode) || QR_MODES[0])[0] === 'tel' ? 'Direkt anrufen' : mode === 'vcard' ? 'Kontakt speichern' : mode === 'web' ? 'Mehr erfahren' : 'Termin vereinbaren' })}
    <div><span class="lbl">Farbe</span>${seg('s:sales.qrColor', [['dark', 'Dunkel'], ['brand', 'Hausfarbe'], ['custom', 'Eigene']], { cls: 'flex-wrap' })}${s.qrColor === 'custom' ? `<div class="mt-2"><input type="color" class="w-11 h-11 rounded-[var(--rb)] border border-line2 p-0.5 bg-card cursor-pointer" data-b="s:sales.qrCustom" data-t="color" value="${esc(s.qrCustom || '#0F2A3D')}"></div>` : ''}<div class="hint">Gut scannbar bleibt er mit dunklen, kräftigen Farben.</div></div>
    <label class="block"><span class="lbl flex justify-between">Größe<span class="text-ink3 num" data-rv="s:sales.qrSize">${num(nz(s.qrSize, 20))} mm</span></span><input type="range" class="w-full" min="14" max="30" step="1" data-b="s:sales.qrSize" data-t="r" value="${nz(s.qrSize, 20)}"></label>
    <div><span class="lbl">Wo erscheint er?</span><div class="space-y-2 mt-1">${wh.map(([k, l]) => `<label class="flex items-center gap-2.5 text-[14px] text-ink2 cursor-pointer"><input type="checkbox" data-tgcheck="s:sales.qrWhere.${k}" ${qrWhere(k) ? 'checked' : ''}>${l}</label>`).join('')}</div></div>
  </div><div class="text-center">${prev ? `<img src="${prev}" class="w-[130px] h-[130px] mx-auto rounded-lg border border-line bg-white"><div class="text-[12px] text-ink3 mt-2">${esc(t.label)}</div><div class="hint">Vorschau mit Beispieldaten</div>` : '<div class="hint">Für die Vorschau fehlt noch eine Telefonnummer, Website bzw. ein Link.</div>'}</div></div>`;
}
/* ---------- Einstellungen: Finanzierung, QR-Code, E-Mail ---------- */
const _setDok14 = SET.dokument;
SET.dokument = () => _setDok14() + sCard('euro', 'Finanzierung, QR-Code & E-Mail', 'Vorgaben für alle Projekte – im Projekt einzeln änderbar.', `
  <div class="font-medium text-[15px]">Finanzierung (Ratenrechner)</div><div class="rounded-[calc(var(--r)-4px)] bg-raised px-4 mt-2">${toggleRow('Ratenrechner in der App anbieten', 's:finance.enabled', 'Aus = die Karte „Finanzierung“ verschwindet aus allen Projekten und aus den PDFs.')}</div><div class="grid sm:grid-cols-3 gap-3 mt-3">${field('Effektiver Jahreszins', 's:finance.rate', { t: 'n', unit: '%' })}${field('Laufzeit', 's:finance.years', { t: 'n', unit: 'Jahre' })}</div><div class="mt-3">${field('Hinweis im Dokument', 's:finance.label')}</div>
  <div class="font-medium text-[15px] mt-6">QR-Code im Dokument</div>${qrSettings()}
  <div class="font-medium text-[15px] mt-6">E-Mail an den Kunden</div><div class="mt-2 space-y-3">${field('Betreff', 's:sales.mailSubject')}${area('Text', 's:sales.mailText', 8, { hint: 'Platzhalter: {kunde}, {berater}, {firma}, {telefon}, {angebot}' })}</div>`);
