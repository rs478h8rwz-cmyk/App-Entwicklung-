<?php
/* lumbra.desk – Plantafel: Termine je Mitarbeiter bzw. Team in einer Wochenübersicht.
   Ressourcen (Zeilen) sind Mitarbeiter aus der Benutzerverwaltung oder freie Teams („AC Team“), gruppiert (Monteure, Büro …).
   Ein Termin kann mehreren Ressourcen gehören, über mehrere Tage gehen und mit einem Kunden verknüpft sein. */
declare(strict_types=1);

const PLAN_KINDS = [
  'termin' => ['Kundentermin', '#3B82F6'], 'aufmass' => ['Aufmaß', '#F59E0B'], 'montage' => ['Umsetzung', '#0E7C66'],
  'service' => ['Service', '#8B5CF6'], 'intern' => ['Intern', '#64748B'], 'abwesend' => ['Urlaub / Krank', '#E5484D'],
];
const PLAN_EDIT = ['admin', 'buero', 'vertrieb'];

function plan_tables(): void {
  static $done = false; if ($done) return; $done = true;
  $pdo = db(); projects_table();
  $pdo->exec("CREATE TABLE IF NOT EXISTS plan_res (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(80) NOT NULL, grp VARCHAR(40) NOT NULL DEFAULT '', user_id INT UNSIGNED NULL, sort INT NOT NULL DEFAULT 0, active TINYINT(1) NOT NULL DEFAULT 1) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $pdo->exec("CREATE TABLE IF NOT EXISTS plan_events (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, title VARCHAR(200) NOT NULL DEFAULT '', kind VARCHAR(20) NOT NULL DEFAULT 'termin', start DATETIME NOT NULL, end DATETIME NOT NULL, res VARCHAR(500) NOT NULL DEFAULT '', project_id VARCHAR(40) NULL, note TEXT NULL, created_by INT UNSIGNED NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NULL, updated_by INT UNSIGNED NULL, INDEX (start), INDEX (end), INDEX (project_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  /* Beim ersten Öffnen: alle aktiven Mitarbeiter als Zeilen anlegen (Monteure zuerst) */
  if (!(int)$pdo->query('SELECT COUNT(*) FROM plan_res')->fetchColumn()) {
    $grp = ['monteur' => 'Monteure', 'vertrieb' => 'Vertrieb', 'buero' => 'Büro', 'admin' => 'Büro']; $ord = ['monteur' => 0, 'vertrieb' => 1, 'buero' => 2, 'admin' => 2];
    $ins = $pdo->prepare('INSERT INTO plan_res (name, grp, user_id, sort) VALUES (?, ?, ?, ?)'); $i = 0;
    $us = $pdo->query('SELECT id, name, role FROM users WHERE active = 1 ORDER BY name')->fetchAll();
    usort($us, fn($a, $b) => ($ord[$a['role']] ?? 9) <=> ($ord[$b['role']] ?? 9) ?: strcmp($a['name'], $b['name']));
    foreach ($us as $x) $ins->execute([$x['name'], $grp[$x['role']] ?? 'Mitarbeiter', $x['id'], ++$i * 10]);
  }
}
function plan_res_out(): array {
  return array_map(fn($r) => ['id' => (int)$r['id'], 'name' => $r['name'], 'grp' => $r['grp'], 'user' => $r['user_id'] ? (int)$r['user_id'] : null, 'sort' => (int)$r['sort'], 'active' => (bool)$r['active']],
    db()->query('SELECT * FROM plan_res ORDER BY sort, id')->fetchAll());
}
function plan_date(string $s): ?string { return preg_match('/^\d{4}-\d{2}-\d{2}$/', $s) && strtotime($s) ? $s : null; }
function plan_dt(string $s): ?string { return preg_match('/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/', $s) && strtotime($s) ? date('Y-m-d H:i:s', strtotime($s)) : null; }
function plan_ev_out(array $e): array {
  return ['id' => (int)$e['id'], 'title' => $e['title'], 'kind' => $e['kind'], 'start' => substr($e['start'], 0, 16), 'end' => substr($e['end'], 0, 16),
    'res' => array_values(array_filter(array_map('intval', explode(',', $e['res'])))), 'project' => $e['project_id'], 'note' => (string)$e['note'],
    'pname' => $e['pname'] ?? null, 'kdnr' => $e['kdnr'] ?? null, 'gewerk' => $e['gewerk'] ?? null, 'city' => $e['city'] ?? null, 'street' => $e['street'] ?? null,
    'by' => (int)$e['created_by']];
}
function plan_get(array $u, string $from, string $to): array {
  plan_tables(); $f = plan_date($from) ?? date('Y-m-d', strtotime('monday this week')); $t = plan_date($to) ?? date('Y-m-d', strtotime($f . ' +7 days'));
  $st = db()->prepare("SELECT e.*, p.name pname, p.kdnr, p.gewerk, JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.customer.city')) city, JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.customer.street')) street
    FROM plan_events e LEFT JOIN projects p ON p.id = e.project_id AND p.deleted = 0 WHERE e.start < ? AND e.end > ? ORDER BY e.start");
  $st->execute([$t . ' 23:59:59', $f . ' 00:00:00']);
  $kinds = []; foreach (PLAN_KINDS as $k => [$l, $c]) $kinds[$k] = ['name' => $l, 'color' => $c];
  return ['res' => plan_res_out(), 'events' => array_map('plan_ev_out', $st->fetchAll()), 'kinds' => $kinds, 'edit' => in_array($u['role'], PLAN_EDIT, true), 'from' => $f, 'to' => $t];
}
function plan_save(array $u, array $b): array {
  plan_tables(); $id = (int)($b['id'] ?? 0);
  $start = plan_dt((string)($b['start'] ?? '')); $end = plan_dt((string)($b['end'] ?? ''));
  if (!$start || !$end) fail('Bitte Beginn und Ende angeben.', 400);
  if (strtotime($end) <= strtotime($start)) fail('Das Ende muss nach dem Beginn liegen.', 400);
  if (strtotime($end) - strtotime($start) > 62 * 86400) fail('Ein Termin darf höchstens zwei Monate lang sein.', 400);
  $kind = isset(PLAN_KINDS[$b['kind'] ?? '']) ? (string)$b['kind'] : 'termin';
  $valid = array_column(db()->query('SELECT id FROM plan_res')->fetchAll(), 'id');
  $res = array_values(array_unique(array_filter(array_map('intval', (array)($b['res'] ?? [])), fn($r) => in_array($r, array_map('intval', $valid), true))));
  if (!$res) fail('Bitte mindestens einen Mitarbeiter bzw. ein Team wählen.', 400);
  $pid = (string)($b['project'] ?? ''); $pname = '';
  if ($pid !== '') { $p = project_row($pid); if (!$p || $p['deleted'] || !valid_id($pid)) fail('Kunde nicht gefunden.', 400); $pname = $p['name']; } else $pid = null;
  $title = mb_substr(trim((string)($b['title'] ?? '')), 0, 200); if ($title === '') $title = $pname ?: PLAN_KINDS[$kind][0];
  $note = mb_substr((string)($b['note'] ?? ''), 0, 4000); $rs = implode(',', $res);
  if ($id) {
    $old = db()->prepare('SELECT * FROM plan_events WHERE id = ?'); $old->execute([$id]); if (!$old->fetch()) fail('Termin nicht gefunden – evtl. gelöscht.', 404);
    db()->prepare('UPDATE plan_events SET title = ?, kind = ?, start = ?, end = ?, res = ?, project_id = ?, note = ?, updated_at = UTC_TIMESTAMP(), updated_by = ? WHERE id = ?')->execute([$title, $kind, $start, $end, $rs, $pid, $note, $u['id'], $id]);
  } else {
    db()->prepare('INSERT INTO plan_events (title, kind, start, end, res, project_id, note, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')->execute([$title, $kind, $start, $end, $rs, $pid, $note, $u['id']]);
    $id = (int)db()->lastInsertId();
    if ($pid) { /* im Logbuch des Kunden vermerken */
      try { require_once __DIR__ . '/crm-lib.php'; $names = db()->query('SELECT id, name FROM plan_res WHERE id IN (' . $rs . ')')->fetchAll(PDO::FETCH_KEY_PAIR);
        crm_add_event($pid, (int)$u['id'], 'termin', PLAN_KINDS[$kind][0] . ' geplant: ' . date('d.m.Y H:i', strtotime($start)) . ' – ' . (substr($start, 0, 10) === substr($end, 0, 10) ? date('H:i', strtotime($end)) : date('d.m.Y H:i', strtotime($end))) . ' · ' . implode(', ', $names) . ($title !== $pname ? ' · ' . $title : ''));
      } catch (Throwable $e) {}
    }
  }
  $st = db()->prepare("SELECT e.*, p.name pname, p.kdnr, p.gewerk, JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.customer.city')) city, JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.customer.street')) street FROM plan_events e LEFT JOIN projects p ON p.id = e.project_id WHERE e.id = ?");
  $st->execute([$id]); return plan_ev_out($st->fetch());
}
function plan_del(int $id): void { plan_tables(); db()->prepare('DELETE FROM plan_events WHERE id = ?')->execute([$id]); }
function plan_res_save(array $l): array {
  plan_tables(); $pdo = db(); $keep = []; $i = 0;
  foreach (array_slice($l, 0, 200) as $x) {
    if (!is_array($x)) continue; $name = mb_substr(trim((string)($x['name'] ?? '')), 0, 80); if ($name === '') continue;
    $grp = mb_substr(trim((string)($x['grp'] ?? '')), 0, 40); $uid = (int)($x['user'] ?? 0) ?: null; $act = !isset($x['active']) || !empty($x['active']) ? 1 : 0; $id = (int)($x['id'] ?? 0); $i += 10;
    if ($id) { $pdo->prepare('UPDATE plan_res SET name = ?, grp = ?, user_id = ?, sort = ?, active = ? WHERE id = ?')->execute([$name, $grp, $uid, $i, $act, $id]); $keep[] = $id; }
    else { $pdo->prepare('INSERT INTO plan_res (name, grp, user_id, sort, active) VALUES (?, ?, ?, ?, ?)')->execute([$name, $grp, $uid, $i, $act]); $keep[] = (int)$pdo->lastInsertId(); }
  }
  /* Entfernte Zeilen: nur ausblenden, damit alte Termine ihre Zuordnung behalten */
  if ($keep) $pdo->exec('UPDATE plan_res SET active = 0 WHERE id NOT IN (' . implode(',', array_map('intval', $keep)) . ')');
  return plan_res_out();
}
