<?php
/* LumbraDesk – Server-Schnittstelle: /api/?r=<aktion>
   Login, eigenes Konto, Benutzerverwaltung (nur Admin), Protokoll */
declare(strict_types=1);
require __DIR__ . '/../../private/bootstrap.php';

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
start_session();
check_origin();

$r = $_GET['r'] ?? '';
$m = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
  switch ("$m $r") {

    /* ---------- Anmeldung ---------- */
    case 'GET me': {
      $u = current_user();
      if (!$u) json_out(['user' => null]);
      $apps = array_values(array_filter(cfg('apps') ?: [], fn($a) => in_array($u['role'], $a['roles'] ?? [], true)));
      json_out(['user' => user_out($u), 'apps' => $u['must_change'] ? [] : $apps, 'roles' => ROLES]);
    }
    case 'POST login': {
      $b = body(); $email = mb_strtolower(trim((string)($b['email'] ?? ''))); $pw = (string)($b['password'] ?? '');
      if ($email === '' || $pw === '') fail('Bitte E-Mail und Passwort eingeben.');
      /* Zu viele Fehlversuche: kurz sperren (15 Minuten) */
      $st = db()->prepare('SELECT (SELECT COUNT(*) FROM login_attempts WHERE email = ? AND at > UTC_TIMESTAMP() - INTERVAL 15 MINUTE) AS e, (SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND at > UTC_TIMESTAMP() - INTERVAL 15 MINUTE) AS i');
      $st->execute([$email, client_ip()]); $n = $st->fetch();
      if ($n['e'] >= 5 || $n['i'] >= 20) { audit(null, 'login_gesperrt', $email); fail('Zu viele Fehlversuche. Bitte in 15 Minuten erneut versuchen.', 429); }
      $st = db()->prepare('SELECT * FROM users WHERE email = ?'); $st->execute([$email]); $u = $st->fetch();
      if (!$u || !$u['active'] || !password_verify($pw, $u['pw_hash'])) {
        db()->prepare('INSERT INTO login_attempts (email, ip) VALUES (?, ?)')->execute([$email, client_ip()]);
        audit($u['id'] ?? null, 'login_fehler', $email);
        usleep(300000);
        fail('E-Mail oder Passwort falsch.', 401);
      }
      if (password_needs_rehash($u['pw_hash'], PASSWORD_DEFAULT)) db()->prepare('UPDATE users SET pw_hash = ? WHERE id = ?')->execute([password_hash($pw, PASSWORD_DEFAULT), $u['id']]);
      session_regenerate_id(true);
      $_SESSION['uid'] = (int)$u['id']; $_SESSION['seen'] = time();
      db()->prepare('UPDATE users SET last_login = UTC_TIMESTAMP() WHERE id = ?')->execute([$u['id']]);
      db()->prepare('DELETE FROM login_attempts WHERE email = ?')->execute([$email]);
      audit((int)$u['id'], 'login');
      json_out(['user' => user_out($u)]);
    }
    case 'POST logout': {
      $u = current_user(); if ($u) audit((int)$u['id'], 'logout');
      $_SESSION = []; session_regenerate_id(true); session_destroy();
      json_out(['ok' => true]);
    }
    case 'POST password': {
      $u = require_user(true); $b = body();
      $st = db()->prepare('SELECT pw_hash FROM users WHERE id = ?'); $st->execute([$u['id']]);
      if (!password_verify((string)($b['old'] ?? ''), $st->fetchColumn())) fail('Das bisherige Passwort stimmt nicht.');
      $new = (string)($b['new'] ?? ''); if ($e = pw_ok($new)) fail($e);
      if ($new === (string)($b['old'] ?? '')) fail('Bitte ein anderes Passwort als bisher wählen.');
      db()->prepare('UPDATE users SET pw_hash = ?, must_change = 0 WHERE id = ?')->execute([password_hash($new, PASSWORD_DEFAULT), $u['id']]);
      session_regenerate_id(true);
      audit((int)$u['id'], 'passwort_geaendert');
      json_out(['ok' => true]);
    }

    /* ---------- Benutzerverwaltung (nur Admin) ---------- */
    case 'GET users': {
      require_role(['admin']);
      $rows = db()->query('SELECT id, email, name, role, must_change, active, last_login FROM users ORDER BY active DESC, name')->fetchAll();
      json_out(['users' => array_map('user_out', $rows)]);
    }
    case 'POST users': {
      $me = require_role(['admin']); $b = body();
      $email = mb_strtolower(trim((string)($b['email'] ?? ''))); $name = trim((string)($b['name'] ?? '')); $role = (string)($b['role'] ?? 'monteur');
      if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Bitte eine gültige E-Mail-Adresse eingeben.');
      if ($name === '') fail('Bitte den Namen eingeben.');
      if (!isset(ROLES[$role])) fail('Unbekannte Rolle.');
      $st = db()->prepare('SELECT id FROM users WHERE email = ?'); $st->execute([$email]); if ($st->fetch()) fail('Diese E-Mail-Adresse gibt es schon.');
      $tmp = temp_password();
      db()->prepare('INSERT INTO users (email, name, role, pw_hash, must_change) VALUES (?, ?, ?, ?, 1)')->execute([$email, $name, $role, password_hash($tmp, PASSWORD_DEFAULT)]);
      audit((int)$me['id'], 'benutzer_angelegt', "$name <$email> als " . ROLES[$role]);
      json_out(['ok' => true, 'tempPassword' => $tmp]);
    }
    case 'POST user-update': {
      $me = require_role(['admin']); $b = body(); $id = (int)($b['id'] ?? 0);
      $st = db()->prepare('SELECT * FROM users WHERE id = ?'); $st->execute([$id]); $u = $st->fetch(); if (!$u) fail('Benutzer nicht gefunden.', 404);
      $out = ['ok' => true];
      if (isset($b['role'])) {
        if (!isset(ROLES[$b['role']])) fail('Unbekannte Rolle.');
        if ($id === (int)$me['id'] && $b['role'] !== 'admin') fail('Die eigene Admin-Rolle kann man sich nicht selbst nehmen.');
        db()->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$b['role'], $id]); audit((int)$me['id'], 'rolle_geaendert', $u['email'] . ' → ' . ROLES[$b['role']]);
      }
      if (isset($b['active'])) {
        if ($id === (int)$me['id']) fail('Das eigene Konto kann man nicht sperren.');
        db()->prepare('UPDATE users SET active = ? WHERE id = ?')->execute([$b['active'] ? 1 : 0, $id]); audit((int)$me['id'], $b['active'] ? 'benutzer_aktiviert' : 'benutzer_gesperrt', $u['email']);
      }
      if (!empty($b['resetPassword'])) {
        $tmp = temp_password();
        db()->prepare('UPDATE users SET pw_hash = ?, must_change = 1 WHERE id = ?')->execute([password_hash($tmp, PASSWORD_DEFAULT), $id]);
        db()->prepare('DELETE FROM login_attempts WHERE email = ?')->execute([$u['email']]);
        audit((int)$me['id'], 'passwort_zurueckgesetzt', $u['email']); $out['tempPassword'] = $tmp;
      }
      json_out($out);
    }
    case 'GET audit': {
      require_role(['admin']);
      $rows = db()->query('SELECT a.at, a.action, a.detail, a.ip, u.name FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 200')->fetchAll();
      json_out(['entries' => $rows]);
    }

    default: fail('Unbekannte Aktion', 404);
  }
} catch (PDOException $e) {
  error_log('LumbraDesk DB: ' . $e->getMessage());
  fail('Datenbank nicht erreichbar.', 500);
}
