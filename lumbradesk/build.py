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

# Einmaliger Einrichtungs-Schlüssel (wird nach der Einrichtung gelöscht)
import secrets
TOKEN = secrets.token_urlsafe(12).replace('-', 'x').replace('_', 'y')
open(os.path.join(APP, 'private', 'setup_token.php'), 'w').write("<?php return '" + TOKEN + "';\n")
open(os.path.join(SP, 'dist', 'SCHLUESSEL.txt'), 'w').write(TOKEN + '\n')

# Für IONOS: alles in einem Webordner, private/ darin (per .htaccess gesperrt)
WEB = os.path.join(DIST, 'web')
shutil.copytree(os.path.join(APP, 'public'), WEB)
shutil.copytree(os.path.join(APP, 'private'), os.path.join(WEB, 'private'))

# ZIP für den IONOS-Upload (Dateien direkt im ZIP, ohne Oberordner) + Hilfsdatei zum Auspacken
z = os.path.join(ROOT, 'lumbradesk.zip')
for old in [z, os.path.join(ROOT, 'lumbradesk-ionos.zip')]:
    if os.path.exists(old): os.remove(old)
with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as f:
    for dp, dn, fn in os.walk(WEB):
        for n in fn:
            full = os.path.join(dp, n); f.write(full, os.path.relpath(full, WEB))
shutil.copy(os.path.join(SP, 'entpacken.php'), os.path.join(ROOT, 'entpacken.php'))
print('LUMBRADESK OK →', os.path.relpath(z, ROOT), '+ entpacken.php')

# Update-Paket für bestehende Installationen (Aufbau lumbradesk/public + lumbradesk/private):
# ohne Zugangsdaten und ohne Einrichtungs-Schlüssel – im Ordner „lumbradesk“ entpacken und überschreiben
u = os.path.join(ROOT, 'lumbradesk-update.zip')
if os.path.exists(u): os.remove(u)
with zipfile.ZipFile(u, 'w', zipfile.ZIP_DEFLATED) as f:
    for dp, dn, fn in os.walk(APP):
        for n in fn:
            if n in ('setup_token.php', 'config.php'): continue
            if os.path.relpath(dp, APP).replace(os.sep, '/').startswith('public/rechner/vendor'): continue   # Bibliotheken ändern sich nicht – liegen schon auf dem Server
            full = os.path.join(dp, n); f.write(full, os.path.relpath(full, APP))
print('UPDATE OK →', os.path.relpath(u, ROOT))
