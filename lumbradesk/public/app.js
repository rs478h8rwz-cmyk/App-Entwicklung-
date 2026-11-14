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
  if (typeof loadStart === 'function') loadStart(); let res;
  try { res = await fetch('api/?r=' + encodeURIComponent(act) + (qs.length ? '&' + qs.join('&') : ''), opt); } finally { if (typeof loadEnd === 'function') loadEnd(); }
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
  const base = [['home', 'Start']].concat(crm ? [['kunden', 'Kunden'], ['aufgaben', 'Aufgaben']] : [], [['plantafel', 'Plan']]).concat(off ? [['protokolle', 'Protokolle']] : []);
  const prod = (off && (ST.features || {}).angebote ? [['produkte', 'Produkte']] : []).concat(off && (ST.features || {}).rechnungen ? [['rechnungen', 'Rechnungen']] : []);   // Produktdatenbank fürs Angebot
  const nav = base.concat(prod, adm ? [['users', 'Benutzer'], ['audit', 'Änderungen'], ['system', 'System']] : []);
  const tabs = (adm ? base.filter(x => x[0] !== 'protokolle') : base.concat(prod)).concat(adm ? [['mehr', 'Mehr']] : []);
  const cur = ST.view === 'kunde' || ST.view === 'angebot' ? 'kunden' : ST.view === 'artikel' || ST.view === 'belege' || ST.view === 'assistent' || ST.view === 'vorlagen' || (adm && (ST.view === 'produkte' || ST.view === 'rechnungen')) ? 'mehr' : ST.view === 'rechnung' ? 'rechnungen' : ST.view, inMehr = ['users', 'audit', 'system', 'mehr'].includes(ST.view) || (adm && ST.view === 'protokolle');
  const link = ([k, l]) => `<a href="#/${k}" class="navl ${cur === k || (k === 'mehr' && inMehr) ? 'on' : ''}">${ic(k, 22)}<span>${l}</span></a>`;
  return `<header class="top"><div class="in">${brand(ST.user.name + ' · ' + ST.user.roleName)}
    ${nav.length > 1 ? `<nav class="side">${nav.map(link).join('')}</nav>` : '<span style="margin-left:auto"></span>'}${nfBell(20)}<button class="btn g sm out" data-a="logout" title="Abmelden" aria-label="Abmelden">${ic('out', 20)}<span class="hide-sm">Abmelden</span></button></div></header>
    ${sideBar(cur, inMehr, crm, off, adm)}
    <main class="wrap ${tabs.length > 1 ? 'has-tabs' : ''}">${inner}</main>${tabs.length > 1 ? `<nav class="tabs">${tabs.map(link).join('')}</nav>` : ''}`;
}
/* ---------- PC-Ansicht: Seitenleiste mit Suche, Bereichen, Apps und Konto (ab 1100 px, siehe app.css) ---------- */
const isDesk = () => window.matchMedia('(min-width: 1100px)').matches;
function sideBar(cur, inMehr, crm, off, adm) {
  const F = ST.features || {}, item = (k, l, icn, href) => `<a href="${href || '#/' + k}" class="sbl ${cur === k || (k === 'mehr' && inMehr) ? 'on' : ''}">${ic(icn || k, 18)}<span>${l}</span></a>`;
  const grp = (t, l) => l.length ? `<div class="sbg"><div class="sbt">${t}</div>${l.join('')}</div>` : '';
  const ini = esc(ST.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase());
  const apps = (ST.apps || []).filter(a => a.url);
  return `<aside class="sb"><a class="sb-brand" href="#/home"><span class="wm" role="img" aria-label="lumbra.desk"></span></a>
    ${crm ? `<form class="sb-q" id="sb-q">${ic('search', 16)}<input name="q" type="search" placeholder="Kunde suchen …" autocomplete="off" value="${esc(typeof CR === 'object' && cur === 'kunden' ? CR.q || '' : '')}"></form>` : ''}
    <nav class="sbn">
      ${grp('Übersicht', [item('home', 'Dashboard'), ...(crm ? [item('kunden', 'Kunden'), item('aufgaben', 'Aufgaben')] : []), item('plantafel', 'Plantafel')])}
      ${grp('Vertrieb & Büro', off ? [item('protokolle', 'Protokolle'), ...(F.angebote ? [item('produkte', 'Produkte', 'produkte'), item('artikel', 'Leistungen & Pakete', 'box'), item('assistent', 'Angebots-Assistent', 'box')] : []), ...(F.rechnungen ? [item('rechnungen', 'Rechnungen', 'offer')] : []), ...(F.angebote ? [item('belege', 'Nummern & Texte', 'offer')] : []), item('vorlagen', 'E-Mail-Vorlagen', 'mail')] : [])}
      ${grp('Verwaltung', adm ? [item('users', 'Benutzer'), item('audit', 'Änderungen'), item('system', 'System')] : [])}
      ${apps.length ? `<div class="sbg"><div class="sbt">Apps</div>${apps.map(a => `<a class="sbl sba" href="${esc(a.url)}">${typeof appIcon === 'function' ? appIcon(a.key) : ''}<span>${esc(a.name)}</span></a>`).join('')}</div>` : ''}
    </nav>
    <div class="sb-me"><span class="av">${ini}</span><span class="sb-who"><b>${esc(ST.user.name)}</b><span>${esc(ST.user.roleName)}</span></span>${nfBell(18)}<button class="btn g sm" data-a="logout" title="Abmelden" aria-label="Abmelden">${ic('out', 18)}</button></div></aside>`;
}
document.addEventListener('submit', e => {
  if (e.target.id !== 'sb-q') return; e.preventDefault();
  const q = e.target.q.value.trim(); if (typeof CR === 'object') CR.q = q;
  if (ST.view === 'kunden') route(); else location.hash = '#/kunden';
});
/* Beim Wechsel zwischen Handy- und PC-Breite neu zeichnen (Dashboard und Listen haben eigene PC-Ansichten) */
{ let wasDesk = isDesk(); window.addEventListener('resize', () => { const d = isDesk(); if (d !== wasDesk && ST.user && ['home', 'kunden'].includes(ST.view)) route(); wasDesk = d; }); }
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
const ACT = { login: 'Anmeldung', login_fehler: 'Anmeldung fehlgeschlagen', login_gesperrt: 'Anmeldung gesperrt (zu viele Versuche)', logout: 'Abmeldung', passwort_geaendert: 'Passwort geändert', benutzer_angelegt: 'Benutzer angelegt', rolle_geaendert: 'Rolle geändert', benutzer_gesperrt: 'Benutzer gesperrt', benutzer_aktiviert: 'Benutzer entsperrt', passwort_zurueckgesetzt: 'Passwort zurückgesetzt', eingerichtet: 'System eingerichtet', update: 'Update eingespielt', firmeneinstellungen: 'Firmen-Einstellungen für alle übernommen', kunde_zugewiesen: 'Kunde zugewiesen', kunde_geloescht: 'Kunde gelöscht', kunde_angelegt: 'Kunde angelegt', sicherung: 'Sicherung erstellt', sicherung_geladen: 'Sicherung heruntergeladen', sicherung_zurueck: 'Sicherung zurückgespielt', einladung_gesendet: 'Einladung per E-Mail gesendet', link_gesendet: 'Passwort-Link per E-Mail gesendet', passwort_vergessen: 'Passwort vergessen (Link angefordert)', passwort_per_link: 'Passwort per Link festgelegt', mail_einstellungen: 'E-Mail-Einstellungen geändert', stempel_aenderung: 'Stempeluhr: Änderung ans Handy geschickt', protokoll_geloescht: 'Protokoll gelöscht', urlaub_beantragt: 'Urlaub beantragt', urlaub_genehmigt: 'Urlaub genehmigt', urlaub_abgelehnt: 'Urlaub abgelehnt', stempel_ansprechpartner: 'Stempeluhr: Ansprechpartner geändert', angebot_geloescht: 'Angebot gelöscht', angebot_produkte: 'Produktdatenbank (Angebote)', funktion_freigabe: 'Funktion freigeschaltet/gesperrt' };
function viewAudit() {
  return `<section class="hero"><h1>Änderungen</h1><p class="muted">Die letzten 200 Vorgänge – wer hat wann was gemacht.</p></section>
    <div class="card"><table class="mt audit"><thead><tr><th>Zeit</th><th>Wer</th><th>Vorgang</th><th>Details</th><th class="hide-sm">IP</th></tr></thead><tbody>
    ${ST.audit.map(a => `<tr><td class="muted t">${new Date(a.at.replace(' ', 'T') + 'Z').toLocaleString('de-DE')}</td><td class="w">${esc(a.name || '–')}</td><td class="v">${esc(ACT[a.action] || a.action)}</td><td class="d">${esc(a.detail)}</td><td class="hide-sm muted">${esc(a.ip)}</td></tr>`).join('')}</tbody></table></div>`;
}

function viewSystem() {
  const y = ST.sys || {};
  return `<section class="hero"><h1>System</h1><p class="muted">LumbraDesk ${esc(y.version || '')} · PHP ${esc(y.php || '')}</p></section>
    ${featureCard().replace('card sec', 'card')}
    <div class="card sec"><h2>KI-Bildanalyse</h2><p class="muted">Für den Zählerschrank-Check: Die Fotos werden zur Auswertung an Claude (Anthropic) geschickt. Dafür wird ein API-Schlüssel von console.anthropic.com gebraucht – er bleibt auf dem Server und wird nie angezeigt. Kosten je Check: wenige Cent.</p>
      <p style="margin:8px 0 0">${ST.ai && ST.ai.on ? `<span class="badge p">eingerichtet ${esc(ST.ai.hint)}</span>` : '<span class="badge">nicht eingerichtet – der Check funktioniert dann ohne KI (Fragen von Hand)</span>'}</p>
      <form id="f-ai" class="row" style="margin-top:10px" autocomplete="off"><input name="key" type="password" autocomplete="new-password" placeholder="sk-ant-…" style="max-width:420px;flex:1 1 220px"><button class="btn" type="submit">Speichern</button>${ST.ai && ST.ai.on ? '<button class="btn g danger" type="button" data-a="ai-off">Entfernen</button>' : ''}</form></div>
    <div class="card sec"><h2>Update einspielen</h2><p class="muted">Die Update-Datei (lumbradesk-update.zip) hier auswählen – sie wird direkt auf dem Server eingespielt. Zugangsdaten, Benutzer und Daten bleiben erhalten.</p>
      <form id="f-update" class="row" style="margin-top:12px"><input type="file" name="zip" accept=".zip,application/zip" required style="height:auto;padding:10px;max-width:420px;flex:1 1 220px"><button class="btn" type="submit">Update einspielen</button></form>
      ${y.zip === false ? '<p class="note err">Auf dem Server fehlt die ZIP-Unterstützung.</p>' : ''}<p class="muted" style="font-size:13px">Max. Dateigröße laut Server: ${esc(y.maxUpload || '–')}</p><div id="upd-msg"></div></div>
    ${backupCard()}
    ${mailCard()}`;
}
const mb = n => (n / 1048576 >= 1 ? (n / 1048576).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
const utc = s => new Date(String(s).replace(' ', 'T') + 'Z');
/* Neue Funktionen für alle freischalten */
function featureCard() {
  const l = ST.feat || []; if (!l.length) return '';
  return `<div class="card sec"><h2>Funktionen freischalten</h2><p class="muted">Neue Funktionen siehst zuerst nur du als Admin – zum Testen. Erst mit dem Haken sind sie für alle frei.</p>
    <div class="glist" style="margin-top:12px">${l.map(f => `<label class="grow" style="cursor:pointer"><span class="gmain"><b>${esc(f.name)}</b><span style="white-space:normal">${esc(f.text)}</span></span><span class="sw2"><input type="checkbox" data-feat="${esc(f.key)}" ${f.on ? 'checked' : ''}><i></i></span></label>`).join('')}</div></div>`;
}
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
  /* Start: 5 Sekunden – erst die Wärmepumpe, nach genau 2,5 s der Stromspeicher, den das PV-Modul lädt.
     Angemeldet bleibt man über „angemeldet bleiben“ (Server, 180 Tage) */
  const t0 = Date.now(); LOADER.boot = true; loaderShow('lumbra.desk startet …'); const lb = document.getElementById('ld-loader'); if (lb) lb.classList.add('boot');
  setTimeout(() => { if (typeof loaderScene2 === 'function') loaderScene2(); }, 2500);
  const bootEnd = () => { LOADER.boot = false; loaderHide(); };
  try { const j = await api('me'); ST.user = j.user; ST.apps = j.apps || []; ST.roles = j.roles || {}; ST.features = j.features || {}; ST.unread = j.unread || 0; }
  catch (e) { bootEnd(); $('#app').innerHTML = `<main class="auth"><div class="card">${brand('')}<p class="note err">${esc(e.message)}</p></div></main>`; return; }
  if (!ST.user) { bootEnd(); return route().catch(e => ldBootFail(e)); }
  await route().catch(e => ldBootFail(e));
  setTimeout(bootEnd, Math.max(0, 5000 - (Date.now() - t0)));
}
/* Start hängt? Statt endloser Ladeanzeige eine Meldung mit „Neu laden“ */
function ldBootFail(e) { if (typeof LOADER === "object" && LOADER.boot) { LOADER.boot = false; loaderHide(); } const a = $("#app"); if (a && /wird geladen/.test(a.textContent)) a.innerHTML = `<main class="auth"><div class="card">${brand('')}<p class="note err">LumbraDesk konnte nicht gestartet werden${e && e.message ? ': ' + esc(e.message) : ''}.</p><button class="btn" onclick="location.reload()">Neu laden</button></div></main>`; }
window.addEventListener('error', e => ldBootFail(e.error || { message: e.message }));
setTimeout(() => ldBootFail({ message: 'Zeitüberschreitung – bitte neu laden' }), 20000);
async function route() {
  const seq = ST.seq = (ST.seq || 0) + 1;   // nur die neueste Navigation zeichnet (verhindert überschriebene Eingaben)
  const parts = (location.hash.replace(/^#\/?/, '') || 'home').split('/'); ST.view = parts[0]; const arg = decodeURIComponent(parts[1] || '');
  if (!ST.user) return void ($('#app').innerHTML = ST.view === 'vergessen' ? viewForgot() : viewLogin());
  if (ST.user.mustChange) return void ($('#app').innerHTML = viewNewPw());
  const crmViews = ['kunden', 'kunde', 'aufgaben', 'angebot'], allViews = ['home', 'plantafel', 'zaehler'], admViews = ['users', 'audit', 'system', 'mehr'], offViews = ['protokolle', 'artikel', 'produkte', 'rechnungen', 'rechnung', 'belege', 'assistent', 'vorlagen'];
  if (!(allViews.includes(ST.view) || (crmViews.includes(ST.view) && isCrm()) || (admViews.includes(ST.view) && ST.user.role === 'admin') || (offViews.includes(ST.view) && ['admin', 'buero'].includes(ST.user.role)))) ST.view = 'home';
  try {
    if (isCrm() && (crmViews.includes(ST.view) || ST.view === 'home')) await crmLoad(ST.view, arg);
    if (ST.view === 'protokolle' || ST.view === 'kunde') await protLoad(ST.view, arg);
    if (['kunde', 'angebot', 'artikel', 'produkte', 'assistent'].includes(ST.view)) await offLoad(ST.view === 'assistent' ? 'artikel' : ST.view);
    if (typeof reLoad === 'function' && ['kunde', 'rechnungen', 'rechnung', 'belege'].includes(ST.view)) await reLoad(ST.view, arg);
    if (ST.view === 'plantafel' && typeof planLoad === 'function') await planLoad();
    if (ST.view === 'zaehler' && typeof zsLoad === 'function') await zsLoad(arg);
    if (ST.view === 'vorlagen' && typeof mvLoad === 'function') await mvLoad();
    if (ST.view === 'users') ST.users = (await api('users')).users;
    if (ST.view === 'audit') ST.audit = (await api('audit')).entries;
    if (ST.view === 'system') { ST.ai = await api('ai-cfg').catch(() => null); ST.sys = await api('system'); ST.mail = await api('mailcfg'); ST.bk = await api('backups'); ST.feat = (await api('features')).list; }
  } catch (e) { if (e.status === 401) { ST.user = null; return route(); } toast(e.message); }
  if (seq !== ST.seq) return;
  const V = { users: viewUsers, audit: viewAudit, system: viewSystem, kunden: viewKunden, kunde: viewKunde, aufgaben: viewAufgaben, mehr: viewMehr, protokolle: viewProtokolle, angebot: viewAngebot, artikel: viewArtikel, produkte: viewProdukte, rechnungen: viewRechnungen, rechnung: viewRechnung, belege: viewBelege, assistent: viewAssistent, plantafel: typeof viewPlan === 'function' ? viewPlan : viewHome, zaehler: typeof viewZaehler === 'function' ? viewZaehler : viewHome, vorlagen: typeof viewVorlagen === 'function' ? viewVorlagen : viewHome };
  $('#app').innerHTML = shell((V[ST.view] || viewHome)());
}
window.addEventListener('hashchange', route);
/* Rücksprung: zur vorherigen Ansicht innerhalb von lumbra.desk, sonst zur Ersatzseite */
window.addEventListener('hashchange', () => { ST.navs = (ST.navs || 0) + 1; });
function ldBack(fb) { if (ST.navs > 0) history.back(); else location.hash = fb; }
/* PDF teilen bzw. speichern – true, wenn es geklappt hat (Abbrechen → false) */
async function ldShare(blob, name, type) {
  const file = new File([blob], name, { type: type || 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return true; } catch (e) { if (e.name === 'AbortError') return false; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); return true;
}

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
/* PDF beim Kunden ablegen (Checkliste: ersetzt die vorige PDF derselben Art) – läuft im Hintergrund */
const blobB64 = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(new Error('Datei nicht lesbar')); r.readAsDataURL(b); });
async function ldAttach(pid, blob, name, tag) {
  if (!pid || !blob || blob.size > 15 * 1024 * 1024) return false;
  try { await api('crm-file-up', { project: pid, name, type: 'application/pdf', tag, data: await blobB64(blob) }); return true; } catch (e) { console.warn('PDF ablegen', e); return false; }
}
/* ---------- Benachrichtigungen (Glocke): Markierungen im Logbuch usw. ---------- */
const nfBell = n => `<button class="btn g sm nf-bell" data-a="nf-open" title="Benachrichtigungen" aria-label="Benachrichtigungen">${ic('bell', n)}<i class="nf-n" ${ST.unread ? '' : 'hidden'}>${ST.unread > 9 ? '9+' : ST.unread || ''}</i></button>`;
function nfBadge() { document.querySelectorAll('.nf-n').forEach(el => { el.hidden = !ST.unread; el.textContent = ST.unread > 9 ? '9+' : ST.unread || ''; }); }
function nfAgo(at) { const m = Math.round((Date.now() - utc(at).getTime()) / 60000); return m < 1 ? 'gerade eben' : m < 60 ? `vor ${m} Min.` : m < 1440 ? `vor ${Math.round(m / 60)} Std.` : utc(at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
async function nfOpen() {
  document.getElementById('nf-pan')?.remove();
  const o = document.createElement('div'); o.id = 'nf-pan'; o.innerHTML = `<div class="nf-box"><div class="nf-h"><b>Benachrichtigungen</b><button class="btn g sm" data-a="nf-all">Alle gelesen</button><button class="xbtn" data-a="nf-x" aria-label="Schließen">${ic('x', 16)}</button></div><div class="nf-l"><p class="muted small" style="padding:16px">Lädt …</p></div></div>`;
  document.body.appendChild(o);
  o.addEventListener('click', e => { if (e.target === o) o.remove(); });
  try { const j = await api('notifs'); ST.unread = j.unread; nfBadge(); nfDraw(j.list); } catch (err) { o.querySelector('.nf-l').innerHTML = `<p class="note err">${esc(err.message)}</p>`; }
}
function nfDraw(L) {
  const box = document.querySelector('#nf-pan .nf-l'); if (!box) return;
  box.innerHTML = L.length ? L.map(n => `<a class="nf-i ${n.read ? '' : 'new'}" href="${esc(n.url || '#/home')}" data-a="nf-go" data-id="${n.id}"><span class="nf-d"></span><span class="nf-t"><b>${esc(n.title)}</b><span>${esc(n.text)}</span><span class="muted small">${nfAgo(n.at)}</span></span></a>`).join('')
    : '<p class="muted small" style="padding:16px 18px">Noch keine Benachrichtigungen. Wenn dich ein Kollege im Logbuch markiert, erscheint es hier – und du bekommst eine E-Mail.</p>';
}
setInterval(async () => { if (!ST.user || document.hidden) return; try { const j = await api('notifs'); if (j.unread > (ST.unread || 0)) toast(j.list.find(x => !x.read)?.title || 'Neue Benachrichtigung'); ST.unread = j.unread; nfBadge(); } catch (e) {} }, 60000);
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a^="nf-"]'); if (!a) return;
  const k = a.dataset.a;
  if (k === 'nf-open') { e.preventDefault(); return nfOpen(); }
  if (k === 'nf-x') return document.getElementById('nf-pan')?.remove();
  if (k === 'nf-all') { const j = await api('notifs-read', { id: 0 }).catch(() => null); if (j) { ST.unread = j.unread; nfBadge(); nfDraw(j.list); } return; }
  if (k === 'nf-go') { document.getElementById('nf-pan')?.remove(); api('notifs-read', { id: +a.dataset.id }).then(j => { ST.unread = j.unread; nfBadge(); }).catch(() => {}); }
});
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a]'); if (!a) return;
  if (a.dataset.a.startsWith('nf-')) return;
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
  const fe = e.target.closest && e.target.closest('[data-feat]');
  if (fe) { try { await api('features', { key: fe.dataset.feat, on: fe.checked }); toast(fe.checked ? 'Für alle freigeschaltet.' : 'Für alle gesperrt – nur Admins sehen die Funktion.'); } catch (err) { toast(err.message); fe.checked = !fe.checked; } return; }
  const s = e.target.closest('[data-role]'); if (!s) return;
  try { await api('user-update', { id: +s.dataset.role, role: s.value }); toast('Rolle geändert.'); await route(); } catch (err) { toast(err.message); route(); }
});
load();
