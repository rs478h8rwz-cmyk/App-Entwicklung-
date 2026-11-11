# LumbraDesk (lumbradesk.de) mit den Apps von Frühauf Solar

Server-System auf IONOS (PHP + MySQL) in `lumbradesk/`. Darin laufen unter einem Login die Wirtschaftlichkeits-App
(`/rechner/`), die Stempeluhr (`/stempel/`) und Abnahme & Service (`/abnahme/`). Es gibt keine Netlify-Versionen mehr.
Auslieferung nur über das LumbraDesk-Update: `python3 lumbradesk/build.py` → `lumbradesk-update.zip`
(einspielen in LumbraDesk unter System → Update). Bei LumbraDesk-Änderungen `LD_VERSION` in `lumbradesk/private/bootstrap.php` erhöhen.

## Sprache
- Alles auf **Deutsch**: Oberfläche, PDF-Texte, Kommentare, Antworten an den Nutzer.

## Aufbau
- Quellen: `fruehauf-energy-quellen/src/` (Teile werden in fester Reihenfolge zusammengefügt).
- Bauen: `bash fruehauf-energy-quellen/build.sh` → schreibt `fruehauf-energy/index.html` und `fruehauf-energy/sw.js`.
- Nie `fruehauf-energy/index.html` direkt bearbeiten – immer die Quellen.

## Bei JEDER Änderung an der App (Pflicht)
1. **Versionsnummer erhöhen**: in `src/17-whatsnew.js` oben in `RELEASES` eine neue Version eintragen
   (z. B. 1.41 → 1.42, Datum), mit 1–4 Punkten „was ist neu“ und je einem kleinen Beispielbild
   (`WN_IMG` / `WN_BG`). Die Nummer erscheint automatisch in App-Fußzeile, Update-Hinweis und sw.js.
   Ältere Einträge können aus `RELEASES` nach `ARCHIVE` in `src/18-archive.js` wandern (Versionsarchiv).
2. **Tutorial prüfen und anpassen**: `TUTORIAL` in `src/12-features.js`, und die
   Schritt-für-Schritt-Anleitung (`guideCard` in `src/14-extras.js`), falls Abläufe sich ändern.
3. Bauen, testen (PDF in beiden Layouts: komplett und Vertriebs-PDF; Seiten dürfen nicht in die
   Fußzeile laufen), `python3 lumbradesk/build.py`, committen, pushen, `lumbradesk-update.zip` an den Nutzer senden.

## Wichtige Regeln
- Admin-Passwort nur als PBKDF2-Hash im Code (nie im Klartext).
- Keine erfundenen Kundenbewertungen; keine Markenlogos/geschützten Designs nachzeichnen.
- PDF entsteht mit html2canvas: keine `letter-spacing`/`tabular-nums` in `.page`, kein `object-fit`,
  Symbole im PDF als Bild (`sImg`) statt Inline-SVG in Flex-Containern.
- Bibliotheken/Schriften liegen lokal in `fruehauf-energy/vendor/` (werden lange gecacht –
  neue Schriften daher in `src/01-head.html` einbinden). Stempeluhr und Abnahme nutzen dieselben Dateien.

## Zweite App: Abnahme & Service
- Quellen: `fruehauf-abnahme-quellen/src/` → Bauen: `bash fruehauf-abnahme-quellen/build.sh` → `fruehauf-abnahme/index.html` + `sw.js`.
- Nie mit der Wirtschaftlichkeits-App vermischen; läuft unter `lumbradesk.de/abnahme/` (Abgleich: `src/08-lumbra.js`).
- Gleicher Stil (Schriften, Karten, Knöpfe, hell/dunkel). PDF direkt mit jsPDF (kein html2canvas).
- Bei Änderungen `APP_VERSION` in `src/03-core.js` erhöhen.

## Dritte App: Stempeluhr
- Quellen: `fruehauf-stempel-quellen/src/` → Bauen: `bash fruehauf-stempel-quellen/build.sh` → `fruehauf-stempel/`.
- Läuft unter `lumbradesk.de/stempel/` (Abgleich: `src/09-lumbra.js`, Auswertung: `src/10-auswertung.js`). Gleicher Stil wie die anderen Apps.
- Admin-Passwort nur als PBKDF2-Hash (`ADMIN_DEFAULT` in `src/03-core.js`); Freigabe-Feld ohne <form>/type=password (kein „Passwort speichern“).
- Bei Änderungen `APP_VERSION` in `src/03-core.js` erhöhen.
