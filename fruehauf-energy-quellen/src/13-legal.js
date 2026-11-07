/* =========================================================
   Rechtliches: Widerrufsbelehrung (folgt im PDF direkt auf
   „Angebot annehmen“), Impressum und Datenschutz in der App
   ========================================================= */
const WIDERRUF_DEFAULT = `## Widerrufsrecht
Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.
Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ({firma}, {adresse}, Telefon {telefon}, E-Mail {email}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief, Telefax oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
## Folgen des Widerrufs
Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen sollen, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.
## Besondere Hinweise
Ihr Widerrufsrecht erlischt vorzeitig, wenn der Vertrag von beiden Seiten auf Ihren ausdrücklichen Wunsch hin vollständig erfüllt ist, bevor Sie Ihr Widerrufsrecht ausgeübt haben.
## Widerruf gegen Entschädigungszahlung
Nach Ablauf der Widerrufsfrist von vierzehn Tagen ist ein Rücktritt vom Kaufvertrag gegen eine Entschädigungszahlung von 5 % des Kaufpreises möglich.`;

const IMPRESSUM_EXTRA_DEFAULT = `## Verbraucherstreitbeilegung
Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.`;

const DATENSCHUTZ_DEFAULT = `## Verantwortlicher
{firma}, {adresse}
Telefon {telefon} · E-Mail {email}
## Worum es geht
Diese Web-App ist ein Arbeitswerkzeug für unsere Energieberater. Sie berechnet die Wirtschaftlichkeit von Photovoltaikanlagen, Stromspeichern und Wärmepumpen und erstellt daraus Kundendokumente.
## Speicherung auf Ihrem Gerät
Alle Eingaben – auch Kundendaten, hochgeladene Angebote, Fotos und Unterschriften – werden ausschließlich lokal im Browser des verwendeten Geräts gespeichert (IndexedDB). Sie werden nicht an uns oder an Dritte übertragen. Eine Weitergabe erfolgt nur, wenn Sie selbst eine Datensicherung, Konfigurationsdatei oder ein PDF exportieren und versenden. Die Angebotserkennung (Texterkennung) läuft vollständig auf dem Gerät.
## Hosting und Server-Logfiles
Die App wird bei Netlify, Inc. (512 2nd Street, Suite 200, San Francisco, CA 94107, USA) bereitgestellt. Beim Aufruf verarbeitet Netlify technisch notwendige Daten wie IP-Adresse, Datum und Uhrzeit, aufgerufene Datei und Browserkennung, um die App auszuliefern und vor Missbrauch zu schützen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und stabilen Betrieb). Die Übermittlung in die USA stützt sich auf das EU-US Data Privacy Framework bzw. die Standardvertragsklauseln der EU-Kommission.
## Solarertrag (PVGIS)
Wenn Sie den Solarertrag für einen Standort berechnen lassen, werden ausschließlich die aus der Postleitzahl ermittelten Koordinaten sowie Dachneigung und -ausrichtung über unseren Server an PVGIS der Gemeinsamen Forschungsstelle der Europäischen Kommission (Joint Research Centre, Ispra, Italien) übermittelt. Namen oder Adressen werden dabei nicht übertragen.
## Keine Cookies, kein Tracking
Die App setzt keine Cookies, verwendet keine Analyse- oder Werbedienste und lädt keine Inhalte von fremden Servern nach. Schriften und Programmbibliotheken werden von unserem eigenen Server geladen.
## Kundendaten
Personenbezogene Daten unserer Kundinnen und Kunden verarbeiten wir zur Erstellung von Angeboten und Berechnungen, also zur Durchführung vorvertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO). Wir löschen sie, sobald sie dafür nicht mehr benötigt werden und keine gesetzlichen Aufbewahrungspflichten bestehen.
## Ihre Rechte
Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO). Wenden Sie sich dazu an die oben genannten Kontaktdaten. Außerdem können Sie sich bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel bei der Landesbeauftragten für den Datenschutz Niedersachsen.`;

const LEGAL_DEFAULT = { withdrawOn: true, withdrawForm: true, withdrawal: WIDERRUF_DEFAULT, imprintExtra: IMPRESSUM_EXTRA_DEFAULT, privacy: DATENSCHUTZ_DEFAULT };
DEFAULT_SETTINGS.legal = clone(LEGAL_DEFAULT);
if (!S.legal) S.legal = clone(LEGAL_DEFAULT);
const legalOf = k => { const v = (S.legal || {})[k]; return v === undefined ? LEGAL_DEFAULT[k] : v; };

/* Platzhalter mit den Firmendaten füllen */
function legalFill(s) {
  const c = S.company, addr = [c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return String(s || '').replace(/\{firma\}/g, coName()).replace(/\{adresse\}/g, addr || '[Adresse]')
    .replace(/\{telefon\}/g, c.phone || '[Telefon]').replace(/\{email\}/g, c.email || '[E-Mail]');
}
/* Einfaches Format: „## Überschrift“, sonst Absätze */
function legalHtml(s, h = 'h3') {
  return legalFill(s).split('\n').map(l => l.trim()).filter(Boolean).map(l => l.startsWith('## ') ? `<${h}>${esc(l.slice(3))}</${h}>` : `<p>${esc(l)}</p>`).join('');
}

/* Widerrufsbelehrung folgt im PDF immer direkt auf „Angebot annehmen“ */
const withdrawActive = () => !!legalOf('withdrawOn') && !!String(legalOf('withdrawal')).trim();
DOC_TEXT.withdraw = { label: 'Widerrufsbelehrung', badge: 'Angebot annehmen', title: 'Widerrufsbelehrung', lead: 'Ihr Recht, diesen Vertrag innerhalb von vierzehn Tagen zu widerrufen.' };
const _visible13 = visiblePages;
visiblePages = function (p, R) {
  const defs = _visible13(p, R);
  if (!withdrawActive()) return defs;
  const i = defs.findIndex(d => d.key === 'sign' || d.key === 'sSign');
  if (i >= 0) defs.splice(i + 1, 0, { key: 'withdraw', label: 'Widerrufsbelehrung', on: true, count: 1 });
  return defs;
};
DOC.withdraw = function (p, R) {
  const sales = CUR_LAYOUT === 'sales', c = S.company, addr = [coName(), c.street, [c.zip, c.city].filter(Boolean).join(' '), c.email].filter(Boolean).join(', ');
  let b = sales ? sChap('withdraw', p, R) : chap(txt('withdraw', 'title'), txt('withdraw', 'lead'));
  b += `<div class="wdr">${legalHtml(legalOf('withdrawal'))}</div>`;
  if (legalOf('withdrawForm')) {
    const ln = l => `<div style="display:flex;gap:3mm;align-items:flex-end;margin-top:3.2mm"><span style="white-space:nowrap">${l}</span><span style="flex:1;border-bottom:0.25mm solid var(--ink3);height:3.5mm"></span></div>`;
    b += `<div class="wdr-form"><div style="font-weight:700;font-size:9.4pt">Muster-Widerrufsformular</div><div style="font-size:7.6pt;color:var(--ink3);margin-top:0.5mm">(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)</div>
      <div style="margin-top:2.5mm">An: ${esc(addr)}</div>
      <div style="margin-top:2mm">Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*) / die Erbringung der folgenden Dienstleistung (*)${p.offer.number ? ` gemäß Angebot ${esc(p.offer.number)}` : ''}:</div>
      ${ln('')}${ln('Bestellt am (*) / erhalten am (*):')}${ln('Name des/der Verbraucher(s):')}${ln('Anschrift des/der Verbraucher(s):')}<div style="display:grid;grid-template-columns:1fr 1.6fr;gap:6mm">${ln('Datum:')}${ln('Unterschrift (nur bei Mitteilung auf Papier):')}</div>
      <div style="font-size:7.2pt;color:var(--ink3);margin-top:2.5mm">(*) Unzutreffendes streichen.</div></div>`;
  }
  return { title: 'Widerrufsbelehrung', body: b };
};
/* Hinweis auf der Seite „Angebot annehmen“ */
const _sign13 = DOC.sign, _sSign13 = DOC.sSign;
const withdrawHint = () => (withdrawActive() ? `<p class="small" style="margin-top:2mm">Die Widerrufsbelehrung${legalOf('withdrawForm') ? ' und das Muster-Widerrufsformular' : ''} finden Sie auf der folgenden Seite.</p>` : '');
DOC.sign = function (p, R) { const r = _sign13(p, R); r.body = r.body.replace('<div style="margin-top:6mm">', withdrawHint() + '<div style="margin-top:6mm">'); return r; };
DOC.sSign = function (p, R) { const r = _sSign13(p, R); r.body += withdrawHint(); return r; };

/* App: Impressum & Datenschutz – für alle sichtbar, bearbeitbar im Admin-Bereich */
STABS.splice(STABS_ME.length, 0, ['recht', 'Impressum & Datenschutz', 'file']);
function imprintHtml() {
  const c = S.company, rows = [];
  rows.push(`<p><b>${esc(coName())}</b>${c.street ? '<br>' + esc(c.street) : ''}${c.zip || c.city ? '<br>' + esc([c.zip, c.city].filter(Boolean).join(' ')) : ''}</p>`);
  if (c.ceo) rows.push(`<p>Vertreten durch: ${esc(c.ceo)}</p>`);
  const kontakt = [c.phone && 'Telefon: ' + esc(c.phone), c.email && 'E-Mail: ' + esc(c.email), c.web && 'Web: ' + esc(c.web)].filter(Boolean);
  if (kontakt.length) rows.push(`<h3>Kontakt</h3><p>${kontakt.join('<br>')}</p>`);
  if (c.register) rows.push(`<h3>Registereintrag</h3><p>${esc(c.register)}</p>`);
  const st = [c.vatId && 'Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: ' + esc(c.vatId), c.taxNo && 'Steuernummer: ' + esc(c.taxNo)].filter(Boolean);
  if (st.length) rows.push(`<h3>Steuern</h3><p>${st.join('<br>')}</p>`);
  return `<p class="text-ink3">Angaben gemäß § 5 DDG</p>${rows.join('')}${legalHtml(legalOf('imprintExtra'))}`;
}
SET.recht = () => {
  const c = S.company, miss = [!c.street && 'Straße', !c.city && 'Ort', !c.phone && 'Telefon', !c.email && 'E-Mail'].filter(Boolean);
  const warn = miss.length ? `<div class="rounded-[calc(var(--r)-4px)] bg-tyel ring-1 ring-s/30 p-4 text-[13.5px] text-ink flex gap-3 mb-5">${ic('info', 18, 'shrink-0 mt-0.5')}<div>Für ein vollständiges Impressum fehlen noch: ${miss.join(', ')}. Bitte unter Einstellungen → Unternehmen eintragen${UI.admin ? '' : ' (Admin-Bereich)'}.</div></div>` : '';
  const edit = UI.admin ? sCard('pen', 'Texte bearbeiten', 'Platzhalter: {firma}, {adresse}, {telefon}, {email} – werden mit den Firmendaten gefüllt. „## “ am Zeilenanfang = Überschrift.', `
      ${area('Impressum – Zusatz (z. B. Berufshaftpflicht, Streitbeilegung)', 's:legal.imprintExtra', 4)}
      <div class="mt-4">${area('Datenschutzerklärung', 's:legal.privacy', 14)}</div>
      <div class="rounded-[calc(var(--r)-4px)] bg-raised px-4 mt-5 divide-y divide-line">${toggleRow('Widerrufsbelehrung im Kundendokument', 's:legal.withdrawOn', 'Steht immer direkt hinter der Seite „Angebot annehmen“ – in der kompletten und in der Vertriebs-PDF.')}${toggleRow('Muster-Widerrufsformular anfügen', 's:legal.withdrawForm')}</div>
      <div class="mt-4">${area('Widerrufsbelehrung', 's:legal.withdrawal', 14)}</div>
      <button class="btn-g mt-3" data-a="legal-reset">${ic('refresh', 15)}Standardtexte wiederherstellen</button>`) : `<div class="hint">Bearbeiten im Admin-Bereich (Einstellungen → Unternehmen bzw. hier nach dem Entsperren).</div>`;
  return sCard('building', 'Impressum', 'So erscheint es in der App.', `${warn}<div class="legal">${imprintHtml()}</div>`)
    + sCard('info', 'Datenschutzerklärung', '', `<div class="legal">${legalHtml(legalOf('privacy'))}</div>`)
    + (UI.admin ? sCard('file', 'Widerrufsbelehrung (Vorschau)', 'Folgt im PDF direkt auf „Angebot annehmen“.', `<div class="legal">${legalHtml(legalOf('withdrawal'))}</div>`) : '')
    + edit;
};
/* Vor dem PDF: fehlende Firmendaten für die Widerrufsbelehrung melden */
const _plaus13 = plausibility;
plausibility = function (p, R) {
  const w = _plaus13(p, R), c = S.company;
  if (withdrawActive() && visiblePages(p, R).some(d => d.key === 'withdraw')) {
    const miss = [!(c.street && c.city) && 'Adresse', !c.phone && 'Telefon', !c.email && 'E-Mail'].filter(Boolean);
    if (miss.length) w.push(`In der Widerrufsbelehrung fehlen Ihre Firmendaten (${miss.join(', ')}). Bitte unter Einstellungen → Unternehmen eintragen.`);
  }
  return w;
};
