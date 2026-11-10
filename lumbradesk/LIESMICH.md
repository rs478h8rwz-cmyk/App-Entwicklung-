# LumbraDesk – Einrichtung bei IONOS (Webhosting Standard)

Paket: `lumbradesk-ionos.zip` (wird mit `python3 lumbradesk/build.py` gebaut).
Inhalt: Ordner `lumbradesk/` mit `public/` (Webseite) und `private/` (Server-Programm, Zugangsdaten).

## 1. Datenbank anlegen
IONOS → Hosting → **Datenbanken** → **Datenbank anlegen** (MySQL/MariaDB).
Notieren: Hostname, Datenbankname, Benutzername. Passwort festlegen und sicher aufbewahren.

## 2. Dateien hochladen
IONOS → Hosting → **Webspace** (Webspace-Explorer) oder per SFTP (z. B. FileZilla).
Den Ordner `lumbradesk/` aus der ZIP in das Hauptverzeichnis des Webspace hochladen.

## 3. Zugangsdaten eintragen
In `lumbradesk/private/` die Datei `config.example.php` kopieren nach **`config.php`** und ausfüllen:
- `db_host`, `db_name`, `db_user`, `db_pass` aus Schritt 1
- `setup_token`: eine lange, zufällige Zeichenfolge (mind. 16 Zeichen) – nur für die Einrichtung

`config.php` nie per Mail/Chat verschicken.

## 4. Domain verbinden
IONOS → **Domains & SSL** → `lumbradesk.de` (oder Subdomain `app.lumbradesk.de`) → Ziel **Webspace** →
Verzeichnis **`/lumbradesk/public`**. SSL-Zertifikat aktivieren. PHP-Version (Hosting → PHP) auf **8.2 oder neuer**.

## 5. Einrichten
`https://lumbradesk.de/install.php` öffnen → Einrichtungs-Schlüssel, eigener Name, E-Mail, Passwort → **Einrichten**.
Danach ist die Seite gesperrt. Anmelden unter `https://lumbradesk.de/`.

## 6. Mitarbeiter anlegen
Startseite → **Benutzer** → Name, E-Mail, Rolle → **Anlegen**. Das Einmal-Passwort persönlich weitergeben;
beim ersten Anmelden wird ein eigenes Passwort festgelegt.

Rollen: Admin (alles), Büro, Vertrieb (Wirtschaftlichkeit), Monteur (noch keine App – Stempeluhr und Abnahme bleiben auf Netlify).

## 7. Kunden aus der bisherigen App übernehmen
Die Kunden liegen bisher nur auf dem jeweiligen Gerät (Netlify-Adresse). Einmalig:
alte App → Einstellungen → Datensicherung → **Sicherung erstellen** → neue App unter LumbraDesk → **Sicherung einspielen**.

## Updates
Neues Paket bauen und den Ordner `lumbradesk/` erneut hochladen (überschreiben). `config.php` bleibt erhalten,
weil sie nicht im Paket ist.
