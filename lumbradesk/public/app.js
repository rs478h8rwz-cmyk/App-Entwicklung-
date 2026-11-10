/* LumbraDesk – Anmeldung, Startseite mit den Apps, Benutzerverwaltung (Admin) */
'use strict';
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const IC = {
  calc: '<path d="M4 3h16v18H4z"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h2M12 18h4"/>',
  abnahme: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
  stempel: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[n] || ''}</svg>`;
const ST = { user: null, apps: [], roles: {}, view: 'home', users: [], audit: [] };

async function api(r, data) {
  const opt = data === undefined ? { credentials: 'same-origin' } : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Lumbra': '1' }, body: JSON.stringify(data) };
  const res = await fetch('api/?r=' + encodeURIComponent(r), opt);
  let j = {}; try { j = await res.json(); } catch (e) {}
  if (!res.ok) { const err = new Error(j.error || 'Fehler ' + res.status); err.status = res.status; throw err; }
  return j;
}
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3200); }
const brand = sub => `<div class="brand"><img src="logo.png" alt=""><div><b>LumbraDesk</b><span>${esc(sub)}</span></div></div>`;

/* ---------- Ansichten ---------- */
function viewLogin(err = '') {
  return `<main class="auth"><div class="card">${brand('Frühauf Solar')}
    <h2 style="margin-top:22px">Anmelden</h2>${err ? `<p class="note err">${esc(err)}</p>` : ''}
    <form id="f-login"><label>E-Mail<input name="email" type="email" autocomplete="username" required autofocus></label>
    <label>Passwort<input name="password" type="password" autocomplete="current-password" required></label>
    <button class="btn" type="submit">Anmelden</button></form>
    <p style="font-size:14px;margin-top:16px;text-align:center"><a href="#/vergessen">Passwort vergessen?</a></p></div></main>`;
}
function viewForgot(msg = '', ok = false) {
  return `<main class="auth"><div class="card">${brand('Frühauf Solar')}
    <h2 style="margin-top:22px">Passwort vergessen</h2><p class="muted">Gib deine E-Mail-Adresse ein. Du bekommst einen Link, mit dem du ein neues Passwort festlegst.</p>${msg ? `<p class="note ${ok ? 'ok' : 'err'}">${esc(msg)}</p>` : ''}
    ${ok ? '' : `<form id="f-forgot"><label>E-Mail<input name="email" type="email" autocomplete="username" required autofocus></label><button class="btn" type="submit">Link senden</button></form>`}
    <p style="font-size:14px;margin-top:16px;text-align:center"><a href="#/">Zurück zur Anmeldung</a></p></div></main>`;
}
function viewSetPw(info, err = '') {
  if (!info) return `<main class="auth"><div class="card">${brand('Frühauf Solar')}<p class="note err">${esc(err || 'Der Link ist abgelaufen oder wurde schon benutzt.')}</p><p class="muted">Über „Passwort vergessen?“ kannst du einen neuen Link anfordern.</p><a class="btn" href="./#/vergessen" style="width:100%">Neuen Link anfordern</a></div></main>`;
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
  const nav = [['home', 'Start']].concat(ST.user.role === 'admin' ? [['users', 'Benutzer'], ['audit', 'Protokoll'], ['system', 'System']] : []);
  return `<header class="top"><div class="in">${brand(ST.user.name + ' · ' + ST.user.roleName)}
    <nav>${nav.map(([k, l]) => `<a href="#/${k}" class="navl ${ST.view === k ? 'on' : ''}">${l}</a>`).join('')}<button class="btn g sm" data-a="logout" title="Abmelden">${ic('out', 18)}<span class="hide-sm">Abmelden</span></button></nav></div></header>
    <main class="wrap">${inner}</main>`;
}
function viewHome() {
  const h = new Date().getHours(), gr = h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
  return `<section class="hero"><h1>${gr}, ${esc(ST.user.name.split(' ')[0])}.</h1><p class="muted">Deine Apps – gleiche Bedienung wie gewohnt.</p></section>
    <div class="grid">${ST.apps.map(a => `<a class="card tile ${a.url ? '' : 'off'}" href="${esc(a.url || '#')}"><div class="ic">${ic(a.key)}</div><b>${esc(a.name)}</b><span class="muted">${esc(a.text)}</span>${a.url ? '' : '<div style="margin-top:8px"><span class="badge">folgt</span></div>'}</a>`).join('') || '<p class="muted">Für deine Rolle sind noch keine Apps freigeschaltet.</p>'}</div>
    <div class="sec card"><h2>Mein Konto</h2><p class="muted">${esc(ST.user.email)} · ${esc(ST.user.roleName)}</p>
      <form id="f-pw2" class="form-grid"><label>Bisheriges Passwort<input name="old" type="password" autocomplete="current-password" required></label><label>Neues Passwort<input name="new" type="password" autocomplete="new-password" required></label><label>Wiederholen<input name="new2" type="password" autocomplete="new-password" required></label><div><button class="btn s" type="submit" style="margin-top:12px">Passwort ändern</button></div></form></div>`;
}
function roleSel(name, cur) { return `<select name="${name}">${Object.entries(ST.roles).map(([k, l]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`; }
function viewUsers() {
  return `<section class="hero"><h1>Benutzer</h1><p class="muted">Neue Mitarbeiter anlegen, Rollen vergeben, Zugänge sperren oder Passwörter zurücksetzen.</p></section>
    <div class="card"><h2>Neuer Benutzer</h2><form id="f-user" class="form-grid"><label>Name<input name="name" required></label><label>E-Mail<input name="email" type="email" required></label><label>Rolle${roleSel('role', 'monteur')}</label><div><button class="btn" type="submit" style="margin-top:12px">Anlegen</button></div>
      <label style="grid-column:1/-1;display:flex;align-items:center;gap:8px;font-size:14px"><input type="checkbox" name="invite" value="1" checked style="width:auto;height:auto;margin:0">Einladung per E-Mail senden (Link zum Passwort festlegen)</label></form>
      <p class="muted" style="font-size:13px">Admin: alles inkl. Benutzer · Büro: alle Kunden und Mitarbeiterdaten · Vertrieb: Berechnungen und eigene Kunden · Monteur: Stempeluhr, Abnahme, Service.</p><div id="tmp"></div></div>
    <div class="card sec scroll"><table><thead><tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th class="hide-sm">Zuletzt angemeldet</th><th></th></tr></thead><tbody>
    ${ST.users.map(u => `<tr><td><b>${esc(u.name)}</b>${u.active ? '' : ' <span class="badge r">gesperrt</span>'}${u.mustChange ? ' <span class="badge">Erst-Anmeldung offen</span>' : ''}</td><td>${esc(u.email)}</td>
      <td><select data-role="${u.id}" ${u.id === ST.user.id ? 'disabled' : ''}>${Object.entries(ST.roles).map(([k, l]) => `<option value="${k}" ${k === u.role ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></td>
      <td class="hide-sm muted">${u.lastLogin ? new Date(u.lastLogin.replace(' ', 'T') + 'Z').toLocaleString('de-DE') : '–'}</td>
      <td><div class="row"><button class="btn s sm" data-a="maillink" data-id="${u.id}">${u.mustChange ? 'Einladung erneut senden' : 'Link: neues Passwort'}</button><button class="btn g sm" data-a="reset" data-id="${u.id}">Einmal-Passwort</button>${u.id === ST.user.id ? '' : `<button class="btn g sm ${u.active ? 'danger' : ''}" data-a="active" data-id="${u.id}" data-v="${u.active ? 0 : 1}">${u.active ? 'Sperren' : 'Entsperren'}</button>`}</div></td></tr>`).join('')}
    </tbody></table></div>`;
}
const ACT = { login: 'Anmeldung', login_fehler: 'Anmeldung fehlgeschlagen', login_gesperrt: 'Anmeldung gesperrt (zu viele Versuche)', logout: 'Abmeldung', passwort_geaendert: 'Passwort geändert', benutzer_angelegt: 'Benutzer angelegt', rolle_geaendert: 'Rolle geändert', benutzer_gesperrt: 'Benutzer gesperrt', benutzer_aktiviert: 'Benutzer entsperrt', passwort_zurueckgesetzt: 'Passwort zurückgesetzt', eingerichtet: 'System eingerichtet', update: 'Update eingespielt', firmeneinstellungen: 'Firmen-Einstellungen für alle übernommen', kunde_zugewiesen: 'Kunde zugewiesen', kunde_geloescht: 'Kunde gelöscht', kunde_angelegt: 'Kunde angelegt', einladung_gesendet: 'Einladung per E-Mail gesendet', link_gesendet: 'Passwort-Link per E-Mail gesendet', passwort_vergessen: 'Passwort vergessen (Link angefordert)', passwort_per_link: 'Passwort per Link festgelegt', mail_einstellungen: 'E-Mail-Einstellungen geändert' };
function viewAudit() {
  return `<section class="hero"><h1>Protokoll</h1><p class="muted">Die letzten 200 Vorgänge – wer hat wann was gemacht.</p></section>
    <div class="card scroll"><table><thead><tr><th>Zeit</th><th>Wer</th><th>Vorgang</th><th>Details</th><th class="hide-sm">IP</th></tr></thead><tbody>
    ${ST.audit.map(a => `<tr><td class="muted">${new Date(a.at.replace(' ', 'T') + 'Z').toLocaleString('de-DE')}</td><td>${esc(a.name || '–')}</td><td>${esc(ACT[a.action] || a.action)}</td><td>${esc(a.detail)}</td><td class="hide-sm muted">${esc(a.ip)}</td></tr>`).join('')}</tbody></table></div>`;
}

function viewSystem() {
  const y = ST.sys || {};
  return `<section class="hero"><h1>System</h1><p class="muted">LumbraDesk ${esc(y.version || '')} · PHP ${esc(y.php || '')}</p></section>
    <div class="card"><h2>Update einspielen</h2><p class="muted">Die Update-Datei (lumbradesk-update.zip) hier auswählen – sie wird direkt auf dem Server eingespielt. Zugangsdaten, Benutzer und Daten bleiben erhalten.</p>
      <form id="f-update" class="row" style="margin-top:12px"><input type="file" name="zip" accept=".zip,application/zip" required style="height:auto;padding:10px;max-width:420px"><button class="btn" type="submit">Update einspielen</button></form>
      ${y.zip === false ? '<p class="note err">Auf dem Server fehlt die ZIP-Unterstützung.</p>' : ''}<p class="muted" style="font-size:13px">Max. Dateigröße laut Server: ${esc(y.maxUpload || '–')}</p><div id="upd-msg"></div></div>
    ${mailCard()}`;
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
  ST.view = (location.hash.replace(/^#\/?/, '') || 'home').split('/')[0];
  if (!ST.user) return void ($('#app').innerHTML = ST.view === 'vergessen' ? viewForgot() : viewLogin());
  if (ST.user.mustChange) return void ($('#app').innerHTML = viewNewPw());
  if (ST.user.role !== 'admin' && ST.view !== 'home') ST.view = 'home';
  try {
    if (ST.view === 'users') ST.users = (await api('users')).users;
    if (ST.view === 'audit') ST.audit = (await api('audit')).entries;
    if (ST.view === 'system') { ST.sys = await api('system'); ST.mail = await api('mailcfg'); }
  } catch (e) { if (e.status === 401) { ST.user = null; return route(); } toast(e.message); }
  $('#app').innerHTML = shell(ST.view === 'users' ? viewUsers() : ST.view === 'audit' ? viewAudit() : ST.view === 'system' ? viewSystem() : viewHome());
}
window.addEventListener('hashchange', route);

document.addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, d = Object.fromEntries(new FormData(f)), btn = f.querySelector('button[type=submit]'); if (btn) btn.disabled = true;
  try {
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
      const fd = new FormData(f), res = await fetch('api/?r=system-update', { method: 'POST', credentials: 'same-origin', headers: { 'X-Lumbra': '1' }, body: fd });
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
    if (a.dataset.a === 'logout') { await api('logout', {}); ST.user = null; location.hash = ''; return route(); }
    if (a.dataset.a === 'reset') {
      const u = ST.users.find(x => x.id === +a.dataset.id); if (!confirm(`Passwort von ${u.name} zurücksetzen? Es wird ein neues Einmal-Passwort erstellt.`)) return;
      const j = await api('user-update', { id: u.id, resetPassword: true }); ST.users = (await api('users')).users; await route(); showTemp(u.name, u.email, j.tempPassword);
    }
    if (a.dataset.a === 'maillink') {
      const u = ST.users.find(x => x.id === +a.dataset.id); if (!confirm(`${u.name} bekommt eine E-Mail an ${u.email} mit einem Link zum Passwort festlegen. Senden?`)) return;
      await api('user-update', { id: u.id, mailLink: true }); toast(`E-Mail an ${u.email} gesendet.`);
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
