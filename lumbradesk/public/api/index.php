<?php
/* LumbraDesk – Server-Schnittstelle: /api/?r=<aktion>
   Login, eigenes Konto, Benutzerverwaltung (nur Admin), Protokoll */
declare(strict_types=1);
/* private/ liegt neben public/ oder (IONOS, gesperrt) im Webordner */
require (is_dir(__DIR__ . '/../private') ? __DIR__ . '/../private' : __DIR__ . '/../../private') . '/bootstrap.php';

const AB_ROLES_ALL = ['admin', 'buero', 'vertrieb', 'monteur'];
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
start_session();
check_origin();

$r = $_GET['r'] ?? '';
$m = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
  switch ("$m $r") {

    /* ---------- Anmeldung ---------- */
    /* Bundesland zur Kundenadresse (für die Aufstell-Regeln der Wärmepumpe) */
    case 'GET land': {
      require_user(); $q = trim((string)($_GET['q'] ?? '')); if ($q === '') fail('Keine Adresse.', 400);
      $ch = curl_init('https://nominatim.openstreetmap.org/search?' . http_build_query(['format' => 'jsonv2', 'q' => mb_substr($q, 0, 200), 'countrycodes' => 'de', 'limit' => 1, 'addressdetails' => 1]));
      curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_CONNECTTIMEOUT => 6, CURLOPT_USERAGENT => 'LumbraDesk/' . LD_VERSION . ' (https://lumbradesk.de)', CURLOPT_HTTPHEADER => ['Accept-Language: de']]);
      $b = curl_exec($ch); $c = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
      $r = $b !== false && $c === 200 ? json_decode((string)$b, true) : null;
      if (!$r || empty($r[0]['address']['state'])) fail('Bundesland nicht gefunden.', 404);
      json_out(['state' => (string)$r[0]['address']['state']]);
    }
    /* Hausumriss aus OpenStreetMap für den Modulplan: Adresse (q) oder Standort (lat/lon) → Gebäude in der Nähe */
    case 'GET haus': {
      require_user();
      $get = function (string $url): ?array {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 25, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_USERAGENT => 'LumbraDesk/' . LD_VERSION . ' (https://lumbradesk.de)', CURLOPT_HTTPHEADER => ['Accept-Language: de']]);
        $b = curl_exec($ch); $c = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
        return $b !== false && $c === 200 ? json_decode((string)$b, true) : null;
      };
      $q = trim((string)($_GET['q'] ?? '')); $lat = (float)($_GET['lat'] ?? 0); $lon = (float)($_GET['lon'] ?? 0); $name = '';
      if ($q !== '') {
        $r = $get('https://nominatim.openstreetmap.org/search?' . http_build_query(['format' => 'jsonv2', 'q' => mb_substr($q, 0, 200), 'countrycodes' => 'de,at,ch,nl,lu,be,dk,pl,fr', 'limit' => 1]));
        if (!$r || empty($r[0])) fail('Adresse nicht gefunden – bitte Straße, Hausnummer und Ort prüfen.', 404);
        $lat = (float)$r[0]['lat']; $lon = (float)$r[0]['lon']; $name = (string)($r[0]['display_name'] ?? '');
      }
      if (!$lat || !$lon || abs($lat) > 85 || abs($lon) > 180) fail('Kein Standort angegeben.', 400);
      $ql = sprintf('[out:json][timeout:20];way(around:45,%.6F,%.6F)["building"];out geom 25;', $lat, $lon);
      $o = null; foreach (['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'] as $srv) { $o = $get($srv . '?data=' . rawurlencode($ql)); if ($o) break; }
      if (!$o) fail('Kartendienst gerade nicht erreichbar – bitte später erneut versuchen oder selbst messen.', 502);
      $b = [];
      foreach ((array)($o['elements'] ?? []) as $e) {
        if (empty($e['geometry']) || count($e['geometry']) < 4) continue;
        $b[] = ['id' => (int)$e['id'], 'typ' => (string)($e['tags']['building'] ?? 'yes'), 'pts' => array_map(fn($g) => [round((float)$g['lat'], 7), round((float)$g['lon'], 7)], $e['geometry'])];
      }
      json_out(['lat' => $lat, 'lon' => $lon, 'name' => $name, 'buildings' => $b]);
    }
    case 'GET me': {
      $u = current_user();
      if (!$u) json_out(['user' => null]);
      try { require_once LD_PRIV_DIR . '/backup-lib.php'; backup_if_due(); } catch (Throwable $e) {}
      $apps = array_values(array_filter(LD_APPS, fn($a) => in_array($u['role'], $a['roles'], true)));
      json_out(['user' => user_out($u), 'apps' => $u['must_change'] ? [] : $apps, 'roles' => ROLES, 'features' => ld_features_for($u)]);
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
      if (sees_all($u)) $st = db()->query('SELECT id, version, owner_id, created_by, assigned_by, assigned_at, updated_at, updated_by, kdnr FROM projects WHERE deleted = 0');
      else { $st = db()->prepare('SELECT id, version, owner_id, created_by, assigned_by, assigned_at, updated_at, updated_by, kdnr FROM projects WHERE deleted = 0 AND (owner_id = ? OR created_by = ?)'); $st->execute([$u['id'], $u['id']]); }
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
        $pdo->commit(); audit((int)$u['id'], 'kunde_angelegt', $name ?: $id);
        require_once LD_PRIV_DIR . '/crm-lib.php'; kd_auto($id, (string)($data['type'] ?? ''));   // Kundennummer je Gewerk
        json_out(['v' => 1, 'created' => true]);
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

    /* ---------- Funktionen freischalten (nur Admin) ---------- */
    case 'GET features': {
      require_role(['admin']); $f = ld_flags();
      json_out(['list' => array_map(fn($k, $x) => ['key' => $k, 'name' => $x[0], 'text' => $x[1], 'on' => !empty($f[$k])], array_keys(LD_FEATURES), LD_FEATURES)]);
    }
    case 'POST features': {
      $me = require_role(['admin']); $b = body(); $k = (string)($b['key'] ?? ''); if (!isset(LD_FEATURES[$k])) fail('Unbekannte Funktion', 400);
      $f = ld_flags(); $f[$k] = !empty($b['on']);
      db()->prepare("INSERT INTO ld_settings (k, v, updated_at, updated_by) VALUES ('features', ?, UTC_TIMESTAMP(), ?) ON DUPLICATE KEY UPDATE v = VALUES(v), updated_at = UTC_TIMESTAMP(), updated_by = VALUES(updated_by)")->execute([json_encode($f), $me['id']]);
      audit((int)$me['id'], 'funktion_freigabe', LD_FEATURES[$k][0] . ': ' . ($f[$k] ? 'für alle freigeschaltet' : 'gesperrt'));
      json_out(['ok' => true]);
    }
    case 'POST of-import': {
      $me = require_role(['admin', 'buero']); require_feature($me, 'angebote'); require_once LD_PRIV_DIR . '/offers-lib.php';
      $n = of_import_rechner(); audit((int)$me['id'], 'angebot_produkte', $n . ' Produkte aus der Wirtschaftlichkeit übernommen'); json_out(['ok' => true, 'n' => $n]);
    }

    /* ---------- Belege: Einstellungen, Bilder, Rechnungen, Mahnwesen ---------- */
    case 'POST of-file': {
      $me = require_role(['admin', 'buero']); require_feature($me, 'angebote'); $id = (string)($_SERVER['HTTP_X_FILE_ID'] ?? '');
      if (!preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id)) fail('Ungültige Datei', 400);
      $type = strtolower(trim(explode(';', (string)($_SERVER['CONTENT_TYPE'] ?? ''))[0])); if (!in_array($type, ['image/jpeg', 'image/png', 'image/webp'], true)) fail('Bitte ein Bild (JPG, PNG oder WebP).', 400);
      $f = files_dir() . '/' . $id; if (is_file($f . '.bin')) json_out(['ok' => true, 'existed' => true]);
      $raw = file_get_contents('php://input') ?: ''; if ($raw === '' || strlen($raw) > 8 * 1024 * 1024) fail('Bild leer oder zu groß (max. 8 MB)', 400);
      file_put_contents($f . '.bin', $raw, LOCK_EX); file_put_contents($f . '.json', json_encode(['type' => $type, 'name' => 'produktbild', 'size' => strlen($raw)]), LOCK_EX);
      json_out(['ok' => true]);
    }
    case 'POST of-wizard': { $u = require_role(['admin', 'buero']); require_feature($u, 'angebote'); require_once LD_PRIV_DIR . '/offers-lib.php'; $o = of_wizard_save($u, body()); audit((int)$u['id'], 'belege_einstellungen', 'Angebots-Assistent'); json_out(['ok' => true, 'wizard' => $o]); }
    case 'GET belege-cfg': {
      $u = require_role(['admin', 'buero']); require_feature($u, 'angebote'); require_once LD_PRIV_DIR . '/belege-lib.php';
      require_once LD_PRIV_DIR . '/crm-lib.php'; crm_tables();
      json_out(['nummern' => num_out(), 'texte' => tx_all(), 'kinds' => TX_KINDS, 'mahn' => mahn_cfg(), 'abschnitte' => of_sections(), 'gewerke' => kd_out()]);
    }
    case 'POST belege-cfg': {
      $u = require_role(['admin', 'buero']); require_feature($u, 'angebote'); require_once LD_PRIV_DIR . '/belege-lib.php'; $b = body(); $part = (string)($b['part'] ?? '');
      if ($part === 'nummern') { $o = num_save($u, (array)($b['value'] ?? [])); audit((int)$u['id'], 'belege_einstellungen', 'Nummernkreise'); json_out(['ok' => true, 'nummern' => $o]); }
      if ($part === 'texte') { $o = tx_save($u, (array)($b['value'] ?? [])); audit((int)$u['id'], 'belege_einstellungen', 'Textbausteine'); json_out(['ok' => true, 'texte' => $o]); }
      if ($part === 'abschnitte') { $o = of_sections_save($u, (array)($b['value'] ?? [])); audit((int)$u['id'], 'belege_einstellungen', 'Abschnitte'); json_out(['ok' => true, 'abschnitte' => $o]); }
      if ($part === 'mahn') { $o = mahn_save($u, (array)($b['value'] ?? [])); audit((int)$u['id'], 'belege_einstellungen', 'Mahnwesen'); json_out(['ok' => true, 'mahn' => $o]); }
      fail('Unbekannt', 400);
    }
    case 'GET re-list': { $u = require_role(['admin', 'buero']); require_feature($u, 'rechnungen'); require_once LD_PRIV_DIR . '/belege-lib.php'; $pid = (string)($_GET['p'] ?? ''); json_out(['list' => re_list($u, valid_id($pid) ? $pid : ''), 'kinds' => RE_KIND, 'status' => RE_STATUS, 'mahn' => mahn_cfg()]); }
    case 'GET re-get': { $u = require_role(['admin', 'buero']); require_feature($u, 'rechnungen'); require_once LD_PRIV_DIR . '/belege-lib.php'; json_out(re_out(re_get((string)($_GET['id'] ?? '')))); }
    case 'POST re-save': { $u = require_role(['admin', 'buero']); require_feature($u, 'rechnungen'); require_once LD_PRIV_DIR . '/belege-lib.php'; json_out(re_save($u, body())); }
    case 'POST re-final': { $u = require_role(['admin', 'buero']); require_feature($u, 'rechnungen'); require_once LD_PRIV_DIR . '/belege-lib.php'; json_out(re_final($u, (string)(body()['id'] ?? ''))); }
    case 'POST re-paid': { $u = require_role(['admin', 'buero']); require_feature($u, 'rechnungen'); require_once LD_PRIV_DIR . '/belege-lib.php'; $b = body(); json_out(re_paid($u, (string)($b['id'] ?? ''), (float)($b['amount'] ?? 0), (string)($b['date'] ?? ''))); }
    case 'POST re-storno': { $u = require_role(['admin', 'buero']); require_feature($u, 'rechnungen'); require_once LD_PRIV_DIR . '/belege-lib.php'; json_out(re_storno($u, (string)(body()['id'] ?? ''))); }
    case 'POST re-dun': { $u = require_role(['admin', 'buero']); require_feature($u, 'rechnungen'); require_once LD_PRIV_DIR . '/belege-lib.php'; json_out(re_dun($u, (string)(body()['id'] ?? ''))); }
    case 'POST re-del': {
      $u = require_role(['admin', 'buero']); require_feature($u, 'rechnungen'); require_once LD_PRIV_DIR . '/belege-lib.php'; $r = re_get((string)(body()['id'] ?? ''));
      if ($r['status'] !== 'entwurf') fail('Nur Entwürfe können gelöscht werden – festgeschriebene Rechnungen bitte stornieren.', 400);
      db()->prepare('DELETE FROM invoices WHERE id = ?')->execute([$r['id']]); json_out(['ok' => true]);
    }
    case 'GET re-xml': {
      $u = require_role(['admin', 'buero']); require_feature($u, 'rechnungen'); require_once LD_PRIV_DIR . '/belege-lib.php'; $id = (string)($_GET['id'] ?? ''); $x = re_xml($id); $r = re_get($id);
      header('Content-Type: application/xml; charset=utf-8'); header('Content-Disposition: attachment; filename="XRechnung_' . preg_replace('/[^\w-]/', '_', $r['nr']) . '.xml"'); echo $x; exit;
    }

    /* ---------- Angebote ---------- */
    case 'GET of-catalog': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_feature($u, 'angebote'); require_once LD_PRIV_DIR . '/offers-lib.php';
      $row = cfg_row(); $cfg = $row ? json_decode((string)$row['data'], true) : []; $co = (array)(($cfg['settings'] ?? [])['company'] ?? []);
      require_once LD_PRIV_DIR . '/belege-lib.php';
      json_out(['abschnitte' => of_sections(), 'wizard' => of_wizard(), 'texte' => tx_all(), 'nextNr' => num_peek('an')['nr'], 'items' => of_catalog(), 'packages' => of_packages(), 'cats' => OF_CATS, 'status' => OF_STATUS, 'company' => array_intersect_key($co, array_flip(['name', 'ceo', 'register', 'street', 'zip', 'city', 'phone', 'email', 'web', 'taxNo', 'vatId', 'bank', 'iban', 'bic', 'logoFile']))]);
    }
    case 'POST of-item': { $u = require_role(['admin', 'buero']); require_feature($u, 'angebote'); require_once LD_PRIV_DIR . '/offers-lib.php'; json_out(['ok' => true] + of_item_save(body())); }
    case 'POST of-item-del': { $u = require_role(['admin', 'buero']); require_feature($u, 'angebote'); require_once LD_PRIV_DIR . '/offers-lib.php'; of_tables(); db()->prepare('UPDATE offer_items SET active = 0 WHERE id = ?')->execute([(int)preg_replace('/\D/', '', (string)(body()['id'] ?? ''))]); json_out(['ok' => true]); }
    case 'POST of-package': { $u = require_role(['admin', 'buero']); require_feature($u, 'angebote'); require_once LD_PRIV_DIR . '/offers-lib.php'; of_package_save(body()); json_out(['ok' => true]); }
    case 'POST of-package-del': { $u = require_role(['admin', 'buero']); require_feature($u, 'angebote'); require_once LD_PRIV_DIR . '/offers-lib.php'; of_tables(); db()->prepare('DELETE FROM offer_packages WHERE id = ?')->execute([(int)(body()['id'] ?? 0)]); json_out(['ok' => true]); }
    case 'GET of-list': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_feature($u, 'angebote'); require_once LD_PRIV_DIR . '/offers-lib.php'; $pid = (string)($_GET['p'] ?? '');
      $p = valid_id($pid) ? project_row($pid) : null; if (!can_see_project($u, $p)) fail('Keine Berechtigung', 403);
      json_out(['offers' => of_list($pid)]);
    }
    case 'GET of-get': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_feature($u, 'angebote'); require_once LD_PRIV_DIR . '/offers-lib.php'; $r = of_get((string)($_GET['id'] ?? ''));
      if (!can_see_project($u, project_row($r['project_id']))) fail('Keine Berechtigung', 403);
      json_out(of_out($r));
    }
    case 'POST of-save': { $u = require_role(['admin', 'buero', 'vertrieb']); require_feature($u, 'angebote'); require_once LD_PRIV_DIR . '/offers-lib.php'; json_out(of_save($u, body())); }
    case 'POST of-del': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_feature($u, 'angebote'); require_once LD_PRIV_DIR . '/offers-lib.php'; $r = of_get((string)(body()['id'] ?? ''));
      if (!can_see_project($u, project_row($r['project_id']))) fail('Keine Berechtigung', 403);
      db()->prepare('UPDATE offers SET deleted = 1, updated_at = UTC_TIMESTAMP(), updated_by = ? WHERE id = ?')->execute([$u['id'], $r['id']]); audit((int)$u['id'], 'angebot_geloescht', $r['nr']); json_out(['ok' => true]);
    }

    /* ---------- Abnahme & Service zentral ---------- */
    case 'GET ab-list': {
      $u = require_role(AB_ROLES_ALL); require_once LD_PRIV_DIR . '/abnahme-lib.php';
      $pid = (string)($_GET['p'] ?? ''); if ($pid !== '') { $p = valid_id($pid) ? project_row($pid) : null; if (!$p || !(can_see_project($u, $p) || in_array($u['role'], AB_ROLES, true))) fail('Keine Berechtigung', 403); }
      if ($u['role'] === 'vertrieb' && $pid === '') fail('Keine Berechtigung', 403);
      json_out(['office' => ab_office($u), 'list' => $pid !== '' ? ab_list(array_merge($u, ['role' => 'admin']), 'all', $pid) : ab_list($u, (string)($_GET['scope'] ?? 'mine'))]);
    }
    case 'GET ab-get': {
      $u = require_role(AB_ROLES_ALL); require_once LD_PRIV_DIR . '/abnahme-lib.php';
      json_out(ab_get(in_array($u['role'], AB_ROLES, true) ? $u : array_merge($u, ['role' => 'none']), (string)($_GET['id'] ?? '')));
    }
    case 'POST ab-put': {
      $u = require_role(AB_ROLES_ALL); require_once LD_PRIV_DIR . '/abnahme-lib.php'; if (!in_array($u['role'], AB_ROLES, true)) fail('Keine Berechtigung', 403);
      json_out(ab_put($u, body()));
    }
    case 'POST ab-del': {
      $u = require_role(AB_ROLES_ALL); require_once LD_PRIV_DIR . '/abnahme-lib.php'; if (!in_array($u['role'], AB_ROLES, true)) fail('Keine Berechtigung', 403);
      ab_del($u, (string)(body()['id'] ?? '')); json_out(['ok' => true]);
    }
    case 'POST ab-number': {
      $u = require_role(AB_ROLES_ALL); require_once LD_PRIV_DIR . '/abnahme-lib.php'; $b = body();
      json_out(['n' => ab_number((string)($b['key'] ?? ''), (int)($b['local'] ?? 0))]);
    }
    case 'GET ab-customers': {
      $u = require_role(AB_ROLES_ALL); require_once LD_PRIV_DIR . '/abnahme-lib.php';
      json_out(['customers' => ab_customers()]);
    }

    /* ---------- Stempeluhr zentral ---------- */
    case 'POST st-sync': {
      $u = require_user(); require_once LD_PRIV_DIR . '/stempel-lib.php';
      json_out(['me' => user_out($u), 'office' => sees_all($u)] + st_sync($u, body()));
    }
    case 'GET st-sites': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/stempel-lib.php'; $pid = (string)($_GET['p'] ?? '');
      $p = valid_id($pid) ? project_row($pid) : null; if (!can_see_project($u, $p)) fail('Keine Berechtigung', 403);
      json_out(st_customer_hours($pid));
    }
    case 'POST st-req': {
      $u = require_user(); require_once LD_PRIV_DIR . '/stempel-lib.php';
      json_out(['ok' => true, 'id' => st_request($u, body())]);
    }
    case 'POST st-req-decide': {
      $me = require_role(['admin', 'buero']); require_once LD_PRIV_DIR . '/stempel-lib.php'; $b = body();
      st_decide($me, (int)($b['id'] ?? 0), !empty($b['ok'])); json_out(['ok' => true]);
    }
    case 'POST st-firm': {
      $me = require_role(['admin', 'buero']); require_once LD_PRIV_DIR . '/stempel-lib.php';
      st_firm_save($me, body()); json_out(['ok' => true]);
    }
    case 'POST st-ack': {
      $u = require_user(); require_once LD_PRIV_DIR . '/stempel-lib.php';
      st_ack($u, (array)(body()['ids'] ?? [])); json_out(['ok' => true]);
    }
    case 'GET st-staff': {
      require_role(['admin', 'buero']); require_once LD_PRIV_DIR . '/stempel-lib.php';
      json_out(['staff' => st_staff(), 'requests' => st_open_requests()]);
    }
    case 'POST st-ops': {
      $me = require_role(['admin', 'buero']); require_once LD_PRIV_DIR . '/stempel-lib.php'; $b = body();
      $to = ($b['to'] ?? '') === '*' ? '*' : (int)($b['to'] ?? 0);
      $id = st_send_ops($me, $to, (array)($b['ops'] ?? []), (string)($b['note'] ?? ''));
      audit((int)$me['id'], 'stempel_aenderung', ($to === '*' ? 'alle' : (user_names()[$to] ?? '')) . ': ' . count((array)$b['ops']) . ' Änderung(en)');
      json_out(['ok' => true, 'id' => $id]);
    }

    /* ---------- CRM: Kunden-Übersicht, Verlauf, Wiedervorlagen ---------- */
    case 'GET crm': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/crm-lib.php';
      $team = db()->query("SELECT id, name FROM users WHERE active = 1 AND role IN ('admin','buero','vertrieb') ORDER BY name")->fetchAll();
      $people = db()->query("SELECT id, name, role FROM users WHERE active = 1 ORDER BY name")->fetchAll();
      json_out(['me' => (int)$u['id'], 'all' => sees_all($u), 'stages' => STAGES, 'customers' => crm_list($u), 'team' => array_map(fn($r) => ['id' => (int)$r['id'], 'name' => $r['name']], $team), 'people' => array_map(fn($r) => ['id' => (int)$r['id'], 'name' => $r['name'], 'role' => $r['role']], $people)]);
    }
    /* ---------- Zählerschrank-Check ---------- */
    case 'GET zs-vnb': { require_role(AB_ROLES_ALL); require_once LD_PRIV_DIR . '/zs-lib.php'; json_out(zs_vnb((string)($_GET['q'] ?? ''))); }
    case 'GET zs-list': { $u = require_role(AB_ROLES_ALL); require_once LD_PRIV_DIR . '/zs-lib.php'; $p = (string)($_GET['p'] ?? ''); json_out(['list' => zs_list($u, valid_id($p) ? $p : ''), 'tabs' => zs_tabs(), 'ai' => zs_ai_status()['on']]); }
    case 'GET zs-get': { $u = require_role(AB_ROLES_ALL); require_once LD_PRIV_DIR . '/zs-lib.php'; json_out(zs_get($u, (int)($_GET['id'] ?? 0))); }
    case 'POST zs-save': { $u = require_role(AB_ROLES_ALL); require_once LD_PRIV_DIR . '/zs-lib.php'; json_out(['ok' => true, 'check' => zs_save($u, body())]); }
    case 'POST zs-ai': { require_role(AB_ROLES_ALL); require_once LD_PRIV_DIR . '/zs-lib.php'; json_out(['ok' => true, 'ai' => zs_ai((array)(body()['photos'] ?? []))]); }
    case 'GET ai-cfg': { require_role(['admin']); require_once LD_PRIV_DIR . '/zs-lib.php'; json_out(zs_ai_status()); }
    case 'POST ai-cfg': { $u = require_role(['admin']); require_once LD_PRIV_DIR . '/zs-lib.php'; $o = zs_ai_key_save($u, (string)(body()['key'] ?? '')); audit((int)$u['id'], 'ki_schluessel', $o['on'] ? 'gesetzt' : 'entfernt'); json_out(['ok' => true] + $o); }
    case 'GET zs-refs': { require_role(['admin', 'buero']); require_once LD_PRIV_DIR . '/zs-lib.php'; json_out(['refs' => zs_refs()]); }
    case 'POST zs-ref': {
      $u = require_role(['admin', 'buero']); require_once LD_PRIV_DIR . '/zs-lib.php'; $b = body(); $act = (string)($b['act'] ?? '');
      if ($act === 'add') { $o = zs_ref_add($u, (int)($b['check'] ?? 0), (string)($b['label'] ?? ''), (string)($b['note'] ?? '')); audit((int)$u['id'], 'zaehlercheck', 'Lernbild hinzugefügt'); json_out(['ok' => true, 'refs' => $o]); }
      json_out(['ok' => true, 'refs' => zs_ref_set((int)($b['id'] ?? 0), isset($b['active']) ? !empty($b['active']) : null, $act === 'del')]);
    }
    case 'POST zs-tabs': { $u = require_role(['admin', 'buero']); require_once LD_PRIV_DIR . '/zs-lib.php'; $o = zs_tabs_save($u, (array)(body()['list'] ?? [])); audit((int)$u['id'], 'zaehlercheck', 'TAB-Liste gespeichert'); json_out(['ok' => true, 'tabs' => $o]); }
    /* ---------- Plantafel ---------- */
    case 'GET plan': {
      $u = require_user(); require_once LD_PRIV_DIR . '/plan-lib.php';
      json_out(plan_get($u, (string)($_GET['from'] ?? ''), (string)($_GET['to'] ?? '')));
    }
    case 'POST plan-save': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/plan-lib.php';
      json_out(['ok' => true, 'event' => plan_save($u, body())]);
    }
    case 'POST plan-del': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/plan-lib.php'; $id = (int)(body()['id'] ?? 0);
      plan_del($id); audit((int)$u['id'], 'termin_geloescht', (string)$id); json_out(['ok' => true]);
    }
    case 'POST plan-res': {
      $u = require_role(['admin', 'buero']); require_once LD_PRIV_DIR . '/plan-lib.php';
      $o = plan_res_save((array)(body()['list'] ?? [])); audit((int)$u['id'], 'plantafel', 'Zeilen gespeichert'); json_out(['ok' => true, 'res' => $o]);
    }
    case 'GET kd-cfg': {
      require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/crm-lib.php'; crm_tables();
      json_out(['gewerke' => kd_out()]);
    }
    case 'POST kd-cfg': {
      $u = require_role(['admin', 'buero']); require_once LD_PRIV_DIR . '/crm-lib.php'; $b = body();
      if (!empty($b['fill'])) { $n = kd_fill(); audit((int)$u['id'], 'kundennummern', "$n Kunden nummeriert"); json_out(['ok' => true, 'filled' => $n, 'gewerke' => kd_out()]); }
      $o = kd_save($u, (array)($b['gewerke'] ?? [])); audit((int)$u['id'], 'kundennummern', 'Gewerke gespeichert'); json_out(['ok' => true, 'gewerke' => $o]);
    }
    case 'POST crm-new': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/crm-lib.php';
      json_out(['ok' => true] + crm_new($u, body()));
    }
    case 'POST kd-assign': {
      $u = require_role(['admin', 'buero', 'vertrieb']); require_once LD_PRIV_DIR . '/crm-lib.php'; $b = body(); $id = (string)($b['id'] ?? '');
      crm_project($u, $id); $nr = kd_assign($id, (string)($b['gewerk'] ?? '')); crm_add_event($id, (int)$u['id'], 'notiz', "Kundennummer $nr vergeben.");
      json_out(['ok' => true, 'kdnr' => $nr]);
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
      $sent = []; if (!empty($b['mentions']) && ld_feature($u, 'markieren')) $sent = crm_mention($u, $id, (int)db()->lastInsertId(), (array)$b['mentions'], $kind, $text);
      json_out(crm_detail($u, $id) + ['mailed' => $sent]);
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
