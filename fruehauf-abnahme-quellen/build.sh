#!/bin/bash
# Baut die Abnahme-App: fügt die Quellen zu fruehauf-abnahme/index.html zusammen und schreibt sw.js
set -e
SP="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$SP/../fruehauf-abnahme" && pwd)"
cd "$SP/src"
cat 01-head.html 02-icons.js 03-core.js 04-schemas.js 05-ui.js 06-events.js 07-pdf.js 08-lumbra.js 99-end.html > "$APP/index.html"
python3 - "$SP" "$APP" <<'PY'
import re,os,json,time,sys
SP,APP=sys.argv[1],sys.argv[2]
s=open(APP+'/index.html').read()
js=re.findall(r'<script>\n(.*?)</script>',s,re.S)[-1]
open(SP+'/app.js','w').write(js)
ver=time.strftime('%Y%m%d%H%M%S')
core=['./','index.html','manifest.webmanifest','favicon.svg','icon-180.png','icon-192.png','icon-512.png','logo.png','vendor/fonts.css','vendor/tailwind.js','vendor/jspdf.umd.min.js']
core+=['vendor/fonts/'+f for f in sorted(os.listdir(APP+'/vendor/fonts'))]
t=open(SP+'/sw-template.js').read().replace('__VERSION__',ver).replace('__CORE__',json.dumps(core))
open(APP+'/sw.js','w').write(t)
PY
node --check "$SP/app.js"
echo BUILD OK
