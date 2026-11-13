<?php
/* LumbraDesk – Belege: Nummernkreise, Textbausteine, Rechnungen (Abschlag/Schluss/Storno), Mahnwesen, E-Rechnung (XRechnung CII)
   Rechnungen werden als Entwurf angelegt und erst beim „Festschreiben“ nummeriert (lückenlos). Festgeschriebene
   Rechnungen sind unveränderlich; Korrektur nur über Storno (eigene Nummer). */
declare(strict_types=1);
require_once __DIR__ . '/offers-lib.php';

const RE_KIND = ['rechnung' => 'Rechnung', 'abschlag' => 'Abschlagsrechnung', 'schluss' => 'Schlussrechnung', 'storno' => 'Stornorechnung'];
const RE_STATUS = ['entwurf' => 'Entwurf', 'offen' => 'Offen', 'bezahlt' => 'Bezahlt', 'storniert' => 'Storniert'];
const TX_KINDS = ['intro' => 'Angebot: Einleitung', 'outro' => 'Angebot: Schlusstext', 'pay' => 'Angebot: Zahlungsbedingungen', 're_intro' => 'Rechnung: Einleitung', 're_outro' => 'Rechnung: Schlusstext', 'mahn1' => 'Zahlungserinnerung', 'mahn2' => '1. Mahnung', 'mahn3' => '2. Mahnung'];

/* ---------- Nummernkreise ---------- */
function num_cfg(): array {
  $c = ld_get('nummern', []) ?: [];
  return ['an' => ($c['an'] ?? []) + ['fmt' => 'AN-{JJJJ}-{NNNN}', 'yearly' => true], 're' => ($c['re'] ?? []) + ['fmt' => 'RE-{JJJJ}-{NNNN}', 'yearly' => true]];
}
function num_key(string $t, array $c): string { return $t . ($c['yearly'] ? '-' . gmdate('Y') : ''); }
function num_fmt(string $fmt, int $n): string {
  $s = strtr($fmt, ['{JJJJ}' => gmdate('Y'), '{JJ}' => gmdate('y'), '{MM}' => gmdate('m')]);
  return preg_replace_callback('/\{(N+)\}/', fn($m) => str_pad((string)$n, strlen($m[1]), '0', STR_PAD_LEFT), $s) ?? $s;
}
function num_counter(string $key): int {
  of_tables(); $st = db()->prepare('SELECT n FROM ld_numbers WHERE k = ?'); $st->execute([$key]); $n = $st->fetchColumn();
  if ($n === false && preg_match('/^an-(\d{4})$/', $key, $m)) { $st->execute(['AN-' . $m[1]]); $n = $st->fetchColumn(); }   // alter Zähler (bis 3.x)
  return $n === false ? 0 : (int)$n;
}
function num_peek(string $t): array { $c = num_cfg()[$t]; $n = num_counter(num_key($t, $c)) + 1; return ['n' => $n, 'nr' => num_fmt($c['fmt'], $n)]; }
function num_take(string $t): string {
  $c = num_cfg()[$t]; $k = num_key($t, $c); $pdo = db(); $cur = num_counter($k); $pdo->beginTransaction();
  $pdo->prepare('INSERT INTO ld_numbers (k, n) VALUES (?, ?) ON DUPLICATE KEY UPDATE n = n')->execute([$k, $cur]);
  $st = $pdo->prepare('SELECT n FROM ld_numbers WHERE k = ? FOR UPDATE'); $st->execute([$k]); $n = (int)$st->fetchColumn() + 1;
  $pdo->prepare('UPDATE ld_numbers SET n = ? WHERE k = ?')->execute([$n, $k]); $pdo->commit();
  return num_fmt($c['fmt'], $n);
}
function num_save(array $u, array $b): array {
  re_tables(); $all = num_cfg();
  foreach (['an', 're'] as $t) {
    if (!isset($b[$t]) || !is_array($b[$t])) continue; $x = $b[$t];
    $fmt = mb_substr(trim((string)($x['fmt'] ?? $all[$t]['fmt'])), 0, 60);
    if (!preg_match('/\{N+\}/', $fmt)) fail('Das Format braucht einen Zähler, z. B. {NNNN}.', 400);
    if (!preg_match('/^[\w\-\/.{}# ]+$/u', $fmt)) fail('Erlaubt sind Buchstaben, Ziffern, - / . # und die Platzhalter.', 400);
    $all[$t] = ['fmt' => $fmt, 'yearly' => !empty($x['yearly'])];
    if (isset($x['next']) && (int)$x['next'] > 0) {
      $next = (int)$x['next']; $nr = num_fmt($fmt, $next);
      $st = db()->prepare($t === 'an' ? 'SELECT COUNT(*) FROM offers WHERE nr = ? AND deleted = 0' : 'SELECT COUNT(*) FROM invoices WHERE nr = ?'); $st->execute([$nr]);
      if ((int)$st->fetchColumn()) fail("Die Nummer $nr ist schon vergeben – bitte eine höhere Startnummer wählen.", 400);
      db()->prepare('INSERT INTO ld_numbers (k, n) VALUES (?, ?) ON DUPLICATE KEY UPDATE n = VALUES(n)')->execute([num_key($t, $all[$t]), $next - 1]);
    }
  }
  ld_set('nummern', $all, (int)$u['id']); return num_out();
}
function num_out(): array { $c = num_cfg(); $o = []; foreach ($c as $t => $x) $o[$t] = $x + ['next' => num_peek($t)['n'], 'preview' => num_peek($t)['nr']]; return $o; }

/* ---------- Textbausteine ---------- */
function tx_defaults(): array {
  return [
    ['id' => 't1', 'kind' => 'intro', 'otype' => 'alle', 'def' => true, 'name' => 'Standard', 'text' => "vielen Dank für Ihr Interesse. Gerne bieten wir Ihnen folgende Leistungen an:"],
    ['id' => 't2', 'kind' => 'outro', 'otype' => 'pv', 'def' => true, 'name' => 'Photovoltaik', 'text' => "Die Anlage wird schlüsselfertig montiert, angemeldet und in Betrieb genommen. Für Photovoltaikanlagen und Speicher auf Wohngebäuden gilt der Nullsteuersatz nach § 12 Abs. 3 UStG.\nWir freuen uns auf Ihren Auftrag. Bei Fragen sind wir jederzeit für Sie da."],
    ['id' => 't3', 'kind' => 'outro', 'otype' => 'wp', 'def' => true, 'name' => 'Wärmepumpe', 'text' => "Gerne unterstützen wir Sie beim Förderantrag (BEG EM / KfW). Bitte stellen Sie den Antrag vor Auftragserteilung.\nWir freuen uns auf Ihren Auftrag. Bei Fragen sind wir jederzeit für Sie da."],
    ['id' => 't4', 'kind' => 'pay', 'otype' => 'alle', 'def' => true, 'name' => 'Abschläge 30/60/10', 'text' => "30 % bei Auftragserteilung, 60 % bei Lieferung des Materials, 10 % nach Inbetriebnahme. Zahlbar jeweils innerhalb von 14 Tagen ohne Abzug."],
    ['id' => 't5', 'kind' => 're_intro', 'otype' => 'alle', 'def' => true, 'name' => 'Standard', 'text' => "vielen Dank für Ihren Auftrag. Wir berechnen Ihnen folgende Leistungen:"],
    ['id' => 't6', 'kind' => 're_outro', 'otype' => 'alle', 'def' => true, 'name' => 'Standard', 'text' => "Bitte überweisen Sie den Betrag bis zum {Fällig} unter Angabe der Rechnungsnummer {Nummer}.\nVielen Dank für Ihr Vertrauen."],
    ['id' => 't7', 'kind' => 'mahn1', 'otype' => 'alle', 'def' => true, 'name' => 'Standard', 'text' => "sicher ist es Ihrer Aufmerksamkeit entgangen: Unsere Rechnung {Nummer} vom {Datum} über {Betrag} ist noch offen. Bitte überweisen Sie den Betrag bis zum {Fällig}. Sollten Sie bereits gezahlt haben, betrachten Sie dieses Schreiben bitte als gegenstandslos."],
    ['id' => 't8', 'kind' => 'mahn2', 'otype' => 'alle', 'def' => true, 'name' => 'Standard', 'text' => "trotz unserer Zahlungserinnerung ist die Rechnung {Nummer} vom {Datum} noch nicht beglichen. Bitte überweisen Sie den offenen Betrag von {Betrag} bis spätestens {Fällig}."],
    ['id' => 't9', 'kind' => 'mahn3', 'otype' => 'alle', 'def' => true, 'name' => 'Standard', 'text' => "leider haben Sie auf unsere bisherigen Schreiben nicht reagiert. Wir fordern Sie letztmalig auf, den offenen Betrag von {Betrag} bis zum {Fällig} zu überweisen. Andernfalls müssen wir weitere Schritte einleiten."],
  ];
}
function tx_all(): array { $t = ld_get('texte', null); return is_array($t) && $t ? $t : tx_defaults(); }
function tx_save(array $u, array $list): array {
  $out = [];
  foreach (array_slice($list, 0, 200) as $x) {
    if (!is_array($x) || !isset(TX_KINDS[$x['kind'] ?? ''])) continue;
    $out[] = ['id' => preg_match('/^[\w-]{1,20}$/', (string)($x['id'] ?? '')) ? $x['id'] : 't' . bin2hex(random_bytes(4)), 'kind' => $x['kind'], 'otype' => in_array($x['otype'] ?? '', ['pv', 'wp', 'alle'], true) ? $x['otype'] : 'alle',
      'def' => !empty($x['def']), 'name' => mb_substr(trim((string)($x['name'] ?? '')), 0, 80) ?: 'Text', 'text' => mb_substr((string)($x['text'] ?? ''), 0, 4000)];
  }
  ld_set('texte', $out, (int)$u['id']); return $out;
}

/* ---------- Mahnwesen: Einstellungen ---------- */
function mahn_cfg(): array { return (ld_get('mahn', []) ?: []) + ['ziel' => 14, 'frist' => [7, 7, 7], 'fee' => [0, 5, 10]]; }
function mahn_save(array $u, array $b): array {
  $c = ['ziel' => max(0, min(90, (int)($b['ziel'] ?? 14))), 'frist' => array_map(fn($v) => max(1, min(60, (int)$v)), array_slice(array_pad((array)($b['frist'] ?? []), 3, 7), 0, 3)),
    'fee' => array_map(fn($v) => max(0, min(100, round((float)$v, 2))), array_slice(array_pad((array)($b['fee'] ?? []), 3, 0), 0, 3))];
  ld_set('mahn', $c, (int)$u['id']); return $c;
}

/* ---------- Rechnungen ---------- */
function re_tables(): void {
  static $d = false; if ($d) return; $d = true; of_tables();
  db()->exec("CREATE TABLE IF NOT EXISTS invoices (id VARCHAR(40) PRIMARY KEY, project_id VARCHAR(40) NOT NULL, offer_id VARCHAR(40) NULL, nr VARCHAR(40) NOT NULL DEFAULT '', kind VARCHAR(10) NOT NULL DEFAULT 'rechnung', status VARCHAR(10) NOT NULL DEFAULT 'entwurf', date DATE NULL, due DATE NULL, data MEDIUMTEXT NOT NULL, net DECIMAL(12,2) NOT NULL DEFAULT 0, tax DECIMAL(12,2) NOT NULL DEFAULT 0, gross DECIMAL(12,2) NOT NULL DEFAULT 0, prepaid DECIMAL(12,2) NOT NULL DEFAULT 0, paid DECIMAL(12,2) NOT NULL DEFAULT 0, paid_at DATE NULL, created_by INT UNSIGNED NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_by INT UNSIGNED NULL, INDEX (project_id), INDEX (offer_id), INDEX (status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}
/* Summen nach EN 16931: Zeilen netto auf Cent, Steuer je Satz aus der Summe */
function re_calc(array $pos, float $disc): array {
  $lines = []; $bas = [];
  foreach ($pos as $i => $x) {
    $t = (float)$x['tax'] / 100; $unit = $x['pm'] === 'brutto' ? round($x['price'] * (1 + $t), 2) / (1 + $t) : (float)$x['price'];
    $unit *= (1 - $disc / 100) * (1 - (float)($x['dpct'] ?? 0) / 100); $unit = round($unit, 4); $ln = round($x['qty'] * $unit, 2);
    $lines[$i] = ['unit' => $unit, 'net' => $ln]; $k = (string)(float)$x['tax']; $bas[$k] = ($bas[$k] ?? 0) + $ln;
  }
  $taxes = []; foreach ($bas as $r => $b) $taxes[$r] = ['base' => round($b, 2), 'tax' => round($b * (float)$r / 100, 2)];
  $net = round(array_sum(array_column($taxes, 'base')), 2); $tax = round(array_sum(array_column($taxes, 'tax')), 2);
  return ['lines' => $lines, 'taxes' => $taxes, 'net' => $net, 'tax' => $tax, 'gross' => round($net + $tax, 2)];
}
function re_clean_pos(array $list): array {
  $pos = [];
  foreach (array_slice($list, 0, 300) as $x) {
    if (!is_array($x)) continue;
    if (!empty($x['opt'])) continue;   // Bedarfspositionen kommen nicht in die Rechnung
    $pos[] = ['dpct' => max(0, min(100, round((float)($x['dpct'] ?? 0), 2))), 'item' => mb_substr((string)($x['item'] ?? ''), 0, 40), 'name' => mb_substr(trim((string)($x['name'] ?? '')), 0, 300), 'descr' => mb_substr(trim((string)($x['descr'] ?? '')), 0, 2000), 'qty' => round((float)($x['qty'] ?? 0), 2), 'unit' => mb_substr((string)($x['unit'] ?? 'Stk'), 0, 20),
      'price' => round((float)($x['price'] ?? 0), 4), 'tax' => in_array((float)($x['tax'] ?? 19), [0.0, 7.0, 19.0], true) ? (float)$x['tax'] : 19, 'pm' => ($x['pm'] ?? '') === 'brutto' ? 'brutto' : 'netto', 'pausch' => !empty($x['pausch']), 'cat' => mb_substr((string)($x['cat'] ?? ''), 0, 10)];
  }
  return $pos;
}
function re_get(string $id): array { re_tables(); $st = db()->prepare('SELECT * FROM invoices WHERE id = ?'); $st->execute([$id]); $r = $st->fetch(); if (!$r) fail('Rechnung nicht gefunden', 404); return $r; }
function re_out(array $r, bool $full = true): array {
  $n = user_names(); $d = json_decode($r['data'], true) ?: []; $dun = (array)($d['dunning'] ?? []);
  $open = $r['status'] === 'offen' || $r['status'] === 'entwurf' ? round((float)$r['gross'] - (float)$r['prepaid'] - (float)$r['paid'], 2) : 0.0;
  $over = $r['status'] === 'offen' && $r['due'] && $r['due'] < gmdate('Y-m-d') && $open > 0.004;
  return ['id' => $r['id'], 'project' => $r['project_id'], 'offer' => $r['offer_id'], 'nr' => $r['nr'], 'kind' => $r['kind'], 'status' => $r['status'], 'date' => $r['date'], 'due' => $r['due'],
    'net' => (float)$r['net'], 'tax' => (float)$r['tax'], 'gross' => (float)$r['gross'], 'prepaid' => (float)$r['prepaid'], 'paid' => (float)$r['paid'], 'paidAt' => $r['paid_at'], 'open' => $open, 'overdue' => $over,
    'level' => count($dun), 'lastDun' => $dun ? end($dun) : null, 'by' => $n[(int)$r['created_by']] ?? '', 'upd' => $r['updated_at']] + ($full ? ['data' => $d] : []);
}
function re_list(array $u, string $pid = ''): array {
  re_tables(); $sql = 'SELECT i.*, p.name AS pname FROM invoices i LEFT JOIN projects p ON p.id = i.project_id' . ($pid !== '' ? ' WHERE i.project_id = ?' : '') . ' ORDER BY i.created_at DESC LIMIT 500';
  $st = db()->prepare($sql); $st->execute($pid !== '' ? [$pid] : []);
  return array_map(fn($r) => re_out($r, false) + ['customer' => (string)$r['pname']], $st->fetchAll());
}
function re_save(array $u, array $b): array {
  re_tables(); $pid = (string)($b['project'] ?? ''); $p = valid_id($pid) ? project_row($pid) : null;
  if (!$p || $p['deleted'] || !can_see_project($u, $p)) fail('Kunde nicht gefunden', 404);
  $id = (string)($b['id'] ?? ''); $old = $id !== '' && valid_id($id) ? re_get($id) : null;
  if ($old && $old['status'] !== 'entwurf') fail('Festgeschriebene Rechnungen können nicht mehr geändert werden – bitte stornieren.', 400);
  $d = (array)($b['data'] ?? []); $kind = isset(RE_KIND[$b['kind'] ?? '']) && ($b['kind'] ?? '') !== 'storno' ? $b['kind'] : 'rechnung';
  $pos = re_clean_pos((array)($d['pos'] ?? [])); $disc = max(0, min(100, (float)($d['discount'] ?? 0))); $T = re_calc($pos, $disc);
  $prev = []; foreach (array_slice((array)($d['prev'] ?? []), 0, 20) as $x) if (is_array($x)) $prev[] = ['id' => (string)($x['id'] ?? ''), 'nr' => mb_substr((string)($x['nr'] ?? ''), 0, 40), 'date' => (string)($x['date'] ?? ''), 'gross' => round((float)($x['gross'] ?? 0), 2)];
  $prepaid = $kind === 'schluss' ? round(array_sum(array_column($prev, 'gross')), 2) : 0;
  $ymd = fn($v) => preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$v) ? $v : null;
  $data = ['pos' => $pos, 'discount' => $disc, 'intro' => mb_substr((string)($d['intro'] ?? ''), 0, 4000), 'outro' => mb_substr((string)($d['outro'] ?? ''), 0, 4000), 'title' => mb_substr((string)($d['title'] ?? ''), 0, 200),
    'service' => mb_substr((string)($d['service'] ?? ''), 0, 200), 'serviceDate' => $ymd($d['serviceDate'] ?? '') ?? '', 'pct' => round((float)($d['pct'] ?? 0), 2), 'offerNr' => mb_substr((string)($d['offerNr'] ?? ''), 0, 40), 'buyerRef' => mb_substr((string)($d['buyerRef'] ?? ''), 0, 80), 'prev' => $prev, 'dunning' => $old ? ((json_decode($old['data'], true) ?: [])['dunning'] ?? []) : []];
  $date = $ymd($b['date'] ?? '') ?? gmdate('Y-m-d'); $due = $ymd($b['due'] ?? '') ?? gmdate('Y-m-d', strtotime($date . ' +' . mahn_cfg()['ziel'] . ' days'));
  $offer = valid_id((string)($b['offer'] ?? '')) ? $b['offer'] : null; $json = json_encode($data, JSON_UNESCAPED_UNICODE);
  if ($old) db()->prepare('UPDATE invoices SET kind = ?, date = ?, due = ?, data = ?, net = ?, tax = ?, gross = ?, prepaid = ?, updated_at = UTC_TIMESTAMP(), updated_by = ? WHERE id = ?')->execute([$kind, $date, $due, $json, $T['net'], $T['tax'], $T['gross'], $prepaid, $u['id'], $old['id']]);
  else { $id = 'r' . bin2hex(random_bytes(7)); db()->prepare('INSERT INTO invoices (id, project_id, offer_id, kind, date, due, data, net, tax, gross, prepaid, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')->execute([$id, $pid, $offer, $kind, $date, $due, $json, $T['net'], $T['tax'], $T['gross'], $prepaid, $u['id'], $u['id']]); }
  return re_out(re_get($old ? $old['id'] : $id));
}
function re_final(array $u, string $id): array {
  $r = re_get($id); if ($r['status'] !== 'entwurf') fail('Schon festgeschrieben.', 400);
  $d = json_decode($r['data'], true) ?: []; if (!($d['pos'] ?? [])) fail('Die Rechnung hat keine Positionen.', 400);
  $nr = num_take('re'); db()->prepare("UPDATE invoices SET nr = ?, status = 'offen', updated_at = UTC_TIMESTAMP(), updated_by = ? WHERE id = ?")->execute([$nr, $u['id'], $id]);
  require_once __DIR__ . '/crm-lib.php'; crm_add_event($r['project_id'], (int)$u['id'], 'notiz', RE_KIND[$r['kind']] . ' ' . $nr . ' gestellt: ' . number_format((float)$r['gross'] - (float)$r['prepaid'], 2, ',', '.') . ' €');
  audit((int)$u['id'], 'rechnung', RE_KIND[$r['kind']] . ' ' . $nr); return re_out(re_get($id));
}
function re_paid(array $u, string $id, float $amount, string $date): array {
  $r = re_get($id); if (!in_array($r['status'], ['offen', 'bezahlt'], true)) fail('Nur offene Rechnungen.', 400);
  $date = preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) ? $date : gmdate('Y-m-d'); $paid = max(0, round($amount, 2));
  $st = $paid + 0.004 >= (float)$r['gross'] - (float)$r['prepaid'] ? 'bezahlt' : 'offen';
  db()->prepare('UPDATE invoices SET paid = ?, paid_at = ?, status = ?, updated_at = UTC_TIMESTAMP(), updated_by = ? WHERE id = ?')->execute([$paid, $date, $st, $u['id'], $id]);
  if ($st === 'bezahlt') { require_once __DIR__ . '/crm-lib.php'; crm_add_event($r['project_id'], (int)$u['id'], 'notiz', 'Rechnung ' . $r['nr'] . ' bezahlt'); }
  return re_out(re_get($id));
}
function re_storno(array $u, string $id): array {
  $r = re_get($id); if (!in_array($r['status'], ['offen', 'bezahlt'], true) || $r['kind'] === 'storno') fail('Nur festgeschriebene Rechnungen lassen sich stornieren.', 400);
  $d = json_decode($r['data'], true) ?: []; $pos = array_map(fn($x) => ['qty' => -$x['qty']] + $x, (array)($d['pos'] ?? []));
  $T = re_calc($pos, (float)($d['discount'] ?? 0)); $nid = 's' . bin2hex(random_bytes(7)); $nr = num_take('re');
  $nd = ['pos' => $pos, 'discount' => (float)($d['discount'] ?? 0), 'intro' => 'hiermit stornieren wir unsere Rechnung ' . $r['nr'] . ' vom ' . date('d.m.Y', strtotime((string)$r['date'])) . ' vollständig.', 'outro' => '', 'title' => 'Stornorechnung zu ' . $r['nr'], 'ref' => $r['nr'], 'refDate' => $r['date'], 'prev' => [], 'dunning' => []];
  $pre = -(float)$r['prepaid'];
  db()->prepare("INSERT INTO invoices (id, project_id, offer_id, nr, kind, status, date, due, data, net, tax, gross, prepaid, created_by, updated_by) VALUES (?, ?, ?, ?, 'storno', 'offen', ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    ->execute([$nid, $r['project_id'], $r['offer_id'], $nr, gmdate('Y-m-d'), gmdate('Y-m-d'), json_encode($nd, JSON_UNESCAPED_UNICODE), $T['net'], $T['tax'], $T['gross'], $pre, $u['id'], $u['id']]);
  db()->prepare("UPDATE invoices SET status = 'storniert', updated_at = UTC_TIMESTAMP(), updated_by = ? WHERE id = ?")->execute([$u['id'], $id]);
  db()->prepare("UPDATE invoices SET status = 'bezahlt' WHERE id = ?")->execute([$nid]);   // Storno ist mit der Gegenbuchung erledigt
  audit((int)$u['id'], 'rechnung', 'Storno ' . $nr . ' zu ' . $r['nr']); return re_out(re_get($nid));
}
function re_dun(array $u, string $id): array {
  $r = re_get($id); $o = re_out($r); if ($r['status'] !== 'offen' || $o['open'] <= 0) fail('Nur offene Rechnungen können gemahnt werden.', 400);
  $d = json_decode($r['data'], true) ?: []; $dun = (array)($d['dunning'] ?? []); $lv = count($dun) + 1; if ($lv > 3) fail('Höchste Mahnstufe erreicht – nächster Schritt: Mahnbescheid bzw. Inkasso.', 400);
  $c = mahn_cfg(); $dun[] = ['level' => $lv, 'date' => gmdate('Y-m-d'), 'fee' => (float)$c['fee'][$lv - 1], 'due' => gmdate('Y-m-d', strtotime('+' . $c['frist'][$lv - 1] . ' days'))];
  $d['dunning'] = $dun; db()->prepare('UPDATE invoices SET data = ?, updated_at = UTC_TIMESTAMP(), updated_by = ? WHERE id = ?')->execute([json_encode($d, JSON_UNESCAPED_UNICODE), $u['id'], $id]);
  require_once __DIR__ . '/crm-lib.php'; crm_add_event($r['project_id'], (int)$u['id'], 'notiz', ['Zahlungserinnerung', '1. Mahnung', '2. Mahnung'][$lv - 1] . ' zu Rechnung ' . $r['nr']);
  return re_out(re_get($id));
}

/* ---------- E-Rechnung: XRechnung 3.0 (UN/CEFACT CII, EN 16931) ---------- */
function re_unit(string $u): string {
  $u = mb_strtolower(trim($u));
  return ['stk' => 'H87', 'stück' => 'H87', 'st' => 'H87', 'psch' => 'LS', 'pauschal' => 'LS', 'pausch' => 'LS', 'std' => 'HUR', 'h' => 'HUR', 'stunde' => 'HUR', 'm' => 'MTR', 'lfm' => 'MTR', 'm²' => 'MTK', 'qm' => 'MTK', 'kg' => 'KGM', 'l' => 'LTR', 'tag' => 'DAY', 'kwp' => 'KWT', 'kw' => 'KWT', 'kwh' => 'KWH', 'satz' => 'SET', 'set' => 'SET'][$u] ?? 'C62';
}
function re_xml(string $id): string {
  $r = re_get($id); if ($r['status'] === 'entwurf') fail('Bitte die Rechnung zuerst festschreiben.', 400);
  $d = json_decode($r['data'], true) ?: []; $p = project_row($r['project_id']); $pd = $p ? (json_decode($p['data'], true) ?: []) : []; $c = (array)($pd['customer'] ?? []);
  $row = cfg_row(); $cfg = $row ? json_decode((string)$row['data'], true) : []; $co = (array)(($cfg['settings'] ?? [])['company'] ?? []);
  $sto = $r['kind'] === 'storno'; $pos = (array)($d['pos'] ?? []);
  if ($sto) $pos = array_map(fn($x) => ['qty' => abs((float)$x['qty'])] + $x, $pos);   // Gutschrift (381): Beträge positiv
  $d['pos'] = $pos; $T = re_calc($pos, (float)($d['discount'] ?? 0)); $prepaid = abs((float)$r['prepaid']);
  $e = fn($s) => htmlspecialchars((string)$s, ENT_XML1 | ENT_QUOTES, 'UTF-8'); $a = fn($v) => number_format((float)$v, 2, '.', ''); $ymd = fn($s) => str_replace('-', '', (string)$s);
  $miss = [];
  foreach ([['name', 'Firmenname'], ['street', 'Straße der Firma'], ['zip', 'PLZ der Firma'], ['city', 'Ort der Firma'], ['email', 'E-Mail der Firma'], ['iban', 'IBAN']] as [$k, $l]) if (trim((string)($co[$k] ?? '')) === '') $miss[] = $l;
  if (trim((string)($co['vatId'] ?? '')) === '' && trim((string)($co['taxNo'] ?? '')) === '') $miss[] = 'USt-IdNr. oder Steuernummer';
  if (trim((string)($c['email'] ?? '')) === '') $miss[] = 'E-Mail des Kunden';
  if (trim((string)($c['zip'] ?? '')) === '' || trim((string)($c['city'] ?? '')) === '') $miss[] = 'Adresse des Kunden';
  if ($miss) fail('Für die E-Rechnung fehlt noch: ' . implode(', ', $miss) . '.', 400);
  $type = ['abschlag' => '326', 'storno' => '381'][$r['kind']] ?? '380';
  $notes = array_filter([trim((string)($d['intro'] ?? '')), trim((string)($d['outro'] ?? '')), array_filter((array)($d['pos'] ?? []), fn($x) => (float)$x['tax'] == 0) ? 'Nullsteuersatz nach § 12 Abs. 3 UStG für Photovoltaikanlagen und Stromspeicher.' : '']);
  $x = '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">'
    . '<rsm:ExchangedDocumentContext><ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</ram:ID></ram:BusinessProcessSpecifiedDocumentContextParameter><ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter></rsm:ExchangedDocumentContext>'
    . '<rsm:ExchangedDocument><ram:ID>' . $e($r['nr']) . '</ram:ID><ram:TypeCode>' . $type . '</ram:TypeCode><ram:IssueDateTime><udt:DateTimeString format="102">' . $ymd($r['date']) . '</udt:DateTimeString></ram:IssueDateTime>'
    . implode('', array_map(fn($n) => '<ram:IncludedNote><ram:Content>' . $e(strtr($n, ['{Nummer}' => $r['nr'], '{Fällig}' => date('d.m.Y', strtotime((string)$r['due']))])) . '</ram:Content></ram:IncludedNote>', $notes)) . '</rsm:ExchangedDocument>'
    . '<rsm:SupplyChainTradeTransaction>';
  foreach ((array)($d['pos'] ?? []) as $i => $l) {
    $L = $T['lines'][$i]; $cat = (float)$l['tax'] > 0 ? 'S' : 'Z';
    if ($L['unit'] < 0) { $L['unit'] = -$L['unit']; $l['qty'] = -(float)$l['qty']; }   // Rabattzeile: Preis darf nicht negativ sein (BR-27) → Menge negativ
    $x .= '<ram:IncludedSupplyChainTradeLineItem><ram:AssociatedDocumentLineDocument><ram:LineID>' . ($i + 1) . '</ram:LineID></ram:AssociatedDocumentLineDocument>'
      . '<ram:SpecifiedTradeProduct><ram:Name>' . $e($l['name'] ?: 'Position ' . ($i + 1)) . '</ram:Name>' . (trim((string)$l['descr']) !== '' ? '<ram:Description>' . $e($l['descr']) . '</ram:Description>' : '') . '</ram:SpecifiedTradeProduct>'
      . '<ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>' . number_format($L['unit'], 4, '.', '') . '</ram:ChargeAmount></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>'
      . '<ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="' . re_unit((string)$l['unit']) . '">' . number_format((float)$l['qty'], 2, '.', '') . '</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>'
      . '<ram:SpecifiedLineTradeSettlement><ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>' . $cat . '</ram:CategoryCode><ram:RateApplicablePercent>' . $a($l['tax']) . '</ram:RateApplicablePercent></ram:ApplicableTradeTax>'
      . '<ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>' . $a($L['net']) . '</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation></ram:SpecifiedLineTradeSettlement></ram:IncludedSupplyChainTradeLineItem>';
  }
  $cn = trim(((string)($c['salutation'] ?? '') === 'Firma' ? '' : '') . (string)($c['name'] ?? '')) ?: 'Kunde';
  $x .= '<ram:ApplicableHeaderTradeAgreement><ram:BuyerReference>' . $e(($d['buyerRef'] ?? '') ?: ($d['offerNr'] ?? '') ?: $r['nr']) . '</ram:BuyerReference>'
    . '<ram:SellerTradeParty><ram:Name>' . $e($co['name']) . '</ram:Name>'
    . '<ram:DefinedTradeContact><ram:PersonName>' . $e(($co['ceo'] ?? '') ?: $co['name']) . '</ram:PersonName><ram:TelephoneUniversalCommunication><ram:CompleteNumber>' . $e(($co['phone'] ?? '') ?: '-') . '</ram:CompleteNumber></ram:TelephoneUniversalCommunication><ram:EmailURIUniversalCommunication><ram:URIID>' . $e($co['email']) . '</ram:URIID></ram:EmailURIUniversalCommunication></ram:DefinedTradeContact>'
    . '<ram:PostalTradeAddress><ram:PostcodeCode>' . $e($co['zip']) . '</ram:PostcodeCode><ram:LineOne>' . $e($co['street']) . '</ram:LineOne><ram:CityName>' . $e($co['city']) . '</ram:CityName><ram:CountryID>DE</ram:CountryID></ram:PostalTradeAddress>'
    . '<ram:URIUniversalCommunication><ram:URIID schemeID="EM">' . $e($co['email']) . '</ram:URIID></ram:URIUniversalCommunication>'
    . (trim((string)($co['vatId'] ?? '')) !== '' ? '<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">' . $e(str_replace(' ', '', $co['vatId'])) . '</ram:ID></ram:SpecifiedTaxRegistration>' : '')
    . (trim((string)($co['taxNo'] ?? '')) !== '' ? '<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">' . $e($co['taxNo']) . '</ram:ID></ram:SpecifiedTaxRegistration>' : '')
    . '</ram:SellerTradeParty><ram:BuyerTradeParty><ram:Name>' . $e(trim(((string)($c['salutation'] ?? '')) . ' ' . $cn)) . '</ram:Name>'
    . '<ram:PostalTradeAddress><ram:PostcodeCode>' . $e($c['zip']) . '</ram:PostcodeCode>' . (trim((string)($c['street'] ?? '')) !== '' ? '<ram:LineOne>' . $e($c['street']) . '</ram:LineOne>' : '') . '<ram:CityName>' . $e($c['city']) . '</ram:CityName><ram:CountryID>DE</ram:CountryID></ram:PostalTradeAddress>'
    . '<ram:URIUniversalCommunication><ram:URIID schemeID="EM">' . $e($c['email']) . '</ram:URIID></ram:URIUniversalCommunication></ram:BuyerTradeParty>'
    . (($d['offerNr'] ?? '') !== '' ? '<ram:SellerOrderReferencedDocument><ram:IssuerAssignedID>' . $e($d['offerNr']) . '</ram:IssuerAssignedID></ram:SellerOrderReferencedDocument>' : '')
    . '</ram:ApplicableHeaderTradeAgreement>'
    . '<ram:ApplicableHeaderTradeDelivery><ram:ActualDeliverySupplyChainEvent><ram:OccurrenceDateTime><udt:DateTimeString format="102">' . $ymd(($d['serviceDate'] ?? '') ?: (($d['refDate'] ?? '') && $sto ? $d['refDate'] : $r['date'])) . '</udt:DateTimeString></ram:OccurrenceDateTime></ram:ActualDeliverySupplyChainEvent></ram:ApplicableHeaderTradeDelivery>'
    . '<ram:ApplicableHeaderTradeSettlement>' . ($r['kind'] === 'storno' ? '' : '<ram:PaymentReference>' . $e($r['nr']) . '</ram:PaymentReference>') . '<ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>'
    . '<ram:SpecifiedTradeSettlementPaymentMeans><ram:TypeCode>58</ram:TypeCode><ram:PayeePartyCreditorFinancialAccount><ram:IBANID>' . $e(str_replace(' ', '', $co['iban'])) . '</ram:IBANID>' . (trim((string)($co['bank'] ?? '')) !== '' ? '<ram:AccountName>' . $e($co['name']) . '</ram:AccountName>' : '') . '</ram:PayeePartyCreditorFinancialAccount>'
    . (trim((string)($co['bic'] ?? '')) !== '' ? '<ram:PayeeSpecifiedCreditorFinancialInstitution><ram:BICID>' . $e(str_replace(' ', '', $co['bic'])) . '</ram:BICID></ram:PayeeSpecifiedCreditorFinancialInstitution>' : '') . '</ram:SpecifiedTradeSettlementPaymentMeans>';
  foreach ($T['taxes'] as $rate => $t) $x .= '<ram:ApplicableTradeTax><ram:CalculatedAmount>' . $a($t['tax']) . '</ram:CalculatedAmount><ram:TypeCode>VAT</ram:TypeCode>' . '<ram:BasisAmount>' . $a($t['base']) . '</ram:BasisAmount><ram:CategoryCode>' . ((float)$rate > 0 ? 'S' : 'Z') . '</ram:CategoryCode><ram:RateApplicablePercent>' . $a($rate) . '</ram:RateApplicablePercent></ram:ApplicableTradeTax>';
  $due = (float)$T['gross'] - $prepaid;
  $x .= '<ram:SpecifiedTradePaymentTerms><ram:Description>' . $e('Zahlbar bis ' . date('d.m.Y', strtotime((string)$r['due'])) . ' ohne Abzug.') . '</ram:Description><ram:DueDateDateTime><udt:DateTimeString format="102">' . $ymd($r['due']) . '</udt:DateTimeString></ram:DueDateDateTime></ram:SpecifiedTradePaymentTerms>'
    . '<ram:SpecifiedTradeSettlementHeaderMonetarySummation><ram:LineTotalAmount>' . $a($T['net']) . '</ram:LineTotalAmount><ram:TaxBasisTotalAmount>' . $a($T['net']) . '</ram:TaxBasisTotalAmount><ram:TaxTotalAmount currencyID="EUR">' . $a($T['tax']) . '</ram:TaxTotalAmount><ram:GrandTotalAmount>' . $a($T['gross']) . '</ram:GrandTotalAmount>'
    . ($prepaid != 0 ? '<ram:TotalPrepaidAmount>' . $a($prepaid) . '</ram:TotalPrepaidAmount>' : '') . '<ram:DuePayableAmount>' . $a($due) . '</ram:DuePayableAmount></ram:SpecifiedTradeSettlementHeaderMonetarySummation>';
  if ($r['kind'] === 'storno' && ($d['ref'] ?? '') !== '') $x .= '<ram:InvoiceReferencedDocument><ram:IssuerAssignedID>' . $e($d['ref']) . '</ram:IssuerAssignedID>' . (($d['refDate'] ?? '') ? '<ram:FormattedIssueDateTime><qdt:DateTimeString format="102">' . $ymd($d['refDate']) . '</qdt:DateTimeString></ram:FormattedIssueDateTime>' : '') . '</ram:InvoiceReferencedDocument>';
  elseif ($pv = ((array)($d['prev'] ?? []))[0] ?? null) if (($pv['nr'] ?? '') !== '') $x .= '<ram:InvoiceReferencedDocument><ram:IssuerAssignedID>' . $e($pv['nr']) . '</ram:IssuerAssignedID>' . (preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($pv['date'] ?? '')) ? '<ram:FormattedIssueDateTime><qdt:DateTimeString format="102">' . $ymd($pv['date']) . '</qdt:DateTimeString></ram:FormattedIssueDateTime>' : '') . '</ram:InvoiceReferencedDocument>';
  $x .= '</ram:ApplicableHeaderTradeSettlement></rsm:SupplyChainTradeTransaction></rsm:CrossIndustryInvoice>';
  return $x;
}
