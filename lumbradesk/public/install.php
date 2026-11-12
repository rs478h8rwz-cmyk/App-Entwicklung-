<?php
/* LumbraDesk – Einrichtungs-Assistent (einmalig)
   1. Datenbank-Zugang eingeben (wird als private/config.php gespeichert)
   2. Tabellen anlegen und ersten Admin erstellen
   Geschützt durch den Einrichtungs-Schlüssel (private/setup_token.php bzw. config.php).
   Sobald es einen Benutzer gibt, ist die Seite gesperrt. */
declare(strict_types=1);
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
$PRIV = is_dir(__DIR__ . '/private') ? __DIR__ . '/private' : __DIR__ . '/../private';
define('LD_PRIV', $PRIV);
$CFG = $PRIV . '/config.php';
$TOKF = $PRIV . '/setup_token.php';
require $PRIV . '/bootstrap.php';

$h = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
$haveCfg = is_file($CFG);
$token = $haveCfg ? (string)(cfg('setup_token') ?? '') : (is_file($TOKF) ? (string)(require $TOKF) : '');
if ($token === '' && is_file($TOKF)) $token = (string)(require $TOKF);

function installed(): bool {
  if (!is_file(LD_PRIV . '/config.php')) return false;
  try { return (int)db()->query('SELECT COUNT(*) FROM users')->fetchColumn() > 0; } catch (Throwable $e) { return false; }
}
function make_schema(PDO $pdo): void {
  foreach (array_filter(array_map('trim', explode(';', preg_replace('/^--.*$/m', '', file_get_contents(LD_PRIV . '/schema.sql'))))) as $sql) $pdo->exec($sql);
}

$msg = ''; $ok = false; $P = $_POST;
if (installed()) { $ok = true; $msg = 'LumbraDesk ist bereits eingerichtet. Diese Seite ist gesperrt.'; if (is_file($TOKF)) @unlink($TOKF); }
elseif (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  if (strlen($token) < 16 || !hash_equals($token, trim((string)($P['token'] ?? '')))) $msg = 'Einrichtungs-Schlüssel falsch.';
  else {
    $email = mb_strtolower(trim((string)($P['email'] ?? ''))); $name = trim((string)($P['name'] ?? '')); $pw = (string)($P['password'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $name === '') $msg = 'Bitte Name und gültige E-Mail eingeben.';
    elseif ($e = pw_ok($pw)) $msg = $e;
    else {
      try {
        if (!$haveCfg) {
          /* Datenbank-Zugang prüfen und als config.php speichern */
          $db = ['db_host' => trim((string)$P['db_host']), 'db_name' => trim((string)$P['db_name']), 'db_user' => trim((string)$P['db_user']), 'db_pass' => (string)$P['db_pass']];
          $pdo = new PDO('mysql:host=' . $db['db_host'] . ';dbname=' . $db['db_name'] . ';charset=utf8mb4', $db['db_user'], $db['db_pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 8]);
          $conf = "<?php\n/* LumbraDesk – Zugangsdaten (vom Einrichtungs-Assistenten angelegt). Nie weitergeben. */\n\$c = require __DIR__ . '/config.example.php';\nreturn array_merge(\$c, " . var_export($db + ['setup_token' => ''], true) . ");\n";
          if (@file_put_contents($CFG, $conf, LOCK_EX) === false) throw new RuntimeException('config.php konnte nicht gespeichert werden (Schreibrechte im Ordner private).');
          @chmod($CFG, 0600);
        } else $pdo = db();
        make_schema($pdo);
        $pdo->prepare("INSERT INTO users (email, name, role, pw_hash, must_change) VALUES (?, ?, 'admin', ?, 0)")->execute([$email, $name, password_hash($pw, PASSWORD_DEFAULT)]);
        $pdo->prepare('INSERT INTO audit_log (user_id, action, detail, ip) VALUES (?, ?, ?, ?)')->execute([(int)$pdo->lastInsertId(), 'eingerichtet', $email, client_ip()]);
        if (is_file($TOKF)) @unlink($TOKF);
        $ok = true; $msg = 'Fertig! LumbraDesk ist eingerichtet. Jetzt anmelden.';
      } catch (PDOException $e) { error_log('LumbraDesk Install: ' . $e->getMessage()); $msg = 'Keine Verbindung zur Datenbank – bitte Hostname, Datenbankname, Benutzer und Passwort prüfen.'; }
      catch (Throwable $e) { error_log('LumbraDesk Install: ' . $e->getMessage()); $msg = $e->getMessage(); }
    }
  }
}
?><!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>LumbraDesk einrichten</title><link rel="stylesheet" href="app.css"></head>
<body><main class="auth"><div class="card">
  <div class="brand"><img src="logo.png" alt=""><div><b>LumbraDesk</b><span>Einrichtung</span></div></div>
  <?php if ($msg): ?><p class="note <?= $ok ? 'ok' : 'err' ?>"><?= $h($msg) ?></p><?php endif; ?>
  <?php if ($ok): ?><a class="btn" href="./" style="width:100%;margin-top:8px">Zur Anmeldung</a>
  <?php elseif (strlen($token) < 16): ?><p class="note err">Kein Einrichtungs-Schlüssel gefunden. Bitte das Paket vollständig hochladen.</p>
  <?php else: ?>
  <form method="post" autocomplete="off">
    <p class="muted">Einmalig: Datenbank verbinden und ersten Admin anlegen.</p>
    <label>Einrichtungs-Schlüssel<input name="token" required value="<?= $h($P['token'] ?? '') ?>"></label>
    <?php if (!$haveCfg): ?>
    <h2 style="font-size:20px;margin-top:20px">Datenbank</h2><p class="muted" style="font-size:13px;margin:4px 0 0">IONOS → Hosting → Datenbanken → Ihre Datenbank (Details)</p>
    <label>Hostname<input name="db_host" required placeholder="dbXXXXXXXXX.hosting-data.io" value="<?= $h($P['db_host'] ?? '') ?>"></label>
    <label>Datenbankname<input name="db_name" required placeholder="dbsXXXXXXXX" value="<?= $h($P['db_name'] ?? '') ?>"></label>
    <label>Benutzername<input name="db_user" required placeholder="dbuXXXXXXXX" value="<?= $h($P['db_user'] ?? '') ?>"></label>
    <label>Datenbank-Passwort<input name="db_pass" type="password" required autocomplete="off"></label>
    <?php endif; ?>
    <h2 style="font-size:20px;margin-top:20px">Dein Admin-Zugang</h2>
    <label>Dein Name<input name="name" required value="<?= $h($P['name'] ?? '') ?>"></label>
    <label>E-Mail<input name="email" type="email" required value="<?= $h($P['email'] ?? '') ?>"></label>
    <label>Passwort (mind. 10 Zeichen, Buchstaben und Zahlen)<input name="password" type="password" required autocomplete="new-password"></label>
    <button class="btn" type="submit">Einrichten</button>
  </form>
  <?php endif; ?>
</div></main></body></html>
