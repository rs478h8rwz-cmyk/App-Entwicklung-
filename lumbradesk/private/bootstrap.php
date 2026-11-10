<?php
/* LumbraDesk – gemeinsamer Unterbau für alle Server-Anfragen
   Datenbank, sichere Sitzung, Rollenprüfung, Protokoll, JSON-Antworten */
declare(strict_types=1);

const ROLES = ['admin' => 'Admin', 'buero' => 'Büro', 'vertrieb' => 'Vertrieb', 'monteur' => 'Monteur'];

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
