#!/bin/bash
set -e
SP="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$SP/../fruehauf-energy" && pwd)"
cd $SP/src
ls 1[2-9]-*.js >/dev/null 2>&1 && EXTRA=$(ls 1[2-9]-*.js | sort) || EXTRA=""
cat 01-head.html 02-core.js 03-data.js 04-calc.js 05-parse.js 06-svg.js 07-ui.js 08-result.js 09-doc.js 09b-sales.js 10-pages.js $EXTRA 11-events.js > $APP/index.html
python3 - <<PY
import re,os,json,time
APP="$(cd "$SP/../fruehauf-energy" && pwd)"
VER=time.strftime('%Y%m%d%H%M%S')
s=open(APP+'/index.html').read().replace('__APPVER__',VER)
open(APP+'/index.html','w').write(s)
js=re.findall(r'<script>\n(.*?)</script>',s,re.S)[-1]
open('$SP/app.js','w').write(js)
core=['index.html','manifest.webmanifest','favicon.svg','icon-180.png','icon-192.png','icon-512.png','vendor/fonts.css','vendor/tailwind.js','vendor/pdf.min.js','vendor/pdf.worker.min.js','vendor/html2canvas.min.js','vendor/jspdf.umd.min.js','vendor/plz.json','vendor/plz-orte.json','vendor/qrcode.js']
core+=['vendor/fonts/'+f for f in sorted(os.listdir(APP+'/vendor/fonts'))]
t=open('$SP/sw-template.js').read().replace('__VERSION__',VER).replace('__SEMVER__',(re.search(r"version: '([\d.]+)'",open('$SP/src/17-whatsnew.js').read()) or [0,'?'])[1]).replace('__CORE__',json.dumps(core))
open(APP+'/sw.js','w').write(t)
PY
node --check $SP/app.js
echo BUILD OK
