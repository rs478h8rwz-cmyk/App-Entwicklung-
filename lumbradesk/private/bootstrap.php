<?php
/* LumbraDesk – gemeinsamer Unterbau für alle Server-Anfragen
   Datenbank, sichere Sitzung, Rollenprüfung, Protokoll, JSON-Antworten */
declare(strict_types=1);

const LD_VERSION = '5.0';
define('LD_PRIV_DIR', __DIR__);
const ROLES = ['admin' => 'Admin', 'buero' => 'Büro', 'vertrieb' => 'Vertrieb', 'monteur' => 'Monteur'];

/* Apps unter dem LumbraDesk-Login (Kacheln auf der Startseite) – wer welche App öffnen darf */
const LD_APPS = [
  ['key' => 'calc', 'name' => 'Wirtschaftlichkeit', 'text' => 'Berechnungen, Angebote, Modulplan, Stringplan', 'url' => 'rechner/', 'roles' => ['admin', 'buero', 'vertrieb']],
  ['key' => 'modul', 'name' => 'Modulbelegung', 'text' => 'Modulplan direkt öffnen – Dach belegen, Module zählen', 'url' => 'rechner/?start=modul', 'roles' => ['admin', 'buero', 'vertrieb']],
  ['key' => 'quick', 'name' => 'Schnellauslegung', 'text' => 'Wärmepumpen-Schnellauslegung direkt öffnen', 'url' => 'rechner/?start=schnell', 'roles' => ['admin', 'buero', 'vertrieb']],
  ['key' => 'zaehler', 'name' => 'Zählerschrank-Check', 'text' => 'Zählerschrank fotografieren und nach VDE-AR-N 4100 / FNN-Hinweis bewerten', 'url' => '#/zaehler', 'roles' => ['admin', 'buero', 'vertrieb', 'monteur']],
  ['key' => 'stempel', 'name' => 'Stempeluhr', 'text' => 'Arbeitszeit, Urlaub, Stundenzettel', 'url' => 'stempel/', 'roles' => ['admin', 'buero', 'vertrieb', 'monteur']],
  ['key' => 'abnahme', 'name' => 'Abnahme & Service', 'text' => 'Abnahmeprotokolle, Service-Einsätze, Fotos, Unterschrift', 'url' => 'abnahme/', 'roles' => ['admin', 'buero', 'monteur']],
];

/* Neue Funktionen: erst für alle frei, wenn der Admin den Haken setzt (Admins sehen sie immer zum Testen) */
const LD_FEATURES = [
  'angebote' => ['Angebote mit Assistent', 'Angebots-Assistent beim Kunden, Produktdatenbank, Leistungen & Pakete, Knopf „Angebot“ in der Wirtschaftlichkeit'],
  'rechnungen' => ['Rechnungen & Mahnwesen', 'Rechnungen, Abschlags- und Schlussrechnungen aus dem Angebot, E-Rechnung (XRechnung) und Mahnungen'],
  'markieren' => ['Logbuch: Kollegen markieren', 'Beim Logbuch-Eintrag Kollegen markieren – sie bekommen die Nachricht per E-Mail'],
];
function ld_flags(): array {
  static $f = null; if ($f !== null) return $f; $f = [];
  try { db()->exec("CREATE TABLE IF NOT EXISTS ld_settings (k VARCHAR(40) PRIMARY KEY, v TEXT NOT NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_by INT UNSIGNED NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $r = db()->query("SELECT v FROM ld_settings WHERE k = 'features'")->fetchColumn(); $f = $r ? (json_decode($r, true) ?: []) : []; } catch (Throwable $e) {}
  return $f;
}
/* Allgemeine Einstellungen (JSON je Schlüssel) */
function ld_get(string $k, $def = null) { try { ld_flags(); $st = db()->prepare('SELECT v FROM ld_settings WHERE k = ?'); $st->execute([$k]); $r = $st->fetchColumn(); return $r === false ? $def : (json_decode($r, true) ?? $def); } catch (Throwable $e) { return $def; } }
function ld_set(string $k, $v, int $uid): void { ld_flags(); db()->prepare('INSERT INTO ld_settings (k, v, updated_at, updated_by) VALUES (?, ?, UTC_TIMESTAMP(), ?) ON DUPLICATE KEY UPDATE v = VALUES(v), updated_at = UTC_TIMESTAMP(), updated_by = VALUES(updated_by)')->execute([$k, json_encode($v, JSON_UNESCAPED_UNICODE), $uid]); }
function ld_feature(array $u, string $key): bool { return $u['role'] === 'admin' || !empty(ld_flags()[$key]); }
function ld_features_for(array $u): array { $o = []; foreach (LD_FEATURES as $k => $x) $o[$k] = ld_feature($u, $k); return $o; }
function require_feature(array $u, string $key): void { if (!ld_feature($u, $key)) fail('Diese Funktion ist noch nicht freigeschaltet.', 403); }

function cfg(?string $key = null) {
  static $c = null;
  if ($c === null) {
    $f = __DIR__ . '/config.php';
    if (!is_file($f)) { http_response_code(500); exit(json_encode(['error' => 'config.php fehlt auf dem Server'])); }
    $c = require $f;
  }
  return $key === null ? $c : ($c[$key] ?? null);
}

function db(): PDO {
  static $pdo = null;
  if ($pdo === null) {
    $pdo = new PDO('mysql:host=' . cfg('db_host') . ';dbname=' . cfg('db_name') . ';charset=utf8mb4', cfg('db_user'), cfg('db_pass'), [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $pdo->exec("SET time_zone = '+00:00'");
  }
  return $pdo;
}

function client_ip(): string { return substr($_SERVER['REMOTE_ADDR'] ?? '', 0, 64); }

function json_out($data, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}
function fail(string $msg, int $code = 400): void { json_out(['error' => $msg], $code); }

function body(): array {
  $raw = file_get_contents('php://input') ?: '';
  $d = json_decode($raw, true);
  return is_array($d) ? $d : [];
}

/* Sitzung: Cookie nur über HTTPS, nicht per JavaScript lesbar, nicht von fremden Seiten mitgeschickt */
function start_session(): void {
  $dir = __DIR__ . '/sessions';
  if (!is_dir($dir)) @mkdir($dir, 0700, true);
  if (is_dir($dir) && is_writable($dir)) session_save_path($dir);
  session_name('LDSESS');
  session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => (bool)cfg('cookie_secure'), 'httponly' => true, 'samesite' => 'Strict']);
  ini_set('session.use_strict_mode', '1');
  ini_set('session.gc_maxlifetime', (string)(((int)cfg('idle_minutes') ?: 480) * 60));
  session_start();
  /* Abmelden nach Inaktivität */
  $idle = ((int)cfg('idle_minutes') ?: 480) * 60;
  if (!empty($_SESSION['uid']) && (time() - (int)($_SESSION['seen'] ?? 0)) > $idle) { $_SESSION = []; session_regenerate_id(true); }
  if (!empty($_SESSION['uid'])) $_SESSION['seen'] = time();
}

/* Schutz gegen Anfragen von fremden Seiten: eigener Header + gleiche Herkunft */
function check_origin(): void {
  if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') return;
  if (($_SERVER['HTTP_X_LUMBRA'] ?? '') !== '1') fail('Ungültige Anfrage', 403);
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== explode(':', $_SERVER['HTTP_HOST'] ?? '')[0]) fail('Ungültige Herkunft', 403);
}

function current_user(): ?array {
  if (empty($_SESSION['uid'])) return null;
  static $u = false;
  if ($u === false) {
    $st = db()->prepare('SELECT id, email, name, role, must_change, active FROM users WHERE id = ?');
    $st->execute([$_SESSION['uid']]);
    $u = $st->fetch() ?: null;
    if ($u && !$u['active']) { $_SESSION = []; $u = null; }
  }
  return $u;
}
function require_user(bool $allowMustChange = false): array {
  $u = current_user();
  if (!$u) fail('Bitte anmelden', 401);
  if ($u['must_change'] && !$allowMustChange) fail('Bitte zuerst ein neues Passwort festlegen', 403);
  return $u;
}
function require_role(array $roles): array {
  $u = require_user();
  if (!in_array($u['role'], $roles, true)) fail('Keine Berechtigung', 403);
  return $u;
}

function audit(?int $uid, string $action, string $detail = ''): void {
  try { db()->prepare('INSERT INTO audit_log (user_id, action, detail, ip) VALUES (?, ?, ?, ?)')->execute([$uid, $action, mb_substr($detail, 0, 500), client_ip()]); } catch (Throwable $e) {}
}

function pw_ok(string $pw): ?string {
  if (mb_strlen($pw) < 10) return 'Das Passwort muss mindestens 10 Zeichen haben.';
  if (!preg_match('/[A-Za-zÄÖÜäöüß]/u', $pw) || !preg_match('/\d/', $pw)) return 'Das Passwort braucht Buchstaben und Zahlen.';
  return null;
}
/* Einmal-Passwort für neue Benutzer bzw. beim Zurücksetzen (gut lesbar, ohne verwechselbare Zeichen) */
function temp_password(): string {
  $a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; $s = '';
  for ($i = 0; $i < 12; $i++) $s .= $a[random_int(0, strlen($a) - 1)];
  return substr($s, 0, 4) . '-' . substr($s, 4, 4) . '-' . substr($s, 8, 4);
}
function user_out(array $u): array {
  return ['id' => (int)$u['id'], 'email' => $u['email'], 'name' => $u['name'], 'role' => $u['role'], 'roleName' => ROLES[$u['role']] ?? $u['role'], 'mustChange' => (bool)$u['must_change'], 'active' => (bool)($u['active'] ?? 1), 'lastLogin' => $u['last_login'] ?? null];
}

/* Firmen-Einstellungen: Zeile lesen (Tabelle bei älteren Installationen bei Bedarf anlegen) */
function cfg_row(): ?array {
  try { $r = db()->query('SELECT version, data, updated_at, updated_by FROM company_config WHERE id = 1')->fetch(); return $r ?: null; }
  catch (PDOException $e) {
    db()->exec("CREATE TABLE IF NOT EXISTS company_config (id TINYINT UNSIGNED PRIMARY KEY, version INT UNSIGNED NOT NULL DEFAULT 0, data LONGTEXT NOT NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_by VARCHAR(120) NOT NULL DEFAULT '') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    return null;
  }
}
/* Bilder der Firmen-Einstellungen (Logo, Deckblatt, Produktbilder …) – im gesperrten Ordner private/files */
function files_dir(): string {
  $d = __DIR__ . '/files';
  if (!is_dir($d)) { @mkdir($d, 0700, true); @file_put_contents($d . '/.htaccess', "Require all denied\n"); }
  return $d;
}

/* ---------- Kunden (Projekte) ---------- */
function projects_table(): void {
  static $done = false; if ($done) return; $done = true;
  db()->exec("CREATE TABLE IF NOT EXISTS projects (id VARCHAR(40) PRIMARY KEY, owner_id INT UNSIGNED NOT NULL, created_by INT UNSIGNED NOT NULL, assigned_by INT UNSIGNED NULL, assigned_at DATETIME NULL, name VARCHAR(200) NOT NULL DEFAULT '', data LONGTEXT NOT NULL, version INT UNSIGNED NOT NULL DEFAULT 1, deleted TINYINT(1) NOT NULL DEFAULT 0, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_by INT UNSIGNED NULL, INDEX (owner_id), INDEX (created_by), INDEX (deleted)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $cols = array_column(db()->query('SHOW COLUMNS FROM projects')->fetchAll(), 'Field');   // Kundennummer je Gewerk (4.7)
  if (!in_array('kdnr', $cols, true)) db()->exec("ALTER TABLE projects ADD COLUMN kdnr VARCHAR(30) NULL, ADD COLUMN gewerk VARCHAR(12) NULL, ADD INDEX (kdnr)");
}
/* Wer sieht was: Admin und Büro alle Kunden, alle anderen die eigenen (zuständig oder selbst angelegt) */
function sees_all(array $u): bool { return in_array($u['role'], ['admin', 'buero'], true); }
function can_see_project(array $u, ?array $p): bool { return $p && (sees_all($u) || (int)$p['owner_id'] === (int)$u['id'] || (int)$p['created_by'] === (int)$u['id']); }
function project_row(string $id): ?array {
  projects_table(); $st = db()->prepare('SELECT * FROM projects WHERE id = ?'); $st->execute([$id]); return $st->fetch() ?: null;
}
function valid_id(string $s): bool { return (bool)preg_match('/^[A-Za-z0-9_-]{1,40}$/', $s); }
function pfiles_dir(string $pid): string {
  $base = __DIR__ . '/pfiles';
  if (!is_dir($base)) { @mkdir($base, 0700, true); @file_put_contents($base . '/.htaccess', "Require all denied\n"); }
  $d = $base . '/' . $pid; if (!is_dir($d)) @mkdir($d, 0700, true); return $d;
}
function user_names(): array {
  static $m = null; if ($m === null) { $m = []; foreach (db()->query('SELECT id, name FROM users')->fetchAll() as $r) $m[(int)$r['id']] = $r['name']; } return $m;
}
function project_meta(array $p): array {
  $n = user_names();
  return ['id' => $p['id'], 'v' => (int)$p['version'], 'owner' => (int)$p['owner_id'], 'ownerName' => $n[(int)$p['owner_id']] ?? '', 'by' => (int)$p['created_by'], 'byName' => $n[(int)$p['created_by']] ?? '',
    'assignedBy' => $p['assigned_by'] ? (int)$p['assigned_by'] : null, 'assignedByName' => $p['assigned_by'] ? ($n[(int)$p['assigned_by']] ?? '') : '', 'assignedAt' => $p['assigned_at'], 'upd' => $p['updated_at'], 'updBy' => $n[(int)($p['updated_by'] ?? 0)] ?? '', 'kdnr' => (string)($p['kdnr'] ?? '')];
}

/* ---------- E-Mail (IONOS-Postfach, SMTP) ---------- */
function mail_cfg(): array {
  $f = __DIR__ . '/mail.php'; $c = is_file($f) ? (require $f) : [];
  return array_merge(['from' => '', 'name' => 'LumbraDesk', 'host' => 'smtp.ionos.de', 'port' => 587, 'enc' => 'tls', 'user' => '', 'pass' => '', 'base' => ''], is_array($c) ? $c : []);
}
function mail_save(array $c): void {
  $f = __DIR__ . '/mail.php';
  file_put_contents($f, "<?php\n/* LumbraDesk – Postfach (unter System eingetragen). Nie weitergeben. */\nreturn " . var_export($c, true) . ";\n", LOCK_EX); @chmod($f, 0600);
}
function base_url(): string {
  $b = rtrim((string)mail_cfg()['base'], '/');
  return $b !== '' ? $b : 'https://' . preg_replace('/[^A-Za-z0-9.:-]/', '', (string)($_SERVER['HTTP_HOST'] ?? 'lumbradesk.de'));
}
/* kleine SMTP-Verbindung (STARTTLS 587, SSL 465) – ohne Zusatzbibliothek */
function smtp_send(array $c, string $to, string $subject, string $text, string $html): void {
  $host = ($c['enc'] === 'ssl' ? 'ssl://' : '') . $c['host'];
  $s = @stream_socket_client($host . ':' . (int)$c['port'], $errno, $err, 15);
  if (!$s) throw new RuntimeException("Keine Verbindung zum Mailserver ($err)");
  stream_set_timeout($s, 20);
  $read = function () use ($s) { $r = ''; while (($l = fgets($s, 515)) !== false) { $r .= $l; if (strlen($l) < 4 || $l[3] === ' ') break; } return $r; };
  $cmd = function (string $c, array $ok) use ($s, $read) { if ($c !== '') fwrite($s, $c . "\r\n"); $r = $read(); if (!in_array((int)substr($r, 0, 3), $ok, true)) throw new RuntimeException('Mailserver: ' . trim(preg_replace('/\s+/', ' ', $r))); return $r; };
  $cmd('', [220]); $ehlo = 'EHLO ' . (parse_url(base_url(), PHP_URL_HOST) ?: 'localhost'); $cmd($ehlo, [250]);
  if ($c['enc'] === 'tls') { $cmd('STARTTLS', [220]); if (!stream_socket_enable_crypto($s, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) throw new RuntimeException('TLS fehlgeschlagen'); $cmd($ehlo, [250]); }
  if ($c['user'] !== '') { $cmd('AUTH LOGIN', [334]); $cmd(base64_encode($c['user']), [334]); $cmd(base64_encode($c['pass']), [235]); }
  $cmd('MAIL FROM:<' . $c['from'] . '>', [250]); $cmd('RCPT TO:<' . $to . '>', [250, 251]); $cmd('DATA', [354]);
  $msg = mail_message($c, $to, $subject, $text, $html);
  fwrite($s, preg_replace('/^\./m', '..', $msg) . "\r\n.\r\n"); $cmd('', [250]); $cmd('QUIT', [221]); fclose($s);
}
function mail_message(array $c, string $to, string $subject, string $text, string $html): string {
  $b = 'ld' . bin2hex(random_bytes(8)); $enc = fn($s) => '=?UTF-8?B?' . base64_encode($s) . '?=';
  return implode("\r\n", ['Date: ' . date('r'), 'From: ' . $enc($c['name'] ?: 'LumbraDesk') . ' <' . $c['from'] . '>', 'To: <' . $to . '>', 'Subject: ' . $enc($subject),
    'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . (substr(strrchr($c['from'], '@'), 1) ?: 'lumbradesk.de') . '>', 'MIME-Version: 1.0', 'Content-Type: multipart/alternative; boundary="' . $b . '"', '',
    '--' . $b, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', chunk_split(base64_encode($text)),
    '--' . $b, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', chunk_split(base64_encode($html)), '--' . $b . '--', '']);
}
function send_mail(string $to, string $subject, string $text, string $html): void {
  $c = mail_cfg();
  if ($c['from'] === '') throw new RuntimeException('Absender-Adresse fehlt (System → E-Mail).');
  if ($c['pass'] !== '' || $c['enc'] === 'none') { smtp_send($c, $to, $subject, $text, $html); return; }
  /* ohne SMTP-Passwort: PHP-Mailfunktion von IONOS */
  $m = mail_message($c, $to, $subject, $text, $html); [$head, $body] = explode("\r\n\r\n", $m, 2);
  $head = preg_replace('/^(To|Subject): .*\r\n/m', '', $head . "\r\n");
  if (!@mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, rtrim($head), '-f' . $c['from'])) throw new RuntimeException('E-Mail konnte nicht versendet werden (PHP-Mail). Bitte unter System das Postfach-Passwort eintragen.');
}
/* E-Mail im LumbraDesk-Stil */
function mail_tpl(string $hello, string $intro, string $btn, string $url, string $outro): array {
  $h = fn($s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
  $html = '<!doctype html><html><body style="margin:0;background:#F4F6F8;font-family:Arial,Helvetica,sans-serif;color:#0F1B26"><div style="max-width:520px;margin:0 auto;padding:28px 16px">'
    . '<div style="margin-bottom:18px"><img src="' . $h(base_url() . '/wordmark-navy.png') . '" alt="lumbra.desk" width="160" height="21" style="display:block;border:0"></div>'
    . '<div style="background:#fff;border:1px solid #E3E8EE;border-radius:14px;padding:24px"><p style="font-size:16px;margin:0 0 12px">' . $h($hello) . '</p><p style="font-size:15px;line-height:1.5;margin:0 0 20px">' . $h($intro) . '</p>'
    . '<a href="' . $h($url) . '" style="display:inline-block;background:#0E7C66;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:9px">' . $h($btn) . '</a>'
    . '<p style="font-size:13px;color:#6B7884;line-height:1.5;margin:20px 0 0">' . $h($outro) . '<br>Falls der Knopf nicht geht: <a href="' . $h($url) . '" style="color:#0E7C66;word-break:break-all">' . $h($url) . '</a></p></div></div></body></html>';
  return [$hello . "\n\n" . $intro . "\n\n" . $btn . ': ' . $url . "\n\n" . $outro . "\n", $html];
}
/* ---------- Einmal-Links (Einladung, Passwort vergessen) ---------- */
function tokens_table(): void {
  static $d = false; if ($d) return; $d = true;
  db()->exec("CREATE TABLE IF NOT EXISTS user_tokens (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NOT NULL, token_hash CHAR(64) NOT NULL UNIQUE, purpose VARCHAR(10) NOT NULL, expires_at DATETIME NOT NULL, used_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}
function make_token(int $uid, string $purpose, int $hours): string {
  tokens_table(); $t = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
  db()->prepare('DELETE FROM user_tokens WHERE user_id = ? AND used_at IS NULL')->execute([$uid]);
  db()->prepare('INSERT INTO user_tokens (user_id, token_hash, purpose, expires_at) VALUES (?, ?, ?, UTC_TIMESTAMP() + INTERVAL ? HOUR)')->execute([$uid, hash('sha256', $t), $purpose, $hours]);
  return $t;
}
function find_token(string $t): ?array {
  if (!preg_match('/^[A-Za-z0-9_-]{30,60}$/', $t)) return null; tokens_table();
  $st = db()->prepare('SELECT t.*, u.name, u.email, u.active FROM user_tokens t JOIN users u ON u.id = t.user_id WHERE t.token_hash = ? AND t.used_at IS NULL AND t.expires_at > UTC_TIMESTAMP()');
  $st->execute([hash('sha256', $t)]); $r = $st->fetch(); return $r && $r['active'] ? $r : null;
}
function send_invite(array $u, bool $reset = false): void {
  $t = make_token((int)$u['id'], $reset ? 'reset' : 'invite', $reset ? 2 : 72); $url = base_url() . '/?setpw=' . $t; $first = explode(' ', trim($u['name']))[0];
  [$text, $html] = $reset
    ? mail_tpl("Hallo $first,", 'du hast ein neues Passwort für LumbraDesk angefordert. Über den Knopf legst du es fest.', 'Neues Passwort festlegen', $url, 'Der Link gilt 2 Stunden. Wenn du das nicht angefordert hast, ignoriere diese E-Mail einfach – dein Passwort bleibt unverändert.')
    : mail_tpl("Hallo $first,", 'für dich wurde ein Zugang zu LumbraDesk von Frühauf Solar angelegt. Über den Knopf legst du dein eigenes Passwort fest – danach kannst du dich mit deiner E-Mail-Adresse anmelden.', 'Passwort festlegen', $url, 'Der Link gilt 3 Tage und kann nur einmal benutzt werden.');
  send_mail($u['email'], $reset ? 'LumbraDesk: neues Passwort festlegen' : 'Dein Zugang zu LumbraDesk', $text, $html);
}
