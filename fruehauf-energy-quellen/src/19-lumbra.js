/* =========================================================
   LumbraDesk: Firmen-Einstellungen für alle Geräte
   - Läuft nur, wenn die App unter LumbraDesk (…/rechner/) mit Login geöffnet ist.
   - Jedes Gerät lädt beim Öffnen automatisch den neuesten Firmenstand
     (Firmendaten, Design, Deckblatt, Förderung, Preise, Texte, Produkte inkl. Bilder).
   - Admins (Rolle in LumbraDesk) ändern wie gewohnt und tippen „Für alle übernehmen“.
   Persönliches (Ansicht hell/dunkel, eigenes Profil) und Kunden bleiben auf dem Gerät.
   ========================================================= */
const LD = { on: false, user: null, remote: null, applying: false, ready: false, busy: false };
const ldAdmin = () => LD.on && LD.user && LD.user.role === 'admin';
async function ldApi(r, opt = {}) {
  const res = await fetch('../api/?r=' + r, { credentials: 'same-origin', cache: 'no-store', ...opt, headers: { ...(opt.method === 'POST' ? { 'X-Lumbra': '1' } : {}), ...(opt.headers || {}) } });
  let j = null; if ((res.headers.get('content-type') || '').includes('json')) { try { j = await res.json(); } catch (e) {} }
  return { ok: res.ok, status: res.status, j, res };
}
/* alle Bilder der Firmen-Einstellungen (auch Belegungsbilder der Module und Startlogo) */
const _configFileIdsLD = configFileIds;
configFileIds = function () { return [...new Set(_configFileIdsLD().concat(PRODUCTS.map(p => p.planImg), [S.design.splash && S.design.splash.file]).filter(Boolean))]; };

/* ---------- Laden (alle Benutzer) ---------- */
async function ldPull(opts = {}) {
  if (!LD.on || LD.busy) return;
  let m; try { m = await ldApi('cfg-meta'); } catch (e) { return; }
  if (!m.ok || !m.j) { if (m.status === 401) LD.on = false; return; }
  LD.remote = m.j; const have = +PERSONAL.ldVer || 0;
  if (!m.j.version || (m.j.version <= have && !opts.force)) return ldBar();
  if (PERSONAL.ldDirty && ldAdmin() && !opts.force) return ldBar();   // eigene, noch nicht übernommene Änderungen nicht überschreiben
  LD.busy = true;
  try {
    const c = await ldApi('cfg'); if (!c.ok || !c.j || !c.j.settings) return;
    for (const id of c.j.files || []) {
      if (await DB.get('files', id)) continue;
      const r = await fetch('../api/?r=cfg-file&id=' + encodeURIComponent(id), { credentials: 'same-origin' }); if (!r.ok) continue;
      const blob = await r.blob(); await DB.put('files', { id, blob, type: blob.type, name: decodeURIComponent(r.headers.get('x-file-name') || '') });
    }
    LD.applying = true;
    const mode = S.design.mode;
    S = deepMerge(clone(DEFAULT_SETTINGS), c.j.settings); S.design.mode = mode;
    PRODUCTS = Array.isArray(c.j.products) ? c.j.products : PRODUCTS;
    await saveSettingsNow(); await saveProductsNow();
    PERSONAL.ldVer = c.j.version; PERSONAL.ldDirty = false; savePersonal();
    await loadFiles(configFileIds()); applyTheme(); render();
    if (have) toast(`Firmen-Einstellungen aktualisiert (Stand von ${c.j.by || 'Admin'}).`);
  } catch (e) { console.warn('LumbraDesk: Firmen-Einstellungen nicht geladen', e); }
  finally { LD.applying = false; LD.busy = false; ldBar(); }
}

/* ---------- Für alle übernehmen (nur Admins) ---------- */
async function ldPush(force = false) {
  if (!ldAdmin() || LD.busy) return;
  LD.busy = true; ldBar('Wird übernommen …');
  try {
    const ids = configFileIds(); await loadFiles(ids);
    const up = new Set(PERSONAL.ldUp || []);
    for (const id of ids) {
      if (up.has(id) || !FILES[id]) continue;
      const r = await ldApi('cfg-file', { method: 'POST', body: FILES[id].blob, headers: { 'Content-Type': FILES[id].type || 'application/octet-stream', 'X-File-Id': id, 'X-File-Name': encodeURIComponent(FILES[id].name || '') } });
      if (!r.ok) throw new Error((r.j && r.j.error) || 'Bild konnte nicht hochgeladen werden');
      up.add(id);
    }
    PERSONAL.ldUp = [...up].slice(-500);
    const settings = clone(S); delete settings.design.mode;
    const r = await ldApi('cfg', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings, products: PRODUCTS, files: ids.filter(id => FILES[id]), base: +PERSONAL.ldVer || 0, force }) });
    if (r.status === 409 && r.j && r.j.missing) { PERSONAL.ldUp = []; savePersonal(); LD.busy = false; return ldPush(force); }
    if (r.status === 409 && r.j && r.j.conflict) {
      LD.busy = false; ldBar();
      const ok = await confirmDlg('Neuerer Stand vorhanden', `${r.j.by || 'Jemand'} hat die Firmen-Einstellungen inzwischen geändert. Deinen Stand trotzdem für alle übernehmen? Die Änderungen von ${r.j.by || 'dort'} werden dann ersetzt.`, 'Meinen Stand übernehmen', true);
      return ok ? ldPush(true) : undefined;
    }
    if (!r.ok) throw new Error((r.j && r.j.error) || 'Fehler ' + r.status);
    PERSONAL.ldVer = r.j.version; PERSONAL.ldDirty = false; savePersonal();
    LD.remote = { version: r.j.version, by: LD.user.name, at: new Date().toISOString() };
    toast('Für alle übernommen – alle Geräte laden den neuen Stand beim nächsten Öffnen.');
  } catch (e) { toast('Übernehmen nicht möglich: ' + e.message, 'err'); }
  finally { LD.busy = false; ldBar(); }
}

/* ---------- Änderungen merken (nur Admin, nur in Einstellungen/Produkte) ---------- */
function ldMark() {
  if (!ldAdmin() || LD.applying || !LD.ready) return;
  if (!['einstellungen', 'produkte'].includes(UI.route) && !$('#modal [data-planimg]')) return;
  if (!PERSONAL.ldDirty) { PERSONAL.ldDirty = true; savePersonal(); }
  ldBar();
}
const _saveSettingsLD = saveSettings; saveSettings = function () { ldMark(); return _saveSettingsLD.apply(this, arguments); };
const _saveProductsLD = saveProducts; saveProducts = function () { ldMark(); return _saveProductsLD.apply(this, arguments); };

/* ---------- Hinweis unten rechts (nur Admins) ---------- */
function ldBar(busyText) {
  let el = document.getElementById('ld-bar');
  const R = LD.remote || {}, have = +PERSONAL.ldVer || 0, newer = R.version > have;
  let html = '';
  if (ldAdmin()) {
    if (busyText) html = `<b>${esc(busyText)}</b>`;
    else if (PERSONAL.ldDirty && newer) html = `<b>Neuerer Stand von ${esc(R.by || 'Admin')} vorhanden</b><span>Du hast hier auch geändert. Welcher Stand soll gelten?</span><div><button class="btn-p !h-9 !px-3 text-[13px]" data-a="ld-push">Meinen für alle</button><button class="btn-s !h-9 !px-3 text-[13px]" data-a="ld-pull">Neuesten laden</button></div>`;
    else if (PERSONAL.ldDirty) html = `<b>Nur auf diesem Gerät geändert</b><span>Firmen-Einstellungen oder Produkte – für alle übernehmen?</span><div><button class="btn-p !h-9 !px-3 text-[13px]" data-a="ld-push">Für alle übernehmen</button><button class="btn-g !h-9 !px-3 text-[13px]" data-a="ld-later">Später</button></div>`;
    else if (LD.remote && !R.version) html = `<b>Noch kein Firmenstand für alle</b><span>Deine Einstellungen und Produkte jetzt für alle Geräte hinterlegen?</span><div><button class="btn-p !h-9 !px-3 text-[13px]" data-a="ld-push">Jetzt für alle übernehmen</button><button class="btn-g !h-9 !px-3 text-[13px]" data-a="ld-later">Später</button></div>`;
  }
  if (!html || LD.hideUntil > Date.now()) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'ld-bar'; el.className = 'card'; el.style.cssText = 'position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:65;max-width:340px;padding:14px 16px;display:grid;gap:6px;font-size:13.5px;box-shadow:0 12px 40px rgba(0,0,0,.25)'; document.body.appendChild(el); }
  el.innerHTML = html.replace('<div>', '<div class="flex flex-wrap gap-2 mt-1">').replace(/<span>/, '<span class="text-ink3">');
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-a="ld-push"],[data-a="ld-pull"],[data-a="ld-later"]'); if (!a) return;
  if (a.dataset.a === 'ld-push') ldPush();
  if (a.dataset.a === 'ld-pull') ldPull({ force: true });
  if (a.dataset.a === 'ld-later') { LD.hideUntil = Date.now() + 30 * 60000; ldBar(); }
});

/* ---------- Einstellungen → Datensicherung: Stand anzeigen ---------- */
const _setDatenLD = SET.daten;
SET.daten = () => (LD.on ? sCard('refresh', 'Firmen-Einstellungen (LumbraDesk)', 'Design, Deckblatt, Förderung, Preise, Texte und Produkte kommen für alle Geräte vom Server.',
  `<div class="text-[14px]">${LD.remote && LD.remote.version ? `Stand <b>Version ${LD.remote.version}</b> von <b>${esc(LD.remote.by || 'Admin')}</b>${LD.remote.at ? ' · ' + new Date(String(LD.remote.at).replace(' ', 'T') + (String(LD.remote.at).includes('Z') ? '' : 'Z')).toLocaleString('de-DE') : ''}` : 'Noch kein Firmenstand auf dem Server.'}${PERSONAL.ldDirty ? ' · <span class="text-yel-ink">auf diesem Gerät geändert</span>' : ''}</div>
  <div class="flex flex-wrap gap-2 mt-3"><button class="btn-s" data-a="ld-pull">${ic('refresh', 16)}Neuesten Stand laden</button>${ldAdmin() ? `<button class="btn-p" data-a="ld-push">${ic('upload', 16)}Für alle übernehmen</button>` : ''}</div>
  <p class="hint">${ldAdmin() ? 'Als Admin änderst du wie gewohnt in den Einstellungen und unter Produkte – danach „Für alle übernehmen“.' : 'Änderungen am Firmenstand machen Admins. Dein Gerät lädt den neuesten Stand automatisch.'}</p>`) : '') + _setDatenLD();

/* ---------- Start ---------- */
async function ldInit() {
  if (!/\/rechner\//.test(location.pathname)) return;
  try { const r = await ldApi('me'); if (!r.ok || !r.j || !r.j.user) return; LD.on = true; LD.user = r.j.user; LD.features = r.j.features || {}; } catch (e) { return; }
  await ldPull();
  LD.ready = true; ldBar();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ldPull(); });
}
/* erst starten, wenn die App geladen ist (Startbildschirm fertig) */
function ldStart() { let done = false; try { done = SPLASH.done; } catch (e) {} if (!done) return setTimeout(ldStart, 400); setTimeout(ldInit, 300); }
setTimeout(ldStart, 0);
