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

for q in ('fruehauf-energy-quellen', 'fruehauf-stempel-quellen', 'fruehauf-abnahme-quellen'):
    subprocess.run(['bash', os.path.join(ROOT, q, 'build.sh')], check=True, stdout=subprocess.DEVNULL)

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
# Stempeluhr und Abnahme: ebenfalls unverändert, mit Login-Schutz. Ihre Bibliotheken sind identisch mit denen
# der Wirtschaftlichkeit – der Webserver liefert sie aus rechner/vendor/ (Regel in public/.htaccess).
HT_APP = open(os.path.join(R, '.htaccess')).read()
for src, dst, perm in (('fruehauf-stempel', 'stempel', 'camera=(self), microphone=(), geolocation=(self), payment=()'),
                       ('fruehauf-abnahme', 'abnahme', 'camera=(self), microphone=(), geolocation=(), payment=()')):
    D = os.path.join(APP, 'public', dst)
    shutil.copytree(os.path.join(ROOT, src), D, ignore=shutil.ignore_patterns('_headers', '_redirects', 'LIESMICH.txt', 'vendor'))
    vs, vr = os.path.join(ROOT, src, 'vendor'), os.path.join(ROOT, 'fruehauf-energy', 'vendor')
    for dp, dn, fn in os.walk(vs):
        for n in fn:
            a = os.path.join(dp, n); b = os.path.join(vr, os.path.relpath(a, vs))
            assert os.path.isfile(b) and open(a, 'rb').read() == open(b, 'rb').read(), 'Bibliothek weicht ab: ' + a
    p2 = os.path.join(D, 'index.html'); t = open(p2, encoding='utf-8').read(); assert '<head>' in t
    open(p2, 'w', encoding='utf-8').write(t.replace('<head>', '<head>\n<script src="../guard.js"></script>', 1))
    open(os.path.join(D, '.htaccess'), 'w').write(HT_APP.replace('# Wirtschaftlichkeits-App (übernommen von Netlify)', '# ' + dst + ' (übernommen von Netlify)').replace('camera=(), microphone=(), geolocation=(self), payment=()', perm))

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
