<?php
/* LumbraDesk – Angebote
   - Artikel und Leistungen (eigene) + Produkte aus der Wirtschaftlichkeit (Firmen-Einstellungen)
   - Standardpakete: werden automatisch ergänzt, wenn passende Positionen im Angebot sind
     (z. B. bei PV-Modulen: Gerüst, Montage je Modul, AC-Installation, Anmeldung Netzbetreiber)
   - Angebote je Kunde mit Positionen, Rabatt, Texten, Status und fortlaufender Nummer */
declare(strict_types=1);

const OF_CATS = ['mod' => 'PV-Module', 'inv' => 'Wechselrichter', 'bat' => 'Speicher', 'wb' => 'Wallbox', 'wp' => 'Wärmepumpe', 'mont' => 'Montage', 'elek' => 'Elektro', 'sonst' => 'Sonstiges'];
const OF_PCATS = ['mod', 'inv', 'bat', 'wb', 'wp', 'sonst'];   // Arten in der Produktdatenbank
const OF_STATUS = ['entwurf' => 'Entwurf', 'gesendet' => 'Gesendet', 'angenommen' => 'Angenommen', 'abgelehnt' => 'Abgelehnt'];

function of_tables(): void {
  static $done = false; if ($done) return; $done = true; $pdo = db();
  $pdo->exec("CREATE TABLE IF NOT EXISTS offer_items (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(200) NOT NULL, descr TEXT NULL, unit VARCHAR(20) NOT NULL DEFAULT 'Stk', price DECIMAL(12,2) NOT NULL DEFAULT 0, tax DECIMAL(4,1) NOT NULL DEFAULT 19, cat VARCHAR(10) NOT NULL DEFAULT 'sonst', words VARCHAR(300) NOT NULL DEFAULT '', power DECIMAL(10,2) NULL, active TINYINT(1) NOT NULL DEFAULT 1, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $ic = array_column($pdo->query('SHOW COLUMNS FROM offer_items')->fetchAll(), 'Field');
  if (!in_array('prec4', $ic, true)) $pdo->exec("ALTER TABLE offer_items MODIFY price DECIMAL(12,4) NOT NULL DEFAULT 0, ADD COLUMN prec4 TINYINT(1) NOT NULL DEFAULT 1");
  if (!in_array('pm', $ic, true)) $pdo->exec("ALTER TABLE offer_items ADD COLUMN pm VARCHAR(6) NOT NULL DEFAULT 'netto', ADD COLUMN pausch TINYINT(1) NOT NULL DEFAULT 0");
  if (!in_array('kind', $ic, true)) $pdo->exec("ALTER TABLE offer_items ADD COLUMN kind VARCHAR(10) NOT NULL DEFAULT 'leistung', ADD COLUMN maker VARCHAR(120) NOT NULL DEFAULT ''");
  $pdo->exec("CREATE TABLE IF NOT EXISTS offer_packages (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(200) NOT NULL, trig VARCHAR(20) NOT NULL DEFAULT 'mod', pos_lines MEDIUMTEXT NOT NULL, active TINYINT(1) NOT NULL DEFAULT 1) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $pc = array_column($pdo->query('SHOW COLUMNS FROM offer_packages')->fetchAll(), 'Field');
  if (!in_array('otype', $pc, true)) {   // 3.0: Angebotsart, immer/wenn, Bedingung (Kategorien oder Produkte)
    $pdo->exec("ALTER TABLE offer_packages ADD COLUMN otype VARCHAR(6) NOT NULL DEFAULT 'alle', ADD COLUMN mode VARCHAR(6) NOT NULL DEFAULT 'wenn', ADD COLUMN cond TEXT NULL");
    foreach ($pdo->query('SELECT id, trig FROM offer_packages')->fetchAll() as $r) $pdo->prepare('UPDATE offer_packages SET cond = ?, otype = ? WHERE id = ?')->execute([json_encode(['cats' => [$r['trig']], 'items' => []]), $r['trig'] === 'wp' ? 'wp' : ($r['trig'] === 'mod' ? 'pv' : 'alle'), $r['id']]);
  }
  $ic2 = array_column($pdo->query('SHOW COLUMNS FROM offer_items')->fetchAll(), 'Field');
  if (!in_array('img', $ic2, true)) $pdo->exec("ALTER TABLE offer_items ADD COLUMN img VARCHAR(64) NOT NULL DEFAULT ''");
  $pdo->exec("CREATE TABLE IF NOT EXISTS offers (id VARCHAR(40) PRIMARY KEY, project_id VARCHAR(40) NOT NULL, nr VARCHAR(40) NOT NULL DEFAULT '', title VARCHAR(200) NOT NULL DEFAULT '', status VARCHAR(12) NOT NULL DEFAULT 'entwurf', data MEDIUMTEXT NOT NULL, net DECIMAL(12,2) NOT NULL DEFAULT 0, gross DECIMAL(12,2) NOT NULL DEFAULT 0, created_by INT UNSIGNED NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_by INT UNSIGNED NULL, deleted TINYINT(1) NOT NULL DEFAULT 0, INDEX (project_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $pdo->exec("CREATE TABLE IF NOT EXISTS ld_numbers (k VARCHAR(40) PRIMARY KEY, n INT UNSIGNED NOT NULL DEFAULT 0) ENGINE=InnoDB");
  /* Startbestand: typische Leistungen eines PV/WP-Betriebs (Preise bitte anpassen) */
  if (!(int)$pdo->query('SELECT COUNT(*) FROM offer_items')->fetchColumn()) {
    $ins = $pdo->prepare('INSERT INTO offer_items (name, descr, unit, price, tax, cat, words) VALUES (?, ?, ?, ?, ?, ?, ?)');
    foreach ([
      ['Gerüst / Absturzsicherung', 'Stellen, Vorhalten und Abbau des Gerüsts bzw. der Absturzsicherung für die Montage', 'psch', 890, 0, 'mont', 'gerüst,geruest,absturzsicherung'],
      ['Montage PV-Modul inkl. Unterkonstruktion', 'Montage je Modul auf dem Dach inkl. Dachhaken, Schienen und Verkabelung', 'Stk', 65, 0, 'mont', 'montage,dachmontage,unterkonstruktion'],
      ['AC-Installation und Zählerschrank-Anpassung', 'Anschluss Wechselrichter, Leitungen, Überspannungsschutz, Anpassung Zählerschrank', 'psch', 1450, 0, 'elek', 'ac,elektro,zählerschrank,zaehlerschrank,installation'],
      ['Anmeldung Netzbetreiber und Marktstammdatenregister', 'Anmeldung der Anlage beim Netzbetreiber und im Marktstammdatenregister', 'psch', 290, 0, 'elek', 'anmeldung,netzbetreiber,marktstammdaten'],
      ['Inbetriebnahme und Einweisung', 'Inbetriebnahme der Anlage, Einrichtung der App, Einweisung des Kunden', 'psch', 350, 0, 'elek', 'inbetriebnahme,einweisung'],
      ['Wallbox 11 kW inkl. Installation', 'Wallbox 11 kW, Montage und Anschluss inkl. Leitung bis 15 m', 'Stk', 1490, 19, 'wb', 'wallbox,ladestation,ladebox,e-auto'],
      ['Notstrom-/Ersatzstrom-Umschaltung', 'Umschaltbox für Ersatzstrom bei Netzausfall inkl. Installation', 'Stk', 890, 0, 'elek', 'notstrom,ersatzstrom,backup'],
      ['Optimierer', 'Leistungsoptimierer je Modul (bei Verschattung)', 'Stk', 59, 0, 'mod', 'optimierer,optimizer'],
      ['Montage Wärmepumpe inkl. Hydraulik', 'Aufstellung Außengerät, hydraulischer Anschluss, Pufferspeicher, Inbetriebnahme', 'psch', 4800, 19, 'wp', 'wärmepumpe montage,hydraulik'],
      ['Demontage und Entsorgung Altanlage', 'Demontage der alten Heizung, fachgerechte Entsorgung', 'psch', 950, 19, 'wp', 'demontage,entsorgung,altanlage,ölkessel,oelkessel,gaskessel'],
    ] as $r) $ins->execute($r);
    $ids = array_column($pdo->query('SELECT id, name FROM offer_items')->fetchAll(), 'id', 'name');
    $pk = $pdo->prepare('INSERT INTO offer_packages (name, trig, pos_lines) VALUES (?, ?, ?)');
    $pk->execute(['Standard Photovoltaik', 'mod', json_encode([
      ['item' => $ids['Gerüst / Absturzsicherung'], 'rule' => 'fix', 'qty' => 1],
      ['item' => $ids['Montage PV-Modul inkl. Unterkonstruktion'], 'rule' => 'perMod', 'qty' => 1],
      ['item' => $ids['AC-Installation und Zählerschrank-Anpassung'], 'rule' => 'fix', 'qty' => 1],
      ['item' => $ids['Anmeldung Netzbetreiber und Marktstammdatenregister'], 'rule' => 'fix', 'qty' => 1],
      ['item' => $ids['Inbetriebnahme und Einweisung'], 'rule' => 'fix', 'qty' => 1]])]);
    $pk->execute(['Standard Wärmepumpe', 'wp', json_encode([
      ['item' => $ids['Montage Wärmepumpe inkl. Hydraulik'], 'rule' => 'fix', 'qty' => 1]])]);
  }
}
/* Katalog: nur die eigene Angebots-Datenbank (Produkte + Leistungen) – getrennt von der Wirtschaftlichkeit */
function of_catalog(): array {
  of_tables(); $out = [];
  foreach (db()->query('SELECT * FROM offer_items WHERE active = 1 ORDER BY kind DESC, cat, name')->fetchAll() as $r)
    $out[] = ['id' => 'i' . $r['id'], 'kind' => $r['kind'], 'name' => $r['name'], 'maker' => (string)$r['maker'], 'descr' => (string)$r['descr'], 'unit' => $r['unit'], 'price' => (float)$r['price'], 'tax' => (float)$r['tax'], 'cat' => $r['cat'], 'words' => $r['words'], 'power' => $r['power'] !== null ? (float)$r['power'] : null, 'pm' => $r['pm'], 'pausch' => (bool)$r['pausch'], 'img' => (string)($r['img'] ?? '')];
  return $out;
}
/* Einmalig übernehmen: Produkte aus der Wirtschaftlichkeit in die Angebots-Produktdatenbank kopieren (danach unabhängig) */
function of_import_rechner(): int {
  of_tables(); $row = cfg_row(); $cfg = $row ? json_decode((string)$row['data'], true) : null; $n = 0;
  $have = array_map('mb_strtolower', array_column(db()->query("SELECT name FROM offer_items WHERE active = 1")->fetchAll(), 'name'));
  $ins = db()->prepare("INSERT INTO offer_items (kind, name, maker, descr, unit, price, tax, cat, words, power, pm) VALUES ('produkt', ?, ?, ?, 'Stk', ?, ?, ?, '', ?, ?)");
  foreach ((array)($cfg['products'] ?? []) as $p) {
    if (empty($p['name']) || in_array(mb_strtolower($p['name']), $have, true)) continue;
    $cat = in_array($p['cat'] ?? '', ['mod', 'inv', 'bat', 'wp'], true) ? $p['cat'] : 'sonst';
    $ins->execute([mb_substr($p['name'], 0, 200), mb_substr((string)($p['maker'] ?? ''), 0, 120), trim((string)($p['dims'] ?? '')), (float)($p['price'] ?? 0), in_array($cat, ['mod', 'inv', 'bat'], true) ? 0 : 19, $cat, isset($p['power']) && is_numeric($p['power']) ? (float)$p['power'] : null, $cat === 'wp' ? 'brutto' : 'netto']);
    $have[] = mb_strtolower($p['name']); $n++;
  }
  return $n;
}
function of_packages(): array {
  of_tables();
  return array_map(fn($r) => ['id' => (int)$r['id'], 'name' => $r['name'], 'trig' => $r['trig'], 'otype' => $r['otype'] ?? 'alle', 'mode' => $r['mode'] ?? 'wenn', 'cond' => (json_decode((string)($r['cond'] ?? ''), true) ?: ['cats' => [$r['trig']], 'items' => []]) + ['cats' => [], 'items' => []], 'lines' => json_decode($r['pos_lines'], true) ?: [], 'active' => (bool)$r['active']], db()->query('SELECT * FROM offer_packages ORDER BY id')->fetchAll());
}
function of_item_save(array $b): array {
  of_tables(); $id = (int)preg_replace('/\D/', '', (string)($b['id'] ?? '')); $kind = ($b['kind'] ?? '') === 'produkt' ? 'produkt' : 'leistung';
  $cat = (string)($b['cat'] ?? 'sonst'); if (!isset(OF_CATS[$cat]) || ($kind === 'produkt' && !in_array($cat, OF_PCATS, true))) $cat = 'sonst';
  $pow = isset($b['power']) && $b['power'] !== '' && $b['power'] !== null && is_numeric($b['power']) ? (float)$b['power'] : null;
  $v = [$kind, mb_substr(trim((string)($b['name'] ?? '')), 0, 200), mb_substr(trim((string)($b['maker'] ?? '')), 0, 120), mb_substr(trim((string)($b['descr'] ?? '')), 0, 2000), mb_substr(trim((string)($b['unit'] ?? 'Stk')), 0, 20) ?: 'Stk', round((float)($b['price'] ?? 0), 4), in_array((float)($b['tax'] ?? 19), [0.0, 7.0, 19.0], true) ? (float)$b['tax'] : 19, $cat, mb_substr(mb_strtolower(trim((string)($b['words'] ?? ''))), 0, 300), $pow, ($b['pm'] ?? '') === 'brutto' ? 'brutto' : 'netto', !empty($b['pausch']) ? 1 : 0];
  if ($v[1] === '') fail('Bitte einen Namen eingeben.', 400);
  $img = preg_match('/^[A-Za-z0-9_-]{1,64}$/', (string)($b['img'] ?? '')) ? $b['img'] : '';
  if ($id) db()->prepare('UPDATE offer_items SET img = ? WHERE id = ?')->execute([$img, $id]);
  if ($id) db()->prepare('UPDATE offer_items SET kind = ?, name = ?, maker = ?, descr = ?, unit = ?, price = ?, tax = ?, cat = ?, words = ?, power = ?, pm = ?, pausch = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?')->execute(array_merge($v, [$id]));
  else { db()->prepare('INSERT INTO offer_items (kind, name, maker, descr, unit, price, tax, cat, words, power, pm, pausch) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')->execute($v); $id = (int)db()->lastInsertId(); db()->prepare('UPDATE offer_items SET img = ? WHERE id = ?')->execute([$img, $id]); }
  return ['id' => 'i' . $id];
}
function of_package_save(array $b): void {
  of_tables(); $id = (int)($b['id'] ?? 0); $name = mb_substr(trim((string)($b['name'] ?? '')), 0, 200); if ($name === '') fail('Bitte einen Namen eingeben.', 400);
  $otype = in_array($b['otype'] ?? '', ['pv', 'wp', 'alle'], true) ? $b['otype'] : 'alle'; $mode = ($b['mode'] ?? '') === 'immer' ? 'immer' : 'wenn';
  $c = (array)($b['cond'] ?? []); $cond = ['cats' => array_values(array_filter((array)($c['cats'] ?? []), fn($k) => isset(OF_CATS[$k]))), 'items' => array_values(array_filter(array_map('strval', (array)($c['items'] ?? [])), fn($v) => (bool)preg_match('/^i?\d+$/', $v)))];
  if ($mode === 'wenn' && !$cond['cats'] && !$cond['items']) fail('Bitte eine Bedingung wählen (Kategorie oder Produkt) – oder „immer“.', 400);
  $lines = array_values(array_filter(array_map(fn($l) => ['item' => (string)($l['item'] ?? ''), 'rule' => in_array($l['rule'] ?? '', ['fix', 'perMod', 'perKwp', 'perKw'], true) ? $l['rule'] : 'fix', 'qty' => max(0, (float)($l['qty'] ?? 1))], (array)($b['lines'] ?? [])), fn($l) => $l['item'] !== ''));
  if (!$lines) fail('Bitte mindestens eine Position hinzufügen.', 400);
  $json = json_encode($lines); $act = empty($b['off']) ? 1 : 0; $trig = $cond['cats'][0] ?? 'mod'; $cj = json_encode($cond);
  if ($id) db()->prepare('UPDATE offer_packages SET name = ?, trig = ?, pos_lines = ?, active = ?, otype = ?, mode = ?, cond = ? WHERE id = ?')->execute([$name, $trig, $json, $act, $otype, $mode, $cj, $id]);
  else db()->prepare('INSERT INTO offer_packages (name, trig, pos_lines, active, otype, mode, cond) VALUES (?, ?, ?, ?, ?, ?, ?)')->execute([$name, $trig, $json, $act, $otype, $mode, $cj]);
}
function of_number(): string { require_once __DIR__ . '/belege-lib.php'; return num_take('an'); }
function of_out(array $r, bool $full = true): array {
  $n = user_names();
  return ['id' => $r['id'], 'project' => $r['project_id'], 'nr' => $r['nr'], 'title' => $r['title'], 'status' => $r['status'], 'net' => (float)$r['net'], 'gross' => (float)$r['gross'],
    'by' => $n[(int)$r['created_by']] ?? '', 'created' => $r['created_at'], 'upd' => $r['updated_at']] + ($full ? ['data' => json_decode($r['data'], true) ?: []] : []);
}
function of_list(string $pid): array { of_tables(); $st = db()->prepare('SELECT * FROM offers WHERE project_id = ? AND deleted = 0 ORDER BY created_at DESC'); $st->execute([$pid]); return array_map(fn($r) => of_out($r, false), $st->fetchAll()); }
function of_get(string $id): array { of_tables(); $st = db()->prepare('SELECT * FROM offers WHERE id = ? AND deleted = 0'); $st->execute([$id]); $r = $st->fetch(); if (!$r) fail('Angebot nicht gefunden', 404); return $r; }
/* Speichern: Summen werden auf dem Server nachgerechnet */
function of_save(array $u, array $b): array {
  of_tables(); $pid = (string)($b['project'] ?? ''); $p = valid_id($pid) ? project_row($pid) : null;
  if (!$p || $p['deleted'] || !can_see_project($u, $p)) fail('Kunde nicht gefunden', 404);
  $d = (array)($b['data'] ?? []); $pos = [];
  foreach (array_slice((array)($d['pos'] ?? []), 0, 300) as $x) {
    if (!is_array($x)) continue;
    $pos[] = ['item' => mb_substr((string)($x['item'] ?? ''), 0, 40), 'name' => mb_substr(trim((string)($x['name'] ?? '')), 0, 300), 'descr' => mb_substr(trim((string)($x['descr'] ?? '')), 0, 2000), 'qty' => round((float)($x['qty'] ?? 0), 2), 'unit' => mb_substr((string)($x['unit'] ?? 'Stk'), 0, 20),
      'price' => round((float)($x['price'] ?? 0), 4), 'tax' => in_array((float)($x['tax'] ?? 19), [0.0, 7.0, 19.0], true) ? (float)$x['tax'] : 19, 'pkg' => !empty($x['pkg']), 'pm' => ($x['pm'] ?? '') === 'brutto' ? 'brutto' : 'netto', 'pausch' => !empty($x['pausch']), 'cat' => mb_substr((string)($x['cat'] ?? ''), 0, 10), 'img' => preg_match('/^[A-Za-z0-9_-]{1,64}$/', (string)($x['img'] ?? '')) ? $x['img'] : '', 'power' => isset($x['power']) && is_numeric($x['power']) ? (float)$x['power'] : null];
  }
  $disc = max(0, min(100, (float)($d['discount'] ?? 0)));
  $net = 0; $tax = [];   // je Position netto oder brutto (Steuer enthalten)
  foreach ($pos as $x) { $t = $x['tax'] / 100; $l = $x['pm'] === 'brutto' ? $x['qty'] * round($x['price'] * (1 + $t), 2) / (1 + $t) : $x['qty'] * $x['price']; $l *= 1 - $disc / 100; $net += $l; $tax[(string)$x['tax']] = ($tax[(string)$x['tax']] ?? 0) + $l * $t; }
  $gross = $net + array_sum($tax);
  $data = ['pos' => $pos, 'discount' => $disc, 'intro' => mb_substr((string)($d['intro'] ?? ''), 0, 4000), 'outro' => mb_substr((string)($d['outro'] ?? ''), 0, 4000), 'valid' => preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($d['valid'] ?? '')) ? $d['valid'] : '', 'spoken' => mb_substr((string)($d['spoken'] ?? ''), 0, 4000), 'otype' => in_array($d['otype'] ?? '', ['pv', 'wp', 'pvwp'], true) ? $d['otype'] : 'pv', 'pay' => mb_substr((string)($d['pay'] ?? ''), 0, 4000), 'imgs' => !empty($d['imgs'])];
  $status = isset(OF_STATUS[$b['status'] ?? '']) ? $b['status'] : 'entwurf'; $title = mb_substr(trim((string)($b['title'] ?? '')), 0, 200) ?: 'Angebot';
  $id = (string)($b['id'] ?? '');
  if ($id !== '' && valid_id($id)) {
    $old = of_get($id); if ($old['project_id'] !== $pid) fail('Falscher Kunde', 400);
    db()->prepare('UPDATE offers SET title = ?, status = ?, data = ?, net = ?, gross = ?, updated_at = UTC_TIMESTAMP(), updated_by = ? WHERE id = ?')->execute([$title, $status, json_encode($data, JSON_UNESCAPED_UNICODE), round($net, 2), round($gross, 2), $u['id'], $id]);
    if ($old['status'] !== $status) { require_once __DIR__ . '/crm-lib.php'; crm_add_event($pid, (int)$u['id'], 'stufe', 'Angebot ' . $old['nr'] . ': ' . OF_STATUS[$status]); }
  } else {
    $id = 'o' . bin2hex(random_bytes(7)); $nr = of_number();
    db()->prepare('INSERT INTO offers (id, project_id, nr, title, status, data, net, gross, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')->execute([$id, $pid, $nr, $title, $status, json_encode($data, JSON_UNESCAPED_UNICODE), round($net, 2), round($gross, 2), $u['id'], $u['id']]);
    require_once __DIR__ . '/crm-lib.php'; crm_add_event($pid, (int)$u['id'], 'notiz', 'Angebot ' . $nr . ' angelegt: ' . number_format($gross, 2, ',', '.') . ' € brutto');
  }
  return of_out(of_get($id));
}

/* ---------- Angebots-Assistent (ersetzt die Spracheingabe) ----------
   Konfiguration je Angebotsart (pv/wp): Schritte in fester Reihenfolge.
   type: one = eine Auswahl, multi = mehrere, system = System → Wechselrichter → Speicher, auto = kommt automatisch dazu.
   items: feste Positionen (IDs), cats: alle Produkte dieser Kategorien, askQty/quick: Mengenabfrage, free/freeText: erste N Einheiten 100 % rabattiert,
   links: Anhänge {item, qty: 'same'|Zahl, place: 'after'|Schritt-ID} – z. B. Unterkonstruktion je Modul. */
function of_wiz_item(string $name, string $descr, string $unit, float $price, float $tax, string $cat): string {
  $st = db()->prepare('SELECT id FROM offer_items WHERE name = ? AND active = 1 LIMIT 1'); $st->execute([$name]); $id = $st->fetchColumn();
  if (!$id) { db()->prepare("INSERT INTO offer_items (kind, name, descr, unit, price, tax, cat, words) VALUES ('leistung', ?, ?, ?, ?, ?, ?, '')")->execute([$name, $descr, $unit, $price, $tax, $cat]); $id = db()->lastInsertId(); }
  return 'i' . $id;
}
function of_wizard(): array {
  of_tables(); $w = ld_get('assistent', null); if (is_array($w) && !empty($w['pv'])) return $w;
  /* Startbestand – Preise bitte unter „Leistungen“ anpassen */
  $I = fn(...$a) => of_wiz_item(...$a);
  $uk = $I('Unterkonstruktion je Modul', 'Dachhaken, Schienen und Befestigung je Modul', 'Stk', 45, 0, 'mont');
  $km = $I('Kleinmaterial je Modul', 'Kabel, Stecker, Kabelbinder, Befestigungsmaterial', 'Stk', 8, 0, 'mont');
  $dc = $I('DC-Montage je Modul', 'Montage der Module auf dem Dach inkl. DC-Verkabelung', 'Stk', 35, 0, 'mont');
  $g1 = $I('Gerüst bis 5 m Traufhöhe', 'Stellen, Vorhalten und Abbau je Gerüstseite', 'Stk', 450, 0, 'mont');
  $g2 = $I('Gerüst ab 5 m Traufhöhe', 'Stellen, Vorhalten und Abbau je Gerüstseite', 'Stk', 690, 0, 'mont');
  $el = $I('Elektro-Montage Pauschale', 'AC-Anschluss, Leitungen, Überspannungsschutz, Anpassung Zählerschrank', 'psch', 1450, 0, 'elek');
  $an = $I('Anmeldung Netzbetreiber und Marktstammdatenregister', 'Anmeldung der Anlage beim Netzbetreiber und im Marktstammdatenregister', 'psch', 290, 0, 'elek');
  $ib = $I('Inbetriebnahme und Einweisung', 'Inbetriebnahme der Anlage, Einrichtung der App, Einweisung des Kunden', 'psch', 350, 0, 'elek');
  $wb = $I('Wallbox 11 kW inkl. Installation', 'Wallbox 11 kW, Montage und Anschluss inkl. Leitung bis 15 m', 'Stk', 1490, 19, 'wb');
  $ns = $I('Notstrom-/Ersatzstrom-Umschaltung', 'Umschaltbox für Ersatzstrom bei Netzausfall inkl. Installation', 'Stk', 890, 0, 'elek');
  $sat = $I('Sat-Schüssel versetzen', 'Satellitenschüssel abbauen und an neuer Stelle montieren und ausrichten', 'psch', 180, 19, 'sonst');
  $dem = $I('Alte Module demontieren und entsorgen', 'Demontage vorhandener Module inkl. fachgerechter Entsorgung', 'Stk', 25, 19, 'mont');
  $wpm = $I('Montage Wärmepumpe inkl. Hydraulik', 'Aufstellung Außengerät, hydraulischer Anschluss, Pufferspeicher, Inbetriebnahme', 'psch', 4800, 19, 'wp');
  $wpd = $I('Demontage und Entsorgung Altanlage', 'Demontage der alten Heizung, fachgerechte Entsorgung', 'psch', 950, 19, 'wp');
  $wpe = $I('Elektroanschluss Wärmepumpe', 'Stromversorgung, Zähleranpassung, Steuerleitung', 'psch', 890, 19, 'wp');
  $w = ['pv' => ['steps' => [
      ['id' => 'mod', 'title' => 'Module', 'type' => 'one', 'cats' => ['mod'], 'items' => [], 'askQty' => true, 'quick' => [10, 16, 20, 24, 30, 40], 'links' => [['item' => $uk, 'qty' => 'same', 'place' => 'after'], ['item' => $km, 'qty' => 'same', 'place' => 'after'], ['item' => $dc, 'qty' => 'same', 'place' => 'elek']]],
      ['id' => 'geruest', 'title' => 'Gerüst', 'type' => 'one', 'cats' => [], 'items' => [$g1, $g2], 'askQty' => true, 'quick' => [1, 2, 3, 4], 'free' => ['item' => $g1, 'n' => 1, 'text' => 'Rabatt: erste Gerüstseite bis 5 m kostenlos'], 'optional' => true],
      ['id' => 'system', 'title' => 'System', 'type' => 'system', 'cats' => [], 'items' => [], 'askQty' => true, 'quick' => [1, 2, 3, 4]],
      ['id' => 'zusatz', 'title' => 'Zusatzkomponenten', 'type' => 'multi', 'cats' => [], 'items' => [$wb, $ns], 'askQty' => true, 'quick' => [1, 2], 'optional' => true],
      ['id' => 'elek', 'title' => 'Elektro-Montage', 'type' => 'auto', 'cats' => [], 'items' => [$el]],
      ['id' => 'anm', 'title' => 'Anmeldung & Inbetriebnahme', 'type' => 'auto', 'cats' => [], 'items' => [$an, $ib]],
      ['id' => 'extra', 'title' => 'Zusatzaufgaben', 'type' => 'multi', 'cats' => [], 'items' => [$sat, $dem], 'askQty' => true, 'quick' => [1, 2, 10, 20], 'optional' => true]]],
    'wp' => ['steps' => [
      ['id' => 'wp', 'title' => 'Wärmepumpe', 'type' => 'one', 'cats' => ['wp'], 'items' => [], 'askQty' => false, 'onlyProd' => true],
      ['id' => 'wpmont', 'title' => 'Montage', 'type' => 'auto', 'cats' => [], 'items' => [$wpm, $wpe]],
      ['id' => 'wpextra', 'title' => 'Zusatzaufgaben', 'type' => 'multi', 'cats' => [], 'items' => [$wpd], 'askQty' => true, 'quick' => [1], 'optional' => true]]],
    'systems' => [['id' => 's1', 'name' => 'EcoFlow'], ['id' => 's2', 'name' => 'Sigenergy'], ['id' => 's3', 'name' => 'Tesla'], ['id' => 's4', 'name' => 'E3/DC']]];
  db()->exec("UPDATE offer_packages SET active = 0 WHERE name IN ('Standard Photovoltaik', 'Standard Wärmepumpe')");   // ersetzt durch den Assistenten
  ld_set('assistent', $w, 0); return $w;
}
function of_wizard_save(array $u, array $w): array {
  $clean = function ($steps) {
    $out = [];
    foreach (array_slice((array)$steps, 0, 30) as $s) {
      if (!is_array($s)) continue; $id = preg_match('/^[\w-]{1,20}$/', (string)($s['id'] ?? '')) ? $s['id'] : 's' . bin2hex(random_bytes(3));
      $ids = fn($l) => array_values(array_filter(array_map('strval', (array)$l), fn($v) => (bool)preg_match('/^i\d+$/', $v)));
      $free = is_array($s['free'] ?? null) && preg_match('/^i\d+$/', (string)($s['free']['item'] ?? '')) && (float)($s['free']['n'] ?? 0) > 0 ? ['item' => $s['free']['item'], 'n' => (float)$s['free']['n'], 'text' => mb_substr((string)($s['free']['text'] ?? ''), 0, 120)] : null;
      $out[] = ['id' => $id, 'title' => mb_substr(trim((string)($s['title'] ?? '')), 0, 60) ?: 'Schritt', 'type' => in_array($s['type'] ?? '', ['one', 'multi', 'system', 'auto'], true) ? $s['type'] : 'one',
        'cats' => array_values(array_filter((array)($s['cats'] ?? []), fn($k) => isset(OF_CATS[$k]))), 'items' => $ids($s['items'] ?? []), 'askQty' => !empty($s['askQty']), 'optional' => !empty($s['optional']), 'onlyProd' => !empty($s['onlyProd']),
        'quick' => array_values(array_slice(array_filter(array_map('floatval', (array)($s['quick'] ?? [])), fn($v) => $v > 0), 0, 8)), 'free' => $free,
        'links' => array_values(array_filter(array_map(fn($l) => is_array($l) && preg_match('/^i\d+$/', (string)($l['item'] ?? '')) ? ['item' => $l['item'], 'qty' => ($l['qty'] ?? '') === 'same' ? 'same' : max(0, (float)($l['qty'] ?? 1)), 'place' => preg_match('/^[\w-]{1,20}$/', (string)($l['place'] ?? '')) ? $l['place'] : 'after'] : null, (array)($s['links'] ?? []))))];
    }
    return $out;
  };
  $sys = [];
  foreach (array_slice((array)($w['systems'] ?? []), 0, 30) as $x) if (is_array($x) && trim((string)($x['name'] ?? '')) !== '') $sys[] = ['id' => preg_match('/^[\w-]{1,20}$/', (string)($x['id'] ?? '')) ? $x['id'] : 's' . bin2hex(random_bytes(3)), 'name' => mb_substr(trim((string)$x['name']), 0, 60),
    'inv' => array_values(array_filter(array_map('strval', (array)($x['inv'] ?? [])), fn($v) => (bool)preg_match('/^i\d+$/', $v))), 'bat' => array_values(array_filter(array_map('strval', (array)($x['bat'] ?? [])), fn($v) => (bool)preg_match('/^i\d+$/', $v)))];
  $o = ['pv' => ['steps' => $clean($w['pv']['steps'] ?? [])], 'wp' => ['steps' => $clean($w['wp']['steps'] ?? [])], 'systems' => $sys];
  if (strlen(json_encode($o)) > 60000) fail('Zu viele Einträge.', 400);
  ld_set('assistent', $o, (int)$u['id']); return $o;
}
