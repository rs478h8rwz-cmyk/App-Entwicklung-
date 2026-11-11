/* LumbraDesk – Anmeldung, Startseite mit den Apps, Benutzerverwaltung (Admin); CRM-Ansichten in crm.js */
'use strict';
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const IC = {
  calc: '<path d="M4 3h16v18H4z"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h2M12 18h4"/>',
  abnahme: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
  protokolle: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
  stempel: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  audit: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  system: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  next: '<path d="M9 6l6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2M16 7l3 3M18 5l3 3"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[n] || ''}</svg>`;
const ST = { user: null, apps: [], roles: {}, view: 'home', users: [], audit: [] };

async function api(r, data) {
  const opt = data === undefined ? { credentials: 'same-origin' } : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Lumbra': '1' }, body: JSON.stringify(data) };
  const [act, ...qs] = r.split('&');   // „aktion&feld=wert“: Werte kodiert der Aufrufer selbst
  const res = await fetch('api/?r=' + encodeURIComponent(act) + (qs.length ? '&' + qs.join('&') : ''), opt);
  let j = {}; try { j = await res.json(); } catch (e) {}
  if (!res.ok) { const err = new Error(j.error || 'Fehler ' + res.status); err.status = res.status; throw err; }
  return j;
}
function toast(msg) { document.querySelectorAll('.toast').forEach(x => x.remove()); const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3200); }
const brand = sub => `<div class="brand"><div><span class="wm" role="img" aria-label="lumbra.desk"></span><span>${esc(sub)}</span></div></div>`;

/* ---------- Ansichten ---------- */
function viewLogin(err = '') {
  return `<main class="auth"><div class="card">${brand('Dein Betrieb an einem Ort')}
    <h2 style="margin-top:22px">Anmelden</h2>${err ? `<p class="note err">${esc(err)}</p>` : ''}
    <form id="f-login"><label>E-Mail<input name="email" type="email" autocomplete="username" required autofocus></label>
    <label>Passwort<input name="password" type="password" autocomplete="current-password" required></label>
    <button class="btn" type="submit">Anmelden</button></form>
    <p style="font-size:14px;margin-top:16px;text-align:center"><a href="#/vergessen">Passwort vergessen?</a></p></div></main>`;
}
function viewForgot(msg = '', ok = false) {
  return `<main class="auth"><div class="card">${brand('Dein Betrieb an einem Ort')}
    <h2 style="margin-top:22px">Passwort vergessen</h2><p class="muted">Gib deine E-Mail-Adresse ein. Du bekommst einen Link, mit dem du ein neues Passwort festlegst.</p>${msg ? `<p class="note ${ok ? 'ok' : 'err'}">${esc(msg)}</p>` : ''}
    ${ok ? '' : `<form id="f-forgot"><label>E-Mail<input name="email" type="email" autocomplete="username" required autofocus></label><button class="btn" type="submit">Link senden</button></form>`}
    <p style="font-size:14px;margin-top:16px;text-align:center"><a href="#/">Zurück zur Anmeldung</a></p></div></main>`;
}
function viewSetPw(info, err = '') {
  if (!info) return `<main class="auth"><div class="card">${brand('Dein Betrieb an einem Ort')}<p class="note err">${esc(err || 'Der Link ist abgelaufen oder wurde schon benutzt.')}</p><p class="muted">Über „Passwort vergessen?“ kannst du einen neuen Link anfordern.</p><a class="btn" href="./#/vergessen" style="width:100%">Neuen Link anfordern</a></div></main>`;
  return `<main class="auth"><div class="card">${brand('Hallo ' + info.name)}
    <h2 style="margin-top:22px">${info.purpose === 'invite' ? 'Willkommen bei LumbraDesk' : 'Neues Passwort'}</h2><p class="muted">Lege dein Passwort fest (mind. 10 Zeichen, Buchstaben und Zahlen). Anmelden kannst du dich danach mit <b>${esc(info.email)}</b>.</p>${err ? `<p class="note err">${esc(err)}</p>` : ''}
    <form id="f-setpw"><label>Neues Passwort<input name="new" type="password" autocomplete="new-password" required autofocus></label><label>Wiederholen<input name="new2" type="password" autocomplete="new-password" required></label><button class="btn" type="submit">Passwort speichern</button></form></div></main>`;
}
function viewNewPw(err = '') {
  return `<main class="auth"><div class="card">${brand('Hallo ' + ST.user.name)}
    <h2 style="margin-top:22px">Neues Passwort festlegen</h2><p class="muted">Beim ersten Anmelden bitte ein eigenes Passwort wählen (mind. 10 Zeichen, Buchstaben und Zahlen).</p>${err ? `<p class="note err">${esc(err)}</p>` : ''}
    <form id="f-pw"><label>Bisheriges bzw. Einmal-Passwort<input name="old" type="password" autocomplete="current-password" required></label>
    <label>Neues Passwort<input name="new" type="password" autocomplete="new-password" required></label>
    <label>Neues Passwort wiederholen<input name="new2" type="password" autocomplete="new-password" required></label>
    <button class="btn" type="submit">Speichern</button></form>
    <button class="btn g" data-a="logout" style="width:100%;margin-top:8px">Abmelden</button></div></main>`;
}
function shell(inner) {
  const crm = typeof isCrm === 'function' && isCrm(), adm = ST.user.role === 'admin';
  const off = ['admin', 'buero'].includes(ST.user.role);
  const base = [['home', 'Start']].concat(crm ? [['kunden', 'Kunden'], ['aufgaben', 'Aufgaben']] : []).concat(off ? [['protokolle', 'Protokolle']] : []);
  const nav = base.concat(adm ? [['users', 'Benutzer'], ['audit', 'Änderungen'], ['system', 'System']] : []);
  const tabs = (adm ? base.filter(x => x[0] !== 'protokolle') : base).concat(adm ? [['mehr', 'Mehr']] : []);
  const cur = ST.view === 'kunde' || ST.view === 'angebot' ? 'kunden' : ST.view === 'artikel' ? 'mehr' : ST.view, inMehr = ['users', 'audit', 'system', 'mehr'].includes(ST.view) || (adm && ST.view === 'protokolle');
  const link = ([k, l]) => `<a href="#/${k}" class="navl ${cur === k || (k === 'mehr' && inMehr) ? 'on' : ''}">${ic(k, 22)}<span>${l}</span></a>`;
  return `<header class="top"><div class="in">${brand(ST.user.name + ' · ' + ST.user.roleName)}
    ${nav.length > 1 ? `<nav class="side">${nav.map(link).join('')}</nav>` : '<span style="margin-left:auto"></span>'}<button class="btn g sm out" data-a="logout" title="Abmelden" aria-label="Abmelden">${ic('out', 20)}<span class="hide-sm">Abmelden</span></button></div></header>
    <main class="wrap ${tabs.length > 1 ? 'has-tabs' : ''}">${inner}</main>${tabs.length > 1 ? `<nav class="tabs">${tabs.map(link).join('')}</nav>` : ''}`;
}
function viewHome() {
  const h = new Date().getHours(), gr = h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
  return `<section class="hero"><h1>${gr}, ${esc(ST.user.name.split(' ')[0])}.</h1><p class="muted">${typeof isCrm === 'function' && isCrm() ? 'Dein Überblick für heute.' : 'Deine Apps – gleiche Bedienung wie gewohnt.'}</p></section>
    <div class="grid">${ST.apps.map(a => `<a class="card tile ${a.url ? '' : 'off'}" href="${esc(a.url || '#')}"><div class="ic">${ic(a.key)}</div><div class="tx"><b>${esc(a.name)}</b><span class="muted">${esc(a.text)}</span>${a.url ? '' : '<div style="margin-top:8px"><span class="badge">folgt</span></div>'}</div><span class="go">${ic('next', 18)}</span></a>`).join('') || '<p class="muted">Für deine Rolle sind noch keine Apps freigeschaltet.</p>'}</div>
    ${typeof homeCrm === 'function' ? homeCrm() : ''}
    <div class="sec card acct"><div class="who"><span class="av">${esc(ST.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span><div><b>${esc(ST.user.name)}</b><span class="muted">${esc(ST.user.email)} · ${esc(ST.user.roleName)}</span></div></div>
      <details class="pwbox"><summary>${ic('key', 18)}<span>Passwort ändern</span>${ic('next', 16)}</summary>
      <form id="f-pw2" class="form-grid"><label>Bisheriges Passwort<input name="old" type="password" autocomplete="current-password" required></label><label>Neues Passwort<input name="new" type="password" autocomplete="new-password" required></label><label>Wiederholen<input name="new2" type="password" autocomplete="new-password" required></label><div><button class="btn s" type="submit" style="margin-top:12px">Passwort ändern</button></div></form></details>
      <button class="btn g out-m" data-a="logout">${ic('out', 18)}Abmelden</button></div>`;
}
function roleSel(name, cur) { return `<select name="${name}">${Object.entries(ST.roles).map(([k, l]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`; }
function viewUsers() {
  return `<section class="hero"><h1>Benutzer</h1><p class="muted">Neue Mitarbeiter anlegen, Rollen vergeben, Zugänge sperren oder Passwörter zurücksetzen.</p></section>
    <div class="card"><h2>Neuer Benutzer</h2><form id="f-user" class="form-grid"><label>Name<input name="name" required></label><label>E-Mail<input name="email" type="email" required></label><label>Rolle${roleSel('role', 'monteur')}</label><div class="subm"><button class="btn" type="submit" style="margin-top:12px">Anlegen</button></div>
      <label class="inv" style="grid-column:1/-1;display:flex;align-items:center;gap:8px;font-size:14px"><input type="checkbox" name="invite" value="1" checked style="width:auto;height:auto;margin:0">Einladung per E-Mail senden (Link zum Passwort festlegen)</label></form>
      <p class="muted" style="font-size:13px">Admin: alles inkl. Benutzer · Büro: alle Kunden und Mitarbeiterdaten · Vertrieb: Berechnungen und eigene Kunden · Monteur: Stempeluhr, Abnahme, Service.</p><div id="tmp"></div></div>
    <div class="card sec"><table class="mt"><thead><tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th>Zuletzt angemeldet</th><th></th></tr></thead><tbody>
    ${ST.users.map(u => `<tr><td><b>${esc(u.name)}</b>${u.active ? '' : ' <span class="badge r">gesperrt</span>'}${u.mustChange ? ' <span class="badge">Erst-Anmeldung offen</span>' : ''}</td><td class="muted em">${esc(u.email)}</td>
      <td data-l="Rolle"><select data-role="${u.id}" ${u.id === ST.user.id ? 'disabled' : ''}>${Object.entries(ST.roles).map(([k, l]) => `<option value="${k}" ${k === u.role ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></td>
      <td class="muted" data-l="Zuletzt angemeldet">${u.lastLogin ? new Date(u.lastLogin.replace(' ', 'T') + 'Z').toLocaleString('de-DE') : '–'}</td>
      <td><div class="row"><button class="btn s sm" data-a="maillink" data-id="${u.id}">${u.mustChange ? 'Einladung erneut senden' : 'Link: neues Passwort'}</button><button class="btn g sm" data-a="reset" data-id="${u.id}">Einmal-Passwort</button>${u.id === ST.user.id ? '' : `<button class="btn g sm ${u.active ? 'danger' : ''}" data-a="active" data-id="${u.id}" data-v="${u.active ? 0 : 1}">${u.active ? 'Sperren' : 'Entsperren'}</button>`}</div></td></tr>`).join('')}
    </tbody></table></div>`;
}
const ACT = { login: 'Anmeldung', login_fehler: 'Anmeldung fehlgeschlagen', login_gesperrt: 'Anmeldung gesperrt (zu viele Versuche)', logout: 'Abmeldung', passwort_geaendert: 'Passwort geändert', benutzer_angelegt: 'Benutzer angelegt', rolle_geaendert: 'Rolle geändert', benutzer_gesperrt: 'Benutzer gesperrt', benutzer_aktiviert: 'Benutzer entsperrt', passwort_zurueckgesetzt: 'Passwort zurückgesetzt', eingerichtet: 'System eingerichtet', update: 'Update eingespielt', firmeneinstellungen: 'Firmen-Einstellungen für alle übernommen', kunde_zugewiesen: 'Kunde zugewiesen', kunde_geloescht: 'Kunde gelöscht', kunde_angelegt: 'Kunde angelegt', sicherung: 'Sicherung erstellt', sicherung_geladen: 'Sicherung heruntergeladen', sicherung_zurueck: 'Sicherung zurückgespielt', einladung_gesendet: 'Einladung per E-Mail gesendet', link_gesendet: 'Passwort-Link per E-Mail gesendet', passwort_vergessen: 'Passwort vergessen (Link angefordert)', passwort_per_link: 'Passwort per Link festgelegt', mail_einstellungen: 'E-Mail-Einstellungen geändert', stempel_aenderung: 'Stempeluhr: Änderung ans Handy geschickt', protokoll_geloescht: 'Protokoll gelöscht', urlaub_beantragt: 'Urlaub beantragt', urlaub_genehmigt: 'Urlaub genehmigt', urlaub_abgelehnt: 'Urlaub abgelehnt', stempel_ansprechpartner: 'Stempeluhr: Ansprechpartner geändert', angebot_geloescht: 'Angebot gelöscht' };
function viewAudit() {
  return `<section class="hero"><h1>Änderungen</h1><p class="muted">Die letzten 200 Vorgänge – wer hat wann was gemacht.</p></section>
    <div class="card"><table class="mt audit"><thead><tr><th>Zeit</th><th>Wer</th><th>Vorgang</th><th>Details</th><th class="hide-sm">IP</th></tr></thead><tbody>
    ${ST.audit.map(a => `<tr><td class="muted t">${new Date(a.at.replace(' ', 'T') + 'Z').toLocaleString('de-DE')}</td><td class="w">${esc(a.name || '–')}</td><td class="v">${esc(ACT[a.action] || a.action)}</td><td class="d">${esc(a.detail)}</td><td class="hide-sm muted">${esc(a.ip)}</td></tr>`).join('')}</tbody></table></div>`;
}

function viewSystem() {
  const y = ST.sys || {};
  return `<section class="hero"><h1>System</h1><p class="muted">LumbraDesk ${esc(y.version || '')} · PHP ${esc(y.php || '')}</p></section>
    <div class="card"><h2>Update einspielen</h2><p class="muted">Die Update-Datei (lumbradesk-update.zip) hier auswählen – sie wird direkt auf dem Server eingespielt. Zugangsdaten, Benutzer und Daten bleiben erhalten.</p>
      <form id="f-update" class="row" style="margin-top:12px"><input type="file" name="zip" accept=".zip,application/zip" required style="height:auto;padding:10px;max-width:420px;flex:1 1 220px"><button class="btn" type="submit">Update einspielen</button></form>
      ${y.zip === false ? '<p class="note err">Auf dem Server fehlt die ZIP-Unterstützung.</p>' : ''}<p class="muted" style="font-size:13px">Max. Dateigröße laut Server: ${esc(y.maxUpload || '–')}</p><div id="upd-msg"></div></div>
    ${backupCard()}
    ${mailCard()}`;
}
const mb = n => (n / 1048576 >= 1 ? (n / 1048576).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
const utc = s => new Date(String(s).replace(' ', 'T') + 'Z');
function backupCard() {
  const b = ST.bk || {}, st = b.status || {}, list = b.list || [], age = st.last ? (Date.now() - utc(st.last)) / 36e5 : 999;
  return `<div class="card sec"><h2>Datensicherung</h2><p class="muted">Jede Nacht eine komplette Sicherung (Benutzer, Kunden, Firmen-Einstellungen, Angebote, Fotos) – die letzten ${b.keep || 14} bleiben auf dem Server. Zugangsdaten sind nicht enthalten.</p>
    <p class="note ${age < 30 ? 'ok' : 'err'}">${st.last ? `Letzte Sicherung: <b>${utc(st.last).toLocaleString('de-DE')}</b> · ${mb(st.size || 0)} · ${st.files || 0} Dateien · ${esc(st.why || '')}` : 'Noch keine Sicherung vorhanden.'}${age >= 30 && st.last ? ' – älter als ein Tag, bitte Cronjob prüfen.' : ''}</p>
    <div class="row"><button class="btn" data-a="bk-now">Jetzt sichern</button></div>
    ${list.length ? `<div style="margin-top:14px"><table class="mt"><thead><tr><th>Sicherung</th><th>Größe</th><th></th></tr></thead><tbody>${list.map(x => `<tr><td>${utc(x.at).toLocaleString('de-DE')}</td><td class="muted">${mb(x.size)}</td><td><div class="row"><a class="btn s sm" href="api/?r=backup-dl&f=${encodeURIComponent(x.name)}">Herunterladen</a><button class="btn g sm danger" data-a="bk-restore" data-v="${esc(x.name)}">Zurückspielen</button></div></td></tr>`).join('')}</tbody></table></div>` : ''}
    <details style="margin-top:14px"><summary style="cursor:pointer;font-weight:600">Nächtliche Sicherung bei IONOS einrichten (einmalig)</summary>
      <ol style="font-size:14px;line-height:1.6;margin:10px 0 0;padding-left:20px"><li>mein.ionos.de → Hosting → <b>Cronjobs</b> → „Verwalten“ → <b>Cronjob anlegen</b>.</li><li>Typ <b>PHP-Skript</b>, PHP-Version: die höchste 8.x.</li><li>Skript: <b>/lumbradesk/private/cron-backup.php</b></li><li>Ausführung: <b>täglich</b>, z. B. um 3:00 Uhr → Speichern.</li></ol>
      <p class="muted" style="font-size:13px">Ohne Cronjob sichert LumbraDesk trotzdem einmal am Tag, sobald jemand die App öffnet.</p></details></div>`;
}
function mailCard() {
  const m = ST.mail || {};
  return `<div class="card sec"><h2>E-Mail</h2><p class="muted">Von dieser Adresse kommen Einladungen und „Passwort vergessen“. Daten aus IONOS → E-Mail → Postfach. Das Passwort wird nur auf dem Server gespeichert.</p>
    <form id="f-mail" class="form-grid"><label>Absender-Adresse<input name="from" type="email" required value="${esc(m.from || 'info@lumbradesk.de')}"></label><label>Absender-Name<input name="name" value="${esc(m.name || 'LumbraDesk')}"></label>
      <label>Postausgangsserver<input name="host" value="${esc(m.host || 'smtp.ionos.de')}"></label><label>Port<input name="port" inputmode="numeric" value="${esc(m.port || 587)}"></label>
      <label>Verschlüsselung<select name="enc">${[['tls', 'STARTTLS (Port 587)'], ['ssl', 'SSL (Port 465)']].map(([k, l]) => `<option value="${k}" ${m.enc === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label>Benutzername (meist die E-Mail-Adresse)<input name="user" value="${esc(m.user || m.from || 'info@lumbradesk.de')}" autocomplete="off"></label>
      <label>Postfach-Passwort ${m.hasPass ? '<span class="badge p">gespeichert</span>' : ''}<input name="pass" type="password" autocomplete="new-password" placeholder="${m.hasPass ? 'leer lassen = unverändert' : 'Passwort des Postfachs'}"></label>
      <div class="row" style="margin-top:12px"><button class="btn" type="submit">Speichern</button><button class="btn s" type="button" data-a="mailtest">Test-E-Mail an mich</button></div></form>
    <p class="muted" style="font-size:13px">Links in den E-Mails führen zu: ${esc(m.base || '')}</p></div>`;
}

/* ---------- Ablauf ---------- */
async function load() {
  const tok = new URLSearchParams(location.search).get('setpw');
  if (tok) { ST.token = tok; history.replaceState(null, '', location.pathname); try { const r = await fetch('api/?r=tokeninfo&t=' + encodeURIComponent(tok), { credentials: 'same-origin', cache: 'no-store' }); ST.tokenInfo = r.ok ? await r.json() : null; } catch (e) { ST.tokenInfo = null; } return void ($('#app').innerHTML = viewSetPw(ST.tokenInfo)); }
  try { const j = await api('me'); ST.user = j.user; ST.apps = j.apps || []; ST.roles = j.roles || {}; }
  catch (e) { $('#app').innerHTML = `<main class="auth"><div class="card">${brand('')}<p class="note err">${esc(e.message)}</p></div></main>`; return; }
  route();
}
async function route() {
  const seq = ST.seq = (ST.seq || 0) + 1;   // nur die neueste Navigation zeichnet (verhindert überschriebene Eingaben)
  const parts = (location.hash.replace(/^#\/?/, '') || 'home').split('/'); ST.view = parts[0]; const arg = decodeURIComponent(parts[1] || '');
  if (!ST.user) return void ($('#app').innerHTML = ST.view === 'vergessen' ? viewForgot() : viewLogin());
  if (ST.user.mustChange) return void ($('#app').innerHTML = viewNewPw());
  const crmViews = ['kunden', 'kunde', 'aufgaben', 'angebot'], admViews = ['users', 'audit', 'system', 'mehr'], offViews = ['protokolle', 'artikel'];
  if (!(ST.view === 'home' || (crmViews.includes(ST.view) && isCrm()) || (admViews.includes(ST.view) && ST.user.role === 'admin') || (offViews.includes(ST.view) && ['admin', 'buero'].includes(ST.user.role)))) ST.view = 'home';
  try {
    if (isCrm() && (crmViews.includes(ST.view) || ST.view === 'home')) await crmLoad(ST.view, arg);
    if (ST.view === 'protokolle' || ST.view === 'kunde') await protLoad(ST.view, arg);
    if (['kunde', 'angebot', 'artikel'].includes(ST.view)) await offLoad(ST.view);
    if (ST.view === 'users') ST.users = (await api('users')).users;
    if (ST.view === 'audit') ST.audit = (await api('audit')).entries;
    if (ST.view === 'system') { ST.sys = await api('system'); ST.mail = await api('mailcfg'); ST.bk = await api('backups'); }
  } catch (e) { if (e.status === 401) { ST.user = null; return route(); } toast(e.message); }
  if (seq !== ST.seq) return;
  const V = { users: viewUsers, audit: viewAudit, system: viewSystem, kunden: viewKunden, kunde: viewKunde, aufgaben: viewAufgaben, mehr: viewMehr, protokolle: viewProtokolle, angebot: viewAngebot, artikel: viewArtikel };
  $('#app').innerHTML = shell((V[ST.view] || viewHome)());
}
window.addEventListener('hashchange', route);

document.addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, d = Object.fromEntries(new FormData(f)), btn = f.querySelector('button[type=submit]'); if (btn) btn.disabled = true;
  try {
    if (f.id.startsWith('f-crm')) return await crmSubmit(f, d);
    if (f.id === 'f-login') { await api('login', d); return load(); }
    if (f.id === 'f-forgot') { await api('forgot', d); $('#app').innerHTML = viewForgot('Wenn die Adresse bei uns hinterlegt ist, kommt gleich eine E-Mail mit dem Link. Bitte auch im Spam-Ordner schauen.', true); return; }
    if (f.id === 'f-setpw') {
      if (d.new !== d.new2) { $('#app').innerHTML = viewSetPw(ST.tokenInfo, 'Die beiden Passwörter sind nicht gleich.'); return; }
      try { await api('setpw', { token: ST.token, password: d.new }); } catch (e2) { $('#app').innerHTML = viewSetPw(ST.tokenInfo, e2.message); return; }
      ST.token = null; $('#app').innerHTML = viewLogin(); $('#app [name=email]').value = ST.tokenInfo.email; $('#app [name=password]').focus(); toast('Passwort gespeichert – jetzt anmelden.'); return;
    }
    if (f.id === 'f-mail') {
      d.port = +d.port || 587; await api('mailcfg', d); ST.mail = await api('mailcfg'); route(); toast('E-Mail-Einstellungen gespeichert.'); return;
    }
    if (f.id === 'f-pw' || f.id === 'f-pw2') {
      if (d.new !== d.new2) throw new Error('Die beiden neuen Passwörter sind nicht gleich.');
      await api('password', { old: d.old, new: d.new }); toast('Passwort gespeichert.'); f.reset(); return load();
    }
    if (f.id === 'f-update') {
      const fd = new FormData(f); let res;
      try { res = await fetch('api/?r=system-update', { method: 'POST', credentials: 'same-origin', headers: { 'X-Lumbra': '1' }, body: fd }); } catch (e2) { throw new Error('Verbindung beim Hochladen abgebrochen – bitte WLAN prüfen und erneut versuchen.'); }
      const j = await res.json().catch(() => ({})); if (!res.ok) throw new Error(j.error || 'Fehler ' + res.status);
      $('#upd-msg').innerHTML = `<p class="note ok">Update eingespielt (${j.files} Dateien). Bitte die Seite neu laden.</p>`; f.reset(); return;
    }
    if (f.id === 'f-user') {
      const j = await api('users', { ...d, invite: !!d.invite }); f.reset(); ST.users = (await api('users')).users; await route();
      if (j.invited) { const el = $('#tmp'); if (el) el.innerHTML = `<p class="note ok" style="margin-top:14px"><b>Einladung an ${esc(d.email)} gesendet.</b><br>${esc(d.name)} bekommt eine E-Mail mit dem Link zum Passwort festlegen (3 Tage gültig).</p>`; }
      else { showTemp(d.name, d.email, j.tempPassword); if (j.mailError) toast('E-Mail nicht gesendet: ' + j.mailError); }
    }
  } catch (err) {
    if (f.id === 'f-login') $('#app').innerHTML = viewLogin(err.message);
    else if (f.id === 'f-pw') $('#app').innerHTML = viewNewPw(err.message);
    else toast(err.message);
  } finally { if (btn && document.body.contains(btn)) btn.disabled = false; }
});
function showTemp(name, email, pw) {
  const el = $('#tmp'); if (!el) return;
  el.innerHTML = `<div class="note ok" style="margin-top:14px"><b>Zugang für ${esc(name)}</b><br>Anmeldung: <b>${location.origin}${location.pathname}</b><br>E-Mail: ${esc(email)}<br>Einmal-Passwort: <span class="pw">${esc(pw)}</span><br><span style="font-size:13px">Nur jetzt sichtbar – bitte persönlich weitergeben. Beim ersten Anmelden wird ein eigenes Passwort festgelegt.</span></div>`;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a]'); if (!a) return;
  try {
    if (a.dataset.a.startsWith('crm-')) return await crmClick(a);
    if (a.dataset.a === 'logout') { await api('logout', {}); ST.user = null; location.hash = ''; return route(); }
    if (a.dataset.a === 'reset') {
      const u = ST.users.find(x => x.id === +a.dataset.id); if (!confirm(`Passwort von ${u.name} zurücksetzen? Es wird ein neues Einmal-Passwort erstellt.`)) return;
      const j = await api('user-update', { id: u.id, resetPassword: true }); ST.users = (await api('users')).users; await route(); showTemp(u.name, u.email, j.tempPassword);
    }
    if (a.dataset.a === 'maillink') {
      const u = ST.users.find(x => x.id === +a.dataset.id); if (!confirm(`${u.name} bekommt eine E-Mail an ${u.email} mit einem Link zum Passwort festlegen. Senden?`)) return;
      await api('user-update', { id: u.id, mailLink: true }); toast(`E-Mail an ${u.email} gesendet.`);
    }
    if (a.dataset.a === 'bk-now') { a.disabled = true; a.textContent = 'Sichert …'; const j = await api('backup-now', {}); toast(`Gesichert: ${mb(j.size)}, ${j.files} Dateien.`); ST.bk = await api('backups'); return route(); }
    if (a.dataset.a === 'bk-restore') {
      if (!confirm(`Sicherung ${a.dataset.v} zurückspielen?\n\nAlle Benutzer, Kunden und Firmen-Einstellungen werden auf diesen Stand gesetzt. Der aktuelle Stand wird vorher automatisch gesichert.`)) return;
      a.disabled = true; const j = await api('backup-restore', { name: a.dataset.v }); alert(`Zurückgespielt: ${j.rows} Einträge, ${j.files} Dateien.\nDer vorherige Stand liegt als ${j.before} in der Liste.`); return load();
    }
    if (a.dataset.a === 'mailtest') { const j = await api('mailtest', {}); toast(`Test-E-Mail an ${j.to} gesendet.`); }
    if (a.dataset.a === 'active') { await api('user-update', { id: +a.dataset.id, active: a.dataset.v === '1' }); await route(); toast(a.dataset.v === '1' ? 'Benutzer entsperrt.' : 'Benutzer gesperrt.'); }
  } catch (err) { toast(err.message); }
});
document.addEventListener('change', async e => {
  const s = e.target.closest('[data-role]'); if (!s) return;
  try { await api('user-update', { id: +s.dataset.role, role: s.value }); toast('Rolle geändert.'); await route(); } catch (err) { toast(err.message); route(); }
});
load();
