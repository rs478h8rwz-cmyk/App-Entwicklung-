<?php
/* lumbra.desk – Zählerschrank-Check
   Grundlage: VDE-AR-N 4100 Abschnitt 4.4 (Erweiterung/Änderung bestehender Kundenanlagen), VDE FNN Hinweis
   „Zählerplätze in Bestandsanlagen“ (09/2023, Tabelle 1 = TAB 2023 Anhang G, Kapitel 6), DIN VDE 0603-2-1.
   Netzbetreiber zur Adresse über VNBdigital (BDEW-Plattform), TAB je Netzbetreiber als pflegbare Liste. */
declare(strict_types=1);

function zs_tables(): void {
  static $done = false; if ($done) return; $done = true;
  db()->exec("CREATE TABLE IF NOT EXISTS zs_refs (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, photo VARCHAR(40) NOT NULL, label VARCHAR(16) NOT NULL, answers TEXT NOT NULL, note TEXT NOT NULL, check_id INT UNSIGNED NULL, active TINYINT(1) NOT NULL DEFAULT 1, created_by INT UNSIGNED NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  db()->exec("CREATE TABLE IF NOT EXISTS zs_checks (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, project_id VARCHAR(40) NULL, title VARCHAR(200) NOT NULL DEFAULT '', result VARCHAR(12) NOT NULL DEFAULT '', data MEDIUMTEXT NOT NULL, photos VARCHAR(500) NOT NULL DEFAULT '', created_by INT UNSIGNED NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (project_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}
function zs_http(string $url, ?string $post = null): ?array {
  $ch = curl_init($url);
  $o = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_USERAGENT => 'LumbraDesk/' . LD_VERSION . ' (https://lumbradesk.de)', CURLOPT_HTTPHEADER => ['Accept-Language: de', 'Content-Type: application/json']];
  if ($post !== null) { $o[CURLOPT_POST] = true; $o[CURLOPT_POSTFIELDS] = $post; }
  curl_setopt_array($ch, $o); $b = curl_exec($ch); $c = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return $b !== false && $c === 200 ? json_decode((string)$b, true) : null;
}
/* Netzbetreiber (Strom, Niederspannung) zur Adresse: OpenStreetMap → Koordinate → VNBdigital */
function zs_vnb(string $q): array {
  $q = trim($q); if ($q === '') fail('Keine Adresse angegeben.', 400);
  $g = zs_http('https://nominatim.openstreetmap.org/search?' . http_build_query(['format' => 'jsonv2', 'q' => mb_substr($q, 0, 200), 'countrycodes' => 'de', 'limit' => 1]));
  if (!$g || empty($g[0]['lat'])) fail('Adresse nicht gefunden – bitte Straße, Hausnummer und Ort prüfen.', 404);
  $lat = (float)$g[0]['lat']; $lon = (float)$g[0]['lon'];
  $gql = 'https://www.vnbdigital.de/gateway/graphql';
  $r = zs_http($gql, json_encode(['query' => 'query($c:String){ vnb_coordinates(coordinates:$c){ vnbs(filter:{onlyNap:false,voltageTypes:[Niederspannung],withRegions:false}){ _id name types } } }', 'variables' => ['c' => sprintf('%.6F,%.6F', $lat, $lon)]]));
  $list = (array)($r['data']['vnb_coordinates']['vnbs'] ?? []);
  if (!$list) return ['lat' => $lat, 'lon' => $lon, 'found' => false, 'vnb' => null, 'tab' => null];
  $v = $list[0];
  $d = zs_http($gql, json_encode(['query' => 'query($id:ID!){ vnb_vnb(id:$id){ ... on vnb_VNB { _id name website phone address postcode city contact } } }', 'variables' => ['id' => (string)$v['_id']]]));
  $x = (array)($d['data']['vnb_vnb'] ?? []);
  $vnb = ['id' => (string)$v['_id'], 'name' => (string)$v['name'], 'website' => (string)($x['website'] ?? ''), 'phone' => (string)($x['phone'] ?? ''), 'email' => (string)($x['contact'] ?? ''),
    'address' => trim(($x['address'] ?? '') . ', ' . ($x['postcode'] ?? '') . ' ' . ($x['city'] ?? ''), ', '), 'more' => array_map(fn($y) => (string)$y['name'], array_slice($list, 1, 3))];
  return ['lat' => $lat, 'lon' => $lon, 'found' => true, 'vnb' => $vnb, 'tab' => zs_tab_for($vnb['name'])];
}
/* TAB je Netzbetreiber – Startliste für die Region, im Check unter „TAB-Liste“ pflegbar */
function zs_tab_defaults(): array {
  return [
    ['match' => 'EWE NETZ', 'name' => 'EWE NETZ – TAB Niederspannung mit EWE-Ergänzungen', 'url' => 'https://www.ewe-netz.de/-/media/ewe-netz/downloads/2024_07_22_ewe_netz_tab-ns.pdf', 'note' => 'TAB NS Nord 2023 mit netzbetreiberspezifischen Ergänzungen am Ende des Dokuments. Messstellenbetreiber-Vorgaben zusätzlich beachten.'],
    ['match' => 'Westnetz', 'name' => 'Westnetz – Anforderungen des gMSB an Zählerplätze', 'url' => 'https://www.westnetz.de/content/dam/revu-global/westnetz/documents/bauen/ihr-weg-zum-netzanschluss/niederspannung/250901-anforderungen-hinweise-gmsb-zaehlerplaetze.pdf', 'note' => 'TAB 2023 (Bundesmusterwortlaut) mit Westnetz-Ergänzungen; Anforderungen des grundzuständigen Messstellenbetreibers an Zählerplätze.'],
    ['match' => 'Avacon', 'name' => 'Avacon Netz – Ergänzungen/Konkretisierungen zur TAB', 'url' => 'https://www.avacon-netz.de/content/dam/revu-global/avacon-netz/documents/Energie_anschliessen/Stromnetz/TAB/Erg%C3%A4nzungen%20Konkretisierungen%20BDEW%20TAB%20Avacon.pdf', 'note' => 'Technische Bedingungen des gMSB an Zählerplätze; verweist zusätzlich auf FNN-Hinweise (u. a. Messsysteme in Bestandsanlagen).'],
    ['match' => 'Westfalen Weser', 'name' => 'Westfalen Weser Netz – Ergänzende Bestimmungen zu den TAB 2023', 'url' => 'https://www.ww-netz.com/fileadmin/WWN/Wir/Unternehmen/Netzdaten/Recht/Ergaenzende_Bestimmungen_zu_den_TAB_2023.pdf', 'note' => ''],
  ];
}
function zs_tabs(): array { $l = ld_get('zs_tabs', null); return is_array($l) ? $l : zs_tab_defaults(); }
function zs_tab_for(string $name): ?array { foreach (zs_tabs() as $t) if ($t['match'] !== '' && mb_stripos($name, $t['match']) !== false) return $t; return null; }
function zs_tabs_save(array $u, array $l): array {
  $o = [];
  foreach (array_slice($l, 0, 100) as $x) {
    if (!is_array($x) || trim((string)($x['match'] ?? '')) === '') continue;
    $url = trim((string)($x['url'] ?? '')); if ($url !== '' && !preg_match('#^https?://#i', $url)) fail('Der TAB-Link muss mit http:// oder https:// beginnen.', 400);
    $o[] = ['match' => mb_substr(trim((string)$x['match']), 0, 80), 'name' => mb_substr(trim((string)($x['name'] ?? '')), 0, 160), 'url' => mb_substr($url, 0, 500), 'note' => mb_substr((string)($x['note'] ?? ''), 0, 1000)];
  }
  ld_set('zs_tabs', $o, (int)$u['id']); return $o;
}
/* Speichern: Antworten, Ergebnis und bis zu 3 Fotos (JPEG als data-URL, vom Gerät verkleinert) */
function zs_save(array $u, array $b): array {
  zs_tables(); $pid = (string)($b['project'] ?? ''); $pname = '';
  if ($pid !== '') { $p = project_row($pid); if (!valid_id($pid) || !$p || $p['deleted']) fail('Kunde nicht gefunden.', 400); $pname = $p['name']; } else $pid = null;
  $res = in_array($b['result'] ?? '', ['ok', 'fix', 'neu', 'pruefen'], true) ? (string)$b['result'] : 'pruefen';
  $data = $b['data'] ?? []; if (!is_array($data)) $data = []; $json = json_encode($data, JSON_UNESCAPED_UNICODE); if (strlen($json) > 200000) fail('Daten zu groß.', 400);
  $ids = [];
  foreach (array_slice((array)($b['photos'] ?? []), 0, 3) as $ph) {
    if (!is_string($ph) || !preg_match('#^data:image/jpeg;base64,([A-Za-z0-9+/=]+)$#', $ph, $m)) continue;
    $bin = base64_decode($m[1], true); if ($bin === false || strlen($bin) > 4 * 1024 * 1024 || substr($bin, 0, 3) !== "\xFF\xD8\xFF") continue;
    $id = 'zs-' . bin2hex(random_bytes(8)); $f = files_dir() . '/' . $id;
    file_put_contents($f . '.bin', $bin); file_put_contents($f . '.json', json_encode(['type' => 'image/jpeg', 'name' => $id . '.jpg', 'size' => strlen($bin)]));
    $ids[] = $id;
  }
  $title = mb_substr(trim((string)($b['title'] ?? '')), 0, 200) ?: ($pname ?: 'Zählerschrank-Check');
  db()->prepare('INSERT INTO zs_checks (project_id, title, result, data, photos, created_by) VALUES (?, ?, ?, ?, ?, ?)')->execute([$pid, $title, $res, $json, implode(',', $ids), $u['id']]);
  $id = (int)db()->lastInsertId();
  if ($pid) { try { require_once __DIR__ . '/crm-lib.php'; $L = ['ok' => 'passt', 'fix' => 'weiter nutzbar nach Ertüchtigung', 'neu' => 'neuer Zählerschrank erforderlich', 'pruefen' => 'vor Ort prüfen'];
    crm_add_event($pid, (int)$u['id'], 'notiz', 'Zählerschrank-Check: ' . $L[$res] . (!empty($data['fields']) ? ' · Empfehlung ' . $data['fields'] . '-feldig' : '') . (!empty($data['vnb']) ? ' · Netzbetreiber ' . $data['vnb'] : '')); } catch (Throwable $e) {} }
  return zs_get($u, $id);
}
function zs_out(array $r): array {
  $n = user_names();
  return ['id' => (int)$r['id'], 'project' => $r['project_id'], 'title' => $r['title'], 'result' => $r['result'], 'data' => json_decode($r['data'], true) ?: [], 'photos' => array_values(array_filter(explode(',', $r['photos']))), 'by' => $n[(int)$r['created_by']] ?? '', 'at' => $r['created_at']];
}
function zs_get(array $u, int $id): array {
  zs_tables(); $st = db()->prepare('SELECT * FROM zs_checks WHERE id = ?'); $st->execute([$id]); $r = $st->fetch(); if (!$r) fail('Check nicht gefunden.', 404);
  if ($r['project_id']) { $p = project_row($r['project_id']); if ($p && !can_see_project($u, $p) && $u['role'] !== 'monteur') fail('Keine Berechtigung.', 403); }
  return zs_out($r);
}
function zs_list(array $u, string $pid): array {
  zs_tables();
  if ($pid !== '') { $st = db()->prepare('SELECT * FROM zs_checks WHERE project_id = ? ORDER BY id DESC LIMIT 50'); $st->execute([$pid]); }
  else $st = db()->query('SELECT * FROM zs_checks ORDER BY id DESC LIMIT 50');
  return array_map(fn($r) => ['id' => (int)$r['id'], 'project' => $r['project_id'], 'title' => $r['title'], 'result' => $r['result'], 'at' => $r['created_at'], 'fields' => (json_decode($r['data'], true) ?: [])['fields'] ?? null], $st->fetchAll());
}

/* ---------- KI-Bildanalyse (Claude, Messages API per curl – auf IONOS ohne Composer) ----------
   Schlüssel nur auf dem Server: ld_settings „ai_key“ (unter System eintragbar) oder Umgebungsvariable ANTHROPIC_API_KEY. */
const ZS_AI_MODEL = 'claude-opus-5-5';
function zs_ai_key(): string { $k = (string)ld_get('ai_key', ''); if ($k === '') $k = (string)(getenv('ANTHROPIC_API_KEY') ?: ''); return $k; }
function zs_ai_status(): array { $k = zs_ai_key(); return ['on' => $k !== '', 'hint' => $k !== '' ? '…' . substr($k, -4) : '']; }
function zs_ai_key_save(array $u, string $k): array {
  $k = trim($k); if ($k !== '' && !preg_match('/^sk-ant-[A-Za-z0-9_-]{20,}$/', $k)) fail('Das sieht nicht wie ein Anthropic-API-Schlüssel aus (beginnt mit „sk-ant-“).', 400);
  ld_set('ai_key', $k, (int)$u['id']); return zs_ai_status();
}
function zs_ai_schema(): array {
  $e = fn(array $v) => ['type' => 'string', 'enum' => $v];
  return ['type' => 'object', 'additionalProperties' => false,
    'required' => ['bau', 'nar', 'aar', 'aarVert', 'trenn', 'zust', 'apz', 'rfz', 'hut', 'spd', 'verd', 'nl', 'phase', 'platz', 'bereich', 'ort', 'zaehlerplaetze', 'freie_zaehlerplaetze', 'zaehlerart', 'befunde', 'gesamt', 'kurzfazit'],
    'properties' => [
      'verd' => $e(['ja', 'nein', 'unklar']), 'nl' => $e(['ja', 'nein', 'unklar']), 'phase' => $e(['drei', 'ein', 'unklar']),
      'platz' => $e(['frei', 'anbau', 'nein', 'unklar']), 'bereich' => $e(['ja', 'nein', 'unklar']), 'ort' => $e(['nein', 'ja', 'unklar']),
      'bau' => $e(['tafel_offen', 'tafel_43853', 'tafel_vors', 's43870', 's0603', 's4100', 'unklar']),
      'nar' => $e(['300', '150', 'unklar']), 'aar' => $e(['300', '150', 'unklar']), 'aarVert' => $e(['ja', 'nein', 'unklar']),
      'trenn' => $e(['sh', 'hs', 'nein', 'unklar']), 'zust' => $e(['gut', 'maengel', 'brand']),
      'apz' => $e(['ja', 'nachr', 'nein', 'unklar']), 'rfz' => $e(['ja', 'nachr', 'nein', 'unklar']), 'hut' => $e(['2', '1', '0', 'nachr', 'unklar']), 'spd' => $e(['ja', 'nein', 'unklar']),
      'zaehlerplaetze' => ['type' => 'integer'], 'freie_zaehlerplaetze' => ['type' => 'integer'], 'zaehlerart' => ['type' => 'string'],
      'befunde' => ['type' => 'array', 'items' => ['type' => 'object', 'additionalProperties' => false, 'required' => ['punkt', 'status', 'text'], 'properties' => ['punkt' => ['type' => 'string'], 'status' => $e(['ok', 'mangel', 'unklar']), 'text' => ['type' => 'string']]]],
      'gesamt' => $e(['konform', 'nicht_konform', 'unklar']), 'kurzfazit' => ['type' => 'string']]];
}
const ZS_AI_SYSTEM = <<<'TXT'
Du bist Elektromeister und bewertest Fotos von Zählerschränken in deutschen Wohngebäuden für einen Fachbetrieb, der PV-Anlagen, Speicher, Wärmepumpen und Wallboxen installiert. Antworte auf Deutsch.

Grundlagen: VDE-AR-N 4100 Abschnitt 4.4, VDE FNN Hinweis „Zählerplätze in Bestandsanlagen“ (09/2023): Zählertafeln (offen, DIN 43853, auch mit Vorsicherung) dürfen bei Leistungserhöhung, Erzeugungsanlagen oder Ladeeinrichtungen nicht weiter verwendet werden. Zählerplätze nach DIN 43870 nur mit 300 mm netzseitigem (unterem) Anschlussraum und flexibler Verdrahtung mind. 10 mm²; DIN VDE 0603 mit selektivem SH-Schalter; der anlagenseitige (obere) Anschlussraum darf kein Stromkreisverteiler sein.

Betriebsvorgabe des Fachbetriebs (ohne diese keine Anmeldung/Umsetzung): Im vorhandenen Zählerschrank müssen ein APZ-Feld (Raum für den Abschlusspunkt Zählerplatz), ein RfZ-Feld (Raum für Zusatzanwendungen, oberhalb des Zählerplatzes) und mindestens 2 Hutschienen im anlagenseitigen Anschlussraum oberhalb des Zählerplatzes vorhanden sein.

So sehen die Fälle typischerweise aus:
- NICHT konform: Zählerfelder nach DIN 43870 mit geschlossenen Kunststoff-Abdeckungen oben und unten (150/300 mm), schwarzer Ferraris-Zähler am Zählerkreuz, oben nur eine kurze Abdeckung mit 3-poligem SLS/Vorsicherung (nur 1 Hutschiene), kein gelochtes APZ-Feld, kein RfZ; daneben Verteilerfelder mit LS-Schaltern; oft leere Dreipunkt-Zählerplätze.
- Konform: neuerer Zählerschrank (VDE-AR-N 4100) – oberhalb des Zählerplatzes offener anlagenseitiger Anschlussraum mit mehreren Hutschienen (SLS/Hauptschalter, Klemmen, ggf. Steuer-/Messgeräte); das APZ-Feld sitzt UNTEN (gelochte Lochblech-Montageplatte im unteren Bereich, oft mit Netzwerkkabel), darüber der RfZ-Bereich; unten netzseitig SH-Schalter, Sammelschienen und Überspannungsschutz (oft rotes oder graues Modul). Der Zähler selbst darf noch ein Ferraris-Zähler auf Dreipunkt-Adapter sein – entscheidend ist der Aufbau.

Hinweise zu den einzelnen Feldern:
- spd (Überspannungsschutz): Achte gezielt auf den unteren (netzseitigen) Anschlussraum. Ein Überspannungs-Schutzgerät Typ 1/Kombiableiter ist ein breites Reiheneinbaugerät (3–4 Teilungseinheiten), oft ROT (z. B. DEHN) oder GRAU/WEISS mit Sichtfenster bzw. grün/roter Anzeige, meist direkt neben der Hauptleitungsabzweigklemme oder dem SH-Schalter, manchmal auch im Verteilerfeld. „ja“ wenn ein solches Modul sichtbar ist, „nein“ wenn der untere Anschlussraum offen und ohne solches Modul sichtbar ist, „unklar“ wenn er abgedeckt ist.
- apz: Das APZ-Feld befindet sich UNTEN im Schrank (gelochte Montageplatte bzw. Feld mit Datenanschluss/Netzwerkkabel), nicht oben.
- verd: „ja“ wenn die Zählerplatzverdrahtung als flexible Einzeladern (H07V-K) mit großem Querschnitt (ca. 10 mm², deutlich dicker als Leitungen der Stromkreise) erkennbar ist; „nein“ bei dünnen oder starren Adern; sonst „unklar“.
- nl: „ja“ wenn der Neutralleiter (blau) erkennbar direkt vom unteren zum oberen Anschlussraum läuft bzw. ein moderner Zählerplatz mit Zählersteckklemme/BKE vorliegt; „nein“ wenn er sichtbar über den Zähler geführt wird.
- phase: „drei“ bei Drehstromzähler, 3-poligem SLS/Hauptschalter oder 3 Außenleitern; „ein“ nur bei eindeutig einphasigem Zähler.
- platz: „frei“ wenn ein unbelegter Zählerplatz (leeres Zählerfeld mit Zählerkreuz/Adapter) sichtbar ist; „anbau“ wenn seitlich sichtbar Wandfläche für ein weiteres Feld frei ist; „nein“ wenn eindeutig kein Platz.
- bereich: „nein“ wenn direkt vor dem Schrank Regale, Geräte oder Gegenstände stehen, die den Arbeitsbereich (1,2 m) dauerhaft verstellen; „ja“ wenn der Bereich frei wirkt.
- ort: „ja“ wenn erkennbar Treppenhaus/Flur als Rettungsweg; „nein“ bei Keller-, Technik- oder Hausanschlussraum; sonst „unklar“.
Wähle möglichst eine konkrete Antwort, wenn das Foto sie mit hoher Wahrscheinlichkeit belegt; „unklar“ nur, wenn es wirklich nicht erkennbar ist.

Bewerte nur, was auf den Fotos zu sehen ist. Wenn etwas nicht sicher erkennbar ist, antworte „unklar“ und schreibe in den Befund, was vor Ort zu prüfen ist. Erfinde nichts. Befunde kurz und konkret (ein Satz), je Punkt: Bauart, netzseitiger Anschlussraum, anlagenseitiger Anschlussraum/Hutschienen, APZ-Feld, RfZ-Feld, Trennvorrichtung, Überspannungsschutz, Zustand, freie Zählerplätze. „gesamt“ = konform nur wenn APZ, RfZ und 2 Hutschienen sicher vorhanden sind und nichts Gravierendes dagegen spricht.
TXT;
/* ---------- Lernbilder: bestätigte Beispiele, die bei jeder Analyse mitgeschickt werden ---------- */
function zs_refs_seed(): void {
  if (ld_get('zs_refs_seed', null)) return; $f = __DIR__ . '/seed/zs/refs.json'; if (!is_file($f)) return;
  $l = json_decode((string)file_get_contents($f), true) ?: [];
  foreach ($l as $i => $x) {
    $src = __DIR__ . '/seed/zs/' . $x['img']; if (!is_file($src)) continue;
    $id = 'zsref-seed-' . ($i + 1); $dst = files_dir() . '/' . $id;
    if (!is_file($dst . '.bin')) { copy($src, $dst . '.bin'); file_put_contents($dst . '.json', json_encode(['type' => 'image/jpeg', 'name' => $x['img'], 'size' => filesize($src)])); }
    db()->prepare('INSERT INTO zs_refs (photo, label, answers, note) VALUES (?, ?, ?, ?)')->execute([$id, $x['label'], json_encode($x['a'], JSON_UNESCAPED_UNICODE), $x['note']]);
  }
  ld_set('zs_refs_seed', 1, 0);
}
function zs_refs(bool $onlyActive = false): array {
  zs_tables(); zs_refs_seed();
  $rows = db()->query('SELECT * FROM zs_refs' . ($onlyActive ? ' WHERE active = 1' : '') . ' ORDER BY id')->fetchAll();
  return array_map(fn($r) => ['id' => (int)$r['id'], 'photo' => $r['photo'], 'label' => $r['label'], 'a' => json_decode($r['answers'], true) ?: [], 'note' => $r['note'], 'active' => (bool)$r['active'], 'check' => $r['check_id'] ? (int)$r['check_id'] : null], $rows);
}
/* Aus einem gespeicherten Check: erstes Foto (Gesamtansicht), die endgültigen Antworten und eine Notiz */
function zs_ref_add(array $u, int $checkId, string $label, string $note): array {
  $c = zs_get($u, $checkId); if (!$c['photos']) fail('Der Check hat kein Foto.', 400);
  if (!in_array($label, ['konform', 'nicht_konform'], true)) fail('Bitte „konform“ oder „nicht konform“ wählen.', 400);
  $kinds = (array)($c['data']['kinds'] ?? []); $i = array_search('gesamt', $kinds, true); $photo = $c['photos'][$i === false ? 0 : (int)$i] ?? $c['photos'][0];
  db()->prepare('INSERT INTO zs_refs (photo, label, answers, note, check_id, created_by) VALUES (?, ?, ?, ?, ?, ?)')->execute([$photo, $label, json_encode((array)($c['data']['a'] ?? []), JSON_UNESCAPED_UNICODE), mb_substr(trim($note), 0, 1500), $checkId, $u['id']]);
  return zs_refs();
}
function zs_ref_set(int $id, ?bool $active, bool $del): array {
  zs_tables(); if ($del) db()->prepare('DELETE FROM zs_refs WHERE id = ?')->execute([$id]); elseif ($active !== null) db()->prepare('UPDATE zs_refs SET active = ? WHERE id = ?')->execute([$active ? 1 : 0, $id]);
  return zs_refs();
}
function zs_ai_examples(): array {
  $L = ['bau' => 'Bauart', 'nar' => 'netzseitiger Anschlussraum (mm)', 'aar' => 'anlagenseitiger Anschlussraum (mm)', 'aarVert' => 'Stromkreise im AAR', 'apz' => 'APZ-Feld', 'rfz' => 'RfZ-Feld', 'hut' => 'Hutschienen im AAR', 'spd' => 'Überspannungsschutz', 'trenn' => 'Trennvorrichtung', 'phase' => 'Anschluss', 'platz' => 'Platz für weiteren Zählerplatz', 'zust' => 'Zustand', 'verd' => 'Verdrahtung 10 mm²', 'nl' => 'Neutralleiter durchgehend'];
  $refs = array_slice(array_reverse(zs_refs(true)), 0, 10); $out = [];
  foreach (array_reverse($refs) as $n => $r) {
    $f = files_dir() . '/' . $r['photo'] . '.bin'; if (!is_file($f)) continue; $bin = (string)file_get_contents($f); if (strlen($bin) > 3 * 1024 * 1024) continue;
    $merk = []; foreach ($r['a'] as $k => $v) if (isset($L[$k]) && $v !== '' && $v !== 'unklar') $merk[] = $L[$k] . ': ' . $v;
    $out[] = ['type' => 'image', 'source' => ['type' => 'base64', 'media_type' => 'image/jpeg', 'data' => base64_encode($bin)]];
    $out[] = ['type' => 'text', 'text' => 'Lernbild ' . ($n + 1) . ' – vom Fachbetrieb bestätigt: ' . ($r['label'] === 'konform' ? 'KONFORM' : 'NICHT KONFORM') . '. Merkmale: ' . implode('; ', $merk) . '. ' . $r['note']];
  }
  if ($out) $out[count($out) - 1]['cache_control'] = ['type' => 'ephemeral'];   // gleichbleibender Vorspann → Zwischenspeicher, spart Kosten
  return $out;
}
function zs_ai(array $photos): array {
  $key = zs_ai_key(); if ($key === '') fail('Die KI-Bildanalyse ist noch nicht eingerichtet (System → KI-Bildanalyse).', 400);
  $content = [];
  foreach (array_slice($photos, 0, 4) as $i => $ph) {
    if (!is_string($ph) || !preg_match('#^data:image/jpeg;base64,([A-Za-z0-9+/=]+)$#', $ph, $m)) continue;
    if (strlen($m[1]) > 6 * 1024 * 1024) continue;
    $content[] = ['type' => 'image', 'source' => ['type' => 'base64', 'media_type' => 'image/jpeg', 'data' => $m[1]]];
  }
  if (!$content) fail('Kein Foto übergeben.', 400);
  $ex = zs_ai_examples();
  if ($ex) $content = array_merge([['type' => 'text', 'text' => 'Zuerst bestätigte Lernbilder des Fachbetriebs als Vergleich (nicht bewerten):']], $ex, [['type' => 'text', 'text' => 'Jetzt der zu bewertende Zählerschrank:']], $content);
  $content[] = ['type' => 'text', 'text' => 'Bewerte diesen Zählerschrank anhand der Fotos. Vergleiche mit den Lernbildern – besonders APZ-Feld (unten), RfZ, Hutschienen im AAR und Überspannungsschutz.'];
  $req = ['model' => ZS_AI_MODEL, 'max_tokens' => 16000, 'system' => ZS_AI_SYSTEM, 'fallbacks' => 'default',
    'output_config' => ['effort' => 'medium', 'format' => ['type' => 'json_schema', 'schema' => zs_ai_schema()]],
    'messages' => [['role' => 'user', 'content' => $content]]];
  $ch = curl_init('https://api.anthropic.com/v1/messages');
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($req), CURLOPT_TIMEOUT => 170, CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'x-api-key: ' . $key, 'anthropic-version: 2026-10-21', 'anthropic-beta: server-side-fallback-2026-07-01']]);
  @set_time_limit(200);
  $b = curl_exec($ch); $c = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); $err = curl_error($ch); curl_close($ch);
  if ($b === false) fail('KI-Bildanalyse nicht erreichbar: ' . $err, 502);
  $r = json_decode((string)$b, true);
  if ($c !== 200) { $msg = (string)($r['error']['message'] ?? ''); fail($c === 401 ? 'Der API-Schlüssel wurde abgelehnt – bitte unter System prüfen.' : ($c === 429 || $c === 529 ? 'Die KI ist gerade ausgelastet – bitte gleich noch einmal versuchen.' : 'KI-Bildanalyse fehlgeschlagen (' . $c . ')' . ($msg ? ': ' . $msg : '')), 502); }
  if (($r['stop_reason'] ?? '') === 'refusal') fail('Die KI hat die Analyse abgelehnt – bitte die Fragen von Hand beantworten.', 422);
  if (($r['stop_reason'] ?? '') === 'max_tokens') fail('Die KI-Antwort war unvollständig – bitte erneut versuchen.', 502);
  $txt = ''; foreach ((array)($r['content'] ?? []) as $bl) if (($bl['type'] ?? '') === 'text') $txt .= $bl['text'];
  $out = json_decode($txt, true); if (!is_array($out)) fail('Die KI-Antwort war nicht lesbar – bitte erneut versuchen.', 502);
  $out['model'] = (string)($r['model'] ?? ZS_AI_MODEL); return $out;
}

/* Prüfbericht (PDF) des Checks beim Kunden ablegen – erscheint in „Dateien & Fotos“ und an der Checkliste */
function zs_pdf(array $u, array $b): void {
  zs_tables(); require_once __DIR__ . '/crm-lib.php';
  $st = db()->prepare('SELECT project_id, title FROM zs_checks WHERE id = ?'); $st->execute([(int)($b['id'] ?? 0)]); $r = $st->fetch();
  if (!$r || !$r['project_id']) return;
  $bin = base64_decode((string)($b['data'] ?? ''), true); if ($bin === false || $bin === '' || substr($bin, 0, 4) !== '%PDF') fail('PDF leer oder beschädigt.', 400);
  if (strlen($bin) > 15 * 1024 * 1024) fail('Die PDF ist größer als 15 MB.', 400);
  crm_file_store($r['project_id'], (int)$u['id'], (string)($b['name'] ?? 'Zaehlerschrank-Check.pdf'), 'application/pdf', $bin, 'zs');
}
