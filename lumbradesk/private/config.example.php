<?php
/* LumbraDesk – Zugangsdaten
   Diese Datei als „config.php“ in denselben Ordner kopieren und ausfüllen.
   config.php liegt nur auf dem Server (nie im Git, nie im Chat). */
return [
  // IONOS → Hosting → Datenbanken → MySQL-Datenbank
  'db_host' => 'dbXXXXXXXX.hosting-data.io',
  'db_name' => 'dbsXXXXXXXX',
  'db_user' => 'dbuXXXXXXXX',
  'db_pass' => '',

  // Einmaliger Schlüssel für den Einrichtungs-Assistenten (install.php) – beliebige lange Zeichenfolge
  'setup_token' => '',

  // Nur für Tests ohne HTTPS auf false setzen
  'cookie_secure' => true,

  // Abmelden nach so vielen Minuten ohne Aktivität
  'idle_minutes' => 480,

  // Die Apps stehen jetzt fest in bootstrap.php (LD_APPS)
];
