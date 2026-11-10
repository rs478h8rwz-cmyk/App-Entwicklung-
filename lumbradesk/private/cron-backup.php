<?php
/* LumbraDesk – nächtliche Sicherung (IONOS → Hosting → Cronjobs → Skript: /lumbradesk/private/cron-backup.php) */
declare(strict_types=1);
if (PHP_SAPI !== 'cli' && !defined('LD_CRON')) { http_response_code(403); exit; }
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/backup-lib.php';
try { $s = run_backup('Cronjob'); echo 'Sicherung ok: ', $s['name'], ' (', round($s['size'] / 1048576, 1), " MB)\n"; }
catch (Throwable $e) { echo 'Sicherung fehlgeschlagen: ', $e->getMessage(), "\n"; exit(1); }
