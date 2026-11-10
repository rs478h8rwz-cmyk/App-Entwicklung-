<?php
/* LumbraDesk – Datensicherung
   Eine Sicherung ist eine ZIP-Datei in private/backups/ mit:
   - db/<tabelle>.json  (Tabellenaufbau + alle Zeilen)
   - files/…            (Bilder der Firmen-Einstellungen)
   - pfiles/…           (Angebote, Fotos, Unterschriften der Kunden)
   Zugangsdaten (config.php, mail.php) sind bewusst NICHT enthalten. */
declare(strict_types=1);

const BACKUP_KEEP = 14;
const BACKUP_TABLES = ['users', 'projects', 'company_config', 'audit_log', 'crm_events', 'crm_tasks'];

function backup_dir(): string {
  $d = __DIR__ . '/backups';
  if (!is_dir($d)) { @mkdir($d, 0700, true); @file_put_contents($d . '/.htaccess', "Require all denied\n"); }
  return $d;
}
function backup_status(): array { $f = backup_dir() . '/status.json'; return is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : []; }
function backup_list(): array {
  $out = [];
  foreach (glob(backup_dir() . '/lumbradesk-*.zip') ?: [] as $f) $out[] = ['name' => basename($f), 'size' => filesize($f), 'at' => gmdate('Y-m-d H:i:s', filemtime($f))];
  usort($out, fn($a, $b) => strcmp($b['name'], $a['name']));
  return $out;
}
function backup_add_dir(ZipArchive $z, string $dir, string $prefix): int {
  if (!is_dir($dir)) return 0; $n = 0;
  $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
  foreach ($it as $f) { if (!$f->isFile() || $f->getFilename() === '.htaccess') continue; $z->addFile($f->getPathname(), $prefix . '/' . substr($f->getPathname(), strlen($dir) + 1)); $n++; }
  return $n;
}
function run_backup(string $why = 'manuell'): array {
  @set_time_limit(0); @ignore_user_abort(true);
  if (!class_exists('ZipArchive')) throw new RuntimeException('ZIP-Unterstützung fehlt auf dem Server.');
  $lock = fopen(backup_dir() . '/.lock', 'c'); if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) throw new RuntimeException('Es läuft bereits eine Sicherung.');
  try {
    $name = 'lumbradesk-' . gmdate('Y-m-d-His') . '.zip'; $tmp = backup_dir() . '/.' . $name . '.tmp'; $path = backup_dir() . '/' . $name;
    $z = new ZipArchive(); if ($z->open($tmp, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) throw new RuntimeException('Sicherung konnte nicht angelegt werden.');
    $rows = 0;
    foreach (BACKUP_TABLES as $t) {
      try { $cr = db()->query("SHOW CREATE TABLE `$t`")->fetch(); } catch (Throwable $e) { continue; }   // Tabelle gibt es (noch) nicht
      $data = db()->query("SELECT * FROM `$t`")->fetchAll(); $rows += count($data);
      $z->addFromString("db/$t.json", json_encode(['table' => $t, 'create' => $cr['Create Table'], 'rows' => $data], JSON_UNESCAPED_UNICODE));
    }
    $nf = backup_add_dir($z, __DIR__ . '/files', 'files') + backup_add_dir($z, __DIR__ . '/pfiles', 'pfiles');
    $z->addFromString('LIESMICH.txt', "LumbraDesk-Sicherung vom " . gmdate('d.m.Y H:i') . " (UTC)\nZurückspielen: LumbraDesk → System → Datensicherung.\nZugangsdaten (Datenbank, Postfach) sind nicht enthalten.\n");
    if (!$z->close()) throw new RuntimeException('Sicherung konnte nicht geschrieben werden.');
    rename($tmp, $path);
    /* alte Sicherungen aufräumen */
    $all = backup_list(); foreach (array_slice($all, BACKUP_KEEP) as $old) @unlink(backup_dir() . '/' . $old['name']);
    $st = ['last' => gmdate('Y-m-d H:i:s'), 'name' => $name, 'size' => filesize($path), 'rows' => $rows, 'files' => $nf, 'why' => $why];
    file_put_contents(backup_dir() . '/status.json', json_encode($st));
    return $st;
  } finally { flock($lock, LOCK_UN); fclose($lock); }
}
/* Zurückspielen: Tabellen ersetzen, Dateien ergänzen/überschreiben */
function restore_backup(string $name): array {
  @set_time_limit(0);
  if (!preg_match('/^lumbradesk-[0-9-]+\.zip$/', $name) || !is_file(backup_dir() . '/' . $name)) throw new RuntimeException('Sicherung nicht gefunden.');
  $z = new ZipArchive(); if ($z->open(backup_dir() . '/' . $name) !== true) throw new RuntimeException('Sicherung lässt sich nicht öffnen.');
  $tables = [];
  for ($i = 0; $i < $z->numFiles; $i++) { $n = $z->getNameIndex($i); if (preg_match('#^db/([a-z_]+)\.json$#', $n, $m) && in_array($m[1], BACKUP_TABLES, true)) $tables[$m[1]] = json_decode((string)$z->getFromIndex($i), true); }
  if (empty($tables['users'])) { $z->close(); throw new RuntimeException('In der Sicherung fehlen die Benutzer – Zurückspielen abgebrochen.'); }
  $pdo = db(); $n = 0;
  foreach ($tables as $t => $d) {
    $pdo->exec("DROP TABLE IF EXISTS `$t`"); $pdo->exec($d['create']);
    foreach ($d['rows'] as $r) {
      $cols = array_keys($r); $sql = "INSERT INTO `$t` (`" . implode('`,`', $cols) . "`) VALUES (" . implode(',', array_fill(0, count($cols), '?')) . ")";
      $pdo->prepare($sql)->execute(array_values($r)); $n++;
    }
  }
  $nf = 0;
  for ($i = 0; $i < $z->numFiles; $i++) {
    $nm = $z->getNameIndex($i);
    if (!preg_match('#^(files|pfiles)/[A-Za-z0-9_./-]+$#', $nm) || str_contains($nm, '..')) continue;
    $dest = __DIR__ . '/' . $nm; if (!is_dir(dirname($dest))) @mkdir(dirname($dest), 0700, true);
    file_put_contents($dest, $z->getFromIndex($i)); $nf++;
  }
  $z->close();
  return ['rows' => $n, 'files' => $nf];
}
/* Sicherheitsnetz ohne Cronjob: einmal täglich nach einer Anfrage im Hintergrund sichern */
function backup_if_due(): void {
  $s = backup_status(); if (!empty($s['last']) && strtotime($s['last'] . ' UTC') > time() - 26 * 3600) return;
  if (!function_exists('fastcgi_finish_request')) return;
  register_shutdown_function(function () { @fastcgi_finish_request(); try { run_backup('automatisch'); } catch (Throwable $e) { error_log('LumbraDesk Sicherung: ' . $e->getMessage()); } });
}
