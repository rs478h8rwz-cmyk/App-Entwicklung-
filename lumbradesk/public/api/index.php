<?php
/* LumbraDesk – Server-Schnittstelle: /api/?r=<aktion>
   Login, eigenes Konto, Benutzerverwaltung (nur Admin), Protokoll */
declare(strict_types=1);
/* private/ liegt neben public/ oder (IONOS, gesperrt) im Webordner */
require (is_dir(__DIR__ . '/../private') ? __DIR__ . '/../private' : __DIR__ . '/../../private') . '/bootstrap.php';

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
      try { require_once LD_PRIV_DIR . '/backup-lib.php'; backup_if_due(); } catch (Throwable $e) {}
      $apps = array_values(array_filter(LD_APPS, fn($a) => in_array($u['role'], $a['roles'], true)));
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
      $nu = ['id' => (int)db()->lastInsertId(), 'email' => $email, 'name' => $name];
      audit((int)$me['id'], 'benutzer_angelegt', "$name <$email> als " . ROLES[$role]);
      if (!empty($b['invite'])) {
        try { send_invite($nu); audit((int)$me['id'], 'einladung_gesendet', $email); json_out(['ok' => true, 'invited' => true]); }
        catch (Throwable $e) { json_out(['ok' => true, 'tempPassword' => $tmp, 'mailError' => $e->getMessage()]); }
      }
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
      if (!empty($b['mailLink'])) {
        try { send_invite($u, !$u['must_change']); audit((int)$me['id'], 'link_gesendet', $u['email']); $out['mailed'] = true; } catch (Throwable $e) { fail('E-Mail nicht gesendet: ' . $e->getMessage(), 502); }
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

    /* ---------- Passwort per E-Mail-Link (ohne Anmeldung) ---------- */
    case 'POST forgot': {
      $email = mb_strtolower(trim((string)(body()['email'] ?? '')));
      if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $st = db()->prepare('SELECT COUNT(*) FROM login_attempts WHERE (email = ? OR ip = ?) AND at > UTC_TIMESTAMP() - INTERVAL 1 HOUR'); $st->execute(['reset:' . $email, client_ip()]);
        if ((int)$st->fetchColumn() < 5) {
          db()->prepare('INSERT INTO login_attempts (email, ip) VALUES (?, ?)')->execute(['reset:' . $email, client_ip()]);
          $st = db()->prepare('SELECT id, email, name FROM users WHERE email = ? AND active = 1'); $st->execute([$email]); $u = $st->fetch();
          if ($u) { try { send_invite($u, true); audit((int)$u['id'], 'passwort_vergessen', $email); } catch (Throwable $e) { error_log('LumbraDesk Mail: ' . $e->getMessage()); } }
        }
      }
      json_out(['ok' => true]);   // immer gleiche Antwort – verrät nicht, ob es die Adresse gibt
    }
    case 'GET tokeninfo': {
      $t = find_token((string)($_GET['t'] ?? '')); if (!$t) fail('Der Link ist abgelaufen oder wurde schon benutzt.', 404);
      json_out(['name' => $t['name'], 'email' => $t['email'], 'purpose' => $t['purpose']]);
    }
    case 'POST setpw': {
      $b = body(); $t = find_token((string)($b['token'] ?? '')); if (!$t) fail('Der Link ist abgelaufen oder wurde schon benutzt.', 404);
      $pw = (string)($b['password'] ?? ''); if ($e = pw_ok($pw)) fail($e);
      db()->prepare('UPDATE users SET pw_hash = ?, must_change = 0 WHERE id = ?')->execute([password_hash($pw, PASSWORD_DEFAULT), $t['user_id']]);
      db()->prepare('UPDATE user_tokens SET used_at = UTC_TIMESTAMP() WHERE id = ?')->execute([$t['id']]);
      db()->prepare('DELETE FROM login_attempts WHERE email = ?')->execute([$t['email']]);
      audit((int)$t['user_id'], 'passwort_per_link', $t['email']);
      json_out(['ok' => true, 'email' => $t['email']]);
    }
    /* ---------- E-Mail-Einstellungen (nur Admin) ---------- */
    case 'GET mailcfg': {
      require_role(['admin']); $c = mail_cfg();
      json_out(['from' => $c['from'], 'name' => $c['name'], 'host' => $c['host'], 'port' => (int)$c['port'], 'enc' => $c['enc'], 'user' => $c['user'], 'hasPass' => $c['pass'] !== '', 'base' => base_url()]);
    }
    case 'POST mailcfg': {
      $me = require_role(['admin']); $b = body(); $c = mail_cfg();
      foreach (['from', 'name', 'host', 'user'] as $k) if (isset($b[$k])) $c[$k] = trim((string)$b[$k]);
      if (isset($b['port'])) $c['port'] = max(1, (int)$b['port']);
      if (isset($b['enc']) && in_array($b['enc'], ['tls', 'ssl', 'none'], true)) $c['enc'] = $b['enc'];
      if (isset($b['pass']) && $b['pass'] !== '') $c['pass'] = (string)$b['pass'];
      if (!empty($b['clearPass'])) $c['pass'] = '';
      if ($c['from'] !== '' && !filter_var($c['from'], FILTER_VALIDATE_EMAIL)) fail('Bitte eine gültige Absender-Adresse eingeben.');
      $c['base'] = 'https://' . preg_replace('/[^A-Za-z0-9.:-]/', '', (string)($_SERVER['HTTP_HOST'] ?? ''));
      if (($_SERVER['HTTPS'] ?? '') !== 'on' && !cfg('cookie_secure')) $c['base'] = 'http://' . preg_replace('/[^A-Za-z0-9.:-]/', '', (string)($_SERVER['HTTP_HOST'] ?? ''));
      mail_save($c); audit((int)$me['id'], 'mail_einstellungen', $c['from']);
      json_out(['ok' => true]);
    }
    case 'POST mailtest': {
      $me = require_role(['admin']);
      [$text, $html] = mail_tpl('Hallo ' . explode(' ', $me['name'])[0] . ',', 'das ist eine Test-E-Mail von LumbraDesk. Wenn du sie liest, funktioniert der Versand.', 'LumbraDesk öffnen', base_url() . '/', 'Einladungen und „Passwort vergessen“ kommen ab jetzt von dieser Adresse.');
      try { send_mail($me['email'], 'LumbraDesk: Test-E-Mail', $text, $html); } catch (Throwable $e) { fail($e->getMessage(), 502); }
      json_out(['ok' => true, 'to' => $me['email']]);
    }

    /* ---------- Firmen-Einstellungen (Wirtschaftlichkeits-App) ---------- */
    case 'GET cfg-meta': {
      require_user(); $c = cfg_row();
      json_out(['version' => (int)($c['version'] ?? 0), 'at' => $c['updated_at'] ?? null, 'by' => $c['updated_by'] ?? '']);
    }
    case 'GET cfg': {
      require_user(); $c = cfg_row();
      if (!$c) json_out(['version' => 0]);
      $d = json_decode($c['data'], true) ?: [];
      json_out(['version' => (int)$c['version'], 'at' => $c['updated_at'], 'by' => $c['updated_by'], 'settings' => $d['settings'] ?? null, 'products' => $d['products'] ?? [], 'files' => $d['files'] ?? []]);
    }
    case 'GET cfg-file': {
      require_user(); $id = (string)($_GET['id'] ?? '');
      if (!preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id)) fail('Ungültige Datei', 400);
      $f = files_dir() . '/' . $id; if (!is_file($f . '.bin')) fail('Datei nicht gefunden', 404);
      $m = json_decode((string)@file_get_contents($f . '.json'), true) ?: [];
      header('Content-Type: ' . (preg_match('#^[\w.+-]+/[\w.+-]+$#', $m['type'] ?? '') ? $m['type'] : 'application/octet-stream'));
      header('Cache-Control: private, max-age=31536000, immutable');
      header('X-Content-Type-Options: nosniff');
      if (!empty($m['name'])) header('X-File-Name: ' . rawurlencode($m['name']));
      readfile($f . '.bin'); exit;
    }
    case 'POST cfg-file': {
      require_role(['admin']); $id = (string)($_SERVER['HTTP_X_FILE_ID'] ?? '');
      if (!preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id)) fail('Ungültige Datei', 400);
      $f = files_dir() . '/' . $id;
      if (is_file($f . '.bin')) json_out(['ok' => true, 'existed' => true]);
      $raw = file_get_contents('php://input') ?: '';
      if ($raw === '' || strlen($raw) > 20 * 1024 * 1024) fail('Datei leer oder zu groß (max. 20 MB)', 400);
      $type = strtolower(trim(explode(';', (string)($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
      file_put_contents($f . '.bin', $raw, LOCK_EX);
      file_put_contents($f . '.json', json_encode(['type' => $type, 'name' => mb_substr(rawurldecode((string)($_SERVER['HTTP_X_FILE_NAME'] ?? '')), 0, 200), 'size' => strlen($raw)]), LOCK_EX);
      json_out(['ok' => true]);
    }
    case 'POST cfg': {
      $me = require_role(['admin']); $b = body();
      if (!is_array($b['settings'] ?? null) || !is_array($b['products'] ?? null)) fail('Ungültige Einstellungen', 400);
      $files = array_values(array_filter((array)($b['files'] ?? []), fn($x) => is_string($x) && preg_match('/^[A-Za-z0-9_-]{1,64}$/', $x)));
      $missing = array_values(array_filter($files, fn($x) => !is_file(files_dir() . '/' . $x . '.bin')));
      if ($missing) json_out(['error' => 'Bilder fehlen auf dem Server', 'missing' => $missing], 409);
      cfg_row(); $pdo = db(); $pdo->beginTransaction();
      $c = $pdo->query('SELECT version, updated_by, updated_at FROM company_config WHERE id = 1 FOR UPDATE')->fetch() ?: null;
      $cur = (int)($c['version'] ?? 0);
      if (empty($b['force']) && isset($b['base']) && (int)$b['base'] !== $cur) { $pdo->rollBack(); json_out(['error' => 'Inzwischen hat ' . ($c['updated_by'] ?: 'jemand') . ' die Firmen-Einstellungen geändert.', 'conflict' => true, 'version' => $cur, 'by' => $c['updated_by'] ?? '', 'at' => $c['updated_at'] ?? null], 409); }
      $data = json_encode(['settings' => $b['settings'], 'products' => $b['products'], 'files' => $files], JSON_UNESCAPED_UNICODE);
      $pdo->prepare('INSERT INTO company_config (id, version, data, updated_at, updated_by) VALUES (1, ?, ?, UTC_TIMESTAMP(), ?) ON DUPLICATE KEY UPDATE version = VALUES(version), data = VALUES(data), updated_at = VALUES(updated_at), updated_by = VALUES(updated_by)')->execute([$cur + 1, $data, $me['name']]);
      $pdo->commit();
      audit((int)$me['id'], 'firmeneinstellungen', 'Version ' . ($cur + 1) . ' · ' . count($b['products']) . ' Produkte · ' . count($files) . ' Bilder');
      json_out(['ok' => true, 'version' => $cur + 1]);
    }

    /* ---------- Kunden zentral (Wirtschaftlichkeits-App) ---------- */
    case 'GET team': {
      require_user();
      $rows = db()->query("SELECT id, name, role FROM users WHERE active = 1 AND role IN ('admin','buero','vertrieb') ORDER BY name")->fetchAll();
      json_out(['users' => array_map(fn($r) => ['id' => (int)$r['id'], 'name' => $r['name'], 'role' => $r['role'], 'roleName' => ROLES[$r['role']] ?? $r['role']], $rows)]);
    }
    case 'GET plist': {
      $u = require_role(['admin', 'buero', 'vertrieb']); projects_table();
      if (sees_all($u)) $st = db()->query('SELECT id, version, owner_id, created_by, assigned_by, assigned_at, updated_at, updated_by FROM projects WHERE deleted = 0');
      else { $st = db()->prepare('SELECT id, version, owner_id, created_by, assigned_by, assigned_at, updated_at, updated_by FROM projects WHERE deleted = 0 AND (owner_id = ? OR created_by = ?)'); $st->execute([$u['id'], $u['id']]); }
      json_out(['me' => (int)$u['id'], 'all' => sees_all($u), 'projects' => array_map('project_meta', $st->fetchAll())]);
    }
    case 'POST pget': {
      $u = require_role(['admin', 'buero', 'vertrieb']); $out = [];
      foreach (array_slice((array)(body()['ids'] ?? []), 0, 200) as $id) {
        if (!is_string($id) || !valid_id($id)) continue; $p = project_row($id);
        if ($p && !$p['deleted'] && can_see_project($u, $p)) $out[] = project_meta($p) + ['data' => json_decode($p['data'], true)];
      }
      json_out(['projects' => $out]);
    }
    case 'POST pput': {
      $u = require_role(['admin', 'buero', 'vertrieb']); $b = body(); $id = (string)($b['id'] ?? ''); $data = $b['data'] ?? null;
      if (!valid_id($id) || !is_array($data)) fail('Ungültiger Kunde', 400);
      $json = json_encode($data, JSON_UNESCAPED_UNICODE); if (strlen($json) > 8 * 1024 * 1024) fail('Kunde zu groß', 400);
      $name = mb_substr(trim(($data['customer']['salutation'] ?? '') . ' ' . ($data['customer']['name'] ?? '')), 0, 200);
      $pdo = db(); projects_table(); $pdo->beginTransaction();
      $st = $pdo->prepare('SELECT * FROM projects WHERE id = ? FOR UPDATE'); $st->execute([$id]); $p = $st->fetch() ?: null;
      if (!$p) {
        $pdo->prepare('INSERT INTO projects (id, owner_id, created_by, name, data, version, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, 1, UTC_TIMESTAMP(), ?)')->execute([$id, $u['id'], $u['id'], $name, $json, $u['id']]);
        $pdo->commit(); audit((int)$u['id'], 'kunde_angelegt', $name ?: $id); json_out(['v' => 1, 'created' => true]);
      }
      if (!can_see_project($u, $p)) { $pdo->rollBack(); fail('Keine Berechtigung für diesen Kunden', 403); }
      if ($p['deleted']) { $pdo->rollBack(); json_out(['error' => 'Kunde wurde gelöscht', 'deleted' => true], 409); }
      if (empty($b['force']) && (int)($b['base'] ?? 0) !== (int)$p['version']) { $pdo->rollBack(); json_out(['error' => 'Inzwischen geändert', 'conflict' => true] + project_meta($p) + ['data' => json_decode($p['data'], true)], 409); }
      $v = (int)$p['version'] + 1;
      $pdo->prepare('UPDATE projects SET data = ?, name = ?, version = ?, updated_at = UTC_TIMESTAMP(), updated_by = ? WHERE id = ?')->execute([$json, $name, $v, $u['id'], $id]);
      $pdo->commit(); json_out(['v' => $v]);
    }
    case 'POST pcheck': {
      /* Warum fehlt ein Kunde in der Liste? Nur bei „gelöscht“ oder „anderem zugewiesen“ darf das Gerät ihn entfernen */
      $u = require_role(['admin', 'buero', 'vertrieb']); $out = []; $n = user_names();
      foreach (array_slice((array)(body()['ids'] ?? []), 0, 500) as $id) {
        if (!is_string($id) || !valid_id($id)) continue; $p = project_row($id);
        if (!$p) $out[$id] = ['state' => 'missing'];
        elseif ($p['deleted']) $out[$id] = ['state' => 'deleted', 'by' => $n[(int)($p['updated_by'] ?? 0)] ?? ''];
        elseif (!can_see_project($u, $p)) $out[$id] = ['state' => 'hidden', 'owner' => $n[(int)$p['owner_id']] ?? ''];
        else $out[$id] = ['state' => 'visible'];
      }
      json_out(['states' => $out]);
    }
    case 'POST pdel': {
      $u = require_role(['admin', 'buero', 'vertrieb']); $id = (string)(body()['id'] ?? ''); if (!valid_id($id)) fail('Ungültig', 400);
      $p = project_row($id); if (!$p) json_out(['ok' => true]);
      if (!can_see_project($u, $p)) fail('Keine Berechtigung', 403);
      db()->prepare('UPDATE projects SET deleted = 1, version = version + 1, updated_at = UTC_TIMESTAMP(), updated_by = ? WHERE id = ?')->execute([$u['id'], $id]);
      audit((int)$u['id'], 'kunde_geloescht', $p['name']);
      json_out(['ok' => true]);
    }
    case 'POST passign': {
      $u = require_role(['admin', 'buero', 'vertrieb']); $b = body(); $id = (string)($b['id'] ?? ''); $to = (int)($b['user'] ?? 0);
      $p = valid_id($id) ? project_row($id) : null; if (!$p || $p['deleted']) fail('Kunde nicht gefunden (noch nicht abgeglichen?)', 404);
      if (!can_see_project($u, $p)) fail('Keine Berechtigung', 403);
      $st = db()->prepare("SELECT id, name FROM users WHERE id = ? AND active = 1 AND role IN ('admin','buero','vertrieb')"); $st->execute([$to]); $t = $st->fetch(); if (!$t) fail('Benutzer nicht gefunden', 404);
      db()->prepare('UPDATE projects SET owner_id = ?, assigned_by = ?, assigned_at = UTC_TIMESTAMP(), version = version + 1, updated_at = UTC_TIMESTAMP(), updated_by = ? WHERE id = ?')->execute([$to, $u['id'], $u['id'], $id]);
      audit((int)$u['id'], 'kunde_zugewiesen', $p['name'] . ' → ' . $t['name']);
      try { require_once LD_PRIV_DIR . '/crm-lib.php'; crm_add_event($id, (int)$u['id'], 'zuweisung', 'Zugewiesen an ' . $t['name']); } catch (Throwable $e) {}
      json_out(['ok' => true] + project_meta(project_row($id)));
    }
    case 'POST pfile': {
      $u = require_role(['admin', 'buero', 'vertrieb']);
      $pid = (string)($_SERVER['HTTP_X_PROJECT_ID'] ?? ''); $fid = (string)($_SERVER['HTTP_X_FILE_ID'] ?? '');
      if (!valid_id($pid) || !preg_match('/^[A-Za-z0-9_-]{1,64}$/', $fid)) fail('Ungültige Datei', 400);
      $p = project_row($pid); if ($p && !can_see_project($u, $p)) fail('Keine Berechtigung', 403);
      $f = pfiles_dir($pid) . '/' . $fid; if (is_file($f . '.bin')) json_out(['ok' => true, 'existed' => true]);
      $raw = file_get_contents('php://input') ?: ''; if ($raw === '' || strlen($raw) > 40 * 1024 * 1024) fail('Datei leer oder zu groß (max. 40 MB)', 400);
      file_put_contents($f . '.bin', $raw, LOCK_EX);
      file_put_contents($f . '.json', json_encode(['type' => strtolower(trim(explode(';', (string)($_SERVER['CONTENT_TYPE'] ?? ''))[0])), 'name' => mb_substr(rawurldecode((string)($_SERVER['HTTP_X_FILE_NAME'] ?? '')), 0, 200), 'by' => (int)$u['id']]), LOCK_EX);
      json_out(['ok' => true]);
    }
    case 'GET pfile': {
      $u = require_role(['admin', 'buero', 'vertrieb']); $pid = (string)($_GET['p'] ?? ''); $fid = (string)($_GET['id'] ?? '');
      if (!valid_id($pid) || !preg_match('/^[A-Za-z0-9_-]{1,64}$/', $fid)) fail('Ungültige Datei', 400);
      $p = project_row($pid); if (!can_see_project($u, $p)) fail('Keine Berechtigung', 403);
      $f = pfiles_dir($pid) . '/' . $fid; if (!is_file($f . '.bin')) fail('Datei nicht gefunden', 404);
      $m = json_decode((string)@file_get_contents($f . '.json'), true) ?: [];
      header('Content-Type: ' . (preg_match('#^[\w.+-]+/[\w.+-]+$#', $m['type'] ?? '') ? $m['type'] : 'application/octet-stream'));
      header('Cache-Control: private, max-age=31536000, immutable'); header('X-Content-Type-Options: nosniff');
      if (!empty($m['name'])) header('X-File-Name: ' . rawurlencode($m['name']));
      readfile($f . '.bin'); exit;
    }

    /* ---------- CRM: Kunden-Übersicht, Verlauf, Wiedervorlagen ---------- */
    case 'GET crm': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/crm-lib.php';
      $team = db()->query("SELECT id, name FROM users WHERE active = 1 AND role IN ('admin','buero','vertrieb') ORDER BY name")->fetchAll();
      json_out(['me' => (int)$u['id'], 'all' => sees_all($u), 'stages' => STAGES, 'customers' => crm_list($u), 'team' => array_map(fn($r) => ['id' => (int)$r['id'], 'name' => $r['name']], $team)]);
    }
    case 'GET dash': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/crm-lib.php';
      json_out(crm_dash($u));
    }
    case 'GET crm-p': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/crm-lib.php';
      json_out(crm_detail($u, (string)($_GET['id'] ?? '')));
    }
    case 'POST crm-stage': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/crm-lib.php'; $b = body();
      $id = (string)($b['id'] ?? ''); $stage = (string)($b['stage'] ?? ''); if (!isset(STAGES[$stage])) fail('Unbekannte Stufe', 400);
      $r = crm_project($u, $id); $o = crm_row_out($r); $old = $o['stage'];
      db()->prepare('UPDATE projects SET stage = ?, stage_base = ?, stage_at = UTC_TIMESTAMP() WHERE id = ?')->execute([$stage, $o['derived'], $id]);
      if ($old !== $stage) crm_add_event($id, (int)$u['id'], 'stufe', STAGES[$old] . ' → ' . STAGES[$stage]);
      json_out(crm_detail($u, $id));
    }
    case 'POST crm-event': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/crm-lib.php'; $b = body();
      $id = (string)($b['id'] ?? ''); $kind = (string)($b['kind'] ?? 'notiz'); $text = trim((string)($b['text'] ?? ''));
      if (!in_array($kind, ['notiz', 'anruf', 'termin', 'email'], true)) fail('Unbekannte Art', 400);
      if ($text === '') fail('Bitte einen Text eingeben.', 400);
      crm_project($u, $id);
      $at = (string)($b['at'] ?? ''); $at = preg_match('/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/', $at) && strtotime($at . ' UTC') ? gmdate('Y-m-d H:i:s', strtotime($at . ' UTC')) : null;
      crm_add_event($id, (int)$u['id'], $kind, $text, $at);
      json_out(crm_detail($u, $id));
    }
    case 'POST crm-event-del': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/crm-lib.php'; crm_tables();
      $st = db()->prepare('SELECT * FROM crm_events WHERE id = ?'); $st->execute([(int)(body()['id'] ?? 0)]); $e = $st->fetch();
      if (!$e) fail('Eintrag nicht gefunden', 404);
      crm_project($u, $e['project_id']);
      if ((int)$e['user_id'] !== (int)$u['id'] && $u['role'] !== 'admin') fail('Nur eigene Einträge können gelöscht werden.', 403);
      if (!in_array($e['kind'], ['notiz', 'anruf', 'termin', 'email'], true)) fail('Automatische Einträge bleiben stehen.', 400);
      db()->prepare('DELETE FROM crm_events WHERE id = ?')->execute([$e['id']]);
      json_out(crm_detail($u, $e['project_id']));
    }
    case 'GET tasks': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/crm-lib.php';
      $team = db()->query("SELECT id, name FROM users WHERE active = 1 AND role IN ('admin','buero','vertrieb') ORDER BY name")->fetchAll();
      $rm = db()->prepare('SELECT remind FROM users WHERE id = ?'); $rm->execute([$u['id']]);
      json_out(['me' => (int)$u['id'], 'all' => sees_all($u), 'remind' => (bool)$rm->fetchColumn(), 'tasks' => crm_tasks_for($u, (string)($_GET['scope'] ?? 'meine')), 'team' => array_map(fn($r) => ['id' => (int)$r['id'], 'name' => $r['name']], $team)]);
    }
    case 'POST task': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/crm-lib.php'; crm_tables(); $b = body();
      $title = trim((string)($b['title'] ?? '')); $due = crm_date((string)($b['due'] ?? '')); $to = (int)($b['assignee'] ?? $u['id']); $pid = (string)($b['project'] ?? '');
      if ($title === '') fail('Bitte beschreiben, was zu tun ist.', 400);
      if (!$due) fail('Bitte ein Datum wählen.', 400);
      if (!crm_valid_user($to)) fail('Zuständiger nicht gefunden', 400);
      if ($pid !== '') crm_project($u, $pid); else $pid = null;
      db()->prepare('INSERT INTO crm_tasks (project_id, title, due, assignee_id, created_by) VALUES (?, ?, ?, ?, ?)')->execute([$pid, mb_substr($title, 0, 300), $due, $to, $u['id']]);
      if ($pid) crm_add_event($pid, (int)$u['id'], 'aufgabe', 'Wiedervorlage ' . date('d.m.Y', strtotime($due)) . ': ' . $title . ($to !== (int)$u['id'] ? ' (für ' . (user_names()[$to] ?? '') . ')' : ''));
      json_out(['ok' => true] + ($pid ? crm_detail($u, $pid) : []));
    }
    case 'POST task-update': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/crm-lib.php'; $b = body();
      $t = crm_task_row($u, (int)($b['id'] ?? 0)); $pdo = db();
      if (array_key_exists('done', $b)) {
        $pdo->prepare('UPDATE crm_tasks SET done_at = ' . ($b['done'] ? 'UTC_TIMESTAMP()' : 'NULL') . ', done_by = ? WHERE id = ?')->execute([$b['done'] ? $u['id'] : null, $t['id']]);
        if ($b['done'] && $t['project_id']) crm_add_event($t['project_id'], (int)$u['id'], 'aufgabe', 'Erledigt: ' . $t['title']);
      }
      if (isset($b['due'])) { $d = crm_date((string)$b['due']); if (!$d) fail('Ungültiges Datum', 400); $pdo->prepare('UPDATE crm_tasks SET due = ? WHERE id = ?')->execute([$d, $t['id']]); }
      if (isset($b['title']) && trim((string)$b['title']) !== '') $pdo->prepare('UPDATE crm_tasks SET title = ? WHERE id = ?')->execute([mb_substr(trim((string)$b['title']), 0, 300), $t['id']]);
      if (isset($b['assignee'])) { if (!crm_valid_user((int)$b['assignee'])) fail('Zuständiger nicht gefunden', 400); $pdo->prepare('UPDATE crm_tasks SET assignee_id = ? WHERE id = ?')->execute([(int)$b['assignee'], $t['id']]); }
      json_out(['ok' => true] + ($t['project_id'] ? crm_detail($u, $t['project_id']) : []));
    }
    case 'POST task-del': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/crm-lib.php';
      $t = crm_task_row($u, (int)(body()['id'] ?? 0));
      if ((int)$t['created_by'] !== (int)$u['id'] && !sees_all($u)) fail('Nur wer die Aufgabe angelegt hat, kann sie löschen.', 403);
      db()->prepare('DELETE FROM crm_tasks WHERE id = ?')->execute([$t['id']]);
      json_out(['ok' => true] + ($t['project_id'] ? crm_detail($u, $t['project_id']) : []));
    }
    case 'POST remind': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/crm-lib.php'; crm_tables();
      db()->prepare('UPDATE users SET remind = ? WHERE id = ?')->execute([empty(body()['on']) ? 0 : 1, $u['id']]);
      json_out(['ok' => true]);
    }

    /* ---------- Datensicherung (nur Admin) ---------- */
    case 'GET backups': {
      require_role(['admin']); require_once LD_PRIV_DIR . '/backup-lib.php';
      json_out(['status' => backup_status(), 'list' => backup_list(), 'keep' => BACKUP_KEEP]);
    }
    case 'POST backup-now': {
      $me = require_role(['admin']); require_once LD_PRIV_DIR . '/backup-lib.php';
      try { $st = run_backup('von ' . $me['name']); } catch (Throwable $e) { fail($e->getMessage(), 500); }
      audit((int)$me['id'], 'sicherung', $st['name']); json_out(['ok' => true] + $st);
    }
    case 'GET backup-dl': {
      $me = require_role(['admin']); require_once LD_PRIV_DIR . '/backup-lib.php'; $f = (string)($_GET['f'] ?? '');
      if (!preg_match('/^lumbradesk-[0-9-]+\.zip$/', $f) || !is_file(backup_dir() . '/' . $f)) fail('Sicherung nicht gefunden', 404);
      audit((int)$me['id'], 'sicherung_geladen', $f);
      header('Content-Type: application/zip'); header('Content-Disposition: attachment; filename="' . $f . '"'); header('Content-Length: ' . filesize(backup_dir() . '/' . $f));
      readfile(backup_dir() . '/' . $f); exit;
    }
    case 'POST backup-restore': {
      $me = require_role(['admin']); require_once LD_PRIV_DIR . '/backup-lib.php'; $f = (string)(body()['name'] ?? '');
      try { $pre = run_backup('vor dem Zurückspielen'); $r = restore_backup($f); } catch (Throwable $e) { fail($e->getMessage(), 500); }
      audit((int)$me['id'], 'sicherung_zurueck', $f . ' (vorher gesichert: ' . $pre['name'] . ')');
      json_out(['ok' => true, 'before' => $pre['name']] + $r);
    }

    /* ---------- System: Update hochladen (nur Admin) ---------- */
    case 'GET system': {
      require_role(['admin']);
      json_out(['version' => LD_VERSION, 'php' => PHP_VERSION, 'zip' => class_exists('ZipArchive'), 'maxUpload' => ini_get('upload_max_filesize')]);
    }
    case 'POST system-update': {
      $me = require_role(['admin']);
      require_once __DIR__ . '/../../private/updater.php';
      $f = $_FILES['zip'] ?? null;
      if (!$f || ($f['error'] ?? 1) !== UPLOAD_ERR_OK) fail('Upload fehlgeschlagen' . (($f['error'] ?? 0) === UPLOAD_ERR_INI_SIZE ? ' – Datei größer als erlaubt (' . ini_get('upload_max_filesize') . ')' : '') . '.', 400);
      $priv = realpath(__DIR__ . '/../../private'); $base = $priv ? dirname($priv) : '';
      if (!$base || !is_dir($base . '/public')) fail('Dieses Update-Verfahren passt nur zum Aufbau lumbradesk/public + lumbradesk/private.', 400);
      try { $r = ld_apply_update($f['tmp_name'], $base); } catch (Throwable $e) { fail($e->getMessage(), 400); }
      audit((int)$me['id'], 'update', ($f['name'] ?? 'zip') . ' · ' . $r['files'] . ' Dateien');
      json_out(['ok' => true, 'files' => $r['files']]);
    }

    default: fail('Unbekannte Aktion', 404);
  }
} catch (PDOException $e) {
  error_log('LumbraDesk DB: ' . $e->getMessage());
  fail('Datenbank nicht erreichbar.', 500);
}
