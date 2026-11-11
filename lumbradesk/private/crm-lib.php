<?php
/* LumbraDesk – CRM-Grundlagen
   - Vertriebs-Stufe je Kunde (Anfrage → Termin → Angebot → Auftrag → Montage → Abgeschlossen, oder Verloren)
   - Kundenverlauf (Notizen, Anrufe, Termine, E-Mails, Stufenwechsel)
   - Wiedervorlagen / Aufgaben mit Fälligkeit und Zuständigem, tägliche E-Mail-Erinnerung
   Die Kundendaten selbst (Name, Adresse, Angebot) kommen aus der Wirtschaftlichkeits-App. */
declare(strict_types=1);

const STAGES = ['anfrage' => 'Anfrage', 'termin' => 'Termin', 'angebot' => 'Angebot', 'auftrag' => 'Auftrag', 'montage' => 'Montage', 'fertig' => 'Abgeschlossen', 'verloren' => 'Verloren'];
const EVENT_KINDS = ['notiz' => 'Notiz', 'anruf' => 'Anruf', 'termin' => 'Termin', 'email' => 'E-Mail', 'stufe' => 'Stufe', 'zuweisung' => 'Zuweisung', 'aufgabe' => 'Aufgabe'];

function crm_tables(): void {
  static $done = false; if ($done) return; $done = true;
  projects_table(); $pdo = db();
  $pdo->exec("CREATE TABLE IF NOT EXISTS crm_events (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, project_id VARCHAR(40) NOT NULL, user_id INT UNSIGNED NULL, kind VARCHAR(20) NOT NULL, text TEXT NOT NULL, at DATETIME NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (project_id), INDEX (at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $pdo->exec("CREATE TABLE IF NOT EXISTS crm_tasks (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, project_id VARCHAR(40) NULL, title VARCHAR(300) NOT NULL, due DATE NOT NULL, assignee_id INT UNSIGNED NOT NULL, created_by INT UNSIGNED NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, done_at DATETIME NULL, done_by INT UNSIGNED NULL, INDEX (project_id), INDEX (assignee_id), INDEX (due), INDEX (done_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $cols = array_column($pdo->query('SHOW COLUMNS FROM projects')->fetchAll(), 'Field');
  if (!in_array('stage', $cols, true)) $pdo->exec("ALTER TABLE projects ADD COLUMN stage VARCHAR(20) NULL, ADD COLUMN stage_at DATETIME NULL");
  if (!in_array('stage_base', $cols, true)) $pdo->exec("ALTER TABLE projects ADD COLUMN stage_base VARCHAR(20) NULL");
  $ucols = array_column($pdo->query('SHOW COLUMNS FROM users')->fetchAll(), 'Field');
  if (!in_array('remind', $ucols, true)) $pdo->exec("ALTER TABLE users ADD COLUMN remind TINYINT(1) NOT NULL DEFAULT 1");
}

/* Stufe aus dem Status der Wirtschaftlichkeits-App ableiten */
function crm_derived(string $status, bool $hasOffer): string {
  return $status === 'verloren' ? 'verloren' : ($status === 'unterschrieben' ? 'auftrag' : ($status === 'gesendet' || $hasOffer ? 'angebot' : 'anfrage'));
}
/* Eine im CRM gewählte Stufe gilt. Ändert sich danach der Status in der App (z. B. „Unterschrieben“), rückt die Stufe mit – aber nie zurück. */
function crm_stage(?string $stored, ?string $base, string $derived): string {
  if (!$stored || !isset(STAGES[$stored])) return $derived;
  if ($derived === $base) return $stored;
  if ($derived === 'verloren') return 'verloren';
  $o = array_keys(STAGES);
  return $stored !== 'verloren' && array_search($derived, $o, true) > array_search($stored, $o, true) ? $derived : $stored;
}

const CRM_FIELDS = "p.id, p.owner_id, p.created_by, p.assigned_by, p.assigned_at, p.updated_at, p.stage, p.stage_at, p.stage_base, p.name,
  JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.type')) AS type, JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.status')) AS status, JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.statusDate')) AS status_date,
  JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.step')) AS step, JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.archived')) AS archived,
  JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.created')) AS created_ms,
  JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.customer.street')) AS street, JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.customer.zip')) AS zip,
  JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.customer.city')) AS city, JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.customer.phone')) AS phone,
  JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.customer.email')) AS email, JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.offer.total')) AS total,
  JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.offer.gross')) AS gross, JSON_UNQUOTE(JSON_EXTRACT(p.data, '$.offer.number')) AS offer_no";

function crm_val($v): string { return ($v === null || $v === 'null') ? '' : (string)$v; }
function crm_row_out(array $r, array $extra = []): array {
  $n = user_names(); $total = (float)crm_val($r['total'] ?: $r['gross']);
  $derived = crm_derived(crm_val($r['status']) ?: 'offen', $total > 0 || crm_val($r['offer_no']) !== '');
  return [
    'id' => $r['id'], 'name' => $r['name'] ?: 'Ohne Namen', 'type' => crm_val($r['type']), 'status' => crm_val($r['status']) ?: 'offen',
    'step' => (int)crm_val($r['step']) ?: 1, 'archived' => crm_val($r['archived']) === 'true',
    'street' => crm_val($r['street']), 'zip' => crm_val($r['zip']), 'city' => crm_val($r['city']), 'phone' => crm_val($r['phone']), 'email' => crm_val($r['email']),
    'total' => $total ?: null, 'offerNo' => crm_val($r['offer_no']),
    'stage' => crm_stage($r['stage'], $r['stage_base'], $derived), 'derived' => $derived, 'stageSet' => $r['stage'], 'stageAt' => $r['stage_at'],
    'owner' => (int)$r['owner_id'], 'ownerName' => $n[(int)$r['owner_id']] ?? '', 'by' => (int)$r['created_by'], 'byName' => $n[(int)$r['created_by']] ?? '',
    'assignedBy' => $r['assigned_by'] ? (int)$r['assigned_by'] : null, 'assignedByName' => $r['assigned_by'] ? ($n[(int)$r['assigned_by']] ?? '') : '', 'assignedAt' => $r['assigned_at'],
    'statusDate' => crm_val($r['status_date'] ?? null),
    'created' => crm_val($r['created_ms']) !== '' ? gmdate('Y-m-d H:i:s', (int)((float)$r['created_ms'] / 1000)) : null, 'upd' => $r['updated_at'],
  ] + $extra;
}

function crm_list(array $u): array {
  crm_tables(); $pdo = db();
  $where = 'p.deleted = 0' . (sees_all($u) ? '' : ' AND (p.owner_id = ? OR p.created_by = ?)');
  $st = $pdo->prepare('SELECT ' . CRM_FIELDS . ' FROM projects p WHERE ' . $where); $st->execute(sees_all($u) ? [] : [$u['id'], $u['id']]);
  $rows = $st->fetchAll();
  /* letzte Aktivität und offene Aufgaben je Kunde */
  $last = []; foreach ($pdo->query('SELECT project_id, MAX(at) m FROM crm_events GROUP BY project_id')->fetchAll() as $x) $last[$x['project_id']] = $x['m'];
  $open = []; foreach ($pdo->query('SELECT project_id, COUNT(*) n, MIN(due) d FROM crm_tasks WHERE done_at IS NULL AND project_id IS NOT NULL GROUP BY project_id')->fetchAll() as $x) $open[$x['project_id']] = ['n' => (int)$x['n'], 'd' => $x['d']];
  return array_map(fn($r) => crm_row_out($r, ['last' => $last[$r['id']] ?? null, 'openTasks' => $open[$r['id']]['n'] ?? 0, 'nextDue' => $open[$r['id']]['d'] ?? null]), $rows);
}

function crm_project(array $u, string $id): array {
  crm_tables(); if (!valid_id($id)) fail('Ungültiger Kunde', 400);
  $st = db()->prepare('SELECT ' . CRM_FIELDS . ', p.deleted FROM projects p WHERE p.id = ?'); $st->execute([$id]); $r = $st->fetch();
  if (!$r || $r['deleted']) fail('Kunde nicht gefunden – evtl. gelöscht oder noch nicht abgeglichen.', 404);
  if (!can_see_project($u, ['owner_id' => $r['owner_id'], 'created_by' => $r['created_by']])) fail('Keine Berechtigung für diesen Kunden', 403);
  return $r;
}

function crm_event_out(array $e): array {
  $n = user_names();
  return ['id' => (int)$e['id'], 'kind' => $e['kind'], 'text' => $e['text'], 'at' => $e['at'], 'user' => $e['user_id'] ? (int)$e['user_id'] : null, 'userName' => $e['user_id'] ? ($n[(int)$e['user_id']] ?? '') : 'System'];
}
function crm_task_out(array $t): array {
  $n = user_names();
  return ['id' => (int)$t['id'], 'project' => $t['project_id'], 'projectName' => $t['pname'] ?? null, 'title' => $t['title'], 'due' => $t['due'],
    'assignee' => (int)$t['assignee_id'], 'assigneeName' => $n[(int)$t['assignee_id']] ?? '', 'by' => (int)$t['created_by'], 'byName' => $n[(int)$t['created_by']] ?? '',
    'done' => $t['done_at'] !== null, 'doneAt' => $t['done_at'], 'doneByName' => $t['done_by'] ? ($n[(int)$t['done_by']] ?? '') : ''];
}
function crm_add_event(string $pid, ?int $uid, string $kind, string $text, ?string $at = null): void {
  crm_tables();
  db()->prepare('INSERT INTO crm_events (project_id, user_id, kind, text, at) VALUES (?, ?, ?, ?, ' . ($at ? '?' : 'UTC_TIMESTAMP()') . ')')
    ->execute(array_merge([$pid, $uid, $kind, mb_substr($text, 0, 5000)], $at ? [$at] : []));
}

function crm_detail(array $u, string $id): array {
  $r = crm_project($u, $id);
  $ev = db()->prepare('SELECT * FROM crm_events WHERE project_id = ? ORDER BY at DESC, id DESC LIMIT 500'); $ev->execute([$id]);
  $tk = db()->prepare('SELECT * FROM crm_tasks WHERE project_id = ? ORDER BY done_at IS NOT NULL, due, id'); $tk->execute([$id]);
  return ['customer' => crm_row_out($r), 'events' => array_map('crm_event_out', $ev->fetchAll()), 'tasks' => array_map('crm_task_out', $tk->fetchAll())];
}

/* Aufgaben, die ein Benutzer sehen darf: eigene (zuständig/angelegt) + bei Admin/Büro alle */
function crm_tasks_for(array $u, string $scope): array {
  crm_tables();
  $sql = 'SELECT t.*, p.name AS pname FROM crm_tasks t LEFT JOIN projects p ON p.id = t.project_id WHERE (t.project_id IS NULL OR p.deleted = 0)';
  $args = [];
  if ($scope !== 'alle' || !sees_all($u)) { $sql .= ' AND (t.assignee_id = ? OR t.created_by = ?)'; $args = [$u['id'], $u['id']]; }
  $sql .= ' AND (t.done_at IS NULL OR t.done_at > UTC_TIMESTAMP() - INTERVAL 14 DAY) ORDER BY t.done_at IS NOT NULL, t.due, t.id';
  $st = db()->prepare($sql); $st->execute($args);
  return array_map('crm_task_out', $st->fetchAll());
}
function crm_task_row(array $u, int $id): array {
  crm_tables(); $st = db()->prepare('SELECT * FROM crm_tasks WHERE id = ?'); $st->execute([$id]); $t = $st->fetch();
  if (!$t) fail('Aufgabe nicht gefunden', 404);
  if (!sees_all($u) && (int)$t['assignee_id'] !== (int)$u['id'] && (int)$t['created_by'] !== (int)$u['id']) {
    $p = $t['project_id'] ? project_row($t['project_id']) : null; if (!can_see_project($u, $p)) fail('Keine Berechtigung', 403);
  }
  return $t;
}
function crm_valid_user(int $id): bool {
  $st = db()->prepare("SELECT 1 FROM users WHERE id = ? AND active = 1 AND role IN ('admin','buero','vertrieb')"); $st->execute([$id]); return (bool)$st->fetch();
}
function crm_date(string $s): ?string { return preg_match('/^\d{4}-\d{2}-\d{2}$/', $s) && strtotime($s) ? $s : null; }

/* Tägliche E-Mail an jeden mit fälligen Wiedervorlagen (aus dem Cronjob) */
function crm_send_reminders(): int {
  crm_tables(); $pdo = db(); $today = (new DateTime('now', new DateTimeZone('Europe/Berlin')))->format('Y-m-d');
  $st = $pdo->prepare("SELECT t.*, p.name AS pname, u.email, u.name AS uname FROM crm_tasks t JOIN users u ON u.id = t.assignee_id LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.done_at IS NULL AND t.due <= ? AND u.active = 1 AND u.remind = 1 AND (t.project_id IS NULL OR p.deleted = 0) ORDER BY u.id, t.due");
  $st->execute([$today]); $by = [];
  foreach ($st->fetchAll() as $t) $by[$t['email']][] = $t;
  $sent = 0;
  foreach ($by as $email => $tasks) {
    $lines = array_map(fn($t) => '• ' . ($t['due'] < $today ? '(überfällig seit ' . date('d.m.', strtotime($t['due'])) . ') ' : '') . $t['title'] . ($t['pname'] ? ' – ' . $t['pname'] : ''), $tasks);
    $n = count($tasks);
    [$text, $html] = mail_tpl('Hallo ' . explode(' ', $tasks[0]['uname'])[0] . ',', 'heute ' . ($n === 1 ? 'ist 1 Wiedervorlage' : "sind $n Wiedervorlagen") . " fällig:\n" . implode("\n", $lines), 'Aufgaben öffnen', base_url() . '/#/aufgaben', 'Diese Erinnerung kannst du in LumbraDesk unter Start → Mein Konto abschalten.');
    try { send_mail($email, 'Heute fällig: ' . $n . ' ' . ($n === 1 ? 'Wiedervorlage' : 'Wiedervorlagen'), $text, str_replace("\n", '<br>', $html)); $sent++; } catch (Throwable $e) { error_log('LumbraDesk Erinnerung: ' . $e->getMessage()); }
  }
  return $sent;
}

/* Dashboard: Kennzahlen, Pipeline, Team, letzte Aktivitäten */
function crm_dash(array $u): array {
  $list = crm_list($u); $pdo = db(); $n = user_names();
  $tz = new DateTimeZone('Europe/Berlin'); $now = new DateTime('now', $tz); $month = $now->format('Y-m'); $today = $now->format('Y-m-d');
  $won = ['auftrag', 'montage', 'fertig']; $act = array_values(array_filter($list, fn($c) => !$c['archived'] || in_array($c['stage'], $won, true)));
  /* Datum „Auftrag erhalten“: CRM-Stufe gesetzt → stage_at, sonst Datum „Unterschrieben“ aus der App */
  $wonDate = fn($c) => in_array($c['stage'], $won, true) ? (($c['stageAt'] && in_array($c['stageSet'], $won, true)) ? substr($c['stageAt'], 0, 10) : ($c['statusDate'] ?: substr((string)$c['upd'], 0, 10))) : null;
  $stages = []; foreach (array_keys(STAGES) as $s) { $g = array_filter($act, fn($c) => $c['stage'] === $s); $stages[] = ['key' => $s, 'n' => count($g), 'sum' => array_sum(array_map(fn($c) => $c['total'] ?: 0, $g))]; }
  $openOffers = array_filter($act, fn($c) => $c['stage'] === 'angebot');
  $wonMonth = array_filter($act, fn($c) => ($d = $wonDate($c)) && substr($d, 0, 7) === $month);
  $since = (clone $now)->modify('-12 months')->format('Y-m-d');
  $dec = array_filter($act, fn($c) => in_array($c['stage'], array_merge($won, ['verloren']), true) && (($c['stageAt'] ? substr($c['stageAt'], 0, 10) : ($c['statusDate'] ?: $c['upd'])) >= $since));
  $nWon = count(array_filter($dec, fn($c) => $c['stage'] !== 'verloren'));
  /* Aufgaben */
  $ids = array_column($list, 'id'); $visible = array_flip($ids);
  $tasks = $pdo->query("SELECT t.assignee_id, t.due, t.project_id FROM crm_tasks t LEFT JOIN projects p ON p.id = t.project_id WHERE t.done_at IS NULL AND (t.project_id IS NULL OR p.deleted = 0)")->fetchAll();
  $mine = fn($t) => (int)$t['assignee_id'] === (int)$u['id'];
  $overdue = count(array_filter($tasks, fn($t) => $mine($t) && $t['due'] < $today)); $dueToday = count(array_filter($tasks, fn($t) => $mine($t) && $t['due'] === $today));
  /* Aktivitäten (7 Tage) und letzte Einträge */
  $ev = $pdo->query("SELECT e.*, p.name AS pname FROM crm_events e JOIN projects p ON p.id = e.project_id AND p.deleted = 0 WHERE e.at > UTC_TIMESTAMP() - INTERVAL 30 DAY ORDER BY e.at DESC, e.id DESC LIMIT 400")->fetchAll();
  $ev = array_values(array_filter($ev, fn($e) => isset($visible[$e['project_id']])));
  $recent = array_map(fn($e) => crm_event_out($e) + ['project' => $e['project_id'], 'projectName' => $e['pname']], array_slice($ev, 0, 8));
  $team = [];
  if (sees_all($u)) {
    $wk = gmdate('Y-m-d H:i:s', time() - 7 * 86400);
    foreach ($pdo->query("SELECT id, name FROM users WHERE active = 1 AND role IN ('admin','buero','vertrieb') ORDER BY name")->fetchAll() as $m) {
      $id = (int)$m['id']; $own = array_filter($act, fn($c) => $c['owner'] === $id && !in_array($c['stage'], ['fertig', 'verloren'], true));
      $team[] = ['id' => $id, 'name' => $m['name'], 'active' => count($own),
        'offers' => array_sum(array_map(fn($c) => $c['stage'] === 'angebot' ? ($c['total'] ?: 0) : 0, $own)),
        'won' => count(array_filter($wonMonth, fn($c) => $c['owner'] === $id)),
        'acts' => count(array_filter($ev, fn($e) => (int)$e['user_id'] === $id && in_array($e['kind'], ['notiz', 'anruf', 'termin', 'email'], true) && $e['at'] >= $wk)),
        'overdue' => count(array_filter($tasks, fn($t) => (int)$t['assignee_id'] === $id && $t['due'] < $today))];
    }
    $team = array_values(array_filter($team, fn($t) => $t['active'] || $t['won'] || $t['acts'] || $t['overdue']));
  }
  $vacReq = 0; if (sees_all($u)) { try { require_once __DIR__ . '/stempel-lib.php'; $vacReq = count(st_open_requests()); } catch (Throwable $e) {} }
  return ['all' => sees_all($u), 'month' => $month, 'vacReq' => $vacReq,
    'kpi' => ['offers' => count($openOffers), 'offersSum' => array_sum(array_map(fn($c) => $c['total'] ?: 0, $openOffers)),
      'wonMonth' => count($wonMonth), 'wonMonthSum' => array_sum(array_map(fn($c) => $c['total'] ?: 0, $wonMonth)),
      'rate' => count($dec) ? round(100 * $nWon / count($dec)) : null, 'decided' => count($dec), 'overdue' => $overdue, 'dueToday' => $dueToday],
    'stages' => $stages, 'team' => $team, 'recent' => $recent];
}
