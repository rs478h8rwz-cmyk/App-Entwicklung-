
/* =========================================================
   Fragenkataloge
   Feld: { id, label, type, req, opts (Liste oder Funktion), show (Bedingung), ph, hint, chips }
   Typen: text, textarea, number, date, phone, radio, multiday, items, einsaetze, thumbs
   ========================================================= */
const YN = [['ja', 'Ja'], ['nein', 'Nein']];
const o = arr => arr.map(x => (Array.isArray(x) ? x : [x, x]));

const KOPF_ABNAHME = [
  { id: 'kunde', label: 'Kundenname', type: 'text', req: true, ph: 'Vor- und Nachname' },
  { id: 'adresse', label: 'Adresse der Baustelle', type: 'text', req: true, ph: 'Straße, PLZ, Ort' },
  { id: 'datum', label: 'Datum', type: 'date', req: true },
  { id: 'monteur', label: 'Monteur(e)', type: 'monteur', req: true, ph: 'Name(n) – oder unten antippen' },
  { id: 'projekt', label: 'Baustelle / Projektbezeichnung', type: 'text', ph: 'z. B. Projektnummer' },
  { id: 'tage', label: 'An welchen Tagen war der Monteur vor Ort?', type: 'multiday', req: true }
];

/* ---------- Abnahme DC ---------- */
const steil = a => a.dachart === 'steildach' || a.dachart === 'beides', flach = a => a.dachart === 'flachdach' || a.dachart === 'beides';
const ABNAHME_DC = [
  { title: 'Kopfdaten', sub: 'Kunde, Baustelle und Einsatztage.', fields: KOPF_ABNAHME },
  { title: 'Module', sub: 'Angaben zu den verbauten PV-Modulen.', fields: [
    { id: 'module_typ', label: 'Welche Module wurden verbaut?', type: 'textarea', req: true, ph: 'Hersteller, Typ, Leistung' },
    { id: 'module_anzahl', label: 'Wie viele Module wurden verbaut?', type: 'number', req: true, unit: 'Stk' }] },
  { title: 'Dachart', sub: 'Welche Dachart hat die Anlage?', fields: [
    { id: 'dachart', label: 'Dachart', type: 'radio', req: true, opts: [['steildach', 'Steildach'], ['flachdach', 'Flachdach'], ['beides', 'Beides']] }] },
  { title: 'Gerüst', sub: 'Angaben zum Gerüst.', fields: [
    { id: 'geruest', label: 'Wurde ein Gerüst gestellt?', type: 'radio', req: true, opts: [['uns', 'Ja, von uns'], ['geruestbauer', 'Ja, von einem Gerüstbauer'], ['nein', 'Nein']] },
    { id: 'geruest_art', label: 'Welche Art von Gerüst?', type: 'radio', req: true, show: a => a.geruest === 'uns', opts: [['turm', 'Turm'], ['fang', 'Fanggerüst']] },
    { id: 'geruest_menge', label: 'Menge (Felder / laufende Meter)', type: 'text', req: true, show: a => a.geruest === 'uns', ph: 'z. B. 12 Felder oder 24 lfm' },
    { id: 'geruest_seiten', label: 'Welche Dachseiten wurden eingerüstet?', type: 'text', req: true, show: a => a.geruest === 'uns', ph: 'z. B. Süd, West' }] },
  { title: 'Strings – Steildach', sub: 'Wie wurden die Strings verbaut? Beispiel: Süd 1×10, West 1×7', show: steil, fields: [
    { id: 'strings_steil', label: 'Strings (Steildach)', type: 'textarea', req: true, ph: 'Süd 1x10\nWest 1x7' },
    { id: 'dachhaken', label: 'Wie viele Dachhaken wurden verbaut?', type: 'number', req: true, unit: 'Stk' },
    { id: 'schiene', label: 'Wie viele Meter Schiene wurden verbaut?', type: 'number', req: true, unit: 'm' }] },
  { title: 'Strings – Flachdach', sub: 'Beispiel: Ost 1×12, West 1×12, Süd 2×12', show: flach, fields: [
    { id: 'strings_flach', label: 'Strings (Flachdach)', type: 'textarea', req: true, ph: 'Ost 1x12\nWest 1x12' }] },
  { title: 'Verkabelung', sub: 'Stringkabel und Kabelweg.', fields: [
    { id: 'stringkabel', label: 'Wie viele Meter Stringkabel wurden verbaut?', type: 'number', req: true, unit: 'm' },
    { id: 'kabelweg', label: 'Wie wurde der Kabelweg gelöst?', type: 'radio', req: true, opts: [['fassade', 'Fassade'], ['schornstein', 'Schornstein'], ['kabelschacht', 'Kabelschacht'], ['sonstiges', 'Sonstiges']] },
    { id: 'kabelweg_text', label: 'Kabelweg – bitte beschreiben', type: 'text', req: true, show: a => a.kabelweg === 'sonstiges' }] },
  { title: 'Flachlüfter', sub: '', fields: [
    { id: 'flachluefter', label: 'Wurden Flachlüfter verbaut?', type: 'radio', req: true, opts: YN },
    { id: 'flachluefter_anz', label: 'Wie viele Flachlüfter?', type: 'number', req: true, unit: 'Stk', show: a => a.flachluefter === 'ja' }] },
  { title: 'Material & Sonstiges', sub: 'Zusätzliches Material oder Hinweise.', fields: [
    { id: 'material', label: 'Zusätzliches Material', type: 'items' },
    { id: 'sonstiges', label: 'Sonstige Informationen', type: 'textarea' }] },
  { title: 'Restarbeiten', sub: '', fields: [
    { id: 'rest', label: 'Sind noch Restarbeiten offen?', type: 'radio', req: true, opts: YN },
    { id: 'rest_text', label: 'Welche Restarbeiten sind offen?', type: 'textarea', req: true, show: a => a.rest === 'ja' },
    { id: 'rest_ok', type: 'thumbs', show: a => a.rest === 'nein' }] },
  { title: 'Kundenwünsche', sub: '', fields: [
    { id: 'zusatz', label: 'Wünscht der Kunde Zusatzarbeiten?', type: 'textarea' }] }
];

/* ---------- Abnahme AC ---------- */
const sysOf = a => S.systems.find(x => x.id === a.system);
const ABNAHME_AC = [
  { title: 'Kopfdaten', sub: 'Kunde, Baustelle und Einsatztage.', fields: KOPF_ABNAHME },
  { title: 'Installation', sub: '', fields: [
    { id: 'installation', label: 'Was wurde installiert?', type: 'radio', req: true, opts: [['pv', 'Photovoltaik'], ['wp', 'Wärmepumpe'], ['beides', 'Beides']] }] },
  { title: 'System & Wechselrichter', sub: 'Welches System wurde verbaut?', fields: [
    { id: 'system', label: 'System', type: 'radio', req: true, opts: () => S.systems.map(x => [x.id, x.name]).concat([['sonstige', 'Sonstiges System']]) },
    { id: 'system_text', label: 'Welches System?', type: 'text', req: true, show: a => a.system === 'sonstige' },
    { id: 'wr_groesse', label: 'Wechselrichter', type: 'radio', req: true, show: a => sysOf(a) && sysOf(a).wr.length, opts: a => sysOf(a).wr.map(x => [x, x]).concat([['andere', 'Andere Größe']]) },
    { id: 'wr_text', label: 'Größe des Wechselrichters', type: 'text', req: true, ph: 'z. B. 10 kW', show: a => !a.system || a.system === 'sonstige' || !(sysOf(a) && sysOf(a).wr.length) || a.wr_groesse === 'andere' },
    { id: 'mehrere', label: a => `Wurde mehr als ein Gerät verbaut${sysOf(a) ? ` (${sysOf(a).unit || 'Geräte'})` : ''}?`, type: 'radio', req: true, show: a => sysOf(a) && sysOf(a).multi, opts: YN },
    { id: 'anzahl', label: 'Wie viele insgesamt?', type: 'number', req: true, unit: 'Stk', show: a => sysOf(a) && sysOf(a).multi && a.mehrere === 'ja' }] },
  { title: 'Speicher', sub: '', fields: [
    { id: 'speicher', label: 'Speicher vorhanden?', type: 'radio', req: true, opts: YN },
    { id: 'speicher_groesse', label: 'Speichergröße (gesamt)', type: 'radio', req: true, show: a => a.speicher === 'ja' && sysOf(a) && sysOf(a).sp.length, opts: a => sysOf(a).sp.map(x => [x, x]).concat([['andere', 'Andere Größe']]) },
    { id: 'speicher_text', label: 'Größe des Speichers', type: 'text', req: true, ph: 'z. B. 10 kWh', show: a => a.speicher === 'ja' && (!(sysOf(a) && sysOf(a).sp.length) || a.speicher_groesse === 'andere') }] },
  { title: 'Wallbox & Heizstab', sub: '', fields: [
    { id: 'wallbox', label: 'Wallbox vorhanden?', type: 'radio', req: true, opts: YN },
    { id: 'wallbox_typ', label: 'Welche Wallbox?', type: 'text', req: true, show: a => a.wallbox === 'ja' },
    { id: 'heizstab', label: 'Wurde ein Heizstab angeschlossen?', type: 'radio', req: true, opts: YN }] },
  { title: 'Zählerkasten', sub: '', fields: [
    { id: 'zk', label: 'Zusätzlicher Zählerkasten?', type: 'radio', req: true, opts: YN },
    { id: 'zk_typ', label: 'Welcher Zählerkasten?', type: 'radio', req: true, show: a => a.zk === 'ja', opts: [['2reihig', '2-reihig'], ['3reihig', '3-reihig'], ['sonstige', 'Sonstige']] },
    { id: 'zk_text', label: 'Bitte beschreiben', type: 'text', req: true, show: a => a.zk === 'ja' && a.zk_typ === 'sonstige' }] },
  { title: 'Stromzähler fotografiert?', sub: 'Pflicht: Zählernummer und Zählerstand müssen per Foto dokumentiert sein.', danger: true, fields: [
    { id: 'zaehler_foto', label: 'Wurde der Stromzähler fotografiert?', type: 'radio', req: true, opts: YN, danger: true }], block: a => a.zaehler_foto === 'nein' && 'Bitte zuerst den Stromzähler fotografieren – sonst kann das Protokoll nicht abgeschlossen werden.' },
  { title: 'Material & Mehraufwand', sub: '', fields: [
    { id: 'material', label: 'Zusätzliches Material', type: 'items' },
    { id: 'mehraufwand', label: 'Ist Mehraufwand entstanden?', type: 'radio', req: true, opts: YN },
    { id: 'mehraufwand_text', label: 'Beschreibung des Mehraufwands', type: 'textarea', req: true, show: a => a.mehraufwand === 'ja' }] },
  { title: 'Baustelle', sub: '', fields: [
    { id: 'fertig', label: 'Baustelle abgeschlossen?', type: 'radio', req: true, opts: YN },
    { id: 'rest_text', label: 'Welche Restarbeiten sind offen?', type: 'textarea', req: true, show: a => a.fertig === 'nein' },
    { id: 'rest_ok', type: 'thumbs', show: a => a.fertig === 'ja' }] },
  { title: 'Kundenwünsche & Einweisung', sub: '', fields: [
    { id: 'zusatz', label: 'Wünscht der Kunde zusätzliche Arbeiten?', type: 'textarea' },
    { id: 'einweisung', label: 'Wurde der Kunde in Anlage und App eingewiesen?', type: 'radio', req: true, opts: YN }] }
];

/* ---------- Abnahme SHK ---------- */
const wpOf = a => S.wps.find(x => x.id === a.wp_hersteller);
const ABNAHME_SHK = [
  { title: 'Kopfdaten', sub: 'Kunde, Baustelle und Einsatztage.', fields: KOPF_ABNAHME },
  { title: 'Wärmepumpe', sub: 'Welche Wärmepumpe wurde verbaut?', fields: [
    { id: 'wp_hersteller', label: 'Hersteller / Baureihe', type: 'radio', req: true, opts: () => S.wps.map(x => [x.id, x.name]).concat([['sonstige', 'Sonstige']]) },
    { id: 'wp_modell', label: 'Modell', type: 'radio', req: true, show: a => wpOf(a) && wpOf(a).models.length, opts: a => wpOf(a).models.map(x => [x, x]).concat([['andere', 'Anderes Modell']]) },
    { id: 'wp_text', label: 'Hersteller und Modell', type: 'text', req: true, show: a => a.wp_hersteller === 'sonstige' || (wpOf(a) && !wpOf(a).models.length) || a.wp_modell === 'andere' },
    { id: 'wp_mehrere', label: 'Wurde mehr als eine Wärmepumpe verbaut (Kaskade)?', type: 'radio', req: true, show: a => wpOf(a) && wpOf(a).multi, opts: YN },
    { id: 'wp_anzahl', label: 'Wie viele Wärmepumpen insgesamt?', type: 'number', req: true, unit: 'Stk', show: a => wpOf(a) && wpOf(a).multi && a.wp_mehrere === 'ja' }] },
  { title: 'Rohr & Fittinge', sub: '', fields: [
    { id: 'rohr_m', label: 'Wie viele Meter Rohr wurden verwendet?', type: 'number', req: true, unit: 'm' },
    { id: 'rohr_verlegung', label: 'Wärmepumpenrohr verlegt', type: 'radio', req: true, opts: [['ueber', 'Überirdisch'], ['unter', 'Unterirdisch'], ['beides', 'Beides']] },
    { id: 'rohr_ueber', label: 'Wie viele Meter überirdisch?', type: 'number', req: true, unit: 'm', show: a => a.rohr_verlegung === 'ueber' || a.rohr_verlegung === 'beides' },
    { id: 'rohr_unter', label: 'Wie viele Meter unterirdisch?', type: 'number', req: true, unit: 'm', show: a => a.rohr_verlegung === 'unter' || a.rohr_verlegung === 'beides' },
    { id: 'fittinge', label: 'Welche Fittinge wurden verwendet?', type: 'items', ph: 'z. B. Winkel 90°' }] },
  { title: 'Befüllung', sub: '', fields: [
    { id: 'befuellung', label: 'Zum Befüllen verwendet', type: 'radio', req: true, opts: [['heaty', 'UWS Heaty'], ['spuelwagen', 'Spülwagen']] },
    { id: 'kartusche', label: 'Wurde die Kartusche getauscht?', type: 'radio', req: true, show: a => a.befuellung === 'heaty', opts: YN }] },
  { title: 'Ausdehnung & Entlüfter', sub: '', fields: [
    { id: 'ag_anz', label: 'Wie viele Ausdehnungsgefäße wurden gesetzt?', type: 'number', req: true, unit: 'Stk' },
    { id: 'ag_druck', label: 'Mit welchem Druck?', type: 'number', req: true, unit: 'bar' },
    { id: 'se_anz', label: 'Wie viele Schnellentlüfter?', type: 'number', req: true, unit: 'Stk' },
    { id: 'kh_anz', label: 'Wie viele Kugelhähne?', type: 'number', req: true, unit: 'Stk' },
    { id: 'zirkulation', label: 'Wurde eine Zirkulationspumpe verbaut?', type: 'radio', req: true, opts: YN }] },
  { title: 'Speicher', sub: '', fields: [
    { id: 'ww', label: 'Warmwasserspeicher vorhanden?', type: 'radio', req: true, opts: YN },
    { id: 'ww_groesse', label: 'Größe Warmwasserspeicher', type: 'text', req: true, show: a => a.ww === 'ja', ph: 'z. B. 300 l' },
    { id: 'puffer', label: 'Größe Pufferspeicher (falls vorhanden)', type: 'text' },
    { id: 'kombi', label: 'Größe Kombispeicher (falls vorhanden)', type: 'text' }] },
  { title: 'Isolierung', sub: '', fields: [
    { id: 'iso', label: 'Wurde die Anlage vollständig isoliert?', type: 'radio', req: true, opts: YN },
    { id: 'iso_fehlt', label: 'Wie viele Meter fehlen?', type: 'number', req: true, unit: 'm', show: a => a.iso === 'nein' },
    { id: 'iso_dim', label: 'Welche Dimension?', type: 'text', req: true, show: a => a.iso === 'nein' }] },
  { title: 'Verteiler & Ventile', sub: '', fields: [
    { id: 'vt', label: 'Fußbodenverteiler getauscht?', type: 'radio', req: true, opts: YN },
    { id: 'vt_anz', label: 'Wie viele?', type: 'number', req: true, unit: 'Stk', show: a => a.vt === 'ja' },
    { id: 'vt_art', label: 'Welche Art?', type: 'text', req: true, show: a => a.vt === 'ja' },
    { id: 'ventile', label: 'Ventile getauscht?', type: 'radio', req: true, opts: YN },
    { id: 'ventile_anz', label: 'Wie viele Ventile?', type: 'number', req: true, unit: 'Stk', show: a => a.ventile === 'ja' },
    { id: 'thermo', label: 'Thermostatköpfe getauscht?', type: 'radio', req: true, opts: YN },
    { id: 'thermo_anz', label: 'Wie viele Thermostatköpfe?', type: 'number', req: true, unit: 'Stk', show: a => a.thermo === 'ja' }] },
  { title: 'Heizkörper', sub: '', fields: [
    { id: 'hk', label: 'Heizkörper getauscht?', type: 'radio', req: true, opts: YN },
    { id: 'hk_liste', label: 'Welche Heizkörper? (je Heizkörper Raum, Typ und Maße)', type: 'heizkoerper', req: true, show: a => a.hk === 'ja' }] },
  { title: 'Inbetriebnahme', sub: '', fields: [
    { id: 'ibn_fehler', label: 'Gab es bei der Inbetriebnahme einen Fehler?', type: 'radio', req: true, opts: YN },
    { id: 'ibn_text', label: 'Welcher Fehler?', type: 'text', req: true, show: a => a.ibn_fehler === 'ja' },
    { id: 'ibn_behoben', label: 'Wurde der Fehler behoben?', type: 'radio', req: true, show: a => a.ibn_fehler === 'ja', opts: YN }] },
  { title: 'Restarbeiten', sub: '', fields: [
    { id: 'material', label: 'Zusätzliches Material', type: 'items' },
    { id: 'rest', label: 'Restarbeiten offen?', type: 'radio', req: true, opts: YN },
    { id: 'rest_text', label: 'Beschreibung', type: 'textarea', req: true, show: a => a.rest === 'ja' },
    { id: 'rest_ok', type: 'thumbs', show: a => a.rest === 'nein' }] },
  { title: 'Kundenwünsche & Einweisung', sub: '', fields: [
    { id: 'zusatz', label: 'Wünscht der Kunde zusätzliche Arbeiten?', type: 'textarea' },
    { id: 'einweisung', label: 'Wurde der Kunde in Anlage und App eingewiesen?', type: 'radio', req: true, opts: YN }] }
];

/* ---------- Serviceauftrag (für jedes Gewerk) ---------- */
function serviceSteps(g) {
  return [
    { title: 'Auftrag', sub: 'Kunde und Monteur.', fields: [
      { id: 'kunde', label: 'Kundenname', type: 'text', req: true, ph: 'Vor- und Nachname' },
      { id: 'adresse', label: 'Adresse', type: 'text', req: true, ph: 'Straße, PLZ, Ort' },
      { id: 'telefon', label: 'Telefon (optional)', type: 'phone' },
      { id: 'auftrag', label: 'Auftrags- / Ticketnummer (optional)', type: 'text' },
      { id: 'monteur', label: 'Monteur(e)', type: 'monteur', req: true, ph: 'Name(n) – oder unten antippen' }] },
    { title: 'Einsatz & Zeiten', sub: 'Wann und wie lange war der Monteur vor Ort?', fields: [
      { id: 'notdienst', label: 'War es ein Notfall (Notdienst-Einsatz)?', type: 'radio', req: true, opts: YN, hint: () => `Zuschläge: Samstag ${S.zuschlag.sat} %, Sonntag ${S.zuschlag.sun} %, Feiertag ${S.zuschlag.hol} % – im Notdienst jeweils + ${S.zuschlag.not} % (auch werktags).` },
      { id: 'einsaetze', label: 'Einsätze', type: 'einsaetze', req: true }] },
    { title: 'Grund', sub: 'Warum wurde der Service gerufen?', fields: [
      { id: 'grund', label: 'Grund / Störung', type: 'textarea', req: true, chips: () => S.lists['grund' + g], ph: 'Was war das Problem?' },
      { id: 'fehlercode', label: 'Fehlercode (falls angezeigt)', type: 'text' }] },
    { title: 'Behebung', sub: 'Wie wurde es behoben?', fields: [
      { id: 'behoben', label: 'Wurde das Problem behoben?', type: 'radio', req: true, opts: [['ja', 'Ja, vollständig'], ['teilweise', 'Teilweise'], ['nein', 'Nein']] },
      { id: 'behebung', label: 'Wie wurde es behoben bzw. was wurde gemacht?', type: 'textarea', req: true, chips: () => S.lists['fix' + g] },
      { id: 'folge', label: 'Was ist noch zu tun?', type: 'textarea', req: true, show: a => a.behoben && a.behoben !== 'ja', ph: 'z. B. Ersatzteil bestellen, zweiter Termin' }] },
    { title: 'Material', sub: 'Welches Material wurde verwendet?', fields: [
      { id: 'mat_ja', label: 'Wurde Material verwendet?', type: 'radio', req: true, opts: YN },
      { id: 'material', label: 'Material', type: 'items', req: true, show: a => a.mat_ja === 'ja', ph: 'z. B. MC4-Stecker' }] },
    { title: 'Hinweise', sub: 'Optional.', fields: [
      { id: 'hinweis', label: 'Hinweise für den Kunden oder das Büro', type: 'textarea' }] }
  ];
}

const GEWERKE = {
  DC: { name: 'DC-Montage', desc: 'Module, Strings, Gerüst, Verkabelung', icon: 'sun', color: '#F5A524' },
  AC: { name: 'AC-Montage', desc: 'Wechselrichter, Speicher, Wallbox, Zählerkasten', icon: 'bolt', color: '#3B82F6' },
  SHK: { name: 'SHK', desc: 'Wärmepumpe, Rohrleitungen, Heizkörper', icon: 'flame', color: '#E5484D' }
};
const TYPES = { abnahme: { name: 'Baustellen-Abnahme', short: 'Abnahme', icon: 'hard', pre: 'AB' }, service: { name: 'Serviceauftrag', short: 'Service', icon: 'wrench', pre: 'SV' } };
const stepsOf = r => (r.type === 'service' ? serviceSteps(r.gewerk) : { DC: ABNAHME_DC, AC: ABNAHME_AC, SHK: ABNAHME_SHK }[r.gewerk]);
