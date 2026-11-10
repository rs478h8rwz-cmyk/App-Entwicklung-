<?php
/* LumbraDesk – Stempeluhr zentral
   - Jedes Mitarbeiter-Handy schickt geänderte Tage und seine Einstellungen (ohne Admin-Passwort-Hash).
   - Ein neues Handy holt sich alle Tage vom Server.
   - Büro/Admin sehen alle Mitarbeiter und schicken Änderungen (Urlaub, Krank, Konten, Betriebsurlaub)
     als „Aktualisierung“, die das Handy des Mitarbeiters beim nächsten Abgleich übernimmt. */
declare(strict_types=1);

function st_tables(): void {
  static $done = false; if ($done) return; $done = true; $pdo = db();
  $pdo->exec("CREATE TABLE IF NOT EXISTS stempel_people (user_id INT UNSIGNED PRIMARY KEY, settings LONGTEXT NOT NULL, settings_upd BIGINT NOT NULL DEFAULT 0, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, last_sync DATETIME NULL, device VARCHAR(40) NOT NULL DEFAULT '', app_version VARCHAR(20) NOT NULL DEFAULT '') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $pdo->exec("CREATE TABLE IF NOT EXISTS stempel_days (user_id INT UNSIGNED NOT NULL, iso CHAR(10) NOT NULL, data MEDIUMTEXT NOT NULL, upd BIGINT NOT NULL DEFAULT 0, deleted TINYINT(1) NOT NULL DEFAULT 0, device VARCHAR(40) NOT NULL DEFAULT '', seq BIGINT UNSIGNED NOT NULL DEFAULT 0, PRIMARY KEY (user_id, iso), INDEX (user_id, seq)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $pdo->exec("CREATE TABLE IF NOT EXISTS stempel_ops (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NULL, ops MEDIUMTEXT NOT NULL, note VARCHAR(500) NOT NULL DEFAULT '', by_id INT UNSIGNED NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $pdo->exec("CREATE TABLE IF NOT EXISTS stempel_acks (op_id INT UNSIGNED NOT NULL, user_id INT UNSIGNED NOT NULL, at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (op_id, user_id)) ENGINE=InnoDB");
}
function st_iso(string $s): bool { return (bool)preg_match('/^\d{4}-\d{2}-\d{2}$/', $s); }
function st_seq(): int { static $i = 0; return (int)floor(microtime(true) * 1000) * 1000 + ($i++ % 1000); }   // streng steigend

/* Abgleich eines Mitarbeiter-Handys */
function st_sync(array $u, array $b): array {
  st_tables(); $pdo = db(); $uid = (int)$u['id'];
  $dev = substr(preg_replace('/[^A-Za-z0-9_-]/', '', (string)($b['device'] ?? '')), 0, 40);
  $ver = substr(preg_replace('/[^0-9.]/', '', (string)($b['version'] ?? '')), 0, 20);
  $pdo->beginTransaction();
  /* Tage annehmen: pro Tag gewinnt der neuere Stand (Zeitstempel „updated“ des Tages) */
  $got = 0; $cur = $pdo->prepare('SELECT upd FROM stempel_days WHERE user_id = ? AND iso = ? FOR UPDATE');
  $ins = $pdo->prepare('INSERT INTO stempel_days (user_id, iso, data, upd, deleted, device, seq) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data), upd = VALUES(upd), deleted = VALUES(deleted), device = VALUES(device), seq = VALUES(seq)');
  foreach (array_slice((array)($b['days'] ?? []), 0, 1500) as $d) {
    if (!is_array($d)) continue; $iso = (string)($d['iso'] ?? ''); if (!st_iso($iso)) continue;
    $upd = (int)($d['updated'] ?? 0); $del = !empty($d['_deleted']);
    $cur->execute([$uid, $iso]); $old = $cur->fetchColumn();
    if ($old !== false && (int)$old > $upd) continue;
    $json = json_encode($d, JSON_UNESCAPED_UNICODE); if (strlen($json) > 400000) continue;
    $ins->execute([$uid, $iso, $json, $upd, $del ? 1 : 0, $dev, st_seq()]); $got++;
  }
  /* Einstellungen (ohne Admin-Passwort-Hash und Geräte-Kram) */
  $people = $pdo->prepare('SELECT settings, settings_upd FROM stempel_people WHERE user_id = ? FOR UPDATE'); $people->execute([$uid]); $p = $people->fetch();
  if (isset($b['settings']) && is_array($b['settings'])) {
    $s = $b['settings']; unset($s['admin']); $su = (int)($b['settingsUpd'] ?? 0);
    if (!$p || $su >= (int)$p['settings_upd']) {
      $pdo->prepare('INSERT INTO stempel_people (user_id, settings, settings_upd, updated_at, last_sync, device, app_version) VALUES (?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP(), ?, ?) ON DUPLICATE KEY UPDATE settings = VALUES(settings), settings_upd = VALUES(settings_upd), updated_at = UTC_TIMESTAMP(), last_sync = UTC_TIMESTAMP(), device = VALUES(device), app_version = VALUES(app_version)')
        ->execute([$uid, json_encode($s, JSON_UNESCAPED_UNICODE), $su, $dev, $ver]);
      $p = ['settings' => json_encode($s), 'settings_upd' => $su];
    }
  }
  if ($p) $pdo->prepare('UPDATE stempel_people SET last_sync = UTC_TIMESTAMP(), app_version = ? WHERE user_id = ?')->execute([$ver, $uid]);
  $pdo->commit();
  /* Zurück: Tage, die ein anderes Gerät geändert hat (neues Handy, zweites Gerät) */
  $since = (int)($b['since'] ?? 0); $out = [];
  $st = $pdo->prepare('SELECT data, seq, deleted, iso FROM stempel_days WHERE user_id = ? AND seq > ? AND device <> ? ORDER BY seq LIMIT 2000'); $st->execute([$uid, $since, $dev]);
  $max = $since; foreach ($st->fetchAll() as $r) { $d = json_decode($r['data'], true) ?: ['iso' => $r['iso']]; if ($r['deleted']) $d['_deleted'] = true; $out[] = $d; $max = max($max, (int)$r['seq']); }
  $mx = $pdo->prepare('SELECT MAX(seq) FROM stempel_days WHERE user_id = ?'); $mx->execute([$uid]); $max = max($max, (int)$mx->fetchColumn());
  return ['got' => $got, 'days' => $out, 'since' => $max, 'settings' => (!empty($b['wantSettings']) && $p) ? json_decode($p['settings'], true) : null, 'settingsUpd' => $p ? (int)$p['settings_upd'] : 0, 'ops' => st_pending_ops($u)];
}
function st_pending_ops(array $u): array {
  $st = db()->prepare('SELECT o.* FROM stempel_ops o LEFT JOIN stempel_acks a ON a.op_id = o.id AND a.user_id = ? WHERE (o.user_id = ? OR o.user_id IS NULL) AND a.op_id IS NULL ORDER BY o.id');
  $st->execute([$u['id'], $u['id']]); $n = user_names();
  return array_map(fn($o) => ['id' => 'ld' . $o['id'], 'n' => (int)$o['id'], 'created' => gmdate('Y-m-d\TH:i:s\Z', strtotime($o['created_at'] . ' UTC')), 'by' => $n[(int)$o['by_id']] ?? 'Büro', 'to' => ['name' => $o['user_id'] === null ? '*' : ($n[(int)$o['user_id']] ?? '')], 'ops' => json_decode($o['ops'], true) ?: [], 'note' => $o['note']], $st->fetchAll());
}
function st_ack(array $u, array $ids): void {
  st_tables(); $ins = db()->prepare('INSERT IGNORE INTO stempel_acks (op_id, user_id) VALUES (?, ?)');
  foreach (array_slice($ids, 0, 200) as $i) if ((int)$i > 0) $ins->execute([(int)$i, $u['id']]);
}

/* Büro: alle Mitarbeiter mit Einstellungen, Tagen und noch nicht übernommenen Änderungen */
function st_staff(): array {
  st_tables(); $pdo = db(); $out = [];
  $users = $pdo->query("SELECT u.id, u.name, u.role, u.active, p.settings, p.updated_at, p.last_sync, p.app_version FROM users u LEFT JOIN stempel_people p ON p.user_id = u.id WHERE u.active = 1 ORDER BY u.name")->fetchAll();
  $days = []; foreach ($pdo->query('SELECT user_id, data FROM stempel_days WHERE deleted = 0')->fetchAll() as $r) { $d = json_decode($r['data'], true); if ($d && isset($d['iso'])) $days[(int)$r['user_id']][$d['iso']] = $d; }
  $open = [];
  foreach ($pdo->query('SELECT o.id, o.user_id, o.ops, o.created_at, o.by_id FROM stempel_ops o ORDER BY o.id')->fetchAll() as $o) {
    $acked = $pdo->prepare('SELECT user_id FROM stempel_acks WHERE op_id = ?'); $acked->execute([$o['id']]); $who = array_map('intval', array_column($acked->fetchAll(), 'user_id'));
    if ($o['user_id'] !== null && !in_array((int)$o['user_id'], $who, true)) $open[(int)$o['user_id']][] = ['ops' => json_decode($o['ops'], true) ?: [], 'at' => $o['created_at']];
  }
  foreach ($users as $r) {
    $id = (int)$r['id'];
    $out[] = ['uid' => $id, 'name' => $r['name'], 'role' => $r['role'], 'settings' => $r['settings'] ? json_decode($r['settings'], true) : null, 'at' => $r['updated_at'] ? gmdate('Y-m-d\TH:i:s\Z', strtotime($r['updated_at'] . ' UTC')) : '',
      'lastSync' => $r['last_sync'] ? gmdate('Y-m-d\TH:i:s\Z', strtotime($r['last_sync'] . ' UTC')) : '', 'version' => $r['app_version'], 'days' => (object)($days[$id] ?? []), 'open' => $open[$id] ?? []];
  }
  return $out;
}
function st_send_ops(array $me, $to, array $ops, string $note): int {
  st_tables(); if (!$ops) fail('Keine Änderungen', 400);
  foreach ($ops as $o) if (!is_array($o) || !in_array($o['t'] ?? '', ['vac', 'bal', 'days', 'bu'], true)) fail('Unbekannte Änderung', 400);
  if ($to !== '*') { $st = db()->prepare('SELECT 1 FROM users WHERE id = ? AND active = 1'); $st->execute([(int)$to]); if (!$st->fetch()) fail('Mitarbeiter nicht gefunden', 404); }
  db()->prepare('INSERT INTO stempel_ops (user_id, ops, note, by_id) VALUES (?, ?, ?, ?)')->execute([$to === '*' ? null : (int)$to, json_encode($ops, JSON_UNESCAPED_UNICODE), mb_substr($note, 0, 500), $me['id']]);
  return (int)db()->lastInsertId();
}
