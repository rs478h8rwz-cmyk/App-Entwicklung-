<?php
/* LumbraDesk – CRM-Grundlagen
   - Vertriebs-Stufe je Kunde (Anfrage → Termin → Angebot → Auftrag → Montage → Abgeschlossen, oder Verloren)
   - Kundenverlauf (Notizen, Anrufe, Termine, E-Mails, Stufenwechsel)
   - Wiedervorlagen / Aufgaben mit Fälligkeit und Zuständigem, tägliche E-Mail-Erinnerung
   Die Kundendaten selbst (Name, Adresse, Angebot) kommen aus der Wirtschaftlichkeits-App. */
declare(strict_types=1);

const STAGES = ['anfrage' => 'Anfrage', 'termin' => 'Termin', 'angebot' => 'Angebot', 'auftrag' => 'Auftrag', 'montage' => 'Montage', 'fertig' => 'Abgeschlossen', 'verloren' => 'Verloren'];
const EVENT_KINDS = ['notiz' => 'Notiz', 'anruf' => 'Anruf', 'termin' => 'Termin', 'email' => 'E-Mail', 'stufe' => 'Stufe', 'zuweisung' => 'Zuweisung', 'aufgabe' => 'Aufgabe', 'check' => 'Checkliste'];

function crm_tables(): void {
  static $done = false; if ($done) return; $done = true;
  projects_table(); $pdo = db();
  $pdo->exec("CREATE TABLE IF NOT EXISTS crm_events (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, project_id VARCHAR(40) NOT NULL, user_id INT UNSIGNED NULL, kind VARCHAR(20) NOT NULL, text TEXT NOT NULL, at DATETIME NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (project_id), INDEX (at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $pdo->exec("CREATE TABLE IF NOT EXISTS crm_tasks (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, project_id VARCHAR(40) NULL, title VARCHAR(300) NOT NULL, due DATE NOT NULL, assignee_id INT UNSIGNED NOT NULL, created_by INT UNSIGNED NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, done_at DATETIME NULL, done_by INT UNSIGNED NULL, INDEX (project_id), INDEX (assignee_id), INDEX (due), INDEX (done_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $cols = array_column($pdo->query('SHOW COLUMNS FROM projects')->fetchAll(), 'Field');
  if (!in_array('stage', $cols, true)) $pdo->exec("ALTER TABLE projects ADD COLUMN stage VARCHAR(20) NULL, ADD COLUMN stage_at DATETIME NULL");
  $ecols = array_column($pdo->query('SHOW COLUMNS FROM crm_events')->fetchAll(), 'Field');
  if (!in_array('mentions', $ecols, true)) $pdo->exec("ALTER TABLE crm_events ADD COLUMN mentions VARCHAR(500) NULL");
  if (!in_array('ref', $ecols, true)) $pdo->exec("ALTER TABLE crm_events ADD COLUMN ref VARCHAR(40) NULL");
  if (!in_array('pin_note', $cols, true)) $pdo->exec("ALTER TABLE projects ADD COLUMN pin_note TEXT NULL, ADD COLUMN pin_by INT UNSIGNED NULL, ADD COLUMN pin_at DATETIME NULL");
  $pdo->exec("CREATE TABLE IF NOT EXISTS crm_files (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, project_id VARCHAR(40) NOT NULL, fid VARCHAR(40) NOT NULL, name VARCHAR(200) NOT NULL, type VARCHAR(100) NOT NULL, size INT UNSIGNED NOT NULL, created_by INT UNSIGNED NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (project_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $fc = array_column($pdo->query('SHOW COLUMNS FROM crm_files')->fetchAll(), 'Field');
  if (!in_array('tag', $fc, true)) $pdo->exec("ALTER TABLE crm_files ADD COLUMN tag VARCHAR(24) NULL, ADD INDEX (project_id, tag)");
  if (!in_array('checks', $cols, true)) $pdo->exec("ALTER TABLE projects ADD COLUMN checks TEXT NULL");
  $pdo->exec("CREATE TABLE IF NOT EXISTS ld_notifs (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NOT NULL, by_id INT UNSIGNED NULL, project_id VARCHAR(40) NULL, title VARCHAR(200) NOT NULL, text TEXT NOT NULL, url VARCHAR(300) NOT NULL DEFAULT '', created_at DATETIME NOT NULL, read_at DATETIME NULL, INDEX (user_id, read_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $mc = $pdo->query("SHOW TABLES LIKE 'crm_mails'")->fetchColumn();
  if ($mc && !in_array('docs', array_column($pdo->query('SHOW COLUMNS FROM crm_mails')->fetchAll(), 'Field'), true)) $pdo->exec("ALTER TABLE crm_mails ADD COLUMN docs VARCHAR(500) NOT NULL DEFAULT '' AFTER files");
  $pdo->exec("CREATE TABLE IF NOT EXISTS sys_docs (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, fid VARCHAR(40) NOT NULL, name VARCHAR(200) NOT NULL, type VARCHAR(100) NOT NULL, size INT UNSIGNED NOT NULL, created_by INT UNSIGNED NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $pdo->exec("CREATE TABLE IF NOT EXISTS crm_mails (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, project_id VARCHAR(40) NOT NULL, to_addr VARCHAR(200) NOT NULL, subject VARCHAR(300) NOT NULL, body MEDIUMTEXT NOT NULL, files VARCHAR(500) NOT NULL DEFAULT '', docs VARCHAR(500) NOT NULL DEFAULT '', status VARCHAR(12) NOT NULL, error VARCHAR(500) NULL, created_by INT UNSIGNED NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (project_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  if (!in_array('stage_base', $cols, true)) $pdo->exec("ALTER TABLE projects ADD COLUMN stage_base VARCHAR(20) NULL");
  if (!in_array('kdnr', $cols, true)) $pdo->exec("ALTER TABLE projects ADD COLUMN kdnr VARCHAR(30) NULL, ADD COLUMN gewerk VARCHAR(12) NULL, ADD INDEX (kdnr)");
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

const CRM_FIELDS = "p.id, p.kdnr, p.gewerk, p.pin_note, p.pin_by, p.pin_at, p.owner_id, p.created_by, p.assigned_by, p.assigned_at, p.updated_at, p.stage, p.stage_at, p.stage_base, p.name,
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
    'id' => $r['id'], 'pin' => (string)($r['pin_note'] ?? ''), 'pinBy' => !empty($r['pin_by']) ? ($n[(int)$r['pin_by']] ?? '') : '', 'pinAt' => $r['pin_at'] ?? null, 'kdnr' => (string)($r['kdnr'] ?? ''), 'gewerk' => (string)($r['gewerk'] ?? ''), 'name' => $r['name'] ?: 'Ohne Namen', 'type' => crm_val($r['type']), 'status' => crm_val($r['status']) ?: 'offen',
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
  if (!can_see_project($u, ['owner_id' => $r['owner_id'], 'created_by' => $r['created_by']])) {
    /* Wer im Logbuch markiert wurde, darf den Kunden öffnen (sonst führt die Benachrichtigung ins Leere) */
    $m = db()->prepare('SELECT 1 FROM crm_events WHERE project_id = ? AND FIND_IN_SET(?, mentions) LIMIT 1'); $m->execute([$id, (string)$u['id']]);
    if (!$m->fetchColumn()) fail('Keine Berechtigung für diesen Kunden', 403);
  }
  return $r;
}

function crm_event_out(array $e): array {
  $n = user_names();
  $men = array_values(array_filter(array_map('intval', explode(',', (string)($e['mentions'] ?? '')))));
  return ['id' => (int)$e['id'], 'ref' => (string)($e['ref'] ?? ''), 'kind' => $e['kind'], 'text' => $e['text'], 'at' => $e['at'], 'user' => $e['user_id'] ? (int)$e['user_id'] : null, 'userName' => $e['user_id'] ? ($n[(int)$e['user_id']] ?? '') : 'System',
    'mentions' => array_map(fn($i) => ['id' => $i, 'name' => $n[$i] ?? ''], $men)];
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
  $people = array_map(fn($x) => ['id' => (int)$x['id'], 'name' => $x['name']], db()->query('SELECT id, name FROM users WHERE active = 1 ORDER BY name')->fetchAll());
  $c = crm_row_out($r);
  return ['people' => $people, 'check' => crm_checklist($id, (string)($c['stage'] ?? '')), 'customer' => $c, 'events' => array_map('crm_event_out', $ev->fetchAll()), 'tasks' => array_map('crm_task_out', $tk->fetchAll())];
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
  /* Monatsreihe (12 Monate): neue Angebote (angelegt mit Angebotssumme) und gewonnene Aufträge */
  $series = []; $m0 = (clone $now)->modify('first day of this month');
  for ($i = 11; $i >= 0; $i--) { $m = (clone $m0)->modify("-$i months")->format('Y-m'); $series[$m] = ['m' => $m, 'offers' => 0, 'offersSum' => 0, 'won' => 0, 'wonSum' => 0]; }
  foreach ($act as $c) {
    $cm = $c['created'] ? substr($c['created'], 0, 7) : null;
    if ($cm && isset($series[$cm]) && ($c['total'] ?: 0) > 0) { $series[$cm]['offers']++; $series[$cm]['offersSum'] += $c['total']; }
    if (($d = $wonDate($c)) && isset($series[substr($d, 0, 7)])) { $series[substr($d, 0, 7)]['won']++; $series[substr($d, 0, 7)]['wonSum'] += $c['total'] ?: 0; }
  }
  $year = $now->format('Y'); $prevYear = (string)((int)$year - 1); $wonYear = 0; $wonPrevSame = 0; $md = $now->format('m-d');
  foreach ($act as $c) { if (!($d = $wonDate($c))) continue; if (substr($d, 0, 4) === $year) $wonYear += $c['total'] ?: 0; if (substr($d, 0, 4) === $prevYear && substr($d, 5) <= $md) $wonPrevSame += $c['total'] ?: 0; }
  /* Aktivität im Team: Einträge der letzten 8 Wochen nach Wochentag und Tageszeit */
  $heat = array_fill(0, 6, array_fill(0, 6, 0));   // Mo–Sa × 7–9, 9–11, 11–13, 13–15, 15–17, 17–19
  $tz = new DateTimeZone('Europe/Berlin');
  $hq = $pdo->query("SELECT e.at, e.project_id FROM crm_events e JOIN projects p ON p.id = e.project_id AND p.deleted = 0 WHERE e.kind IN ('notiz','anruf','termin','email','protokoll') AND e.at > UTC_TIMESTAMP() - INTERVAL 56 DAY")->fetchAll();
  foreach ($hq as $e) { if (!isset($visible[$e['project_id']])) continue; $t = new DateTime($e['at'] . ' UTC'); $t->setTimezone($tz); $wd = (int)$t->format('N') - 1; $h = (int)$t->format('G'); if ($wd > 5 || $h < 7 || $h >= 19) continue; $heat[$wd][intdiv($h - 7, 2)]++; }
  $mq = $pdo->prepare("SELECT e.*, p.name AS pname FROM crm_events e JOIN projects p ON p.id = e.project_id AND p.deleted = 0 WHERE FIND_IN_SET(?, e.mentions) AND e.at > UTC_TIMESTAMP() - INTERVAL 14 DAY ORDER BY e.at DESC LIMIT 6"); $mq->execute([(string)$u['id']]);
  $forMe = array_map(fn($e) => crm_event_out($e) + ['project' => $e['project_id'], 'projectName' => $e['pname']], $mq->fetchAll());
  return ['all' => sees_all($u), 'month' => $month, 'vacReq' => $vacReq, 'forMe' => $forMe, 'series' => array_values($series), 'year' => $year, 'wonYear' => $wonYear, 'wonPrevSame' => $wonPrevSame, 'heat' => $heat,
    'kpi' => ['offers' => count($openOffers), 'offersSum' => array_sum(array_map(fn($c) => $c['total'] ?: 0, $openOffers)),
      'wonMonth' => count($wonMonth), 'wonMonthSum' => array_sum(array_map(fn($c) => $c['total'] ?: 0, $wonMonth)),
      'rate' => count($dec) ? round(100 * $nWon / count($dec)) : null, 'decided' => count($dec), 'overdue' => $overdue, 'dueToday' => $dueToday],
    'stages' => $stages, 'team' => $team, 'recent' => $recent];
}

/* Logbuch: Kollegen markieren – sie bekommen die Nachricht per E-Mail, der Eintrag bleibt beim Kunden */
function crm_mention(array $u, string $pid, int $eventId, array $ids, string $kind, string $text): array {
  $ids = array_values(array_unique(array_filter(array_map('intval', $ids), fn($i) => $i > 0 && $i !== (int)$u['id'])));
  if (!$ids) return [];
  $st = db()->prepare('SELECT id, name, email FROM users WHERE active = 1 AND id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')'); $st->execute($ids); $to = $st->fetchAll();
  if (!$to) return [];
  db()->prepare('UPDATE crm_events SET mentions = ? WHERE id = ?')->execute([implode(',', array_column($to, 'id')), $eventId]);
  $p = project_row($pid); $cust = $p ? $p['name'] : 'Kunde'; $sent = [];
  foreach ($to as $r) {
    notif_add((int)$r['id'], (int)$u['id'], $pid, $u['name'] . ' hat dich markiert · ' . $cust, $text, '#/kunde/' . rawurlencode($pid));
    try {
      [$t, $h] = mail_tpl('Hallo ' . explode(' ', $r['name'])[0] . ',', $u['name'] . ' hat dich bei ' . $cust . ' markiert' . ($kind !== 'notiz' ? ' (' . (EVENT_KINDS[$kind] ?? $kind) . ')' : '') . ":\n\n„" . $text . '“', 'Kunde öffnen', base_url() . '/#/kunde/' . rawurlencode($pid), 'Die Nachricht steht im Logbuch des Kunden.');
      send_mail($r['email'], $u['name'] . ' hat dich markiert: ' . $cust, $t, str_replace("\n", '<br>', $h)); $sent[] = $r['name'];
    } catch (Throwable $e) { error_log('LumbraDesk Markierung: ' . $e->getMessage()); }
  }
  return $sent;
}

/* ---------- Kundennummern je Gewerk (z. B. PV-1125, WP-1257) ---------- */
function kd_defaults(): array {
  return [['id' => 'pv', 'name' => 'Photovoltaik', 'fmt' => 'PV-{NNNN}', 'types' => ['pv', 'pvwp']], ['id' => 'wp', 'name' => 'Wärmepumpe', 'fmt' => 'WP-{NNNN}', 'types' => ['wp']]];
}
function kd_gewerke(): array { $g = ld_get('gewerke', null); return is_array($g) && $g ? $g : kd_defaults(); }
function kd_fmt(string $fmt, int $n): string {
  $s = strtr($fmt, ['{JJJJ}' => gmdate('Y'), '{JJ}' => gmdate('y'), '{MM}' => gmdate('m')]);
  return preg_replace_callback('/\{(N+)\}/', fn($m) => str_pad((string)$n, strlen($m[1]), '0', STR_PAD_LEFT), $s) ?? $s;
}
function kd_numtable(): void { static $done = false; if ($done) return; $done = true; db()->exec("CREATE TABLE IF NOT EXISTS ld_numbers (k VARCHAR(40) PRIMARY KEY, n INT UNSIGNED NOT NULL DEFAULT 0) ENGINE=InnoDB"); }
function kd_counter(string $gid): int { kd_numtable(); $st = db()->prepare('SELECT n FROM ld_numbers WHERE k = ?'); $st->execute(['kd-' . $gid]); $n = $st->fetchColumn(); return $n === false ? 0 : (int)$n; }
function kd_find(string $gid): ?array { foreach (kd_gewerke() as $g) if ($g['id'] === $gid) return $g; return null; }
function kd_for_type(string $type): ?array { foreach (kd_gewerke() as $g) if (in_array($type, $g['types'] ?? [], true)) return $g; return null; }
function kd_out(): array { return array_map(fn($g) => $g + ['next' => kd_counter($g['id']) + 1, 'preview' => kd_fmt($g['fmt'], kd_counter($g['id']) + 1)], kd_gewerke()); }
/* Nächste Nummer ziehen (gesperrt, damit keine doppelt vergeben wird); bereits benutzte Nummern werden übersprungen */
function kd_take(array $g): string {
  crm_tables(); kd_numtable(); $pdo = db(); $k = 'kd-' . $g['id'];
  $inTx = $pdo->inTransaction(); if (!$inTx) $pdo->beginTransaction();
  $pdo->prepare('INSERT INTO ld_numbers (k, n) VALUES (?, 0) ON DUPLICATE KEY UPDATE n = n')->execute([$k]);
  $st = $pdo->prepare('SELECT n FROM ld_numbers WHERE k = ? FOR UPDATE'); $st->execute([$k]); $n = (int)$st->fetchColumn();
  $chk = $pdo->prepare('SELECT COUNT(*) FROM projects WHERE kdnr = ?');
  do { $n++; $nr = kd_fmt($g['fmt'], $n); $chk->execute([$nr]); } while ((int)$chk->fetchColumn() > 0);
  $pdo->prepare('UPDATE ld_numbers SET n = ? WHERE k = ?')->execute([$n, $k]); if (!$inTx) $pdo->commit();
  return $nr;
}
function kd_assign(string $pid, string $gid): string {
  crm_tables(); $g = kd_find($gid); if (!$g) fail('Unbekanntes Gewerk', 400);
  $st = db()->prepare('SELECT kdnr FROM projects WHERE id = ?'); $st->execute([$pid]); $cur = $st->fetchColumn();
  if ($cur) return (string)$cur;
  $nr = kd_take($g); db()->prepare('UPDATE projects SET kdnr = ?, gewerk = ? WHERE id = ? AND kdnr IS NULL')->execute([$nr, $g['id'], $pid]);
  return $nr;
}
/* Neuer Kunde aus der Wirtschaftlichkeit: Nummer nach Art (PV/WP) – nur wenn ein Gewerk dafür eingestellt ist */
function kd_auto(string $pid, string $type): void { try { $g = kd_for_type($type); if ($g) kd_assign($pid, $g['id']); } catch (Throwable $e) {} }
function kd_save(array $u, array $l): array {
  crm_tables(); kd_numtable(); $o = []; $ids = [];
  foreach (array_slice($l, 0, 20) as $x) {
    if (!is_array($x) || trim((string)($x['name'] ?? '')) === '') continue;
    $id = preg_match('/^[a-z0-9]{1,12}$/', (string)($x['id'] ?? '')) ? $x['id'] : 'g' . bin2hex(random_bytes(3));
    if (isset($ids[$id])) $id = 'g' . bin2hex(random_bytes(3)); $ids[$id] = 1;
    $fmt = mb_substr(trim((string)($x['fmt'] ?? '')), 0, 40);
    if (!preg_match('/\{N+\}/', $fmt)) fail('Das Format für „' . $x['name'] . '“ braucht einen Zähler, z. B. PV-{NNNN}.', 400);
    if (!preg_match('/^[\w\-\/.{}# ]+$/u', $fmt)) fail('Im Format sind Buchstaben, Ziffern, - / . # und die Platzhalter erlaubt.', 400);
    $types = array_values(array_intersect((array)($x['types'] ?? []), ['pv', 'wp', 'pvwp']));
    $o[] = ['id' => $id, 'name' => mb_substr(trim((string)$x['name']), 0, 40), 'fmt' => $fmt, 'types' => $types];
    if (isset($x['next']) && (int)$x['next'] > 0 && (int)$x['next'] !== kd_counter($id) + 1) {
      $next = (int)$x['next']; $st = db()->prepare('SELECT COUNT(*) FROM projects WHERE kdnr = ?'); $st->execute([kd_fmt($fmt, $next)]);
      if ((int)$st->fetchColumn()) fail('Die Nummer ' . kd_fmt($fmt, $next) . ' ist schon vergeben – bitte eine höhere Startnummer wählen.', 400);
      db()->prepare('INSERT INTO ld_numbers (k, n) VALUES (?, ?) ON DUPLICATE KEY UPDATE n = VALUES(n)')->execute(['kd-' . $id, $next - 1]);
    }
  }
  if (!$o) fail('Mindestens ein Gewerk anlegen.', 400);
  foreach ($o as $g) foreach ($g['types'] as $t) foreach ($o as $h) if ($h !== $g && in_array($t, $h['types'], true)) fail('Jede Art aus der Wirtschaftlichkeit (PV, WP, PV + WP) darf nur einem Gewerk zugeordnet sein.', 400);
  ld_set('gewerke', $o, (int)$u['id']); return kd_out();
}
/* Alle Kunden ohne Nummer nach Art nummerieren (älteste zuerst) */
function kd_fill(): int {
  crm_tables(); $n = 0;
  $rows = db()->query("SELECT id, JSON_UNQUOTE(JSON_EXTRACT(data, '$.type')) t, JSON_UNQUOTE(JSON_EXTRACT(data, '$.created')) c FROM projects WHERE deleted = 0 AND kdnr IS NULL")->fetchAll();
  usort($rows, fn($a, $b) => (float)$a['c'] <=> (float)$b['c']);
  foreach ($rows as $r) { $g = kd_for_type((string)$r['t']); if ($g) { kd_assign($r['id'], $g['id']); $n++; } }
  return $n;
}
/* Kunde direkt in lumbra.desk anlegen – erscheint nach dem Abgleich auch in der Wirtschaftlichkeit */
function crm_new(array $u, array $b): array {
  crm_tables(); $g = kd_find((string)($b['gewerk'] ?? '')); if (!$g) fail('Bitte ein Gewerk wählen.', 400);
  $name = trim((string)($b['name'] ?? '')); if ($name === '') fail('Bitte einen Namen eingeben.', 400);
  $sal = isset($b['salutation']) && in_array($b['salutation'], ['Familie', 'Herr', 'Frau', 'Firma', ''], true) ? (string)$b['salutation'] : 'Familie';
  $type = in_array($b['type'] ?? '', ['pv', 'wp', 'pvwp'], true) ? $b['type'] : (($g['types'][0] ?? '') ?: 'pv');
  $owner = (int)($b['owner'] ?? 0); if (!$owner || !sees_all($u) || !crm_valid_user($owner)) $owner = (int)$u['id'];
  $cl = fn($k, $n) => mb_substr(trim((string)($b[$k] ?? '')), 0, $n);
  $id = 'p' . base_convert((string)(int)(microtime(true) * 1000), 10, 36) . bin2hex(random_bytes(3));
  $now = (int)(microtime(true) * 1000);
  $data = ['id' => $id, 'type' => $type, 'created' => $now, 'updated' => $now, 'step' => 1, 'status' => 'offen',
    'customer' => ['salutation' => $sal, 'name' => $cl('name', 160), 'street' => $cl('street', 160), 'zip' => $cl('zip', 10), 'city' => $cl('city', 80), 'email' => $cl('email', 160), 'phone' => $cl('phone', 60)]];
  $full = trim($sal . ' ' . $data['customer']['name']); kd_numtable(); $pdo = db(); $pdo->beginTransaction();   // Tabellen vorher anlegen: DDL beendet sonst die Transaktion
  try {
    $nr = kd_take($g);
    $pdo->prepare('INSERT INTO projects (id, owner_id, created_by, assigned_by, assigned_at, name, data, version, updated_at, updated_by, kdnr, gewerk) VALUES (?, ?, ?, ?, ' . ($owner !== (int)$u['id'] ? 'UTC_TIMESTAMP()' : 'NULL') . ', ?, ?, 1, UTC_TIMESTAMP(), ?, ?, ?)')
      ->execute([$id, $owner, $u['id'], $owner !== (int)$u['id'] ? $u['id'] : null, $full, json_encode($data, JSON_UNESCAPED_UNICODE), $u['id'], $nr, $g['id']]);
    $pdo->commit();
  } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
  crm_add_event($id, (int)$u['id'], 'notiz', "Kunde $nr angelegt ({$g['name']}).");
  audit((int)$u['id'], 'kunde_angelegt', "$nr $full");
  return ['id' => $id, 'kdnr' => $nr];
}

/* ---------- Wichtige Notiz (immer oben beim Kunden) ---------- */
function crm_pin(array $u, string $pid, string $text): void {
  crm_project($u, $pid); $t = trim(mb_substr($text, 0, 2000));
  db()->prepare('UPDATE projects SET pin_note = ?, pin_by = ?, pin_at = UTC_TIMESTAMP() WHERE id = ?')->execute([$t !== '' ? $t : null, $u['id'], $pid]);
}
/* ---------- Dateien & Fotos beim Kunden ---------- */
const CRM_FILE_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
function crm_files(string $pid): array {
  $n = user_names(); $st = db()->prepare('SELECT * FROM crm_files WHERE project_id = ? ORDER BY id DESC'); $st->execute([$pid]);
  return array_map(fn($r) => ['id' => (int)$r['id'], 'name' => $r['name'], 'type' => $r['type'], 'size' => (int)$r['size'], 'by' => $n[(int)$r['created_by']] ?? '', 'at' => $r['created_at'], 'tag' => $r['tag'] ?? null], $st->fetchAll());
}
/* Datei beim Kunden ablegen. Mit Kennung (z. B. „wirt“, „zs“, „angebot“) ersetzt sie die vorige Datei derselben Art – so hängt in der Checkliste immer die aktuelle PDF. */
function crm_file_store(string $pid, int $uid, string $name, string $type, string $bin, ?string $tag = null): int {
  crm_tables();
  if ($tag !== null && !preg_match('/^[a-z0-9_-]{1,24}$/', $tag)) $tag = null;
  if ($tag !== null) {
    $old = db()->prepare('SELECT id, fid FROM crm_files WHERE project_id = ? AND tag = ?'); $old->execute([$pid, $tag]);
    foreach ($old->fetchAll() as $o) { db()->prepare('DELETE FROM crm_files WHERE id = ?')->execute([$o['id']]); $f = files_dir() . '/' . $o['fid']; @unlink($f . '.bin'); @unlink($f . '.json'); }
  }
  $name = mb_substr(preg_replace('/[\\\\\/:*?"<>|\r\n]+/', '_', trim($name)), 0, 180) ?: 'Datei';
  $fid = 'cf-' . bin2hex(random_bytes(10)); $f = files_dir() . '/' . $fid;
  file_put_contents($f . '.bin', $bin); file_put_contents($f . '.json', json_encode(['type' => $type, 'name' => $name, 'size' => strlen($bin)]));
  db()->prepare('INSERT INTO crm_files (project_id, fid, name, type, size, created_by, tag) VALUES (?, ?, ?, ?, ?, ?, ?)')->execute([$pid, $fid, $name, $type, strlen($bin), $uid, $tag]);
  return (int)db()->lastInsertId();
}
function crm_file_up(array $u, array $b): array {
  $pid = (string)($b['project'] ?? ''); crm_project($u, $pid);
  $type = (string)($b['type'] ?? ''); if (!in_array($type, CRM_FILE_TYPES, true)) fail('Dieser Dateityp wird nicht unterstützt (Fotos, PDF, Word, Excel).', 400);
  $bin = base64_decode((string)($b['data'] ?? ''), true); if ($bin === false || $bin === '') fail('Datei leer oder beschädigt.', 400);
  if (strlen($bin) > 15 * 1024 * 1024) fail('Die Datei ist größer als 15 MB.', 400);
  $tag = isset($b['tag']) && preg_match('/^[a-z0-9_-]{1,24}$/', (string)$b['tag']) ? (string)$b['tag'] : null;
  crm_file_store($pid, (int)$u['id'], (string)($b['name'] ?? 'Datei'), $type, $bin, $tag);
  if ($tag !== null && isset(CHECK_TAG_L[$tag])) crm_add_event($pid, (int)$u['id'], 'check', CHECK_TAG_L[$tag] . ' als PDF beim Kunden abgelegt.');
  return crm_files($pid);
}
function crm_file_row(array $u, int $id): array {
  $st = db()->prepare('SELECT * FROM crm_files WHERE id = ?'); $st->execute([$id]); $r = $st->fetch(); if (!$r) fail('Datei nicht gefunden.', 404);
  crm_project($u, $r['project_id']); return $r;
}
function crm_file_del(array $u, int $id): array {
  $r = crm_file_row($u, $id); db()->prepare('DELETE FROM crm_files WHERE id = ?')->execute([$id]);
  $f = files_dir() . '/' . $r['fid']; @unlink($f . '.bin'); @unlink($f . '.json'); return crm_files($r['project_id']);
}
function crm_file_send(array $u, int $id, bool $dl): void {
  $r = crm_file_row($u, $id); $f = files_dir() . '/' . $r['fid'] . '.bin'; if (!is_file($f)) fail('Datei nicht gefunden.', 404);
  header('Content-Type: ' . $r['type']); header('Content-Length: ' . filesize($f)); header('Cache-Control: private, max-age=86400');
  header('Content-Disposition: ' . ($dl ? 'attachment' : 'inline') . "; filename*=UTF-8''" . rawurlencode($r['name'])); readfile($f); exit;
}
/* ---------- E-Mail an den Kunden (wird im Logbuch gespeichert und ist dort lesbar) ---------- */
function crm_mail_send(array $u, array $b): array {
  $pid = (string)($b['project'] ?? ''); $p = crm_project($u, $pid);
  $to = trim((string)($b['to'] ?? '')); if (!filter_var($to, FILTER_VALIDATE_EMAIL)) fail('Bitte eine gültige E-Mail-Adresse eingeben.', 400);
  $subject = trim(mb_substr((string)($b['subject'] ?? ''), 0, 300)); if ($subject === '') fail('Bitte einen Betreff eingeben.', 400);
  $body = mb_substr((string)($b['body'] ?? ''), 0, 50000); if (trim($body) === '') fail('Bitte einen Text eingeben.', 400);
  $att = []; $ids = []; $dids = []; $tot = 0;
  foreach (array_slice((array)($b['files'] ?? []), 0, 10) as $fidN) { $r = crm_file_row($u, (int)$fidN); if ($r['project_id'] !== $pid) continue; $bin = (string)@file_get_contents(files_dir() . '/' . $r['fid'] . '.bin'); $tot += strlen($bin);
    if ($tot > 20 * 1024 * 1024) fail('Die Anhänge sind zusammen größer als 20 MB.', 400); $att[] = ['name' => $r['name'], 'type' => $r['type'], 'data' => $bin]; $ids[] = (int)$r['id']; }
  foreach (array_slice((array)($b['docs'] ?? []), 0, 10) as $dN) { $st = db()->prepare('SELECT * FROM sys_docs WHERE id = ?'); $st->execute([(int)$dN]); $r = $st->fetch(); if (!$r) continue;
    $bin = (string)@file_get_contents(files_dir() . '/' . $r['fid'] . '.bin'); $tot += strlen($bin); if ($tot > 20 * 1024 * 1024) fail('Die Anhänge sind zusammen größer als 20 MB.', 400);
    $att[] = ['name' => $r['name'], 'type' => $r['type'], 'data' => $bin]; $dids[] = (int)$r['id']; }
  $html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#14181f">' . nl2br(htmlspecialchars($body, ENT_QUOTES, 'UTF-8')) . '</div>';
  $opt = ['att' => $att]; if (!empty($b['copy'])) $opt['bcc'] = [$u['email']];
  $status = 'gesendet'; $err = null;
  try { send_mail_as($u, $to, $subject, $body, $html, $opt); } catch (Throwable $e) { $status = 'fehler'; $err = mb_substr($e->getMessage(), 0, 500); }
  db()->prepare('INSERT INTO crm_mails (project_id, to_addr, subject, body, files, docs, status, error, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')->execute([$pid, $to, $subject, $body, implode(',', $ids), implode(',', $dids), $status, $err, $u['id']]);
  $mid = (int)db()->lastInsertId();
  if ($status === 'gesendet') {
    db()->prepare('INSERT INTO crm_events (project_id, user_id, kind, text, at, ref) VALUES (?, ?, ?, ?, UTC_TIMESTAMP(), ?)')->execute([$pid, $u['id'], 'email', "E-Mail an $to: $subject" . (($na = count($ids) + count($dids)) ? ' (' . $na . ($na > 1 ? ' Anhänge' : ' Anhang') . ')' : ''), 'mail:' . $mid]);
    audit((int)$u['id'], 'kunden_mail', $to);
  } else fail('E-Mail nicht versendet: ' . $err, 502);
  return ['id' => $mid];
}
function crm_mail_get(array $u, int $id): array {
  $st = db()->prepare('SELECT * FROM crm_mails WHERE id = ?'); $st->execute([$id]); $r = $st->fetch(); if (!$r) fail('E-Mail nicht gefunden.', 404);
  crm_project($u, $r['project_id']); $n = user_names(); $files = [];
  if ($r['files'] !== '') { $q = db()->prepare('SELECT id, name, type FROM crm_files WHERE id = ?'); foreach (explode(',', $r['files']) as $fi) { $q->execute([(int)$fi]); if ($x = $q->fetch()) $files[] = ['id' => (int)$x['id'], 'name' => $x['name'], 'type' => $x['type']]; } }
  $docs = []; if (($r['docs'] ?? '') !== '') { $q = db()->prepare('SELECT id, name, type FROM sys_docs WHERE id = ?'); foreach (explode(',', $r['docs']) as $di) { $q->execute([(int)$di]); if ($x = $q->fetch()) $docs[] = ['id' => (int)$x['id'], 'name' => $x['name'], 'type' => $x['type']]; } }
  return ['docs' => $docs, 'id' => (int)$r['id'], 'to' => $r['to_addr'], 'subject' => $r['subject'], 'body' => $r['body'], 'files' => $files, 'by' => $n[(int)$r['created_by']] ?? '', 'at' => $r['created_at'], 'status' => $r['status']];
}

/* ---------- E-Mail-Vorlagen und Info-Dokumente (im System hochgeladen, an jede Mail anhängbar) ---------- */
function mail_tpls(): array {
  $l = ld_get('mail_tpls', null); if (is_array($l)) return $l;
  return [['id' => 't1', 'name' => 'Angebot zusenden', 'subject' => '{Kundennummer} – Ihr Angebot von Frühauf', 'body' => "{Anrede}\n\nvielen Dank für das nette Gespräch. Anbei erhalten Sie wie besprochen Ihr Angebot.\nBei Fragen bin ich jederzeit für Sie da.\n\n{Signatur}", 'docs' => []],
    ['id' => 't2', 'name' => 'Terminbestätigung', 'subject' => '{Kundennummer} – Terminbestätigung', 'body' => "{Anrede}\n\nhiermit bestätige ich unseren Termin am ___ um ___ Uhr in {Ort}.\n\n{Signatur}", 'docs' => []],
    ['id' => 't3', 'name' => 'Unterlagen anfordern', 'subject' => '{Kundennummer} – Unterlagen für Ihr Projekt', 'body' => "{Anrede}\n\nfür die weitere Planung benötigen wir noch folgende Unterlagen:\n- Foto vom Zählerschrank (Tür offen)\n- letzte Stromrechnung\n- Grundriss bzw. Bauzeichnung\n\n{Signatur}", 'docs' => []]];
}
function mail_tpls_save(array $u, array $l): array {
  $o = []; $ok = array_map('intval', array_column(db()->query('SELECT id FROM sys_docs')->fetchAll(), 'id'));
  foreach (array_slice($l, 0, 50) as $x) { if (!is_array($x) || trim((string)($x['name'] ?? '')) === '') continue;
    $o[] = ['id' => preg_match('/^[\w-]{1,16}$/', (string)($x['id'] ?? '')) ? $x['id'] : 't' . bin2hex(random_bytes(4)), 'name' => mb_substr(trim((string)$x['name']), 0, 80), 'subject' => mb_substr((string)($x['subject'] ?? ''), 0, 300), 'body' => mb_substr((string)($x['body'] ?? ''), 0, 20000),
      'docs' => array_values(array_intersect(array_map('intval', (array)($x['docs'] ?? [])), $ok))]; }
  ld_set('mail_tpls', $o, (int)$u['id']); return $o;
}
function sys_docs(): array {
  crm_tables(); $n = user_names();
  return array_map(fn($r) => ['id' => (int)$r['id'], 'name' => $r['name'], 'type' => $r['type'], 'size' => (int)$r['size'], 'by' => $n[(int)$r['created_by']] ?? '', 'at' => $r['created_at']], db()->query('SELECT * FROM sys_docs ORDER BY name')->fetchAll());
}
function sys_doc_up(array $u, array $b): array {
  crm_tables(); $type = (string)($b['type'] ?? ''); if (!in_array($type, CRM_FILE_TYPES, true)) fail('Dieser Dateityp wird nicht unterstützt (PDF, Fotos, Word, Excel).', 400);
  $bin = base64_decode((string)($b['data'] ?? ''), true); if ($bin === false || $bin === '') fail('Datei leer oder beschädigt.', 400); if (strlen($bin) > 15 * 1024 * 1024) fail('Die Datei ist größer als 15 MB.', 400);
  $name = mb_substr(preg_replace('/[\\\\\/:*?"<>|\r\n]+/', '_', trim((string)($b['name'] ?? 'Dokument'))), 0, 180) ?: 'Dokument';
  $fid = 'sd-' . bin2hex(random_bytes(10)); $f = files_dir() . '/' . $fid; file_put_contents($f . '.bin', $bin); file_put_contents($f . '.json', json_encode(['type' => $type, 'name' => $name, 'size' => strlen($bin)]));
  db()->prepare('INSERT INTO sys_docs (fid, name, type, size, created_by) VALUES (?, ?, ?, ?, ?)')->execute([$fid, $name, $type, strlen($bin), $u['id']]); return sys_docs();
}
function sys_doc_del(int $id): array {
  crm_tables(); $st = db()->prepare('SELECT fid FROM sys_docs WHERE id = ?'); $st->execute([$id]); $fid = $st->fetchColumn();
  if ($fid) { db()->prepare('DELETE FROM sys_docs WHERE id = ?')->execute([$id]); @unlink(files_dir() . '/' . $fid . '.bin'); @unlink(files_dir() . '/' . $fid . '.json'); }
  return sys_docs();
}
function sys_doc_send(int $id): void {
  crm_tables(); $st = db()->prepare('SELECT * FROM sys_docs WHERE id = ?'); $st->execute([$id]); $r = $st->fetch(); if (!$r) fail('Dokument nicht gefunden.', 404);
  $f = files_dir() . '/' . $r['fid'] . '.bin'; if (!is_file($f)) fail('Dokument nicht gefunden.', 404);
  header('Content-Type: ' . $r['type']); header('Content-Length: ' . filesize($f)); header("Content-Disposition: inline; filename*=UTF-8''" . rawurlencode($r['name'])); readfile($f); exit;
}

/* ---------- Signatur: eigene je Benutzer, sonst Firmen-Signatur ---------- */
function mail_sig_company(): string { $s = ld_get('mail_sig', null); return is_string($s) ? $s : "Mit freundlichen Grüßen\n\n{Name}\nFrühauf Solar\n{E-Mail}"; }
function mail_sig_for(array $u): array {
  $own = ld_get('usig_' . (int)$u['id'], null); $t = is_string($own) && trim($own) !== '' ? $own : mail_sig_company();
  return ['own' => is_string($own) ? $own : '', 'company' => mail_sig_company(), 'text' => strtr($t, ['{Name}' => $u['name'], '{E-Mail}' => $u['email']])];
}
function mail_sig_save(array $u, string $text, bool $company): void { $t = mb_substr(str_replace("\r", '', $text), 0, 2000); if ($company) ld_set('mail_sig', $t, (int)$u['id']); else ld_set('usig_' . (int)$u['id'], $t, (int)$u['id']); }

/* ---------- Checkliste beim Kunden ----------
   Je nach Art (PV, Wärmepumpe, beides) die Schritte bis zur Montage. Vieles erkennt das System selbst
   (Modulplan, Auslegung, Zählerschrank-Check, Angebot, Auftrag, Abnahme); alles lässt sich auch von Hand abhaken.
   Ist eine PDF dazu abgelegt (Kennung in crm_files.tag), hängt sie direkt am Punkt. */
const CHECK_TAG_L = ['wirt' => 'Wirtschaftlichkeitsberechnung', 'zs' => 'Zählerschrank-Prüfbericht', 'angebot' => 'Angebot'];
const CHECK_ITEMS = [
  'roof' => ['Dachbelegung geprüft', 'pv'], 'wp' => ['Wärmepumpe ausgelegt', 'wp'], 'zs' => ['Zählerschrank geprüft', ''],
  'wirt' => ['Wirtschaftlichkeit berechnet', ''], 'angebot' => ['Angebot erstellt', ''], 'auftrag' => ['Auftrag unterschrieben', ''],
  'netz' => ['Netzanmeldung gestellt', 'pv'], 'foerder' => ['Förderantrag gestellt (BEG)', 'wp'], 'abnahme' => ['Abnahme / Inbetriebnahme', ''],
];
function crm_checklist(string $pid, string $stage): array {
  crm_tables(); $p = project_row($pid); if (!$p) return [];
  $d = json_decode((string)$p['data'], true) ?: []; $type = (string)($d['type'] ?? '');
  $hasPv = $type !== 'wp'; $hasWp = in_array($type, ['wp', 'pvwp', ''], true);
  $man = json_decode((string)($p['checks'] ?? ''), true) ?: []; $n = user_names(); $pdo = db();
  $files = []; $fq = $pdo->prepare('SELECT id, name, tag, created_at FROM crm_files WHERE project_id = ? AND tag IS NOT NULL'); $fq->execute([$pid]);
  foreach ($fq->fetchAll() as $f) $files[$f['tag']] = ['id' => (int)$f['id'], 'name' => $f['name'], 'at' => $f['created_at']];
  $num = fn($v, $dec = 1) => number_format((float)$v, $dec, ',', '.');
  $auto = [];
  /* Modulplan */
  $mods = 0; foreach ((array)($d['roof']['faces'] ?? []) as $f) $mods += count((array)($f['mods'] ?? []));
  if ($mods) $auto['roof'] = ['detail' => $mods . ' Module im Modulplan' . (!empty($d['pv']['kwp']) ? ' · ' . $num($d['pv']['kwp'], 2) . ' kWp' : '')];
  /* Wärmepumpe: Schnellauslegung oder technische Unterlagen */
  $q = $d['quick'] ?? null; $tech = count(array_filter((array)($d['docs'] ?? []), fn($x) => ($x['role'] ?? '') === 'tech'));
  if (is_array($q) && ($q['v'] ?? 0) == 2) $auto['wp'] = ['detail' => 'Schnellauslegung' . (!empty($d['hp']['kw']) ? ': ' . $num($d['hp']['kw']) . ' kW' : '') . (!empty($d['hp']['jaz']) ? ', JAZ ' . $num($d['hp']['jaz'], 2) : '')];
  elseif ($tech) $auto['wp'] = ['detail' => $tech . ' technische Unterlage(n) in der Wirtschaftlichkeit'];
  /* Zählerschrank-Check */
  if ($pdo->query("SHOW TABLES LIKE 'zs_checks'")->fetchColumn()) {
    $z = $pdo->prepare('SELECT id, result, created_at, created_by FROM zs_checks WHERE project_id = ? ORDER BY id DESC LIMIT 1'); $z->execute([$pid]);
    if ($r = $z->fetch()) $auto['zs'] = ['detail' => ['ok' => 'Passt', 'fix' => 'Passt mit Nachrüstung', 'neu' => 'Neuer Zählerschrank nötig', 'pruefen' => 'Vor Ort prüfen'][$r['result']] ?? '', 'ref' => (string)$r['id'], 'at' => $r['created_at'], 'by' => $n[(int)$r['created_by']] ?? ''];
  }
  /* Wirtschaftlichkeit: PDF erstellt oder Angebot gesendet */
  if (isset($files['wirt'])) $auto['wirt'] = ['detail' => 'PDF erstellt', 'at' => $files['wirt']['at']];
  elseif (in_array($d['status'] ?? '', ['gesendet', 'unterschrieben'], true)) $auto['wirt'] = ['detail' => 'An den Kunden gesendet'];
  /* Angebot (Angebote in lumbra.desk oder Angebotsnummer aus der Wirtschaftlichkeit) */
  if ($pdo->query("SHOW TABLES LIKE 'offers'")->fetchColumn()) {
    $o = $pdo->prepare('SELECT id, nr, gross, status FROM offers WHERE project_id = ? AND deleted = 0 ORDER BY updated_at DESC LIMIT 1'); try { $o->execute([$pid]); $r = $o->fetch(); } catch (Throwable $e) { $r = null; }
    if ($r) $auto['angebot'] = ['detail' => $r['nr'] . ' · ' . number_format((float)$r['gross'], 2, ',', '.') . ' €', 'ref' => (string)$r['id']];
  }
  if (!isset($auto['angebot']) && !empty($d['offer']['number'])) $auto['angebot'] = ['detail' => 'Angebot ' . $d['offer']['number']];
  /* Auftrag */
  if (in_array($stage, ['auftrag', 'montage', 'fertig'], true) || ($d['status'] ?? '') === 'unterschrieben') $auto['auftrag'] = ['detail' => ($d['status'] ?? '') === 'unterschrieben' && !empty($d['statusDate']) ? 'Unterschrieben am ' . date('d.m.Y', strtotime((string)$d['statusDate'])) : 'Stufe „' . (STAGES[$stage] ?? 'Auftrag') . '“'];
  /* Abnahme-Protokoll */
  if ($pdo->query("SHOW TABLES LIKE 'abnahme_prots'")->fetchColumn()) {
    $a = $pdo->prepare('SELECT id, nr, datum, monteur FROM abnahme_prots WHERE project_id = ? ORDER BY datum DESC LIMIT 1'); try { $a->execute([$pid]); $r = $a->fetch(); } catch (Throwable $e) { $r = null; }
    if ($r) $auto['abnahme'] = ['detail' => trim($r['nr'] . ($r['datum'] ? ' · ' . date('d.m.Y', strtotime($r['datum'])) : '') . ($r['monteur'] ? ' · ' . $r['monteur'] : ''), ' ·'), 'ref' => (string)$r['id']];
  }
  $out = [];
  foreach (CHECK_ITEMS as $k => [$label, $for]) {
    if (($for === 'pv' && !$hasPv) || ($for === 'wp' && !$hasWp)) continue;
    $m = $man[$k] ?? null; $a = $auto[$k] ?? null;
    $file = $files[$k] ?? $files['chk-' . $k] ?? (in_array($k, ['roof', 'wp'], true) && $a ? ($files['wirt'] ?? null) : null);
    $out[] = ['key' => $k, 'label' => $label, 'done' => (bool)($a || $m), 'auto' => (bool)$a, 'manual' => (bool)$m,
      'detail' => $a['detail'] ?? ($m ? 'Abgehakt von ' . ($n[(int)($m['by'] ?? 0)] ?? '–') : ''), 'at' => $a['at'] ?? ($m['at'] ?? null), 'ref' => $a['ref'] ?? null, 'file' => $file];
  }
  return $out;
}
function crm_check_set(array $u, string $pid, string $key, bool $done): void {
  if (!isset(CHECK_ITEMS[$key])) fail('Unbekannter Punkt.', 400);
  $p = project_row($pid); $man = json_decode((string)($p['checks'] ?? ''), true) ?: [];
  if ($done) $man[$key] = ['by' => (int)$u['id'], 'at' => gmdate('Y-m-d H:i:s')]; else unset($man[$key]);
  db()->prepare('UPDATE projects SET checks = ? WHERE id = ?')->execute([json_encode($man), $pid]);
  crm_add_event($pid, (int)$u['id'], 'check', CHECK_ITEMS[$key][0] . ($done ? ' – abgehakt.' : ' – wieder offen.'));
}

/* ---------- Benachrichtigungen in der App (Glocke) ---------- */
function notif_add(int $to, ?int $by, ?string $pid, string $title, string $text, string $url): void {
  crm_tables();
  db()->prepare('INSERT INTO ld_notifs (user_id, by_id, project_id, title, text, url, created_at) VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())')
    ->execute([$to, $by, $pid, mb_substr($title, 0, 200), mb_substr($text, 0, 2000), mb_substr($url, 0, 300)]);
}
function notif_list(array $u): array {
  crm_tables(); $n = user_names(); $uid = (int)$u['id'];
  $st = db()->prepare('SELECT * FROM ld_notifs WHERE user_id = ? ORDER BY id DESC LIMIT 40'); $st->execute([$uid]);
  $c = db()->prepare('SELECT COUNT(*) FROM ld_notifs WHERE user_id = ? AND read_at IS NULL'); $c->execute([$uid]);
  return ['unread' => (int)$c->fetchColumn(), 'list' => array_map(fn($r) => ['id' => (int)$r['id'], 'title' => $r['title'], 'text' => $r['text'], 'url' => $r['url'], 'by' => $n[(int)$r['by_id']] ?? '', 'at' => $r['created_at'], 'read' => $r['read_at'] !== null], $st->fetchAll())];
}
function notif_read(array $u, int $id): void {
  crm_tables();
  if ($id > 0) db()->prepare('UPDATE ld_notifs SET read_at = UTC_TIMESTAMP() WHERE id = ? AND user_id = ? AND read_at IS NULL')->execute([$id, $u['id']]);
  else db()->prepare('UPDATE ld_notifs SET read_at = UTC_TIMESTAMP() WHERE user_id = ? AND read_at IS NULL')->execute([$u['id']]);
}
function notif_unread(int $uid): int {
  try { $c = db()->prepare('SELECT COUNT(*) FROM ld_notifs WHERE user_id = ? AND read_at IS NULL'); $c->execute([$uid]); return (int)$c->fetchColumn(); } catch (Throwable $e) { return 0; }
}
