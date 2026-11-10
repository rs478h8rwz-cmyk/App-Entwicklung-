<?php
/* LumbraDesk – Update-ZIP einspielen (überschreibt Programmdateien, Zugangsdaten bleiben)
   Erwarteter Aufbau der ZIP: public/… und private/… */
declare(strict_types=1);

function ld_apply_update(string $zipPath, string $base): array {
  if (!class_exists('ZipArchive')) throw new RuntimeException('ZIP-Unterstützung fehlt auf dem Server.');
  $z = new ZipArchive();
  if ($z->open($zipPath) !== true) throw new RuntimeException('Die Datei ist keine gültige ZIP.');
  $names = []; for ($i = 0; $i < $z->numFiles; $i++) $names[] = $z->getNameIndex($i);
  if (!in_array('public/index.html', $names, true) || !in_array('private/bootstrap.php', $names, true)) { $z->close(); throw new RuntimeException('Das ist kein LumbraDesk-Update (public/ und private/ fehlen).'); }
  $skip = ['private/config.php', 'private/setup_token.php', 'private/mail.php'];
  $n = 0;
  foreach ($names as $i => $nm) {
    if (str_contains($nm, '..') || str_starts_with($nm, '/') || str_contains($nm, '\\')) continue;
    if (!preg_match('#^(public|private)/#', $nm) || in_array($nm, $skip, true) || preg_match('#^private/(sessions|files|pfiles)/#', $nm)) continue;
    $dest = $base . '/' . $nm;
    if (str_ends_with($nm, '/')) { if (!is_dir($dest)) @mkdir($dest, 0755, true); continue; }
    if (!is_dir(dirname($dest))) @mkdir(dirname($dest), 0755, true);
    $data = $z->getFromIndex($i);
    if ($data === false || file_put_contents($dest . '.tmp', $data, LOCK_EX) === false || !rename($dest . '.tmp', $dest)) { $z->close(); throw new RuntimeException('Datei konnte nicht geschrieben werden: ' . $nm); }
    $n++;
  }
  $z->close();
  if (function_exists('opcache_reset')) @opcache_reset();
  return ['files' => $n];
}
