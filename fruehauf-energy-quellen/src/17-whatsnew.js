/* =========================================================
   „Neu in dieser Version“ – erscheint einmal nach einem Update
   Bei jeder neuen Version: id ändern und Punkte anpassen.
   ========================================================= */
const WN_IMG = {
  house: () => `<div style="width:100%;height:100%">${houseSVG({ style: 'modern', dawn: false, light: 'off', pv: true, hp: true, car: true, bat: true, align: 'xMidYMax' })}</div>`,
  sign: () => `<svg viewBox="0 0 120 80" width="100%" height="100%"><rect width="120" height="80" fill="#0B1118"/><rect x="10" y="14" width="100" height="24" rx="12" fill="#ffffff" opacity=".9"/><text x="20" y="30" font-family="HandSig, cursive" font-size="11" fill="#1B2A4A">Münster, 07.11.</text><text x="20" y="35.5" font-size="3.6" fill="#64788A">Ort, Datum</text>
    <rect x="10" y="44" width="100" height="24" rx="12" fill="#ffffff" opacity=".9"/><path d="M20 58 C28 48 32 62 40 54 S52 48 56 58 C60 64 66 50 76 56" fill="none" stroke="#1B2A4A" stroke-width="1.6" stroke-linecap="round"/><text x="20" y="65.5" font-size="3.6" fill="#64788A">Unterschrift</text></svg>`,
  reviews: () => `<svg viewBox="0 0 120 80" width="100%" height="100%"><rect width="120" height="80" fill="#F5F7FA"/>${[[8, 10], [62, 10], [8, 44]].map(([x, y]) => `<rect x="${x}" y="${y}" width="50" height="28" rx="5" fill="#ffffff"/>${[0, 1, 2, 3, 4].map(i => `<path transform="translate(${x + 5 + i * 6} ${y + 5}) scale(0.22)" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F5A524"/>`).join('')}<rect x="${x + 5}" y="${y + 13}" width="38" height="2.4" rx="1.2" fill="#C9D3DD"/><rect x="${x + 5}" y="${y + 18}" width="30" height="2.4" rx="1.2" fill="#C9D3DD"/><rect x="${x + 5}" y="${y + 23}" width="14" height="2.4" rx="1.2" fill="#0F2A3D"/>`).join('')}</svg>`,
  discount: () => `<svg viewBox="0 0 120 80" width="100%" height="100%"><rect width="120" height="80" fill="#141B24"/><rect x="10" y="10" width="100" height="60" rx="7" fill="#1C2530"/><rect x="16" y="17" width="88" height="22" rx="5" fill="#3A2F17" stroke="#F5A524" stroke-width="1"/><text x="22" y="27" font-size="6" font-weight="700" fill="#ffffff">Sonderrabatt</text><text x="22" y="34" font-size="4.4" fill="#C9D3DD">bis 21.11. – 500 €</text>
    <rect x="86" y="23" width="14" height="8" rx="4" fill="#3FA98C"/><circle cx="96" cy="27" r="3" fill="#ffffff"/><rect x="16" y="45" width="88" height="9" rx="3" fill="#232E3A"/><rect x="16" y="57" width="88" height="9" rx="3" fill="#232E3A"/><text x="21" y="51.5" font-size="4" fill="#C9D3DD">Komplette PDF</text><text x="21" y="63.5" font-size="4" fill="#C9D3DD">Vertriebs-PDF</text></svg>`
};
const WN_BG = { sign: '#0B1118', reviews: '#F5F7FA', discount: '#141B24', house: '#CFE7FA' };
/* Versionen – neueste zuerst. Bei jedem Update: oben eine neue Version eintragen (Nummer +0.01). */
const RELEASES = [
  { version: '1.41', date: '2026-11-07', items: [
    ['version', 'Versionsnummern', 'Die App zeigt jetzt ihre Versionsnummer – unten auf jeder Seite, im Update-Hinweis und unter Einstellungen → Ansicht.'],
    ['archive', 'Versionsarchiv', 'Alle bisherigen Versionen mit ihren Änderungen auf einen Blick – unter Einstellungen → Ansicht → Versionsarchiv.'],
    ['tutorial', 'Tutorial aktualisiert', 'Neue Schritte zu App-Installation, Vertriebs-PDF, Rabatt-Fenster, Finanzierung, E-Mail-Versand und Updates – unter Einstellungen → Ansicht & Tutorial.']
  ] },
  { version: '1.40', date: '2026-11-07', items: [
    ['house', 'Neues Deckblatt-Haus', 'Klassisch oder modern, Licht an oder aus. PV, Wärmepumpe, Speicher und E-Auto mit Wallbox erscheinen automatisch, wenn sie zum Angebot gehören.'],
    ['sign', 'Schönere Unterschriftsfelder', 'Im dunklen PDF mit hellem Hintergrund – Form, Farbe und Stärke einstellbar. Ort und Datum in Handschrift.'],
    ['reviews', '„Das sagen Kunden“', 'Neue letzte Seite mit Ihren Kundenbewertungen – pflegen unter Einstellungen → Dokument & Verkauf.'],
    ['discount', 'Sonderrabatt nicht vergessen', 'Vor jeder PDF erscheint ein Fenster: Rabatt prüfen, Layout wählen, fertig.']
  ] }
];
const WHATS_NEW = { version: RELEASES[0].version, id: RELEASES[0].version, date: RELEASES[0].date };
const verNum = v => { const [a, b] = String(v || '0').split('.').map(Number); return (a || 0) * 1000 + (b || 0); };
WN_IMG.version = () => `<svg viewBox="0 0 120 80" width="100%" height="100%"><rect width="120" height="80" fill="#141B24"/><rect x="22" y="26" width="76" height="28" rx="14" fill="#1C2530" stroke="#3FA98C" stroke-width="1.2"/><text x="60" y="44.5" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">Version ${RELEASES[0].version}</text></svg>`;
WN_IMG.tutorial = () => `<svg viewBox="0 0 120 80" width="100%" height="100%"><rect width="120" height="80" fill="#141B24"/><rect x="30" y="12" width="60" height="56" rx="8" fill="#1C2530"/><rect x="50" y="20" width="20" height="20" rx="5" fill="#232E3A"/><path d="M56 30 h8 M60 26 v8" stroke="#C9D3DD" stroke-width="2" stroke-linecap="round"/><rect x="40" y="46" width="40" height="3" rx="1.5" fill="#C9D3DD"/><rect x="45" y="52" width="30" height="2.4" rx="1.2" fill="#5A6878"/>${[0, 1, 2, 3, 4].map(i => `<circle cx="${50 + i * 5}" cy="61" r="1.4" fill="${i === 1 ? '#3FA98C' : '#5A6878'}"/>`).join('')}</svg>`;
WN_BG.version = '#141B24'; WN_BG.tutorial = '#141B24'; WN_BG.archive = '#141B24';
WN_IMG.archive = () => `<svg viewBox="0 0 120 80" width="100%" height="100%"><rect width="120" height="80" fill="#141B24"/>${[0, 1, 2, 3].map(i => `<text x="22" y="${22 + i * 13}" font-size="6.5" font-weight="700" fill="${i ? '#C9D3DD' : '#3FA98C'}">1.${41 - i}</text><rect x="40" y="${17 + i * 13}" width="${58 - i * 6}" height="3" rx="1.5" fill="#5A6878"/>`).join('')}</svg>`;
function showWhatsNew(all) {
  const seen = verNum(PERSONAL.seenRelease), list = (all ? RELEASES : RELEASES.filter(r => verNum(r.version) > seen)).slice(0, all ? 5 : 3);
  const show = list.length ? list : [RELEASES[0]];
  const block = r => `<div class="mono text-[12px] text-ink3 mt-6 first:mt-0">Version ${r.version} · ${deDate(r.date)}</div>
    <div class="space-y-4 mt-3">${r.items.map(([img, t, x]) => `<div class="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start"><div class="w-full sm:w-[120px] h-[130px] sm:h-[80px] shrink-0 rounded-xl overflow-hidden border border-line" style="background:${WN_BG[img] || 'transparent'}">${WN_IMG[img] ? WN_IMG[img]() : ''}</div><div class="min-w-0"><div class="font-semibold text-[15px]">${esc(t)}</div><div class="text-[13px] text-ink2 mt-0.5 leading-relaxed">${esc(x)}</div></div></div>`).join('')}</div>`;
  modal(`<div><h3 class="h-font text-[26px] pr-8">Neu in Version ${RELEASES[0].version}</h3>${show.length > 1 ? `<p class="text-[13px] text-ink3 mt-1">Dazu die Neuerungen der letzten ${show.length - 1 === 1 ? 'Version' : show.length - 1 + ' Versionen'}.</p>` : ''}
    <div class="mt-5">${show.map(block).join('<div class="border-t border-line mt-6"></div>')}</div>
    <div class="flex justify-end mt-6"><button class="btn-p" data-a="modal-close">Alles klar</button></div></div>`);
  PERSONAL.seenRelease = RELEASES[0].version; savePersonal();
}
function maybeWhatsNew() {
  if (verNum(PERSONAL.seenRelease) >= verNum(RELEASES[0].version)) return;
  if (!PERSONAL.seenRelease && !PROJECTS.length && !PERSONAL.lastBackup) { PERSONAL.seenRelease = RELEASES[0].version; savePersonal(); return; } // ganz neue Installation: nichts zeigen
  if ($('#modal') && $('#modal').innerHTML.trim()) { setTimeout(maybeWhatsNew, 1500); return; }
  showWhatsNew();
}
/* Einstellungen → Ansicht: Neuigkeiten erneut ansehen */
const _setAnsicht17 = SET.ansicht;
SET.ansicht = () => _setAnsicht17() + sCard('sparkle', 'Neuigkeiten', `Sie nutzen Version ${WHATS_NEW.version} vom ${deDate(WHATS_NEW.date)}`, `<div class="flex flex-wrap gap-2"><button class="btn-s" data-a="whatsnew-all">${ic('sparkle', 16)}Was ist neu?</button><button class="btn-g" data-a="archive">${ic('clock', 16)}Versionsarchiv</button></div>`);
