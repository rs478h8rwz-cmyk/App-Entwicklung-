
/* =========================================================
   Persönliche Einstellungen (je Gerät, nicht Teil der Firmen-Konfiguration)
   ========================================================= */
let PERSONAL = { mode: null, profile: { name: '', role: 'Energieberater', phone: '', email: '', photo: '' }, tutorialDone: false, lastBackup: 0, keepAdmin: false };
const savePersonal = debounce(() => DB.put('kv', clone(PERSONAL), 'personal'), 250);
async function loadPersonal() {
  const v = await DB.get('kv', 'personal');
  if (v) PERSONAL = deepMerge(PERSONAL, v);
  if (PERSONAL.mode === 'studio') PERSONAL.mode = 'dark'; if (S.design.mode === 'studio') S.design.mode = 'dark';
  if (PERSONAL.mode) S.design.mode = PERSONAL.mode; else PERSONAL.mode = S.design.mode;
  if (PERSONAL.profile.photo) await loadFiles([PERSONAL.profile.photo]);
  if (PERSONAL.keepAdmin) UI.admin = true;
}
function setMode(m) { if (m === 'studio') m = 'dark'; S.design.mode = m; PERSONAL.mode = m; savePersonal(); applyTheme(); }
const _scope12 = scopeOf;
scopeOf = function (b) { if (b.startsWith('me:')) return { obj: PERSONAL, path: b.slice(3), kind: 'me' }; return _scope12(b); };
const _bset12 = bset;
bset = function (b, v) { if (b.startsWith('me:')) { if (b === 'me:mode') return setMode(v); setPath(PERSONAL, b.slice(3), v); savePersonal(); return; } _bset12(b, v); };

/* =========================================================
   Admin-Schutz (Passwort als PBKDF2-Hash, nie im Klartext)
   ========================================================= */
const ADMIN_DEFAULT = { salt: 'e60354ece663d120235ee047a1c36dad', hash: '58725329cf81a9b171d7c91652db4b9fb2a646c534eb3c3310d08d64da847edd', iter: 150000 };
const ADMIN_TABS = ['firma', 'berater', 'design', 'rabatt', 'foerderung', 'preise', 'dokument', 'ablauf', 'vergleiche', 'berechnung', 'optimistisch', 'admin'];
const hexBytes = h => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));
async function pbkdf2(pw, saltHex, iter) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: hexBytes(saltHex), iterations: iter }, key, 256);
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const adminCfg = () => (S.admin && S.admin.hash ? S.admin : ADMIN_DEFAULT);
async function checkAdmin(pw) { const a = adminCfg(); return (await pbkdf2(pw, a.salt, a.iter || 150000)) === a.hash; }
async function setAdminPassword(pw) { const salt = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join(''); S.admin = { salt, hash: await pbkdf2(pw, salt, 150000), iter: 150000 }; saveSettings(); }
function adminLockCard(tab) {
  return `<div class="card p-6 sm:p-8 max-w-lg"><div class="icon-box mb-4">${ic('gear', 18)}</div><h3 class="sec-t">Admin-Bereich</h3><p class="text-ink3 text-[14px] mt-1">Diese Einstellungen gelten für alle Berater und sind geschützt. Bitte das Admin-Passwort eingeben.</p>
    <form data-admin-form class="mt-5 space-y-3"><input type="password" class="inp" id="admin-pw" placeholder="Admin-Passwort" autocomplete="current-password"><label class="flex items-center gap-2 text-[13px] text-ink2"><input type="checkbox" id="admin-keep">Auf diesem Gerät entsperrt lassen</label><button class="btn-p w-full" type="submit">Entsperren</button></form>
    <p class="hint">Vertriebler ohne Passwort können Ansicht, eigenes Profil, Produkte und Datensicherung ändern.</p></div>`;
}
async function tryUnlock() {
  const pw = ($('#admin-pw') || {}).value || '';
  if (!pw) return;
  if (await checkAdmin(pw)) { UI.admin = true; if (($('#admin-keep') || {}).checked) { PERSONAL.keepAdmin = true; savePersonal(); } toast('Admin-Bereich entsperrt.'); render(); }
  else { toast('Passwort falsch.', 'err'); const el = $('#admin-pw'); if (el) { el.value = ''; el.focus(); } }
}
function lockAdmin() { UI.admin = false; PERSONAL.keepAdmin = false; savePersonal(); toast('Admin-Bereich gesperrt.'); go('einstellungen/ansicht'); }

/* =========================================================
   Teilen oder herunterladen (iPhone: „In Dateien sichern“ → iCloud Drive)
   ========================================================= */
async function shareOrDownload(blob, name) {
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return true; } catch (e) { if (e.name === 'AbortError') return false; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); return true;
}

/* =========================================================
   Firmen-Konfiguration (Admin exportiert, Vertriebler spielen ein)
   ========================================================= */
function configFileIds() { return [S.company.logoFile, S.design.cover.file, S.design.coverLogo.file, S.design.mark && S.design.mark.file, ...(S.company.advisors || []).map(a => a.photo), ...PRODUCTS.map(p => p.img)].filter(Boolean); }
async function exportConfig() {
  await loadFiles(configFileIds());
  const settings = clone(S); delete settings.design.mode;
  const out = { app: 'fruehauf-energy-config', version: 1, exported: new Date().toISOString(), settings, products: PRODUCTS, files: [] };
  for (const id of configFileIds()) { const f = FILES[id]; if (f) out.files.push({ id, name: f.name || '', type: f.type || '', data: await blobToDataURL(f.blob) }); }
  await shareOrDownload(new Blob([JSON.stringify(out)], { type: 'application/json' }), `Frühauf-Firmenkonfiguration_${isoToday()}.json`);
}
async function importConfig(file) {
  let d; try { d = JSON.parse(await file.text()); } catch (e) { return toast('Die Datei ist keine gültige Konfiguration.', 'err'); }
  if (!d || d.app !== 'fruehauf-energy-config') return toast(d && d.app === 'fruehauf-energy' ? 'Das ist eine Datensicherung, keine Firmen-Konfiguration.' : 'Die Datei ist keine Firmen-Konfiguration dieser App.', 'err');
  if (!(await confirmDlg('Firmen-Konfiguration einspielen?', `Stand ${new Date(d.exported).toLocaleDateString('de-DE')}. Firmendaten, Design, Förderung, Preise, Texte und Produkte werden übernommen. Ihre Kunden, Ihre Ansicht und Ihr Profil bleiben erhalten.`, 'Einspielen', false))) return;
  for (const f of d.files || []) await DB.put('files', { id: f.id, name: f.name, type: f.type, blob: await dataURLToBlob(f.data) });
  const mode = S.design.mode;
  S = deepMerge(clone(DEFAULT_SETTINGS), d.settings || {}); S.design.mode = mode;
  for (const pr of d.products || []) { const i = PRODUCTS.findIndex(x => x.id === pr.id); if (i >= 0) PRODUCTS[i] = pr; else PRODUCTS.push(pr); }
  await saveSettingsNow(); await saveProductsNow();
  await loadFiles(configFileIds()); applyTheme(); toast('Firmen-Konfiguration übernommen.'); render();
}

/* =========================================================
   Erinnerungen: Datensicherung und Nachfassen
   ========================================================= */
function backupBanner() {
  if (!PROJECTS.length) return '';
  const days = PERSONAL.lastBackup ? Math.floor((Date.now() - PERSONAL.lastBackup) / 864e5) : null;
  if (days !== null && days < 7) return '';
  return `<div class="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 mb-4" style="border-color:rgb(var(--s-rgb)/.45)"><div class="icon-box !text-yel-ink">${ic('db', 18)}</div><div class="flex-1"><div class="font-medium text-[15px]">${days === null ? 'Noch keine Datensicherung' : `Letzte Datensicherung vor ${days} Tagen`}</div><div class="text-[13px] text-ink3">Ihre Kunden liegen nur auf diesem Gerät. Eine Sicherung in ${backupWhere()} schützt vor Verlust.</div></div><button class="btn-p btn-sm" data-a="backup">${ic('download', 15)}Jetzt sichern</button></div>`;
}
const STATUS = { offen: ['Offen', 'var(--ink3)'], gesendet: ['Gesendet', 'var(--acc)'], unterschrieben: ['Unterschrieben', 'rgb(var(--p-rgb))'], verloren: ['Verloren', 'var(--old)'] };
const statusBadge = s => { const [l, c] = STATUS[s || 'offen']; return `<span class="badge bg-raised border border-line text-ink2"><span class="w-1.5 h-1.5 rounded-full" style="background:${c}"></span>${l}</span>`; };
function followUps() {
  const today = isoToday(), soon = addDays(today, 3), back = addDays(today, -7);
  return PROJECTS.filter(p => ['offen', 'gesendet'].includes(p.status || 'offen') && p.discount.on && p.discount.until && p.discount.until <= soon && p.discount.until >= back).sort((a, b) => a.discount.until.localeCompare(b.discount.until));
}
function followUpCard() {
  const list = followUps(); if (!list.length) return '';
  return `<div class="card p-4 sm:p-5 mb-4"><div class="flex items-center gap-3 mb-3"><div class="icon-box">${ic('clock', 18)}</div><div><div class="font-medium text-[15px]">Nachfassen</div><div class="text-[13px] text-ink3">Rabatt-Fristen, die bald enden oder gerade abgelaufen sind</div></div></div>
    <div class="divide-y divide-line">${list.map(p => { const d = p.discount.until, past = d < isoToday(); return `<a href="#/projekt/${p.id}/4" class="flex items-center gap-3 py-2.5 hover:bg-raised rounded-lg px-2 -mx-2"><span class="flex-1 min-w-0 truncate font-medium text-[14px]">${esc(p.customer.name || 'Kunde')}</span>${statusBadge(p.status)}<span class="mono text-[12px] ${past ? 'text-red-ink' : 'text-yel-ink'}">${past ? 'abgelaufen ' : 'bis '}${deDate(d)}</span></a>`; }).join('')}</div></div>`;
}
function statusFilterBar() {
  const counts = Object.fromEntries(Object.keys(STATUS).map(k => [k, PROJECTS.filter(p => (p.status || 'offen') === k).length]));
  const f = UI.statusFilter || 'alle';
  return `<div class="flex flex-wrap gap-2 mt-4">${[['alle', 'Alle', PROJECTS.length], ...Object.entries(STATUS).map(([k, [l]]) => [k, l, counts[k]]), ...(ARCHIVED.length ? [['archiv', 'Archiv', ARCHIVED.length]] : [])].map(([k, l, n]) => `<button class="chip ${f === k ? '!border-p !text-ink' : ''}" data-a="status-filter" data-v="${k}">${l} <span class="mono text-ink3">${n}</span></button>`).join('')}</div>`;
}
const statusMatch = p => !UI.statusFilter || UI.statusFilter === 'alle' || UI.statusFilter === 'archiv' || (p.status || 'offen') === UI.statusFilter;

/* =========================================================
   Plausibilitätsprüfung vor dem PDF
   ========================================================= */
function plausibility(p, R) {
  const w = [], add = t => w.push(t);
  if (!p.customer.name) add('Der Kundenname fehlt.');
  if (!p.customer.street || !p.customer.city) add('Die Anschrift des Kunden ist unvollständig.');
  if (R.W) {
    const kw = nz(p.hp.kw), flh = kw && R.heat ? R.heat / kw : null;
    if (flh && (flh > 3200 || flh < 900)) add(`Wärmebedarf ${num(R.heat)} kWh passt nicht gut zur Heizleistung ${num(kw, 1)} kW (${num(flh)} Volllaststunden, üblich 1.200–2.400). Verbrauch oder Heizleistung prüfen.`);
    if (R.fuel === 'oil' && p.heating.cons > 8000) add(`Ölverbrauch ${num(p.heating.cons)} Liter ist sehr hoch – Tippfehler?`);
    if (R.fuel === 'gas' && p.heating.cons > 80000) add(`Gasverbrauch ${num(p.heating.cons)} kWh ist sehr hoch – Tippfehler?`);
    if (R.fuel === 'oil' && p.heating.cons > 0 && p.heating.cons < 400) add(`Ölverbrauch ${num(p.heating.cons)} Liter ist sehr niedrig – evtl. kWh statt Liter eingetragen?`);
    if (R.fuel === 'oil' && (R.price < 0.6 || R.price > 2.2)) add(`Ölpreis ${eur(R.price, 2)} je Liter ist ungewöhnlich.`);
    if (R.fuel === 'gas' && (R.price < 0.06 || R.price > 0.3)) add(`Gaspreis ${ct(R.price)} je kWh ist ungewöhnlich.`);
    if (R.jaz < 2.5 || R.jaz > 5.5) add(`JAZ ${num(R.jaz, 2)} ist ungewöhnlich (üblich 2,8 bis 4,5).`);
    if (R.tariffOn && (R.tariff < 0.15 || R.tariff > 0.45)) add(`WP-Stromtarif ${ct(R.tariff)} je kWh ist ungewöhnlich.`);
    const age = heatingAge(p); if (age !== null && (age < 0 || age > 60)) add(`Baujahr der Heizung (${p.heating.year}) bitte prüfen.`);
  }
  if (R.V) {
    if (R.kwp > 40) add(`Anlagenleistung ${num(R.kwp, 1)} kWp ist für ein Einfamilienhaus sehr groß.`);
    if (R.bat > R.kwp * 2.5 && R.kwp > 0) add(`Speicher ${num(R.bat, 1)} kWh ist sehr groß für ${num(R.kwp, 1)} kWp.`);
    const mods = /(\d+)\s*×\s*(\d+)\s*W/.exec(p.pv.modules || ''); if (mods) { const k = +mods[1] * +mods[2] / 1000; if (Math.abs(k - R.kwp) > 0.3) add(`Anlagenleistung ${num(R.kwp, 2)} kWp passt nicht zu ${p.pv.modules} (${num(k, 2)} kWp).`); }
    const pvPrice = p.type === 'pvwp' ? nz(p.offer.grossPV) : R.gross; if (R.kwp > 0 && pvPrice > 0) { const per = pvPrice / R.kwp; if (per < 700 || per > 4000) add(`PV-Preis ${eur(per)} je kWp ist ungewöhnlich.`); }
  }
  if (R.hhPrice < 0.2 || R.hhPrice > 0.6) add(`Haushaltsstrompreis ${ct(R.hhPrice)} je kWh ist ungewöhnlich.`);
  if (R.hhCons < 1000 || R.hhCons > 15000) add(`Haushaltsverbrauch ${num(R.hhCons)} kWh ist ungewöhnlich.`);
  if (R.discount > R.gross * 0.1 && R.gross > 0) add('Der Sonderrabatt liegt über 10 % des Preises.');
  if (R.amortRise !== null && R.amortRise > 0 && R.amortRise < 3) add(`Amortisation nach ${num(R.amortRise, 1)} Jahren ist ungewöhnlich kurz – Eingaben prüfen.`);
  const days = (Date.now() - new Date(p.offer.date + 'T12:00:00').getTime()) / 864e5; if (days > 60) add(`Das Angebot ist ${Math.round(days)} Tage alt.`);
  if (p.discount.on && p.discount.until && p.discount.until < isoToday()) add('Die Rabatt-Frist ist bereits abgelaufen.');
  return w;
}
function plausibilityCard(p, R) {
  const w = plausibility(p, R); if (!w.length) return '';
  return `<div class="card p-4 sm:p-5" style="border-color:rgb(var(--s-rgb)/.45)"><div class="flex items-center gap-3 mb-2"><div class="icon-box !text-yel-ink">${ic('alert', 18)}</div><div class="font-medium text-[15px]">Bitte prüfen, bevor das PDF zum Kunden geht</div></div><ul class="space-y-1.5 text-[13.5px] text-ink2 pl-12 list-disc">${w.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`;
}

/* =========================================================
   Dachflächen, Ausrichtung und PVGIS
   ========================================================= */
const ORIENT = [['0', 'Süd'], ['-45', 'Südost'], ['45', 'Südwest'], ['-90', 'Ost'], ['90', 'West'], ['-135', 'Nordost'], ['135', 'Nordwest'], ['180', 'Nord']];
const YF_T = [0, 15, 30, 45, 60, 90];
const YF = [[87, 96, 100, 99, 94, 72], [87, 94, 96, 94, 88, 67], [87, 88, 85, 81, 75, 56], [87, 81, 72, 63, 55, 39], [87, 78, 66, 54, 44, 30]]; // Abweichung von Süd 0/45/90/135/180°
function roofFactor(az, tilt) {
  const dev = Math.min(180, Math.abs(+az || 0)), t = clamp(+tilt || 0, 0, 90);
  const i = Math.min(3, Math.floor(dev / 45)), fi = (dev - i * 45) / 45;
  let j = 0; while (j < YF_T.length - 2 && t > YF_T[j + 1]) j++;
  const fj = (t - YF_T[j]) / (YF_T[j + 1] - YF_T[j]);
  const v = (a, b) => YF[a][b] + (YF[a][b + 1] - YF[a][b]) * fj;
  return (v(i, j) + (v(i + 1, j) - v(i, j)) * fi) / 100;
}
function roofsOf(p) { const r = p.pv && p.pv.roofs; return Array.isArray(r) && r.length ? r : [{ id: 'r1', az: 0, tilt: 35, kwp: null }]; }
function roofKwps(p) {
  const rs = roofsOf(p), total = nz(p.pv.kwp), given = rs.reduce((a, r) => a + nz(r.kwp), 0), free = rs.filter(r => !(r.kwp > 0)).length;
  return rs.map(r => (r.kwp > 0 ? +r.kwp : free ? Math.max(0, total - given) / free : 0));
}
function pvFactor(p) { const rs = roofsOf(p), k = roofKwps(p), sum = k.reduce((a, b) => a + b, 0); return sum ? rs.reduce((a, r, i) => a + roofFactor(r.az, r.tilt) * k[i], 0) / sum : roofFactor(rs[0].az, rs[0].tilt); }
const pvSig = p => JSON.stringify([p.customer.zip, nz(p.pv.kwp), roofsOf(p).map(r => [+r.az, +r.tilt, nz(r.kwp)])]);
const pvgisValid = p => { const g = p.pv && p.pv.pvgis; return g && g.sig === pvSig(p) && g.E > 0 ? g : null; };
let PLZ = null;
async function plzCoords(zip) { if (!PLZ) PLZ = await (await fetch(VENDOR('plz.json'))).json(); return PLZ[String(zip || '').trim()] || null; }
async function fetchPvgis(p) {
  const c = await plzCoords(p.customer.zip);
  if (!c) return toast('Für diese Postleitzahl gibt es keine Koordinaten. Bitte PLZ prüfen.', 'err');
  if (!(p.pv.kwp > 0)) return toast('Bitte zuerst die Anlagenleistung eintragen.', 'err');
  UI.busy.pvgis = true; render();
  try {
    let E = 0; const rs = roofsOf(p), k = roofKwps(p);
    for (let i = 0; i < rs.length; i++) {
      if (!(k[i] > 0)) continue;
      const r = await fetch(`/pvgis/PVcalc?lat=${c[0]}&lon=${c[1]}&peakpower=${k[i].toFixed(2)}&loss=14&angle=${+rs[i].tilt}&aspect=${+rs[i].az}&outputformat=json`);
      if (!r.ok) throw new Error('PVGIS antwortet nicht (' + r.status + ')');
      const d = await r.json(); E += d.outputs.totals.fixed.E_y;
    }
    p.pv.pvgis = { E: Math.round(E), date: isoToday(), sig: pvSig(p) }; saveProject(p);
    toast(`PVGIS: ${num(E)} kWh pro Jahr übernommen.`);
  } catch (e) { console.warn(e); toast('PVGIS ist gerade nicht erreichbar (nur online und auf der Netlify-Seite möglich). Es wird mit der Ausrichtungs-Tabelle gerechnet.', 'warn', 5500); }
  delete UI.busy.pvgis; render();
}
function roofsCard(p, R) {
  const rs = roofsOf(p), k = roofKwps(p), g = pvgisValid(p);
  return `<div class="mt-5"><div class="flex items-center justify-between gap-3"><span class="lbl !mb-0">Dachflächen</span><button class="chip" data-a="roof-add">${ic('plus', 14)}Dachfläche</button></div>
    <div class="space-y-2 mt-2">${rs.map((r, i) => `<div class="grid grid-cols-[1fr_96px_110px_auto] gap-2 items-center"><select class="inp !h-10" data-roof="${i}" data-k="az">${ORIENT.map(([v, l]) => `<option value="${v}" ${String(r.az) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <div class="relative"><input class="inp !h-10 !pr-7" inputmode="numeric" value="${r.tilt}" data-roof="${i}" data-k="tilt" aria-label="Neigung"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink3">°</span></div>
      <div class="relative">${rs.length > 1 ? `<input class="inp !h-10 !pr-11" inputmode="decimal" value="${r.kwp > 0 ? inputFmt(r.kwp, 'n') : ''}" placeholder="${num(k[i], 1)}" data-roof="${i}" data-k="kwp" aria-label="kWp"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink3">kWp</span>` : `<div class="text-[12px] text-ink3 px-1">${pct(roofFactor(r.az, r.tilt) * 100)} Ertrag</div>`}</div>
      ${rs.length > 1 ? `<button class="btn-g !px-2" data-a="roof-del" data-i="${i}" aria-label="Entfernen">${ic('trash', 15)}</button>` : '<span></span>'}</div>`).join('')}</div>
    <div class="mt-3 rounded-[calc(var(--r)-4px)] bg-raised p-3 text-[13px] text-ink2 flex flex-wrap items-center gap-3"><div class="flex-1 min-w-[200px]">${g ? `Ertrag laut <b>PVGIS</b> (EU-Kommission) für PLZ ${esc(p.customer.zip)}: <b>${num(g.E)} kWh/Jahr</b> · ${num(g.E / Math.max(0.01, R.kwp))} kWh/kWp · Stand ${deDate(g.date)}` : `Ertrag aus Ausrichtung und Neigung: <b>${pct(R.roofFactor * 100)}</b> von ${num(S.calc.pvYield)} kWh/kWp = <b>ca. ${kwh100(R.yield)} kWh/Jahr</b>`}</div>
      <button class="btn-s btn-sm" data-a="pvgis" ${UI.busy.pvgis ? 'disabled' : ''}>${UI.busy.pvgis ? '<span class="spin inline-block">' + ic('refresh', 15) + '</span>' : ic('sun', 15)}${g ? 'Neu abrufen' : 'Genau mit PVGIS'}</button></div>
    <p class="hint">PVGIS nutzt nur die auf 1 km gerundete Lage der Postleitzahl – keine Namen oder Adressen. Ohne Internet rechnet die App mit der Ausrichtungs-Tabelle.</p></div>`;
}

/* =========================================================
   E-Auto und Wallbox
   ========================================================= */
function carCard(p, R) {
  const c = p.car || {};
  return `<div class="card p-5 sm:p-6">${cardHead('car', 'E-Auto und Wallbox', 'Laden mit eigenem Solarstrom erhöht den Eigenverbrauch deutlich.')}
    <label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" data-tgcheck="p:car.on" ${c.on ? 'checked' : ''}><span class="text-[14px] font-medium">E-Auto vorhanden oder geplant</span></label>
    ${c.on ? `<div class="grid sm:grid-cols-2 gap-4 mt-4">${field('Fahrleistung pro Jahr', 'p:car.km', { t: 'n', unit: 'km' })}${field('Verbrauch', 'p:car.cons', { t: 'n', unit: 'kWh/100 km' })}${field('Davon zu Hause geladen', 'p:car.home', { t: 'n', unit: '%' })}${field('Laden tagsüber (Auto steht zu Hause)', 'p:car.day', { t: 'n', unit: '%', hint: 'z. B. Homeoffice, Rente, Zweitwagen' })}</div>
      <div class="mt-3 rounded-[calc(var(--r)-4px)] bg-raised p-3 text-[13px] text-ink2">Ladestrom zu Hause: <b>${num(R.carKWh)} kWh/Jahr</b>${R.carPV ? ` · davon rund <b>${kwh100(R.carPV)} kWh Solarstrom</b>` : ''}</div>` : ''}</div>`;
}

/* =========================================================
   Varianten-Vergleich
   ========================================================= */
function applyVariant(p, v) {
  const q = clone(p);
  if (p.type === 'pvwp') { if (isNum(v.grossWP)) q.offer.grossWP = v.grossWP; if (isNum(v.grossPV)) q.offer.grossPV = v.grossPV; q.offer.total = null; }
  else if (isNum(v.gross)) q.offer.gross = v.gross;
  if (isNum(v.kwp)) q.pv.kwp = v.kwp; if (isNum(v.bat)) q.pv.bat = v.bat;
  if (v.rod !== undefined && q.rod) q.rod.on = !!v.rod;
  if (q.pv) delete q.pv.pvgis; q.variants = [];
  return q;
}
function variantResults(p) {
  const base = { id: 'base', name: 'Ihr Angebot', R: compute(p) };
  return [base, ...(p.variants || []).map(v => ({ id: v.id, name: v.name || 'Variante', R: compute(applyVariant(p, v)), v }))];
}
function variantRows(list) {
  return [['Investition (brutto)', x => eur(x.R.gross)], ['Förderung', x => (x.R.W ? '− ' + eur(x.R.funding) : '–')], ['Ihre Kosten', x => eur(x.R.net)], ['Ø Ersparnis pro Jahr', x => eur(x.R.avg)], ['Amortisation', x => amortTxt(x.R.amortRise) + ' Jahre'], [`Überschuss nach ${S.calc.years} Jahren`, x => eur(x.R.surplus)], ...(list[0].R.V ? [['Autarkie', x => pct(x.R.autarky * 100)]] : [])];
}
function variantsCard(p) {
  const vs = p.variants || [], list = variantResults(p), best = list.reduce((a, b) => (b.R.surplus > a.R.surplus ? b : a), list[0]);
  const edit = v => `<div class="rounded-[calc(var(--r)-4px)] border border-line p-3"><div class="flex items-center gap-2"><input class="inp !h-10 flex-1" value="${esc(v.name)}" data-var="${v.id}" data-k="name" data-t="s" aria-label="Name"><button class="btn-g !px-2" data-a="var-del" data-id="${v.id}" aria-label="Variante löschen">${ic('trash', 15)}</button></div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">${p.type === 'pvwp' ? `${vfield(v, 'grossWP', 'Preis WP', '€')}${vfield(v, 'grossPV', 'Preis PV', '€')}` : vfield(v, 'gross', 'Bruttopreis', '€')}${hasPV(p) ? vfield(v, 'kwp', 'kWp', 'kWp') + vfield(v, 'bat', 'Speicher', 'kWh') : ''}</div>
    ${p.type === 'pvwp' ? `<label class="flex items-center gap-2 text-[13px] text-ink2 mt-2"><input type="checkbox" data-var-rod="${v.id}" ${v.rod ? 'checked' : ''}>mit Heizstab</label>` : ''}</div>`;
  return `<div class="card p-5 sm:p-6">${cardHead('scale', 'Varianten vergleichen', 'z. B. mit/ohne Speicher oder kleinere Anlage – erscheint auf Wunsch im Kundendokument.')}
    ${vs.length ? `<div class="overflow-x-auto -mx-1"><table class="w-full text-[13px] min-w-[460px]"><thead><tr class="text-ink3 text-[12px]"><th class="text-left font-medium py-2 px-1"></th>${list.map(x => `<th class="text-right font-medium px-2">${esc(x.name)}${x === best ? ' <span class="badge bg-p/10 text-p !py-0">beste</span>' : ''}</th>`).join('')}</tr></thead><tbody>${variantRows(list).map(([k, f]) => `<tr class="border-t border-line"><td class="py-2 px-1 text-ink2">${k}</td>${list.map(x => `<td class="text-right px-2 font-medium num">${f(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
    <div class="space-y-3 mt-4">${vs.map(edit).join('')}</div>
    <div class="flex flex-wrap gap-2 mt-3"><button class="chip" data-a="var-add" data-tpl="copy">${ic('plus', 14)}Variante</button>${hasPV(p) && p.pv.bat > 0 ? `<button class="chip" data-a="var-add" data-tpl="nobat">${ic('plus', 14)}Ohne Speicher</button>` : ''}${p.type === 'pvwp' ? `<button class="chip" data-a="var-add" data-tpl="rod">${ic('plus', 14)}Mit Heizstab</button>` : ''}</div>
    ${vs.length ? '<p class="hint">Bei „Ohne Speicher“ bitte den Preis ohne Speicher eintragen – sonst rechnet die Variante mit dem vollen Preis.</p>' : ''}</div>`;
}
function vfield(v, k, label, unit) { return `<label class="block"><span class="text-[11.5px] text-ink3">${label}</span><div class="relative"><input class="inp !h-10 !pr-12" inputmode="decimal" value="${isNum(v[k]) ? inputFmt(v[k], 'n') : ''}" data-var="${v.id}" data-k="${k}" data-t="n"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink3">${unit}</span></div></label>`; }

/* =========================================================
   Unterschrift im Termin (Finger oder Stift)
   ========================================================= */
function signCard(p) {
  const sg = p.sign || {};
  if (sg.cust) return `<div class="card p-5 sm:p-6 scroll-mt-28" id="sign-card">${cardHead('pen', 'Unterschrift im Termin', `Unterschrieben am ${deDate(sg.date)} in ${esc(sg.place || '–')}`)}<div class="flex flex-wrap gap-4 items-end"><div class="rounded-[calc(var(--r)-4px)] bg-white p-3 border border-line"><img src="${fileUrl(sg.cust)}" class="h-20" alt="Unterschrift Kunde"></div>${sg.adv ? `<div class="rounded-[calc(var(--r)-4px)] bg-white p-3 border border-line"><img src="${fileUrl(sg.adv)}" class="h-20" alt="Unterschrift Berater"></div>` : ''}</div>
    <p class="hint">Die Unterschrift steht auf der Seite „Angebot annehmen“ im PDF.</p><button class="btn-g mt-2 hover:!text-ember" data-a="sign-del">${ic('trash', 15)}Unterschrift entfernen</button></div>`;
  return `<div class="card p-5 sm:p-6 scroll-mt-28" id="sign-card">${cardHead('pen', 'Unterschrift im Termin', 'Der Kunde unterschreibt direkt auf dem iPad oder iPhone – die Unterschrift kommt ins PDF.')}
    <div class="grid sm:grid-cols-2 gap-4">${field('Ort', 'p:signDraft.place', { ph: p.customer.city || 'Ort' })}<div class="space-y-2 pt-6"><label class="flex items-start gap-2 text-[13px] text-ink2"><input type="checkbox" id="sg-order" checked class="mt-0.5">Auftrag gemäß Angebot erteilen</label><label class="flex items-start gap-2 text-[13px] text-ink2"><input type="checkbox" id="sg-cond" ${hasWP(p) ? 'checked' : ''} class="mt-0.5">unter der Bedingung der Förderzusage</label></div></div>
    ${['cust', 'adv'].map(k => `<div class="mt-4"><div class="flex items-center justify-between"><span class="lbl !mb-1">${k === 'cust' ? 'Unterschrift Kunde (' + esc(custName(p)) + ')' : 'Unterschrift Berater (optional)'}</span><button class="btn-g !h-8" data-a="pad-clear" data-k="${k}">Löschen</button></div>
      <canvas data-pad="${k}" class="w-full h-36 rounded-[calc(var(--r)-4px)] bg-white border border-line2" style="touch-action:none"></canvas></div>`).join('')}
    <div class="flex flex-wrap items-center gap-3 mt-4"><button class="btn-p" data-a="sign-save">${ic('check', 16)}Fertig</button><span class="text-[13px] text-p" id="sg-saved"></span></div><p class="hint">Die Unterschrift wird nach dem Unterschreiben automatisch gespeichert – beide Haken werden gesetzt.</p></div>`;
}
const PADS = {}; let SIGN_T = null;
/* Wird die App direkt nach dem Unterschreiben verlassen: sofort speichern */
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && SIGN_T) { clearTimeout(SIGN_T); SIGN_T = null; const p = curProject(); if (p) saveSignature(p, true); } });
function initPads() {
  $$('canvas[data-pad]').forEach(cv => {
    const k = cv.dataset.pad, r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0F2A3D';
    const st = PADS[k] = { cv, ctx, drawn: false, down: false, last: null };
    const pos = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); st.down = true; st.last = pos(e); };
    cv.onpointermove = e => { if (!st.down) return; const q = pos(e); ctx.beginPath(); ctx.moveTo(st.last[0], st.last[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); st.last = q; st.drawn = true; };
    cv.onpointerup = cv.onpointercancel = () => { if (!st.down) return; st.down = false; if (st.drawn) { ['sg-order', 'sg-cond'].forEach(id => { const c = $('#' + id); if (c) c.checked = true; }); clearTimeout(SIGN_T); SIGN_T = setTimeout(() => { const p = curProject(); if (p) saveSignature(p, true); }, 500); } };
  });
}
async function saveSignature(p, auto) {
  const c = PADS.cust; if (!c || !c.drawn) { if (!auto) toast('Bitte zuerst unterschreiben lassen.', 'err'); return; }
  if (auto && PADS.adv && PADS.adv.down) return;
  // leeren Rand abschneiden, damit die Unterschrift das Feld im PDF gut ausfüllt
  const trim = cv => { const g = cv.getContext('2d'), { width: w, height: h } = cv, d = g.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return cv; const pad = 12, o = document.createElement('canvas'); o.width = Math.min(w, x1 - x0 + 2 * pad); o.height = Math.min(h, y1 - y0 + 2 * pad);
    o.getContext('2d').drawImage(cv, Math.max(0, x0 - pad), Math.max(0, y0 - pad), o.width, o.height, 0, 0, o.width, o.height); return o; };
  const toBlob = cv => new Promise(r => trim(cv).toBlob(r, 'image/png'));
  const sg = { cust: await putFile(await toBlob(c.cv), 'unterschrift-kunde.png'), place: (p.signDraft && p.signDraft.place) || p.customer.city || '', date: isoToday(), order: true, cond: true };
  if (PADS.adv && PADS.adv.drawn) sg.adv = await putFile(await toBlob(PADS.adv.cv), 'unterschrift-berater.png');
  if (p.sign) { const old = [p.sign.cust, p.sign.adv].filter(Boolean); if (old.length) delFiles(old).catch(() => {}); }
  p.sign = sg; p.status = 'unterschrieben'; p.statusDate = isoToday(); p.pages.sign = true; saveProject(p);
  // automatisch: Felder bleiben offen (Berater kann noch unterschreiben), nur kurzer Hinweis
  if (auto) { const h = $('#sg-saved'); if (h) h.textContent = 'Gespeichert – erscheint im PDF, Haken gesetzt.'; return; }
  toast('Unterschrift übernommen – Status „Unterschrieben“.'); render();
}

/* =========================================================
   Tutorial (beim ersten Start, überspringbar, in den Einstellungen wiederholbar)
   ========================================================= */
const TUTORIAL = [
  ['sun', 'Willkommen', 'In wenigen Minuten erstellen Sie mit dieser App eine Wirtschaftlichkeitsberechnung für Photovoltaik, Wärmepumpe oder beides – als PDF, das Ihre Kunden verstehen.'],
  ['download', '1 · Als App installieren', 'Legen Sie die App auf den Home-Bildschirm – iPhone: Teilen → „Zum Home-Bildschirm“, Android: Menü ⋮ → „App installieren“. So startet sie schneller, läuft offline und Ihre Daten sind geschützt.'],
  ['plus', '2 · Neue Berechnung', 'Tippen Sie auf „Neue Berechnung“. Die App fragt zuerst, ob Sie eine Wärmepumpen-Schnellauslegung machen möchten: aus Wohnfläche, Gebäudestandard, Heizsystem und Personen ergeben sich Heizlast, passende Leistung und JAZ – diese Werte werden übernommen. Danach wählen Sie Wärmepumpe, Photovoltaik oder PV + Wärmepumpe.'],
  ['upload', '3 · Angebot hochladen', 'Ziehen Sie das Angebot als PDF oder Foto hinein. Kunde, Preise, Anlagendaten, Hersteller, Garantien, Ansprechpartner und Ihre Produkte aus der Datenbank werden automatisch erkannt – bitte kurz prüfen. Erkannte Produkte werden mit allen Angaben aus Ihrer Datenbank übernommen und erscheinen mit Bild auf der PDF-Seite „Ihre Komponenten“.'],
  ['calc', '4 · Daten ergänzen', 'Bei der Wärmepumpe brauchen Sie Baujahr und Verbrauch der alten Heizung. Bei PV geben Sie Dachflächen, Ausrichtung und auf Wunsch E-Auto oder Heizstab an. Zahlenfelder öffnen die Zahlentastatur – mit „ABC Buchstaben“ am Feld wechseln Sie jederzeit zu Buchstaben.'],
  ['chart', '5 · Ergebnis zeigen', 'Sie sehen Ersparnis, Amortisation und Förderung. Mit dem Monatsregler zeigen Sie einen Tag im Winter oder Sommer. Varianten vergleichen Sie direkt – und mit „Finanzierung“ zeigen Sie: neue Energiekosten + Kreditrate = monatliche Kosten, verglichen mit heute.'],
  ['file', '6 · PDF erstellen', 'Vor jeder PDF prüfen Sie kurz den Sonderrabatt und wählen die komplette PDF oder die kompakte Vertriebs-PDF. Danach senden Sie sie per E-Mail – oder der Kunde unterschreibt direkt auf dem Gerät; die Unterschrift wird sofort gespeichert und die Haken gesetzt.'],
  ['clock', '7 · Status und Nachfassen', 'Jede Berechnung hat einen Status: offen, gesendet, unterschrieben oder verloren. Läuft eine Rabatt-Frist ab, erinnert Sie die Startseite. Oben in der Kundenübersicht sehen Sie Ihre Abschlüsse und die Abschlussquote. Erledigte Kunden archivieren Sie – im Filter „Archiv“ lassen sie sich jederzeit wiederherstellen. Sagt der Kunde später zu, tippen Sie auf der Kundenkarte auf „Auftrag gewonnen?“ – Sie landen direkt bei der Unterschrift.'],
  ['db', '8 · Sichern nicht vergessen', 'Ihre Kunden liegen nur auf diesem Gerät. Unter Einstellungen → Datensicherung sichern Sie alles in iCloud Drive (iPhone) bzw. Google Drive (Android) – die App erinnert Sie nach 7 Tagen. Eine Schritt-für-Schritt-Anleitung finden Sie unter Einstellungen → Ansicht & Tutorial.'],
  ['sparkle', '9 · Updates', 'Gibt es eine neue Version, erscheint unten „Version … verfügbar – Jetzt aktualisieren“. Danach zeigt Ihnen die App kurz, was neu ist. Ihre Daten bleiben dabei immer erhalten.'],
  ['gear', 'Fertig', 'Mit dem Zurück-Knopf oben kommen Sie jederzeit zu allen Kunden bzw. zur Übersicht zurück. Ansicht (Hell oder Dunkel), Wetter, Jahreszeit und Feiertags-Schmuck (Weihnachten, Ostern, Halloween) der Startseite (Reiter „Startseite & Wetter“) und Ihr Berater-Profil stellen Sie unter Einstellungen ein. Dort können Sie dieses Tutorial und die Neuigkeiten jederzeit wieder ansehen.']
];
function showTutorial(i = 0) {
  const [icon, title, text] = TUTORIAL[i], last = i === TUTORIAL.length - 1;
  modal(`<div class="text-center pt-2"><div class="w-16 h-16 rounded-2xl bg-raised border border-line grid place-items-center mx-auto text-ink2">${ic(icon, 30)}</div>
    <div class="mono text-[12px] text-ink3 mt-5">${i + 1} / ${TUTORIAL.length}</div><h3 class="h-font text-[26px] mt-1">${esc(title)}</h3><p class="text-ink2 text-[15px] mt-3 leading-relaxed">${esc(text)}</p>
    <div class="flex justify-center gap-1.5 mt-5">${TUTORIAL.map((_, k) => `<span class="h-1.5 rounded-full ${k === i ? 'w-5 bg-p' : 'w-1.5 bg-line2'}"></span>`).join('')}</div>
    <div class="flex items-center justify-between gap-2 mt-6">${i ? `<button class="btn-s" data-a="tut" data-i="${i - 1}">${ic('arrowL', 16)}Zurück</button>` : `<button class="btn-g" data-a="tut-skip">Überspringen</button>`}<button class="btn-p" data-a="${last ? 'tut-skip' : 'tut'}" data-i="${i + 1}">${last ? 'Los geht’s' : 'Weiter'}${last ? '' : ic('arrowR', 16)}</button></div>
    ${i && !last ? '<button class="btn-g mt-3" data-a="tut-skip">Überspringen</button>' : ''}</div>`);
}

/* =========================================================
   PDF-Farben aus dem eigenen Deckblatt
   ========================================================= */
function rgbToHsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
function hslToHex(h, s, l) { const f = n => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; return rgbToHex(f(0), f(8), f(4)); }
async function extractPalette(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const cv = document.createElement('canvas'); cv.width = 72; cv.height = 72; const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, 72, 72);
    const px = ctx.getImageData(0, 0, 72, 72).data, buckets = Array.from({ length: 18 }, () => ({ w: 0, h: 0, s: 0, l: 0, n: 0 }));
    for (let i = 0; i < px.length; i += 4) {
      const [h, s, l] = rgbToHsl(px[i], px[i + 1], px[i + 2]);
      if (s < 0.22 || l < 0.12 || l > 0.88) continue;
      const b = buckets[Math.floor(h / 20) % 18], w = s * (1 - Math.abs(l - 0.5));
      b.w += w; b.h += h * w; b.s += s * w; b.l += l * w; b.n++;
    }
    const ranked = buckets.filter(b => b.n > 20).map(b => ({ h: b.h / b.w, s: b.s / b.w, l: b.l / b.w, w: b.w })).sort((a, b) => b.w - a.w);
    if (!ranked.length) return null;
    const dist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
    const p = ranked[0], warm = h => h >= 15 && h <= 65, s2 = ranked.filter(b => dist(b.h, p.h) >= 40).sort((a, b) => b.w * (warm(b.h) ? 3 : 1) - a.w * (warm(a.h) ? 3 : 1))[0] || null, a3 = ranked.find(b => b !== s2 && dist(b.h, p.h) >= 40 && (!s2 || dist(b.h, s2.h) >= 30)) || null;
    const primary = hslToHex(p.h, clamp(p.s, 0.35, 0.8), clamp(p.l, 0.28, 0.42));           // dunkel genug für weiße Schrift
    const secondary = s2 ? hslToHex(s2.h, clamp(s2.s, 0.55, 0.95), clamp(s2.l, 0.5, 0.62)) : hslToHex((p.h + 35) % 360, 0.85, 0.56);
    const accent = a3 ? hslToHex(a3.h, clamp(a3.s, 0.4, 0.8), clamp(a3.l, 0.3, 0.42)) : hslToHex(p.h, clamp(p.s, 0.3, 0.6), 0.24);
    return { primary, secondary, accent };
  } catch (e) { console.warn(e); return null; } finally { URL.revokeObjectURL(url); }
}
const coverPalActive = () => { const d = S.design; return d.coverStyle === 'image' && d.cover && d.cover.file && d.pdfColors !== 'own' && d.coverPalette ? d.coverPalette : null; };
async function updateCoverPalette(silent) {
  const id = S.design.cover.file; if (!id) return;
  await loadFiles([id]); const f = FILES[id]; if (!f) return;
  const pal = await extractPalette(f.blob);
  S.design.coverPalette = pal; saveSettings(); applyTheme();
  if (!silent) toast(pal ? 'PDF-Farben aus dem Deckblatt übernommen.' : 'Im Deckblatt wurden keine kräftigen Farben gefunden – es bleibt bei Ihrer Farbwelt.', pal ? 'ok' : 'warn');
}
async function ensureCoverPalette() { const d = S.design; if (d.coverStyle === 'image' && d.cover.file && d.coverPalette === undefined) await updateCoverPalette(true); }
