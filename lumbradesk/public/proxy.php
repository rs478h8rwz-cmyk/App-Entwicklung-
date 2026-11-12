<?php
/* LumbraDesk – Weiterleitung für die Wirtschaftlichkeits-App (ersetzt die Netlify-Weiterleitungen)
   /wetter/…  → Open-Meteo (Wetter auf der Startseite)
   /pvgis/…   → PVGIS der EU (Solarertrag je Standort)
   Nur für angemeldete Benutzer, nur diese zwei Ziele. */
declare(strict_types=1);
require (is_dir(__DIR__ . '/private') ? __DIR__ . '/private' : __DIR__ . '/../private') . '/bootstrap.php';
start_session();
require_user();

$targets = ['wetter' => 'https://api.open-meteo.com/', 'pvgis' => 'https://re.jrc.ec.europa.eu/api/v5_2/'];
$svc = (string)($_GET['svc'] ?? ''); $path = (string)($_GET['path'] ?? '');
if (!isset($targets[$svc]) || !preg_match('#^[A-Za-z0-9_\-./]*$#', $path) || str_contains($path, '..')) fail('Unbekanntes Ziel', 404);
$q = $_GET; unset($q['svc'], $q['path']);
$url = $targets[$svc] . $path . ($q ? '?' . http_build_query($q) : '');

$ch = curl_init($url);
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 25, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_FOLLOWLOCATION => false, CURLOPT_USERAGENT => 'LumbraDesk', CURLOPT_HEADER => false]);
$body = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); $type = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);
if ($body === false) fail('Dienst nicht erreichbar', 502);
http_response_code($code ?: 502);
header('Content-Type: ' . ($type ?: 'application/json'));
header('Cache-Control: private, max-age=600');
echo $body;
