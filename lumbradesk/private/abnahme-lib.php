<?php
/* LumbraDesk – Abnahme & Service zentral
   Protokolle (mit Fotos und Unterschriften) liegen als Datei in private/aprot/<id>.json,
   die Übersicht (Nummer, Kunde, Monteur, Datum, Kunde in LumbraDesk) in der Tabelle abnahme_prots. */
declare(strict_types=1);

const AB_ROLES = ['admin', 'buero', 'monteur'];
const AB_TYPES = ['abnahme' => 'Abnahme', 'service' => 'Service'];

function ab_tables(): void {
  static $done = false; if ($done) return; $done = true; $pdo = db();
  $pdo->exec("CREATE TABLE IF NOT EXISTS abnahme_prots (id VARCHAR(40) PRIMARY KEY, owner_id INT UNSIGNED NOT NULL, nr VARCHAR(60) NOT NULL DEFAULT '', type VARCHAR(20) NOT NULL DEFAULT '', gewerk VARCHAR(20) NOT NULL DEFAULT '', kunde VARCHAR(200) NOT NULL DEFAULT '', adresse VARCHAR(300) NOT NULL DEFAULT '', monteur VARCHAR(200) NOT NULL DEFAULT '', datum VARCHAR(10) NOT NULL DEFAULT '', project_id VARCHAR(40) NULL, photos INT NOT NULL DEFAULT 0, size INT NOT NULL DEFAULT 0, upd BIGINT NOT NULL DEFAULT 0, deleted TINYINT(1) NOT NULL DEFAULT 0, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_by INT UNSIGNED NULL, INDEX (owner_id), INDEX (project_id), INDEX (deleted)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $pdo->exec("CREATE TABLE IF NOT EXISTS abnahme_numbers (k VARCHAR(60) PRIMARY KEY, n INT UNSIGNED NOT NULL DEFAULT 0) ENGINE=InnoDB");
}
function ab_dir(): string {
  $d = __DIR__ . '/aprot';
  if (!is_dir($d)) { @mkdir($d, 0700, true); @file_put_contents($d . '/.htaccess', "Require all denied\n"); }
  return $d;
}
function ab_office(array $u): bool { return in_array($u['role'], ['admin', 'buero'], true); }
function ab_row(string $id): ?array { ab_tables(); $st = db()->prepare('SELECT * FROM abnahme_prots WHERE id = ?'); $st->execute([$id]); return $st->fetch() ?: null; }
function ab_can(array $u, ?array $r): bool { return $r && (ab_office($u) || (int)$r['owner_id'] === (int)$u['id']); }
function ab_meta(array $r): array {
  $n = user_names(); $pname = null;
  if ($r['project_id']) { $p = project_row($r['project_id']); $pname = $p && !$p['deleted'] ? $p['name'] : null; }
  return ['id' => $r['id'], 'nr' => $r['nr'], 'type' => $r['type'], 'typeName' => AB_TYPES[$r['type']] ?? $r['type'], 'gewerk' => $r['gewerk'], 'kunde' => $r['kunde'], 'adresse' => $r['adresse'], 'monteur' => $r['monteur'],
    'datum' => $r['datum'], 'project' => $pname !== null ? $r['project_id'] : null, 'projectName' => $pname, 'photos' => (int)$r['photos'], 'size' => (int)$r['size'], 'upd' => (int)$r['upd'],
    'owner' => (int)$r['owner_id'], 'ownerName' => $n[(int)$r['owner_id']] ?? '', 'at' => $r['updated_at']];
}

/* Fortlaufende Nummer je Art/Gewerk/Jahr für alle Geräte (keine doppelten Nummern) */
function ab_number(string $key, int $local): int {
  ab_tables(); if (!preg_match('/^[A-Za-z]{1,6}-[A-Za-z0-9]{1,10}-\d{4}$/', $key)) fail('Ungültiger Nummernkreis', 400);
  $pdo = db(); $pdo->beginTransaction();
  $st = $pdo->prepare('SELECT n FROM abnahme_numbers WHERE k = ? FOR UPDATE'); $st->execute([$key]); $n = $st->fetchColumn();
  if ($n === false) {   // erster Abruf: höchste schon vorhandene Nummer übernehmen
    $mx = $pdo->prepare("SELECT MAX(CAST(SUBSTRING_INDEX(nr, '-', -1) AS UNSIGNED)) FROM abnahme_prots WHERE nr LIKE ?"); $mx->execute([$key . '-%']);
    $n = max((int)$mx->fetchColumn(), max(0, $local)); $pdo->prepare('INSERT INTO abnahme_numbers (k, n) VALUES (?, ?)')->execute([$key, $n]);
  }
  $n = max((int)$n, max(0, $local)) + 1;
  $pdo->prepare('UPDATE abnahme_numbers SET n = ? WHERE k = ?')->execute([$n, $key]); $pdo->commit();
  return $n;
}

/* Protokoll speichern (neu oder geändert). Kunde verknüpfen: gewählt in der App, sonst eindeutiger Namens-Treffer. */
function ab_put(array $u, array $rec): array {
  ab_tables(); $id = (string)($rec['id'] ?? ''); if (!valid_id($id)) fail('Ungültiges Protokoll', 400);
  $old = ab_row($id); if ($old && !ab_can($u, $old)) fail('Keine Berechtigung für dieses Protokoll', 403);
  $upd = (int)($rec['updated'] ?? 0);
  if ($old && !$old['deleted'] && (int)$old['upd'] > $upd) return ['ok' => true, 'older' => true] + ab_meta($old);
  $json = json_encode($rec, JSON_UNESCAPED_UNICODE); if (strlen($json) > 60 * 1024 * 1024) fail('Protokoll zu groß', 400);
  file_put_contents(ab_dir() . '/' . $id . '.json', $json, LOCK_EX);
  $a = (array)($rec['answers'] ?? []); $kunde = mb_substr(trim((string)($a['kunde'] ?? '')), 0, 200);
  $pid = (string)($rec['projectId'] ?? ''); if ($pid !== '' && (!valid_id($pid) || !($p = project_row($pid)) || $p['deleted'])) $pid = '';
  if ($pid === '' && $kunde !== '') {
    $st = db()->prepare("SELECT id FROM projects WHERE deleted = 0 AND (LOWER(name) = LOWER(?) OR LOWER(JSON_UNQUOTE(JSON_EXTRACT(data, '$.customer.name'))) = LOWER(?)) LIMIT 2"); $st->execute([$kunde, $kunde]); $hits = $st->fetchAll();
    if (count($hits) === 1) $pid = $hits[0]['id'];
  }
  if ($pid === '' && $old && $old['project_id']) $pid = $old['project_id'];
  $datum = (string)($a['datum'] ?? ''); if (!$datum && !empty($a['einsaetze'][0]['datum'])) $datum = (string)$a['einsaetze'][0]['datum'];
  $row = [$u['id'], mb_substr((string)($rec['nr'] ?? ''), 0, 60), mb_substr((string)($rec['type'] ?? ''), 0, 20), mb_substr((string)($rec['gewerk'] ?? ''), 0, 20), $kunde, mb_substr(trim((string)($a['adresse'] ?? '')), 0, 300),
    mb_substr(trim((string)($a['monteur'] ?? '')), 0, 200), substr($datum, 0, 10), $pid ?: null, count((array)($rec['photos'] ?? [])), strlen($json), $upd, $u['id']];
  if ($old) db()->prepare('UPDATE abnahme_prots SET nr = ?, type = ?, gewerk = ?, kunde = ?, adresse = ?, monteur = ?, datum = ?, project_id = ?, photos = ?, size = ?, upd = ?, deleted = 0, updated_at = UTC_TIMESTAMP(), updated_by = ? WHERE id = ?')->execute(array_merge(array_slice($row, 1), [$id]));
  else db()->prepare('INSERT INTO abnahme_prots (owner_id, nr, type, gewerk, kunde, adresse, monteur, datum, project_id, photos, size, upd, updated_by, id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())')->execute(array_merge($row, [$id]));
  /* Beim Kunden im Verlauf festhalten; eine fertige Abnahme schließt den Auftrag ab */
  if ($pid && (!$old || $old['project_id'] !== $pid)) {
    try {
      require_once __DIR__ . '/crm-lib.php';
      $t = AB_TYPES[$rec['type'] ?? ''] ?? 'Protokoll';
      crm_add_event($pid, (int)$u['id'], 'protokoll', $t . 'protokoll ' . ($rec['nr'] ?? '') . ($datum ? ' vom ' . date('d.m.Y', strtotime($datum)) : '') . (!empty($a['monteur']) ? ' · Monteur: ' . $a['monteur'] : '') . ' · ' . ($np = count((array)($rec['photos'] ?? []))) . ($np === 1 ? ' Foto' : ' Fotos'));
      if (($rec['type'] ?? '') === 'abnahme') {
        $c = crm_project(array_merge($u, ['role' => 'admin']), $pid); $o = crm_row_out($c);
        if (in_array($o['stage'], ['auftrag', 'montage'], true)) {
          db()->prepare('UPDATE projects SET stage = ?, stage_base = ?, stage_at = UTC_TIMESTAMP() WHERE id = ?')->execute(['fertig', $o['derived'], $pid]);
          crm_add_event($pid, (int)$u['id'], 'stufe', STAGES[$o['stage']] . ' → ' . STAGES['fertig'] . ' (Abnahme)');
        }
      }
    } catch (Throwable $e) { error_log('LumbraDesk Abnahme→Kunde: ' . $e->getMessage()); }
  }
  return ['ok' => true] + ab_meta(ab_row($id));
}
function ab_get(array $u, string $id): array {
  $r = valid_id($id) ? ab_row($id) : null; if (!$r || $r['deleted']) fail('Protokoll nicht gefunden', 404);
  if (!ab_can($u, $r)) fail('Keine Berechtigung für dieses Protokoll', 403);
  $f = ab_dir() . '/' . $id . '.json'; if (!is_file($f)) fail('Protokoll-Datei fehlt', 404);
  $rec = json_decode((string)file_get_contents($f), true) ?: []; $rec['_meta'] = ab_meta($r); return $rec;
}
function ab_del(array $u, string $id): void {
  $r = valid_id($id) ? ab_row($id) : null; if (!$r) return;
  if (!ab_can($u, $r)) fail('Keine Berechtigung', 403);
  db()->prepare('UPDATE abnahme_prots SET deleted = 1, upd = ?, updated_at = UTC_TIMESTAMP(), updated_by = ? WHERE id = ?')->execute([(int)floor(microtime(true) * 1000), $u['id'], $id]);
  audit((int)$u['id'], 'protokoll_geloescht', $r['nr'] . ' ' . $r['kunde']);
}
/* Liste: eigene (Handy) oder alle (Büro) bzw. die eines Kunden */
function ab_list(array $u, string $scope, string $pid = ''): array {
  ab_tables(); $sql = 'SELECT * FROM abnahme_prots WHERE 1 = 1'; $args = [];
  if ($scope === 'mine') { $sql .= ' AND owner_id = ?'; $args[] = $u['id']; }
  elseif (!ab_office($u)) { $sql .= ' AND owner_id = ?'; $args[] = $u['id']; }
  if ($pid !== '') { $sql .= ' AND project_id = ? AND deleted = 0'; $args[] = $pid; }
  elseif ($scope !== 'mine') $sql .= ' AND deleted = 0';
  $st = db()->prepare($sql . ' ORDER BY datum DESC, updated_at DESC LIMIT 2000'); $st->execute($args);
  return array_map(fn($r) => ab_meta($r) + ['deleted' => (bool)$r['deleted']], $st->fetchAll());
}
/* Kundenauswahl in der Abnahme-App (auch für Monteure): Name, Adresse, Telefon, Stufe */
function ab_customers(): array {
  require_once __DIR__ . '/crm-lib.php'; crm_tables();
  $rows = db()->query('SELECT ' . CRM_FIELDS . ' FROM projects p WHERE p.deleted = 0')->fetchAll();
  $out = array_map(function ($r) { $c = crm_row_out($r); return ['id' => $c['id'], 'name' => $c['name'], 'street' => $c['street'], 'zip' => $c['zip'], 'city' => $c['city'], 'phone' => $c['phone'], 'stage' => $c['stage'], 'archived' => $c['archived'], 'type' => $c['type']]; }, $rows);
  $order = ['montage' => 0, 'auftrag' => 1, 'fertig' => 2, 'angebot' => 3, 'termin' => 4, 'anfrage' => 5, 'verloren' => 6];
  usort($out, fn($a, $b) => ($order[$a['stage']] ?? 9) <=> ($order[$b['stage']] ?? 9) ?: strcmp($a['name'], $b['name']));
  return array_values(array_filter($out, fn($c) => !$c['archived'] && $c['stage'] !== 'verloren'));
}
