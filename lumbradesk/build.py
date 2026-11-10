#!/usr/bin/env python3
"""LumbraDesk – baut das Paket für IONOS
   1. Wirtschaftlichkeits-App bauen (fruehauf-energy-quellen/build.sh)
   2. LumbraDesk (public + private) und die App unter public/rechner/ zusammenstellen
   3. Login-Schutz in die App einhängen, Webserver-Regeln ergänzen
   4. dist/ und lumbradesk-ionos.zip schreiben (ohne config.php – die liegt nur auf dem Server)"""
import os, re, shutil, subprocess, zipfile

SP = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SP)
DIST = os.path.join(SP, 'dist')
APP = os.path.join(DIST, 'lumbradesk')

subprocess.run(['bash', os.path.join(ROOT, 'fruehauf-energy-quellen', 'build.sh')], check=True)

if os.path.isdir(DIST): shutil.rmtree(DIST)
skip = shutil.ignore_patterns('config.php', 'sessions', '.DS_Store')
shutil.copytree(os.path.join(SP, 'public'), os.path.join(APP, 'public'), ignore=skip)
shutil.copytree(os.path.join(SP, 'private'), os.path.join(APP, 'private'), ignore=skip)

# Wirtschaftlichkeits-App unverändert übernehmen (nur Netlify-Dateien weglassen)
R = os.path.join(APP, 'public', 'rechner')
shutil.copytree(os.path.join(ROOT, 'fruehauf-energy'), R, ignore=shutil.ignore_patterns('_headers', '_redirects', 'LIESMICH.txt', 'diag.html'))
p = os.path.join(R, 'index.html'); s = open(p, encoding='utf-8').read()
assert '<head>' in s
s = s.replace('<head>', '<head>\n<script src="../guard.js"></script>', 1)
open(p, 'w', encoding='utf-8').write(s)

# Regeln für die App: gleiche Sicherheits-Header wie bisher bei Netlify (die App braucht Inline-Skripte)
open(os.path.join(R, '.htaccess'), 'w').write('''# Wirtschaftlichkeits-App (übernommen von Netlify)
<IfModule mod_headers.c>
  Header always set X-Robots-Tag "noindex, nofollow"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(self), payment=()"
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; connect-src 'self' data: blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
</IfModule>
<FilesMatch "^(index\\.html|sw\\.js)$">
  Header set Cache-Control "no-cache"
</FilesMatch>
<IfModule mod_mime.c>
  AddType application/manifest+json .webmanifest
</IfModule>
''')
v = os.path.join(R, 'vendor')
if os.path.isdir(v): open(os.path.join(v, '.htaccess'), 'w').write('<IfModule mod_headers.c>\n  Header set Cache-Control "public, max-age=31536000"\n</IfModule>\n')

# ZIP für den IONOS-Upload
z = os.path.join(ROOT, 'lumbradesk-ionos.zip')
if os.path.exists(z): os.remove(z)
with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as f:
    for dp, dn, fn in os.walk(APP):
        for n in fn:
            full = os.path.join(dp, n); f.write(full, os.path.relpath(full, DIST))
print('LUMBRADESK OK →', os.path.relpath(z, ROOT))
