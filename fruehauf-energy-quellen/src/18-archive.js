/* =========================================================
   Versionsarchiv – was in früheren Versionen geändert wurde
   (neueste zuerst; aktuelle Versionen stehen in RELEASES)
   ========================================================= */
const ARCHIVE = [
  ['1.39', '2026-11-07', 'Fenster „Neu in dieser Version“ erscheint einmal nach jedem Update – mit Beispielbildern.'],
  ['1.38', '2026-11-07', 'Deckblatt: Wallbox an der Hauswand statt vor dem Fenster, Auto mit schmalerem Aufbau.'],
  ['1.37', '2026-11-07', 'Deckblatt: wieder das ursprüngliche Auto.'],
  ['1.36', '2026-11-07', 'Deckblatt: E-Limousine ausprobiert.'],
  ['1.35', '2026-11-07', 'Deckblatt: großer SUV ausprobiert.'],
  ['1.34', '2026-11-07', 'Deckblatt-Haus: Stromspeicher steht an der Hauswand statt eines Fensters.'],
  ['1.33', '2026-11-07', 'Deckblatt-Haus klassisch oder modern, Licht an/aus/automatisch, Carport mit E-Auto und Wallbox, Speicher-Tower. Haus und Licht pro PDF nur nach Admin-Freigabe.'],
  ['1.32', '2026-11-07', 'Handschrift für Ort und Datum fest eingebunden; Updates laden Bibliotheken immer frisch.'],
  ['1.31', '2026-11-07', 'Hinweis „Neue Version verfügbar“ funktioniert zuverlässig.'],
  ['1.30', '2026-11-07', 'Unterschriftsfelder mit Hintergrund ohne Strich, Beschriftung im Feld.'],
  ['1.29', '2026-11-07', 'Unterschriftsfelder mit einstellbarem Hintergrund und Handschrift, Ansprechpartner nur einmal, neue letzte Seite „Das sagen Kunden“.'],
  ['1.28', '2026-11-07', 'PDF: mehr Abstand unter Überschriften und im Tabellenkopf.'],
  ['1.27', '2026-11-07', 'Kopfleiste scharf auf dem iPhone, Navigation mit mehr Platz.'],
  ['1.26', '2026-11-07', 'Keine doppelten Komponenten und Garantien; zu volle Seiten werden automatisch eingepasst.'],
  ['1.25', '2026-11-07', 'Wärmepumpen-Illustration: Pfeile ohne Zwischenstücke.'],
  ['1.24', '2026-11-07', 'Illustrationen mit klaren Pfeilen, Dach so breit wie das Haus, nur „Außenluft“; Texte zum Jahresverlauf und Winter positiv formuliert.'],
  ['1.23', '2026-11-07', 'Vor dem PDF: Fenster mit Sonderrabatt, Layout, Verkleinern und QR-Code.'],
  ['1.22', '2026-11-07', 'Hersteller und Garantien aus dem Angebot (Module, Wechselrichter, Speicher, Wärmepumpe), Puffer- und Warmwasserspeicher, EU-Wertschöpfungsbonus automatisch.'],
  ['1.21', '2026-11-07', 'Ratenrechner, QR-Code, E-Mail-Versand, kleine PDF, Anleitung für iPhone und Android, Erinnerungen, Update-Hinweis.'],
  ['1.20', '2026-11-07', 'Rechengrundlagen standardmäßig aus (außer beim optimistischen Szenario); Abstände großer Zahlen im Vertriebs-PDF.'],
  ['1.19', '2026-11-07', 'PDF-Kopfzeile mit weichem Farbverlauf und wählbarer Endfarbe, Lesbarkeit automatisch.'],
  ['1.18', '2026-11-07', 'Logo im dunklen Modus auf hellem Feld.'],
  ['1.17', '2026-11-07', '„So funktioniert Ihre Photovoltaikanlage“ als Illustration, Datumsfeld auf dem iPhone korrigiert.'],
  ['1.16', '2026-11-07', 'Tagesdiagramm: Hinweis auf die Sommerpause der Wärmepumpe mit Heizstab.'],
  ['1.15', '2026-11-07', 'Tagesdiagramm: Anteil der Wärmepumpe sichtbar.'],
  ['1.14', '2026-11-07', 'Vertriebs-PDF als zweites Layout, Widerrufsbelehrung, Impressum und Datenschutz, Deckblatt-Hintergrund mit Stärke, Studio-Ansicht entfernt.'],
  ['1.13', '2026-11-06', 'Deckblatt-Angaben einzeln per Schieberegler positionieren.'],
  ['1.12', '2026-11-06', 'Beraterfoto im PDF, Deckblatt-Angaben wählbar, PDF-Farben vom eigenen Deckblatt.'],
  ['1.11', '2026-11-06', 'Wärmepumpen-Stromtarif als Option, Texte im Dokument korrigiert.'],
  ['1.10', '2026-11-06', 'Admin-Schutz, Offline-Betrieb, PVGIS-Ertrag, E-Auto, Status und Nachfassen, Varianten, Unterschrift auf dem Gerät, Tutorial.'],
  ['1.09', '2026-11-05', 'PDF-Feinschliff: Wärmepumpen-Illustration, schwarze Module, Heizöl.'],
  ['1.08', '2026-11-05', 'Dritte Ansicht „Studio“ (später wieder entfernt), Zahlen in Kreisen mittig.'],
  ['1.07', '2026-11-05', 'Tagesverlauf mit Speicher und Monatsregler, Heizstab-Option.'],
  ['1.06', '2026-11-05', 'Bessere Angebotserkennung für Frühauf-Solar-Angebote, Dokument verständlicher.'],
  ['1.05', '2026-11-05', 'iPhone-Vollbild mit Abstand zur Dynamic Island; Signet und Kapitelmarke anpassbar.'],
  ['1.04', '2026-11-05', 'Helle und dunkle Ansicht per Schalter, dazu „Wie System“.'],
  ['1.03', '2026-11-05', 'Neue dunkle Designsprache, feste Berater, PDF-Abstände korrigiert.'],
  ['1.02', '2026-11-05', 'Jahresdiagramm, Roadmap nach der Unterschrift und anpassbares Design.'],
  ['1.01', '2026-11-05', 'Erste Version: Angebot hochladen, Wirtschaftlichkeit berechnen, Kunden-PDF erstellen.']
];
function showArchive() {
  const rows = RELEASES.map(r => [r.version, r.date, r.items.map(x => x[1]).join(' · ')]).concat(ARCHIVE);
  modal(`<div><h3 class="h-font text-[26px] pr-8">Versionsarchiv</h3><p class="text-[13px] text-ink3 mt-1">Alle Versionen mit ihren Änderungen – die neueste zuerst.</p>
    <div class="mt-5 divide-y divide-line">${rows.map(([v, d, t], i) => `<div class="py-3 flex gap-4"><div class="w-16 shrink-0"><div class="font-semibold text-[15px] num">${v}</div><div class="text-[11px] text-ink3">${deDate(d)}</div></div><div class="text-[14px] text-ink2 leading-relaxed">${i === 0 ? '<span class="badge mr-1 text-[11px]">aktuell</span>' : ''}${esc(t)}</div></div>`).join('')}</div>
    <div class="flex justify-end mt-5"><button class="btn-p" data-a="modal-close">Schließen</button></div></div>`, { wide: true });
}
