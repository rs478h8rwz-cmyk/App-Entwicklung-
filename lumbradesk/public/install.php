<?php
/* LumbraDesk – Einrichtungs-Assistent (einmalig)
   Legt die Tabellen an und den ersten Admin. Funktioniert nur, solange es noch keinen Benutzer gibt,
   und nur mit dem Einrichtungs-Schlüssel aus config.php. */
declare(strict_types=1);
require __DIR__ . '/../private/bootstrap.php';
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function installed(): bool {
  try { return (int)db()->query('SELECT COUNT(*) FROM users')->fetchColumn() > 0; } catch (Throwable $e) { return false; }
}
$msg = ''; $ok = false;
if (installed()) { $ok = true; $msg = 'LumbraDesk ist bereits eingerichtet. Diese Seite ist gesperrt.'; }
elseif (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  $tok = (string)cfg('setup_token');
  if (strlen($tok) < 16 || !hash_equals($tok, (string)($_POST['token'] ?? ''))) $msg = 'Einrichtungs-Schlüssel falsch (oder in config.php kürzer als 16 Zeichen).';
  else {
    $email = mb_strtolower(trim((string)($_POST['email'] ?? ''))); $name = trim((string)($_POST['name'] ?? '')); $pw = (string)($_POST['password'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $name === '') $msg = 'Bitte Name und gültige E-Mail eingeben.';
    elseif ($e = pw_ok($pw)) $msg = $e;
    else {
      try {
        foreach (array_filter(array_map('trim', explode(';', preg_replace('/^--.*$/m', '', file_get_contents(__DIR__ . '/../private/schema.sql'))))) as $sql) db()->exec($sql);
        db()->prepare("INSERT INTO users (email, name, role, pw_hash, must_change) VALUES (?, ?, 'admin', ?, 0)")->execute([$email, $name, password_hash($pw, PASSWORD_DEFAULT)]);
        audit((int)db()->lastInsertId(), 'eingerichtet', $email);
        $ok = true; $msg = 'Fertig! LumbraDesk ist eingerichtet. Jetzt anmelden.';
      } catch (Throwable $e) { error_log('LumbraDesk Install: ' . $e->getMessage()); $msg = 'Datenbank-Fehler – bitte die Zugangsdaten in config.php prüfen.'; }
    }
  }
}
$h = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
?><!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LumbraDesk einrichten</title><link rel="stylesheet" href="app.css"></head>
<body><main class="auth"><div class="card">
  <div class="brand"><img src="logo.png" alt=""><div><b>LumbraDesk</b><span>Einrichtung</span></div></div>
  <?php if ($msg): ?><p class="note <?= $ok ? 'ok' : 'err' ?>"><?= $h($msg) ?></p><?php endif; ?>
  <?php if ($ok): ?><a class="btn" href="./">Zur Anmeldung</a>
  <?php else: ?>
  <form method="post" autocomplete="off">
    <p class="muted">Einmalig: Tabellen anlegen und ersten Admin erstellen.</p>
    <label>Einrichtungs-Schlüssel (aus config.php)<input name="token" required></label>
    <label>Dein Name<input name="name" required value="<?= $h($_POST['name'] ?? '') ?>"></label>
    <label>E-Mail<input name="email" type="email" required value="<?= $h($_POST['email'] ?? '') ?>"></label>
    <label>Passwort (mind. 10 Zeichen, Buchstaben und Zahlen)<input name="password" type="password" required autocomplete="new-password"></label>
    <button class="btn" type="submit">Einrichten</button>
  </form>
  <?php endif; ?>
</div></main></body></html>
