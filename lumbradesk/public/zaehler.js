/* lumbra.desk – Zählerschrank-Check
   Foto des Zählerschranks → Scan (Bildqualität + Texterkennung des Typenschilds) → Prüffragen → Ergebnis.
   Bewertung nach VDE-AR-N 4100 Abschnitt 4.4, VDE FNN Hinweis „Zählerplätze in Bestandsanlagen“ (09/2023: Tabelle 1 =
   TAB 2023 Anhang G, Kapitel 5.4, 5.5 und 6) und DIN VDE 0603-2-1. Netzbetreiber zur Adresse über VNBdigital, TAB aus der Liste.
   Ersetzt nicht die Prüfung durch die Elektrofachkraft (z. B. E-CHECK nach DIN VDE 0105-100). */
'use strict';
Object.assign(IC, { zaehler: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><rect x="8" y="5.5" width="8" height="5" rx="1"/><path d="M8 14h8M8 17.5h5"/>', cam: '<path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>' });
if (typeof APP_LOOK === 'object') APP_LOOK.zaehler = { cls: 'ai-amber', glyph: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><rect x="8" y="5.5" width="8" height="5" rx="1"/><path d="M8 14h8M8 17.5h5"/>' };

const ZS = { step: 'start', cust: null, addr: '', plan: { pv: false, bat: false, wp: false, wb: false, klima: false, mess: 'eins' }, photos: [], kinds: [], ocr: '', found: [], quality: null, vnb: null, vnbErr: '', a: {}, custs: null, list: null, tabs: null, view: null, pid: '' };
const ZS_RES = { ok: ['Passt', 'Der vorhandene Zählerschrank darf für das Vorhaben weiter genutzt werden.', '#2F9E44'], fix: ['Weiter nutzbar nach Ertüchtigung', 'Der Zählerschrank darf bleiben, wenn die genannten Maßnahmen umgesetzt werden.', '#F5A524'], neu: ['Neuer Zählerschrank erforderlich', 'Der vorhandene Zählerplatz darf für das Vorhaben nicht weiter verwendet werden.', '#E5484D'], pruefen: ['Vor Ort prüfen', 'Einige Punkte sind noch offen – bitte vor Ort klären, dann steht das Ergebnis.', '#5B8DEF'] };
/* Prüffragen – Reihenfolge wie der Bewertungsablauf im FNN-Hinweis (Bauart → Anschlussräume → Verdrahtung → Trennvorrichtung → Zustand → Platz) */
const ZS_Q = [
  { id: 'bau', q: 'Welche Bauart ist der Zählerplatz?', help: 'Steht oft auf dem Typenschild innen in der Tür oder am Rahmen.', o: [
    ['tafel_offen', 'Offene Zählertafel / Holzbrett', 'Zähler auf Brett oder Tafel ohne Schrank, keine Schutzklasse II'], ['tafel_43853', 'Zählertafel nach DIN 43853', 'Kunststoff-Tafel, ab 1961, ohne Schrank'], ['tafel_vors', 'Normzählertafel mit Vorsicherung', 'Tafel mit Schutzklasse II'],
    ['s43870', 'Zählerschrank nach DIN 43870', 'Zählerfeld 250 mm breit, schwarzer Ferraris-/Dreipunkt-Zähler am Zählerkreuz, ca. 1977 – 2017'], ['s0603', 'Zählerschrank nach DIN VDE 0603', 'Dreipunkt oder Stecktechnik, mit Trennvorrichtung'], ['s4100', 'Zählerschrank nach VDE-AR-N 4100', 'kleiner elektronischer Zähler (eHZ) auf Steckadapter (BKE-I), RfZ-Feld oben, ab ca. 2019'], ['unklar', 'Weiß ich nicht', '']] },
  { id: 'nar', q: 'Wie hoch ist der untere (netzseitige) Anschlussraum?', help: 'Untere Abdeckung unter dem Zähler messen. Nur Zählerplätze mit 300 mm dürfen nach FNN-Hinweis ertüchtigt werden.', show: a => a.bau === 's43870', o: [['300', '300 mm', 'Variante 2 oder 3'], ['150', '150 mm', 'Variante 1'], ['unklar', 'Nicht gemessen', '']] },
  { id: 'aar', q: 'Wie hoch ist der obere (anlagenseitige) Anschlussraum?', help: 'Obere Abdeckung über dem Zähler.', show: a => ['s43870', 's0603'].includes(a.bau), o: [['300', '300 mm', ''], ['150', '150 mm', ''], ['unklar', 'Nicht gemessen', '']] },
  { id: 'aarVert', q: 'Sitzen im oberen Anschlussraum Sicherungen für Stromkreise?', help: 'Der anlagenseitige Anschlussraum darf nicht als Stromkreisverteiler genutzt werden (FNN 6.5).', show: a => ['s43870', 's0603'].includes(a.bau), o: [['nein', 'Nein', 'nur Hauptschalter / Klemmen'], ['ja', 'Ja', 'LS-Schalter für Stromkreise'], ['unklar', 'Unklar', '']] },
  { id: 'verd', q: 'Zählerplatzverdrahtung: flexibel, mindestens 10 mm²?', help: 'DIN VDE 0603-2-1: mindestens H07V-K mit 10 mm² (FNN 6.2). Aufdruck auf der Ader prüfen.', show: a => ['s43870', 's0603'].includes(a.bau), o: [['ja', 'Ja, H07V-K ≥ 10 mm²', ''], ['nein', 'Nein', 'starr oder kleiner als 10 mm²'], ['unklar', 'Nicht erkennbar', '']] },
  { id: 'nl', q: 'Neutralleiter durchgehend vom unteren zum oberen Anschlussraum?', help: 'Er darf nicht über den Zähler durchgeschleift sein und beim Zählerwechsel nicht unterbrochen werden (FNN 6.2).', show: a => ['s43870', 's0603'].includes(a.bau), o: [['ja', 'Ja, durchgehend', ''], ['nein', 'Nein, über den Zähler', ''], ['unklar', 'Unklar', '']] },
  { id: 'trenn', q: 'Welche Trennvorrichtung ist vorhanden?', help: 'Bei Dreipunkt-Zählerplätzen ohne Zählersteckklemme muss eine laienbedienbare Trennvorrichtung im oberen Anschlussraum sein (FNN 6.5). Nach DIN VDE 0603 / VDE-AR-N 4100: selektive Überstrom-Schutzeinrichtung (SH-Schalter).', show: a => ['s43870', 's0603'].includes(a.bau), o: [['sh', 'SH-Schalter (selektiv)', 'z. B. 35 A / 50 A / 63 A'], ['hs', 'Hauptschalter', 'Lasttrennschalter'], ['nein', 'Keine', 'nur Schraubsicherungen'], ['unklar', 'Unklar', '']] },
  { id: 'zust', q: 'Zustand des Zählerschranks', help: 'Sichtprüfung: Beschädigungen, Farb- und Formveränderungen, fehlende Abdeckungen (FNN 6.1).', o: [['gut', 'In Ordnung', ''], ['maengel', 'Mängel', 'Abdeckung fehlt, lose, beschädigt'], ['brand', 'Schmorstellen / Verfärbung', 'Hitzeschäden']] },
  { id: 'phase', q: 'Wie ist der Zählerplatz angeschlossen?', help: 'Die Umstellung auf Drehstrom ist eine Änderung nach TAB Anhang G.', o: [['drei', 'Dreiphasig (Drehstrom)', ''], ['ein', 'Einphasig', ''], ['unklar', 'Unklar', '']] },
  { id: 'platz', q: 'Platz für einen weiteren Zählerplatz?', help: 'Für den eigenen Zähler (Wärmepumpe / § 14a Modul 2) wird ein zusätzlicher Zählerplatz gebraucht.', show: (a, P) => zsMeters(P) > 1, o: [['frei', 'Freier Zählerplatz vorhanden', ''], ['anbau', 'Schrank kann erweitert werden', 'Anreihen möglich'], ['nein', 'Kein Platz', ''], ['unklar', 'Unklar', '']] },
  { id: 'apz', q: 'Ist ein APZ-Feld vorhanden?', help: 'Betriebsvorgabe für Anmeldung und Umsetzung: Raum für den Abschlusspunkt Zählerplatz (APZ) – Kommunikationsanschluss für Smart-Meter-Gateway/Steuerbox.', show: a => !zsTafel(a), o: [['ja', 'Ja, vorhanden', 'APZ-Modul bzw. Raum für APZ (meist oben im Verteilerfeld)'], ['nachr', 'Nachrüstbar', 'Platz für APZ-Feld/-Modul vorhanden'], ['nein', 'Nein', ''], ['unklar', 'Unklar', '']] },
  { id: 'rfz', q: 'Ist ein RfZ-Feld (Raum für Zusatzanwendungen) vorhanden?', help: 'Betriebsvorgabe: RfZ oberhalb des Zählerplatzes für Smart-Meter-Gateway, Steuerbox nach § 14a EnWG bzw. Rundsteuerempfänger.', show: a => !zsTafel(a), o: [['ja', 'Ja, vorhanden', ''], ['nachr', 'Nachrüstbar', 'z. B. RfZ-Aufsatz'], ['nein', 'Nein', ''], ['unklar', 'Unklar', '']] },
  { id: 'hut', q: 'Hutschienen im anlagenseitigen Anschlussraum (AAR) oberhalb des Zählerplatzes?', help: 'Betriebsvorgabe: mindestens 2 Hutschienen im AAR oberhalb des Zählerplatzes (z. B. für SH-Schalter, Trennvorrichtung, Freigaberelais).', show: a => !zsTafel(a), o: [['2', '2 oder mehr', ''], ['1', 'Nur 1', ''], ['0', 'Keine', ''], ['nachr', 'Nachrüstbar', 'AAR hoch genug für 2 Schienen'], ['unklar', 'Unklar', '']] },
  { id: 'spd', q: 'Überspannungsschutz (Typ 1) vorhanden?', help: 'Im netzseitigen (unteren) Anschlussraum – meist ein rotes Modul neben der Hauptleitungsabzweigklemme.', o: [['ja', 'Ja', ''], ['nein', 'Nein', ''], ['unklar', 'Unklar', '']] },
  { id: 'bereich', q: 'Ist vor dem Schrank 1,2 m frei (Arbeits- und Bedienbereich)?', help: 'TAB: 1,2 m tief, mindestens 2 m hoch (FNN 5.4).', o: [['ja', 'Ja', ''], ['nein', 'Nein', '']] },
  { id: 'ort', q: 'Hängt der Zählerschrank im Treppenhaus oder Flucht-/Rettungsweg?', help: 'Dann gelten Leitungsanlagenrichtlinie und Landesbauordnung (FNN 4.2.1).', o: [['nein', 'Nein', ''], ['ja', 'Ja', '']] }
];
function zsAiHTML(A, live) {
  const G = { konform: ['Laut Foto konform', '#2F9E44'], nicht_konform: ['Laut Foto nicht konform', '#E5484D'], unklar: ['Laut Foto nicht eindeutig', '#5B8DEF'] }[A.gesamt] || ['', '#5B8DEF'];
  return `<div class="cardx zs-card zs-ai" style="--c:${G[1]}"><div class="zs-aih"><span class="zs-dot"></span><div><b>KI-Bildanalyse: ${G[0]}</b><span class="muted small">${esc(A.kurzfazit || '')}</span></div></div>
    <ul class="zs-bf">${(A.befunde || []).map(b => `<li class="${b.status}"><i>${b.status === 'ok' ? '✓' : b.status === 'mangel' ? '✗' : '?'}</i><span><b>${esc(b.punkt)}</b> ${esc(b.text)}</span></li>`).join('')}</ul>
    <p class="muted small" style="margin:8px 0 0">${A.zaehlerplaetze ? `${A.zaehlerplaetze} Zählerplatz/-plätze erkannt${A.freie_zaehlerplaetze ? `, davon ${A.freie_zaehlerplaetze} frei` : ''}${A.zaehlerart ? ' · ' + esc(A.zaehlerart) : ''}. ` : ''}${live ? 'Die Antworten unten sind vorausgefüllt – bitte prüfen und ergänzen.' : ''}</p></div>`;
}
const zsTafel = a => ['tafel_offen', 'tafel_43853', 'tafel_vors'].includes(a.bau);
const zsMeters = P => (P.wp || P.wb) ? (P.mess === 'zwei' ? 3 : P.mess === 'wp' ? 2 : 1) : 1;
const zsSteuVE = P => P.wp || P.wb;
const zsChange = P => P.pv || P.bat || P.wp || P.wb || P.klima;

/* ---------- Bewertung ---------- */
function zsEval(a, P) {
  const neu = [], fix = [], open = [], notes = [], src = new Set(['VDE-AR-N 4100 Abschnitt 4.4', 'VDE FNN Hinweis „Zählerplätze in Bestandsanlagen“ (09/2023)']);
  const tafel = ['tafel_offen', 'tafel_43853', 'tafel_vors'].includes(a.bau), dauer = P.pv || P.bat || P.wp || P.wb || P.klima;
  if (!zsChange(P)) notes.push('Keine Änderung geplant: Für den unveränderten Bestand gilt kein Anpassungszwang – trotzdem Zustand prüfen.');
  if (!a.bau || a.bau === 'unklar') open.push('Bauart des Zählerplatzes bestimmen (Typenschild, Maße).');
  if (tafel) { neu.push('Zählertafeln (DIN 43853, auch mit Vorsicherung) dürfen bei Leistungserhöhung, Umstellung auf Drehstrom oder Erzeugungsanlagen/Ladeeinrichtungen nicht weiter verwendet werden.'); src.add('TAB 2023 Anhang G / FNN Tabelle 1'); }
  if (a.bau === 's43870') {
    src.add('TAB 2023 Anhang G / FNN Tabelle 1');
    if (a.nar === '150') neu.push('Netzseitiger Anschlussraum nur 150 mm: Nach FNN-Hinweis 6.1 sind nur Zählerplätze nach DIN 43870 mit 300 mm netzseitigem Anschlussraum ertüchtigbar.');
    else if (a.nar !== '300') open.push('Höhe des netzseitigen (unteren) Anschlussraums messen – 150 mm oder 300 mm?');
    notes.push('DIN 43870: Weiterbetrieb nur unter Beachtung der Vorgaben des Netzbetreibers (TAB, Fußnote b).');
  }
  if (['s43870', 's0603'].includes(a.bau)) {
    if (a.verd === 'nein') fix.push('Zählerplatzverdrahtung erneuern: flexibel H07V-K, mindestens 10 mm² (DIN VDE 0603-2-1, FNN 6.2).'); else if (a.verd !== 'ja') open.push('Querschnitt und Art der Zählerplatzverdrahtung prüfen (mind. 10 mm² flexibel).');
    if (a.nl === 'nein') fix.push('Neutralleiter durchgehend vom netz- zum anlagenseitigen Anschlussraum führen – nicht über den Zähler (FNN 6.2).'); else if (a.nl !== 'ja') open.push('Führung des Neutralleiters prüfen.');
    if (a.aarVert === 'ja' && dauer) fix.push(a.aar === '150' ? 'Oberer Anschlussraum 150 mm: Bei Dauerstromanwendungen nur Klemmen für die Zuleitung zur Unterverteilung zulässig – Stromkreise in ein Verteilerfeld zurückbauen (FNN 6.5).' : 'Stromkreise aus dem anlagenseitigen Anschlussraum in ein Verteilerfeld zurückbauen (FNN 6.5).');
    else if (a.aarVert === 'unklar') open.push('Bestückung des oberen Anschlussraums prüfen.');
    if (a.bau === 's0603' && a.trenn !== 'sh' && a.trenn !== 'unklar') fix.push('Selektive Überstrom-Schutzeinrichtung (SH-Schalter) nach VDE-AR-N 4100 einbauen (TAB Anhang G, Fußnote a).');
    if (a.trenn === 'nein') fix.push('Laienbedienbare Trennvorrichtung (Hauptschalter bzw. SH-Schalter) im anlagenseitigen Anschlussraum nachrüsten (FNN 6.5).');
    if (a.trenn === 'unklar' || !a.trenn) open.push('Trennvorrichtung prüfen (SH-Schalter / Hauptschalter).');
    src.add('DIN VDE 0603-2-1');
  }
  if (a.zust === 'brand') neu.push('Schmorstellen bzw. Hitzeschäden: Der Zählerplatz ist nicht mehr sicher – erneuern.');
  if (a.zust === 'maengel') fix.push('Sichtbare Mängel beseitigen (Abdeckungen, Befestigung, Schutzklasse II) und Anlage prüfen (E-CHECK nach DIN VDE 0105-100).');
  if (a.phase === 'ein') { if (!tafel) fix.push('Umstellung des Zählerplatzes auf Drehstrom.'); src.add('TAB 2023 Anhang G / FNN Tabelle 1'); }
  if (zsMeters(P) > 1) {
    if (a.platz === 'nein') neu.push('Kein Platz für den zusätzlichen Zählerplatz. Alternative nach FNN 5.5: Hauptleitungsverteiler neben dem Hausanschlusskasten und neuer Zählerplatz für den erweiterten Anlagenteil (Hauptleitung mind. 63 A).');
    else if (a.platz === 'anbau') fix.push('Zählerschrank um einen Zählerplatz erweitern (anreihen).'); else if (a.platz !== 'frei') open.push('Platz für den zusätzlichen Zählerplatz prüfen.');
  }
  /* Betriebsvorgabe Frühauf: APZ-Feld, RfZ-Feld und 2 Hutschienen im AAR oberhalb des Zählerplatzes – sonst keine Anmeldung/Umsetzung */
  if (!zsTafel(a)) {
    const bv = [['apz', 'Es ist kein APZ-Feld vorhanden', 'APZ-Feld nachrüsten', 'Ist ein APZ-Feld vorhanden?'], ['rfz', 'Es ist kein RfZ-Feld vorhanden', 'RfZ-Feld nachrüsten', 'Ist ein RfZ-Feld vorhanden?'],
      ['hut', 'Oberhalb des Zählerplatzes sind keine 2 Hutschienen im AAR', '2. Hutschiene im AAR oberhalb des Zählerplatzes nachrüsten', 'Sind 2 Hutschienen im AAR oberhalb des Zählerplatzes vorhanden?']];
    for (const [k, miss0, nach, frage] of bv) {
      const v = a[k], miss = k === 'hut' ? (v === '1' || v === '0') : v === 'nein';
      if (miss) neu.push(`Betriebsvorgabe nicht erfüllt: ${miss0} – ohne das keine Anmeldung bzw. Umsetzung.`);
      else if (v === 'nachr') fix.push(`Betriebsvorgabe: ${nach}.`);
      else if (!v || v === 'unklar') open.push(`Betriebsvorgabe prüfen: ${frage}`);
    }
    if (a.aar === '150' && a.hut !== '2') notes.push('Ein oberer Anschlussraum von 150 mm bietet in der Regel keinen Platz für 2 Hutschienen.');
    if (zsSteuVE(P)) notes.push('Wärmepumpe / Wallbox über 4,2 kW sind steuerbare Verbrauchseinrichtungen nach § 14a EnWG – Steuerbox im RfZ, Spannungsversorgung von RfZ und APZ nach VDE-AR-N 4100 (Abschnitte 7.7/7.8, FNN 6.4).');
    src.add('Betriebsvorgabe: APZ-Feld, RfZ-Feld, 2 Hutschienen im AAR');
  }
  if (a.spd === 'nein') fix.push('Überspannungs-Schutzeinrichtung Typ 1 in der Hauptstromversorgung vorsehen.');
  if (a.bereich === 'nein') notes.push('Arbeits- und Bedienbereich (1,2 m) fehlt – mit dem Netzbetreiber abstimmen (FNN 5.4).');
  if (a.ort === 'ja') notes.push('Treppenhaus / Rettungsweg: Erweiterung kann als zusätzliche Brandlast gelten – mit der Bauaufsicht klären (LAR, FNN 4.2.1).');
  if (P.wp) notes.push('Wärmepumpen, PV, Speicher und Ladeeinrichtungen sind Dauerstromanwendungen – Betriebsmittel nach VDE-AR-N 4100 Tabelle 7 und unter Berücksichtigung der Gleichzeitigkeit auswählen (FNN 6.3).');
  const result = neu.length ? 'neu' : open.length ? 'pruefen' : fix.length ? 'fix' : 'ok';
  if (result === 'fix' && fix.length >= 4) notes.unshift('Viele Maßnahmen nötig – ein neuer Zählerschrank ist oft wirtschaftlicher.');
  return { result, neu, fix, open, notes, src: [...src] };
}
/* Empfehlung neuer Zählerschrank: Zählerfelder + Verteilerfeld (mit Raum für APZ) */
function zsCabinet(P) {
  const m = zsMeters(P), fields = m + 1, parts = [P.pv ? 'Zweirichtungszähler (Bezug + Einspeisung)' : 'Haushaltszähler'];
  if (m >= 2) parts.push(P.mess === 'zwei' ? 'Zähler Wärmepumpe' : 'Zähler Wärmepumpe / steuerbare Verbrauchseinrichtung (§ 14a Modul 2 bzw. WP-Tarif)'); if (m >= 3) parts.push('Zähler Wallbox');
  parts.push('je Zählerplatz: RfZ oben und anlagenseitiger Anschlussraum mit mind. 2 Hutschienen');
  return { m, fields, parts };
}
function zsCabSVG(c, big) {
  const W = 62, H = 150, g = 6, n = c.fields, tw = n * W + (n - 1) * g + 12;
  const col = (i, lab, verteiler) => { const x = 6 + i * (W + g);
    return verteiler ? `<rect x="${x}" y="6" width="${W}" height="${H}" rx="4" class="zc-f"/><rect x="${x + 6}" y="12" width="${W - 12}" height="22" rx="2" class="zc-apz"/><text x="${x + W / 2}" y="27" class="zc-t">APZ</text>${[48, 72, 96, 120].map(y => `<rect x="${x + 6}" y="${y}" width="${W - 12}" height="14" rx="2" class="zc-ls"/>`).join('')}<text x="${x + W / 2}" y="${H + 2}" class="zc-t">Verteiler</text>`
      : `<rect x="${x}" y="6" width="${W}" height="${H}" rx="4" class="zc-f"/><rect x="${x + 6}" y="12" width="${W - 12}" height="18" rx="2" class="zc-rfz"/><text x="${x + W / 2}" y="25" class="zc-t">RfZ</text><rect x="${x + 10}" y="40" width="${W - 20}" height="52" rx="4" class="zc-z"/><text x="${x + W / 2}" y="70" class="zc-t zc-tz">${lab}</text><rect x="${x + 6}" y="100" width="${W - 12}" height="20" rx="2" class="zc-ar"/><rect x="${x + 6}" y="124" width="${W - 12}" height="20" rx="2" class="zc-ar"/><text x="${x + W / 2}" y="${H + 2}" class="zc-t">Zählerplatz</text>`; };
  const labs = ['Z1', 'Z2', 'Z3'];
  return `<svg class="zc-svg ${big ? 'big' : ''}" viewBox="0 0 ${tw} ${H + 14}" role="img" aria-label="${n}-feldiger Zählerschrank">${[...Array(c.m)].map((_, i) => col(i, labs[i])).join('')}${col(c.m, '', true)}</svg>`;
}

/* ---------- Laden ---------- */
async function zsLoad(arg) {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  ZS.view = null;
  if (h[1] && h[1] !== 'neu') { ZS.view = await api('zs-get&id=' + encodeURIComponent(h[1])); return; }
  if (!ZS.custs) { try { ZS.custs = (await api('ab-customers')).customers; } catch (e) { ZS.custs = []; } }
  try { const j = await api('zs-list'); ZS.list = j.list; ZS.tabs = j.tabs; ZS.aiOn = !!j.ai; } catch (e) { ZS.list = []; }
  if (h[1] === 'neu' && h[2] && h[2] !== ZS.pid) { zsReset(); ZS.pid = h[2]; const c = ZS.custs.find(x => x.id === h[2]); if (c) zsPickCust(c, true); }
  if (!h[1] && ZS.step === 'start' && !ZS.cust) zsReset();
}
function zsReset() { Object.assign(ZS, { step: 'start', cust: null, addr: '', plan: { pv: false, bat: false, wp: false, wb: false, klima: false, mess: 'eins' }, photos: [], kinds: [], ocr: '', found: [], quality: null, vnb: null, vnbErr: '', a: {}, ai: null, aiErr: '', pid: '' }); }
function zsPickCust(c, silent) {
  ZS.cust = c; ZS.addr = [c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const t = c.type || ''; ZS.plan.pv = /pv/.test(t); ZS.plan.wp = /wp/.test(t);
  if (ZS.addr) zsVnb(); if (!silent) zsRender();
}
async function zsVnb() {
  ZS.vnb = null; ZS.vnbErr = ''; const q = ZS.addr; if (!q) return;
  try { const j = await api('zs-vnb&q=' + encodeURIComponent(q)); if (q !== ZS.addr) return; ZS.vnb = j.found ? j : null; if (!j.found) ZS.vnbErr = 'Für diese Adresse hat VNBdigital keinen Netzbetreiber geliefert.'; }
  catch (e) { ZS.vnbErr = e.message; }
  const el = $('#zs-vnb'); if (el) el.outerHTML = zsVnbHTML();
}
function zsVnbHTML() {
  const V = ZS.vnb && ZS.vnb.vnb, T = ZS.vnb && ZS.vnb.tab;
  if (!ZS.addr) return '<div id="zs-vnb" class="zs-vnb muted small">Adresse eingeben – dann wird der Netzbetreiber über VNBdigital ermittelt.</div>';
  if (!V && !ZS.vnbErr) return '<div id="zs-vnb" class="zs-vnb muted small">Netzbetreiber wird über VNBdigital ermittelt …</div>';
  if (!V) return `<div id="zs-vnb" class="zs-vnb"><span class="muted small">${esc(ZS.vnbErr)}</span> <a href="https://www.vnbdigital.de/" target="_blank" rel="noopener">VNBdigital öffnen</a></div>`;
  return `<div id="zs-vnb" class="zs-vnb"><div class="zs-vh">${ic('home', 16)}<b>${esc(V.name)}</b><span class="muted small">Netzbetreiber laut VNBdigital</span></div>
    <div class="zs-vl">${T ? `<a href="${esc(T.url)}" target="_blank" rel="noopener">${ic('offer', 14)}${esc(T.name || 'TAB öffnen')}</a>` : V.website ? `<a href="${esc(V.website)}" target="_blank" rel="noopener">${ic('offer', 14)}TAB auf ${esc(V.website.replace(/^https?:\/\/(www\.)?/, ''))} suchen</a>` : ''}
    ${V.phone ? `<a href="tel:${esc(V.phone)}">${ic('phone', 14)}${esc(V.phone)}</a>` : ''}${V.email ? `<a href="mailto:${esc(V.email)}">${ic('mail', 14)}${esc(V.email)}</a>` : ''}</div>
    ${T && T.note ? `<p class="muted small" style="margin:6px 0 0">${esc(T.note)}</p>` : ''}${V.more && V.more.length ? `<p class="muted small" style="margin:4px 0 0">Weitere im Gebiet: ${esc(V.more.join(', '))}</p>` : ''}</div>`;
}

/* ---------- Ansichten ---------- */
function viewZaehler() {
  if (ZS.view) return zsSavedHTML(ZS.view);
  const steps = [['start', 'Kunde & Vorhaben'], ['foto', 'Foto & Scan'], ['fragen', 'Prüfung'], ['ergebnis', 'Ergebnis']], k = steps.findIndex(s => s[0] === ZS.step);
  const head = `<section class="hero zs-hero"><div><h1>Zählerschrank-Check</h1><p class="muted">Foto aufnehmen, Merkmale prüfen, Ergebnis nach VDE-AR-N 4100, DIN VDE 0603 und der TAB des Netzbetreibers.</p></div>${['admin', 'buero'].includes(ST.user.role) ? `<button class="btn s sm" data-zs="tabs">${ic('edit', 15)}TAB-Liste</button>` : ''}</section>
    <div class="zs-steps">${steps.map(([s, l], i) => `<span class="${i < k ? 'done' : i === k ? 'on' : ''}"><i>${i + 1}</i>${l}</span>`).join('')}</div>`;
  return head + (ZS.step === 'start' ? zsStart() : ZS.step === 'foto' ? zsFoto() : ZS.step === 'fragen' ? zsFragen() : zsErgebnis());
}
function zsStart() {
  const P = ZS.plan, chk = (k, l, d) => `<label class="zs-pl ${P[k] ? 'on' : ''}"><input type="checkbox" data-zp="${k}" ${P[k] ? 'checked' : ''}><b>${l}</b><span>${d}</span></label>`;
  return `<div class="cardx zs-card"><div class="h3x">Kunde</div>
      ${ZS.cust ? `<div class="zs-cust"><div><b>${ZS.cust.kdnr ? esc(ZS.cust.kdnr) + ' · ' : ''}${esc(ZS.cust.name)}</b><span class="muted small">${esc(ZS.addr || 'ohne Adresse')}</span></div><button class="btn g sm" data-zs="cust-x">Ändern</button></div>`
        : `<div class="pl-cust"><input id="zs-cq" placeholder="Name oder Kundennummer …" autocomplete="off"><div id="zs-cl" class="pl-cl"></div></div><label>oder Adresse ohne Kunde<input id="zs-addr" placeholder="Straße Nr., PLZ Ort" value="${esc(ZS.addr)}"></label>`}
      ${zsVnbHTML()}</div>
    <div class="cardx zs-card"><div class="h3x">Was ist geplant?</div><div class="zs-pls">${chk('pv', 'Photovoltaik', 'Einspeisung')}${chk('bat', 'Speicher', 'Batterie')}${chk('wp', 'Wärmepumpe', '§ 14a steuerbar')}${chk('wb', 'Wallbox', 'Ladeeinrichtung')}${chk('klima', 'Klimagerät', 'Dauerstrom')}</div>
      ${zsSteuVE(P) ? `<div class="h3x" style="margin-top:14px">Messung für Wärmepumpe / Wallbox</div><div class="seg zs-seg">${[['eins', 'Ein Zähler für alles'], ['wp', 'Eigener Zähler WP (§ 14a Modul 2 / WP-Tarif)'], ['zwei', 'Eigene Zähler für WP und Wallbox']].filter(([k]) => k !== 'zwei' || (P.wp && P.wb)).map(([k, l]) => `<button class="${P.mess === k ? 'on' : ''}" data-zs="mess" data-v="${k}">${l}</button>`).join('')}</div>` : ''}
      <p class="muted small" style="margin:10px 0 0">Daraus ergibt sich die Empfehlung für einen neuen Schrank: <b>${zsCabinet(P).fields}-feldig</b> (${zsCabinet(P).m} ${zsCabinet(P).m > 1 ? 'Zählerplätze' : 'Zählerplatz'} + Verteilerfeld mit APZ).</p></div>
    <div class="zs-act"><button class="btn" data-zs="go-foto" ${zsChange(P) ? '' : ''}>${ic('cam', 18)}Weiter zum Foto</button></div>
    ${(ZS.list || []).length ? `<section class="h-sec"><h2>Letzte Checks</h2></section><div class="glist">${ZS.list.slice(0, 8).map(x => `<a class="grow" href="#/zaehler/${x.id}"><span class="gic" style="color:${ZS_RES[x.result][2]}">${ic('zaehler', 16)}</span><span class="gmain"><b>${esc(x.title)}</b><span>${esc(ZS_RES[x.result][0])}${x.fields ? ' · ' + x.fields + '-feldig' : ''} · ${utc(x.at).toLocaleDateString('de-DE')}</span></span>${ic('next', 16)}</a>`).join('')}</div>` : ''}`;
}
function zsFoto() {
  const slot = (kind, l, d) => `<label class="zs-add ${kind}">${ic('cam', 26)}<b>${l}</b><span>${d}</span><input type="file" accept="image/*" capture="environment" data-zf="${kind}" hidden></label>`;
  return `<div class="cardx zs-card"><div class="h3x">Fotos des Zählerschranks</div><p class="muted small" style="margin:2px 0 10px">1. Gesamtansicht mit offener Tür – dient als Dokumentation und liegt bei den Fragen daneben. 2. Optional eine Nahaufnahme vom Typenschild (innen an der Tür oder am Rahmen) – die wird automatisch gelesen.</p>
      <div class="zs-ph">${ZS.photos.map((p, i) => `<div class="zs-th"><img src="${p}" alt="Foto ${i + 1}"><em>${ZS.kinds[i] === 'schild' ? 'Typenschild' : 'Gesamtansicht'}</em><button class="xbtn" data-zs="ph-del" data-v="${i}" aria-label="Foto entfernen">${ic('x', 14)}</button></div>`).join('')}
        ${ZS.photos.length < 4 ? (ZS.kinds.includes('gesamt') ? '' : slot('gesamt', 'Gesamtansicht', 'Tür offen, ganzer Schrank')) + slot('schild', 'Typenschild', 'Nahaufnahme, scharf') : ''}</div></div>
    <div class="zs-act"><button class="btn s" data-zs="back" data-v="start">Zurück</button><button class="btn" data-zs="scan" ${ZS.photos.length ? '' : 'disabled'}>${ic('search', 18)}Scannen</button></div>`;
}
function zsFragen() {
  const a = ZS.a, P = ZS.plan, qs = ZS_Q.filter(q => !q.show || q.show(a, P));
  const gi = ZS.kinds.indexOf('gesamt'), ph = ZS.photos[gi >= 0 ? gi : 0];
  const aiCard = ZS.ai ? zsAiHTML(ZS.ai, true) : ZS.aiErr ? `<div class="note err">${esc(ZS.aiErr)} – bitte die Fragen von Hand beantworten.</div>` : '';
  return `${ph ? `<a class="zs-peek" href="${ph}" target="_blank" title="Foto groß öffnen"><img src="${ph}" alt="Gesamtansicht"><span>${ic('search', 14)}Foto ansehen</span></a>` : ''}${aiCard}${ZS.found.length || ZS.quality ? `<div class="cardx zs-card zs-found"><div class="h3x">Aus dem Foto erkannt</div><div class="chips2">${ZS.found.map(f => `<span class="chip on">${esc(f)}</span>`).join('') || `<span class="muted small">${ZS.kinds.includes('schild') ? 'Typenschild nicht lesbar – näher heran, gerade und scharf fotografieren, oder' : 'Kein Typenschild-Foto –'} die Merkmale anhand des Fotos bestätigen.</span>`}</div>${ZS.quality && ZS.quality.warn ? `<p class="note err" style="margin:8px 0 0">${esc(ZS.quality.warn)}</p>` : ''}</div>` : ''}
    ${qs.map(q => `<div class="cardx zs-card zs-q"><b>${esc(q.q)}${ZS.ai && ZS.ai[q.id] && ZS.ai[q.id] !== 'unklar' && ZS.ai[q.id] === a[q.id] ? ' <span class="zs-kib">aus Foto</span>' : ''}</b>${q.help ? `<span class="muted small">${esc(q.help)}</span>` : ''}<div class="zs-opts">${q.o.map(([v, l, d]) => `<button class="zs-o ${a[q.id] === v ? 'on' : ''}" data-zs="ans" data-q="${q.id}" data-v="${v}"><b>${esc(l)}</b>${d ? `<span>${esc(d)}</span>` : ''}</button>`).join('')}</div></div>`).join('')}
    <div class="zs-act"><button class="btn s" data-zs="back" data-v="foto">Zurück</button><button class="btn" data-zs="eval">${ic('check', 18)}Auswerten</button></div>`;
}
function zsResultHTML(R, P, d) {
  const S = ZS_RES[R.result], C = zsCabinet(P), li = (l, cls) => l.length ? `<ul class="zs-l ${cls}">${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
  return `<div class="zs-res" style="--c:${S[2]}"><div class="zs-rh"><span class="zs-dot"></span><div><b>${S[0]}</b><span>${S[1]}</span></div></div>
      ${R.neu.length ? `<div class="h3x">Warum</div>${li(R.neu, 'bad')}` : ''}${R.fix.length ? `<div class="h3x">${R.result === 'neu' ? 'Außerdem' : 'Maßnahmen'}</div>${li(R.fix, 'fix')}` : ''}${R.open.length ? `<div class="h3x">Noch offen</div>${li(R.open, 'open')}` : ''}${R.notes.length ? `<div class="h3x">Hinweise</div>${li(R.notes, 'note')}` : ''}</div>
    <div class="cardx zs-card zs-cab"><div><div class="h3x">${R.result === 'neu' ? 'Neuer Zählerschrank' : 'Falls neu: Empfehlung'}</div><b class="zs-big">${C.fields}-feldig</b><span class="muted small">${C.m} ${C.m > 1 ? 'Zählerplätze' : 'Zählerplatz'} + Verteilerfeld mit Raum für APZ · nach VDE-AR-N 4100 (eHZ/BKE-I, RfZ je Zählerplatz)</span>
      <ul class="zs-l">${C.parts.map(p => `<li>${esc(p)}</li>`).join('')}<li>Verteilerfeld: Stromkreise, APZ, Steuerbox-Anschluss</li></ul></div>${zsCabSVG(C, true)}</div>
    ${d && d.vnb ? `<div class="cardx zs-card"><div class="h3x">Netzbetreiber</div><b>${esc(d.vnb)}</b>${d.tabUrl ? `<p style="margin:6px 0 0"><a href="${esc(d.tabUrl)}" target="_blank" rel="noopener">${ic('offer', 14)}${esc(d.tabName || 'TAB öffnen')}</a></p>` : ''}<p class="muted small" style="margin:6px 0 0">Vorgaben des Netzbetreibers (TAB) gehen vor – vor Auftrag dort bestätigen.</p></div>` : ''}
    <p class="muted small zs-src">Grundlage: ${R.src.map(esc).join(' · ')}. Der Check ersetzt nicht die Prüfung durch die Elektrofachkraft (z. B. E-CHECK nach DIN VDE 0105-100), die nach FNN-Hinweis vor jeder Änderung durchzuführen ist.</p>`;
}
function zsData() {
  const R = zsEval(ZS.a, ZS.plan), V = ZS.vnb && ZS.vnb.vnb, T = ZS.vnb && ZS.vnb.tab;
  return { R, data: { ai: ZS.ai, plan: ZS.plan, a: ZS.a, found: ZS.found, ocr: ZS.ocr.slice(0, 3000), addr: ZS.addr, fields: zsCabinet(ZS.plan).fields, vnb: V ? V.name : '', vnbWeb: V ? V.website : '', tabUrl: T ? T.url : (V ? V.website : ''), tabName: T ? T.name : '', eval: R } };
}
function zsErgebnis() {
  const { R, data } = zsData();
  return `${zsResultHTML(R, ZS.plan, data)}${ZS.ai ? zsAiHTML(ZS.ai, false) : ''}
    <div class="zs-act"><button class="btn s" data-zs="back" data-v="fragen">Antworten ändern</button><button class="btn" data-zs="save">${ic('check', 18)}Speichern${ZS.cust ? ' beim Kunden' : ''}</button></div>`;
}
function zsSavedHTML(X) {
  const d = X.data || {}, R = d.eval || zsEval(d.a || {}, d.plan || {}), P = d.plan || {};
  const ans = ZS_Q.filter(q => d.a && d.a[q.id]).map(q => [q.q, (q.o.find(o => o[0] === d.a[q.id]) || [, d.a[q.id]])[1]]);
  return `<a class="backl" href="${X.project ? '#/kunde/' + esc(X.project) : '#/zaehler'}">${ic('back', 18)}${X.project ? 'Zum Kunden' : 'Zählerschrank-Check'}</a>
    <section class="hero zs-hero"><div><h1>${esc(X.title)}</h1><p class="muted">Zählerschrank-Check vom ${utc(X.at).toLocaleDateString('de-DE')} · ${esc(X.by)}${d.addr ? ' · ' + esc(d.addr) : ''}</p></div><button class="btn" data-zs="pdf" data-v="${X.id}">${ic('offer', 18)}PDF-Bericht</button></section>
    ${d.ai ? zsAiHTML(d.ai, false) : ''}${X.photos.length ? `<div class="zs-ph saved">${X.photos.map(p => `<a href="api/?r=cfg-file&id=${esc(p)}" target="_blank" class="zs-th"><img src="api/?r=cfg-file&id=${esc(p)}" alt="Foto"></a>`).join('')}</div>` : ''}
    ${zsResultHTML(R, P, d)}
    <div class="cardx zs-card"><div class="h3x">Vorhaben</div><p style="margin:0">${[['pv', 'Photovoltaik'], ['bat', 'Speicher'], ['wp', 'Wärmepumpe'], ['wb', 'Wallbox'], ['klima', 'Klimagerät']].filter(([k]) => P[k]).map(x => x[1]).join(', ') || '–'}</p>
      <div class="h3x" style="margin-top:12px">Antworten</div><table class="zs-tbl">${ans.map(([q, v]) => `<tr><td>${esc(q)}</td><td><b>${esc(v)}</b></td></tr>`).join('')}</table>
      ${(d.found || []).length ? `<div class="h3x" style="margin-top:12px">Erkannt</div><div class="chips2">${d.found.map(f => `<span class="chip">${esc(f)}</span>`).join('')}</div>` : ''}</div>`;
}
const zsRender = () => { $('#app main').innerHTML = viewZaehler(); };

/* ---------- Foto: verkleinern, Bildqualität, Texterkennung ---------- */
function zsShrink(file) {
  return new Promise((res, rej) => { const img = new Image(); img.onload = () => { const s = Math.min(1, 1800 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src); res(c.toDataURL('image/jpeg', 0.82)); }; img.onerror = () => rej(new Error('Foto nicht lesbar')); img.src = URL.createObjectURL(file); });
}
function zsQuality(dataUrl) {   // Helligkeit und Schärfe (Laplace-Varianz) – warnt bei dunklen oder verwackelten Fotos
  return new Promise(res => { const img = new Image(); img.onload = () => { const w = 320, h = Math.round(img.height / img.width * w), c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data, g = new Float32Array(w * h); let sum = 0; for (let i = 0; i < w * h; i++) { g[i] = .299 * d[i * 4] + .587 * d[i * 4 + 1] + .114 * d[i * 4 + 2]; sum += g[i]; }
    let lv = 0, lm = 0, n = 0; for (let y = 1; y < h - 1; y++) for (let k = 1; k < w - 1; k++) { const i = y * w + k, L = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w]; lm += L; lv += L * L; n++; }
    const bright = sum / (w * h), sharp = lv / n - (lm / n) ** 2;
    res({ bright: Math.round(bright), sharp: Math.round(sharp), warn: bright < 55 ? 'Das Foto ist sehr dunkel – mit Licht/Blitz neu aufnehmen, sonst wird das Typenschild nicht erkannt.' : sharp < 60 ? 'Das Foto wirkt unscharf – für die Texterkennung ruhig halten und näher an das Typenschild.' : '' }); }; img.src = dataUrl; });
}
/* Aufbereitung für die Texterkennung: Graustufen, Kontrast strecken, kleine Fotos vergrößern */
function zsPrep(u) {
  return new Promise(res => { const img = new Image(); img.onload = () => { const s = Math.min(2.2, Math.max(1, 2400 / Math.max(img.width, img.height))), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
    const D = x.getImageData(0, 0, c.width, c.height), d = D.data; let lo = 255, hi = 0; const g = new Uint8ClampedArray(d.length / 4);
    for (let i = 0; i < g.length; i++) { g[i] = .299 * d[i * 4] + .587 * d[i * 4 + 1] + .114 * d[i * 4 + 2]; } const h = [...g].sort((a, b) => a - b); lo = h[Math.floor(h.length * .02)]; hi = h[Math.floor(h.length * .98)]; const k = 255 / Math.max(1, hi - lo);
    for (let i = 0; i < g.length; i++) { const v = (g[i] - lo) * k; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; } x.putImageData(D, 0, 0); res(c); }; img.src = u; });
}
async function zsOcr(urls, onProg) {
  await loadJs('rechner/vendor/tesseract/tesseract.min.js');
  const T = window.Tesseract, V = 'rechner/vendor/tesseract/', worker = await T.createWorker('deu', 1, { workerPath: V + 'worker.min.js', corePath: V, langPath: V.replace(/\/$/, ''), workerBlobURL: false, gzip: true, logger: m => { if (m.status === 'recognizing text' && onProg) onProg(m.progress); } });
  let txt = ''; try { for (const u of urls) { const { data } = await worker.recognize(await zsPrep(u)); txt += '\n' + data.text; } } finally { await worker.terminate(); }
  return txt;
}
function zsFind(t) {   // Merkmale aus dem Typenschild-Text → Vorschläge für die Antworten
  const s = t.replace(/\s+/g, ' '), f = [], a = {};
  if (/VDE[\s-]*AR[\s-]*N[\s-]*4100|4100\s*:?\s*20(19|2\d)/i.test(s)) { f.push('VDE-AR-N 4100'); a.bau = 's4100'; }
  if (/\bBKE[\s-]*I?\b|\beHZ\b|Stecktechnik/i.test(s)) { f.push('eHZ / BKE-I Stecktechnik'); a.bau = a.bau || 's4100'; }
  if (/0603/.test(s)) { f.push('DIN VDE 0603'); a.bau = a.bau || 's0603'; }
  if (/43\s?870/.test(s)) { f.push('DIN 43870'); a.bau = a.bau || 's43870'; }
  if (/43\s?853/.test(s)) { f.push('DIN 43853'); a.bau = a.bau || 'tafel_43853'; }
  const mk = s.match(/\b(Hager|Striebel\s*(?:&|und)?\s*John|ABB|Eaton|Moeller|Siemens|Spelsberg|Altech|W[öo]hner|Mennekes|Schneider|Legrand|Ensto|F\+?Z|Rittal|Wago|Doepke|Kleinhuis)\b/i); if (mk) f.push('Hersteller: ' + mk[1]);
  const yr = s.match(/(?:Baujahr|BJ|Herst(?:ell)?\w*|Jahr)\D{0,6}((?:19[6-9]|20[0-3])\d)/i) || s.match(/\b((?:19[6-9]|20[0-2])\d)\b/); if (yr) { f.push('Jahr ' + yr[1]); if (!a.bau && +yr[1] < 1977) a.bau = 'tafel_43853'; }
  if (/schutzklasse\s*II|⧈|SK\s*II/i.test(s)) f.push('Schutzklasse II');
  if (/H07V-?K/i.test(s) || /10\s?mm(²|2)/i.test(s)) { f.push('Verdrahtung 10 mm² / H07V-K'); a.verd = 'ja'; }
  if (/IP\s?(3[0-9]|4[0-4])/i.test(s)) f.push(s.match(/IP\s?\d{2}/i)[0].replace(/\s/, ''));
  if (/\b(SH|SLS)[\s-]*Schalter|\bSHU\b|selektiv/i.test(s)) { f.push('SH-Schalter'); a.trenn = 'sh'; }
  return { f, a };
}
async function zsScan() {
  ZS.step = 'foto'; zsRender();
  const ov = document.createElement('div'); ov.className = 'zs-scan'; ov.innerHTML = `<div class="zs-sbox"><div class="zs-img"><img src="${ZS.photos[Math.max(0, ZS.kinds.indexOf('gesamt'))]}" alt=""><i class="zs-line"></i><i class="zs-grid"></i><div class="zs-tags"></div></div>
    <ol class="zs-sl"><li data-s="1">Bild aufbereiten</li><li data-s="2">Bildqualität prüfen</li><li data-s="3">Typenschild lesen (Texterkennung)</li>${ZS.aiOn ? '<li data-s="6">KI-Bildanalyse: APZ, RfZ, Hutschienen, Anschlussräume</li>' : ''}<li data-s="4">Abgleich VDE-AR-N 4100 · DIN VDE 0603 · FNN-Hinweis</li><li data-s="5">Netzbetreiber &amp; TAB</li></ol><div class="zs-prog"><i></i></div></div>`;
  document.body.appendChild(ov);
  const st = (n, cls) => { const li = ov.querySelector(`[data-s="${n}"]`); if (li) li.className = cls; }, prog = p => { ov.querySelector('.zs-prog i').style.width = Math.round(p * 100) + '%'; }, tag = t => { const x = document.createElement('span'); x.textContent = t; ov.querySelector('.zs-tags').appendChild(x); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try {
    st(1, 'on'); await wait(500); st(1, 'ok'); prog(.1);
    st(2, 'on'); ZS.quality = await zsQuality(ZS.photos[Math.max(0, ZS.kinds.indexOf('schild'))]); await wait(400); st(2, ZS.quality.warn ? 'warn' : 'ok'); prog(.2);
    st(3, 'on'); const sch = ZS.photos.filter((_, i) => ZS.kinds[i] === 'schild'); if (!sch.length) { ZS.ocr = ''; st(3, 'warn'); tag('Kein Typenschild-Foto'); await wait(500); } else { try { ZS.ocr = await zsOcr(sch, p => prog(.2 + p * .55)); st(3, 'ok'); } catch (e) { ZS.ocr = ''; st(3, 'warn'); } }
    if (ZS.aiOn) { st(6, 'on'); ZS.ai = null; ZS.aiErr = ''; let t0 = .75; const tk = setInterval(() => { t0 = Math.min(.88, t0 + .004); prog(t0); }, 400);
      try { const j = await api('zs-ai', { photos: ZS.photos }); ZS.ai = j.ai; for (const q of ZS_Q) { const v = ZS.ai[q.id]; if (v && v !== 'unklar') ZS.a[q.id] = v; }
        for (const b of (ZS.ai.befunde || []).filter(b => b.status === 'mangel').slice(0, 4)) { tag('✗ ' + b.punkt); await wait(220); } st(6, ZS.ai.gesamt === 'konform' ? 'ok' : 'warn'); }
      catch (e) { ZS.aiErr = e.message; st(6, 'warn'); } finally { clearInterval(tk); } }
    st(4, 'on'); const F = zsFind(ZS.ocr); ZS.found = F.f; for (const k in F.a) if (!ZS.a[k]) ZS.a[k] = F.a[k];   // KI-Antworten haben Vorrang vor dem Typenschild-Abgleich
    for (const t of F.f.slice(0, 6)) { tag(t); await wait(260); } if (!F.f.length && sch.length) tag('Typenschild nicht lesbar'); st(4, 'ok'); prog(.9);
    st(5, 'on'); if (ZS.addr && !ZS.vnb) await zsVnb(); st(5, ZS.vnb ? 'ok' : 'warn'); if (ZS.vnb) tag(ZS.vnb.vnb.name); prog(1); await wait(900);
  } finally { ov.classList.add('out'); setTimeout(() => ov.remove(), 300); }
  ZS.step = 'fragen'; zsRender(); scrollTo(0, 0);
}

/* ---------- PDF-Bericht ---------- */
async function zsPdf(X) {
  await loadJs('rechner/vendor/jspdf.umd.min.js');
  const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'mm', format: 'a4' }), d = X.data || {}, R = d.eval || zsEval(d.a || {}, d.plan || {}), P = d.plan || {}, C = zsCabinet(P), S = ZS_RES[R.result];
  const W = 210, M = 18, INK = [18, 23, 42], GR = [110, 116, 130]; let y = 22;
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const para = (t, sz = 10, col = INK, b = false) => { doc.setFont('helvetica', b ? 'bold' : 'normal'); doc.setFontSize(sz); doc.setTextColor(...col); for (const ln of doc.splitTextToSize(t, W - 2 * M)) { if (y > 275) { doc.addPage(); y = 20; } doc.text(ln, M, y); y += sz * .45; } y += 1.5; };
  const list = (l, col) => l.forEach(t => { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...INK); const ls = doc.splitTextToSize(t, W - 2 * M - 6); if (y + ls.length * 4.4 > 275) { doc.addPage(); y = 20; } doc.setFillColor(...col); doc.circle(M + 1.5, y - 1.2, 1, 'F'); doc.text(ls, M + 6, y); y += ls.length * 4.4 + 1.2; });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...INK); doc.text('Prüfbericht Zählerschrank', M, y); y += 7;
  para(`${X.title} · ${utc(X.at).toLocaleDateString('de-DE')} · ${X.by}${d.addr ? ' · ' + d.addr : ''}`, 9.5, GR);
  if (d.vnb) para(`Netzbetreiber: ${d.vnb}${d.tabUrl ? ' – TAB: ' + d.tabUrl : ''}`, 9.5, GR);
  y += 2; doc.setFillColor(...hex(S[2])); doc.roundedRect(M, y, W - 2 * M, 16, 3, 3, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text(S[0], M + 5, y + 7); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.text(S[1], M + 5, y + 12.5); y += 23;
  if (R.neu.length) { para('Warum', 11, INK, true); list(R.neu, hex('#E5484D')); y += 2; }
  if (R.fix.length) { para(R.result === 'neu' ? 'Außerdem' : 'Maßnahmen', 11, INK, true); list(R.fix, hex('#F5A524')); y += 2; }
  if (R.open.length) { para('Noch offen', 11, INK, true); list(R.open, hex('#5B8DEF')); y += 2; }
  if (R.notes.length) { para('Hinweise', 11, INK, true); list(R.notes, GR); y += 2; }
  para(`${R.result === 'neu' ? 'Neuer Zählerschrank' : 'Falls neu – Empfehlung'}: ${C.fields}-feldig (${C.m} ${C.m > 1 ? 'Zählerplätze' : 'Zählerplatz'} + Verteilerfeld mit Raum für APZ)`, 11, INK, true); list(C.parts.concat('Verteilerfeld: Stromkreise, APZ, Steuerbox-Anschluss'), GR); y += 2;
  const vor = [['pv', 'Photovoltaik'], ['bat', 'Speicher'], ['wp', 'Wärmepumpe'], ['wb', 'Wallbox'], ['klima', 'Klimagerät']].filter(([k]) => P[k]).map(x => x[1]).join(', ') || '–';
  para('Vorhaben: ' + vor, 10, INK, true);
  if (d.ai) { para('KI-Bildanalyse: ' + ({ konform: 'laut Foto konform', nicht_konform: 'laut Foto nicht konform', unklar: 'laut Foto nicht eindeutig' }[d.ai.gesamt] || ''), 11, INK, true); if (d.ai.kurzfazit) para(d.ai.kurzfazit, 9.5, GR); list((d.ai.befunde || []).map(b => (b.status === 'ok' ? 'OK – ' : b.status === 'mangel' ? 'Mangel – ' : 'Prüfen – ') + b.punkt + ': ' + b.text), GR); y += 2; }
  para('Antworten', 11, INK, true); ZS_Q.filter(q => d.a && d.a[q.id]).forEach(q => { const v = (q.o.find(o => o[0] === d.a[q.id]) || [, d.a[q.id]])[1]; doc.setFontSize(9); const ls = doc.splitTextToSize(q.q, 110); if (y + ls.length * 4 > 275) { doc.addPage(); y = 20; } doc.setTextColor(...GR); doc.setFont('helvetica', 'normal'); doc.text(ls, M, y); doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.text(String(v), M + 116, y); y += ls.length * 4 + 1.5; });
  for (const id of X.photos.slice(0, 2)) { try { const b = await (await fetch('api/?r=cfg-file&id=' + encodeURIComponent(id), { credentials: 'same-origin' })).blob(); const u = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); const pr = doc.getImageProperties(u), w = 80, h = Math.min(100, w * pr.height / pr.width); if (y + h > 275) { doc.addPage(); y = 20; } doc.addImage(u, 'JPEG', M, y, h * pr.width / pr.height, h); y += h + 4; } catch (e) {} }
  y += 2; para(`Grundlage: ${R.src.join(' · ')}. Dieser Bericht ist eine Vorbewertung und ersetzt nicht die Prüfung durch die Elektrofachkraft (z. B. E-CHECK nach DIN VDE 0105-100) sowie die Abstimmung mit dem Netzbetreiber.`, 8, GR);
  const name = `Zaehlerschrank-Check_${X.title.replace(/[^\wäöüÄÖÜß-]+/g, '_')}.pdf`;
  if (typeof ldShare === 'function') return ldShare(doc.output('blob'), name);
}

/* ---------- TAB-Liste (Admin/Büro) ---------- */
function zsTabs(keep) {
  if (!keep) ZS.tabEdit = (ZS.tabs || []).map(t => ({ ...t }));
  const html = `<div class="kd-h"><b>TAB je Netzbetreiber</b><button type="button" class="xbtn" data-zs="tabs-x" aria-label="Schließen">${ic('x', 16)}</button></div>
    <p class="muted small" style="margin:0 2px 10px">„Erkennung“ ist ein Teil des Namens aus VNBdigital (z. B. „EWE NETZ“). Der Link führt zur TAB bzw. den Ergänzungen des Netzbetreibers. Ohne Eintrag wird die Webseite des Netzbetreibers verlinkt.</p>
    <div class="zs-tl">${ZS.tabEdit.map((t, i) => `<div class="zs-ti"><input data-zt="${i}" data-k="match" value="${esc(t.match)}" placeholder="Erkennung, z. B. Westnetz"><input data-zt="${i}" data-k="name" value="${esc(t.name)}" placeholder="Bezeichnung"><input data-zt="${i}" data-k="url" value="${esc(t.url)}" placeholder="https://… (TAB-PDF)"><textarea data-zt="${i}" data-k="note" rows="1" placeholder="Hinweis (optional)">${esc(t.note || '')}</textarea><button class="btn g sm danger" data-zs="tab-del" data-v="${i}" aria-label="Entfernen">${ic('x', 14)}</button></div>`).join('')}</div>
    <div class="kd-act"><button class="btn s" data-zs="tab-add">${ic('plus', 16)}Netzbetreiber</button><span style="flex:1"></span><button class="btn" data-zs="tabs-save">${ic('check', 18)}Speichern</button></div>`;
  const o = $('#kd-sheet'); if (o && keep) o.querySelector('.kdbox').innerHTML = html; else kdSheet(html);
}

/* ---------- Bedienung ---------- */
document.addEventListener('click', async e => {
  const a = e.target.closest && e.target.closest('[data-zs]'); if (!a) return; e.preventDefault();
  const k = a.dataset.zs, v = a.dataset.v;
  try {
    if (k === 'cust-x') { ZS.cust = null; ZS.addr = ''; ZS.vnb = null; return zsRender(); }
    if (k === 'mess') { ZS.plan.mess = v; return zsRender(); }
    if (k === 'go-foto') { if (!zsChange(ZS.plan) && !confirm('Es ist nichts geplant (PV, Speicher, Wärmepumpe …). Trotzdem prüfen?')) return; ZS.step = 'foto'; return zsRender(); }
    if (k === 'back') { ZS.step = v; zsRender(); return scrollTo(0, 0); }
    if (k === 'ph-del') { ZS.photos.splice(+v, 1); ZS.kinds.splice(+v, 1); return zsRender(); }
    if (k === 'scan') return await zsScan();
    if (k === 'ans') { ZS.a[a.dataset.q] = v; const y = scrollY; zsRender(); return scrollTo(0, y); }
    if (k === 'eval') { ZS.step = 'ergebnis'; zsRender(); return scrollTo(0, 0); }
    if (k === 'save') { a.disabled = true; const { R, data } = zsData(); const j = await api('zs-save', { project: ZS.cust ? ZS.cust.id : '', title: ZS.cust ? ZS.cust.name : (ZS.addr || 'Zählerschrank-Check'), result: R.result, data, photos: ZS.photos }); toast('Check gespeichert' + (ZS.cust ? ' – im Logbuch des Kunden vermerkt.' : '.')); zsReset(); ZS.list = null; location.hash = '#/zaehler/' + j.check.id; return; }
    if (k === 'pdf') return await zsPdf(ZS.view);
    if (k === 'tabs') return zsTabs();
    if (k === 'tabs-x') return kdClose();
    if (k === 'tab-add') { ZS.tabEdit.push({ match: '', name: '', url: '', note: '' }); return zsTabs(true); }
    if (k === 'tab-del') { ZS.tabEdit.splice(+v, 1); return zsTabs(true); }
    if (k === 'tabs-save') { const j = await api('zs-tabs', { list: ZS.tabEdit }); ZS.tabs = j.tabs; kdClose(); toast('TAB-Liste gespeichert.'); if (ZS.addr) { ZS.vnb = null; await zsVnb(); } return; }
  } catch (err) { toast(err.message); a.disabled = false; }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset && el.dataset.zp) { ZS.plan[el.dataset.zp] = el.checked; if (!zsSteuVE(ZS.plan)) ZS.plan.mess = 'eins'; if (ZS.plan.mess === 'zwei' && !(ZS.plan.wp && ZS.plan.wb)) ZS.plan.mess = 'wp'; return zsRender(); }
  if (el.dataset && el.dataset.zf && el.files && el.files[0]) { try { ZS.photos.push(await zsShrink(el.files[0])); ZS.kinds.push(el.dataset.zf); } catch (err) { toast(err.message); } return zsRender(); }
  if (el.id === 'zs-addr') { ZS.addr = el.value.trim(); ZS.vnb = null; const x = $('#zs-vnb'); if (x) x.outerHTML = zsVnbHTML(); zsVnb(); }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset && el.dataset.zt !== undefined && ZS.tabEdit) { ZS.tabEdit[+el.dataset.zt][el.dataset.k] = el.value; return; }
  if (el.id === 'zs-cq') { const s = el.value.trim().toLowerCase(), box = $('#zs-cl'); if (!s) { box.innerHTML = ''; return; }
    const l = (ZS.custs || []).filter(c => `${c.kdnr || ''} ${c.name} ${c.city} ${c.street}`.toLowerCase().includes(s)).slice(0, 8);
    box.innerHTML = l.map(c => `<button type="button" data-zc="${esc(c.id)}"><b>${c.kdnr ? esc(c.kdnr) + ' · ' : ''}${esc(c.name)}</b><span>${esc([c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', '))}</span></button>`).join('') || '<div class="muted small" style="padding:8px">Kein Kunde gefunden</div>'; }
});
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-zc]'); if (!b) return; const c = (ZS.custs || []).find(x => x.id === b.dataset.zc); if (c) zsPickCust(c); });
/* System → KI-Bildanalyse: Schlüssel speichern/entfernen (nur Admin) */
document.addEventListener('submit', async e => { if (e.target.id !== 'f-ai') return; e.preventDefault(); try { ST.ai = await api('ai-cfg', { key: e.target.key.value }); toast('KI-Bildanalyse eingerichtet.'); route(); } catch (err) { toast(err.message); } });
document.addEventListener('click', async e => { const a = e.target.closest && e.target.closest('[data-a="ai-off"]'); if (!a) return; e.preventDefault(); e.stopImmediatePropagation(); if (!confirm('API-Schlüssel entfernen?')) return; try { ST.ai = await api('ai-cfg', { key: '' }); toast('Schlüssel entfernt.'); route(); } catch (err) { toast(err.message); } }, true);
